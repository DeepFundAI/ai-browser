import React from 'react';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const { Title, Paragraph } = Typography;

export const AboutPanel: React.FC = () => {
  const { t } = useTranslation('settings');

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <InfoCircleOutlined className="text-3xl text-blue-400" />
        <Title level={2} className="!text-text-01 dark:!text-text-01-dark !mb-0">
          {t('about.title')}
        </Title>
      </div>

      <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/10 p-8">
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DeepFundAI Browser
            </div>
            <Paragraph className="!text-text-12 dark:text-text-12-dark text-lg">
              AI-powered browser with advanced automation capabilities
            </Paragraph>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200 dark:border-white/10">
            <div>
              <div className="text-text-12 dark:text-text-12-dark text-sm mb-1">{t('about.version')}</div>
              <div className="text-text-01 dark:text-text-01-darkfont-semibold">0.0.15</div>
            </div>
            <div>
              <div className="text-text-12 dark:text-text-12-dark text-sm mb-1">{t('about.license')}</div>
              <div className="text-text-01 dark:text-text-01-darkfont-semibold">MIT</div>
            </div>
            <div>
              <div className="text-text-12 dark:text-text-12-dark text-sm mb-1">Electron</div>
              <div className="text-text-01 dark:text-text-01-darkfont-semibold">33.2.0</div>
            </div>
            <div>
              <div className="text-text-12 dark:text-text-12-dark text-sm mb-1">Next.js</div>
              <div className="text-text-01 dark:text-text-01-darkfont-semibold">15.4.8</div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-white/10">
            <Paragraph className="!text-text-12 dark:text-text-12-dark text-center">
              {t('about.copyright')}
            </Paragraph>
          </div>
        </div>
      </div>
    </div>
  );
};
