import React from 'react';
import { Button, Slider } from 'antd';
import { StepUpDown } from '@/icons/deepfundai-icons';
import { useTranslation } from 'react-i18next';
import { TabBar } from './TabBar';
import { useTabManager } from '@/hooks/useTabManager';

interface DetailPanelProps {
  showDetail: boolean;
  currentUrl: string;
  currentTool: {
    toolName: string;
    operation: string;
    status: 'running' | 'completed' | 'error';
  } | null;
  toolHistory: any[];
  currentHistoryIndex: number;
  onHistoryIndexChange: (index: number) => void;
}

/**
 * Detail panel component
 * Shows browser view and screenshot history
 * Fully restored from original main.tsx implementation
 */
export const DetailPanel: React.FC<DetailPanelProps> = ({
  showDetail,
  currentUrl,
  currentTool,
  toolHistory,
  currentHistoryIndex,
  onHistoryIndexChange,
}) => {
  const { t } = useTranslation('main');
  const { tabs, activeTabId, switchTab, closeTab } = useTabManager();

  return (
    <div className='h-full transition-all pt-5 pb-4 pr-4 duration-300 text-text-01 dark:text-text-01-dark' style={{ width: showDetail ? '800px' : '0px' }}>
      {showDetail && (
        <div className='h-full border-gray-200 dark:border-border-message-dark border flex flex-col rounded-xl bg-white dark:bg-transparent shadow-sm dark:shadow-none'>
          {/* Detail panel title */}
          <div className='p-4'>
            <h3 className='text-xl font-semibold'>{t('atlas_computer')}</h3>
            <div className='flex flex-col items-start justify-centerce px-5 py-3 gap-3 border-gray-200 dark:border-border-message-dark border rounded-lg h-[80px] bg-gray-50 dark:bg-tool-call-dark mt-3'>
              {currentTool && (
                <>
                  <div className='border-b w-full border-dashed border-border-message dark:border-border-message-dark flex items-center'>
                    {t('atlas_using_tool')}
                    <div className={`w-2 h-2 ml-2 rounded-full ${
                      currentTool.status === 'running' ? 'bg-blue-500 animate-pulse' :
                      currentTool.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className='ml-1 text-xs text-text-12 dark:text-text-12-dark'>
                      {currentTool.status === 'running' ? t('running') :
                       currentTool.status === 'completed' ? t('completed') : t('execution_error')}
                    </span>
                  </div>
                  <h3 className='text-sm text-text-12 dark:text-text-12-dark'>
                    {currentTool.toolName} - {currentTool.operation}
                  </h3>
                </>
              )}
            </div>
          </div>

          {/* Detail panel content area - reserved space */}
          <div className='p-4 pt-0 flex-1 '>
            <div className='border-gray-200 dark:border-border-message-dark border rounded-lg h-full flex flex-col overflow-hidden'>
              {/* Tab bar for multi-tab support */}
              <TabBar
                tabs={tabs}
                activeTabId={activeTabId}
                onTabClick={switchTab}
                onTabClose={closeTab}
              />
              {/* URL bar */}
              <div className='h-[42px] bg-gray-50 dark:bg-tool-call-dark flex items-center justify-center p-2 border-b border-gray-200 dark:border-border-message-dark'>
                {currentUrl && (
                  <div className='text-xs text-gray-500 dark:text-text-12-dark line-clamp-1'>
                    {currentUrl}
                  </div>
                )}
              </div>
              <div className='flex-1 bg-white dark:bg-transparent'></div>
              <div className='h-[42px] bg-gray-50 dark:bg-tool-call-dark rounded-b-lg flex items-center px-3 border-t border-gray-200 dark:border-border-message-dark'>
                {/* Tool call progress bar */}
                {toolHistory.length > 0 && (
                  <div className='flex-1 flex items-center gap-2'>
                    {/* Forward/Backward button group */}
                    <div className='flex items-center border border-border-message dark:border-border-message-dark rounded'>
                      <Button
                        type="text"
                        size="small"
                        disabled={toolHistory.length === 0 || (currentHistoryIndex === 0)}
                        onClick={() => {
                          const newIndex = currentHistoryIndex === -1 ? toolHistory.length - 2 : currentHistoryIndex - 1;
                          onHistoryIndexChange(Math.max(0, newIndex));
                        }}
                        className='!border-0 !rounded-r-none'
                      >
                        <StepUpDown className='w-3 h-3' />
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        disabled={currentHistoryIndex === -1}
                        onClick={() => onHistoryIndexChange(currentHistoryIndex + 1)}
                        className='!border-0 !rounded-l-none border-l border-border-message dark:border-border-message-dark'
                      >
                        <StepUpDown className='rotate-180 w-3 h-3' />
                      </Button>
                    </div>

                    <Slider
                      className='flex-1 detail-panel-slider'
                      min={0}
                      max={toolHistory.length}
                      value={currentHistoryIndex === -1 ? toolHistory.length : currentHistoryIndex + 1}
                      onChange={(value) => onHistoryIndexChange(value - 1)}
                      step={1}
                      tooltip={{ open: false }}
                      marks={toolHistory.reduce((marks, _, index) => {
                        marks[index + 1] = '';
                        return marks;
                      }, {} as Record<number, string>)}
                    />

                    <span className='text-xs text-text-12 dark:text-text-12-dark'>
                      {t('realtime')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
