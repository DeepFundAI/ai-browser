/**
 * Reusable toggle setting component
 * INPUT: label, checked state, onChange callback
 * OUTPUT: Switch UI with label and description
 * POSITION: Used across all settings panels for boolean toggles
 */

import React from 'react';
import { Switch, Typography } from 'antd';

const { Text } = Typography;

interface ToggleSettingProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Toggle setting component for boolean options
 */
export const ToggleSetting: React.FC<ToggleSettingProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false
}) => {
  return (
    <div className="flex items-start justify-between py-4 border-b border-gray-200 dark:border-white/10 last:border-b-0">
      <div className="flex-1 pr-4">
        <Text className="!text-text-01 dark:!text-text-01-dark font-medium">{label}</Text>
        {description && (
          <div className="text-sm text-text-12 dark:text-text-12-dark mt-1">{description}</div>
        )}
      </div>
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
};
