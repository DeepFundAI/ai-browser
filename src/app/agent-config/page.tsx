"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, App, Spin } from 'antd';
import type { AgentConfig, McpToolSchema } from '@/types';
import { useTranslation } from 'react-i18next';
import {
  ConfigHeader,
  BrowserAgentTab,
  FileAgentTab,
  McpToolsTab
} from '@/components/agent-config';

const { TabPane } = Tabs;

/**
 * Agent Configuration Page Component
 * Allows users to configure agents and MCP tools
 */
export default function AgentConfigPage() {
  const { t } = useTranslation('agentConfig');
  const { message } = App.useApp();
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
    const agentResult = await window.api.getAgentConfig();
    if (agentResult?.success && agentResult.data?.agentConfig) {
      setConfig(agentResult.data.agentConfig);
    }

    const toolsResult = await window.api.getMcpTools();
    if (toolsResult?.success && toolsResult.data?.tools) {
      setMcpTools(toolsResult.data.tools);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await window.api.saveAgentConfig(config);
    if (result?.success) {
      message.success(t('save_success'));
    } else {
      message.error(t('save_failed'));
    }
    setSaving(false);
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
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip={t('loading')} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <ConfigHeader
        onSave={handleSave}
        onReload={handleReload}
        saving={saving}
      />

      {/* Configuration Tabs */}
      <Tabs defaultActiveKey="browser" type="card">
        {/* Browser Agent Tab */}
        <TabPane tab={t('browser_agent')} key="browser">
          <BrowserAgentTab
            config={config.browserAgent}
            onConfigChange={(browserAgent) =>
              setConfig(prev => ({ ...prev, browserAgent }))
            }
          />
        </TabPane>

        {/* File Agent Tab */}
        <TabPane tab={t('file_agent')} key="file">
          <FileAgentTab
            config={config.fileAgent}
            onConfigChange={(fileAgent) =>
              setConfig(prev => ({ ...prev, fileAgent }))
            }
          />
        </TabPane>

        {/* MCP Tools Tab */}
        <TabPane tab={t('mcp_tools')} key="tools">
          <McpToolsTab
            tools={mcpTools}
            onToolToggle={handleToolToggle}
          />
        </TabPane>
      </Tabs>
    </div>
  );
}
