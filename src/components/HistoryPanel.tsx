import React, { useState, useEffect } from 'react';
import { Button, Input, List, Modal, Drawer, Tooltip, Space, Tag, Popconfirm, App } from 'antd';
import { SearchOutlined, DeleteOutlined, EyeOutlined, ClearOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Task, TaskStatus, TaskType } from '@/models';
import { taskStorage } from '@/lib/taskStorage';
import { useTranslation } from 'react-i18next';

const { Search } = Input;

/**
 * History panel display item (unified for normal tasks and scheduled tasks)
 */
interface HistoryItem {
  id: string; // task.id for normal tasks, scheduledTaskId for scheduled tasks
  name: string;
  taskType: TaskType;
  status?: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  scheduledTaskId?: string; // Scheduled task configuration ID
  latestExecution?: Task; // Latest execution record for scheduled tasks
  executionCount?: number; // Execution count for scheduled tasks
  originalTask?: Task; // Original data for normal tasks
}

interface HistoryPanelProps {
  visible: boolean;
  onClose: () => void;
  onSelectTask: (task: Task) => void;
  currentTaskId?: string;
  isTaskDetailMode?: boolean;
  scheduledTaskId?: string;
}

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
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    running: 0,
    error: 0
  });

  /**
   * Load and process historical data
   * If in scheduled task detail mode, only show execution history for that scheduled task
   * Otherwise, merge normal tasks and scheduled task execution history
   */
  const loadTasks = async () => {
    setLoading(true);
    try {
      if (isTaskDetailMode && scheduledTaskId) {
        // Scheduled task detail mode: only show all execution history for this scheduled task
        const executions = await taskStorage.getExecutionsByScheduledTaskId(scheduledTaskId);

        const items: HistoryItem[] = executions.map(task => ({
          id: task.id,
          name: task.name,
          taskType: 'scheduled',
          status: task.status,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          scheduledTaskId: task.scheduledTaskId,
          originalTask: task,
        }));

        setHistoryItems(items);
        setFilteredItems(items);

        // Statistics
        setStats({
          total: items.length,
          completed: items.filter(item => item.status === 'done').length,
          running: items.filter(item => item.status === 'running').length,
          error: items.filter(item => item.status === 'error' || item.status === 'abort').length
        });
      } else {
        // Main history panel mode: merge normal tasks and scheduled tasks
        const allTasks = await taskStorage.getAllTasks();

        // Separate normal tasks and scheduled task execution history
        const normalTasks = allTasks.filter(t => t.taskType === 'normal');
        const scheduledExecutions = allTasks.filter(t => t.taskType === 'scheduled');

        // Group scheduled task execution history by scheduledTaskId
        const scheduledGroups = new Map<string, Task[]>();
        scheduledExecutions.forEach(task => {
          if (task.scheduledTaskId) {
            if (!scheduledGroups.has(task.scheduledTaskId)) {
              scheduledGroups.set(task.scheduledTaskId, []);
            }
            scheduledGroups.get(task.scheduledTaskId)!.push(task);
          }
        });

        // Build history item list
        const items: HistoryItem[] = [];

        // Add normal tasks
        normalTasks.forEach(task => {
          items.push({
            id: task.id,
            name: task.name,
            taskType: 'normal',
            status: task.status,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            originalTask: task,
          });
        });

        // Add scheduled tasks (each scheduled task only shows the latest execution)
        scheduledGroups.forEach((executions, scheduledTaskId) => {
          // Sort by updatedAt, take the latest one
          const sortedExecutions = executions.sort((a, b) =>
            b.updatedAt.getTime() - a.updatedAt.getTime()
          );
          const latestExecution = sortedExecutions[0];

          items.push({
            id: scheduledTaskId, // Use scheduledTaskId as unique identifier
            name: latestExecution.name,
            taskType: 'scheduled',
            status: latestExecution.status,
            createdAt: latestExecution.createdAt,
            updatedAt: latestExecution.updatedAt,
            scheduledTaskId,
            latestExecution,
            executionCount: executions.length,
          });
        });

        // Sort by updatedAt in descending order (newest first)
        items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

        setHistoryItems(items);
        setFilteredItems(items);

        // Statistics
        setStats({
          total: items.length,
          completed: items.filter(item => item.status === 'done').length,
          running: items.filter(item => item.status === 'running').length,
          error: items.filter(item => item.status === 'error' || item.status === 'abort').length
        });
      }
    } catch (error) {
      console.error('Failed to load history tasks:', error);
      message.error(t('load_failed'));
    } finally {
      setLoading(false);
    }
  };

  // Search history items
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    if (!value.trim()) {
      setFilteredItems(historyItems);
      return;
    }

    const keyword = value.trim().toLowerCase();
    const filtered = historyItems.filter(item =>
      item.name.toLowerCase().includes(keyword) ||
      item.id.toLowerCase().includes(keyword)
    );
    setFilteredItems(filtered);
  };

  // Delete single history item
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

  // Clear all history
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

  // Format time
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return t('just_now');
    if (minutes < 60) return t('minutes_ago', { minutes });
    if (hours < 24) return t('hours_ago', { hours });
    if (days < 7) return t('days_ago', { days });

    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status tag
  const getStatusTag = (status?: TaskStatus) => {
    switch (status) {
      case 'done':
        return <Tag color="green">{t('status_completed')}</Tag>;
      case 'running':
        return <Tag color="blue">{t('status_running')}</Tag>;
      case 'error':
        return <Tag color="red">{t('status_error')}</Tag>;
      case 'abort':
        return  <Tag color="red">{t('status_aborted')}</Tag>;
      default:
        return <Tag color="default">{t('status_unknown')}</Tag>;
    }
  };

  // Load tasks when component mounts
  useEffect(() => {
    if (visible) {
      loadTasks();
    }
  }, [visible]);

  return (
    <Drawer
      title={isTaskDetailMode ? t('execution_history') : t('history')}
      placement="left"
      size="large"
      open={visible}
      onClose={onClose}
      width={480}
      className="history-panel-drawer"
      styles={{
        wrapper: {
          marginTop: '48px', // header height
          height: 'calc(100vh - 48px)' // subtract header height
        },
        body: {
          padding: '16px',
          height: '100%',
          // Fellou.ai inspired elegant gradient background
          background: 'linear-gradient(180deg, #1e1c23 0%, #281c39 100%)',
          backdropFilter: 'blur(16px)',
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
            overlayInnerStyle={{
              backgroundColor: 'rgba(30, 28, 35, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(94, 49, 216, 0.3)'
            }}
          >
            <Button danger icon={<ClearOutlined />}>
              {t('clear_history')}
            </Button>
          </Popconfirm>
        </Space>
      }
    >
      <div className="space-y-4 flex flex-col h-full">
        {/* Search box */}
        <Search
          placeholder={t('search_placeholder')}
          allowClear
          enterButton={<SearchOutlined />}
          onSearch={handleSearch}
          onChange={(e) => !e.target.value && handleSearch('')}
        />

        {/* Unified history item list */}
        <List
          loading={loading}
          dataSource={filteredItems}
          rowKey="id"
          size="small"
          className="overflow-y-auto flex-1"
          locale={{ emptyText: isTaskDetailMode ? t('no_execution_history') : t('no_history_tasks') }}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              className={`cursor-pointer transition-colors ${
                currentTaskId === item.id ? 'opacity-80' : 'hover:opacity-70'
              }`}
              style={{
                backgroundColor: currentTaskId === item.id ? 'rgba(59, 130, 246, 0.1)' : undefined,
                borderLeft: currentTaskId === item.id ? '3px solid #3B82F6' : undefined
              }}
              onClick={() => handleSelectItem(item)}
              actions={[
                item.taskType === 'normal' && (
                  <Tooltip key="view" title={t('view_details')}>
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectItem(item);
                      }}
                    />
                  </Tooltip>
                ),
                <Popconfirm
                  key="delete"
                  title={t('confirm')}
                  description={
                    item.taskType === 'scheduled' && !isTaskDetailMode
                      ? t('confirm_delete_scheduled_executions', { count: item.executionCount || 0 })
                      : t('confirm_delete_task')
                  }
                  okText={t('confirm')}
                  cancelText={t('cancel')}
                  okType="danger"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    handleDeleteTask(item);
                  }}
                  overlayInnerStyle={{
                    backgroundColor: 'rgba(30, 28, 35, 0.98)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(94, 49, 216, 0.3)'
                  }}
                >
                  <Tooltip title={item.taskType === 'scheduled' && !isTaskDetailMode ? t('delete_all_executions') : t('delete_task')}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Tooltip>
                </Popconfirm>
              ].filter(Boolean)}
            >
              <List.Item.Meta
                title={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      {item.taskType === 'scheduled' && (
                        <ClockCircleOutlined className="text-blue-500" />
                      )}
                      <span className="text-sm font-medium truncate">
                        {item.name}
                      </span>
                    </div>
                    {getStatusTag(item.status)}
                  </div>
                }
                description={
                  <div className="text-xs opacity-70">
                    <div className="flex items-center justify-between">
                      <span>{t('id_short')}: {item.id.slice(0, 16)}...</span>
                      {item.taskType === 'scheduled' && item.executionCount && !isTaskDetailMode && (
                        <Tag color="blue">
                          {t('executions_count', { count: item.executionCount })}
                        </Tag>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span>{t('created')}: {formatTime(item.createdAt)}</span>
                      <span>{t('updated')}: {formatTime(item.updatedAt)}</span>
                    </div>
                    {item.originalTask?.messages && item.originalTask.messages.length > 0 && (
                      <div className="mt-1 opacity-90">
                        {t('messages_count', { count: item.originalTask.messages.length })}
                      </div>
                    )}
                    {item.latestExecution?.messages && item.latestExecution.messages.length > 0 && (
                      <div className="mt-1 opacity-90">
                        {t('messages_count', { count: item.latestExecution.messages.length })}
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />

        {/* Information message */}
        {!isTaskDetailMode && (
          <div className="text-center text-sm p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 149, 0, 0.1)' }}>
            <div className="font-medium mb-1" style={{ color: '#FF9500' }}>
              📋 {t('readonly_mode_title')}
            </div>
            <div className="opacity-80">
              {t('readonly_mode_description')}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default HistoryPanel;