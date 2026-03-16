import { useState, useCallback, useRef } from 'react';
import { App } from 'antd';
import { EkoResult } from '@jarvis-agent/core';
import { MessageProcessor } from '@/utils/messageTransform';
import { Task, TaskMode } from '@/models';
import { uuidv4 } from '@/utils/uuid';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils/logger';

interface UseTaskExecutionOptions {
  isHistoryMode: boolean;
  isTaskDetailMode: boolean;
  scheduledTaskIdFromUrl?: string;
  taskMode: TaskMode;
  taskIdRef: React.RefObject<string>;
  executionIdRef: React.RefObject<string>;
  messageProcessorRef: React.RefObject<MessageProcessor>;
  createTask: (taskId: string, task: Partial<Task>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  updateMessages: (taskId: string, messages: any[]) => void;
  setCurrentTaskId: (taskId: string) => void;
  replaceTaskId: (oldId: string, newId: string) => void;
}

/**
 * Hook for handling task execution (sending messages, managing task lifecycle)
 */
export const useTaskExecution = ({
  isHistoryMode,
  isTaskDetailMode,
  scheduledTaskIdFromUrl,
  taskMode,
  taskIdRef,
  executionIdRef,
  messageProcessorRef,
  createTask,
  updateTask,
  updateMessages,
  setCurrentTaskId,
  replaceTaskId,
}: UseTaskExecutionOptions) => {
  const { t } = useTranslation('main');
  const { message } = App.useApp();
  const [ekoRequest, setEkoRequest] = useState<Promise<any> | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Use ref to always read latest taskMode inside callbacks
  const taskModeRef = useRef(taskMode);
  taskModeRef.current = taskMode;

  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    if (!text) {
      message.warning(t('enter_question'));
      return false;
    }

    if (isHistoryMode) {
      message.warning(t('history_readonly'));
      return false;
    }

    const newExecutionId = uuidv4();
    executionIdRef.current = newExecutionId;
    messageProcessorRef.current.setExecutionId(newExecutionId);

    const updatedMessages = messageProcessorRef.current.addUserMessage(text.trim());

    const currentMode = taskModeRef.current;

    // Create temporary task immediately to prevent blank screen
    if (!taskIdRef.current) {
      const tempTaskId = `temp-${newExecutionId}`;
      taskIdRef.current = tempTaskId;
      setCurrentTaskId(tempTaskId);

      createTask(tempTaskId, {
        name: 'Processing...',
        messages: updatedMessages,
        status: 'running',
        taskType: isTaskDetailMode ? 'scheduled' : 'normal',
        taskMode: currentMode,
        scheduledTaskId: isTaskDetailMode ? scheduledTaskIdFromUrl : undefined,
        startTime: new Date(),
      });
    } else {
      updateMessages(taskIdRef.current, updatedMessages);
      updateTask(taskIdRef.current, { status: 'running' });
    }

    if (ekoRequest) {
      if (currentMode === 'chat') {
        await window.api.ekoChatCancel(taskIdRef.current);
      } else {
        await window.api.ekoCancelTask(taskIdRef.current);
      }
      await ekoRequest;
    }

    try {
      if (currentMode === 'chat') {
        // Chat mode: use stable chatId (not temp-), ChatAgent manages multi-turn
        const isTemporaryTask = taskIdRef.current.startsWith('temp-');
        const chatId = isTemporaryTask ? uuidv4() : taskIdRef.current;

        // Replace temp task immediately so frontend has stable ID
        if (isTemporaryTask) {
          replaceTaskId(taskIdRef.current, chatId);
          taskIdRef.current = chatId;
          setCurrentTaskId(chatId);
        }

        const messageId = uuidv4();
        const req = window.api.ekoChatRun(chatId, messageId, text.trim());
        setEkoRequest(req);
        await req;
      } else {
        // Explore mode: ekoRun (first) / ekoModify (subsequent)
        const isTemporaryTask = taskIdRef.current.startsWith('temp-');
        const req = isTemporaryTask
          ? window.api.ekoRun(text.trim())
          : window.api.ekoModify(taskIdRef.current, text.trim());

        setEkoRequest(req);
        const response = await req;

        if (response?.success && response.data?.result) {
          const result = response.data.result as EkoResult;
          if (taskIdRef.current) {
            updateTask(taskIdRef.current, { status: result.stopReason });
          }
        }
      }
    } catch (error) {
      if (taskIdRef.current) {
        updateTask(taskIdRef.current, { status: 'error' });
      }
      logger.error('Failed to send message', error, 'useTaskExecution');
      message.error(t('failed_send_message'));
      return false;
    } finally {
      setEkoRequest(null);
      setIsPaused(false);

      // Save task context for explore mode conversation continuation
      if (currentMode === 'explore' && taskIdRef.current) {
        try {
          const response = await window.api.ekoGetTaskContext(taskIdRef.current);
          if (response?.success && response.data?.taskContext) {
            const { workflow, contextParams, chainPlanRequest, chainPlanResult } = response.data.taskContext;
            if (workflow && contextParams) {
              updateTask(taskIdRef.current, {
                workflow,
                contextParams,
                chainPlanRequest,
                chainPlanResult
              });
            }
          }
        } catch (error) {
          logger.error('Failed to save task context', error, 'useTaskExecution');
        }
      }
    }

    return true;
  }, [
    isHistoryMode, isTaskDetailMode, scheduledTaskIdFromUrl,
    taskIdRef, executionIdRef, messageProcessorRef, ekoRequest,
    createTask, updateTask, updateMessages, setCurrentTaskId, replaceTaskId, t, message
  ]);

  const pauseTask = useCallback(async () => {
    if (!taskIdRef.current) return;
    const newPaused = !isPaused;
    await window.api.ekoPauseTask(taskIdRef.current, newPaused);
    setIsPaused(newPaused);
  }, [isPaused, taskIdRef]);

  return {
    sendMessage,
    ekoRequest,
    isPaused,
    pauseTask,
  };
};
