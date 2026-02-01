import { useCallback } from 'react';
import { App } from 'antd';
import { ToolAction, FileAttachment } from '@/models';
import type { HumanResponseMessage } from '@/models/human-interaction';
import { useTranslation } from 'react-i18next';

interface UseInteractionHandlersOptions {
  toolHistory: any[];
  showDetail: boolean;
  setShowDetail: (show: boolean) => void;
  setCurrentHistoryIndex: (index: number) => void;
  setCurrentTool: (tool: { toolName: string; operation: string; status: 'running' | 'completed' | 'error' } | null) => void;
  setCurrentUrl: (url: string) => void;
  setIsViewingAttachment: (viewing: boolean) => void;
  switchToHistoryIndex: (index: number) => Promise<void>;
  getToolOperation: (message: any) => string;
  getToolStatus: (status: string) => 'running' | 'completed' | 'error';
}

/**
 * Hook for handling user interactions (tool clicks, file clicks, human responses)
 */
export const useInteractionHandlers = ({
  toolHistory,
  showDetail,
  setShowDetail,
  setCurrentHistoryIndex,
  setCurrentTool,
  setCurrentUrl,
  setIsViewingAttachment,
  switchToHistoryIndex,
  getToolOperation,
  getToolStatus,
}: UseInteractionHandlersOptions) => {
  const { t } = useTranslation('main');
  const { message } = App.useApp();

  const handleToolClick = useCallback(async (toolAction: ToolAction) => {
    setCurrentTool({
      toolName: toolAction.toolName,
      operation: getToolOperation({ toolName: toolAction.toolName } as any),
      status: getToolStatus(toolAction.status === 'completed' ? 'tool_result' :
        toolAction.status === 'running' ? 'tool_running' : 'error')
    });

    const historyTool = toolHistory.find(tool =>
      (tool as any).toolId === (toolAction as any).toolId && tool.id === toolAction.id
    );

    if (historyTool?.toolSequence && historyTool.screenshot) {
      const index = historyTool.toolSequence - 1;
      setCurrentHistoryIndex(index);
      setShowDetail(true);
      await switchToHistoryIndex(index);
    }
  }, [toolHistory, setCurrentTool, setCurrentHistoryIndex, setShowDetail, switchToHistoryIndex, getToolOperation, getToolStatus]);

  const handleHumanResponse = useCallback(async (response: HumanResponseMessage) => {
    try {
      await window.api.sendHumanResponse(response);
    } catch (error) {
      console.error('[useInteractionHandlers] Failed to send human response:', error);
      message.error(t('human_response_failed') || 'Failed to send response');
    }
  }, [t, message]);

  const handleFileClick = useCallback(async (file: FileAttachment) => {
    try {
      setCurrentHistoryIndex(-1);
      setIsViewingAttachment(true);
      setShowDetail(true);

      const wasHidden = !showDetail;
      const delayTime = wasHidden ? 300 : 100;

      if (window.api) {
        await (window.api as any).setDetailViewVisible?.(true);
        await (window.api as any).hideHistoryView?.();
        await new Promise(resolve => setTimeout(resolve, delayTime));
        await (window.api as any).navigateDetailView?.(file.url);
      }

      setCurrentUrl(file.url);
      message.success(t('previewing_file', { name: file.name }) || `Previewing: ${file.name}`);
    } catch (error) {
      console.error('[useInteractionHandlers] Failed to open file:', error);
      message.error(t('open_file_failed', { name: file.name }) || `Failed to open: ${file.name}`);
    }
  }, [showDetail, setCurrentHistoryIndex, setIsViewingAttachment, setShowDetail, setCurrentUrl, message, t]);

  return {
    handleToolClick,
    handleHumanResponse,
    handleFileClick,
  };
};
