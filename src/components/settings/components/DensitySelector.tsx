/**
 * Density selector component with description buttons
 * INPUT: Current density value, onChange handler
 * OUTPUT: Three large density buttons (Compact/Comfortable/Spacious)
 * POSITION: Used in UserInterfacePanel
 */

import React from 'react';

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
          <button
            key={density.value}
            onClick={() => onChange(density.value)}
            className={`
              flex flex-col items-center justify-center
              h-20 rounded-lg border-2 transition-all
              ${value === density.value
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
              }
            `}
          >
            <div className={`text-sm font-medium mb-1 ${value === density.value ? 'text-text-01 dark:text-text-01-dark' : 'text-gray-700 dark:text-gray-300'}`}>
              {density.label}
            </div>
            <div className={`text-xs ${value === density.value ? 'text-text-12 dark:text-text-12-dark' : 'text-gray-500 dark:text-gray-500'}`}>
              {density.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
