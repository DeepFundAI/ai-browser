/**
 * Theme selector component with icon buttons
 * INPUT: Current theme value, onChange handler
 * OUTPUT: Three large theme buttons (Light/Dark/System)
 * POSITION: Used in UserInterfacePanel
 */

import React from 'react';
import { BulbOutlined, MoonOutlined, DesktopOutlined } from '@ant-design/icons';

interface ThemeSelectorProps {
  label: string;
  value: 'light' | 'dark' | 'system';
  onChange: (value: 'light' | 'dark' | 'system') => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  label,
  value,
  onChange
}) => {
  const themes = [
    { value: 'light' as const, label: 'Light', icon: <BulbOutlined /> },
    { value: 'dark' as const, label: 'Dark', icon: <MoonOutlined /> },
    { value: 'system' as const, label: 'System', icon: <DesktopOutlined /> }
  ];

  return (
    <div>
      <div className="text-white font-medium mb-3">{label}</div>
      <div className="grid grid-cols-3 gap-3">
        {themes.map(theme => (
          <button
            key={theme.value}
            onClick={() => onChange(theme.value)}
            className={`
              flex flex-col items-center justify-center
              h-24 rounded-lg border-2 transition-all
              ${value === theme.value
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
              }
            `}
          >
            <div className={`text-3xl mb-2 ${value === theme.value ? 'text-blue-400' : 'text-gray-400'}`}>
              {theme.icon}
            </div>
            <div className={`text-sm font-medium ${value === theme.value ? 'text-white' : 'text-gray-300'}`}>
              {theme.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
