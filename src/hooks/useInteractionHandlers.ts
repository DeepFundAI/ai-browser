import { useCallback } from 'react';
import { message as antdMessage } from 'antd';
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

  const handleToolClick = useCallback(async (message: ToolAction) => {
    setCurrentTool({
      toolName: message.toolName,
      operation: getToolOperation({ toolName: message.toolName } as any),
      status: getToolStatus(message.status === 'completed' ? 'tool_result' :
        message.status === 'running' ? 'tool_running' : 'error')
    });

    const historyTool = toolHistory.find(tool =>
      (tool as any).toolId === (message as any).toolId && tool.id === message.id
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
      antdMessage.error(t('human_response_failed') || 'Failed to send response');
    }
  }, [t]);

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
      antdMessage.success(`正在预览文件：${file.name}`);
    } catch (error) {
      console.error('[useInteractionHandlers] Failed to open file:', error);
      antdMessage.error(`打开文件失败：${file.name}`);
    }
  }, [showDetail, setCurrentHistoryIndex, setIsViewingAttachment, setShowDetail, setCurrentUrl]);

  return {
    handleToolClick,
    handleHumanResponse,
    handleFileClick,
  };
};
