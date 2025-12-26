/**
 * General settings panel
 * INPUT: Settings from parent component
 * OUTPUT: Tool model, language, startup, and window settings
 * POSITION: Second tab in settings window (after Providers)
 */

import React, { useMemo } from 'react';
import { SettingOutlined } from '@ant-design/icons';
import { Typography, Divider } from 'antd';
import { SelectSetting, ToggleSetting } from '../components';
import { GeneralSettings, getDefaultGeneralSettings, PROVIDER_INFO, SelectOptionGroup } from '@/models/settings';
import { ProviderConfigs } from '@/utils/config-converter';

const { Title, Paragraph, Text } = Typography;

interface GeneralPanelProps {
  settings?: GeneralSettings;
  onSettingsChange?: (settings: GeneralSettings) => void;
  providers?: ProviderConfigs | null;
}

/**
 * General application settings panel
 */
export const GeneralPanel: React.FC<GeneralPanelProps> = ({
  settings = getDefaultGeneralSettings(),
  onSettingsChange,
  providers
}) => {
  const handleChange = (updates: Partial<GeneralSettings>) => {
    if (onSettingsChange) {
      onSettingsChange({ ...settings, ...updates });
    }
  };

  // Build grouped model options from providers config
  const groupedModelOptions = useMemo((): SelectOptionGroup[] => {
    if (!providers) return [];

    const groups: SelectOptionGroup[] = [];

    Object.entries(providers).forEach(([providerId, config]) => {
      // Only require models to exist, not provider enabled status
      if (!config.models || config.models.length === 0) return;

      const providerName = PROVIDER_INFO[providerId as keyof typeof PROVIDER_INFO]?.name || providerId;
      const enabledModels = config.models.filter(model => model.enabled);

      if (enabledModels.length > 0) {
        groups.push({
          label: providerName,
          options: enabledModels.map(model => ({
            label: model.name || model.id,
            value: model.id
          }))
        });
      }
    });

    return groups;
  }, [providers]);

  const languageOptions = [
    { label: 'English', value: 'en' },
    { label: '中文', value: 'zh' }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header */}
      <div className="flex-shrink-0 p-8 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <SettingOutlined className="text-3xl text-purple-400" />
          <Title level={2} className="!text-white !mb-0">
            General
          </Title>
        </div>
        <Paragraph className="!text-gray-300 !mb-0">
          General application settings and preferences
        </Paragraph>
      </div>

      {/* Card container */}
      <div className="flex-1 min-h-0 p-8 pt-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 h-full flex flex-col">
          {/* Scrollable content inside card */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
        {/* Model Selection */}
        <div>
          <Text className="!text-white text-lg font-semibold">Model</Text>
          <div className="mt-4">
            <SelectSetting
              label="Tool Model"
              description="Model used for automated tasks like thread title generation"
              value={settings.toolModel}
              groupedOptions={groupedModelOptions}
              onChange={(value) => handleChange({ toolModel: value })}
              placeholder={groupedModelOptions.length > 0 ? "Select a model" : "No models available - configure providers first"}
              showSearch
            />
          </div>
        </div>

        <Divider className="!border-white/10" />

        {/* Language */}
        <div>
          <Text className="!text-white text-lg font-semibold">Language</Text>
          <div className="mt-4">
            <SelectSetting
              label="Display Language"
              description="Language for the user interface"
              value={settings.language}
              options={languageOptions}
              onChange={(value) => handleChange({ language: value as 'en' | 'zh' })}
            />
          </div>
        </div>

        <Divider className="!border-white/10" />

        {/* Startup Settings */}
        <div>
          <Text className="!text-white text-lg font-semibold">Startup</Text>
          <div className="mt-4">
            <ToggleSetting
              label="Launch on system startup"
              description="Automatically start AI Browser when your computer starts"
              checked={settings.startup.autoStart}
              onChange={(checked) =>
                handleChange({
                  startup: { ...settings.startup, autoStart: checked }
                })
              }
            />
            <ToggleSetting
              label="Start minimized"
              description="Start the application in the system tray"
              checked={settings.startup.startMinimized}
              onChange={(checked) =>
                handleChange({
                  startup: { ...settings.startup, startMinimized: checked }
                })
              }
            />
          </div>
        </div>

        <Divider className="!border-white/10" />

        {/* Window Behavior */}
        <div>
          <Text className="!text-white text-lg font-semibold">Window Behavior</Text>
          <div className="mt-4">
            <ToggleSetting
              label="Minimize to tray"
              description="Minimize the window to system tray instead of taskbar"
              checked={settings.window.minimizeToTray}
              onChange={(checked) =>
                handleChange({
                  window: { ...settings.window, minimizeToTray: checked }
                })
              }
            />
            <ToggleSetting
              label="Close to tray"
              description="Keep the app running in the background when closing the window"
              checked={settings.window.closeToTray}
              onChange={(checked) =>
                handleChange({
                  window: { ...settings.window, closeToTray: checked }
                })
              }
            />
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
};
