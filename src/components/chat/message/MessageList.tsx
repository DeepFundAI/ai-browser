import React from 'react';
import { DisplayMessage, ToolAction, FileAttachment } from '@/models';
import type { HumanResponseMessage } from '@/models/human-interaction';
import { MessageContent } from './ContentMessage';

interface MessageDisplayProps {
  message: DisplayMessage;
  onToolClick?: (message: ToolAction) => void;
  onHumanResponse?: (response: HumanResponseMessage) => void;
  onFileClick?: (file: FileAttachment) => void;
  onRetry?: () => void;
}

/**
 * Message Item Component
 * Renders a single message with proper alignment (user messages on right, others on left)
 */
export const MessageItem: React.FC<MessageDisplayProps> = ({
  message,
  onToolClick,
  onHumanResponse,
  onFileClick,
  onRetry
}) => {
  const isUser = message.type === 'user';

  // Get message content
  const messageContent = (
    <MessageContent
      message={message}
      onToolClick={onToolClick}
      onHumanResponse={onHumanResponse}
      onFileClick={onFileClick}
      onRetry={onRetry}
    />
  );

  // If message content is empty, don't display the entire message item
  if (!messageContent) {
    return null;
  }

  return (
    <div className='message-item mb-4'>
      {/* Outer container for left/right alignment */}
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`text-text-01-dark ${isUser ? 'max-w-[80%]' : 'w-full'}`}>
          {messageContent}
        </div>
      </div>
    </div>
  );
};

interface MessageListProps {
  messages: DisplayMessage[];
  onToolClick?: (message: ToolAction) => void;
  onHumanResponse?: (response: HumanResponseMessage) => void;
  onFileClick?: (file: FileAttachment) => void;
  onRetry?: () => void;
}

/**
 * Message List Component
 * Renders the list of all messages in the conversation
 */
export const MessageListComponent: React.FC<MessageListProps> = ({
  messages,
  onToolClick,
  onHumanResponse,
  onFileClick,
  onRetry
}) => {
  // Data-driven: messages grow during playback, just render them
  return (
    <div className="message-list space-y-2">
      {messages.map((message, index) => (
        <div key={`${message.id}-${index}`}>
          <MessageItem
            message={message}
            onToolClick={onToolClick}
            onHumanResponse={onHumanResponse}
            onFileClick={onFileClick}
            onRetry={onRetry}
          />
        </div>
      ))}
    </div>
  );
};

// Export MessageList as default and also as MessageList for compatibility
export { MessageListComponent as MessageList };
export default MessageListComponent;
