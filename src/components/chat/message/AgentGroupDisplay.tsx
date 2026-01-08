import React, { useState } from 'react';
import { Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { ExpandCollapse, FinishStatus, RuningStatus } from '@/icons/deepfundai-icons';
import { AgentGroupMessage, ToolAction, FileAttachment } from '@/models';
import type { HumanResponseMessage } from '@/models/human-interaction';
import { AgentMessageContent } from './ContentMessage';
import { TokenUsageDisplay } from './TokenUsageDisplay';
import { useTranslation } from 'react-i18next';

interface AgentGroupDisplayProps {
  agentMessage: AgentGroupMessage;
  onToolClick?: (message: ToolAction) => void;
  onHumanResponse?: (response: HumanResponseMessage) => void;
  onFileClick?: (file: FileAttachment) => void;
  onRetry?: () => void;
}

/**
 * Agent Group Display Component
 * Shows grouped agent messages with collapsible execution steps
 */
export const AgentGroupDisplay: React.FC<AgentGroupDisplayProps> = ({
  agentMessage,
  onToolClick,
  onHumanResponse,
  onFileClick,
  onRetry
}) => {
  const { t } = useTranslation('chat');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isError = agentMessage.status === 'error';

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

          {/* Token usage display */}
          <div className="pl-6">
            <TokenUsageDisplay usage={agentMessage.usage} />
          </div>

          {/* Retry button for error status */}
          {isError && onRetry && (
            <div className="pl-6 mt-4">
              <Button
                type="default"
                size="small"
                icon={<ReloadOutlined />}
                onClick={onRetry}
                className="!bg-transparent !border-border-message hover:!border-blue-500 hover:!text-blue-500"
              >
                {t('retry')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
