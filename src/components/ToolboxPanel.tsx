import React, { useState } from 'react';
import { Drawer, Card, Typography, Space, Modal } from 'antd';
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
  const [agentConfigVisible, setAgentConfigVisible] = useState(false);
  const { setShowListPanel } = useScheduledTaskStore();

  const tools: ToolItem[] = [
    {
      id: 'agent-config',
      title: 'Agent Configuration',
      description: 'Configure AI agents and MCP tools for task execution',
      icon: <RobotOutlined style={{ fontSize: '32px' }} />,
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
      icon: <ClockCircleOutlined style={{ fontSize: '32px' }} />,
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
      icon: <SettingOutlined style={{ fontSize: '32px' }} />,
      color: '#722ed1',
      onClick: () => {
        Modal.info({
          title: 'Coming Soon',
          content: 'System settings feature is under development.',
        });
      }
    },
    {
      id: 'tools-marketplace',
      title: 'Tools Marketplace',
      description: 'Browse and install additional MCP tools and plugins',
      icon: <ToolOutlined style={{ fontSize: '32px' }} />,
      color: '#fa8c16',
      onClick: () => {
        Modal.info({
          title: 'Coming Soon',
          content: 'Tools marketplace is under development.',
        });
      }
    },
    {
      id: 'workflow-templates',
      title: 'Workflow Templates',
      description: 'Pre-built automation workflows for common tasks',
      icon: <ThunderboltOutlined style={{ fontSize: '32px' }} />,
      color: '#eb2f96',
      onClick: () => {
        Modal.info({
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ToolOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
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
        <div style={{ marginBottom: '16px' }}>
          <Paragraph type="secondary">
            Access all system features and configuration options from here. Click on any card to open the corresponding tool.
          </Paragraph>
        </div>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {tools.map((tool) => (
            <Card
              key={tool.id}
              hoverable
              onClick={tool.onClick}
              style={{
                cursor: 'pointer',
                border: `1px solid ${tool.color}20`,
                transition: 'all 0.3s ease',
              }}
              styles={{
                body: { padding: '20px' }
              }}
              className="toolbox-card"
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div
                  style={{
                    color: tool.color,
                    backgroundColor: `${tool.color}10`,
                    padding: '12px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {tool.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <Title level={5} style={{ margin: '0 0 8px 0', color: tool.color }}>
                    {tool.title}
                  </Title>
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    {tool.description}
                  </Text>
                </div>
              </div>
            </Card>
          ))}
        </Space>

        <style jsx>{`
          .toolbox-card:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateY(-2px);
          }
        `}</style>
      </Drawer>

      {/* Agent Configuration Modal */}
      <AgentConfigModal
        visible={agentConfigVisible}
        onClose={() => setAgentConfigVisible(false)}
      />
    </>
  );
}
