import React from 'react';
import { SkinOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

export const UserInterfacePanel: React.FC = () => {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <SkinOutlined className="text-3xl text-pink-400" />
        <Title level={2} className="!text-white !mb-0">
          User Interface
        </Title>
      </div>

      <Paragraph className="!text-gray-300 mb-8">
        Customize the application appearance and layout.
      </Paragraph>

      <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-8">
        <div className="text-center text-gray-400">
          <div className="text-5xl mb-4">🎨</div>
          <div className="text-xl font-semibold mb-2">UI Customization</div>
          <div className="text-sm">Coming in Phase 5</div>
        </div>
      </div>
    </div>
  );
};
