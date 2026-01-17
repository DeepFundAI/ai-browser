import React, { useEffect } from 'react';
import { Drawer, List, Button, Switch, Popconfirm, Tag, Empty, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useScheduledTaskStore } from '@/stores/scheduled-task-store';
import { ScheduledTask } from '@/models';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '@/stores/languageStore';

/**
 * Scheduled task list panel
 */
export const ScheduledTaskListPanel: React.FC = () => {
  const { t } = useTranslation('scheduledTask');
  const { language } = useLanguageStore();
  const { message } = App.useApp();
  const {
    showListPanel,
    setShowListPanel,
    scheduledTasks,
    loadScheduledTasks,
    toggleTaskEnabled,
    deleteTask,
    selectTask,
    setShowCreateModal,
    setIsEditMode,
    executeTaskNow,
  } = useScheduledTaskStore();

  useEffect(() => {
    if (showListPanel) {
      loadScheduledTasks();
    }
  }, [showListPanel]);

  // Edit task
  const handleEdit = (task: ScheduledTask) => {
    selectTask(task);
    setIsEditMode(true);
    setShowCreateModal(true);
  };

  // Delete task
  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      message.success(t('task_deleted_success'));
    } catch (error) {
      message.error(t('delete_failed'));
    }
  };

  // Execute immediately
  const handleExecuteNow = async (task: ScheduledTask) => {
    try {
      await executeTaskNow(task);
      message.success(t('task_started'));
    } catch (error) {
      message.error(t('execution_failed'));
    }
  };

  // View execution history
  const handleViewHistory = async (task: ScheduledTask) => {
    try {
      // Call main process to open task window history panel
      if (typeof window !== 'undefined' && (window as any).api) {
        await (window as any).api.invoke('open-task-history', task.id);
        message.success(t('opening_history'));
        // Close task list panel
        setShowListPanel(false);
      }
    } catch (error) {
      console.error('Failed to open execution history:', error);
      message.error(t('open_history_failed'));
    }
  };

  // Get interval description
  const getIntervalText = (task: ScheduledTask) => {
    const { schedule } = task;
    if (schedule.type === 'interval') {
      const unitMap = {
        minute: 'every_minutes',
        hour: 'every_hours',
        day: 'every_days',
      };
      return t(unitMap[schedule.intervalUnit!], { count: schedule.intervalValue });
    }
    return t('cron');
  };

  // Get last execution time description
  const getLastExecutedText = (task: ScheduledTask) => {
    if (!task.lastExecutedAt) {
      return t('never_executed');
    }

    try {
      const locale = language === 'zh-CN' ? zhCN : enUS;
      return formatDistanceToNow(new Date(task.lastExecutedAt), {
        addSuffix: true,
        locale,
      });
    } catch {
      return t('unknown');
    }
  };

  return (
    <>
      <Drawer
        title={
          <div className="flex items-center justify-between">
            <span>{t('task_list')}</span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setIsEditMode(false);
                selectTask(null);
                setShowCreateModal(true);
              }}
            >
              {t('new_task')}
            </Button>
          </div>
        }
        open={showListPanel}
        onClose={() => setShowListPanel(false)}
        size="default"
        className="scheduled-task-list-panel"
        styles={{
        wrapper: {
          marginTop: '48px', // header height
          height: 'calc(100vh - 48px)', // subtract header height
          borderLeft: '1px solid rgba(94, 49, 216, 0.2)', // Subtle purple border
        },
        body: {
          padding: '16px',
          height: '100%',
          // Fellou.ai inspired elegant gradient background
          background: 'linear-gradient(180deg, #1e1c23 0%, #281c39 100%)',
          backdropFilter: 'blur(16px)',
        }
      }}
      >
        {scheduledTasks.length === 0 ? (
          <Empty
            description={t('no_tasks')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              onClick={() => {
                setIsEditMode(false);
                selectTask(null);
                setShowCreateModal(true);
              }}
            >
              {t('create_first_task')}
            </Button>
          </Empty>
        ) : (
          <List
            dataSource={scheduledTasks}
            renderItem={(task) => (
              <List.Item
                className="!bg-tool-call dark:bg-tool-call-dark !border !border-border-message dark:border-border-message-dark rounded-lg px-4 mb-3"
                key={task.id}
              >
                <div className="w-full px-2">
                  {/* Task header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base font-semibold text-text-01 dark:text-text-01-dark m-0">
                          {task.name}
                        </h4>
                        <Tag color={task.enabled ? 'success' : 'default'}>
                          {task.enabled ? t('enabled') : t('disabled')}
                        </Tag>
                      </div>
                      {task.description && (
                        <p className="text-sm text-text-12 dark:text-text-12-dark m-0 mb-2">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Enable switch */}
                    <Switch
                      checked={task.enabled}
                      onChange={() => toggleTaskEnabled(task.id)}
                      checkedChildren={t('enable')}
                      unCheckedChildren={t('disable')}
                    />
                  </div>

                  {/* Task information */}
                  <div className="flex items-center gap-4 text-sm text-text-12 dark:text-text-12-dark mb-3">
                    <span>
                      <ClockCircleOutlined className="mr-1" />
                      {getIntervalText(task)}
                    </span>
                    <span>{t('last_executed', { time: getLastExecutedText(task) })}</span>
                    <span>{t('steps_count', { count: task.steps.length })}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="small"
                      icon={<PlayCircleOutlined />}
                      onClick={() => handleExecuteNow(task)}
                      disabled={!task.enabled}
                    >
                      {t('execute_now')}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleViewHistory(task)}
                    >
                      {t('execution_history')}
                    </Button>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(task)}
                    >
                      {t('edit')}
                    </Button>
                    <Popconfirm
                      title={t('confirm_deletion')}
                      description={t('confirm_deletion_message')}
                      onConfirm={() => handleDelete(task.id)}
                      okText={t('delete')}
                      cancelText={t('cancel')}
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                      >
                        {t('delete')}
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </>
  );
};
