import React, { useEffect } from 'react';
import { Modal, Form, Input, Switch, App } from 'antd';
import { TaskStepEditor } from './TaskStepEditor';
import { ScheduleConfigEditor } from './ScheduleConfigEditor';
import { useScheduledTaskStore } from '@/stores/scheduled-task-store';
import { TaskStep, ScheduleConfig } from '@/models';
import { useTranslation } from 'react-i18next';

/**
 * Scheduled task create/edit modal
 */
export const ScheduledTaskModal: React.FC = () => {
  const { t } = useTranslation('scheduledTask');
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const {
    showCreateModal,
    setShowCreateModal,
    isEditMode,
    selectedTask,
    createTask,
    updateTask,
  } = useScheduledTaskStore();

  // Initialize form
  useEffect(() => {
    if (showCreateModal) {
      if (isEditMode && selectedTask) {
        // Edit mode: populate existing data
        form.setFieldsValue({
          name: selectedTask.name,
          description: selectedTask.description,
          steps: selectedTask.steps,
          schedule: selectedTask.schedule,
          enabled: selectedTask.enabled,
        });
      } else {
        // Create mode: reset form
        form.resetFields();
        form.setFieldsValue({
          enabled: true,
          schedule: {
            type: 'interval',
            intervalUnit: 'minute',
            intervalValue: 1,
          },
          steps: [],
        });
      }
    }
  }, [showCreateModal, isEditMode, selectedTask, form]);

  // Submit form
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Validate steps
      if (!values.steps || values.steps.length === 0) {
        message.error(t('add_step_required'));
        return;
      }

      // Validate step content
      const hasEmptyStep = values.steps.some(
        (step: TaskStep) => !step.name || !step.content
      );

      if (hasEmptyStep) {
        message.error(t('complete_step_info'));
        return;
      }

      if (isEditMode && selectedTask) {
        // Update task
        await updateTask(selectedTask.id, {
          name: values.name,
          description: values.description,
          steps: values.steps,
          schedule: values.schedule,
          enabled: values.enabled,
          source: 'manual', // Manually created task
        });

        message.success(t('task_updated'));
      } else {
        // Create task
        await createTask({
          name: values.name,
          description: values.description,
          steps: values.steps,
          schedule: values.schedule,
          enabled: values.enabled,
          source: 'manual',
        });

        message.success(t('task_created'));
      }

      handleCancel();
    } catch (error: any) {
      console.error('Submit failed:', error);
      message.error(error.message || t('operation_failed'));
    }
  };

  // Cancel
  const handleCancel = () => {
    form.resetFields();
    setShowCreateModal(false);
  };

  return (
    <Modal
      open={showCreateModal}
      onCancel={handleCancel}
      onOk={handleSubmit}
      title={isEditMode ? t('edit_task') : t('create_task')}
      width={900}
      centered
      style={{ top: 20 }}
      styles={{
        body: { minHeight: '50vh', maxHeight: '70vh', overflowY: 'auto' }
      }}
      okText={isEditMode ? t('save') : t('create_and_enable')}
      cancelText={t('cancel')}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
      >
        {/* Task name */}
        <Form.Item
          name="name"
          label={t('task_name')}
          rules={[{ required: true, message: t('enter_task_name') }]}
        >
          <Input
            placeholder={t('enter_task_name')}
            className="!bg-main-view dark:!bg-main-view-dark !border-border-message dark:!border-border-message-dark !text-text-01 dark:!text-text-01-dark"
          />
        </Form.Item>

        {/* Task description */}
        <Form.Item
          name="description"
          label={t('task_description')}
        >
          <Input.TextArea
            placeholder={t('enter_task_description')}
            rows={2}
            className="!bg-main-view dark:!bg-main-view-dark !border-border-message dark:!border-border-message-dark !text-text-01 dark:!text-text-01-dark"
          />
        </Form.Item>

        {/* Task steps */}
        <Form.Item
          name="steps"
          label={t('task_steps')}
          rules={[
            {
              validator: async (_, value) => {
                if (!value || value.length === 0) {
                  throw new Error(t('add_step_required'));
                }
              },
            },
          ]}
        >
          <TaskStepEditor />
        </Form.Item>

        {/* Schedule configuration */}
        <Form.Item
          name="schedule"
          label={t('schedule_config')}
          rules={[{ required: true, message: t('configure_interval') }]}
        >
          <ScheduleConfigEditor />
        </Form.Item>

        {/* Whether to enable */}
        <Form.Item
          name="enabled"
          label={t('enable_on_create')}
          valuePropName="checked"
        >
          <Switch className="cursor-pointer" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
