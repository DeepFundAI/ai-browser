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
              h-20 rounded-xl transition-all duration-200
              hover:scale-[1.02] active:scale-[0.98]
              ${value === density.value
                ? 'bg-purple-50 dark:bg-purple-500/15 shadow-[inset_0_0_0_1px_rgb(233,213,255)] dark:shadow-[inset_0_0_0_1px_rgba(168,85,247,0.3)]'
                : 'bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100/50 dark:hover:bg-white/10'
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
