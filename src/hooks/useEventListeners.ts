import { useEffect } from 'react';
import { App } from 'antd';
import { StreamCallbackMessage } from '@jarvis-agent/core/dist/types';
import { Task } from '@/models';
import { scheduledTaskStorage } from '@/services/scheduled-task-storage';
import { useTranslation } from 'react-i18next';

interface UseEventListenersOptions {
  isTaskDetailMode: boolean;
  scheduledTaskIdFromUrl?: string;
  tasks: Task[];
  taskIdRef: React.RefObject<string>;
  showDetail: boolean;
  isViewingAttachment: boolean;
  isHistoryMode: boolean;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  onStreamMessage: (message: StreamCallbackMessage) => void;
  setCurrentUrl: (url: string) => void;
}

/**
 * Hook for managing all event listeners and side effects
 */
export const useEventListeners = ({
  isTaskDetailMode,
  scheduledTaskIdFromUrl,
  tasks,
  taskIdRef,
  showDetail,
  isViewingAttachment,
  isHistoryMode,
  updateTask,
  onStreamMessage,
  setCurrentUrl,
}: UseEventListenersOptions) => {
  const { t } = useTranslation('main');
  const { message } = App.useApp();

  // Sync detail panel visibility with Electron main process
  useEffect(() => {
    if (!window.api) return;

    const showDetailView = isHistoryMode ? isViewingAttachment : showDetail;
    (window.api as any).setDetailViewVisible?.(showDetailView);

    if (!showDetail) {
      (window.api as any).hideHistoryView?.();
    }
  }, [showDetail, isHistoryMode, isViewingAttachment]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (!window.api) return;

      (window.api as any).setDetailViewVisible?.(false);
      (window.api as any).hideHistoryView?.();

      if (taskIdRef.current) {
        window.api.ekoCancelTask?.(taskIdRef.current);
      }
    };
  }, [taskIdRef]);

  // Initialize and monitor URL changes
  useEffect(() => {
    if (!window.api) return;

    // Get initial URL
    (window.api as any).getCurrentUrl?.().then((response: any) => {
      if (response?.success && response.data?.url) {
        setCurrentUrl(response.data.url);
      }
    });

    // Monitor URL changes
    (window.api as any).onUrlChange?.((url: string) => {
      setCurrentUrl(url);

      if (taskIdRef.current && !isHistoryMode) {
        updateTask(taskIdRef.current, { lastUrl: url });
      }
    });
  }, [setCurrentUrl, taskIdRef, isHistoryMode, updateTask]);

  // Monitor open history panel event
  useEffect(() => {
    if (!isTaskDetailMode || !window.api) return;

    const handleOpenHistoryPanel = () => {
      const { useHistoryStore } = require('@/stores/historyStore');
      useHistoryStore.getState().setShowHistoryPanel(true);
    };

    (window.api as any).onOpenHistoryPanel?.(handleOpenHistoryPanel);

    return () => {
      (window.api as any).removeAllListeners?.('open-history-panel');
    };
  }, [isTaskDetailMode]);

  // Monitor task aborted by system event
  useEffect(() => {
    if (!window.api) return;

    const handleTaskAbortedBySystem = async (event: any) => {
      const { taskId, reason, timestamp } = event;

      try {
        updateTask(taskId, {
          status: 'abort',
          endTime: new Date(timestamp),
        });
        message.warning(t('task_terminated_with_reason', { reason }));
      } catch (error) {
        console.error('[useEventListeners] Failed to update aborted task:', error);
      }
    };

    (window.api as any).onTaskAbortedBySystem?.(handleTaskAbortedBySystem);

    return () => {
      (window.api as any).removeAllListeners?.('task-aborted-by-system');
    };
  }, [updateTask, t, message]);

  // Monitor scheduled task execution completion
  useEffect(() => {
    if (!isTaskDetailMode || !window.api) return;

    const handleTaskExecutionComplete = async (event: any) => {
      const { taskId, status, endTime } = event;

      try {
        const endTimeDate = endTime ? new Date(endTime) : new Date();

        if (taskIdRef.current) {
          const currentTask = tasks.find(t => t.id === taskIdRef.current);
          const startTime = currentTask?.startTime || currentTask?.createdAt;

          updateTask(taskIdRef.current, {
            endTime: endTimeDate,
            duration: startTime ? endTimeDate.getTime() - startTime.getTime() : undefined,
            status: status as any,
          });
        }

        const scheduledTaskId = scheduledTaskIdFromUrl || taskId;
        if (scheduledTaskId) {
          await scheduledTaskStorage.updateScheduledTask(scheduledTaskId, {
            lastExecutedAt: endTimeDate
          });
        }

        message.success(t('task_execution_completed'));
      } catch (error) {
        console.error('[useEventListeners] Failed to update task completion:', error);
        message.error(t('failed_update_task_status'));
      }
    };

    (window.api as any).onTaskExecutionComplete?.(handleTaskExecutionComplete);

    return () => {
      (window.api as any).removeAllListeners?.('task-execution-complete');
    };
  }, [isTaskDetailMode, tasks, updateTask, scheduledTaskIdFromUrl, taskIdRef, t, message]);

  // Monitor EkoService stream messages
  useEffect(() => {
    window.api.onEkoStreamMessage(onStreamMessage);
    return () => window.api.removeAllListeners('eko-stream-message');
  }, [onStreamMessage]);
};
