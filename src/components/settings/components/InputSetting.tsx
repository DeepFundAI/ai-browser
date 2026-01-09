/**
 * Reusable input setting component
 * INPUT: label, value, onChange callback
 * OUTPUT: Input field UI with label and validation
 * POSITION: Used for text and number inputs in settings panels
 */

import React from 'react';
import { InputNumber, Typography } from 'antd';

const { Text } = Typography;

interface InputSettingProps {
  label: string;
  description?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
  unit?: string;
}

/**
 * Input setting component for numeric inputs with validation
 */
export const InputSetting: React.FC<InputSettingProps> = ({
  label,
  description,
  value,
  min,
  max,
  onChange,
  disabled = false,
  placeholder,
  unit
}) => {
  return (
    <div className="mb-6">
      <div className="mb-2">
        <Text className="!text-text-01 dark:!text-text-01-dark font-medium">{label}</Text>
        {description && (
          <div className="text-sm text-text-12 dark:text-text-12-dark mt-1">{description}</div>
        )}
      </div>
      <InputNumber
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        disabled={disabled}
        placeholder={placeholder}
        addonAfter={unit}
        className="w-full"
      />
    </div>
  );
};
