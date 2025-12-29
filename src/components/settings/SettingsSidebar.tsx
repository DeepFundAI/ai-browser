import React from 'react';
import {
  SettingOutlined,
  CloudOutlined,
  MessageOutlined,
  RobotOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  SkinOutlined,
  GlobalOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { SettingsTab } from './SettingsLayout';
import clsx from 'clsx';

interface MenuItem {
  id: SettingsTab;
  labelKey: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  onImport: () => void;
  onExport: () => void;
  onReset: () => void;
}

/**
 * Settings sidebar navigation component
 */
export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeTab,
  onTabChange,
  onImport,
  onExport,
  onReset
}) => {
  const { t } = useTranslation('settings');

  const MENU_ITEMS: MenuItem[] = [
    {
      id: 'general',
      labelKey: 'sidebar.general',
      icon: <SettingOutlined />
    },
    {
      id: 'providers',
      labelKey: 'sidebar.providers',
      icon: <CloudOutlined />
    },
    {
      id: 'chat',
      labelKey: 'sidebar.chat',
      icon: <MessageOutlined />
    },
    {
      id: 'agent',
      labelKey: 'sidebar.agent',
      icon: <RobotOutlined />
    },
    {
      id: 'scheduled-tasks',
      labelKey: 'sidebar.scheduled_tasks',
      icon: <ClockCircleOutlined />
    },
    {
      id: 'user-interface',
      labelKey: 'sidebar.user_interface',
      icon: <SkinOutlined />
    },
    {
      id: 'network',
      labelKey: 'sidebar.network',
      icon: <GlobalOutlined />
    },
    {
      id: 'memory',
      labelKey: 'sidebar.memory',
      icon: <BulbOutlined />,
      comingSoon: true
    },
    {
      id: 'about',
      labelKey: 'sidebar.about',
      icon: <InfoCircleOutlined />
    }
  ];

  return (
    <div
      className="w-60 bg-white/5 backdrop-blur-sm border-r border-white/10 flex flex-col"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {/* macOS traffic light spacer */}
      <div className="h-12" />

      {/* Menu items */}
      <div className="flex-1 py-4 px-3 overflow-y-auto">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all duration-200',
              'text-left text-sm font-medium',
              activeTab === item.id
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-gray-300 hover:bg-white/5 hover:text-white border border-transparent',
              item.comingSoon && 'opacity-60'
            )}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="flex-1">{t(item.labelKey)}</span>
            {item.comingSoon && (
              <span className="text-xs text-gray-500">{t('sidebar.coming_soon')}</span>
            )}
          </button>
        ))}
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <Button
          block
          onClick={onImport}
          className="bg-white/5 border-white/10 text-gray-200 hover:bg-white/10 hover:border-white/20"
        >
          {t('import')}
        </Button>
        <Button
          block
          onClick={onExport}
          className="bg-white/5 border-white/10 text-gray-200 hover:bg-white/10 hover:border-white/20"
        >
          {t('export')}
        </Button>
        <Button
          block
          danger
          onClick={onReset}
          className="bg-red-500/10 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50"
        >
          {t('reset_settings')}
        </Button>
      </div>
    </div>
  );
};
