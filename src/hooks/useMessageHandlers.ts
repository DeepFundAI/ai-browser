import { useCallback } from 'react';
import { StreamCallbackMessage } from '@jarvis-agent/core/dist/types';
import { Task, ToolAction } from '@/models';
import { MessageProcessor } from '@/utils/messageTransform';
import { useTranslation } from 'react-i18next';
import { uuidv4 } from '@/utils/uuid';
import { detectFileType } from '@/utils/fileDetection';

interface UseMessageHandlersOptions {
  isHistoryMode: boolean;
  isTaskDetailMode: boolean;
  scheduledTaskId?: string;
  taskIdRef: React.RefObject<string>;
  messageProcessorRef: React.RefObject<MessageProcessor>;
  currentTaskId: string;
  tasks: Task[];
  showDetailAgents: string[];
  toolHistory: any[];
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  createTask: (taskId: string, initialData: Partial<Task>) => void;
  replaceTaskId: (oldTaskId: string, newTaskId: string) => void;
  setCurrentTaskId: (taskId: string) => void;
  setCurrentTool: (tool: { toolName: string; operation: string; status: 'running' | 'completed' | 'error' } | null) => void;
  setShowDetail: (show: boolean) => void;
  setToolHistory: (history: any[]) => void;
  addToolHistory: (taskId: string, tool: any) => void;
}

/**
 * Hook for handling message stream callbacks and tool operations
 */
