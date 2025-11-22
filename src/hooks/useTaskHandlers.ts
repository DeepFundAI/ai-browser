import { useCallback } from 'react';
import { Task, ToolAction } from '@/models';

interface UseTaskHandlersOptions {
  currentTaskId: string;
  taskIdRef: React.RefObject<string>;
  executionIdRef: React.RefObject<string>;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  replaceTaskId: (oldTaskId: string, newTaskId: string) => void;
  enterHistoryMode: (task: Task) => void;
  exitHistoryMode: () => void;
  setToolHistory: (history: (ToolAction & { screenshot?: string, toolSequence?: number })[]) => void;
  setCurrentUrl: (url: string) => void;
}

/**
 * Hook for task-related handlers
 */
export const useTaskHandlers = ({
  currentTaskId,
  taskIdRef,
  executionIdRef,
  updateTask,
  replaceTaskId,
  enterHistoryMode,
  exitHistoryMode,
  setToolHistory,
  setCurrentUrl,
}: UseTaskHandlersOptions) => {

  const terminateCurrentTask = useCallback(async () => {
    if (!taskIdRef.current) return false;

    try {
      await (window.api as any).ekoCancelTask?.(taskIdRef.current);
      updateTask(taskIdRef.current, { status: 'abort' });
      return true;
    } catch (error) {
      console.error('[useTaskHandlers] Failed to terminate task:', error);
      return false;
    }
  }, [taskIdRef, updateTask]);

  const handleTaskIdReplacement = useCallback((oldTaskId: string, newTaskId: string) => {
    taskIdRef.current = newTaskId;
    replaceTaskId(oldTaskId, newTaskId);
  }, [taskIdRef, replaceTaskId]);

  const handleSelectHistoryTask = useCallback(async (task: Task, isCurrentTaskRunning: boolean) => {
    try {
      if (currentTaskId && isCurrentTaskRunning) {
        await terminateCurrentTask();
      }

      enterHistoryMode(task);
      setToolHistory(task.toolHistory || []);

      if (task.lastUrl) {
        setCurrentUrl(task.lastUrl);
      }
    } catch (error) {
      console.error('[useTaskHandlers] Failed to select history task:', error);
    }
  }, [currentTaskId, terminateCurrentTask, enterHistoryMode, setToolHistory, setCurrentUrl]);

  const handleContinueConversation = useCallback(async (currentTask: Task | null) => {
    if (!currentTask) {
      console.error('[useTaskHandlers] No current task available');
      return false;
    }

    try {
      let result: any = null;
      if (currentTask.executionId && (window.api as any).ekoRestoreTaskContext) {
        result = await (window.api as any).ekoRestoreTaskContext(currentTask.executionId);
      }

      const newExecutionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      executionIdRef.current = newExecutionId;

      exitHistoryMode();
      return true;
    } catch (error) {
      console.error('[useTaskHandlers] Failed to continue conversation:', error);
      return false;
    }
  }, [executionIdRef, exitHistoryMode]);

  return {
    terminateCurrentTask,
    handleTaskIdReplacement,
    handleSelectHistoryTask,
    handleContinueConversation,
  };
};
