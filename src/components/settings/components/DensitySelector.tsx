/**
 * Density selector component with description buttons
 * INPUT: Current density value, onChange handler
 * OUTPUT: Three large density buttons (Compact/Comfortable/Spacious)
 * POSITION: Used in UserInterfacePanel
 */

import React from 'react';
import { SelectableCard } from '@/components/ui';

interface DensitySelectorProps {
  label: string;
  value: 'compact' | 'comfortable' | 'spacious';
  onChange: (value: 'compact' | 'comfortable' | 'spacious') => void;
}

export const DensitySelector: React.FC<DensitySelectorProps> = ({
  label,
  value,
  onChange
}) => {
  const densities = [
    { value: 'compact' as const, label: 'Compact', description: 'More content' },
    { value: 'comfortable' as const, label: 'Comfortable', description: 'Balanced layout' },
    { value: 'spacious' as const, label: 'Spacious', description: 'More space' }
  ];

  return (
    <div>
      <div className="text-text-01 dark:text-text-01-dark font-medium mb-3">{label}</div>
      <div className="grid grid-cols-3 gap-3">
        {densities.map(density => (
          <SelectableCard
            key={density.value}
            selected={value === density.value}
            onClick={() => onChange(density.value)}
            className="h-20"
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className={`text-sm font-medium mb-1 transition-colors duration-200 ${value === density.value ? 'text-text-01 dark:text-text-01-dark' : 'text-gray-700 dark:text-gray-300'}`}>
                {density.label}
              </div>
              <div className={`text-xs transition-colors duration-200 ${value === density.value ? 'text-text-12 dark:text-text-12-dark' : 'text-gray-500 dark:text-gray-500'}`}>
                {density.description}
              </div>
            </div>
          </SelectableCard>
        ))}
      </div>
    </div>
  );
};
