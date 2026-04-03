/**
 * INPUT: agent node data, edit callbacks
 * OUTPUT: editable step node with inline editing support
 * POSITION: sub-component of WorkflowDisplay in edit mode
 */

import React, { useState } from 'react';
import { Input } from 'antd';
import { DeleteOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface EditableStepNodeProps {
  node: any;
  nodeIndex: number;
  onUpdate: (index: number, text: string) => void;
  onDelete: (index: number) => void;
  onAdd: (afterIndex: number) => void;
}

/** Editable workflow step with inline editing */
export const EditableStepNode: React.FC<EditableStepNodeProps> = ({
  node,
  nodeIndex,
  onUpdate,
  onDelete,
  onAdd
}) => {
  const { t } = useTranslation('main');

  const nodeText = typeof node === 'string'
    ? node
    : (node?.text ?? node?.description ?? (typeof node === 'object' ? JSON.stringify(node) : String(node ?? '')));

  // Auto-edit mode for newly added empty nodes
  const [editing, setEditing] = useState(!!node?._isNew);

  const handleSave = (value: string) => {
    setEditing(false);
    if (value.trim()) {
      onUpdate(nodeIndex, value.trim());
    } else if (node?._isNew) {
      onDelete(nodeIndex);
    }
  };

  return (
    <div className="group mt-2">
      <div className="step-item flex items-center gap-2">
        <span className="font-semibold w-5 h-5 bg-step dark:bg-step-dark rounded-full flex items-center justify-center shrink-0 text-xs">
          {nodeIndex + 1}
        </span>

        {editing ? (
          <Input
            autoFocus
            size="small"
            defaultValue={nodeText}
            onPressEnter={(e) => handleSave(e.currentTarget.value)}
            onBlur={(e) => handleSave(e.target.value)}
            className="flex-1"
          />
        ) : (
          <span className="line-clamp-1 flex-1 cursor-pointer" onClick={() => setEditing(true)}>
            {nodeText}
          </span>
        )}

        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <EditOutlined
            className="text-base text-text-05 dark:text-text-05-dark cursor-pointer hover:text-primary"
            onClick={() => setEditing(true)}
          />
          <DeleteOutlined
            className="text-base text-text-05 dark:text-text-05-dark cursor-pointer hover:text-red-500"
            onClick={() => onDelete(nodeIndex)}
          />
        </div>
      </div>

      {/* Add step button between nodes */}
      <div className="flex justify-center mt-1 h-0 overflow-visible opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onAdd(nodeIndex)}
          className="flex items-center gap-1 text-xs text-text-05 dark:text-text-05-dark hover:text-primary border border-dashed border-text-05/30 dark:border-text-05-dark/30 rounded px-2 py-0.5 bg-transparent cursor-pointer"
        >
          <PlusOutlined className="text-[10px]" />
          {t('add_step')}
        </button>
      </div>
    </div>
  );
};
