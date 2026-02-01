/**
 * Chat settings panel
 * INPUT: Settings from parent component
 * OUTPUT: Temperature, tokens, streaming, and other chat parameters
 * POSITION: Third tab in settings window
 */

import React from 'react';
import { MessageOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { SliderSetting, ToggleSetting, InputSetting } from '../components';
import { SettingsDivider } from '@/components/ui';
import { ChatSettings } from '@/models/settings';
import { getDefaultChatSettings } from '@/config/settings-defaults';

const { Title, Paragraph, Text } = Typography;

interface ChatPanelProps {
  settings?: ChatSettings;
  onSettingsChange?: (settings: ChatSettings) => void;
}

/**
 * Chat parameters and behavior settings panel
 */
export const ChatPanel: React.FC<ChatPanelProps> = ({
  settings = getDefaultChatSettings(),
  onSettingsChange
}) => {
  const { t } = useTranslation('settings');

  const handleChange = (updates: Partial<ChatSettings>) => {
    if (onSettingsChange) {
      onSettingsChange({ ...settings, ...updates });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header */}
      <div className="flex-shrink-0 p-8 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <MessageOutlined className="text-3xl text-primary dark:text-purple-400" />
          <Title level={2} className="!text-text-01 dark:!text-text-01-dark !mb-0">
            {t('chat.title')}
          </Title>
        </div>
        <Paragraph className="!text-text-12 dark:!text-text-12-dark !mb-0">
          {t('chat.description')}
        </Paragraph>
      </div>

      {/* Card container */}
      <div className="flex-1 min-h-0 p-8 pt-6">
        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/10 h-full flex flex-col">
          {/* Scrollable content inside card */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
        {/* Model Parameters */}
        <div>
          <Text className="!text-text-01 dark:!text-text-01-dark text-lg font-semibold">{t('chat.model_parameters')}</Text>
          <div className="mt-4 space-y-4">
            <SliderSetting
              label={t('chat.temperature')}
              description={t('chat.temperature_desc')}
              value={settings.temperature}
              min={0}
              max={2}
              step={0.1}
              onChange={(value) => handleChange({ temperature: value })}
              marks={{ 0: '0', 1: '1', 2: '2' }}
            />

            <InputSetting
              label={t('chat.max_tokens')}
              description={t('chat.max_tokens_desc')}
              value={settings.maxTokens}
              min={1}
              max={128000}
              onChange={(value) => handleChange({ maxTokens: value || 8192 })}
              placeholder="1-128000 (depends on model limit)"
            />
          </div>
        </div>

        <SettingsDivider />

        {/* Response Settings */}
        <div>
          <Text className="!text-text-01 dark:!text-text-01-dark text-lg font-semibold">{t('chat.response_settings')}</Text>
          <div className="mt-4">
            <ToggleSetting
              label={t('chat.show_token_usage')}
              description={t('chat.show_token_usage_desc')}
              checked={settings.showTokenUsage}
              onChange={(checked) => handleChange({ showTokenUsage: checked })}
            />
          </div>
        </div>

        <SettingsDivider />

        {/* History Settings */}
        <div>
          <Text className="!text-text-01 dark:!text-text-01-dark text-lg font-semibold">{t('chat.history_settings')}</Text>
          <div className="mt-4 space-y-4">
            <ToggleSetting
              label={t('chat.auto_save_history')}
              description={t('chat.auto_save_history_desc')}
              checked={settings.autoSaveHistory}
              onChange={(checked) => handleChange({ autoSaveHistory: checked })}
            />

            <InputSetting
              label={t('chat.history_retention_days')}
              description={t('chat.history_retention_days_desc')}
              value={settings.historyRetentionDays}
              min={1}
              max={365}
              onChange={(value) =>
                handleChange({ historyRetentionDays: value || 30 })
              }
              placeholder="Enter days (1-365)"
              unit="days"
            />
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
};
