/**
 * Agent configuration panel
 * INPUT: Agent config + global MCP services
 * OUTPUT: Updated agent configurations with per-agent MCP selection
 * POSITION: Fourth tab in settings window for agent behavior management
 */

import React, { useState } from 'react';
import {
  RobotOutlined,
  GlobalOutlined,
  FolderOutlined,
  ApiOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { Typography, Switch, Input, Spin, Tag, Popconfirm, Modal, App } from 'antd';
import { useTranslation } from 'react-i18next';
import type { AgentConfig, CustomAgentConfig } from '@/types';
import type { McpServiceConfig, AgentMcpConfig } from '@/models/settings';
import { SelectableCard, ActionButton } from '@/components/ui';
import {
  BROWSER_AGENT_DEFAULT_PROMPT,
  FILE_AGENT_DEFAULT_PROMPT,
  BROWSER_AGENT_BUILTIN_TOOLS,
  FILE_AGENT_BUILTIN_TOOLS,
  type BuiltinToolInfo
} from '@/config/agent-prompts';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

type AgentTab = string; // 'browser' | 'file' | custom agent id

/** List item for agent sidebar */
const AgentListItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  tagLabel?: string;
  tagColor?: string;
  onClick: () => void;
}> = ({ label, icon, isSelected, tagLabel, tagColor, onClick }) => (
  <SelectableCard
    selected={isSelected}
    onClick={onClick}
    hoverScale={false}
    className="w-full mb-2 px-4 py-3"
  >
    <div className="flex items-center gap-3 text-left">
      <span className="text-lg text-text-12 dark:text-text-12-dark">{icon}</span>
      <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
        {label}
      </span>
      {tagLabel && (
        <Tag color={tagColor} className="!text-xs !mr-0 flex-shrink-0">
          {tagLabel}
        </Tag>
      )}
    </div>
  </SelectableCard>
);

