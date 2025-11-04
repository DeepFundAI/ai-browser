import React, { useState, useEffect } from 'react';
import { Tabs, Switch, Input, Button, Card, App, Spin, Divider, Space, Typography } from 'antd';
import { SaveOutlined, ReloadOutlined, SettingOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import type { AgentConfig, McpToolSchema } from '../type';
import { useTranslation } from 'react-i18next';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

/**
 * Agent Configuration Page Component
 * Allows users to configure agents and MCP tools
 */
export default function AgentConfigPage() {
  const { t } = useTranslation('agentConfig');
  const { message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AgentConfig>({
    browserAgent: { enabled: true, customPrompt: '' },
    fileAgent: { enabled: true, customPrompt: '' },
    mcpTools: {}
  });
  const [mcpTools, setMcpTools] = useState<McpToolSchema[]>([]);

  // Load configuration on mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      // Load agent config
      const agentResult = await window.api.getAgentConfig();
      if (agentResult.success) {
        setConfig(agentResult.data);
      }

      // Load MCP tools
      const toolsResult = await window.api.getMcpTools();
      if (toolsResult.success) {
        setMcpTools(toolsResult.data);
      }
    } catch (error: any) {
      message.error(t('load_config_failed') + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await window.api.saveAgentConfig(config);
      if (result.success) {
        message.success(t('save_success'));
      } else {
        message.error(t('save_failed'));
      }
    } catch (error: any) {
      message.error(t('save_failed') + ': ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReload = async () => {
    await loadConfiguration();
    message.success(t('reload_success'));
  };

  const handleToolToggle = async (toolName: string, enabled: boolean) => {
    try {
      // Update local state
      setConfig(prev => ({
        ...prev,
        mcpTools: {
          ...prev.mcpTools,
          [toolName]: { ...prev.mcpTools[toolName], enabled }
        }
      }));

      // Update MCP tools list
      setMcpTools(prev =>
        prev.map(tool =>
          tool.name === toolName ? { ...tool, enabled } : tool
        )
      );

      // Save to backend
      await window.api.setMcpToolEnabled(toolName, enabled);
    } catch (error: any) {
      message.error(t('tool_update_failed') + ': ' + error.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip={t('loading')} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/home')}
            style={{ padding: '4px 8px' }}
          >
            {t('back')}
          </Button>
          <div>
            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <SettingOutlined />
              {t('title')}
            </Title>
            <Text type="secondary">{t('subtitle')}</Text>
          </div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleReload}>
            {t('reload')}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
          >
            {t('save')}
          </Button>
        </Space>
      </div>

      {/* Configuration Tabs */}
      <Tabs defaultActiveKey="browser" type="card">
        {/* Browser Agent Tab */}
        <TabPane tab={t('browser_agent')} key="browser">
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Text strong>{t('enable_browser_agent')}</Text>
                  <Switch
                    checked={config.browserAgent.enabled}
                    onChange={(enabled) =>
                      setConfig(prev => ({
                        ...prev,
                        browserAgent: { ...prev.browserAgent, enabled }
                      }))
                    }
                  />
                </div>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  {t('browser_agent_desc')}
                </Paragraph>
              </div>

              <Divider />

              <div>
                <Text strong>{t('custom_prompt')}</Text>
                <Paragraph type="secondary">
                  {t('custom_prompt_desc')}
                </Paragraph>
                <TextArea
                  value={config.browserAgent.customPrompt}
                  onChange={(e) =>
                    setConfig(prev => ({
                      ...prev,
                      browserAgent: { ...prev.browserAgent, customPrompt: e.target.value }
                    }))
                  }
                  placeholder={t('browser_prompt_placeholder')}
                  rows={6}
                  disabled={!config.browserAgent.enabled}
                />
              </div>
            </Space>
          </Card>
        </TabPane>

        {/* File Agent Tab */}
        <TabPane tab={t('file_agent')} key="file">
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Text strong>{t('enable_file_agent')}</Text>
                  <Switch
                    checked={config.fileAgent.enabled}
                    onChange={(enabled) =>
                      setConfig(prev => ({
                        ...prev,
                        fileAgent: { ...prev.fileAgent, enabled }
                      }))
                    }
                  />
                </div>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  {t('file_agent_desc')}
                </Paragraph>
              </div>

              <Divider />

              <div>
                <Text strong>{t('custom_prompt')}</Text>
                <Paragraph type="secondary">
                  {t('custom_prompt_desc')}
                </Paragraph>
                <TextArea
                  value={config.fileAgent.customPrompt}
                  onChange={(e) =>
                    setConfig(prev => ({
                      ...prev,
                      fileAgent: { ...prev.fileAgent, customPrompt: e.target.value }
                    }))
                  }
                  placeholder={t('file_prompt_placeholder')}
                  rows={6}
                  disabled={!config.fileAgent.enabled}
                />
              </div>
            </Space>
          </Card>
        </TabPane>

        {/* MCP Tools Tab */}
        <TabPane tab={t('mcp_tools')} key="tools">
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4} style={{ margin: 0 }}>{t('available_tools')}</Title>
                <Paragraph type="secondary">
                  {t('mcp_tools_desc')}
                </Paragraph>
              </div>

              <Divider />

              {mcpTools.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Text type="secondary">{t('no_tools')}</Text>
                </div>
              ) : (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {mcpTools.map((tool) => (
                    <Card
                      key={tool.name}
                      size="small"
                      style={{
                        border: tool.enabled ? '1px solid #1890ff' : '1px solid #d9d9d9',
                        backgroundColor: tool.enabled ? '#f0f5ff' : '#ffffff'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <Text strong style={{ fontSize: '16px' }}>{tool.name}</Text>
                            <Switch
                              checked={tool.enabled}
                              onChange={(enabled) => handleToolToggle(tool.name, enabled)}
                            />
                          </div>
                          <Paragraph
                            type="secondary"
                            style={{ margin: 0, fontSize: '14px' }}
                          >
                            {tool.description}
                          </Paragraph>
                          {tool.inputSchema.required.length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {t('required_params')}: {tool.inputSchema.required.join(', ')}
                              </Text>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </Space>
              )}
            </Space>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}
