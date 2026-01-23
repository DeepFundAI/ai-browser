/**
 * Agent configuration panel
 * INPUT: Agent config from Electron IPC
 * OUTPUT: Updated agent configurations
 * POSITION: Fourth tab in settings window for agent behavior management
 */

import React, { useState, useEffect } from 'react';
import {
  RobotOutlined,
  GlobalOutlined,
  FolderOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { Typography, Switch, Input, Spin, App } from 'antd';
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
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all duration-200 cursor-pointer',
        'text-left',
        isSelected
          ? 'bg-purple-50 dark:bg-purple-500/15 shadow-[inset_0_0_0_1px_rgb(233,213,255)] dark:shadow-[inset_0_0_0_1px_rgba(168,85,247,0.3)]'
          : 'bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100/50 dark:hover:bg-white/10'
      )}
    >
      <span className="text-lg text-text-12 dark:text-text-12-dark">{icon}</span>
      <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
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
        'flex items-start justify-between p-4 rounded-xl transition-all duration-200 mb-3',
        tool.enabled
          ? 'bg-purple-50 dark:bg-purple-500/15 shadow-[inset_0_0_0_1px_rgb(233,213,255)] dark:shadow-[inset_0_0_0_1px_rgba(168,85,247,0.3)]'
          : 'bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100/50 dark:hover:bg-white/10'
      )}
    >
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-3 mb-2">
          <Text className="!text-text-01 dark:!text-text-01-dark font-medium">{tool.name}</Text>
        </div>
        <Text className="!text-text-12 dark:text-text-12-dark text-sm block">{tool.description}</Text>
      </div>
      <Switch
        checked={tool.enabled}
        onChange={onToggle}
        size="small"
        className="cursor-pointer"
      />
    </div>
  );
};

interface AgentPanelProps {
  settings?: AgentConfig;
  onSettingsChange?: (settings: AgentConfig) => void;
}

/**
 * Agent configuration panel
 */
