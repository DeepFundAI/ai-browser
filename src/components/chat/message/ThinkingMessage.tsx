import React, { useState } from 'react';
import { Button } from 'antd';
import { ExpandCollapse, DeepThinking, FinishStatus } from '@/icons/deepfundai-icons';
import { useTranslation } from 'react-i18next';

interface ThinkingDisplayProps {
  content: string;
  isCompleted?: boolean;
}

/**
 * Thinking Display Component
 * Shows the AI's thinking process with collapsible content
 */
export const ThinkingDisplay: React.FC<ThinkingDisplayProps> = ({
  content,
  isCompleted = false
}) => {
  const { t } = useTranslation('chat');
  const [collapsed, setCollapsed] = useState(false);

  // Data-driven: content is already streaming from PlaybackEngine
  const displayText = content;

  return (
    <div className="bg-thinking dark:bg-thinking-dark rounded-lg p-4">
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
          <span className="text-text-01 dark:text-text-01-dark font-medium text-sm">{t('thinking')}</span>
        </div>
        <Button
          type="text"
          size="small"
          icon={collapsed ? <ExpandCollapse className=' rotate-180' /> : <ExpandCollapse />}
          className="!text-text-12 dark:!text-text-12-dark hover:!text-text-01 dark:hover:!text-text-01-dark"
        />
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="text-sm text-text-12 dark:text-text-12-dark leading-relaxed">
          {displayText}
        </div>
      )}
    </div>
  );
};
