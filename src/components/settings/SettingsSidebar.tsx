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
      className="w-60 bg-gray-50 dark:bg-white/5 backdrop-blur-sm border-r border-gray-200 dark:border-white/10 flex flex-col"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {/* Menu items */}
      <div className="flex-1 py-4 px-3 overflow-y-auto">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 cursor-pointer',
              'text-left text-sm font-medium relative',
              'transition-all duration-200 ease-in-out',
              'hover:scale-[1.02] active:scale-[0.98]',
              activeTab === item.id
                ? 'bg-primary/10 dark:bg-primary/15 text-primary dark:text-purple-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white',
              item.comingSoon && 'opacity-60'
            )}
          >
            {activeTab === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
            )}
            <span className={clsx(
              'text-lg transition-transform duration-200',
              activeTab === item.id && 'scale-110'
            )}>
              {item.icon}
            </span>
            <span className="flex-1">{t(item.labelKey)}</span>
            {item.comingSoon && (
              <span className="text-xs text-gray-500">{t('sidebar.coming_soon')}</span>
            )}
          </button>
        ))}
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-gray-200 dark:border-white/10 space-y-2">
        <Button
          block
          onClick={onImport}
          className="!bg-gray-100 dark:!bg-white/5 !border-gray-300 dark:!border-white/10 !text-gray-700 dark:!text-gray-200 hover:!bg-gray-200 dark:hover:!bg-white/10 hover:!border-gray-400 dark:hover:!border-white/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          {t('import')}
        </Button>
        <Button
          block
          onClick={onExport}
          className="!bg-gray-100 dark:!bg-white/5 !border-gray-300 dark:!border-white/10 !text-gray-700 dark:!text-gray-200 hover:!bg-gray-200 dark:hover:!bg-white/10 hover:!border-gray-400 dark:hover:!border-white/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          {t('export')}
        </Button>
        <Button
          block
          danger
          onClick={onReset}
          className="bg-red-500/10 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          {t('reset_settings')}
        </Button>
      </div>
    </div>
  );
};
