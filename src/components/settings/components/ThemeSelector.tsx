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
      <div className="text-text-01 dark:text-text-01-dark font-medium mb-3">{label}</div>
      <div className="grid grid-cols-3 gap-3">
        {themes.map(theme => (
          <button
            key={theme.value}
            onClick={() => onChange(theme.value)}
            className={`
              flex flex-col items-center justify-center cursor-pointer
              h-24 rounded-lg border-2 transition-all duration-200
              hover:scale-[1.02] active:scale-[0.98]
              ${value === theme.value
                ? 'border-primary dark:border-purple-400 bg-primary/10 dark:bg-primary/20 shadow-sm shadow-primary/10'
                : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20'
              }
            `}
          >
            <div className={`text-3xl mb-2 transition-colors duration-200 ${value === theme.value ? 'text-primary dark:text-purple-400' : 'text-text-12 dark:text-text-12-dark'}`}>
              {theme.icon}
            </div>
            <div className={`text-sm font-medium transition-colors duration-200 ${value === theme.value ? 'text-text-01 dark:text-text-01-dark' : 'text-gray-700 dark:text-gray-300'}`}>
              {theme.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
