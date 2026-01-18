import React from 'react';
import { Input, Button, App } from 'antd';
import { AudioOutlined, AudioMutedOutlined } from '@ant-design/icons';
import { SendMessage, CancleTask } from '@/icons/deepfundai-icons';
import { useTranslation } from 'react-i18next';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { logger } from '@/utils/logger';

interface ChatInputAreaProps {
  query: string;
  isCurrentTaskRunning: boolean;
  hasValidProvider?: boolean;
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
  hasValidProvider = true,
  onQueryChange,
  onSend,
  onCancel,
}) => {
  const { t } = useTranslation('main');
  const { message: antdMessage } = App.useApp();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!hasValidProvider) {
        antdMessage.warning(t('no_provider_warning') || 'Please configure AI provider in Settings first');
        return;
      }
      onSend();
    }
  };

  // Voice input hook
  const { isRecording, toggleRecording } = useVoiceInput({
    onTextRecognized: (text) => {
      // Append recognized text to input
      onQueryChange(query ? `${query} ${text}` : text);
    },
    onError: (error) => {
      antdMessage.error(t('voice_input_error'));
      logger.error('Voice input error', error, 'ChatInputArea');
    },
  });

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
        {!isCurrentTaskRunning && (
          <Button
            type='text'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleRecording();
            }}
            disabled={isCurrentTaskRunning}
            className='!p-0 !w-8 !h-8 !min-w-0 flex items-center justify-center text-lg'
            title={isRecording ? t('voice_input_stop') : t('voice_input_start')}
          >
            {isRecording ? <AudioOutlined /> : <AudioMutedOutlined />}
          </Button>
        )}
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
            onClick={() => {
              if (!hasValidProvider) {
                antdMessage.warning(t('no_provider_warning') || 'Please configure AI provider in Settings first');
                return;
              }
              onSend();
            }}
            disabled={!query.trim() || !hasValidProvider}
            className='!p-0 !w-8 !h-8 !min-w-0 flex items-center justify-center'
            title={!hasValidProvider ? (t('no_provider_tooltip') || 'Configure AI provider first') : ''}
          >
            <SendMessage />
          </Button>
        )}
      </div>
    </div>
  );
};
