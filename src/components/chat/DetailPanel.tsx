/**
 * input: showDetail, currentUrl, currentTool, toolHistory, callbacks
 * output: Detail panel with browser view and controls
 * pos: Main chat view right panel for browser interaction
 */

import React, { useCallback } from 'react';
import { Button, Slider } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { StepUpDown } from '@/icons/deepfundai-icons';
import { useTranslation } from 'react-i18next';
import { TabBar } from './TabBar';
import { AddressBar } from './AddressBar';
import { useTabManager } from '@/hooks/useTabManager';
import { useSettingsStore } from '@/stores/settingsStore';

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
 * Browser detail panel with tab bar
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
  const { tabs, activeTabId, switchTab, closeTab, createTab, navigateTo, refresh, goBack, goForward } = useTabManager();
  const { settings } = useSettingsStore();

  const searchEngine = settings?.general?.browser?.searchEngine || 'google';

  // Get current tab's URL, fallback to prop currentUrl
  const activeTab = tabs.find(tab => tab.tabId === activeTabId);
  const displayUrl = activeTab?.url || currentUrl;

  const handleNewTab = useCallback(async () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    await createTab(`${baseUrl}/new-tab`);
  }, [createTab]);

  return (
    <div className='h-full transition-all pt-5 pb-4 pr-4 duration-300 text-text-01 dark:text-text-01-dark' style={{ width: showDetail ? '800px' : '0px' }}>
      {showDetail && (
        <div className='h-full border-gray-200 dark:border-border-message-dark border flex flex-col rounded-xl bg-white dark:bg-transparent shadow-sm dark:shadow-none'>
          {/* Detail panel title */}
          <div className='p-4 pb-2'>
            <h3 className='text-xl font-semibold'>{t('atlas_computer')}</h3>
            {/* Tool status - single row */}
            <div className='flex items-center gap-3 px-4 py-2 border-gray-200 dark:border-border-message-dark border rounded-lg bg-gray-50 dark:bg-tool-call-dark mt-3'>
              {currentTool ? (
                <>
                  <span className='text-sm'>{t('atlas_using_tool')}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    currentTool.status === 'running' ? 'bg-blue-500 animate-pulse' :
                    currentTool.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className='text-xs text-text-12 dark:text-text-12-dark'>
                    {currentTool.status === 'running' ? t('running') :
                     currentTool.status === 'completed' ? t('completed') : t('execution_error')}
                  </span>
                  <span className='text-sm text-text-12 dark:text-text-12-dark'>
                    {currentTool.toolName} - {currentTool.operation}
                  </span>
                </>
              ) : (
                <span className='text-sm text-text-12 dark:text-text-12-dark'>&nbsp;</span>
              )}
            </div>
          </div>

          {/* Detail panel content area */}
          <div className='p-4 pt-2 flex-1'>
            <div className='border-gray-200 dark:border-border-message-dark border rounded-lg h-full flex flex-col overflow-hidden relative'>
              {/* Tab bar for multi-tab support */}
              <TabBar
                tabs={tabs}
                activeTabId={activeTabId}
                onTabClick={switchTab}
                onTabClose={closeTab}
                onNewTab={handleNewTab}
              />
              {/* Address bar */}
              <AddressBar
                currentUrl={displayUrl}
                searchEngine={searchEngine}
                onNavigate={navigateTo}
                onRefresh={refresh}
                onGoBack={goBack}
                onGoForward={goForward}
              />
              <div className='flex-1 bg-white dark:bg-transparent'></div>

              {/* History screenshot overlay - covers TabBar and AddressBar */}
              {currentHistoryIndex >= 0 && (
                <div className='absolute inset-0 bottom-[42px] z-10 bg-white dark:bg-gray-900 rounded-t-lg'>
                  {/* Header with title and close button */}
                  <div className='flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700'>
                    <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      {t('history_screenshot')} ({currentHistoryIndex + 1}/{toolHistory.length})
                    </span>
                    <button
                      onClick={async () => {
                        onHistoryIndexChange(-1);
                        await (window.api as any).setDetailViewVisible?.(true);
                        await (window.api as any).hideHistoryView?.();
                      }}
                      className='w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
                    >
                      <CloseOutlined className='text-sm text-gray-500 dark:text-gray-400' />
                    </button>
                  </div>
                </div>
              )}
              <div className='h-[42px] bg-gray-50 dark:bg-tool-call-dark rounded-b-lg flex items-center px-3 border-t border-gray-200 dark:border-border-message-dark relative z-20'>
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
