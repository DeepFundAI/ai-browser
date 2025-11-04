import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Switch, Input, Button, Card, message, Spin, Divider, Space, Typography } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { AgentConfig, McpToolSchema } from '../type';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface AgentConfigModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Agent Configuration Modal Component
 * Modal version of agent configuration page
 */
export default function AgentConfigModal({ visible, onClose }: AgentConfigModalProps) {
  const { t } = useTranslation('agentConfig');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AgentConfig>({
    browserAgent: { enabled: true, customPrompt: '' },
    fileAgent: { enabled: true, customPrompt: '' },
    mcpTools: {}
  });
  const [mcpTools, setMcpTools] = useState<McpToolSchema[]>([]);

  // Load configuration when modal opens
  useEffect(() => {
    if (visible) {
      loadConfiguration();
    }
  }, [visible]);

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
      message.error(t('load_error') + error.message);
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
        onClose();
      } else {
        message.error(t('save_error'));
      }
    } catch (error: any) {
      message.error(t('save_error') + ': ' + error.message);
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
      message.error(t('tool_update_error') + error.message);
    }
  };

  return (
    <Modal
      title={t('title')}
      open={visible}
      onCancel={onClose}
      width="90%"
      footer={[
        <Button key="reload" icon={<ReloadOutlined />} onClick={handleReload}>
          {t('reload')}
        </Button>,
        <Button key="cancel" onClick={onClose}>
          {t('cancel', { ns: 'common' })}
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
        >
          {t('save_configuration')}
        </Button>,
      ]}
      style={{ minHeight: '60vh' }}
      styles={{
        body: { minHeight: '50vh', maxHeight: '75vh', overflowY: 'auto' }
      }}
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <Spin size="large" tip={t('loading')} />
        </div>
      ) : (
        <Tabs defaultActiveKey="browser" type="card">
          {/* Browser Agent Tab */}
          <TabPane tab={t('browser_agent')} key="browser">
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
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
                <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
                  {t('browser_agent_desc')}
                </Paragraph>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong style={{ display: 'block', marginBottom: '6px' }}>{t('custom_system_prompt')}</Text>
                  <Text type="secondary" style={{ fontSize: '13px' }}>
                    {t('custom_prompt_desc')}
                  </Text>
                </div>

                <div style={{
                  fontSize: '12px',
                  marginBottom: '10px',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  lineHeight: '1.8'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'rgba(255,255,255,0.85)' }}>
                    {t('default_behaviors')}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.75)' }}>
                    • Analyze webpages by taking screenshots and page element structures<br/>
                    • Use structured commands to interact with the browser<br/>
                    • Handle popups/cookies by accepting or closing them<br/>
                    • Request user help for login, verification codes, payments, etc.<br/>
                    • Use scroll to find elements, extract content with extract_page_content
                  </div>
                </div>

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
          </TabPane>

          {/* File Agent Tab */}
          <TabPane tab={t('file_agent')} key="file">
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
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
                <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
                  {t('file_agent_desc')}
                </Paragraph>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong style={{ display: 'block', marginBottom: '6px' }}>Custom System Prompt</Text>
                  <Text type="secondary" style={{ fontSize: '13px' }}>
                    Add custom instructions to extend the File Agent's capabilities.
                  </Text>
                </div>

                <div style={{
                  fontSize: '12px',
                  marginBottom: '10px',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  lineHeight: '1.8'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'rgba(255,255,255,0.85)' }}>
                    {t('default_behaviors')}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.75)' }}>
                    • Handle file-related tasks: creating, finding, reading, modifying files<br/>
                    • Always include working directory when outputting file paths<br/>
                    • Output file names must be in English<br/>
                    • For data content, combine with visualization tools for display<br/>
                    • Generate charts first before page generation to minimize work
                  </div>
                </div>

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
          </TabPane>

          {/* MCP Tools Tab */}
          <TabPane tab={t('mcp_tools')} key="tools">
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Paragraph type="secondary" style={{ margin: '0 0 8px 0', fontSize: '13px' }}>
                {t('available_tools_desc')}
              </Paragraph>

              {mcpTools.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>{t('no_tools')}</Text>
                </div>
              ) : (
                mcpTools.map((tool) => (
                  <Card
                    key={tool.name}
                    size="small"
                    style={{
                      border: tool.enabled ? '1px solid rgba(24, 144, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.15)',
                      backgroundColor: tool.enabled ? 'rgba(24, 144, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <Text strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{tool.name}</Text>
                          <Switch
                            size="small"
                            checked={tool.enabled}
                            onChange={(enabled) => handleToolToggle(tool.name, enabled)}
                          />
                        </div>
                        <Paragraph style={{ margin: 0, fontSize: '13px', color: 'rgba(255, 255, 255, 0.75)' }}>
                          {tool.description}
                        </Paragraph>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </Space>
          </TabPane>
        </Tabs>
      )}
    </Modal>
  );
}
