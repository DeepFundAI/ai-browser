/**
 * Action button component with variants
 * INPUT: variant, onClick, children, loading, disabled, icon
 * OUTPUT: Styled button with consistent interactions
 * POSITION: Used across all settings panels for actions
 */

import React from 'react';
import { Button } from 'antd';
import type { ButtonProps } from 'antd';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ActionButtonProps extends Omit<ButtonProps, 'type' | 'danger'> {
  /** Button variant: primary, secondary, or danger */
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: clsx(
    '!bg-primary hover:!bg-primary-hover !border-none',
    '!text-white',
    'hover:scale-[1.02] active:scale-[0.98]'
  ),
  secondary: clsx(
    '!bg-[var(--btn-secondary-bg)]',
    '!border-[var(--btn-secondary-border)]',
    '!text-[var(--btn-secondary-text)]',
    'hover:!bg-[var(--btn-secondary-hover-bg)]',
    'hover:!border-primary/30'
  ),
  danger: clsx(
    '!bg-[var(--btn-danger-bg)]',
    '!border-[var(--btn-danger-border)]',
    '!text-[var(--btn-danger-text)]',
    'hover:!bg-[var(--btn-danger-hover-bg)]',
    'hover:!border-[var(--btn-danger-hover-border)]'
  )
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant = 'secondary',
  className,
  children,
  ...props
}) => {
  return (
    <Button
      className={clsx(
        'cursor-pointer transition-all duration-200',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};