export const AgentPanel: React.FC<AgentPanelProps> = ({
  settings,
  onSettingsChange
}) => {
  const { t } = useTranslation('settings');
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState<AgentTab>('browser');
  const [loading, setLoading] = useState(false);
  const [mcpTools, setMcpTools] = useState<McpToolSchema[]>([]);

  // Load MCP tools on mount
  useEffect(() => {
    loadMcpTools();
  }, []);

  const loadMcpTools = async () => {
    setLoading(true);
    try {
      const toolsResult = await window.api.getMcpTools();
      if (toolsResult?.success && toolsResult.data?.tools) {
        setMcpTools(toolsResult.data.tools);
      }
    } catch (error) {
      console.error('Failed to load MCP tools:', error);
      message.error(t('agent.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  // Handle browser agent toggle
  const handleBrowserAgentToggle = (enabled: boolean) => {
    if (!settings || !onSettingsChange) return;
    onSettingsChange({
      ...settings,
      browserAgent: { ...settings.browserAgent, enabled }
    });
  };

  // Handle browser agent prompt change
  const handleBrowserPromptChange = (value: string) => {
    if (!settings || !onSettingsChange) return;
    onSettingsChange({
      ...settings,
      browserAgent: { ...settings.browserAgent, customPrompt: value }
    });
  };

  // Handle file agent toggle
  const handleFileAgentToggle = (enabled: boolean) => {
    if (!settings || !onSettingsChange) return;
    onSettingsChange({
      ...settings,
      fileAgent: { ...settings.fileAgent, enabled }
    });
  };

  // Handle file agent prompt change
  const handleFilePromptChange = (value: string) => {
    if (!settings || !onSettingsChange) return;
    onSettingsChange({
      ...settings,
      fileAgent: { ...settings.fileAgent, customPrompt: value }
    });
  };

  // Handle tool toggle - immediate save for MCP tools
  const handleToolToggle = async (toolName: string, enabled: boolean) => {
    try {
      // Update tools list UI
      setMcpTools(prev =>
        prev.map(tool =>
          tool.name === toolName ? { ...tool, enabled } : tool
        )
      );

      // Save to backend immediately (MCP tools need real-time effect)
      await window.api.setMcpToolEnabled(toolName, enabled);

      // Also update the settings object for export/import consistency
      if (settings && onSettingsChange) {
        onSettingsChange({
          ...settings,
          mcpTools: {
            ...settings.mcpTools,
            [toolName]: { ...settings.mcpTools[toolName], enabled }
          }
        });
      }
    } catch (error: any) {
      message.error('Failed to update tool: ' + error.message);
    }
  };

  const tabs: { id: AgentTab; labelKey: string; icon: React.ReactNode }[] = [
    { id: 'browser', labelKey: 'agent.browser_agent', icon: <GlobalOutlined /> },
    { id: 'file', labelKey: 'agent.file_agent', icon: <FolderOutlined /> },
    { id: 'tools', labelKey: 'agent.mcp_tools', icon: <ToolOutlined /> }
  ];

  // Render content based on active tab
  const renderContent = () => {
    if (loading || !settings) {
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
                <Text className="!text-text-01 dark:!text-text-01-dark font-medium block">{t('agent.enable_agent')}</Text>
                <Text className="!text-text-12 dark:text-text-12-dark text-sm">
                  {t('agent.browser_agent_behavior')}
                </Text>
              </div>
              <Switch
                checked={settings.browserAgent?.enabled ?? true}
                onChange={handleBrowserAgentToggle}
              />
            </div>

            {/* Default behaviors */}
            <div className="p-4 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
              <Text className="!text-text-12 dark:!text-text-12-dark font-medium block mb-3">{t('agent.default_behavior')}</Text>
              <div className="text-sm text-text-12 dark:text-text-12-dark space-y-1.5">
                <div>• {t('agent.browser_behaviors.analyze')}</div>
                <div>• {t('agent.browser_behaviors.commands')}</div>
                <div>• {t('agent.browser_behaviors.popups')}</div>
                <div>• {t('agent.browser_behaviors.user_help')}</div>
                <div>• {t('agent.browser_behaviors.scroll')}</div>
              </div>
            </div>

            {/* Custom prompt */}
            <div>
              <Text className="!text-text-01 dark:!text-text-01-dark font-medium block mb-2">{t('agent.custom_prompt')}</Text>
              <Text className="!text-text-12 dark:text-text-12-dark text-sm block mb-3">
                {t('agent.custom_prompt_desc_browser')}
              </Text>
              <TextArea
                value={settings.browserAgent?.customPrompt ?? ''}
                onChange={(e) => handleBrowserPromptChange(e.target.value)}
                placeholder={t('agent.custom_prompt_placeholder')}
                rows={6}
                disabled={!(settings.browserAgent?.enabled ?? true)}
                className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-text-01 dark:text-text-01-darkplaceholder-gray-500"
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
                <Text className="!text-text-01 dark:!text-text-01-dark font-medium block">{t('agent.enable_agent')}</Text>
                <Text className="!text-text-12 dark:text-text-12-dark text-sm">
                  {t('agent.file_agent_behavior')}
                </Text>
              </div>
              <Switch
                checked={settings.fileAgent?.enabled ?? true}
                onChange={handleFileAgentToggle}
              />
            </div>

            {/* Default behaviors */}
            <div className="p-4 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
              <Text className="!text-text-12 dark:!text-text-12-dark font-medium block mb-3">{t('agent.default_behavior')}</Text>
              <div className="text-sm text-text-12 dark:text-text-12-dark space-y-1.5">
                <div>• {t('agent.file_behaviors.tasks')}</div>
                <div>• {t('agent.file_behaviors.paths')}</div>
                <div>• {t('agent.file_behaviors.naming')}</div>
                <div>• {t('agent.file_behaviors.visualization')}</div>
                <div>• {t('agent.file_behaviors.charts')}</div>
              </div>
            </div>

            {/* Custom prompt */}
            <div>
              <Text className="!text-text-01 dark:!text-text-01-dark font-medium block mb-2">{t('agent.custom_prompt')}</Text>
              <Text className="!text-text-12 dark:text-text-12-dark text-sm block mb-3">
                {t('agent.custom_prompt_desc_file')}
              </Text>
              <TextArea
                value={settings.fileAgent?.customPrompt ?? ''}
                onChange={(e) => handleFilePromptChange(e.target.value)}
                placeholder={t('agent.custom_prompt_placeholder')}
                rows={6}
                disabled={!(settings.fileAgent?.enabled ?? true)}
                className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-text-01 dark:text-text-01-darkplaceholder-gray-500"
              />
            </div>
          </div>
        );

      case 'tools':
        return (
          <div className="space-y-4">
            <div className="mb-6">
              <Text className="!text-text-12 dark:text-text-12-dark text-sm">
                {t('agent.mcp_tools_desc')}
              </Text>
            </div>

            {mcpTools.length === 0 ? (
              <div className="text-center py-12 text-text-12 dark:text-text-12-dark">
                <div className="text-4xl mb-3">🔧</div>
                <div className="font-medium mb-1">{t('agent.mcp_tools_empty.title')}</div>
                <div className="text-sm">{t('agent.mcp_tools_empty.desc')}</div>
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
        <div className="flex items-center gap-3 mb-4">
          <RobotOutlined className="text-3xl text-primary dark:text-purple-400" />
          <Title level={2} className="!text-text-01 dark:!text-text-01-dark !mb-0">
            {t('agent.title')}
          </Title>
        </div>
        <Paragraph className="!text-text-12 dark:!text-text-12-dark !mb-0">
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
          <div className="flex-1 bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/10 p-6 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
