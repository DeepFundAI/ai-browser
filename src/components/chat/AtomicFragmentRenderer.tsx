import React, { useState } from 'react';
import { useTypewriter } from 'react-simple-typewriter';
import { AtomicMessageFragment } from '@/utils/messageFlattener';
import { DeepThinking, Atlas, Executing, Browser, Search, DataAnalysis, FinishStatus, RuningStatus, ExpandCollapse } from '@/icons/deepfundai-icons';
import { useTranslation } from 'react-i18next';
import { HumanInteractionCard } from './HumanInteractionCard';
import { Spin, Button } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { ToolAction, FileAttachment } from '@/models';
import type { HumanResponseMessage } from '@/models/human-interaction';
import { uuidv4 } from '@/utils/uuid';
import ReactMarkdown from 'react-markdown';

interface AtomicFragmentRendererProps {
  fragments: AtomicMessageFragment[];
  isPlaybackMode?: boolean;
  onToolClick?: (message: ToolAction) => void;
  onHumanResponse?: (response: HumanResponseMessage) => void;
  onFileClick?: (file: FileAttachment) => void;
}

/**
 * Render atomic message fragments sequentially
 * Each fragment is a small piece of text that can be displayed with typewriter effect
 */
export const AtomicFragmentRenderer: React.FC<AtomicFragmentRendererProps> = ({
  fragments,
  isPlaybackMode = false,
  onToolClick,
  onHumanResponse,
  onFileClick,
}) => {
  const { t } = useTranslation(['chat', 'main']);

  // Group fragments by original message ID to maintain structure
  const groupedFragments = fragments.reduce((acc, fragment) => {
    if (!acc[fragment.originalMessageId]) {
      acc[fragment.originalMessageId] = [];
    }
    acc[fragment.originalMessageId].push(fragment);
    return acc;
  }, {} as Record<string, AtomicMessageFragment[]>);

  return (
    <div className="message-list space-y-2">
      {Object.entries(groupedFragments).map(([messageId, messageFragments]) => (
        <MessageFragmentGroup
          key={messageId}
          fragments={messageFragments}
          isPlaybackMode={isPlaybackMode}
          isLastGroup={messageId === fragments[fragments.length - 1]?.originalMessageId}
          onToolClick={onToolClick}
          onHumanResponse={onHumanResponse}
          onFileClick={onFileClick}
        />
      ))}
    </div>
  );
};

/**
 * Render a group of fragments from the same original message
 */
