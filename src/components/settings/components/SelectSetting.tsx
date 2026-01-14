/**
 * Reusable select setting component
 * INPUT: label, value, options/groupedOptions, onChange callback
 * OUTPUT: Select dropdown UI with label, supports grouped options with search
 * POSITION: Used across all settings panels for dropdown selections
 */

import React from 'react';
import { Select, Typography } from 'antd';
import { SelectOption, SelectOptionGroup } from '@/models/settings';

const { Text } = Typography;

interface SelectSettingProps {
  label: string;
  description?: string;
  value: string;
  options?: SelectOption[];
  groupedOptions?: SelectOptionGroup[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  showSearch?: boolean;
}

/**
 * Select setting component for dropdown selections
 * Supports both flat options and grouped options with search
 */
export const SelectSetting: React.FC<SelectSettingProps> = ({
  label,
  description,
  value,
  options,
  groupedOptions,
  onChange,
  disabled = false,
  placeholder = 'Select an option',
  showSearch = false
}) => {
  // Build options for Select component
  const selectOptions = groupedOptions
    ? groupedOptions.map(group => ({
        label: (
          <span className="flex items-center gap-2">
            {group.icon}
            <span>{group.label}</span>
          </span>
        ),
        options: group.options
      }))
    : options;

  return (
    <div className="mb-6">
      <div className="mb-2">
        <Text className="!text-text-01 dark:!text-text-01-dark font-medium">{label}</Text>
        {description && (
          <div className="text-sm text-text-12 dark:text-text-12-dark mt-1">{description}</div>
        )}
      </div>
      <Select
        value={value}
        onChange={onChange}
        options={selectOptions as any}
        disabled={disabled}
        placeholder={placeholder}
        className="w-64"
        popupMatchSelectWidth={false}
        showSearch={showSearch}
        filterOption={showSearch ? (input, option) =>
          (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase()) ||
          (option?.value?.toString() || '').toLowerCase().includes(input.toLowerCase())
        : undefined}
        optionFilterProp="label"
      />
    </div>
  );
};
