import React from 'react';
import { Typography } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

/**
 * Settings Page Component
 * Centralized configuration interface for all application settings
 */
export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e]">
      {/* Draggable header area for window control */}
      <div
        className="h-12 w-full"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />

      <div className="px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div
            className="flex items-center gap-4 mb-8"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <SettingOutlined className="text-4xl text-purple-400" />
            <Title level={1} className="!text-white !mb-0">
              Settings
            </Title>
          </div>

          {/* Temporary placeholder content */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-12">
            <div className="text-center">
              <Title level={2} className="!text-white">
                Settings Window Test
              </Title>
              <Paragraph className="!text-gray-300 !text-lg">
                Settings window opened successfully! 🎉
              </Paragraph>
              <Paragraph className="!text-gray-400">
                This is a placeholder page. The full settings interface will be implemented in phases.
              </Paragraph>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
