import React from 'react';
import { Input, Drawer, Space, Popconfirm, App } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { Task } from '@/models';
import { taskStorage } from '@/services/task-storage';
import { useTranslation } from 'react-i18next';
import { useHistoryData, HistoryItem } from './hooks/useHistoryData';
import { HistoryList } from './HistoryList';
import { ActionButton } from '@/components/ui';

const { Search } = Input;

interface HistoryPanelProps {
  visible: boolean;
  onClose: () => void;
  onSelectTask: (task: Task) => void;
  currentTaskId?: string;
  isTaskDetailMode?: boolean;
  scheduledTaskId?: string;
}

/**
 * History Panel Component
 * Displays task history with search and management features
 */
export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  visible,
  onClose,
  onSelectTask,
  currentTaskId,
  isTaskDetailMode = false,
  scheduledTaskId
}) => {
  const { t } = useTranslation('history');
  const { message } = App.useApp();

  // Use history data hook
  const {
    filteredItems,
    loading,
    loadTasks,
    handleSearch
  } = useHistoryData({ visible, isTaskDetailMode, scheduledTaskId });

  /**
   * Handle delete task
   */
  const handleDeleteTask = async (item: HistoryItem) => {
    console.log('Attempting to delete:', item);
    try {
      if (item.taskType === 'scheduled' && !isTaskDetailMode) {
        // Scheduled task in main panel: delete all execution history for this scheduled task
        const executions = await taskStorage.getExecutionsByScheduledTaskId(item.scheduledTaskId!);
        await Promise.all(executions.map(task => taskStorage.deleteTask(task.id)));
        message.success(t('deleted_executions', { count: executions.length }));
      } else {
        // Normal task or single execution history in scheduled task detail mode
        await taskStorage.deleteTask(item.id);
        message.success(t('task_deleted'));
      }
      await loadTasks();
    } catch (error) {
      console.error('Delete failed:', error);
      message.error(t('delete_failed'));
    }
  };

  /**
   * Clear all history
   */
  const handleClearAll = async () => {
    console.log('Attempting to clear all history');
    try {
      if (isTaskDetailMode && scheduledTaskId) {
        // Scheduled task detail mode: clear all execution history for this task
        const executions = await taskStorage.getExecutionsByScheduledTaskId(scheduledTaskId);
        await Promise.all(executions.map(task => taskStorage.deleteTask(task.id)));
        message.success(t('history_cleared'));
      } else {
        // Main panel mode: clear all tasks
        await taskStorage.clearAllTasks();
        message.success(t('tasks_cleared'));
      }
      await loadTasks();
    } catch (error) {
      console.error('Clear failed:', error);
      message.error(t('clear_failed'));
    }
  };

  /**
   * Handle history item click
   * - Normal task: display directly
   * - Scheduled task (main panel): open scheduled task window
   * - Scheduled task (detail mode): show specific execution record
   */
  const handleSelectItem = async (item: HistoryItem) => {
    console.log('Selecting history item:', item);

    if (item.taskType === 'scheduled' && !isTaskDetailMode) {
      // Scheduled task in main panel: call main process to open scheduled task window
      try {
        if (typeof window !== 'undefined' && (window as any).api) {
          await (window as any).api.invoke('open-task-history', item.scheduledTaskId);
          message.success(t('opening_task_window'));
          onClose(); // Close history panel
        }
      } catch (error) {
        console.error('Failed to open scheduled task window:', error);
        message.error(t('open_window_failed'));
      }
    } else {
      // Normal task or scheduled task detail mode: display directly
      const task = item.originalTask || item.latestExecution;
      if (task) {
        onSelectTask(task);
        message.info(t('switched_to_history'));
      }
    }
  };

  return (
    <Drawer
      title={isTaskDetailMode ? t('execution_history') : t('history')}
      placement="left"
      open={visible}
      onClose={onClose}
      size={480}
      mask={false}
      className="history-panel-drawer"
      styles={{
        wrapper: {
          marginTop: '48px', // header height
          height: 'calc(100vh - 48px)' // subtract header height
        },
        body: {
          padding: '16px',
          height: '100%',
        }
      }}
      extra={
        <Space>
          <Popconfirm
            title={t('confirm_clear')}
            description={isTaskDetailMode ? t('confirm_clear_execution_history') : t('confirm_clear_message')}
            okText={t('confirm')}
            cancelText={t('cancel')}
            okType="danger"
            onConfirm={handleClearAll}
            styles={{
              body: {
                backgroundColor: 'rgba(30, 28, 35, 0.98)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(94, 49, 216, 0.3)'
              }
            }}
          >
            <ActionButton
              variant="danger"
              icon={<ClearOutlined />}
            >
              {t('clear_history')}
            </ActionButton>
          </Popconfirm>
        </Space>
      }
    >
      <div className="space-y-4 flex flex-col h-full">
        {/* Search box */}
        <div className="flex items-center">
          <Search
            placeholder={t('search_placeholder')}
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
            onChange={(e) => !e.target.value && handleSearch('')}
            size="large"
            className="w-full"
          />
        </div>

        {/* History item list */}
        <HistoryList
          loading={loading}
          filteredItems={filteredItems}
          currentTaskId={currentTaskId}
          isTaskDetailMode={isTaskDetailMode}
          onSelectItem={handleSelectItem}
          onDeleteTask={handleDeleteTask}
        />
      </div>
    </Drawer>
  );
};
