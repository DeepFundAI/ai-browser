import React from 'react';
import { App } from 'antd';
import { SettingsLayout } from '@/components/settings/SettingsLayout';

/**
 * Settings Page Component
 * Centralized configuration interface for all application settings
 */
export default function SettingsPage() {
  return (
    <App>
      <div className="min-h-screen h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] flex flex-col">
        {/* Draggable header area for window control */}
        <div
          className="h-12 w-full flex-shrink-0"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        />

        {/* Main settings content */}
        <div className="flex-1 overflow-hidden">
          <SettingsLayout initialTab="providers" />
        </div>
      </div>
    </App>
  );
}
