import { useRef, useState, useEffect, useCallback } from 'react';
import { DisplayMessage, AgentGroupMessage } from '@/models';

interface UseScrollOptions {
  displayMessages: DisplayMessage[];
  isHistoryMode: boolean;
  playbackStatus: 'idle' | 'playing' | 'paused' | 'completed';
  toolHistory: any[];
}

/**
 * Hook for managing scroll behavior
 * Handles auto-scroll during playback and user scroll detection
 */
export const useScroll = ({ displayMessages, isHistoryMode, playbackStatus, toolHistory }: UseScrollOptions) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Calculate total content length to detect content changes during playback
  const totalContentLength = displayMessages.reduce((total, msg) => {
    if (msg.type === 'user') {
      return total + msg.content.length;
    } else if (msg.type === 'workflow') {
      const thought = msg.workflow?.thought || '';
      return total + thought.length;
    } else if (msg.type === 'agent_group') {
      const agentGroup = msg as AgentGroupMessage;
      const textContent = agentGroup.messages
        .filter(m => m.type === 'text')
        .reduce((sum, m) => sum + ((m as any).content?.length || 0), 0);
      return total + textContent;
    }
    return total;
  }, 0);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const atBottom = distanceFromBottom < 50;

      setIsAtBottom(atBottom);
    }
  }, []);

  // Auto scroll to bottom during playback (monitors content growth, not just message count)
  useEffect(() => {
    if (isHistoryMode && playbackStatus === 'playing' && scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current;
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [isHistoryMode, totalContentLength, playbackStatus]);

  // Monitor message changes, auto scroll to bottom in normal mode
  // Only auto-scroll when user is at bottom (isAtBottom = true)
  // This allows users to scroll up and view content without being interrupted
  // Also monitors toolHistory to trigger scroll when tools complete
  useEffect(() => {
    if (!isHistoryMode && isAtBottom && displayMessages.length > 0) {
      scrollToBottom();
    }
  }, [totalContentLength, isHistoryMode, isAtBottom, scrollToBottom, displayMessages.length, toolHistory.length]);

  return {
    scrollContainerRef,
    isAtBottom,
    scrollToBottom,
    handleScroll,
  };
};
