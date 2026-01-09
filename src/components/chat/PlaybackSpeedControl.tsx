import React from 'react';
import { Button } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { PlaybackSpeed } from '@/utils/PlaybackEngine';

const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 1, 2, 5, 10, 20, 50];

interface PlaybackSpeedControlProps {
  speed: PlaybackSpeed;
  onSpeedChange: (speed: PlaybackSpeed) => void;
}

/**
 * Playback speed control component with +/- buttons
 */
export const PlaybackSpeedControl: React.FC<PlaybackSpeedControlProps> = ({
  speed,
  onSpeedChange,
}) => {
  const currentIndex = SPEED_OPTIONS.indexOf(speed);
  const canDecrease = currentIndex > 0;
  const canIncrease = currentIndex < SPEED_OPTIONS.length - 1;

  const handleDecrease = () => {
    if (canDecrease) {
      onSpeedChange(SPEED_OPTIONS[currentIndex - 1]);
    }
  };

  const handleIncrease = () => {
    if (canIncrease) {
      onSpeedChange(SPEED_OPTIONS[currentIndex + 1]);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        type="text"
        size="small"
        icon={<MinusOutlined />}
        disabled={!canDecrease}
        onClick={handleDecrease}
        className="!text-text-12 dark:!text-text-12-dark hover:!text-text-01 dark:hover:!text-text-01-dark !w-7 !h-7"
      />
      <span className="text-sm text-text-12 dark:text-text-12-dark min-w-[32px] text-center">
        {speed}x
      </span>
      <Button
        type="text"
        size="small"
        icon={<PlusOutlined />}
        disabled={!canIncrease}
        onClick={handleIncrease}
        className="!text-text-12 dark:!text-text-12-dark hover:!text-text-01 dark:hover:!text-text-01-dark !w-7 !h-7"
      />
    </div>
  );
};
