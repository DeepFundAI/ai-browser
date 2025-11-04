import React, { useEffect } from 'react';
import { Modal, List, Button, Switch, Popconfirm, Tag, Empty, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useScheduledTaskStore } from '@/stores/scheduled-task-store';
import { ScheduledTask } from '@/models';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { ScheduledTaskModal } from './ScheduledTaskModal';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '@/stores/languageStore';

interface ScheduledTaskListModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Scheduled task list modal (for Toolbox page)
 */
export const ScheduledTaskListModal: React.FC<ScheduledTaskListModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation('scheduledTask');
  const { language } = useLanguageStore();
  const { message } = App.useApp();
  const {
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
    if (visible) {
      loadScheduledTasks();
    }
  }, [visible]);

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
        // Close modal
        onClose();
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
      <Modal
        title={t('scheduled_tasks')}
        open={visible}
        onCancel={onClose}
        width="90%"
        footer={null}
        style={{ minHeight: '60vh' }}
        styles={{
          body: { minHeight: '50vh', maxHeight: '75vh', overflowY: 'auto', padding: '24px' }
        }}
      >
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
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
              style={{
                background: 'rgba(0, 0, 0, 0.02)',
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px'
              }}
              key={task.id}
            >
              <div style={{ width: '100%' }}>
                {/* Task header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                        {task.name}
                      </h4>
                      <Tag color={task.enabled ? 'success' : 'default'}>
                        {task.enabled ? t('enabled') : t('disabled')}
                      </Tag>
                    </div>
                    {task.description && (
                      <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
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
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                  <span>
                    <ClockCircleOutlined style={{ marginRight: '4px' }} />
                    {getIntervalText(task)}
                  </span>
                  <span>{t('last', { time: getLastExecutedText(task) })}</span>
                  <span>{t('steps_count', { count: task.steps.length })}</span>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                    {t('history')}
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
      </Modal>

      {/* Create/Edit task modal */}
      <ScheduledTaskModal />
    </>
  );
};
