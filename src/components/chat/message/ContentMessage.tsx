import React from 'react';
import ReactMarkdown from 'react-markdown';
import { DisplayMessage, AgentMessage, ToolAction, FileAttachment } from '@/models';
import type { HumanResponseMessage } from '@/models/human-interaction';
import { WorkflowDisplay } from './WorkflowMessage';
import { AgentGroupDisplay } from './AgentGroupDisplay';
import { ToolDisplay } from './ToolMessage';

interface MessageDisplayProps {
  message: DisplayMessage;
  onToolClick?: (message: ToolAction) => void;
  onHumanResponse?: (response: HumanResponseMessage) => void;
  onFileClick?: (file: FileAttachment) => void;
  onRetry?: () => void;
}

/**
 * Message Content Component
 * Renders different types of messages (user, workflow, agent_group)
 */
export const MessageContent: React.FC<MessageDisplayProps> = ({
  message,
  onToolClick,
  onHumanResponse,
  onFileClick,
  onRetry
}) => {
  // Data-driven: message.content is already streaming from PlaybackEngine
  // User message
  if (message.type === 'user') {
    const displayContent = message.content;

    return (
      <div className="px-4 py-3 rounded-lg bg-message border border-border-message break-words">
        <span className="text-base whitespace-pre-wrap">
          {displayContent}
        </span>
      </div>
    );
  }

  if (message.type === 'workflow') {
    return <WorkflowDisplay workflow={message.workflow} />;
  }

  if (message.type === 'agent_group') {
    return <AgentGroupDisplay agentMessage={message} onToolClick={onToolClick} onHumanResponse={onHumanResponse} onFileClick={onFileClick} onRetry={onRetry} />
  }

  return null;
};

interface AgentMessageContentProps {
  message: AgentMessage;
  onToolClick?: (message: ToolAction) => void;
  onHumanResponse?: (response: HumanResponseMessage) => void;
  onFileClick?: (file: FileAttachment) => void;
}

/**
 * Agent Message Content Component
 * Renders tool and text messages from agents
 */
export const AgentMessageContent: React.FC<AgentMessageContentProps> = ({
  message,
  onToolClick,
  onHumanResponse,
  onFileClick
}) => {
  if (message.type === 'tool') {
    return <ToolDisplay message={message} onToolClick={onToolClick!} onHumanResponse={onHumanResponse} onFileClick={onFileClick} />;
  }

  if (message.type === 'text') {
    const content = message.content || '';
    if (!content.trim()) {
      return null; // Don't display empty content messages
    }
    return (
      <div className="message-text text-text-12-dark markdown-container">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  return null;
};
