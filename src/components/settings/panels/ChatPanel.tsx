/**
 * Chat settings panel
 * INPUT: Settings from parent component
 * OUTPUT: Temperature, tokens, streaming, and other chat parameters
 * POSITION: Third tab in settings window
 */

import React from 'react';
import { MessageOutlined } from '@ant-design/icons';
import { Typography, Divider } from 'antd';
import { SliderSetting, ToggleSetting, InputSetting } from '../components';
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
          <MessageOutlined className="text-3xl text-green-400" />
          <Title level={2} className="!text-white !mb-0">
            Chat
          </Title>
        </div>
        <Paragraph className="!text-gray-300 !mb-0">
          Configure chat parameters and behavior
        </Paragraph>
      </div>

      {/* Card container */}
      <div className="flex-1 min-h-0 p-8 pt-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 h-full flex flex-col">
          {/* Scrollable content inside card */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
        {/* Model Parameters */}
        <div>
          <Text className="!text-white text-lg font-semibold">Model Parameters</Text>
          <div className="mt-4 space-y-4">
            <SliderSetting
              label="Temperature"
              description="Controls randomness in responses. Lower = more focused, higher = more creative"
              value={settings.temperature}
              min={0}
              max={2}
              step={0.1}
              onChange={(value) => handleChange({ temperature: value })}
              marks={{ 0: '0', 1: '1', 2: '2' }}
            />

            <InputSetting
              label="Max Tokens"
              description="Maximum number of tokens in the response"
              value={settings.maxTokens}
              min={1}
              max={8192}
              onChange={(value) => handleChange({ maxTokens: value || 2048 })}
              placeholder="Enter max tokens (1-8192)"
            />
          </div>
        </div>

        <Divider className="!border-white/10" />

        {/* Response Settings */}
        <div>
          <Text className="!text-white text-lg font-semibold">Response Settings</Text>
          <div className="mt-4">
            <ToggleSetting
              label="Enable streaming response"
              description="Display responses word by word as they are generated"
              checked={settings.streaming}
              onChange={(checked) => handleChange({ streaming: checked })}
            />
            <ToggleSetting
              label="Show token usage"
              description="Display token count for each message"
              checked={settings.showTokenUsage}
              onChange={(checked) => handleChange({ showTokenUsage: checked })}
            />
            <ToggleSetting
              label="Enable Markdown rendering"
              description="Render Markdown formatting in chat messages"
              checked={settings.markdownRendering}
              onChange={(checked) => handleChange({ markdownRendering: checked })}
            />
          </div>
        </div>

        <Divider className="!border-white/10" />

        {/* User Experience */}
        <div>
          <Text className="!text-white text-lg font-semibold">User Experience</Text>
          <div className="mt-4">
            <ToggleSetting
              label="Sound effects"
              description="Play sound notifications for new messages"
              checked={settings.soundEffects}
              onChange={(checked) => handleChange({ soundEffects: checked })}
            />
          </div>
        </div>

        <Divider className="!border-white/10" />

        {/* History Settings */}
        <div>
          <Text className="!text-white text-lg font-semibold">History</Text>
          <div className="mt-4 space-y-4">
            <ToggleSetting
              label="Auto-save chat history"
              description="Automatically save conversations for later review"
              checked={settings.autoSaveHistory}
              onChange={(checked) => handleChange({ autoSaveHistory: checked })}
            />

            <InputSetting
              label="History retention days"
              description="Number of days to keep chat history"
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
