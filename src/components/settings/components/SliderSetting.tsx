/**
 * Reusable slider setting component
 * INPUT: label, value, onChange callback
 * OUTPUT: Slider UI with label and value display
 * POSITION: Used across all settings panels for numeric range inputs
 */

import React from 'react';
import { Slider, Typography } from 'antd';

const { Text } = Typography;

interface SliderSettingProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  marks?: Record<number, string>;
  disabled?: boolean;
}

/**
 * Slider setting component for numeric range inputs
 */
export const SliderSetting: React.FC<SliderSettingProps> = ({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
  marks,
  disabled = false
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <Text className="!text-text-01 dark:!text-text-01-dark font-medium">{label}</Text>
          {description && (
            <div className="text-sm text-text-12 dark:text-text-12-dark mt-1">{description}</div>
          )}
        </div>
        <div className="text-text-01 dark:text-text-01-dark font-mono bg-gray-100 dark:bg-white/10 px-3 py-1 rounded">
          {value}{unit}
        </div>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        marks={marks}
        disabled={disabled}
        tooltip={{ formatter: (val) => `${val}${unit}` }}
        className="mb-2"
      />
    </div>
  );
};
