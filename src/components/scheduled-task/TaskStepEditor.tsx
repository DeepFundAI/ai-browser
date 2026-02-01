import React, { useState, useEffect } from 'react';
import { Input, Modal, List, Card } from 'antd';
import { DeleteOutlined, HolderOutlined, PlusOutlined } from '@ant-design/icons';
import { TaskStep, TaskTemplate } from '@/models';
import { useScheduledTaskStore } from '@/stores/scheduled-task-store';
import { useTranslation } from 'react-i18next';
import { ActionButton } from '@/components/ui';

interface TaskStepEditorProps {
  value?: TaskStep[];
  onChange?: (steps: TaskStep[]) => void;
}

/**
 * Task step editor
 * Supports manual step addition and API template import
 */
export const TaskStepEditor: React.FC<TaskStepEditorProps> = ({ value = [], onChange }) => {
  const { t } = useTranslation('scheduledTask');
  const steps = value;
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const { templates, loadTemplates } = useScheduledTaskStore();

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add new step
  const handleAddStep = () => {
    const newStep: TaskStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: '',
      content: '',
      order: steps.length + 1,
    };

    const newSteps = [...steps, newStep];
    onChange?.(newSteps);
  };

  // Update step
  const handleUpdateStep = (id: string, updates: Partial<TaskStep>) => {
    const newSteps = steps.map((step) =>
      step.id === id ? { ...step, ...updates } : step
    );
    onChange?.(newSteps);
  };

  // Delete step
  const handleRemoveStep = (id: string) => {
    const newSteps = steps.filter((step) => step.id !== id);
    // Reorder
    const reorderedSteps = newSteps.map((step, index) => ({
      ...step,
      order: index + 1,
    }));
    onChange?.(reorderedSteps);
  };

  // Import steps from API
  const handleImportFromTemplate = (template: TaskTemplate) => {
    const importedSteps: TaskStep[] = template.steps.map((step) => ({
      ...step,
      id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    }));

    onChange?.(importedSteps);
    setShowTemplateModal(false);
  };

  // Move step up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;

    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];

    // Reorder
    const reorderedSteps = newSteps.map((step, idx) => ({
      ...step,
      order: idx + 1,
    }));

    onChange?.(reorderedSteps);
  };

  // Move step down
  const handleMoveDown = (index: number) => {
    if (index === steps.length - 1) return;

    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];

    // Reorder
    const reorderedSteps = newSteps.map((step, idx) => ({
      ...step,
      order: idx + 1,
    }));

    onChange?.(reorderedSteps);
  };

  return (
    <div className="task-step-editor">
      {/* Action buttons */}
      <div className="mb-4 flex gap-2">
        <ActionButton
          variant="primary"
          icon={<PlusOutlined />}
          onClick={handleAddStep}
        >
          {t('manual_add_step')}
        </ActionButton>
        <ActionButton
          variant="secondary"
          onClick={() => setShowTemplateModal(true)}
        >
          {t('import_from_template')}
        </ActionButton>
      </div>

      {/* Step list */}
      {steps.length === 0 ? (
        <div className="text-center py-8 text-text-12 dark:!text-text-12-dark bg-tool-call dark:!bg-tool-call-dark rounded border border-border-message dark:!border-border-message-dark">
          {t('no_steps')}
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step, index) => (
            <Card
              key={step.id}
              className="!bg-tool-call dark:!bg-tool-call-dark !border-border-message dark:!border-border-message-dark"
              size="small"
            >
              <div className="flex items-start gap-3">
                {/* Step number and drag icon */}
                <div className="flex flex-col items-center gap-1 pt-1">
                  <HolderOutlined className="text-text-12 dark:!text-text-12-dark cursor-move" />
                  <span className="text-sm font-bold text-text-01 dark:!text-text-01-dark">
                    {index + 1}
                  </span>
                </div>

                {/* Step content */}
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder={t('step_name')}
                    value={step.name}
                    onChange={(e) =>
                      handleUpdateStep(step.id, { name: e.target.value })
                    }
                    className="!bg-main-view dark:!bg-main-view-dark !border-border-message dark:!border-border-message-dark !text-text-01 dark:!text-text-01-dark"
                  />
                  <Input.TextArea
                    placeholder={t('step_description')}
                    value={step.content}
                    onChange={(e) =>
                      handleUpdateStep(step.id, { content: e.target.value })
                    }
                    rows={2}
                    className="!bg-main-view dark:!bg-main-view-dark !border-border-message dark:!border-border-message-dark !text-text-01 dark:!text-text-01-dark"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-1">
                  <ActionButton
                    variant="secondary"
                    size="small"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    ↑
                  </ActionButton>
                  <ActionButton
                    variant="secondary"
                    size="small"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === steps.length - 1}
                  >
                    ↓
                  </ActionButton>
                  <ActionButton
                    variant="danger"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveStep(step.id)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Template selection modal */}
      <Modal
        open={showTemplateModal}
        onCancel={() => setShowTemplateModal(false)}
        title={t('select_template')}
        footer={null}
        width={600}
      >
        <List
          dataSource={templates}
          renderItem={(template) => (
            <List.Item
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 px-4 rounded transition-all duration-200"
              onClick={() => handleImportFromTemplate(template)}
            >
              <List.Item.Meta
                title={<span className="text-text-01 dark:!text-text-01-dark">{template.name}</span>}
                description={
                  <div className="text-text-12 dark:!text-text-12-dark">
                    <div>{template.description}</div>
                    <div className="mt-1 text-xs">
                      {t('contains_steps', { count: template.steps.length })}
                      {template.category && ` · ${template.category}`}
                    </div>
                  </div>
                }
              />
              <ActionButton
                variant="primary"
                size="small"
              >
                {t('select')}
              </ActionButton>
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};
