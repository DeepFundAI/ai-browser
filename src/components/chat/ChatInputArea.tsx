import React from 'react';
import { Input, Button } from 'antd';
import { SendMessage, CancleTask } from '@/icons/deepfundai-icons';
import { useTranslation } from 'react-i18next';

interface ChatInputAreaProps {
  query: string;
  isCurrentTaskRunning: boolean;
  onQueryChange: (value: string) => void;
  onSend: () => void;
  onCancel: () => void;
}

/**
 * Chat input area component
 * Handles message input and send/cancel actions
 */
export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  query,
  isCurrentTaskRunning,
  onQueryChange,
  onSend,
  onCancel,
}) => {
  const { t } = useTranslation('main');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className='h-30 gradient-border relative'>
      <Input.TextArea
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('input_placeholder') || '请输入你的问题...'}
        autoSize={{ minRows: 1, maxRows: 4 }}
        className='!bg-transparent border-none !resize-none !outline-none placeholder-text-04-dark focus:!shadow-none !text-base'
        style={{
          paddingTop: '16px',
          paddingBottom: '16px',
          paddingLeft: '14px',
          paddingRight: '60px',
        }}
      />
      <div className='absolute bottom-4 right-4 flex items-center gap-2'>
        {isCurrentTaskRunning ? (
          <Button
            type='text'
            onClick={onCancel}
            className='!p-0 !w-8 !h-8 !min-w-0 flex items-center justify-center'
          >
            <CancleTask />
          </Button>
        ) : (
          <Button
            type='text'
            onClick={onSend}
            disabled={!query.trim()}
            className='!p-0 !w-8 !h-8 !min-w-0 flex items-center justify-center'
          >
            <SendMessage />
          </Button>
        )}
      </div>
    </div>
  );
};
