/**
 * User interface settings panel
 * INPUT: Settings from parent component
 * OUTPUT: Theme, font size, density, sidebar width, and editor settings
 * POSITION: UI tab in settings window
 */

import React from 'react';
import { SkinOutlined } from '@ant-design/icons';
import { Typography, Divider, InputNumber, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { ToggleSetting, ThemeSelector, DensitySelector } from '../components';
import { UISettings } from '@/models/settings';
import { getDefaultUISettings } from '@/config/settings-defaults';

const { Title, Paragraph, Text } = Typography;

interface UserInterfacePanelProps {
  settings?: UISettings;
  onSettingsChange?: (settings: UISettings) => void;
}

/**
 * User interface appearance and layout settings panel
 */
export const UserInterfacePanel: React.FC<UserInterfacePanelProps> = ({
  settings = getDefaultUISettings(),
  onSettingsChange
}) => {
  const { t } = useTranslation('settings');

  const handleChange = (updates: Partial<UISettings>) => {
    if (onSettingsChange) {
      onSettingsChange({ ...settings, ...updates });
    }
  };

  const handleEditorChange = (updates: Partial<UISettings['editor']>) => {
    if (onSettingsChange) {
      onSettingsChange({
        ...settings,
        editor: { ...settings.editor, ...updates }
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header */}
      <div className="flex-shrink-0 p-8 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <SkinOutlined className="text-3xl text-primary dark:text-purple-400" />
          <Title level={2} className="!text-text-01 dark:!text-text-01-dark !mb-0">
            {t('ui.title')}
          </Title>
        </div>
        <Paragraph className="!text-text-12 dark:!text-text-12-dark !mb-0">
          {t('ui.description')}
        </Paragraph>
      </div>

      {/* Card container */}
      <div className="flex-1 min-h-0 p-8 pt-6">
        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/10 h-full flex flex-col">
          {/* Scrollable content inside card */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-8">
            {/* Theme */}
            <ThemeSelector
              label={t('ui.theme')}
              value={settings.theme}
              onChange={(value) => handleChange({ theme: value })}
            />

            <Divider className="!border-gray-200 dark:border-white/10" />

            {/* Font Settings */}
            <div>
              <Text className="!text-text-01 dark:!text-text-01-dark text-lg font-semibold">{t('ui.font_size')}</Text>
              <div className="mt-4">
                <div>
                  <div className="text-text-01 dark:text-text-01-dark font-medium mb-2">{t('ui.font_size')}</div>
                  <div className="flex items-center gap-2">
                    <Space.Compact>
                      <InputNumber
                        value={settings.fontSize}
                        min={10}
                        max={32}
                        onChange={(value) => handleChange({ fontSize: value || 14 })}
                        className="w-24"
                      />
                      <div className="flex items-center px-3 bg-gray-100 dark:bg-white/10 border border-l-0 border-gray-300 dark:border-white/20 rounded-r text-sm text-gray-600 dark:text-gray-400">
                        px
                      </div>
                    </Space.Compact>
                  </div>
                  <div className="text-gray-400 text-xs mt-1">{t('ui.font_size_desc')}</div>
                </div>
              </div>
            </div>

            <Divider className="!border-gray-200 dark:border-white/10" />

            {/* Layout Settings */}
            <div>
              <Text className="!text-text-01 dark:!text-text-01-dark text-lg font-semibold">{t('ui.density')}</Text>
              <div className="mt-4">
                <DensitySelector
                  label={t('ui.density')}
                  value={settings.density}
                  onChange={(value) => handleChange({ density: value })}
                />
              </div>
            </div>

            <Divider className="!border-gray-200 dark:border-white/10" />

            {/* Editor Settings */}
            <div>
              <Text className="!text-text-01 dark:!text-text-01-dark text-lg font-semibold">{t('ui.editor_settings')}</Text>
              <div className="mt-4 space-y-2">
                <ToggleSetting
                  label={t('ui.show_line_numbers')}
                  description={t('ui.show_line_numbers_desc')}
                  checked={settings.editor.showLineNumbers}
                  onChange={(checked) => handleEditorChange({ showLineNumbers: checked })}
                />
                <ToggleSetting
                  label={t('ui.word_wrap')}
                  description={t('ui.word_wrap_desc')}
                  checked={settings.editor.wordWrap}
                  onChange={(checked) => handleEditorChange({ wordWrap: checked })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
