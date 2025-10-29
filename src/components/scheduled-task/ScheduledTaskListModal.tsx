import React, { useEffect } from 'react';
import { Modal, List, Button, Switch, Popconfirm, Tag, Empty, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useScheduledTaskStore } from '@/stores/scheduled-task-store';
import { ScheduledTask } from '@/models';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ScheduledTaskModal } from './ScheduledTaskModal';

interface ScheduledTaskListModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Scheduled task list modal (for Toolbox page)
 */
export const ScheduledTaskListModal: React.FC<ScheduledTaskListModalProps> = ({ visible, onClose }) => {
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
      message.success('Task deleted successfully');
    } catch (error) {
      message.error('Delete failed');
    }
  };

  // Execute immediately
  const handleExecuteNow = async (task: ScheduledTask) => {
    try {
      await executeTaskNow(task);
      message.success('Task has started executing');
    } catch (error) {
      message.error('Execution failed');
    }
  };

  // View execution history
  const handleViewHistory = async (task: ScheduledTask) => {
    try {
      // Call main process to open task window history panel
      if (typeof window !== 'undefined' && (window as any).api) {
        await (window as any).api.invoke('open-task-history', task.id);
        message.success('Opening execution history');
        // Close modal
        onClose();
      }
    } catch (error) {
      console.error('Failed to open execution history:', error);
      message.error('Failed to open execution history');
    }
  };

  // Get interval description
  const getIntervalText = (task: ScheduledTask) => {
    const { schedule } = task;
    if (schedule.type === 'interval') {
      const unitText = {
        minute: 'minutes',
        hour: 'hours',
        day: 'days',
      };
      return `Every ${schedule.intervalValue} ${unitText[schedule.intervalUnit!]}`;
    }
    return 'Cron';
  };

  // Get last execution time description
  const getLastExecutedText = (task: ScheduledTask) => {
    if (!task.lastExecutedAt) {
      return 'Never executed';
    }

    try {
      return formatDistanceToNow(new Date(task.lastExecutedAt), {
        addSuffix: true,
        locale: zhCN,
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <>
      <Modal
        title="Scheduled Tasks"
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
          New Task
        </Button>
      </div>

      {scheduledTasks.length === 0 ? (
        <Empty
          description="No scheduled tasks yet"
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
            Create First Task
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
                        {task.enabled ? 'Enabled' : 'Disabled'}
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
                    checkedChildren="Enable"
                    unCheckedChildren="Disable"
                  />
                </div>

                {/* Task information */}
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                  <span>
                    <ClockCircleOutlined style={{ marginRight: '4px' }} />
                    {getIntervalText(task)}
                  </span>
                  <span>Last: {getLastExecutedText(task)}</span>
                  <span>Steps: {task.steps.length}</span>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleExecuteNow(task)}
                    disabled={!task.enabled}
                  >
                    Execute Now
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleViewHistory(task)}
                  >
                    History
                  </Button>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(task)}
                  >
                    Edit
                  </Button>
                  <Popconfirm
                    title="Confirm Deletion"
                    description="Once deleted, it cannot be recovered. Are you sure?"
                    onConfirm={() => handleDelete(task.id)}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                    >
                      Delete
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
