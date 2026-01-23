'use client';

import React from 'react'
import { Button } from 'antd'
import { HistoryOutlined, SettingOutlined } from '@ant-design/icons'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { HistoryPanel } from '@/components/history'
import { useHistoryStore } from '@/stores/historyStore'
import { useTranslation } from 'react-i18next'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const taskId = searchParams.get('taskId')
  const executionId = searchParams.get('executionId')
  const { t } = useTranslation('header')

  // Check if in scheduled task detail mode
  const isTaskDetailMode = !!taskId && !!executionId

  // Using Zustand store, as simple as Pinia!
  const { showHistoryPanel, setShowHistoryPanel, selectHistoryTask } = useHistoryStore()

  const goback = async () => {
    router.push('/home')
  }

  const onSelectTask = (task: any) => {
    // Use store to select history task
    selectHistoryTask(task);

    // If not on main page, navigate to it
    if (pathname !== '/main') {
      router.push('/main');
    }
  }

  return (
    <div className=' flex justify-between items-center h-12 w-full px-7 bg-header dark:bg-header-dark text-text-01 dark:text-text-01-dark' style={{
            WebkitAppRegion: 'drag'
          } as React.CSSProperties}>
      {/* Don't show back button in scheduled task mode */}
      {!isTaskDetailMode && (
        <div
          style={{
            WebkitAppRegion: 'no-drag'
          } as React.CSSProperties}
          onClick={() => goback()}
          className='cursor-pointer ml-20 flex items-center'
        >
          <span className='text-3xl font-bold  tracking-normal hover:scale-105 transition-all duration-300 drop-shadow-2xl relative font-["Berkshire_Swash",_cursive]'>
            DeepFundAI
            <span className='absolute inset-0 bg-gradient-to-r from-blue-500/20 via-blue-400/20 to-cyan-500/20 blur-sm -z-10'></span>
          </span>
        </div>
      )}
      {isTaskDetailMode && (
        <div className='flex items-center gap-1.5 ml-20 px-2.5 py-1 bg-slate-100 dark:bg-white/10 rounded-full'>
          <span className='text-slate-600 dark:text-slate-300 text-xs font-medium'>{t('scheduled_task')}</span>
          {taskId && (
            <span className='text-slate-400 dark:text-slate-500 text-xs font-mono'>#{String(taskId).slice(-6)}</span>
          )}
        </div>
      )}
      <div className='flex justify-center items-center gap-4'>
        <Button
          type="text"
          icon={<HistoryOutlined />}
          size="small"
          onClick={() => setShowHistoryPanel(true)}
          className='!text-gray-700 dark:!text-text-01-dark cursor-pointer transition-all duration-200
            hover:!bg-gray-100 dark:hover:!bg-white/10 hover:!text-primary dark:hover:!text-purple-400'
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {isTaskDetailMode ? t('execution_history') : t('history')}
        </Button>

        {/* Settings button */}
        <Button
          type="text"
          icon={<SettingOutlined />}
          size="small"
          onClick={() => {
            if (typeof window !== 'undefined' && (window as any).api) {
              (window as any).api.openSettings();
            }
          }}
          className='!text-gray-700 dark:!text-text-01-dark cursor-pointer transition-all duration-200
            hover:!bg-gray-100 dark:hover:!bg-white/10 hover:!text-primary dark:hover:!text-purple-400'
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {t('settings')}
        </Button>
      </div>

      {/* Global history task panel - passing scheduled task info */}
      <HistoryPanel
        visible={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
        onSelectTask={onSelectTask}
        currentTaskId=""
        isTaskDetailMode={isTaskDetailMode}
        scheduledTaskId={taskId as string}
      />
    </div>
  )
}
