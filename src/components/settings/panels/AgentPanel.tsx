import React from 'react';
import { RobotOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

export const AgentPanel: React.FC = () => {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <RobotOutlined className="text-3xl text-cyan-400" />
        <Title level={2} className="!text-white !mb-0">
          Agent
        </Title>
      </div>

      <Paragraph className="!text-gray-300 mb-8">
        Configure AI agent behavior and tools.
      </Paragraph>

      <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-8">
        <div className="text-center text-gray-400">
          <div className="text-5xl mb-4">🤖</div>
          <div className="text-xl font-semibold mb-2">Agent Configuration</div>
          <div className="text-sm">Coming in Phase 4</div>
        </div>
      </div>
    </div>
  );
};
