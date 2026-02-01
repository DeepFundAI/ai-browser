import React from 'react';
import { Button } from 'antd';
import { CaretRightOutlined, PauseOutlined } from '@ant-design/icons';
import { PlaybackStatus } from '@/utils/PlaybackEngine';
import { useTranslation } from 'react-i18next';

interface PlaybackControlProps {
  status: PlaybackStatus;
  progress: number;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
}

/**
 * PlaybackControl - Playback control UI
 *
 * Displays play/pause button and progress indicator
 */
export const PlaybackControl: React.FC<PlaybackControlProps> = ({
  status,
  progress,
  onPlay,
  onPause,
  onRestart,
}) => {
  const { t } = useTranslation('main');

  const isPlaying = status === 'playing';
  const isCompleted = status === 'completed';

  const handleClick = () => {
    if (isPlaying) {
      onPause();
    } else {
      onRestart();
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-tool-call-dark rounded-xl border border-gray-200 dark:border-transparent">
      <Button
        type="primary"
        size="large"
        icon={isPlaying ? <PauseOutlined /> : <CaretRightOutlined />}
        onClick={handleClick}
        className="cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #5E31D8 0%, #8B5CF6 100%)',
          borderColor: 'transparent',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        {isPlaying
          ? t('pause_replay') || '暂停回放'
          : t('replay') || '重新回放'}
      </Button>
      {(isPlaying || isCompleted) && (
        <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
          {progress}% {isCompleted && '(已完成)'}
        </span>
      )}
    </div>
  );
};
