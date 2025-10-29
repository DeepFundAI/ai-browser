import React, { useState, useEffect } from 'react';
import { Tabs, Switch, Input, Button, Card, message, Spin, Divider, Space, Typography } from 'antd';
import { SaveOutlined, ReloadOutlined, SettingOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import type { AgentConfig, McpToolSchema } from '../type';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

/**
 * Agent Configuration Page Component
 * Allows users to configure agents and MCP tools
 */
export default function AgentConfigPage() {
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
      message.error('Failed to load configuration: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await window.api.saveAgentConfig(config);
      if (result.success) {
        message.success('Configuration saved and agents reloaded successfully!');
      } else {
        message.error('Failed to save configuration');
      }
    } catch (error: any) {
      message.error('Failed to save configuration: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReload = async () => {
    await loadConfiguration();
    message.success('Configuration reloaded');
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
      message.error('Failed to update tool status: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading configuration..." />
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
            Back
          </Button>
          <div>
            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <SettingOutlined />
              Agent Configuration
            </Title>
            <Text type="secondary">Configure AI agents and MCP tools for task execution</Text>
          </div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleReload}>
            Reload
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
          >
            Save Configuration
          </Button>
        </Space>
      </div>

      {/* Configuration Tabs */}
      <Tabs defaultActiveKey="browser" type="card">
        {/* Browser Agent Tab */}
        <TabPane tab="Browser Agent" key="browser">
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Text strong>Enable Browser Agent</Text>
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
                  Browser Agent handles web automation tasks like navigation, clicking, form filling, and content extraction.
                </Paragraph>
              </div>

              <Divider />

              <div>
                <Text strong>Custom System Prompt</Text>
                <Paragraph type="secondary">
                  Add custom instructions to extend the Browser Agent's capabilities. This prompt will be appended to the agent's system prompt.
                </Paragraph>
                <TextArea
                  value={config.browserAgent.customPrompt}
                  onChange={(e) =>
                    setConfig(prev => ({
                      ...prev,
                      browserAgent: { ...prev.browserAgent, customPrompt: e.target.value }
                    }))
                  }
                  placeholder="Example: When extracting data from tables, always format the output as JSON arrays..."
                  rows={6}
                  disabled={!config.browserAgent.enabled}
                />
              </div>
            </Space>
          </Card>
        </TabPane>

        {/* File Agent Tab */}
        <TabPane tab="File Agent" key="file">
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Text strong>Enable File Agent</Text>
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
                  File Agent handles file system operations like reading, writing, searching, and organizing files.
                </Paragraph>
              </div>

              <Divider />

              <div>
                <Text strong>Custom System Prompt</Text>
                <Paragraph type="secondary">
                  Add custom instructions to extend the File Agent's capabilities. This prompt will be appended to the agent's system prompt.
                </Paragraph>
                <TextArea
                  value={config.fileAgent.customPrompt}
                  onChange={(e) =>
                    setConfig(prev => ({
                      ...prev,
                      fileAgent: { ...prev.fileAgent, customPrompt: e.target.value }
                    }))
                  }
                  placeholder="Example: When creating new files, always add a header comment with creation date and author information..."
                  rows={6}
                  disabled={!config.fileAgent.enabled}
                />
              </div>
            </Space>
          </Card>
        </TabPane>

        {/* MCP Tools Tab */}
        <TabPane tab="MCP Tools" key="tools">
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4} style={{ margin: 0 }}>Available Tools</Title>
                <Paragraph type="secondary">
                  Enable or disable specific MCP (Model Context Protocol) tools that agents can use during task execution.
                </Paragraph>
              </div>

              <Divider />

              {mcpTools.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Text type="secondary">No MCP tools available</Text>
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
                                Required parameters: {tool.inputSchema.required.join(', ')}
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
