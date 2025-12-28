import React, { useState } from 'react';
import { Drawer, Card, Typography, Space, App } from 'antd';
import {
  SettingOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  RobotOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import AgentConfigModal from './AgentConfigModal';
import { useScheduledTaskStore } from '@/stores/scheduled-task-store';

const { Title, Text, Paragraph } = Typography;

interface ToolItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

interface ToolboxPanelProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Toolbox Panel Component
 * Central hub for all system configuration and management features
 */
export default function ToolboxPanel({ visible, onClose }: ToolboxPanelProps) {
  const { modal } = App.useApp();
  const [agentConfigVisible, setAgentConfigVisible] = useState(false);
  const { setShowListPanel } = useScheduledTaskStore();

  const tools: ToolItem[] = [
    {
      id: 'agent-config',
      title: 'Agent Configuration',
      description: 'Configure AI agents and MCP tools for task execution',
      icon: <RobotOutlined className="text-3xl" />,
      color: '#1890ff',
      onClick: () => {
        setAgentConfigVisible(true);
        onClose();
      }
    },
    {
      id: 'scheduled-tasks',
      title: 'Scheduled Tasks',
      description: 'Create and manage automated recurring tasks',
      icon: <ClockCircleOutlined className="text-3xl" />,
      color: '#52c41a',
      onClick: () => {
        setShowListPanel(true);
        onClose();
      }
    },
    {
      id: 'system-settings',
      title: 'System Settings',
      description: 'Configure application preferences and behavior',
      icon: <SettingOutlined className="text-3xl" />,
      color: '#722ed1',
      onClick: () => {
        modal.info({
          title: 'Coming Soon',
          content: 'System settings feature is under development.',
        });
      }
    },
    {
      id: 'tools-marketplace',
      title: 'Tools Marketplace',
      description: 'Browse and install additional MCP tools and plugins',
      icon: <ToolOutlined className="text-3xl" />,
      color: '#fa8c16',
      onClick: () => {
        modal.info({
          title: 'Coming Soon',
          content: 'Tools marketplace is under development.',
        });
      }
    },
    {
      id: 'workflow-templates',
      title: 'Workflow Templates',
      description: 'Pre-built automation workflows for common tasks',
      icon: <ThunderboltOutlined className="text-3xl" />,
      color: '#eb2f96',
      onClick: () => {
        modal.info({
          title: 'Coming Soon',
          content: 'Workflow templates feature is under development.',
        });
      }
    }
  ];

  return (
    <>
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <ToolOutlined className="text-xl text-blue-500" />
            <span>Toolbox</span>
          </div>
        }
        placement="right"
        width={480}
        onClose={onClose}
        open={visible}
        styles={{
          body: { padding: '24px' }
        }}
      >
        <div className="mb-4">
          <Paragraph type="secondary">
            Access all system features and configuration options from here. Click on any card to open the corresponding tool.
          </Paragraph>
        </div>

        <Space direction="vertical" size="large" className="w-full">
          {tools.map((tool) => (
            <Card
              key={tool.id}
              hoverable
              onClick={tool.onClick}
              style={{
                border: `1px solid ${tool.color}20`,
                transition: 'all 0.3s ease',
              }}
              styles={{
                body: { padding: '20px' }
              }}
              className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-4">
                <div
                  className="p-3 rounded-lg flex items-center justify-center"
                  style={{
                    color: tool.color,
                    backgroundColor: `${tool.color}10`,
                  }}
                >
                  {tool.icon}
                </div>
                <div className="flex-1">
                  <Title level={5} className="m-0 mb-2" style={{ color: tool.color }}>
                    {tool.title}
                  </Title>
                  <Text type="secondary" className="text-sm">
                    {tool.description}
                  </Text>
                </div>
              </div>
            </Card>
          ))}
        </Space>
      </Drawer>

      {/* Agent Configuration Modal */}
      <AgentConfigModal
        visible={agentConfigVisible}
        onClose={() => setAgentConfigVisible(false)}
      />
    </>
  );
}