export const useMessageHandlers = ({
  isHistoryMode,
  isTaskDetailMode,
  scheduledTaskId,
  taskIdRef,
  messageProcessorRef,
  currentTaskId,
  tasks,
  showDetailAgents,
  toolHistory,
  updateTask,
  createTask,
  replaceTaskId,
  setCurrentTaskId,
  setCurrentTool,
  setShowDetail,
  setToolHistory,
  addToolHistory,
}: UseMessageHandlersOptions) => {
  const { t } = useTranslation('main');

  const getToolOperation = useCallback((message: StreamCallbackMessage): string => {
    const toolName = (message as any).toolName || '';
    switch (toolName.toLowerCase()) {
      case 'browser':
      case 'browser_navigate':
        return t('tool_operations.browsing_web_page');
      case 'file_write':
      case 'file':
        return t('tool_operations.writing_file');
      case 'file_read':
        return t('tool_operations.reading_file');
      case 'search':
        return t('tool_operations.searching');
      default:
        return t('tool_operations.executing', { toolName });
    }
  }, [t]);

  const getToolStatus = useCallback((messageType: string): 'running' | 'completed' | 'error' => {
    switch (messageType) {
      case 'tool_use':
      case 'tool_streaming':
      case 'tool_running':
        return 'running';
      case 'tool_result':
        return 'completed';
      case 'error':
        return 'error';
      default:
        return 'running';
    }
  }, []);

  const handleFileAttachment = useCallback((toolResult: any) => {
    try {
      let fileInfo: any = toolResult;

      // Parse AI SDK wrapped format
      if (toolResult?.content?.[0]?.type === 'text' && toolResult.content[0].text) {
        try {
          fileInfo = JSON.parse(toolResult.content[0].text);
        } catch (e) {
          console.error('[useMessageHandlers] Failed to parse file info:', e);
          return;
        }
      }

      const { filePath, fileName, previewUrl, size } = fileInfo;
      if (!fileName || !previewUrl) return;

      const fileAttachment = {
        id: uuidv4(),
        name: fileName,
        path: filePath || fileName,
        url: previewUrl,
        type: detectFileType(fileName),
        size,
        createdAt: new Date()
      };

      if (taskIdRef.current) {
        const currentTask = tasks.find(t => t.id === taskIdRef.current);
        const existingFiles = currentTask?.files || [];

        if (!existingFiles.some(f => f.url === previewUrl)) {
          updateTask(taskIdRef.current, {
            files: [...existingFiles, fileAttachment]
          });
        }
      }
    } catch (error) {
      console.error('[useMessageHandlers] Failed to handle file attachment:', error);
    }
  }, [taskIdRef, tasks, updateTask]);

  const handleToolComplete = useCallback(async (message: ToolAction) => {
    try {
      if (!window.api) return;

      let screenshot: string | undefined;
      if (showDetailAgents.includes(message.agentName)) {
        const result = await (window.api as any).getMainViewScreenshot?.();
        if (result?.success && result.data?.imageBase64) {
          screenshot = result.data.imageBase64;
        }
      }

      const toolMessage = {
        ...message,
        screenshot,
        toolSequence: toolHistory.length + 1
      };

      setToolHistory([...toolHistory, toolMessage]);

      if (taskIdRef.current) {
        addToolHistory(taskIdRef.current, toolMessage);
      }
    } catch (error) {
      console.error('[useMessageHandlers] Screenshot failed:', error);
    }
  }, [taskIdRef, showDetailAgents, toolHistory, setToolHistory, addToolHistory]);

  const onMessage = useCallback((message: StreamCallbackMessage) => {
    if (isHistoryMode) return;

    const updatedMessages = messageProcessorRef.current.processStreamMessage(message);

    const isCurrentTaskTemporary = taskIdRef.current?.startsWith('temp-');
    const hasRealTaskId = message.taskId && !message.taskId.startsWith('temp-');

    if (isCurrentTaskTemporary && hasRealTaskId) {
      const tempTaskId = taskIdRef.current;
      const realTaskId = message.taskId;

      replaceTaskId(tempTaskId, realTaskId);
      taskIdRef.current = realTaskId;

      updateTask(realTaskId, {
        ...(message.type === 'workflow' && message.workflow?.name
          ? { name: message.workflow.name, workflow: message.workflow }
          : {}),
        messages: updatedMessages
      });

      return;
    }

    if (message.taskId && !currentTaskId && !message.taskId.startsWith('temp-')) {
      setCurrentTaskId(message.taskId);
    }

    const taskIdToUpdate = message.taskId || taskIdRef.current;
    if (taskIdToUpdate) {
      const existingTask = tasks.find(task => task.id === taskIdToUpdate);

      if (existingTask) {
        const updates: Partial<Task> = {
          messages: updatedMessages
        };

        if (message.type === 'workflow' && message.workflow?.name) {
          updates.name = message.workflow.name;
          updates.workflow = message.workflow;
        }

        if (message.type === 'error') {
          updates.status = 'error';
        }

        updateTask(taskIdToUpdate, updates);
      } else {
        // Task doesn't exist, create it
        const initialData: Partial<Task> = {
          name: (message.type === 'workflow' && message.workflow?.name)
            ? message.workflow.name
            : `Task ${taskIdToUpdate.slice(0, 8)}`,
          workflow: (message.type === 'workflow' && message.workflow) ? message.workflow : undefined,
          messages: updatedMessages,
          status: 'running',
          taskType: isTaskDetailMode ? 'scheduled' : 'normal',
          scheduledTaskId: isTaskDetailMode ? scheduledTaskId : undefined,
          startTime: new Date(),
        };

        taskIdRef.current = taskIdToUpdate;
        setCurrentTaskId(taskIdToUpdate);
        createTask(taskIdToUpdate, initialData);
      }
    }

    if (message.type.includes('tool')) {
      setCurrentTool({
        toolName: (message as any).toolName || 'Unknown tool',
        operation: getToolOperation(message),
        status: getToolStatus(message.type)
      });

      if (showDetailAgents.includes(message.agentName)) {
        setShowDetail(true);
      }

      if (message.type === 'tool_result') {
        handleToolComplete({
          type: 'tool',
          id: message.toolId,
          toolName: message.toolName,
          status: 'completed',
          timestamp: new Date(),
          agentName: message.agentName
        });

        if (message.toolName === 'file_write' && message.toolResult) {
          handleFileAttachment(message.toolResult);
        }
      }
    }
  }, [
    isHistoryMode, taskIdRef, messageProcessorRef, currentTaskId, showDetailAgents,
    updateTask, replaceTaskId, setCurrentTaskId, setCurrentTool, setShowDetail,
    getToolOperation, getToolStatus, handleToolComplete, handleFileAttachment
  ]);

  return {
    onMessage,
    getToolOperation,
    getToolStatus,
    handleToolComplete,
    handleFileAttachment,
  };
};
