/**
 * Agent configuration panel
 * INPUT: Agent config from Electron IPC
 * OUTPUT: Updated agent configurations
 * POSITION: Fourth tab in settings window for agent behavior management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  RobotOutlined,
  GlobalOutlined,
  FolderOutlined,
  ToolOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { Typography, Switch, Input, Button, Spin, App } from 'antd';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import type { AgentConfig, McpToolSchema } from '@/types';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

type AgentTab = 'browser' | 'file' | 'tools';

interface TabItemProps {
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Tab navigation item
 */
const TabItem: React.FC<TabItemProps> = ({
  label,
  icon,
  isSelected,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all duration-200',
        'text-left border',
        isSelected
          ? 'bg-blue-500/20 border-blue-500/50'
          : 'border-white/10 hover:bg-white/5 hover:border-white/20'
      )}
    >
      <span className="text-lg text-gray-400">{icon}</span>
      <span className="flex-1 text-sm font-medium text-gray-200">{label}</span>
    </button>
  );
};

/**
 * MCP Tool card component
 */
interface ToolCardProps {
  tool: McpToolSchema;
  onToggle: (enabled: boolean) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, onToggle }) => {
  return (
    <div
      className={clsx(
        'flex items-start justify-between p-4 rounded-lg border transition-all mb-3',
        tool.enabled
          ? 'bg-blue-500/10 border-blue-500/30'
          : 'bg-white/5 border-white/10'
      )}
    >
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-3 mb-2">
          <Text className="!text-white font-medium">{tool.name}</Text>
        </div>
        <Text className="!text-gray-400 text-sm block">{tool.description}</Text>
      </div>
      <Switch
        checked={tool.enabled}
        onChange={onToggle}
        size="small"
      />
    </div>
  );
};

/**
 * Agent configuration panel (Toolbox integration)
 */
