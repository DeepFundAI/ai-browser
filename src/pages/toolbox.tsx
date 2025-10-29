import React, { useState } from 'react';
import { Card, Typography, Modal, Button, Tag } from 'antd';
import {
  ClockCircleOutlined,
  RobotOutlined,
  ToolOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import AgentConfigModal from '@/components/AgentConfigModal';
import { ScheduledTaskListModal } from '@/components/scheduled-task/ScheduledTaskListModal';

const { Title, Paragraph } = Typography;

interface ToolItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  implemented: boolean;  // Whether the tool is implemented
  onClick: () => void;
}

/**
 * Toolbox Page Component
 * Central hub for all system configuration and management features
 */
export default function ToolboxPage() {
  const router = useRouter();
  const [agentConfigVisible, setAgentConfigVisible] = useState(false);
  const [scheduledTaskVisible, setScheduledTaskVisible] = useState(false);

  const tools: ToolItem[] = [
    {
      id: 'agent-config',
      title: 'Agent Configuration',
      description: 'Configure AI agents and MCP tools for task execution. Customize agent behavior and enable/disable specific tools.',
      icon: <RobotOutlined style={{ fontSize: '36px' }} />,
      color: '#1890ff',
      gradient: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
      implemented: true,
      onClick: () => {
        setAgentConfigVisible(true);
      }
    },
    {
      id: 'scheduled-tasks',
      title: 'Scheduled Tasks',
      description: 'Create and manage automated recurring tasks. Set up schedules, monitor execution status, and view task history.',
      icon: <ClockCircleOutlined style={{ fontSize: '36px' }} />,
      color: '#52c41a',
      gradient: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
      implemented: true,
      onClick: () => {
        setScheduledTaskVisible(true);
      }
    },
    {
      id: 'system-settings',
      title: 'System Settings',
      description: 'Configure application preferences, appearance, performance options, and other system-level settings.',
      icon: <SettingOutlined style={{ fontSize: '36px' }} />,
      color: '#8c8c8c',
      gradient: 'linear-gradient(135deg, #8c8c8c 0%, #595959 100%)',
      implemented: false,
      onClick: () => {
        Modal.info({
          title: 'Coming Soon',
          content: 'System settings feature is under development. Stay tuned for updates!',
        });
      }
    },
    {
      id: 'tools-marketplace',
      title: 'Tools Marketplace',
      description: 'Browse and install additional MCP tools and plugins. Extend your agent capabilities with community tools.',
      icon: <ToolOutlined style={{ fontSize: '36px' }} />,
      color: '#8c8c8c',
      gradient: 'linear-gradient(135deg, #8c8c8c 0%, #595959 100%)',
      implemented: false,
      onClick: () => {
        Modal.info({
          title: 'Coming Soon',
          content: 'Tools marketplace is under development. We will launch it soon with amazing tools!',
        });
      }
    },
    {
      id: 'workflow-templates',
      title: 'Workflow Templates',
      description: 'Pre-built automation workflows for common tasks. Save time with ready-to-use task templates.',
      icon: <ThunderboltOutlined style={{ fontSize: '36px' }} />,
      color: '#8c8c8c',
      gradient: 'linear-gradient(135deg, #8c8c8c 0%, #595959 100%)',
      implemented: false,
      onClick: () => {
        Modal.info({
          title: 'Coming Soon',
          content: 'Workflow templates feature is under development. Coming soon with powerful automation!',
        });
      }
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a1929 0%, #1a2332 100%)',
    }}>
      {/* Draggable Top Navigation Bar */}
      <div style={{
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/home')}
          style={{
            color: '#fff',
            fontSize: '14px',
            padding: '6px 12px',
            height: 'auto',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
        >
          Back to Home
        </Button>
      </div>

      {/* Main Content */}
      <div style={{ padding: '32px 48px' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <Title level={1} style={{
            margin: 0,
            color: '#fff',
            fontSize: '36px',
            fontWeight: 700,
            letterSpacing: '-0.5px'
          }}>
            🔧 Toolbox
          </Title>
          <Paragraph style={{
            color: 'rgba(255, 255, 255, 0.65)',
            fontSize: '15px',
            margin: '10px 0 0 0',
            maxWidth: '600px'
          }}>
            Access all system features and configuration options. Click on any card to open the corresponding tool.
          </Paragraph>
        </div>

        {/* Tools Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
          maxWidth: '1400px'
        }}>
          {tools.map((tool) => (
            <Card
              key={tool.id}
              hoverable={tool.implemented}
              onClick={tool.onClick}
              style={{
                cursor: tool.implemented ? 'pointer' : 'not-allowed',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                position: 'relative',
                opacity: tool.implemented ? 1 : 0.5,
              }}
              styles={{
                body: {
                  padding: '24px',
                  position: 'relative',
                  zIndex: 1
                }
              }}
              className={tool.implemented ? 'toolbox-card' : 'toolbox-card-disabled'}
            >
              {/* Gradient Background */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: tool.gradient,
              }} />

              {/* Coming Soon Badge */}
              {!tool.implemented && (
                <Tag
                  color="default"
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    margin: 0,
                    fontSize: '11px',
                    padding: '2px 8px',
                    zIndex: 2
                  }}
                >
                  Coming Soon
                </Tag>
              )}

              {/* Icon Circle */}
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '14px',
                background: tool.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                color: '#fff',
                boxShadow: `0 6px 16px ${tool.color}40`
              }}>
                {tool.icon}
              </div>

              {/* Content */}
              <div>
                <Title level={4} style={{
                  margin: '0 0 8px 0',
                  color: '#fff',
                  fontSize: '18px',
                  fontWeight: 600
                }}>
                  {tool.title}
                </Title>
                <Paragraph style={{
                  color: 'rgba(255, 255, 255, 0.65)',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {tool.description}
                </Paragraph>
              </div>

              {/* Arrow Indicator */}
              {tool.implemented && (
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '12px',
                  transition: 'all 0.3s ease'
                }} className="card-arrow">
                  →
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Agent Configuration Modal */}
      <AgentConfigModal
        visible={agentConfigVisible}
        onClose={() => setAgentConfigVisible(false)}
      />

      {/* Scheduled Task List Modal */}
      <ScheduledTaskListModal
        visible={scheduledTaskVisible}
        onClose={() => setScheduledTaskVisible(false)}
      />

      <style jsx>{`
        .toolbox-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }

        .toolbox-card:hover .card-arrow {
          background: rgba(255, 255, 255, 0.2);
          transform: translateX(4px);
        }

        .toolbox-card:active {
          transform: translateY(-3px);
        }

        .toolbox-card-disabled:hover {
          transform: none;
          box-shadow: none;
        }
      `}</style>
    </div>
  );
}
