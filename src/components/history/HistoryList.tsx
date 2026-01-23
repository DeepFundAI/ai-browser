import React from 'react';
import { Button, List, Tag, Tooltip, Popconfirm, App } from 'antd';
import { EyeOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Task, TaskStatus } from '@/models';
import { taskStorage } from '@/services/task-storage';
import { useTranslation } from 'react-i18next';
import { HistoryItem } from './hooks/useHistoryData';

interface HistoryListProps {
  loading: boolean;
  filteredItems: HistoryItem[];
  currentTaskId?: string;
  isTaskDetailMode: boolean;
  onSelectItem: (item: HistoryItem) => void;
  onDeleteTask: (item: HistoryItem) => void;
}

/**
 * History List Component
 * Renders the list of history items with actions
 */
export const HistoryList: React.FC<HistoryListProps> = ({
  loading,
  filteredItems,
  currentTaskId,
  isTaskDetailMode,
  onSelectItem,
  onDeleteTask
}) => {
  const { t } = useTranslation('history');

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
        return <Tag color="red">{t('status_aborted')}</Tag>;
      default:
        return <Tag color="default">{t('status_unknown')}</Tag>;
    }
  };

  return (
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
          className={`cursor-pointer transition-all duration-200 rounded-lg my-1 ${
            currentTaskId === item.id
              ? 'bg-primary/10 dark:bg-primary/20'
              : 'hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
          style={{
            borderLeft: currentTaskId === item.id ? '3px solid var(--primary-color, #5e31d8)' : '3px solid transparent'
          }}
          onClick={() => onSelectItem(item)}
          actions={[
            item.taskType === 'normal' && (
              <Tooltip key="view" title={t('view_details')}>
                <Button
                  type="text"
                  icon={<EyeOutlined />}
                  size="small"
                  className="!text-gray-500 dark:!text-gray-400 hover:!text-primary dark:hover:!text-purple-400 hover:!bg-primary/10 cursor-pointer transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectItem(item);
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
                onDeleteTask(item);
              }}
              styles={{
                body: {
                  backgroundColor: 'rgba(30, 28, 35, 0.98)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(94, 49, 216, 0.3)'
                }
              }}
            >
              <Tooltip title={item.taskType === 'scheduled' && !isTaskDetailMode ? t('delete_all_executions') : t('delete_task')}>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  className="!text-red-400 hover:!text-red-300 hover:!bg-red-500/10 cursor-pointer transition-all duration-200"
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
                    <ClockCircleOutlined className="text-primary dark:text-purple-400" />
                  )}
                  <span className="text-sm font-medium truncate text-text-01 dark:text-text-01-dark">
                    {item.name}
                  </span>
                </div>
                {getStatusTag(item.status)}
              </div>
            }
            description={
              <div className="text-xs text-text-12 dark:text-text-12-dark opacity-70">
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
  );
};
