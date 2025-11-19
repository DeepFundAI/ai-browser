import React, { useState, useMemo } from 'react';
import { FileAttachment } from '@/models';
import { FileTextOutlined, FileMarkdownOutlined, CodeOutlined, FileOutlined, LinkOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface FileAttachmentListProps {
  files: FileAttachment[];
  onFileClick?: (file: FileAttachment) => void;
}

type FilterType = 'all' | 'markdown' | 'code' | 'text' | 'other';

export const FileAttachmentList: React.FC<FileAttachmentListProps> = ({ files, onFileClick }) => {
  const { t } = useTranslation('main');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter files based on selected type
  const filteredFiles = useMemo(() => {
    if (filter === 'all') return files;
    return files.filter(file => file.type === filter);
  }, [files, filter]);

  // Get file icon based on type
  const getFileIcon = (type: FileAttachment['type']) => {
    switch (type) {
      case 'markdown':
        return <FileMarkdownOutlined className="text-blue-500" />;
      case 'code':
        return <CodeOutlined className="text-green-500" />;
      case 'text':
        return <FileTextOutlined className="text-gray-500" />;
      default:
        return <FileOutlined className="text-gray-400" />;
    }
  };

  // Format file size
  const formatFileSize = (size?: number) => {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (!files || files.length === 0) return null;

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('file_filter.all') },
    { key: 'markdown', label: t('file_filter.markdown') },
    { key: 'code', label: t('file_filter.code') },
    { key: 'text', label: t('file_filter.text') },
    { key: 'other', label: t('file_filter.other') },
  ];

  return (
    <div className="border border-border-message rounded-lg bg-tool-call/30 mb-2">
      {/* Header - clickable to toggle collapse */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-tool-call/50 transition-colors rounded-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <FileOutlined />
          {t('file_attachments_title', { count: files.length })}
        </h4>
        <div className="text-text-12-dark">
          {isExpanded ? <UpOutlined className="text-xs" /> : <DownOutlined className="text-xs" />}
        </div>
      </div>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="px-3 pb-3">
          {/* Filter tabs */}
          <div className="flex gap-2 mb-3 flex-wrap">
        {filterOptions.map(option => {
          const count = option.key === 'all' ? files.length : files.filter(f => f.type === option.key).length;
          if (count === 0 && option.key !== 'all') return null;

          return (
            <button
              key={option.key}
              onClick={(e) => {
                e.stopPropagation();
                setFilter(option.key);
              }}
              className={`px-3 py-1 rounded-full text-xs transition-all ${
                filter === option.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-tool-call text-text-12-dark hover:bg-border-message'
              }`}
            >
              {option.label} ({count})
            </button>
          );
        })}
      </div>

          {/* File list */}
          <div className="space-y-2">
            {filteredFiles.map(file => (
              <div
                key={file.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onFileClick?.(file);
                }}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-tool-call cursor-pointer transition-colors group"
              >
                {/* File icon */}
                <div className="text-lg flex-shrink-0">
                  {getFileIcon(file.type)}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-01-dark line-clamp-1 group-hover:text-blue-500 transition-colors">
                    {file.name}
                  </div>
                  <div className="text-xs text-text-12-dark flex items-center gap-2">
                    <span>{formatDate(file.createdAt)}</span>
                    {file.size && (
                      <>
                        <span>•</span>
                        <span>{formatFileSize(file.size)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Link icon */}
                <div className="flex-shrink-0 text-text-12-dark opacity-0 group-hover:opacity-100 transition-opacity">
                  <LinkOutlined />
                </div>
              </div>
            ))}
          </div>

          {/* Empty state for filtered results */}
          {filteredFiles.length === 0 && filter !== 'all' && (
            <div className="text-center py-6 text-text-12-dark text-sm">
              {t('no_files_in_filter')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
