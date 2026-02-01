/**
 * General settings panel
 * INPUT: Settings from parent component
 * OUTPUT: Language, startup, and window settings
 * POSITION: Second tab in settings window (after Providers)
 */

import React from 'react';
import { SettingOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { SelectSetting, ToggleSetting } from '../components';
import { SettingsDivider } from '@/components/ui';
import { GeneralSettings } from '@/models/settings';
import { getDefaultGeneralSettings } from '@/config/settings-defaults';

const { Title, Paragraph, Text } = Typography;

interface GeneralPanelProps {
  settings?: GeneralSettings;
  onSettingsChange?: (settings: GeneralSettings) => void;
}

/**
 * General application settings panel
 */
export const GeneralPanel: React.FC<GeneralPanelProps> = ({
  settings = getDefaultGeneralSettings(),
  onSettingsChange
}) => {
  const { t } = useTranslation('settings');

  const handleChange = (updates: Partial<GeneralSettings>) => {
    if (onSettingsChange) {
      onSettingsChange({ ...settings, ...updates });
    }
  };

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
          <Title level={2} className="!text-text-01 dark:!text-text-01-dark !mb-0">
            {t('general.title')}
          </Title>
        </div>
        <Paragraph className="!text-text-12 dark:!text-text-12-dark !mb-0">
          {t('general.description')}
        </Paragraph>
      </div>

      {/* Card container */}
      <div className="flex-1 min-h-0 p-8 pt-6">
        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/10 h-full flex flex-col">
          {/* Scrollable content inside card */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
        {/* Language */}
        <div>
          <Text className="!text-text-01 dark:!text-text-01-dark text-lg font-semibold">{t('general.language')}</Text>
          <div className="mt-4">
            <SelectSetting
              label={t('general.language')}
              description={t('general.language_desc')}
              value={settings.language}
              options={languageOptions}
              onChange={(value) => handleChange({ language: value as 'en' | 'zh' })}
            />
          </div>
        </div>

        <SettingsDivider />

        {/* Startup Settings */}
        <div>
          <Text className="!text-text-01 dark:!text-text-01-dark text-lg font-semibold">{t('general.startup_settings')}</Text>
          <div className="mt-4">
            <ToggleSetting
              label={t('general.auto_start')}
              description={t('general.auto_start_desc')}
              checked={settings.startup.autoStart}
              onChange={(checked) =>
                handleChange({
                  startup: { ...settings.startup, autoStart: checked }
                })
              }
            />
            <ToggleSetting
              label={t('general.start_minimized')}
              description={t('general.start_minimized_desc')}
              checked={settings.startup.startMinimized}
              onChange={(checked) =>
                handleChange({
                  startup: { ...settings.startup, startMinimized: checked }
                })
              }
            />
          </div>
        </div>

        <SettingsDivider />

        {/* Window Behavior */}
        <div>
          <Text className="!text-text-01 dark:!text-text-01-dark text-lg font-semibold">{t('general.window_behavior')}</Text>
          <div className="mt-4">
            <ToggleSetting
              label={t('general.minimize_to_tray')}
              description={t('general.minimize_to_tray_desc')}
              checked={settings.window.minimizeToTray}
              onChange={(checked) =>
                handleChange({
                  window: { ...settings.window, minimizeToTray: checked }
                })
              }
            />
            <ToggleSetting
              label={t('general.close_to_tray')}
              description={t('general.close_to_tray_desc')}
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
