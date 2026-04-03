import React, { useState } from 'react';
import { Spin } from 'antd';
import { LoadingOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { Executing, Browser, Search, DataAnalysis } from '@/icons/deepfundai-icons';
import { ToolAction, FileAttachment } from '@/models';
import type { HumanRequestMessage, HumanResponseMessage } from '@/models/human-interaction';
import { HumanInteractionCard } from '../HumanInteractionCard';
import { useTranslation } from 'react-i18next';
import { uuidv4 } from '@/utils/uuid';

interface ToolDisplayProps {
  message: ToolAction;
  onToolClick: (message: ToolAction) => void;
  onHumanResponse?: (response: HumanResponseMessage) => void;
  onFileClick?: (file: FileAttachment) => void;
}

/**
 * Tool Display Component
 * Shows tool execution status and results
 */
export const ToolDisplay: React.FC<ToolDisplayProps> = ({
  message,
  onToolClick,
  onHumanResponse,
  onFileClick
}) => {
  const { t } = useTranslation('chat');
  const [expanded, setExpanded] = useState(false);

  // Special handling for human_interact tool
  if (message.toolName === 'human_interact' && message.params) {
    // Type assertion for human_interact params
    const params = message.params as {
      taskId?: string;
      interactType?: string;
      prompt?: string;
      selectOptions?: string[];
      selectMultiple?: boolean;
      helpType?: string;
      context?: any;
    };

    // Convert ToolAction to HumanRequestMessage format
    const humanMessage: HumanRequestMessage = {
      type: 'human_interaction',
      requestId: message.id, // Use toolCallId as requestId
      taskId: params.taskId,
      agentName: message.agentName,
      interactType: (params.interactType as any) || 'request_help',
      prompt: params.prompt || '',
      selectOptions: params.selectOptions,
      selectMultiple: params.selectMultiple,
      helpType: (params.helpType as any),
      context: params.context,
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

  const hasDetail = message.status === 'completed' && (message.params || message.result);

  // Format detail content for display
  const formatDetail = (data: unknown): string => {
    if (data === null || data === undefined) return '';
    if (typeof data === 'string') return data;
    try { return JSON.stringify(data, null, 2); } catch { return String(data); }
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => !prev);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="inline-flex items-center gap-2">
        <div
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer transition-all duration-200
            bg-gray-50 dark:bg-tool-call-dark
            border border-gray-200 dark:border-border-message-dark
            text-gray-600 dark:text-text-12-dark
            hover:bg-gray-100 dark:hover:bg-white/10
            hover:border-purple-300 dark:hover:border-purple-500/30
            hover:shadow-sm dark:hover:shadow-[0_0_12px_rgba(145,75,241,0.15)]"
          onClick={() => onToolClick(message)}
        >
          {getToolIcon(message.toolName)}
          <span>{t('executing_tool', { toolName: message.toolName || 'tool' })}</span>
          {isExecuting && (
            <Spin indicator={<LoadingOutlined spin style={{ color: 'currentColor', fontSize: 14 }} />} size="small" />
          )}
        </div>

        {/* Expand/collapse toggle — outside onToolClick to avoid event conflict */}
        {hasDetail && (
          <span
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
            onClick={toggleExpand}
          >
            {expanded ? <DownOutlined style={{ fontSize: 10 }} /> : <RightOutlined style={{ fontSize: 10 }} />}
          </span>
        )}

        {/* File link for file_write tool */}
        {fileInfo && (
          <div
            className="text-xs cursor-pointer transition-colors duration-200 flex items-center gap-1
              text-blue-500 dark:text-blue-400
              hover:text-blue-600 dark:hover:text-blue-300"
            onClick={handleFileLinkClick}
          >
            {fileInfo.fileName}
          </div>
        )}
      </div>

      {/* Expandable detail panel */}
      {expanded && hasDetail && (
        <div className="ml-2 px-3 py-2 rounded-lg text-xs font-mono whitespace-pre-wrap break-all max-h-60 overflow-y-auto
          bg-gray-50 dark:bg-[#1a1a2e] border border-gray-200 dark:border-border-message-dark
          text-gray-600 dark:text-gray-400">
          {message.params && (
            <div className="mb-2">
              <span className="text-gray-400 dark:text-gray-500">Params:</span>
              <pre className="mt-1">{formatDetail(message.params)}</pre>
            </div>
          )}
          {message.result && (
            <div>
              <span className="text-gray-400 dark:text-gray-500">Result:</span>
              <pre className="mt-1">{formatDetail(message.result)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
