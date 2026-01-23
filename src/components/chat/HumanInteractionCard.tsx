import React, { useState } from 'react';
import { Button, Input, Radio, Checkbox, Space } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { HumanRequestMessage, HumanResponseMessage } from '@/models/human-interaction';
import { cn } from '@/utils/cn';

interface HumanInteractionCardProps {
  message: HumanRequestMessage;
  onResponse: (response: HumanResponseMessage) => void;
}

// Reusable style constants - theme aware
const CARD_BASE = "border rounded-lg p-3 backdrop-blur-xl transition-all duration-200";
const CARD_PENDING = "bg-orange-50 dark:bg-[rgba(60,45,30,0.4)] border-orange-200 dark:border-[rgba(251,146,60,0.3)]";
const CARD_COMPLETED = "bg-emerald-50 dark:bg-[rgba(16,185,129,0.1)] border-emerald-200 dark:border-[rgba(16,185,129,0.3)] opacity-80";
const BADGE_PENDING = "text-orange-500 dark:text-[rgba(251,146,60,1)]";
const BADGE_COMPLETED = "text-emerald-500 dark:text-[rgba(16,185,129,1)]";

/**
 * Human Interaction Card Component
 * Displays interactive UI for AI agent requesting user intervention
 */
export const HumanInteractionCard: React.FC<HumanInteractionCardProps> = ({
  message,
  onResponse
}) => {
  const [completed, setCompleted] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Handle user response
  const handleResponse = (success: boolean, result?: any, error?: string) => {
    setCompleted(true);
    onResponse({
      requestId: message.requestId,
      success,
      result,
      error
    });
  };

  // Confirm type: Yes/No confirmation
  if (message.interactType === 'confirm') {
    return (
      <div className={cn(CARD_BASE, CARD_PENDING, "rounded-xl p-5")}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">⚠️</span>
          <span className={cn("text-base font-semibold uppercase tracking-wide", BADGE_PENDING)}>Task Pending</span>
        </div>
        <p className="text-text-01 dark:text-text-01-dark text-[15px] leading-relaxed mb-4">{message.prompt}</p>
        <Space>
          <Button
            type="primary"
            onClick={() => handleResponse(true, true)}
            disabled={completed}
          >
            Confirm
          </Button>
          <Button
            onClick={() => handleResponse(true, false)}
            disabled={completed}
          >
            Cancel
          </Button>
        </Space>
      </div>
    );
  }

  // Input type: Text input
  if (message.interactType === 'input') {
    return (
      <div className={cn(CARD_BASE, completed ? CARD_COMPLETED : CARD_PENDING)}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">{completed ? '✓' : '⚠️'}</span>
          <span className={cn("text-sm font-semibold uppercase tracking-wide", completed ? BADGE_COMPLETED : BADGE_PENDING)}>
            {completed ? 'Completed' : 'Task Pending'}
          </span>
        </div>
        <p className="text-text-01 dark:text-text-01-dark text-sm leading-relaxed mb-3">{message.prompt}</p>
        <Input.TextArea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={completed}
          placeholder="Please enter your response..."
          rows={2}
          className="!bg-white dark:!bg-[rgba(255,255,255,0.05)] !border-gray-200 dark:!border-[rgba(255,255,255,0.15)] !text-text-01 dark:!text-text-01-dark !text-sm !rounded-lg focus:!bg-gray-50 dark:focus:!bg-[rgba(255,255,255,0.08)] focus:!border-primary dark:focus:!border-[rgba(59,130,246,0.5)] focus:!shadow-[0_0_0_2px_rgba(94,49,216,0.15)]"
        />
        <Button
          type="primary"
          size="small"
          onClick={() => handleResponse(true, inputValue)}
          disabled={completed || !inputValue.trim()}
          className="mt-2"
        >
          Submit
        </Button>
      </div>
    );
  }

  // Select type: Single or multiple selection
  if (message.interactType === 'select') {
    return (
      <div className={cn(CARD_BASE, completed ? CARD_COMPLETED : CARD_PENDING)}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">{completed ? '✓' : '⚠️'}</span>
          <span className={cn("text-sm font-semibold uppercase tracking-wide", completed ? BADGE_COMPLETED : BADGE_PENDING)}>
            {completed ? 'Completed' : 'Task Pending'}
          </span>
        </div>
        <p className="text-text-01 dark:text-text-01-dark text-sm leading-relaxed mb-3">{message.prompt}</p>
        <div className="mb-2">
          {message.selectMultiple ? (
            <Checkbox.Group
              options={message.selectOptions?.map(opt => ({ label: opt, value: opt }))}
              value={selectedOptions}
              onChange={(checkedValues: any) => setSelectedOptions(checkedValues as string[])}
              disabled={completed}
              className="w-full text-sm"
            />
          ) : (
            <Radio.Group
              options={message.selectOptions?.map(opt => ({ label: opt, value: opt }))}
              value={selectedOptions[0]}
              onChange={(e) => setSelectedOptions([e.target.value])}
              disabled={completed}
              className="w-full text-sm"
            />
          )}
        </div>
        <Button
          type="primary"
          size="small"
          onClick={() => handleResponse(true, selectedOptions)}
          disabled={completed || selectedOptions.length === 0}
          className="mt-2"
        >
          Submit
        </Button>
      </div>
    );
  }

  // Request help type: User assistance required (login, captcha, etc.)
  if (message.interactType === 'request_help') {
    return (
      <div className={cn(CARD_BASE, completed ? CARD_COMPLETED : CARD_PENDING)}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">{completed ? '✓' : '⚠️'}</span>
          <span className={cn("text-sm font-semibold uppercase tracking-wide", completed ? BADGE_COMPLETED : BADGE_PENDING)}>
            {completed ? 'Completed' : 'Task Pending'}
          </span>
        </div>
        <p className="text-text-01 dark:text-text-01-dark text-sm leading-relaxed mb-3">{message.prompt}</p>

        {/* Site card for login scenarios */}
        {message.context?.siteName && (
          <div
            className="bg-gray-50 dark:bg-[rgba(255,255,255,0.08)] border border-gray-200 dark:border-[rgba(255,255,255,0.12)] rounded-lg p-2 px-3 flex items-center justify-between mb-3 cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-[rgba(255,255,255,0.12)] hover:border-purple-300 dark:hover:border-[rgba(59,130,246,0.4)]"
            onClick={() => {
              if (message.context?.actionUrl) {
                console.log('Navigating to:', message.context.actionUrl);
              }
            }}
          >
            <div className="flex items-center gap-2">
              {message.context?.siteIcon && (
                <img
                  src={message.context.siteIcon}
                  alt={message.context.siteName}
                  className="w-5 h-5 rounded"
                />
              )}
              <span className="text-text-01 dark:text-text-01-dark text-sm font-medium">{message.context.siteName}</span>
            </div>
            <Button type="primary" size="small">
              Go to login
            </Button>
          </div>
        )}

        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleResponse(true, true)}
            disabled={completed}
          >
            Done
          </Button>
          <Button
            size="small"
            icon={<CloseOutlined />}
            onClick={() => handleResponse(true, false)}
            disabled={completed}
          >
            Skip
          </Button>
        </Space>
      </div>
    );
  }

  return null;
};
