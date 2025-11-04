import React from 'react';
import {
  Input,
  Card,
  Button,
  Space,
  Spin
} from "antd";
import {
  SendOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { TextArea } = Input;

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (value: string) => void;
  sendMessage: () => void;
  isLoading: boolean;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export const ChatInput = ({
  inputMessage,
  setInputMessage,
  sendMessage,
  isLoading,
  onKeyPress
}: ChatInputProps) => {
  const { t } = useTranslation('chat');

  return (
    <Card>
      <Space.Compact style={{ width: '100%' }}>
        <TextArea
          placeholder={t('input_placeholder')}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={onKeyPress}
          disabled={isLoading}
          autoSize={{ minRows: 1, maxRows: 4 }}
          style={{ resize: 'none' }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={isLoading}
          onClick={sendMessage}
          disabled={!inputMessage.trim() || isLoading}
          style={{ height: 'auto', minHeight: '32px' }}
        >
          {t('send')}
        </Button>
      </Space.Compact>

      {isLoading && (
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          <Space>
            <Spin size="small" />
            <span style={{ color: '#999', fontSize: '14px' }}>{t('ai_thinking')}</span>
          </Space>
        </div>
      )}
    </Card>
  );
}; 