export const AgentPanel: React.FC = () => {
  const { t } = useTranslation('settings');
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState<AgentTab>('browser');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<AgentConfig>({
    browserAgent: { enabled: true, customPrompt: '' },
    fileAgent: { enabled: true, customPrompt: '' },
    mcpTools: {}
  });
  const [mcpTools, setMcpTools] = useState<McpToolSchema[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Load configuration
  const loadConfiguration = useCallback(async () => {
    setLoading(true);
    try {
      const agentResult = await window.api.getAgentConfig();
      if (agentResult?.success && agentResult.data?.agentConfig) {
        setConfig(agentResult.data.agentConfig);
      }

      const toolsResult = await window.api.getMcpTools();
      if (toolsResult?.success && toolsResult.data?.tools) {
        setMcpTools(toolsResult.data.tools);
      }
    } catch (error) {
      console.error('Failed to load agent config:', error);
      message.error(t('agent.load_failed'));
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  // Handle browser agent toggle
  const handleBrowserAgentToggle = (enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      browserAgent: { ...prev.browserAgent, enabled }
    }));
    setHasChanges(true);
  };

  // Handle browser agent prompt change
  const handleBrowserPromptChange = (value: string) => {
    setConfig(prev => ({
      ...prev,
      browserAgent: { ...prev.browserAgent, customPrompt: value }
    }));
    setHasChanges(true);
  };

  // Handle file agent toggle
  const handleFileAgentToggle = (enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      fileAgent: { ...prev.fileAgent, enabled }
    }));
    setHasChanges(true);
  };

  // Handle file agent prompt change
  const handleFilePromptChange = (value: string) => {
    setConfig(prev => ({
      ...prev,
      fileAgent: { ...prev.fileAgent, customPrompt: value }
    }));
    setHasChanges(true);
  };

  // Handle tool toggle
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

      // Update tools list
      setMcpTools(prev =>
        prev.map(tool =>
          tool.name === toolName ? { ...tool, enabled } : tool
        )
      );

      // Save to backend immediately
      await window.api.setMcpToolEnabled(toolName, enabled);
    } catch (error: any) {
      message.error('Failed to update tool: ' + error.message);
    }
  };

  // Save configuration
  const handleSave = async () => {
    try {
      const result = await window.api.saveAgentConfig(config);
      if (result?.success) {
        message.success(t('agent.changes_saved'));
        setHasChanges(false);
      } else {
        message.error(t('agent.load_failed'));
      }
    } catch (error) {
      message.error(t('agent.load_failed'));
    }
  };

  // Reload configuration
  const handleReload = async () => {
    await loadConfiguration();
    setHasChanges(false);
    message.success(t('agent.changes_saved'));
  };

  const tabs: { id: AgentTab; labelKey: string; icon: React.ReactNode }[] = [
    { id: 'browser', labelKey: 'agent.browser_agent', icon: <GlobalOutlined /> },
    { id: 'file', labelKey: 'agent.file_agent', icon: <FolderOutlined /> },
    { id: 'tools', labelKey: 'agent.mcp_tools', icon: <ToolOutlined /> }
  ];

  // Render content based on active tab
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Spin size="large" />
        </div>
      );
    }

    switch (activeTab) {
      case 'browser':
        return (
          <div className="space-y-6">
            {/* Enable toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Text className="!text-white font-medium block">{t('agent.enable_agent')}</Text>
                <Text className="!text-gray-400 text-sm">
                  {t('agent.browser_agent_behavior')}
                </Text>
              </div>
              <Switch
                checked={config.browserAgent.enabled}
                onChange={handleBrowserAgentToggle}
              />
            </div>

            {/* Default behaviors */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <Text className="!text-gray-300 font-medium block mb-3">{t('agent.default_behavior')}</Text>
              <div className="text-sm text-gray-400 space-y-1.5">
                <div>• Analyze webpages by taking screenshots and page element structures</div>
                <div>• Use structured commands to interact with the browser</div>
                <div>• Handle popups/cookies by accepting or closing them</div>
                <div>• Request user help for login, verification codes, payments</div>
                <div>• Use scroll to find elements, extract content with extract_page_content</div>
              </div>
            </div>

            {/* Custom prompt */}
            <div>
              <Text className="!text-white font-medium block mb-2">{t('agent.custom_prompt')}</Text>
              <Text className="!text-gray-400 text-sm block mb-3">
                Add custom instructions to extend the Browser Agent's capabilities
              </Text>
              <TextArea
                value={config.browserAgent.customPrompt}
                onChange={(e) => handleBrowserPromptChange(e.target.value)}
                placeholder={t('agent.custom_prompt_placeholder')}
                rows={6}
                disabled={!config.browserAgent.enabled}
                className="bg-white/5 border-white/10 text-white placeholder-gray-500"
              />
            </div>
          </div>
        );

      case 'file':
        return (
          <div className="space-y-6">
            {/* Enable toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Text className="!text-white font-medium block">{t('agent.enable_agent')}</Text>
                <Text className="!text-gray-400 text-sm">
                  {t('agent.file_agent_behavior')}
                </Text>
              </div>
              <Switch
                checked={config.fileAgent.enabled}
                onChange={handleFileAgentToggle}
              />
            </div>

            {/* Default behaviors */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <Text className="!text-gray-300 font-medium block mb-3">{t('agent.default_behavior')}</Text>
              <div className="text-sm text-gray-400 space-y-1.5">
                <div>• Handle file-related tasks: creating, finding, reading, modifying files</div>
                <div>• Always include working directory when outputting file paths</div>
                <div>• Output file names must be in English</div>
                <div>• For data content, combine with visualization tools for display</div>
                <div>• Generate charts first before page generation to minimize work</div>
              </div>
            </div>

            {/* Custom prompt */}
            <div>
              <Text className="!text-white font-medium block mb-2">{t('agent.custom_prompt')}</Text>
              <Text className="!text-gray-400 text-sm block mb-3">
                Add custom instructions to extend the File Agent's capabilities
              </Text>
              <TextArea
                value={config.fileAgent.customPrompt}
                onChange={(e) => handleFilePromptChange(e.target.value)}
                placeholder={t('agent.custom_prompt_placeholder')}
                rows={6}
                disabled={!config.fileAgent.enabled}
                className="bg-white/5 border-white/10 text-white placeholder-gray-500"
              />
            </div>
          </div>
        );

      case 'tools':
        return (
          <div className="space-y-4">
            <div className="mb-6">
              <Text className="!text-gray-400 text-sm">
                Enable or disable MCP tools available to the AI agent. Changes are saved automatically.
              </Text>
            </div>

            {mcpTools.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">🔧</div>
                <div className="font-medium mb-1">No MCP Tools Available</div>
                <div className="text-sm">MCP tools will appear here when configured</div>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto pr-2">
                {mcpTools.map((tool) => (
                  <ToolCard
                    key={tool.name}
                    tool={tool}
                    onToggle={(enabled) => handleToolToggle(tool.name, enabled)}
                  />
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header */}
      <div className="flex-shrink-0 p-8 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <RobotOutlined className="text-3xl text-cyan-400" />
            <Title level={2} className="!text-white !mb-0">
              {t('agent.title')}
            </Title>
          </div>
          <div className="flex items-center gap-2">
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReload}
              className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            >
              Reload
            </Button>
            {activeTab !== 'tools' && (
              <Button
                type="primary"
                onClick={handleSave}
                disabled={!hasChanges}
                className="bg-blue-600 hover:bg-blue-700 border-none disabled:bg-gray-600"
              >
                {t('agent.save_changes')}
              </Button>
            )}
          </div>
        </div>
        <Paragraph className="!text-gray-300 !mb-0">
          {t('agent.description')}
        </Paragraph>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 p-8 pt-6">
        <div className="flex gap-6 h-full">
          {/* Left: Tab navigation */}
          <div className="w-48 flex-shrink-0">
            {tabs.map((tab) => (
              <TabItem
                key={tab.id}
                label={t(tab.labelKey)}
                icon={tab.icon}
                isSelected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>

          {/* Right: Content panel */}
          <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
