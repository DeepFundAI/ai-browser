'use client';

import React from 'react';
import { Button, Space, Typography } from 'antd';
import { SaveOutlined, ReloadOutlined, SettingOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

interface ConfigHeaderProps {
  onSave: () => void;
  onReload: () => void;
  saving: boolean;
}

/**
 * Agent Configuration Page Header Component
 * Displays title, back button, and action buttons
 */
export const ConfigHeader: React.FC<ConfigHeaderProps> = ({
  onSave,
  onReload,
  saving
}) => {
  const { t } = useTranslation('agentConfig');
  const router = useRouter();

  return (
    <div className="mb-6 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/home')}
          className="px-2 py-1"
        >
          {t('back')}
        </Button>
        <div>
          <Title level={2} className="m-0 flex items-center gap-3">
            <SettingOutlined />
            {t('title')}
          </Title>
          <Text type="secondary">{t('subtitle')}</Text>
        </div>
      </div>
      <Space>
        <Button icon={<ReloadOutlined />} onClick={onReload}>
          {t('reload')}
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={onSave}
          loading={saving}
        >
          {t('save')}
        </Button>
      </Space>
    </div>
  );
};
