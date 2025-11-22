import { useState, useCallback } from 'react';
import { message as antdMessage } from 'antd';
import { EkoResult } from '@jarvis-agent/core/dist/types';
import { MessageProcessor } from '@/utils/messageTransform';
import { Task } from '@/models';
import { uuidv4 } from '@/common/utils';
import { useTranslation } from 'react-i18next';

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
  const [ekoRequest, setEkoRequest] = useState<Promise<any> | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    if (!message) {
      antdMessage.warning(t('enter_question'));
      return;
    }

    if (isHistoryMode) {
      antdMessage.warning(t('history_readonly'));
      return;
    }

    const newExecutionId = uuidv4();
    executionIdRef.current = newExecutionId;
    messageProcessorRef.current.setExecutionId(newExecutionId);

    const updatedMessages = messageProcessorRef.current.addUserMessage(message.trim());

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
        ? window.api.ekoRun(message.trim())
        : window.api.ekoModify(taskIdRef.current, message.trim());

      setEkoRequest(req);
      result = await req;

      if (result && taskIdRef.current) {
        updateTask(taskIdRef.current, { status: result.stopReason });
      }

    } catch (error) {
      if (taskIdRef.current) {
        updateTask(taskIdRef.current, { status: 'error' });
      }
      console.error('[useTaskExecution] Failed to send message:', error);
      antdMessage.error(t('failed_send_message'));
    } finally {
      setEkoRequest(null);

      // Save task context for conversation continuation
      if (result && taskIdRef.current && (window.api as any).ekoGetTaskContext) {
        try {
          const taskContext = await (window.api as any).ekoGetTaskContext(taskIdRef.current);
          if (taskContext?.workflow && taskContext.contextParams) {
            updateTask(taskIdRef.current, {
              workflow: taskContext.workflow,
              contextParams: taskContext.contextParams,
              chainPlanRequest: taskContext.chainPlanRequest,
              chainPlanResult: taskContext.chainPlanResult
            });
          }
        } catch (error) {
          console.error('[useTaskExecution] Failed to save task context:', error);
        }
      }
    }
  }, [
    isHistoryMode, isTaskDetailMode, scheduledTaskIdFromUrl,
    taskIdRef, executionIdRef, messageProcessorRef, ekoRequest,
    createTask, updateTask, updateMessages, setCurrentTaskId, t
  ]);

  return {
    sendMessage,
    ekoRequest,
  };
};