const MessageFragmentGroup: React.FC<{
  fragments: AtomicMessageFragment[];
  isPlaybackMode: boolean;
  isLastGroup: boolean;
  onToolClick?: (message: any) => void;
  onHumanResponse?: (response: any) => void;
  onFileClick?: (file: any) => void;
}> = ({ fragments, isPlaybackMode, isLastGroup, onToolClick, onHumanResponse, onFileClick }) => {
  const { t } = useTranslation(['chat', 'main']);

  if (fragments.length === 0) return null;

  const firstFragment = fragments[0];
  const lastFragmentIndex = fragments.length - 1;

  // Determine message type from fragments
  const isUserMessage = firstFragment.type === 'user';
  const isWorkflowMessage = firstFragment.type === 'thinking' || firstFragment.type === 'agent-task' || firstFragment.type === 'agent-node';
  // Agent group message is identified by the presence of agent-group-header fragment
  const isAgentGroupMessage = fragments.some(f => f.type === 'agent-group-header');
  const isToolMessage = firstFragment.type === 'tool' && !isAgentGroupMessage;
  const isHumanInteractionMessage = firstFragment.type === 'human-interaction' && !isAgentGroupMessage;

  return (
    <div className="message-item mb-4">
      <div className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'}`}>
        <div className={`text-text-01 dark:text-text-01-dark ${isUserMessage ? 'max-w-[80%]' : 'w-full'}`}>
          {isUserMessage && (
            <UserFragmentDisplay
              fragment={firstFragment}
              enableTypewriter={isPlaybackMode && isLastGroup}
            />
          )}

          {isWorkflowMessage && (
            <WorkflowFragmentDisplay
              fragments={fragments}
              isPlaybackMode={isPlaybackMode}
              isLastGroup={isLastGroup}
              lastFragmentIndex={lastFragmentIndex}
            />
          )}

          {isAgentGroupMessage && (
            <AgentGroupFragmentDisplay
              fragments={fragments}
              isPlaybackMode={isPlaybackMode}
              isLastGroup={isLastGroup}
              lastFragmentIndex={lastFragmentIndex}
              onToolClick={onToolClick}
              onHumanResponse={onHumanResponse}
              onFileClick={onFileClick}
            />
          )}

          {isToolMessage && (
            <ToolFragmentDisplay
              fragment={firstFragment}
              onToolClick={onToolClick}
              onFileClick={onFileClick}
            />
          )}

          {isHumanInteractionMessage && (
            <HumanInteractionFragmentDisplay
              fragment={firstFragment}
              onHumanResponse={onHumanResponse}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Render user message fragment
 */
const UserFragmentDisplay: React.FC<{
  fragment: AtomicMessageFragment;
  enableTypewriter: boolean;
}> = ({ fragment, enableTypewriter }) => {
  // Increased limit for better streaming effect (was 150)
  const MAX_TYPEWRITER_LENGTH = 300;
  const shouldUseTypewriter = enableTypewriter && fragment.content.length <= MAX_TYPEWRITER_LENGTH;

  const [typedText] = useTypewriter({
    words: shouldUseTypewriter ? [fragment.content] : [''],
    loop: 1,
    typeSpeed: 15,
    deleteSpeed: 0,
    delaySpeed: 0,
  });

  const displayContent = shouldUseTypewriter ? typedText : fragment.content;

  return (
    <div className="px-4 py-3 rounded-lg bg-message dark:bg-message-dark border border-border-message dark:border-border-message-dark break-words">
      <span className="text-base whitespace-pre-wrap">{displayContent}</span>
    </div>
  );
};

/**
 * Render workflow fragments (thinking + agents + nodes)
 */
const WorkflowFragmentDisplay: React.FC<{
  fragments: AtomicMessageFragment[];
  isPlaybackMode: boolean;
  isLastGroup: boolean;
  lastFragmentIndex: number;
}> = ({ fragments, isPlaybackMode, isLastGroup, lastFragmentIndex }) => {
  const { t } = useTranslation('chat');

  // Separate fragments by type
  const thinkingFragment = fragments.find(f => f.type === 'thinking');
  const agentFragments = fragments.filter(f => f.type === 'agent-task' || f.type === 'agent-node');

  return (
    <div className="workflow-display space-y-4">
      {/* Atlas header */}
      <div className="flex items-center gap-2">
        <Atlas />
        <span className="text-lg font-bold">Atlas</span>
      </div>

      {/* Thinking fragment */}
      {thinkingFragment && (
        <ThinkingFragmentDisplay
          fragment={thinkingFragment}
          enableTypewriter={isPlaybackMode && isLastGroup && fragments.indexOf(thinkingFragment) === lastFragmentIndex}
        />
      )}

      {/* Agent fragments */}
      {agentFragments.length > 0 && (
        <div className="space-y-3">
          {agentFragments.map((fragment, index) => (
            <AgentFragmentDisplay
              key={fragment.id}
              fragment={fragment}
              enableTypewriter={isPlaybackMode && isLastGroup && fragments.indexOf(fragment) === lastFragmentIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Render thinking fragment
 */
const ThinkingFragmentDisplay: React.FC<{
  fragment: AtomicMessageFragment;
  enableTypewriter: boolean;
}> = ({ fragment, enableTypewriter }) => {
  const { t } = useTranslation('chat');

  // Increased limit for better streaming effect (was 150)
  const MAX_TYPEWRITER_LENGTH = 400;
  const shouldUseTypewriter = enableTypewriter && fragment.content.length <= MAX_TYPEWRITER_LENGTH;

  const [typedText] = useTypewriter({
    words: shouldUseTypewriter ? [fragment.content] : [''],
    loop: 1,
    typeSpeed: 25, // Slightly slower for more visible effect
    deleteSpeed: 0,
    delaySpeed: 0,
  });

  const displayText = shouldUseTypewriter ? typedText : fragment.content;

  return (
    <div className="bg-thinking dark:bg-thinking-dark rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <DeepThinking />
        <span className="text-white font-medium text-sm">{t('thinking')}</span>
      </div>
      <div className="text-sm text-text-12 dark:text-text-12-dark leading-relaxed">
        {displayText}
      </div>
    </div>
  );
};

/**
 * Render agent fragment (task or node)
 */
const AgentFragmentDisplay: React.FC<{
  fragment: AtomicMessageFragment;
  enableTypewriter: boolean;
}> = ({ fragment, enableTypewriter }) => {
  const { t } = useTranslation('chat');

  // Increased limit for better streaming effect (was 150)
  const MAX_TYPEWRITER_LENGTH = 300;
  const shouldUseTypewriter = enableTypewriter && fragment.content.length <= MAX_TYPEWRITER_LENGTH;

  const [typedText] = useTypewriter({
    words: shouldUseTypewriter ? [fragment.content] : [''],
    loop: 1,
    typeSpeed: 25, // Slightly slower for more visible effect
    deleteSpeed: 0,
    delaySpeed: 0,
  });

  const displayText = shouldUseTypewriter ? typedText : fragment.content;

  if (fragment.type === 'agent-task') {
    return (
      <div className="px-2 border-l-2 border-text-05 dark:border-text-05-dark">
        <div className="flex items-center gap-1 text-text-05 dark:text-text-05-dark font-semibold">
          <DeepThinking />
          {fragment.data.agentName} {t('agent')}
        </div>
        <div className="mt-1">{displayText}</div>
      </div>
    );
  }

  if (fragment.type === 'agent-node') {
    return (
      <div className="step-item flex items-center justify-start gap-2 mt-3">
        <span className="font-semibold w-5 h-5 bg-step dark:bg-step-dark rounded-full flex items-center justify-center">
          {fragment.data.nodeIndex + 1}
        </span>
        <span className="line-clamp-1 flex-1">{displayText}</span>
      </div>
    );
  }

  return null;
};

/**
 * Render tool fragment
 */
const ToolFragmentDisplay: React.FC<{
  fragment: AtomicMessageFragment;
  onToolClick?: (message: any) => void;
  onFileClick?: (file: any) => void;
}> = ({ fragment, onToolClick, onFileClick }) => {
  const { t } = useTranslation('chat');

  if (!fragment.data?.toolMessage) return null;

  const toolMessage: ToolAction = fragment.data.toolMessage;

  // Tool icon mapping
  const getToolIcon = (toolName?: string) => {
    const name = (toolName || '').toLowerCase();
    if (name.includes('navigate') || name.includes('extract') || name.includes('browser')) return <Browser />;
    if (name.includes('search')) return <Search />;
    if (name.includes('analy') || name.includes('data')) return <DataAnalysis />;
    return <Executing />;
  };

  // Check if tool is currently executing
  const isExecuting = toolMessage.status === 'streaming' || toolMessage.status === 'use' || toolMessage.status === 'running';

  // Extract file information from file_write result
  const getFileInfo = () => {
    if (toolMessage.toolName === 'file_write' && toolMessage.status === 'completed' && toolMessage.result) {
      try {
        let fileInfo = toolMessage.result;

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
        className="inline-flex items-center gap-2 px-3 py-2 bg-tool-call dark:bg-tool-call-dark rounded-md border text-xs border-border-message dark:border-border-message-dark text-text-12 dark:text-text-12-dark cursor-pointer hover:bg-opacity-80 transition-colors"
        onClick={() => onToolClick?.(toolMessage)}
      >
        {getToolIcon(toolMessage.toolName)}
        <span>{t('executing_tool', { toolName: toolMessage.toolName || 'tool' })}</span>
        {/* Only show loading indicator when executing */}
        {isExecuting && (
          <Spin indicator={<LoadingOutlined spin style={{ color: 'currentColor', fontSize: 14 }} />} size="small" />
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

/**
 * Render human interaction fragment
 */
const HumanInteractionFragmentDisplay: React.FC<{
  fragment: AtomicMessageFragment;
  onHumanResponse?: (response: any) => void;
}> = ({ fragment, onHumanResponse }) => {
  if (!fragment.data?.humanMessage) return null;

  return (
    <HumanInteractionCard
      message={fragment.data.humanMessage}
      onResponse={(response) => {
        if (onHumanResponse) {
          onHumanResponse(response);
        }
      }}
    />
  );
};

/**
 * Render text fragment with typewriter effect and Markdown support
 */
const TextFragmentDisplay: React.FC<{
  fragment: AtomicMessageFragment;
  enableTypewriter: boolean;
}> = ({ fragment, enableTypewriter }) => {
  // For AgentGroup text messages, use longer length limit to show streaming effect
  const MAX_TYPEWRITER_LENGTH = 500; // Increased from 150 to 500 for better streaming effect
  const shouldUseTypewriter = enableTypewriter && fragment.content.length <= MAX_TYPEWRITER_LENGTH;

  const [typedText] = useTypewriter({
    words: shouldUseTypewriter ? [fragment.content] : [''],
    loop: 1,
    typeSpeed: 25, // Slightly slower for more visible effect (was 20)
    deleteSpeed: 0,
    delaySpeed: 0,
  });

  // Check if typewriter effect is complete
  const isTypingComplete = !shouldUseTypewriter || typedText === fragment.content;

  // If typing is complete, render with Markdown; otherwise show plain text
  return (
    <div className="mb-3 text-sm text-text-12 dark:text-text-12-dark leading-relaxed markdown-container">
      {isTypingComplete ? (
        <ReactMarkdown>{fragment.content}</ReactMarkdown>
      ) : (
        <span className="whitespace-pre-wrap">{typedText}</span>
      )}
    </div>
  );
};

/**
 * Render agent group fragments (header + messages)
 */
const AgentGroupFragmentDisplay: React.FC<{
  fragments: AtomicMessageFragment[];
  isPlaybackMode: boolean;
  isLastGroup: boolean;
  lastFragmentIndex: number;
  onToolClick?: (message: any) => void;
  onHumanResponse?: (response: any) => void;
  onFileClick?: (file: any) => void;
}> = ({ fragments, isPlaybackMode, isLastGroup, lastFragmentIndex, onToolClick, onHumanResponse, onFileClick }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (fragments.length === 0) return null;

  // Find header fragment
  const headerFragment = fragments.find(f => f.type === 'agent-group-header');
  if (!headerFragment) return null;

  // Get other fragments (text, tool, human-interaction)
  const contentFragments = fragments.filter(f => f.type !== 'agent-group-header');

  const agentName = headerFragment.data?.agentName || 'Agent';
  const status = headerFragment.data?.status || 'running';

  return (
    <div className="agent-group mb-4 mt-10">
      {/* Agent header */}
      <div
        className="flex items-center cursor-pointer transition-colors mb-4"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          {status === 'completed' ? (
            <FinishStatus />
          ) : status === 'error' ? (
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs">✕</span>
            </div>
          ) : (
            <RuningStatus />
          )}
          <span className="font-semibold">{headerFragment.content}</span>
        </div>
        <Button
          type="text"
          size="small"
          icon={isCollapsed ? <ExpandCollapse className=' rotate-180' /> : <ExpandCollapse />}
        />
      </div>

      {/* Agent content */}
      {!isCollapsed && (
        <div className="agent-steps pl-6">
          {contentFragments.map((fragment, index) => {
            const enableTypewriter = isPlaybackMode && isLastGroup && fragments.indexOf(fragment) === lastFragmentIndex;

            if (fragment.type === 'text') {
              return (
                <TextFragmentDisplay
                  key={fragment.id}
                  fragment={fragment}
                  enableTypewriter={enableTypewriter}
                />
              );
            }

            if (fragment.type === 'tool') {
              return (
                <div key={fragment.id} className="mb-3">
                  <ToolFragmentDisplay
                    fragment={fragment}
                    onToolClick={onToolClick}
                    onFileClick={onFileClick}
                  />
                </div>
              );
            }

            if (fragment.type === 'human-interaction') {
              return (
                <div key={fragment.id} className="mb-3">
                  <HumanInteractionFragmentDisplay
                    fragment={fragment}
                    onHumanResponse={onHumanResponse}
                  />
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
};

export default AtomicFragmentRenderer;
