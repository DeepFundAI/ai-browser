import React, { useEffect, useRef, useMemo } from 'react';
import { DisplayMessage, ToolAction, AgentGroupMessage } from '@/models';
import { HumanResponseMessage } from '@/models/human-interaction';
import { MessageList } from '@/components/chat/MessageComponents';
import { PlaybackStatus } from '@/utils/PlaybackEngine';

interface PlaybackContainerProps {
  displayMessages: DisplayMessage[];
  playbackStatus: PlaybackStatus;
  onToolClick?: (message: ToolAction) => void;
  onHumanResponse?: (response: HumanResponseMessage) => void;
  onFileClick?: (file: any) => void;
}

/**
 * PlaybackContainer - Manages history playback display with auto-scroll
 *
 * This component handles:
 * - Auto-scroll during playback
 * - Message rendering
 */
export const PlaybackContainer: React.FC<PlaybackContainerProps> = ({
  displayMessages,
  playbackStatus,
  onToolClick,
  onHumanResponse,
  onFileClick,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Calculate total content length to detect content changes
  const totalContentLength = useMemo(() => {
    return displayMessages.reduce((total, msg) => {
      if (msg.type === 'user') {
        return total + msg.content.length;
      } else if (msg.type === 'workflow') {
        const thought = msg.workflow?.thought || '';
        return total + thought.length;
      } else if (msg.type === 'agent_group') {
        const textContent = (msg as AgentGroupMessage).messages
          .filter(m => m.type === 'text')
          .reduce((sum, m) => sum + ((m as any).content?.length || 0), 0);
        return total + textContent;
      }
      return total;
    }, 0);
  }, [displayMessages]);

  // Auto-scroll when content grows during playback
  useEffect(() => {
    if (playbackStatus === 'playing' && scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current;
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [totalContentLength, playbackStatus]);

  return (
    <div
      ref={scrollContainerRef}
      className='flex-1 h-full overflow-x-hidden overflow-y-auto px-4 pt-5'
    >
      <MessageList
        messages={displayMessages}
        onToolClick={onToolClick}
        onHumanResponse={onHumanResponse}
        onFileClick={onFileClick}
      />
    </div>
  );
};
