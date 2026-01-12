"use client";

import { useState, useEffect, useRef } from 'react';
import { Layout, Typography, Button, Space, Spin, App } from 'antd';
import { twMerge } from 'tailwind-merge';
import {
  FileTextOutlined,
  DownloadOutlined,
  CopyOutlined,
  CodeOutlined,
  FileOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { CodePreview } from '@/components/file-preview';

const { Content } = Layout;
const { Title, Text } = Typography;

// Dark theme action button with unified styling
const ActionButton: React.FC<{
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}> = ({ icon, onClick, disabled, active, children }) => {
  const baseStyles = [
    '!bg-transparent',
    '!border-[rgba(255,255,255,0.2)]',
    '!text-gray-300',
    'hover:!text-white',
    'hover:!border-blue-500',
    'disabled:!text-gray-600',
    'disabled:!border-gray-700'
  ];

  return (
    <Button
      icon={icon}
      size="small"
      onClick={onClick}
      disabled={disabled}
      type={active ? 'primary' : 'default'}
      className={active ? '' : twMerge(baseStyles)}
    >
      {children}
    </Button>
  );
};

interface FileViewState {
  content: string;
  isLoading: boolean;
  fileName: string;
  lastUpdated: Date | null;
  wordCount: number;
  lineCount: number;
  url: string;
}

export default function FileView() {
  const { t } = useTranslation('fileView');
  const { message } = App.useApp();
  const [fileState, setFileState] = useState<FileViewState>({
    content: '',
    isLoading: true,
    fileName: 'filename',
    lastUpdated: null,
    wordCount: 0,
    lineCount: 0,
    url: ''
  });

  const contentRef = useRef<HTMLDivElement>(null);

  type ShowTypeOption = 'code' | 'preview';

  const [showType, setShowType] = useState<ShowTypeOption>('code');

  // Calculate file statistics
  const calculateStats = (content: string) => {
    const lineCount = content.split('\n').length;
    const wordCount = content.replace(/\s+/g, ' ').trim().split(' ').filter(word => word.length > 0).length;
    return { wordCount, lineCount };
  };

  // Listen for file update events
  useEffect(() => {
    const handleFileUpdated = (status: ShowTypeOption, content: string, fileName?: string) => {
      setShowType(status)
      if (status === 'preview') {
        setFileState(pre => ({
          ...pre,
          url: content,
          isLoading: false,
          lastUpdated: new Date(),
        }))
        return;
      }

      const stats = calculateStats(content);

      setFileState(prev => ({
        ...prev,
        content,
        fileName: fileName || prev.fileName,
        isLoading: false,
        lastUpdated: new Date(),
        wordCount: stats.wordCount,
        lineCount: stats.lineCount
      }));

      // Scroll to bottom to show latest content
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
      }, 100);
    };

    // Listen for file update events from main thread
    if ((window.api as any)?.onFileUpdated) {
      (window.api as any).onFileUpdated(handleFileUpdated);
    }

    // Set loading state on initialization
    setTimeout(() => {
      if (fileState.content === '') {
        setFileState(prev => ({ ...prev, isLoading: false }));
      }
    }, 3000);

    // Clean up listeners
    return () => {
      if (window.api?.removeAllListeners) {
        window.api.removeAllListeners('file-updated');
      }
    };
  }, []);

  // Copy content to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fileState.content);
      message.success(t('copy_success'));
    } catch (error) {
      console.error('Copy failed:', error);
      message.error(t('copy_failed'));
    }
  };

  // Download file
  const handleDownload = () => {
    const blob = new Blob([fileState.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileState.fileName}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success(t('download_success'));
  };

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Layout className="h-screen bg-[#1D273F]">
      <Content className="p-4 flex flex-col gap-0">
        {/* Header information bar */}
        <div className="flex justify-between items-center px-4 py-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] border-b-0 rounded-t-lg">
          <div className="flex items-center gap-3">
            <FileTextOutlined className="text-xl text-blue-400" />
            <div>
              <Title level={5} className="!m-0 !text-white !font-medium">
                {t('title')}
              </Title>
              <Text className="text-xs !text-gray-400">
                {fileState.lastUpdated ? t('last_updated', { time: formatTime(fileState.lastUpdated) }) : t('waiting_content')}
              </Text>
            </div>
          </div>

          <Space>
            <Text className="text-xs !text-gray-400">
              {t('stats', { lines: fileState.lineCount, words: fileState.wordCount })}
            </Text>
            <ActionButton
              icon={<CodeOutlined />}
              onClick={() => setShowType('code')}
              active={showType === 'code'}
            >
              {t('code')}
            </ActionButton>
            <ActionButton
              icon={<FileOutlined />}
              onClick={() => setShowType('preview')}
              disabled={!fileState.url}
              active={showType === 'preview'}
            >
              {t('preview')}
            </ActionButton>
            <ActionButton
              icon={<CopyOutlined />}
              onClick={handleCopy}
              disabled={!fileState.content}
            >
              {t('copy')}
            </ActionButton>
            <ActionButton
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              disabled={!fileState.content}
            >
              {t('download')}
            </ActionButton>
          </Space>
        </div>

        {/* File content area */}
        {showType === 'code' ? (
          <div className="flex-1 overflow-auto bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] border-t-0 rounded-b-lg p-4" ref={contentRef}>
            {fileState.isLoading ? (
              <div className="flex justify-center items-center h-full flex-col gap-4">
                <Spin size="large" />
                <Text type="secondary">{t('waiting_ai')}</Text>
              </div>
            ) : fileState.content ? (
              <CodePreview
                content={fileState.content}
                fileName={fileState.fileName}
              />
            ) : (
              <div className="flex justify-center items-center h-full flex-col gap-4">
                <FileTextOutlined className="text-6xl text-gray-500" />
                <div className="text-center">
                  <Title level={4} type="secondary">{t('no_content')}</Title>
                  <Text type="secondary">
                    {t('no_content_hint')}
                  </Text>
                </div>
              </div>
            )}
          </div>
        ) : (
          <iframe src={fileState.url} className="flex-1 bg-white rounded-b-lg border border-[rgba(255,255,255,0.1)] border-t-0" />
        )}

      </Content>
    </Layout>
  );
}
