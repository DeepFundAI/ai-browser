/**
 * Theme selector component with icon buttons
 * INPUT: Current theme value, onChange handler
 * OUTPUT: Three large theme buttons (Light/Dark/System)
 * POSITION: Used in UserInterfacePanel
 */

import React from 'react';
import { BulbOutlined, MoonOutlined, DesktopOutlined } from '@ant-design/icons';
import { SelectableCard } from '@/components/ui';

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
          <SelectableCard
            key={theme.value}
            selected={value === theme.value}
            onClick={() => onChange(theme.value)}
            className="h-24"
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className={`text-3xl mb-2 transition-colors duration-200 ${value === theme.value ? 'text-primary dark:text-purple-400' : 'text-text-12 dark:text-text-12-dark'}`}>
                {theme.icon}
              </div>
              <div className={`text-sm font-medium transition-colors duration-200 ${value === theme.value ? 'text-text-01 dark:text-text-01-dark' : 'text-gray-700 dark:text-gray-300'}`}>
                {theme.label}
              </div>
            </div>
          </SelectableCard>
        ))}
      </div>
    </div>
  );
};
