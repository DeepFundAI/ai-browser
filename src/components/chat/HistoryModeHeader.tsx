import React from 'react';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';

interface HistoryModeHeaderProps {
  taskName?: string;
  onContinue: () => void;
}

/**
 * History mode header component
 * Shows task name and continue button
 */
export const HistoryModeHeader: React.FC<HistoryModeHeaderProps> = ({
  taskName,
  onContinue,
}) => {
  const { t } = useTranslation('main');

  return (
    <div className='absolute top-0 left-0 w-full flex items-center justify-between'>
      <div className='line-clamp-1 text-xl font-semibold flex-1 flex items-center gap-3 text-gray-800 dark:text-white'>
        {taskName}
        <span className='text-sm text-gray-500 dark:text-gray-400 font-normal'>
          {t('history_task_readonly')}
        </span>
        <Button
          type='primary'
          size='small'
          onClick={onContinue}
          className='cursor-pointer'
          style={{
            background: 'linear-gradient(135deg, #5E31D8 0%, #8B5CF6 100%)',
            borderColor: 'transparent',
          }}
        >
          {t('continue_conversation') || '继续对话'}
        </Button>
      </div>
    </div>
  );
};
