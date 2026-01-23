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
              flex flex-col items-center justify-center cursor-pointer
              h-20 rounded-lg border-2 transition-all duration-200
              hover:scale-[1.02] active:scale-[0.98]
              ${value === density.value
                ? 'border-primary dark:border-purple-400 bg-primary/10 dark:bg-primary/20 shadow-sm shadow-primary/10'
                : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20'
              }
            `}
          >
            <div className={`text-sm font-medium mb-1 transition-colors duration-200 ${value === density.value ? 'text-text-01 dark:text-text-01-dark' : 'text-gray-700 dark:text-gray-300'}`}>
              {density.label}
            </div>
            <div className={`text-xs transition-colors duration-200 ${value === density.value ? 'text-text-12 dark:text-text-12-dark' : 'text-gray-500 dark:text-gray-500'}`}>
              {density.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
