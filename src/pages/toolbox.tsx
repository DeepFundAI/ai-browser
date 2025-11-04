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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('toolbox');
  const [agentConfigVisible, setAgentConfigVisible] = useState(false);
  const [scheduledTaskVisible, setScheduledTaskVisible] = useState(false);

  const tools: ToolItem[] = [
    {
      id: 'agent-config',
      title: t('agent_config_title'),
      description: t('agent_config_desc'),
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
      title: t('scheduled_tasks_title'),
      description: t('scheduled_tasks_desc'),
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
      title: t('system_settings_title'),
      description: t('system_settings_desc'),
      icon: <SettingOutlined style={{ fontSize: '36px' }} />,
      color: '#8c8c8c',
      gradient: 'linear-gradient(135deg, #8c8c8c 0%, #595959 100%)',
      implemented: false,
      onClick: () => {
        Modal.info({
          title: t('coming_soon_title'),
          content: t('system_settings_coming_soon'),
        });
      }
    },
    {
      id: 'tools-marketplace',
      title: t('tools_marketplace_title'),
      description: t('tools_marketplace_desc'),
      icon: <ToolOutlined style={{ fontSize: '36px' }} />,
      color: '#8c8c8c',
      gradient: 'linear-gradient(135deg, #8c8c8c 0%, #595959 100%)',
      implemented: false,
      onClick: () => {
        Modal.info({
          title: t('coming_soon_title'),
          content: t('tools_marketplace_coming_soon'),
        });
      }
    },
    {
      id: 'workflow-templates',
      title: t('workflow_templates_title'),
      description: t('workflow_templates_desc'),
      icon: <ThunderboltOutlined style={{ fontSize: '36px' }} />,
      color: '#8c8c8c',
      gradient: 'linear-gradient(135deg, #8c8c8c 0%, #595959 100%)',
      implemented: false,
      onClick: () => {
        Modal.info({
          title: t('coming_soon_title'),
          content: t('workflow_templates_coming_soon'),
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
          {t('back_to_home')}
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
            {t('title')}
          </Title>
          <Paragraph style={{
            color: 'rgba(255, 255, 255, 0.65)',
            fontSize: '15px',
            margin: '10px 0 0 0',
            maxWidth: '600px'
          }}>
            {t('subtitle')}
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
                  {t('coming_soon')}
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
