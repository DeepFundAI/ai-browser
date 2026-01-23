import { useState, useEffect, useRef, useCallback } from 'react';
import { ToolAction, DisplayMessage, AgentGroupMessage } from '@/models';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';

interface UseToolHistoryOptions {
  isHistoryMode: boolean;
  playbackStatus: 'idle' | 'playing' | 'paused' | 'completed';
  displayMessages: DisplayMessage[];
}

/**
 * Hook for managing tool history and screenshot display
 */
export const useToolHistory = ({ isHistoryMode, playbackStatus, displayMessages }: UseToolHistoryOptions) => {
  const { t } = useTranslation('main');
  const { message } = App.useApp();
  const [toolHistory, setToolHistory] = useState<(ToolAction & { screenshot?: string, toolSequence?: number })[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
  const [showDetail, setShowDetail] = useState(false);
  const [isViewingAttachment, setIsViewingAttachment] = useState(false);

  const lastDisplayedToolIdRef = useRef<string | null>(null);

  // Auto show tool screenshots during playback
  useEffect(() => {
    if (!isHistoryMode || playbackStatus !== 'playing') {
      lastDisplayedToolIdRef.current = null;
      return;
    }

    if (displayMessages.length <= 1) {
      lastDisplayedToolIdRef.current = null;
    }

    const allToolMessages: ToolAction[] = [];
    displayMessages.forEach(msg => {
      if (msg.type === 'agent_group') {
        const agentGroup = msg as AgentGroupMessage;
        agentGroup.messages.forEach(innerMsg => {
          if (innerMsg.type === 'tool') {
            allToolMessages.push(innerMsg as ToolAction);
          }
        });
      }
    });

    const lastToolMessage = allToolMessages[allToolMessages.length - 1];
    if (!lastToolMessage || lastDisplayedToolIdRef.current === lastToolMessage.id) {
      return;
    }

    const toolWithScreenshot = toolHistory.find(
      tool => tool.id === lastToolMessage.id && tool.screenshot
    );

    if (toolWithScreenshot?.screenshot) {
      const toolIndex = toolHistory.findIndex(t => t.id === toolWithScreenshot.id);

      if (toolIndex !== -1) {
        lastDisplayedToolIdRef.current = lastToolMessage.id;
        setShowDetail(true);
        setCurrentHistoryIndex(toolIndex);

        (window.api as any).showHistoryView?.(toolWithScreenshot.screenshot).catch((error: Error) => {
          console.error('[useToolHistory] Failed to show screenshot:', error);
        });
      }
    }
  }, [isHistoryMode, displayMessages, playbackStatus, toolHistory]);

  // Reset viewing attachment flag when detail panel is closed
  useEffect(() => {
    if (!showDetail) {
      setIsViewingAttachment(false);
    }
  }, [showDetail]);

  const switchToHistoryIndex = useCallback(async (newIndex: number) => {
    if (currentHistoryIndex === newIndex) return;

    setIsViewingAttachment(false);

    if ((newIndex >= toolHistory.length - 1) && !isHistoryMode) {
      setCurrentHistoryIndex(-1);
      try {
        await (window.api as any).hideHistoryView?.();
      } catch (error) {
        console.error('[useToolHistory] Failed to hide history view:', error);
      }
    } else {
      setCurrentHistoryIndex(newIndex);
      const historyTool = toolHistory[newIndex];

      if (historyTool?.screenshot) {
        try {
          await (window.api as any).showHistoryView?.(historyTool.screenshot);
        } catch (error) {
          console.error('[useToolHistory] Failed to show history view:', error);
          message.error(t('screenshot_display_failed') || 'Failed to display screenshot');
        }
      } else {
        try {
          await (window.api as any).hideHistoryView?.();
        } catch (error) {
          console.error('[useToolHistory] Failed to hide history view:', error);
        }
      }
    }
  }, [currentHistoryIndex, toolHistory, isHistoryMode, message, t]);

  return {
    toolHistory,
    setToolHistory,
    currentHistoryIndex,
    setCurrentHistoryIndex,
    showDetail,
    setShowDetail,
    isViewingAttachment,
    setIsViewingAttachment,
    switchToHistoryIndex,
  };
};