/** Per-agent MCP service selector */
const McpServiceSelector: React.FC<{
  services: McpServiceConfig[];
  agentMcpConfig: AgentMcpConfig;
  onConfigChange: (config: AgentMcpConfig) => void;
  disabled?: boolean;
}> = ({ services, agentMcpConfig, onConfigChange, disabled }) => {
  const { t } = useTranslation('settings');

  if (services.length === 0) {
    return (
      <div className="text-center py-6 text-text-12 dark:text-text-12-dark">
        <div className="text-2xl mb-2">🔌</div>
        <div className="text-sm">{t('agent.no_mcp_services')}</div>
      </div>
    );
  }

  /** Toggle service enabled state */
  const handleServiceToggle = (serviceId: string, enabled: boolean) => {
    const current = agentMcpConfig[serviceId];
    onConfigChange({
      ...agentMcpConfig,
      [serviceId]: {
        enabled,
        tools: current?.tools ?? {}
      }
    });
  };

  /** Toggle individual tool within a service */
  const handleToolToggle = (serviceId: string, toolName: string, enabled: boolean) => {
    const current = agentMcpConfig[serviceId];
    if (!current) return;
    onConfigChange({
      ...agentMcpConfig,
      [serviceId]: {
        ...current,
        tools: { ...current.tools, [toolName]: { enabled } }
      }
    });
  };

  /** Check if a tool is enabled */
  const isToolEnabled = (serviceId: string, toolName: string): boolean => {
    return agentMcpConfig[serviceId]?.tools[toolName]?.enabled ?? true;
  };

  return (
    <div className="space-y-3">
      {services.map((service) => {
        const serviceConfig = agentMcpConfig[service.id];
        const isEnabled = serviceConfig?.enabled ?? false;

        return (
          <div
            key={service.id}
            className="rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden"
          >
            {/* Service header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-white/5">
              <div className="flex items-center gap-2 min-w-0">
                <ApiOutlined className="text-text-12 dark:text-text-12-dark flex-shrink-0" />
                <Text className="!text-text-01 dark:!text-text-01-dark font-medium text-sm truncate">
                  {service.name}
                </Text>
                {service.tools.length > 0 && (
                  <span className="text-xs text-text-12 dark:text-text-12-dark flex-shrink-0">
                    ({service.tools.length})
                  </span>
                )}
              </div>
              <Switch
                checked={isEnabled}
                onChange={(checked) => handleServiceToggle(service.id, checked)}
                size="small"
                disabled={disabled}
              />
            </div>

            {/* Tool list */}
            {isEnabled && service.tools.length > 0 && (
              <div className="border-t border-gray-100 dark:border-white/5 px-4 py-2 space-y-1">
                {service.tools.map((tool) => (
                  <div
                    key={tool.name}
                    className="flex items-center justify-between py-1.5"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="text-sm text-text-01 dark:text-text-01-dark truncate">
                        {tool.name}
                      </div>
                      {tool.description && (
                        <div className="text-xs text-text-12 dark:text-text-12-dark truncate">
                          {tool.description}
                        </div>
                      )}
                    </div>
                    <Switch
                      checked={isToolEnabled(service.id, tool.name)}
                      onChange={(checked) => handleToolToggle(service.id, tool.name, checked)}
                      size="small"
                      disabled={disabled}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/** Read-only default prompt display */
const DefaultPromptBlock: React.FC<{ prompt: string }> = ({ prompt }) => {
  const { t } = useTranslation('settings');
  return (
    <div>
      <Text className="!text-text-01 dark:!text-text-01-dark font-medium block mb-1">
        {t('agent.default_prompt')}
      </Text>
      <Text className="!text-text-12 dark:text-text-12-dark text-xs block mb-2">
        {t('agent.default_prompt_desc')}
      </Text>
      <pre className="max-h-60 overflow-y-auto bg-gray-50 dark:bg-white/5 rounded-lg p-4 text-sm text-text-01 dark:text-text-01-dark whitespace-pre-wrap break-words border border-gray-200 dark:border-white/10 leading-relaxed">
        {prompt}
      </pre>
    </div>
  );
};

/** Read-only built-in tools display */
const BuiltinToolsBlock: React.FC<{ tools: BuiltinToolInfo[] }> = ({ tools }) => {
  const { t } = useTranslation('settings');
  return (
    <div>
      <Text className="!text-text-01 dark:!text-text-01-dark font-medium block mb-1">
        {t('agent.builtin_tools')}
      </Text>
      <Text className="!text-text-12 dark:text-text-12-dark text-xs block mb-2">
        {t('agent.builtin_tools_desc')}
      </Text>
      <div className="rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
        {tools.map((tool, index) => (
          <div
            key={tool.name}
            className={`flex items-center gap-3 px-4 py-2.5 ${
              index > 0 ? 'border-t border-gray-100 dark:border-white/5' : ''
            }`}
          >
            <code className="text-xs font-mono text-primary dark:text-purple-400 bg-primary/5 dark:bg-purple-400/10 px-2 py-0.5 rounded flex-shrink-0">
              {tool.name}
            </code>
            <span className="text-xs text-text-12 dark:text-text-12-dark truncate">
              {tool.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface AgentPanelProps {
  settings?: AgentConfig;
  onSettingsChange?: (settings: AgentConfig) => void;
  mcpServices?: McpServiceConfig[];
}

/** Agent configuration panel */
export const AgentPanel: React.FC<AgentPanelProps> = ({
  settings,
  onSettingsChange,
  mcpServices = []
}) => {
  const { t } = useTranslation('settings');
  const { message: antMessage } = App.useApp();
  const [activeTab, setActiveTab] = useState<AgentTab>('browser');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');

  const customAgents = settings?.customAgents ?? [];

  /** Update a built-in agent's settings */
  const updateBuiltinAgent = (
    agentKey: 'browserAgent' | 'fileAgent',
    updates: Partial<AgentConfig['browserAgent']>
  ) => {
    if (!settings || !onSettingsChange) return;
    onSettingsChange({
      ...settings,
      [agentKey]: { ...settings[agentKey], ...updates }
    });
  };

  /** Update a custom agent's settings */
  const updateCustomAgent = (id: string, updates: Partial<CustomAgentConfig>) => {
    if (!settings || !onSettingsChange) return;
    onSettingsChange({
      ...settings,
      customAgents: customAgents.map(a => a.id === id ? { ...a, ...updates } : a)
    });
  };

  /** Add a new custom agent */
  const handleAddAgent = () => {
    if (!newAgentName.trim() || !settings || !onSettingsChange) return;

    const newAgent: CustomAgentConfig = {
      id: crypto.randomUUID(),
      name: newAgentName.trim(),
      description: '',
      planDescription: '',
      enabled: true,
      mcpServices: {}
    };

    onSettingsChange({
      ...settings,
      customAgents: [...customAgents, newAgent]
    });

    setActiveTab(newAgent.id);
    setNewAgentName('');
    setAddModalOpen(false);
    antMessage.success(t('agent.agent_added'));
  };

  /** Delete a custom agent */
  const handleDeleteAgent = (id: string) => {
    if (!settings || !onSettingsChange) return;
    onSettingsChange({
      ...settings,
      customAgents: customAgents.filter(a => a.id !== id)
    });
    if (activeTab === id) setActiveTab('browser');
    antMessage.success(t('agent.agent_deleted'));
  };

  /** Render built-in agent detail */
  const renderBuiltinAgentContent = (
    agentKey: 'browserAgent' | 'fileAgent',
    behaviorKey: 'browser' | 'file'
  ) => {
    if (!settings) return null;
    const agentSettings = settings[agentKey];
    const isEnabled = agentSettings?.enabled ?? true;
    const defaultPrompt = behaviorKey === 'browser'
      ? BROWSER_AGENT_DEFAULT_PROMPT
      : FILE_AGENT_DEFAULT_PROMPT;
    const builtinTools = behaviorKey === 'browser'
      ? BROWSER_AGENT_BUILTIN_TOOLS
      : FILE_AGENT_BUILTIN_TOOLS;

    return (
      <div className="space-y-6">
        {/* Header with enable toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Text className="!text-text-01 dark:!text-text-01-dark font-medium text-base">
              {t(`agent.${behaviorKey}_agent`)}
            </Text>
            <Tag color="blue">{t('agent.builtin_tag')}</Tag>
          </div>
          <Switch
            checked={isEnabled}
            onChange={(enabled) => updateBuiltinAgent(agentKey, { enabled })}
          />
        </div>

        {/* Default prompt (read-only) */}
        <DefaultPromptBlock prompt={defaultPrompt} />

        {/* Built-in tools (read-only) */}
        <BuiltinToolsBlock tools={builtinTools} />

        {/* Custom prompt */}
        <div>
          <Text className="!text-text-01 dark:!text-text-01-dark font-medium block mb-2">
            {t('agent.custom_prompt')}
          </Text>
          <Text className="!text-text-12 dark:text-text-12-dark text-sm block mb-3">
            {t(`agent.custom_prompt_desc_${behaviorKey}`)}
          </Text>
          <TextArea
            value={agentSettings?.customPrompt ?? ''}
            onChange={(e) => updateBuiltinAgent(agentKey, { customPrompt: e.target.value })}
            placeholder={t('agent.custom_prompt_placeholder')}
            rows={4}
            disabled={!isEnabled}
            className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-text-01 dark:text-text-01-dark placeholder-gray-500"
          />
        </div>

        {/* MCP services */}
        <div className="pt-4 border-t border-gray-200 dark:border-white/10">
          <Text className="!text-text-01 dark:!text-text-01-dark font-medium text-base block mb-1">
            {t('agent.mcp_services_title')}
          </Text>
          <Text className="!text-text-12 dark:text-text-12-dark text-sm block mb-4">
            {t('agent.mcp_services_desc')}
          </Text>
          <McpServiceSelector
            services={mcpServices}
            agentMcpConfig={agentSettings?.mcpServices ?? {}}
            onConfigChange={(mcpConfig) => updateBuiltinAgent(agentKey, { mcpServices: mcpConfig })}
            disabled={!isEnabled}
          />
        </div>
      </div>
    );
  };

  /** Render custom agent detail */
  const renderCustomAgentContent = (agent: CustomAgentConfig) => {
    return (
      <div className="space-y-6">
        {/* Header with delete */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Text className="!text-text-01 dark:!text-text-01-dark font-medium text-base">
              {agent.name}
            </Text>
            <Tag color="green">{t('agent.custom_tag')}</Tag>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={agent.enabled}
              onChange={(enabled) => updateCustomAgent(agent.id, { enabled })}
            />
            <Popconfirm
              title={t('agent.delete_agent')}
              description={t('agent.delete_agent_confirm')}
              onConfirm={() => handleDeleteAgent(agent.id)}
              okButtonProps={{ danger: true }}
            >
              <ActionButton variant="danger" icon={<DeleteOutlined />} size="small">
                {t('agent.delete_agent')}
              </ActionButton>
            </Popconfirm>
          </div>
        </div>

        {/* Name */}
        <div>
          <Text className="!text-text-01 dark:!text-text-01-dark font-medium block mb-2">
            {t('agent.agent_name')}
          </Text>
          <Input
            value={agent.name}
            onChange={(e) => updateCustomAgent(agent.id, { name: e.target.value })}
            placeholder={t('agent.agent_name_placeholder')}
            className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10"
          />
        </div>

        {/* Description (system prompt) */}
        <div>
          <Text className="!text-text-01 dark:!text-text-01-dark font-medium block mb-2">
            {t('agent.agent_description')}
          </Text>
          <TextArea
            value={agent.description}
            onChange={(e) => updateCustomAgent(agent.id, { description: e.target.value })}
            placeholder={t('agent.agent_description_placeholder')}
            rows={6}
            disabled={!agent.enabled}
            className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-text-01 dark:text-text-01-dark placeholder-gray-500"
          />
        </div>

        {/* Plan description */}
        <div>
          <Text className="!text-text-01 dark:!text-text-01-dark font-medium block mb-2">
            {t('agent.agent_plan_description')}
          </Text>
          <TextArea
            value={agent.planDescription}
            onChange={(e) => updateCustomAgent(agent.id, { planDescription: e.target.value })}
            placeholder={t('agent.agent_plan_description_placeholder')}
            rows={3}
            disabled={!agent.enabled}
            className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-text-01 dark:text-text-01-dark placeholder-gray-500"
          />
        </div>

        {/* MCP services */}
        <div className="pt-4 border-t border-gray-200 dark:border-white/10">
          <Text className="!text-text-01 dark:!text-text-01-dark font-medium text-base block mb-1">
            {t('agent.mcp_services_title')}
          </Text>
          <Text className="!text-text-12 dark:text-text-12-dark text-sm block mb-4">
            {t('agent.mcp_services_desc')}
          </Text>
          <McpServiceSelector
            services={mcpServices}
            agentMcpConfig={agent.mcpServices}
            onConfigChange={(mcpConfig) => updateCustomAgent(agent.id, { mcpServices: mcpConfig })}
            disabled={!agent.enabled}
          />
        </div>
      </div>
    );
  };

  /** Render detail panel content */
  const renderContent = () => {
    if (!settings) {
      return (
        <div className="flex items-center justify-center h-full">
          <Spin size="large" />
        </div>
      );
    }

    if (activeTab === 'browser') return renderBuiltinAgentContent('browserAgent', 'browser');
    if (activeTab === 'file') return renderBuiltinAgentContent('fileAgent', 'file');

    const customAgent = customAgents.find(a => a.id === activeTab);
    if (customAgent) return renderCustomAgentContent(customAgent);

    return null;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-8 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <RobotOutlined className="text-3xl text-primary dark:text-purple-400" />
            <Title level={2} className="!text-text-01 dark:!text-text-01-dark !mb-0">
              {t('agent.title')}
            </Title>
          </div>
          <ActionButton
            variant="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddModalOpen(true)}
          >
            {t('agent.add_custom_agent')}
          </ActionButton>
        </div>
        <Paragraph className="!text-text-12 dark:!text-text-12-dark !mb-0">
          {t('agent.description')}
        </Paragraph>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 p-8 pt-6">
        <div className="flex gap-6 h-full">
          {/* Left sidebar */}
          <div className="w-56 flex-shrink-0 overflow-y-auto">
            {/* Built-in agents */}
            <AgentListItem
              label={t('agent.browser_agent')}
              icon={<GlobalOutlined />}
              isSelected={activeTab === 'browser'}
              tagLabel={t('agent.builtin_tag')}
              tagColor="blue"
              onClick={() => setActiveTab('browser')}
            />
            <AgentListItem
              label={t('agent.file_agent')}
              icon={<FolderOutlined />}
              isSelected={activeTab === 'file'}
              tagLabel={t('agent.builtin_tag')}
              tagColor="blue"
              onClick={() => setActiveTab('file')}
            />

            {/* Custom agents */}
            {customAgents.length > 0 && (
              <>
                <div className="my-3 border-t border-gray-200 dark:border-white/10" />
                {customAgents.map((agent) => (
                  <AgentListItem
                    key={agent.id}
                    label={agent.name}
                    icon={<RobotOutlined />}
                    isSelected={activeTab === agent.id}
                    tagLabel={t('agent.custom_tag')}
                    tagColor="green"
                    onClick={() => setActiveTab(agent.id)}
                  />
                ))}
              </>
            )}
          </div>

          {/* Right detail panel */}
          <div className="flex-1 bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/10 p-6 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Add custom agent modal */}
      <Modal
        title={t('agent.add_custom_agent')}
        open={addModalOpen}
        onOk={handleAddAgent}
        onCancel={() => { setAddModalOpen(false); setNewAgentName(''); }}
        okButtonProps={{ disabled: !newAgentName.trim() }}
        destroyOnHidden
      >
        <div className="py-4">
          <Text className="block mb-2">{t('agent.agent_name')}</Text>
          <Input
            value={newAgentName}
            onChange={(e) => setNewAgentName(e.target.value)}
            placeholder={t('agent.agent_name_placeholder')}
            onPressEnter={handleAddAgent}
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
};
