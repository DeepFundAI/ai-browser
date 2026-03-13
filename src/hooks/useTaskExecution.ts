import { useState, useCallback } from 'react';
import { App } from 'antd';
import { EkoResult } from '@jarvis-agent/core';
import { MessageProcessor } from '@/utils/messageTransform';
import { Task } from '@/models';
import { uuidv4 } from '@/utils/uuid';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils/logger';

interface UseTaskExecutionOptions {
  isHistoryMode: boolean;
  isTaskDetailMode: boolean;
  scheduledTaskIdFromUrl?: string;
  taskIdRef: React.RefObject<string>;
  executionIdRef: React.RefObject<string>;
  messageProcessorRef: React.RefObject<MessageProcessor>;
  createTask: (taskId: string, task: Partial<Task>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  updateMessages: (taskId: string, messages: any[]) => void;
  setCurrentTaskId: (taskId: string) => void;
}

/**
 * Hook for handling task execution (sending messages, managing task lifecycle)
 */
export const useTaskExecution = ({
  isHistoryMode,
  isTaskDetailMode,
  scheduledTaskIdFromUrl,
  taskIdRef,
  executionIdRef,
  messageProcessorRef,
  createTask,
  updateTask,
  updateMessages,
  setCurrentTaskId,
}: UseTaskExecutionOptions) => {
  const { t } = useTranslation('main');
  const { message } = App.useApp();
  const [ekoRequest, setEkoRequest] = useState<Promise<any> | null>(null);
  const [isPaused, setIsPaused] = useState(false);

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
        scheduledTaskId: isTaskDetailMode ? scheduledTaskIdFromUrl : undefined,
        startTime: new Date(),
      });
    } else {
      updateMessages(taskIdRef.current, updatedMessages);
      updateTask(taskIdRef.current, { status: 'running' });
    }

    let result: EkoResult | null = null;

    if (ekoRequest) {
      await window.api.ekoCancelTask(taskIdRef.current);
      await ekoRequest;
    }

    try {
      const isTemporaryTask = taskIdRef.current.startsWith('temp-');
      const req = isTemporaryTask
        ? window.api.ekoRun(text.trim())
        : window.api.ekoModify(taskIdRef.current, text.trim());

      setEkoRequest(req);
      const response = await req;

      if (response?.success && response.data?.result) {
        result = response.data.result;
        if (taskIdRef.current) {
          updateTask(taskIdRef.current, { status: result.stopReason });
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

      // Save task context for conversation continuation
      if (result && taskIdRef.current) {
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
    createTask, updateTask, updateMessages, setCurrentTaskId, t, message
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
