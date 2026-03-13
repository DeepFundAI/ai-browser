/**
 * MCP service management panel
 * INPUT: McpSettings from useSettingsState
 * OUTPUT: MCP service CRUD and tool fetching
 * POSITION: MCP tab in settings window
 */

import React, { useState } from 'react';
import {
  ApiOutlined,
  PlusOutlined,
  DeleteOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { Typography, Input, App, Popconfirm, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import type { McpSettings, McpServiceConfig, McpToolInfo } from '@/models/settings';
import { SelectableCard, ActionButton } from '@/components/ui';
import { AddMcpServiceModal } from './AddMcpServiceModal';
import { logger } from '@/utils/logger';

const { Title, Paragraph, Text } = Typography;

/** Service list item in left sidebar */
const ServiceListItem: React.FC<{
  service: McpServiceConfig;
  isSelected: boolean;
  onClick: () => void;
}> = ({ service, isSelected, onClick }) => {
  return (
    <SelectableCard
      selected={isSelected}
      onClick={onClick}
      hoverScale={false}
      className="w-full mb-2 px-4 py-3"
    >
      <div className="flex items-center gap-3 text-left">
        <ApiOutlined className="text-lg text-text-12 dark:text-text-12-dark" />
        <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
          {service.name}
        </span>
        {service.tools.length > 0 && (
          <div className="w-2 h-2 rounded-full flex-shrink-0 bg-green-500" />
        )}
      </div>
    </SelectableCard>
  );
};

/** Tool list item */
const ToolListItem: React.FC<{ tool: McpToolInfo }> = ({ tool }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-200 dark:hover:border-white/10 transition-all duration-200 mb-2">
      <div className="flex-1 min-w-0">
        <div className="text-text-01 dark:text-text-01-dark font-medium text-sm">{tool.name}</div>
        <div className="text-text-12 dark:text-text-12-dark text-xs mt-0.5 truncate">{tool.description}</div>
      </div>
    </div>
  );
};

interface McpPanelProps {
  settings?: McpSettings;
  onSettingsChange?: (settings: McpSettings) => void;
}

/**
 * MCP service management panel
 */
export const McpPanel: React.FC<McpPanelProps> = ({
  settings = { services: [] },
  onSettingsChange
}) => {
  const { t } = useTranslation('settings');
  const { message } = App.useApp();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    settings.services[0]?.id ?? null
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [fetchingTools, setFetchingTools] = useState(false);

  const currentService = settings.services.find(s => s.id === selectedServiceId);

  const updateSettings = (services: McpServiceConfig[]) => {
    onSettingsChange?.({ ...settings, services });
  };

  /** Add a new MCP service */
  const handleAddService = (name: string, url: string) => {
    const newService: McpServiceConfig = {
      id: `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      url,
      tools: []
    };
    updateSettings([...settings.services, newService]);
    setSelectedServiceId(newService.id);
    setShowAddModal(false);
    message.success(t('mcp.service_added'));
  };

  /** Delete an MCP service */
  const handleDeleteService = () => {
    if (!selectedServiceId) return;
    const remaining = settings.services.filter(s => s.id !== selectedServiceId);
    updateSettings(remaining);
    setSelectedServiceId(remaining[0]?.id ?? null);
    message.success(t('mcp.service_deleted'));
  };

  /** Update current service fields */
  const handleUpdateService = (updates: Partial<McpServiceConfig>) => {
    if (!selectedServiceId) return;
    updateSettings(
      settings.services.map(s =>
        s.id === selectedServiceId ? { ...s, ...updates } : s
      )
    );
  };

  /** Fetch tools from an MCP service */
  const handleFetchTools = async () => {
    if (!currentService) return;

    setFetchingTools(true);
    try {
      const result = await window.api.fetchMcpTools(currentService.url);
      if (result?.success && result.data?.tools) {
        const tools: McpToolInfo[] = result.data.tools.map((tool: McpToolInfo) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }));
        handleUpdateService({ tools });
        message.success(t('mcp.fetch_success', { count: tools.length }));
      } else {
        message.error(result?.error || t('mcp.fetch_failed'));
      }
    } catch (error: unknown) {
      logger.error('Failed to fetch MCP tools', error, 'McpPanel');
      const msg = error instanceof Error ? error.message : String(error);
      message.error(t('mcp.fetch_failed') + ': ' + msg);
    } finally {
      setFetchingTools(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <ApiOutlined className="text-3xl text-primary dark:text-purple-400" />
          <div>
            <Title level={2} className="!text-text-01 dark:!text-text-01-dark !mb-0">
              {t('mcp.title')}
            </Title>
            <Paragraph className="!text-text-12 dark:!text-text-12-dark !mb-0 text-sm mt-1">
              {t('mcp.description')}
            </Paragraph>
          </div>
        </div>
        <ActionButton
          variant="primary"
          icon={<PlusOutlined />}
          onClick={() => setShowAddModal(true)}
        >
          {t('mcp.add_service')}
        </ActionButton>
      </div>

      {/* Main content: Service list + Details */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left: Service list */}
        <div className="w-64 overflow-y-auto pr-2 flex-shrink-0">
          {settings.services.map((service) => (
            <ServiceListItem
              key={service.id}
              service={service}
              isSelected={selectedServiceId === service.id}
              onClick={() => setSelectedServiceId(service.id)}
            />
          ))}
          {settings.services.length === 0 && (
            <div className="text-center py-12 text-text-12 dark:text-text-12-dark">
              <div className="text-4xl mb-3">🔌</div>
              <div className="font-medium mb-1">{t('mcp.empty_title')}</div>
              <div className="text-xs">{t('mcp.empty_desc')}</div>
            </div>
          )}
        </div>

        {/* Right: Service details */}
        <div className="flex-1 bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col min-w-0">
          {currentService ? (
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* Service header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Text className="!text-text-01 dark:!text-text-01-dark text-xl font-semibold">
                        {currentService.name}
                      </Text>
                      {currentService.tools.length > 0 && (
                        <Tag color="green" className="!border-green-500/30">
                          {t('mcp.tool_count', { count: currentService.tools.length })}
                        </Tag>
                      )}
                    </div>
                    <Paragraph className="!text-text-12 dark:text-text-12-dark !mb-0 text-sm">
                      {currentService.url}
                    </Paragraph>
                  </div>
                  <Popconfirm
                    title={t('mcp.delete_confirm_title')}
                    description={t('mcp.delete_confirm_content')}
                    onConfirm={handleDeleteService}
                    okText={t('mcp.delete')}
                    cancelText={t('mcp.cancel')}
                    okButtonProps={{ danger: true }}
                  >
                    <ActionButton
                      variant="danger"
                      icon={<DeleteOutlined />}
                      size="small"
                    />
                  </Popconfirm>
                </div>

                {/* Service name */}
                <div>
                  <Text className="!text-text-01 dark:!text-text-01-dark font-medium block mb-2">
                    {t('mcp.service_name')}
                  </Text>
                  <Input
                    value={currentService.name}
                    onChange={(e) => handleUpdateService({ name: e.target.value })}
                    className="!bg-white dark:!bg-white/5 !border-black/5 dark:!border-white/5 !text-text-01 dark:!text-text-01-dark"
                  />
                </div>

                {/* SSE URL */}
                <div>
                  <Text className="!text-text-01 dark:!text-text-01-dark font-medium block mb-2">
                    {t('mcp.sse_url')}
                  </Text>
                  <Input
                    value={currentService.url}
                    onChange={(e) => handleUpdateService({ url: e.target.value })}
                    placeholder={t('mcp.sse_url_placeholder')}
                    className="!bg-white dark:!bg-white/5 !border-black/5 dark:!border-white/5 !text-text-01 dark:!text-text-01-dark"
                  />
                </div>

                {/* Tools section */}
                <div className="pt-4 border-t border-gray-200 dark:border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <Text className="!text-text-01 dark:!text-text-01-dark font-medium text-lg">
                      {t('mcp.tools_title')}
                    </Text>
                    <ActionButton
                      variant="secondary"
                      icon={<SyncOutlined spin={fetchingTools} />}
                      onClick={handleFetchTools}
                      loading={fetchingTools}
                    >
                      {t('mcp.fetch_tools')}
                    </ActionButton>
                  </div>

                  {currentService.tools.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                      {currentService.tools.map((tool) => (
                        <ToolListItem key={tool.name} tool={tool} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-text-12 dark:text-text-12-dark">
                      <div className="text-3xl mb-2">🔧</div>
                      <div className="font-medium mb-1">{t('mcp.no_tools_title')}</div>
                      <div className="text-sm">{t('mcp.no_tools_desc')}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1 text-text-12 dark:text-text-12-dark">
              {t('mcp.select_service')}
            </div>
          )}
        </div>
      </div>

      {/* Add MCP Service Modal */}
      <AddMcpServiceModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddService}
      />
    </div>
  );
};
