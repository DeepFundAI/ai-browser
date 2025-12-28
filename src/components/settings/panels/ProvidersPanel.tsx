/**
 * Provider configuration panel
 * INPUT: Provider configs from useSettingsState
 * OUTPUT: Updated provider configurations
 * POSITION: First tab in settings window for API key management
 */

import React, { useState, useMemo } from 'react';
import {
  CloudOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  DownloadOutlined,
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  ApiOutlined
} from '@ant-design/icons';
import { Typography, Input, Button, Switch, Tag, App, Popconfirm } from 'antd';
import clsx from 'clsx';
import {
  ProviderConfig,
  ModelInfo,
  BUILTIN_PROVIDER_META,
  BUILTIN_PROVIDER_IDS,
  BuiltinProviderId,
  createCustomProviderConfig
} from '@/models/settings';
import { useFetchModels } from '@/hooks/useFetchModels';
import { ProviderConfigs } from '@/utils/config-converter';
import { AddCustomProviderModal } from './AddCustomProviderModal';

const { Title, Paragraph, Text, Link } = Typography;

interface ProviderListItemProps {
  provider: ProviderConfig;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Provider list item component
 */
const ProviderListItem: React.FC<ProviderListItemProps> = ({
  provider,
  isSelected,
  onClick
}) => {
  const hasApiKey = Boolean(provider.apiKey);
  const isCustom = provider.type === 'custom';

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
      {isCustom ? (
        <ApiOutlined className="text-lg text-purple-400" />
      ) : (
        <CloudOutlined className="text-lg text-gray-400" />
      )}
      <span className="flex-1 text-sm font-medium text-gray-200 truncate">
        {provider.name}
      </span>
      {isCustom && (
        <Tag color="purple" className="!text-xs !px-1.5 !py-0 !border-purple-500/30">
          CUSTOM
        </Tag>
      )}
      {hasApiKey && (
        <div className={clsx(
          'w-2 h-2 rounded-full flex-shrink-0',
          provider.enabled ? 'bg-green-500' : 'bg-gray-500'
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

/**
 * Add model inline component
 */
interface AddModelInlineProps {
  onAdd: (modelId: string, modelName: string) => void;
}

const AddModelInline: React.FC<AddModelInlineProps> = ({ onAdd }) => {
  const [modelId, setModelId] = useState('');
  const [modelName, setModelName] = useState('');

  const handleAdd = () => {
    if (!modelId.trim()) {
      message.warning('Please enter Model ID');
      return;
    }
    onAdd(modelId.trim(), modelName.trim() || modelId.trim());
    setModelId('');
    setModelName('');
  };

  return (
    <div className="flex items-center gap-2 mt-3">
      <Input
        placeholder="Model ID (e.g., gpt-4)"
        value={modelId}
        onChange={(e) => setModelId(e.target.value)}
        className="flex-1 bg-white/5 border-white/10 text-white placeholder-gray-400"
        size="small"
      />
      <Input
        placeholder="Display Name (optional)"
        value={modelName}
        onChange={(e) => setModelName(e.target.value)}
        className="flex-1 bg-white/5 border-white/10 text-white placeholder-gray-400"
        size="small"
      />
      <Button
        icon={<PlusOutlined />}
        onClick={handleAdd}
        size="small"
        className="bg-white/5 border-white/10 text-white hover:bg-white/10"
      >
        Add
      </Button>
    </div>
  );
};

interface ProvidersPanelProps {
  configs: ProviderConfigs;
  onConfigsChange: (newConfigs: ProviderConfigs | ((prev: ProviderConfigs) => ProviderConfigs)) => void;
  onAddProvider?: (provider: ProviderConfig) => void;
  onRemoveProvider?: (providerId: string) => void;
}

/**
 * Providers configuration panel (Controlled Component)
 * Receives configuration state from parent and emits changes via callback
 */
export const ProvidersPanel: React.FC<ProvidersPanelProps> = ({
  configs,
  onConfigsChange,
  onAddProvider,
  onRemoveProvider
}) => {
  const { message } = App.useApp();
  const [selectedProviderId, setSelectedProviderId] = useState<string>('deepseek');
  const [searchQuery, setSearchQuery] = useState('');
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const { fetchModels, loading: isFetchingModels } = useFetchModels();

  // Get sorted provider list: builtin first, then custom
  const providerList = useMemo(() => {
    const builtinProviders: ProviderConfig[] = [];
    const customProviders: ProviderConfig[] = [];

    Object.values(configs).forEach(provider => {
      if (provider.type === 'builtin') {
        builtinProviders.push(provider);
      } else {
        customProviders.push(provider);
      }
    });

    // Sort builtin by predefined order
    builtinProviders.sort((a, b) => {
      const aIndex = BUILTIN_PROVIDER_IDS.indexOf(a.id as BuiltinProviderId);
      const bIndex = BUILTIN_PROVIDER_IDS.indexOf(b.id as BuiltinProviderId);
      return aIndex - bIndex;
    });

    // Custom providers sorted alphabetically
    customProviders.sort((a, b) => a.name.localeCompare(b.name));

    return [...builtinProviders, ...customProviders];
  }, [configs]);

  // Filter providers by search query
  const filteredProviders = useMemo(() => {
    if (!searchQuery) return providerList;
    return providerList.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [providerList, searchQuery]);

  const currentConfig = configs[selectedProviderId];
  const isBuiltin = currentConfig?.type === 'builtin';
  const providerMeta = isBuiltin
    ? BUILTIN_PROVIDER_META[selectedProviderId as BuiltinProviderId]
    : null;

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
      [selectedProviderId]: {
        ...prev[selectedProviderId],
        enabled: true
      }
    }));
  };

  // Toggle provider active state
  const handleToggleProvider = (checked: boolean) => {
    onConfigsChange(prev => ({
      ...prev,
      [selectedProviderId]: {
        ...prev[selectedProviderId],
        enabled: checked
      }
    }));
  };

  // Update API key
  const handleApiKeyChange = (value: string) => {
    onConfigsChange(prev => ({
      ...prev,
      [selectedProviderId]: {
        ...prev[selectedProviderId],
        apiKey: value
      }
    }));
  };

  // Update Base URL
  const handleBaseUrlChange = (value: string) => {
    onConfigsChange(prev => ({
      ...prev,
      [selectedProviderId]: {
        ...prev[selectedProviderId],
        baseUrl: value
      }
    }));
  };

  // Update provider name (custom only)
  const handleNameChange = (value: string) => {
    if (!currentConfig || currentConfig.type !== 'custom') return;
    onConfigsChange(prev => ({
      ...prev,
      [selectedProviderId]: {
        ...prev[selectedProviderId],
        name: value
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
        selectedProviderId,
        currentConfig.apiKey,
        currentConfig.baseUrl
      );

      // If provider doesn't support dynamic fetching, show warning
      if (fetchedModels === null) {
        message.warning(`${currentConfig.name} does not support dynamic model fetching. Add models manually.`);
        return;
      }

      if (fetchedModels.length > 0) {
        onConfigsChange(prev => ({
          ...prev,
          [selectedProviderId]: {
            ...prev[selectedProviderId],
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
      [selectedProviderId]: {
        ...prev[selectedProviderId],
        models: prev[selectedProviderId].models.map(m =>
          m.id === modelId ? { ...m, enabled: !m.enabled } : m
        )
      }
    }));
  };

  // Add model manually
  const handleAddModel = (modelId: string, modelName: string) => {
    // Check if model already exists
    if (currentConfig.models.some(m => m.id === modelId)) {
      message.warning('Model already exists');
      return;
    }

    onConfigsChange(prev => ({
      ...prev,
      [selectedProviderId]: {
        ...prev[selectedProviderId],
        models: [
          ...prev[selectedProviderId].models,
          { id: modelId, name: modelName, enabled: true }
        ]
      }
    }));
    message.success('Model added');
  };

  // Delete custom provider
  const handleDeleteProvider = () => {
    if (onRemoveProvider) {
      onRemoveProvider(selectedProviderId);
      // Select first provider
      setSelectedProviderId('deepseek');
    }
  };

  // Add custom provider
  const handleAddCustomProvider = (name: string, baseUrl: string, apiKey: string) => {
    const id = `custom_${Date.now()}`;
    const newProvider = createCustomProviderConfig(id, name, baseUrl);
    newProvider.apiKey = apiKey;

    if (onAddProvider) {
      onAddProvider(newProvider);
    } else {
      onConfigsChange(prev => ({
        ...prev,
        [id]: newProvider
      }));
    }

    setSelectedProviderId(id);
    setShowAddModal(false);
    message.success('Custom provider added');
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
          onClick={() => setShowAddModal(true)}
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
          {filteredProviders.map((provider) => (
            <ProviderListItem
              key={provider.id}
              provider={provider}
              isSelected={selectedProviderId === provider.id}
              onClick={() => setSelectedProviderId(provider.id)}
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
                      {currentConfig.name}
                    </Text>
                    {!isBuiltin && (
                      <Tag color="purple" className="!border-purple-500/30">
                        CUSTOM
                      </Tag>
                    )}
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
                  {isBuiltin && providerMeta && (
                    <Paragraph className="!text-gray-300 !mb-0">
                      {providerMeta.description}
                    </Paragraph>
                  )}
                  {!isBuiltin && (
                    <Paragraph className="!text-gray-400 !mb-0 text-sm">
                      {currentConfig.baseUrl}
                    </Paragraph>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!isBuiltin && (
                    <Popconfirm
                      title="Delete this provider?"
                      description="This action cannot be undone."
                      onConfirm={handleDeleteProvider}
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        className="!text-red-400 hover:!text-red-300"
                      />
                    </Popconfirm>
                  )}
                  {hasApiKey && (
                    <Switch
                      checked={isActive}
                      onChange={handleToggleProvider}
                    />
                  )}
                </div>
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
                  {/* Provider Name (Custom only) */}
                  {!isBuiltin && (
                    <div>
                      <Text className="!text-white font-medium block mb-2">
                        Provider Name
                      </Text>
                      <Input
                        placeholder="Enter provider name"
                        value={currentConfig.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                      />
                    </div>
                  )}

                  {/* Base URL */}
                  <div>
                    <Text className="!text-white font-medium block mb-2">
                      Base URL {isBuiltin && '(Optional)'}
                    </Text>
                    <Input
                      placeholder={providerMeta?.defaultBaseUrl || 'https://api.example.com/v1'}
                      value={currentConfig.baseUrl || ''}
                      onChange={(e) => handleBaseUrlChange(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                    />
                    {isBuiltin && (
                      <Text className="!text-gray-400 text-xs block mt-2">
                        Leave empty to use the default {currentConfig.name} API endpoint
                      </Text>
                    )}
                  </div>

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
                    {isBuiltin && providerMeta && (
                      <div className="mt-2">
                        <Link
                          href={providerMeta.getKeyUrl}
                          target="_blank"
                          className="text-blue-400 text-xs"
                        >
                          Get your API key from {currentConfig.name} →
                        </Link>
                      </div>
                    )}
                  </div>

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
                          <div className="max-h-60 overflow-y-auto">
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
                        <div className="text-center py-8 text-gray-400">
                          <div className="text-3xl mb-2">📭</div>
                          <div className="font-medium mb-1">No models available</div>
                          <div className="text-sm">
                            Use Fetch to load from API or add manually below
                          </div>
                        </div>
                      )}

                      {/* Add model manually */}
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <Text className="!text-gray-400 text-xs block mb-2">
                          Add models manually or use Fetch to load from API
                        </Text>
                        <AddModelInline onAdd={handleAddModel} />
                      </div>
                    </div>
                  )}
                </>
              )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1 text-gray-400">
              Select a provider to configure
            </div>
          )}
        </div>
      </div>

      {/* Add Custom Provider Modal */}
      <AddCustomProviderModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddCustomProvider}
      />
    </div>
  );
};
