import React from 'react';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

export const AboutPanel: React.FC = () => {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <InfoCircleOutlined className="text-3xl text-blue-400" />
        <Title level={2} className="!text-white !mb-0">
          About
        </Title>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-8">
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DeepFundAI Browser
            </div>
            <Paragraph className="!text-gray-400 text-lg">
              AI-powered browser with advanced automation capabilities
            </Paragraph>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
            <div>
              <div className="text-gray-400 text-sm mb-1">Version</div>
              <div className="text-white font-semibold">0.0.15</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">License</div>
              <div className="text-white font-semibold">MIT</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Electron</div>
              <div className="text-white font-semibold">33.2.0</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Next.js</div>
              <div className="text-white font-semibold">15.4.8</div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10">
            <Paragraph className="!text-gray-400 text-center">
              Built with ❤️ by DeepFundAI Team
            </Paragraph>
          </div>
        </div>
      </div>
    </div>
  );
};
