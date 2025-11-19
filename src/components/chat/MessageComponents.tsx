import React, { useState } from 'react';
import { Typography, Button, Spin } from "antd";
import { LoadingOutlined } from '@ant-design/icons';
import ReactMarkdown from "react-markdown";
import { Executing, Browser, Search, DataAnalysis, ExpandCollapse, DeepThinking, FinishStatus, RuningStatus, Atlas } from '../../icons/deepfundai-icons';
import { DisplayMessage, AgentGroupMessage, ToolAction, AgentMessage, FileAttachment } from '../../models';
import type { HumanRequestMessage, HumanResponseMessage } from '../../models/human-interaction';
import { HumanInteractionCard } from './HumanInteractionCard';
import { useTranslation } from 'react-i18next';
import { uuidv4 } from '@/common/utils';

const { Text } = Typography;

interface MessageDisplayProps {
  message: DisplayMessage;
  onToolClick?: (message: ToolAction) => void;
  onHumanResponse?: (response: HumanResponseMessage) => void;
  onFileClick?: (file: FileAttachment) => void;
}

// Workflow display component
const WorkflowDisplay = ({ workflow }: { workflow: any }) => {
  if (!workflow) return null;

  // Check if thought is completed by whether agents field exists and has content
  const isThoughtCompleted = workflow.agents && workflow.agents.length > 0;

  return (
    <div className="workflow-display space-y-4">
      <div className='flex items-center gap-2'>
        <Atlas />
        <span className="text-lg font-bold">Atlas</span>
      </div>

      {/* Thinking process - dark theme style */}
      {workflow.thought && (
        <ThinkingDisplay content={workflow.thought} isCompleted={isThoughtCompleted} />
      )}

      {/* Agent list - STEP format */}
      {workflow.agents && workflow.agents.length > 0 && (
        <div className="space-y-3">
          {workflow.agents.map((agent: any, index: number) => (
            <StepAgentDisplay key={agent.id || index} agent={agent} stepNumber={index + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

// Safely render node text
const renderNodeText = (node: any, t: any): string => {
  if (typeof node === 'string') {
    return node;
  }
  if (typeof node === 'object' && node !== null) {
    if (node.text && typeof node.text === 'string') {
      return node.text;
    }
    // If no text property or empty, return default text
    return t('step_description');
  }
  return String(node || t('step_description'));
};

// Thinking display component
const ThinkingDisplay = ({ content, isCompleted = false }: { content: string; isCompleted?: boolean }) => {
  const { t } = useTranslation('chat');
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-thinking rounded-lg p-4">
      {/* Header */}
      <div
        className="flex items-center justify-start gap-1 cursor-pointer mb-3"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center space-x-2">
          {isCompleted ? (
            <FinishStatus />
          ) : (
            <DeepThinking />
          )}
          <span className="text-white font-medium text-sm">{t('thinking')}</span>
        </div>
        <Button
          type="text"
          size="small"
          icon={collapsed ? <ExpandCollapse className=' rotate-180' /> : <ExpandCollapse />}
          className="!text-gray-400 hover:!text-white"
        />
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="text-sm text-text-12-dark leading-relaxed">
          {content}
        </div>
      )}
    </div>
  );
};

// STEP format Agent display component
const StepAgentDisplay = ({ agent, stepNumber }: { agent: any; stepNumber: number }) => {
  const { t } = useTranslation('chat');

  return (
    <div className="step-agent-display text-base">
      {/* Agent information - status display removed */}
      <div className="px-2 border-l-2 border-text-05-dark mb-3">
        <div className="flex items-center gap-1 text-text-05-dark font-semibold ">
          <DeepThinking />
          {agent.name} {t('agent')}
        </div>
        <div className="mt-1">
          {agent.task}
        </div>
      </div>

      {/* Execution steps - STEP format */}
      {agent.nodes && agent.nodes.length > 0 && (
        <div className="space-y-2">
          {agent.nodes.map((node: any, nodeIndex: number) => (
            <div key={nodeIndex} className="step-item flex items-center justify-start gap-2 mt-3">
              <span className="font-semibold w-5 h-5 bg-step rounded-full flex items-center justify-center">
                {nodeIndex + 1}
              </span>
              <span className='line-clamp-1 flex-1'>
                {renderNodeText(node, t)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Tool related components
const ToolDisplay = ({
  message,
  onToolClick,
  onHumanResponse,
  onFileClick
}: {
  message: ToolAction;
  onToolClick: (message: ToolAction) => void;
  onHumanResponse?: (response: HumanResponseMessage) => void;
  onFileClick?: (file: FileAttachment) => void;
}) => {
  const { t } = useTranslation('chat');

  // Special handling for human_interact tool
  if (message.toolName === 'human_interact' && message.params) {
    // Convert ToolAction to HumanRequestMessage format
    const humanMessage: HumanRequestMessage = {
      type: 'human_interaction',
      requestId: message.id, // Use toolId as requestId
      taskId: message.params.taskId,
      agentName: message.agentName,
      interactType: message.params.interactType || 'request_help',
      prompt: message.params.prompt || '',
      selectOptions: message.params.selectOptions,
      selectMultiple: message.params.selectMultiple,
      helpType: message.params.helpType,
      context: message.params.context,
      timestamp: message.timestamp
    };

    return (
      <HumanInteractionCard
        message={humanMessage}
        onResponse={(response) => {
          if (onHumanResponse) {
            onHumanResponse(response);
          }
        }}
      />
    );
  }

  // Tool icon mapping (can do approximate matching based on common tool names)
  const getToolIcon = (toolName?: string) => {
    const name = (toolName || '').toLowerCase();
    if (name.includes('navigate') || name.includes('extract') || name.includes('browser')) return <Browser />;
    if (name.includes('search')) return <Search />;
    if (name.includes('analy') || name.includes('data')) return <DataAnalysis />;
    return <Executing />;
  };

  // Check if tool is currently executing
  const isExecuting = message.status === 'streaming' || message.status === 'use' || message.status === 'running';

  // Extract file information from file_write result
  const getFileInfo = () => {
    if (message.toolName === 'file_write' && message.status === 'completed' && message.result) {
      try {
        let fileInfo = message.result;

        // Handle AI SDK wrapped result structure
        if (fileInfo?.content && Array.isArray(fileInfo.content) && fileInfo.content.length > 0) {
          const firstContent = fileInfo.content[0];
          if (firstContent.type === 'text' && firstContent.text) {
            try {
              fileInfo = JSON.parse(firstContent.text);
            } catch (parseError) {
              console.error('Failed to parse file_write result content:', parseError);
              return null;
            }
          }
        }

        // Require fileName and previewUrl for file link display
        if (fileInfo?.fileName && fileInfo?.previewUrl) {
          return fileInfo;
        }
      } catch (e) {
        console.error('Failed to extract file info from file_write result:', e);
      }
    }
    return null;
  };

  const fileInfo = getFileInfo();

  // Handle file link click
  const handleFileLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fileInfo || !onFileClick) return;

    // Determine file type based on extension
    const getFileType = (fileName: string): 'markdown' | 'code' | 'text' | 'other' => {
      const ext = fileName.split('.').pop()?.toLowerCase();
      if (ext === 'md') return 'markdown';
      if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs'].includes(ext || '')) return 'code';
      if (['txt', 'log'].includes(ext || '')) return 'text';
      return 'other';
    };

    // Construct FileAttachment object
    const fileAttachment: FileAttachment = {
      id: uuidv4(),
      name: fileInfo.fileName,
      path: fileInfo.filePath,
      url: fileInfo.previewUrl || `file://${fileInfo.filePath}`,
      type: getFileType(fileInfo.fileName),
      size: fileInfo.size,
      createdAt: new Date()
    };

    onFileClick(fileAttachment);
  };

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className="inline-flex items-center gap-2 px-3 py-2 bg-tool-call rounded-md border text-xs border-border-message text-text-12-dark cursor-pointer hover:bg-opacity-80 transition-colors"
        onClick={() => onToolClick(message)}
      >
        {getToolIcon(message.toolName)}
        <span>{t('executing_tool', { toolName: message.toolName || 'tool' })}</span>
        {/* Only show loading indicator when executing */}
        {isExecuting && (
          <Spin indicator={<LoadingOutlined spin style={{ color: '#3b82f6', fontSize: 14 }} />} size="small" />
        )}
      </div>

      {/* Display file link for file_write tool when completed - on the same line */}
      {fileInfo && (
        <div
          className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer transition-colors flex items-center gap-1"
          onClick={handleFileLinkClick}
        >
          📄 {fileInfo.fileName}
        </div>
      )}
    </div>
  );
};

// Message content component
const MessageContent = ({
  message,
  onToolClick,
  onHumanResponse,
  onFileClick
}: {
  message: DisplayMessage;
  onToolClick?: (message: ToolAction) => void;
  onHumanResponse?: (response: HumanResponseMessage) => void;
  onFileClick?: (file: FileAttachment) => void;
}) => {
  // User message
  if (message.type === 'user') {
    return (
      <div className="px-4 py-3 rounded-lg bg-message border border-border-message break-words">
        <span className="text-base whitespace-pre-wrap">{message.content}</span>
      </div>
    );
  }

  if (message.type === 'workflow') {
    return <WorkflowDisplay workflow={message.workflow} />;
  }

  if (message.type === 'agent_group') {
    return <AgentGroupDisplay agentMessage={message} onToolClick={onToolClick} onHumanResponse={onHumanResponse} onFileClick={onFileClick} />
  }

  return null;
};

// Message content component
const AgentMessageContent = ({
  message,
  onToolClick,
  onHumanResponse,
  onFileClick
}: {
  message: AgentMessage;
  onToolClick?: (message: ToolAction) => void;
  onHumanResponse?: (response: HumanResponseMessage) => void;
  onFileClick?: (file: FileAttachment) => void;
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


// Single message component
const MessageItem = ({ message, onToolClick, onHumanResponse, onFileClick }: MessageDisplayProps) => {
  const isUser = message.type === 'user';

  // Get message content
  const messageContent = <MessageContent message={message} onToolClick={onToolClick} onHumanResponse={onHumanResponse} onFileClick={onFileClick} />;

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

// Agent grouped message display component
const AgentGroupDisplay = ({
  agentMessage,
  onToolClick,
  onHumanResponse,
  onFileClick
}: {
  agentMessage: AgentGroupMessage;
  onToolClick?: (message: ToolAction) => void;
  onHumanResponse?: (response: HumanResponseMessage) => void;
  onFileClick?: (file: FileAttachment) => void;
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="agent-group mb-4 mt-10">
      {/* Agent task title */}
      <div
        className="flex items-center cursor-pointer transition-colors mb-4"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          {agentMessage.status === 'completed' ? (
            <FinishStatus />
          ) : agentMessage.status === 'error' ? (
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs">✕</span>
            </div>
          ) : (
            <RuningStatus />
          )}
          <span className="font-semibold">
            {agentMessage.agentNode?.task || agentMessage.agentName}
          </span>
        </div>
        <Button
          type="text"
          size="small"
          icon={isCollapsed ? <ExpandCollapse className=' rotate-180' /> : <ExpandCollapse />}
        />
      </div>

      {/* Agent execution steps */}
      {!isCollapsed && (
        <div className="agent-steps">
          {agentMessage.messages.map((message) => {
            return (
              <div key={message.id} className="agent-step">
                <div className="pl-6 mb-3 text-sm">
                  <AgentMessageContent message={message} onToolClick={onToolClick} onHumanResponse={onHumanResponse} onFileClick={onFileClick} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Message list component
const MessageListComponent = ({
  messages,
  onToolClick,
  onHumanResponse,
  onFileClick
}: {
  messages: DisplayMessage[];
  onToolClick?: (message: ToolAction) => void;
  onHumanResponse?: (response: HumanResponseMessage) => void;
  onFileClick?: (file: FileAttachment) => void;
}) => {

  return (
    <div className="message-list space-y-2">
      {messages.map((message) => (
        <MessageItem
          message={message}
          key={message.id}
          onToolClick={onToolClick}
          onHumanResponse={onHumanResponse}
          onFileClick={onFileClick}
        />
      ))}
    </div>
  );
};


// Export components
export { MessageListComponent as MessageList, MessageItem };
export default MessageListComponent; 