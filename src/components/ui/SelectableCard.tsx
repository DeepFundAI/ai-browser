/**
 * Selectable card component
 * INPUT: selected state, onClick handler, children
 * OUTPUT: Card with selected/default styling
 * POSITION: Used in settings panels for selection UI
 */

import React from 'react';
import clsx from 'clsx';

export interface SelectableCardProps {
  /** Whether the card is selected */
  selected: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Card content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Enable hover scale effect (default: true) */
  hoverScale?: boolean;
}

export const SelectableCard: React.FC<SelectableCardProps> = ({
  selected,
  onClick,
  children,
  className,
  disabled = false,
  hoverScale = true
}) => {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={clsx(
        'rounded-xl transition-all duration-200',
        !disabled && 'cursor-pointer',
        !disabled && hoverScale && 'hover:scale-[1.02] active:scale-[0.98]',
        selected
          ? 'bg-[var(--surface-selected-bg)] shadow-[inset_0_0_0_1px_var(--surface-selected-border)]'
          : 'bg-[var(--surface-default-bg)] hover:bg-[var(--surface-default-hover)]',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </div>
  );
};
