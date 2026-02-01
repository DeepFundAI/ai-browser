/**
 * Settings divider component
 * INPUT: optional className
 * OUTPUT: Styled horizontal divider
 * POSITION: Used between settings sections
 */

import React from 'react';
import { Divider } from 'antd';
import clsx from 'clsx';

export interface SettingsDividerProps {
  /** Additional className */
  className?: string;
}

export const SettingsDivider: React.FC<SettingsDividerProps> = ({ className }) => {
  return (
    <Divider
      className={clsx(
        '!border-[var(--divider-color)]',
        className
      )}
    />
  );
};
