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
import { SettingsTab } from './SettingsLayout';
import clsx from 'clsx';

interface MenuItem {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'general',
    label: 'General',
    icon: <SettingOutlined />
  },
  {
    id: 'providers',
    label: 'Providers',
    icon: <CloudOutlined />
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: <MessageOutlined />
  },
  {
    id: 'agent',
    label: 'Agent',
    icon: <RobotOutlined />
  },
  {
    id: 'scheduled-tasks',
    label: 'Scheduled Tasks',
    icon: <ClockCircleOutlined />
  },
  {
    id: 'user-interface',
    label: 'User Interface',
    icon: <SkinOutlined />
  },
  {
    id: 'network',
    label: 'Network',
    icon: <GlobalOutlined />
  },
  {
    id: 'memory',
    label: 'Memory',
    icon: <BulbOutlined />,
    comingSoon: true
  },
  {
    id: 'about',
    label: 'About',
    icon: <InfoCircleOutlined />
  }
];

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

/**
 * Settings sidebar navigation component
 */
export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeTab,
  onTabChange
}) => {
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
            <span className="flex-1">{item.label}</span>
            {item.comingSoon && (
              <span className="text-xs text-gray-500">Soon</span>
            )}
          </button>
        ))}
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <Button
          block
          className="bg-white/5 border-white/10 text-gray-200 hover:bg-white/10 hover:border-white/20"
        >
          Import Settings
        </Button>
        <Button
          block
          className="bg-white/5 border-white/10 text-gray-200 hover:bg-white/10 hover:border-white/20"
        >
          Export Settings
        </Button>
        <Button
          block
          danger
          className="bg-red-500/10 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50"
        >
          Reset Settings
        </Button>
      </div>
    </div>
  );
};
