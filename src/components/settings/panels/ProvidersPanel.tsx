/**
 * Provider configuration panel
 * INPUT: Provider configs from useSettingsState
 * OUTPUT: Updated provider configurations
 * POSITION: First tab in settings window for API key management
 */

import React, { useState } from 'react';
import { CloudOutlined, EyeOutlined, EyeInvisibleOutlined, DownloadOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { Typography, Input, Button, Switch, Tag, message, Spin } from 'antd';
import clsx from 'clsx';
import { ProviderType, PROVIDER_INFO, ModelInfo } from '@/models/settings';
import { useFetchModels } from '@/hooks/useFetchModels';
import { ProviderConfigs } from '@/utils/config-converter';

const { Title, Paragraph, Text, Link } = Typography;

interface ProviderListItemProps {
  providerId: ProviderType;
  isActive: boolean;
  isSelected: boolean;
  hasApiKey: boolean;
  onClick: () => void;
}

/**
 * Provider list item component
 */
const ProviderListItem: React.FC<ProviderListItemProps> = ({
  providerId,
  isActive,
  isSelected,
  hasApiKey,
  onClick
}) => {
  const providerInfo = PROVIDER_INFO[providerId];

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
      <CloudOutlined className="text-lg text-gray-400" />
      <span className="flex-1 text-sm font-medium text-gray-200">{providerInfo.name}</span>
      {hasApiKey && (
        <div className={clsx(
          'w-2 h-2 rounded-full',
          isActive ? 'bg-green-500' : 'bg-gray-500'
        )} />
      )}
    </button>
  );
};

/**
 * Model list item component
 */
interface ModelListItemProps {
  model: ModelInfo;
  onToggle: () => void;
}

const ModelListItem: React.FC<ModelListItemProps> = ({ model, onToggle }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all mb-2">
      <div className="flex-1">
        <div className="text-white font-medium text-sm">{model.name}</div>
        <div className="text-gray-400 text-xs mt-0.5">{model.id}</div>
      </div>
      <Switch
        checked={model.enabled}
        onChange={onToggle}
        size="small"
      />
    </div>
  );
};

interface ProvidersPanelProps {
  configs: ProviderConfigs;
  onConfigsChange: (newConfigs: ProviderConfigs | ((prev: ProviderConfigs) => ProviderConfigs)) => void;
}

/**
 * Providers configuration panel (Controlled Component)
 * Receives configuration state from parent and emits changes via callback
 */
