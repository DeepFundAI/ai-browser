/**
 * Scheduled Tasks configuration panel
 * INPUT: Scheduled task data from store
 * OUTPUT: Task management UI
 * POSITION: Fifth tab in settings window for scheduled task management
 */

import React, { useEffect } from 'react';
import {
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  HistoryOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { Typography, Switch, Popconfirm, Spin, App } from 'antd';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { SelectableCard, ActionButton } from '@/components/ui';
import { useScheduledTaskStore } from '@/stores/scheduled-task-store';
import { ScheduledTaskModal } from '@/components/scheduled-task/ScheduledTaskModal';
import { ScheduledTask } from '@/models';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useLanguageStore } from '@/stores/languageStore';

const { Title, Paragraph, Text } = Typography;

/**
 * Task card component
 */
interface TaskCardProps {
  task: ScheduledTask;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onExecuteNow: () => void;
  onViewHistory: () => void;
  getIntervalText: (task: ScheduledTask) => string;
  getLastExecutedText: (task: ScheduledTask) => string;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggle,
  onEdit,
  onDelete,
  onExecuteNow,
  onViewHistory,
  getIntervalText,
  getLastExecutedText
}) => {
  const { t } = useTranslation('settings');

  return (
    <SelectableCard
      selected={task.enabled}
      hoverScale={false}
      className="p-4 mb-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Text className="!text-text-01 dark:!text-text-01-dark font-semibold text-base">{task.name}</Text>
            <span
              className={clsx(
                'px-2 py-0.5 rounded text-xs',
                task.enabled
                  ? 'bg-primary/20 text-primary dark:text-purple-400'
                  : 'bg-gray-500/20 text-text-12 dark:text-text-12-dark'
              )}
            >
              {task.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          {task.description && (
            <Text className="!text-text-12 dark:text-text-12-dark text-sm block">{task.description}</Text>
          )}
        </div>
        <Switch
          checked={task.enabled}
          onChange={onToggle}
          size="small"
          className="cursor-pointer"
        />
      </div>

      {/* Info */}
      <div className="flex items-center gap-4 text-xs text-text-12 dark:text-text-12-dark mb-3">
        <span className="flex items-center gap-1">
          <ClockCircleOutlined />
          {getIntervalText(task)}
        </span>
        <span>Last: {getLastExecutedText(task)}</span>
        <span>{task.steps.length} step{task.steps.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <ActionButton
          variant="secondary"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={onExecuteNow}
          disabled={!task.enabled}
        >
          {t('scheduled_tasks.run_now')}
        </ActionButton>
        <ActionButton
          variant="secondary"
          size="small"
          icon={<HistoryOutlined />}
          onClick={onViewHistory}
        >
          {t('scheduled_tasks.history')}
        </ActionButton>
        <ActionButton
          variant="secondary"
          size="small"
          icon={<EditOutlined />}
          onClick={onEdit}
        >
          {t('scheduled_tasks.edit')}
        </ActionButton>
        <Popconfirm
          title={t('scheduled_tasks.delete_confirm_title')}
          description={t('scheduled_tasks.delete_confirm_content')}
          onConfirm={onDelete}
          okText={t('scheduled_tasks.delete')}
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <ActionButton
            variant="danger"
            size="small"
            icon={<DeleteOutlined />}
          >
            {t('scheduled_tasks.delete')}
          </ActionButton>
        </Popconfirm>
      </div>
    </SelectableCard>
  );
};

/**
 * Scheduled Tasks configuration panel
 */
export const ScheduledTasksPanel: React.FC = () => {
  const { t } = useTranslation('settings');
  const { message } = App.useApp();
  const { language } = useLanguageStore();
  const {
    scheduledTasks,
    isLoading,
    loadScheduledTasks,
    toggleTaskEnabled,
    deleteTask,
    selectTask,
    setShowCreateModal,
    setIsEditMode,
    executeTaskNow
  } = useScheduledTaskStore();

  // Load tasks on mount
  useEffect(() => {
    loadScheduledTasks();
  }, [loadScheduledTasks]);

  // Get interval description
  const getIntervalText = (task: ScheduledTask): string => {
    const { schedule } = task;
    if (schedule.type === 'interval') {
      const unitLabels: Record<string, string> = {
        minute: 'min',
        hour: 'hr',
        day: 'day'
      };
      const unit = unitLabels[schedule.intervalUnit!] || schedule.intervalUnit;
      return `${t('scheduled_tasks.every_hour').split(' ')[0]} ${schedule.intervalValue} ${unit}${schedule.intervalValue !== 1 ? 's' : ''}`;
    }
    return t('scheduled_tasks.custom');
  };

  // Get last execution time description
  const getLastExecutedText = (task: ScheduledTask): string => {
    if (!task.lastExecutedAt) {
      return t('scheduled_tasks.never');
    }

    try {
      const locale = language === 'zh-CN' ? zhCN : enUS;
      return formatDistanceToNow(new Date(task.lastExecutedAt), {
        addSuffix: true,
        locale
      });
    } catch {
      return 'Unknown';
    }
  };

  // Handle edit
  const handleEdit = (task: ScheduledTask) => {
    selectTask(task);
    setIsEditMode(true);
    setShowCreateModal(true);
  };

  // Handle delete
  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      message.success(t('scheduled_tasks.delete_confirm_content'));
    } catch (error) {
      message.error('Failed to delete task');
    }
  };

  // Handle execute now
  const handleExecuteNow = async (task: ScheduledTask) => {
    try {
      await executeTaskNow(task);
      message.success('Task started');
    } catch (error) {
      message.error('Failed to execute task');
    }
  };

  // Handle view history
  const handleViewHistory = async (task: ScheduledTask) => {
    try {
      if (typeof window !== 'undefined' && (window as any).api) {
        await (window as any).api.invoke('open-task-history', task.id);
        message.success('Opening execution history...');
      }
    } catch (error) {
      console.error('Failed to open execution history:', error);
      message.error('Failed to open history');
    }
  };

  // Handle create new task
  const handleCreateNew = () => {
    setIsEditMode(false);
    selectTask(null);
    setShowCreateModal(true);
  };

  // Handle reload
  const handleReload = async () => {
    await loadScheduledTasks();
    message.success('Tasks reloaded');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header */}
      <div className="flex-shrink-0 p-8 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ClockCircleOutlined className="text-3xl text-primary dark:text-purple-400" />
            <Title level={2} className="!text-text-01 dark:!text-text-01-dark !mb-0">
              {t('scheduled_tasks.title')}
            </Title>
          </div>
          <div className="flex items-center gap-2">
            <ActionButton
              variant="secondary"
              icon={<ReloadOutlined />}
              onClick={handleReload}
            >
              Reload
            </ActionButton>
            <ActionButton
              variant="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateNew}
            >
              {t('scheduled_tasks.create_task')}
            </ActionButton>
          </div>
        </div>
        <Paragraph className="!text-text-12 dark:!text-text-12-dark !mb-0">
          {t('scheduled_tasks.description')}
        </Paragraph>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 p-8 pt-6">
        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/10 h-full flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Spin size="large" />
              </div>
            ) : scheduledTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-12 dark:text-text-12-dark">
                <div className="text-5xl mb-4">
                  <ClockCircleOutlined />
                </div>
                <div className="text-xl font-semibold mb-2">{t('scheduled_tasks.no_tasks')}</div>
                <div className="text-sm mb-6">{t('scheduled_tasks.no_tasks_desc')}</div>
                <ActionButton
                  variant="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateNew}
                >
                  {t('scheduled_tasks.create_task')}
                </ActionButton>
              </div>
            ) : (
              <div>
                <Text className="!text-text-12 dark:text-text-12-dark text-sm block mb-4">
                  {scheduledTasks.length} task{scheduledTasks.length !== 1 ? 's' : ''} configured
                </Text>
                {scheduledTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTaskEnabled(task.id)}
                    onEdit={() => handleEdit(task)}
                    onDelete={() => handleDelete(task.id)}
                    onExecuteNow={() => handleExecuteNow(task)}
                    onViewHistory={() => handleViewHistory(task)}
                    getIntervalText={getIntervalText}
                    getLastExecutedText={getLastExecutedText}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scheduled Task Modal (Create/Edit) */}
      <ScheduledTaskModal />
    </div>
  );
};