export const ProvidersPanel: React.FC<ProvidersPanelProps> = ({
  configs,
  onConfigsChange
}) => {
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('deepseek');
  const [searchQuery, setSearchQuery] = useState('');
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const { fetchModels, loading: isFetchingModels } = useFetchModels();

  const currentConfig = configs[selectedProvider];
  const providerInfo = PROVIDER_INFO[selectedProvider];

  // Filter providers by search query
  const filteredProviders = Object.keys(PROVIDER_INFO)
    .filter((id) => {
      const provider = PROVIDER_INFO[id as ProviderType];
      return provider.name.toLowerCase().includes(searchQuery.toLowerCase());
    }) as ProviderType[];

  // Filter models by search query
  const filteredModels = currentConfig?.models?.filter((model) =>
    model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
    model.id.toLowerCase().includes(modelSearchQuery.toLowerCase())
  ) || [];

  // Sort models: enabled first
  const sortedModels = [...filteredModels].sort((a, b) => {
    if (a.enabled === b.enabled) return 0;
    return a.enabled ? -1 : 1;
  });

  const enabledModelCount = currentConfig?.models?.filter(m => m.enabled).length || 0;
  const totalModelCount = currentConfig?.models?.length || 0;

  // Enable provider
  const handleEnableProvider = () => {
    onConfigsChange(prev => ({
      ...prev,
      [selectedProvider]: {
        ...prev[selectedProvider],
        enabled: true
      }
    }));
  };

  // Toggle provider active state
  const handleToggleProvider = (checked: boolean) => {
    onConfigsChange(prev => ({
      ...prev,
      [selectedProvider]: {
        ...prev[selectedProvider],
        enabled: checked
      }
    }));
  };

  // Update API key
  const handleApiKeyChange = (value: string) => {
    onConfigsChange(prev => ({
      ...prev,
      [selectedProvider]: {
        ...prev[selectedProvider],
        apiKey: value
      }
    }));
  };

  // Update Base URL
  const handleBaseUrlChange = (value: string) => {
    onConfigsChange(prev => ({
      ...prev,
      [selectedProvider]: {
        ...prev[selectedProvider],
        baseUrl: value
      }
    }));
  };

  // Fetch models from provider API
  const handleFetchModels = async () => {
    if (!currentConfig.apiKey) {
      message.error('Please enter API key first');
      return;
    }

    try {
      const fetchedModels = await fetchModels(
        selectedProvider,
        currentConfig.apiKey,
        currentConfig.baseUrl
      );

      // If provider doesn't support dynamic fetching, show warning
      if (fetchedModels === null) {
        message.warning(`${providerInfo.name} does not support dynamic model fetching. Using predefined models.`);
        return;
      }

      if (fetchedModels.length > 0) {
        onConfigsChange(prev => ({
          ...prev,
          [selectedProvider]: {
            ...prev[selectedProvider],
            models: fetchedModels,
            lastFetched: Date.now()
          }
        }));
        message.success(`Fetched ${fetchedModels.length} models successfully`);
      } else {
        message.warning('No models found');
      }
    } catch (error: any) {
      console.error('Failed to fetch models:', error);
      message.error(error.message || 'Failed to fetch models. Please check your API key and network connection.');
    }
  };

  // Toggle model enabled state
  const handleToggleModel = (modelId: string) => {
    onConfigsChange(prev => ({
      ...prev,
      [selectedProvider]: {
        ...prev[selectedProvider],
        models: prev[selectedProvider].models.map(m =>
          m.id === modelId ? { ...m, enabled: !m.enabled } : m
        )
      }
    }));
  };

  const hasApiKey = Boolean(currentConfig?.apiKey);
  const isActive = currentConfig?.enabled;

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <CloudOutlined className="text-3xl text-blue-400" />
          <Title level={2} className="!text-white !mb-0">
            Providers
          </Title>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="bg-teal-600 hover:bg-teal-700 border-none"
        >
          Add Custom Provider
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search providers..."
        prefix={<SearchOutlined className="text-gray-400" />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-6 bg-white/5 border-white/10 text-white placeholder-gray-400 flex-shrink-0"
      />

      {/* Main content: Provider list + Details */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left: Provider list */}
        <div className="w-64 overflow-y-auto pr-2 flex-shrink-0">
          {filteredProviders.map((providerId) => (
            <ProviderListItem
              key={providerId}
              providerId={providerId}
              isActive={configs[providerId]?.enabled}
              isSelected={selectedProvider === providerId}
              hasApiKey={Boolean(configs[providerId]?.apiKey)}
              onClick={() => setSelectedProvider(providerId)}
            />
          ))}
        </div>

        {/* Right: Provider details */}
        <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden flex flex-col min-w-0">
          {currentConfig ? (
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
              {/* Provider header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Text className="!text-white text-xl font-semibold">
                      {providerInfo.name}
                    </Text>
                    {isActive && (
                      <Tag color="green" className="!border-green-500/30">
                        Active
                      </Tag>
                    )}
                    {!isActive && hasApiKey && (
                      <Tag color="default" className="!border-gray-500/30">
                        Inactive
                      </Tag>
                    )}
                  </div>
                  <Paragraph className="!text-gray-300 !mb-0">
                    {providerInfo.description}
                  </Paragraph>
                </div>

                {hasApiKey && (
                  <Switch
                    checked={isActive}
                    onChange={handleToggleProvider}
                  />
                )}
              </div>

              {/* State 1: Not enabled - Show enable button */}
              {!hasApiKey && !isActive && (
                <div className="pt-8">
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleEnableProvider}
                    className="bg-teal-600 hover:bg-teal-700 border-none"
                  >
                    Enable Provider
                  </Button>
                </div>
              )}

              {/* State 2 & 3: Enabled - Show configuration */}
              {(hasApiKey || isActive) && (
                <>
                  {/* API Key */}
                  <div>
                    <Text className="!text-white font-medium block mb-2">
                      API Key
                    </Text>
                    <div className="relative">
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="Enter your API key"
                        value={currentConfig.apiKey}
                        onChange={(e) => handleApiKeyChange(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder-gray-400 pr-10"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showApiKey ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      </button>
                    </div>
                    <div className="mt-2">
                      <Link
                        href={providerInfo.getKeyUrl}
                        target="_blank"
                        className="text-blue-400 text-xs"
                      >
                        Get your API key from {providerInfo.name} →
                      </Link>
                    </div>
                  </div>

                  {/* Base URL (Optional) - Only for certain providers */}
                  {(selectedProvider === 'deepseek' || selectedProvider === 'openai') && (
                    <div>
                      <Text className="!text-white font-medium block mb-2">
                        Base URL (Optional)
                      </Text>
                      <Input
                        placeholder={
                          selectedProvider === 'deepseek'
                            ? 'https://api.deepseek.com/v1'
                            : 'https://api.openai.com/v1'
                        }
                        value={currentConfig.baseUrl || ''}
                        onChange={(e) => handleBaseUrlChange(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                      />
                      <Text className="!text-gray-400 text-xs block mt-2">
                        Leave empty to use the default {providerInfo.name} API endpoint
                      </Text>
                    </div>
                  )}

                  {/* Models section */}
                  {hasApiKey && (
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <Text className="!text-white font-medium text-lg">
                          Models
                        </Text>
                        <Button
                          type="default"
                          icon={<DownloadOutlined />}
                          onClick={handleFetchModels}
                          loading={isFetchingModels}
                          className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                        >
                          Fetch
                        </Button>
                      </div>

                      {/* Model search */}
                      <Input
                        placeholder="Search models..."
                        prefix={<SearchOutlined className="text-gray-400" />}
                        value={modelSearchQuery}
                        onChange={(e) => setModelSearchQuery(e.target.value)}
                        className="mb-4 bg-white/5 border-white/10 text-white placeholder-gray-400"
                      />

                      {/* Model list */}
                      {sortedModels.length > 0 ? (
                        <>
                          <Text className="!text-gray-400 text-xs block mb-3">
                            Showing {enabledModelCount} of {totalModelCount} models (enabled models shown first)
                          </Text>
                          <div className="max-h-80 overflow-y-auto">
                            {sortedModels.map((model) => (
                              <ModelListItem
                                key={model.id}
                                model={model}
                                onToggle={() => handleToggleModel(model.id)}
                              />
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12 text-gray-400">
                          <div className="text-4xl mb-3">📭</div>
                          <div className="font-medium mb-1">No models available</div>
                          <div className="text-sm">
                            Please check your API key and try refreshing
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1">
              <Spin size="large" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
