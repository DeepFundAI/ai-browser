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
import { Typography, Input, Switch, Tag, App, Popconfirm } from 'antd';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { SelectableCard, ActionButton } from '@/components/ui';
import {
  ProviderConfig,
  ModelInfo,
  BUILTIN_PROVIDER_META,
  BUILTIN_PROVIDER_IDS,
  BuiltinProviderId,
  createCustomProviderConfig
} from '@/models/settings';
import { useFetchModels } from '@/hooks/useFetchModels';
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
    <SelectableCard
      selected={isSelected}
      onClick={onClick}
      hoverScale={false}
      className="w-full mb-2 px-4 py-3"
    >
      <div className="flex items-center gap-3 text-left">
        {isCustom ? (
          <ApiOutlined className="text-lg text-purple-400" />
        ) : (
          <CloudOutlined className="text-lg text-text-12 dark:text-text-12-dark" />
        )}
        <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
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
      </div>
    </SelectableCard>
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
    <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-200 dark:hover:border-white/10 transition-all duration-200 mb-2">
      <div className="flex-1">
        <div className="text-text-01 dark:text-text-01-dark font-medium text-sm">{model.name}</div>
        <div className="text-text-12 dark:text-text-12-dark text-xs mt-0.5">{model.id}</div>
      </div>
      <Switch
        checked={model.enabled}
        onChange={onToggle}
        size="small"
        className="cursor-pointer"
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
  const { t } = useTranslation('settings');
  const { message } = App.useApp();
  const [modelId, setModelId] = useState('');
  const [modelName, setModelName] = useState('');

  const handleAdd = () => {
    if (!modelId.trim()) {
      message.warning(t('providers.model_id_required'));
      return;
    }
    onAdd(modelId.trim(), modelName.trim() || modelId.trim());
    setModelId('');
    setModelName('');
  };

  return (
    <div className="flex items-center gap-2 mt-3">
      <Input
        placeholder={t('providers.model_id_placeholder')}
        value={modelId}
        onChange={(e) => setModelId(e.target.value)}
        className="flex-1 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-text-01 dark:text-text-01-darkplaceholder-gray-400 dark:placeholder-gray-400"
        size="small"
      />
      <Input
        placeholder={t('providers.model_name_placeholder')}
        value={modelName}
        onChange={(e) => setModelName(e.target.value)}
        className="flex-1 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-text-01 dark:text-text-01-darkplaceholder-gray-400 dark:placeholder-gray-400"
        size="small"
      />
      <ActionButton
        variant="secondary"
        icon={<PlusOutlined />}
        onClick={handleAdd}
        size="small"
      >
        {t('providers.add_model')}
      </ActionButton>
    </div>
  );
};

interface ProvidersPanelProps {
  configs: Record<string, ProviderConfig>;
  onConfigsChange: (newConfigs: Record<string, ProviderConfig> | ((prev: Record<string, ProviderConfig>) => Record<string, ProviderConfig>)) => void;
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
  const { t } = useTranslation('settings');
  const { message } = App.useApp();
  const [selectedProviderId, setSelectedProviderId] = useState<string>('deepseek');
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
      message.error(t('providers.api_key'));
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
        message.warning(t('providers.fetch_not_supported', { name: currentConfig.name }));
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
        message.success(t('providers.fetch_success', { count: fetchedModels.length }));
      } else {
        message.warning(t('providers.no_models'));
      }
    } catch (error: any) {
      console.error('Failed to fetch models:', error);
      message.error(error.message || t('providers.fetch_failed'));
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
      message.warning(t('providers.model_exists'));
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
    message.success(t('providers.model_added'));
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
    message.success(t('providers.provider_added'));
  };

  const hasApiKey = Boolean(currentConfig?.apiKey);
  const isActive = currentConfig?.enabled;

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <CloudOutlined className="text-3xl text-primary dark:text-purple-400" />
          <Title level={2} className="!text-text-01 dark:!text-text-01-dark !mb-0">
            {t('providers.title')}
          </Title>
        </div>
        <ActionButton
          variant="primary"
          icon={<PlusOutlined />}
          onClick={() => setShowAddModal(true)}
        >
          {t('providers.add_custom_provider')}
        </ActionButton>
      </div>

      {/* Main content: Provider list + Details */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left: Provider list */}
        <div className="w-64 overflow-y-auto pr-2 flex-shrink-0">
          {providerList.map((provider) => (
            <ProviderListItem
              key={provider.id}
              provider={provider}
              isSelected={selectedProviderId === provider.id}
              onClick={() => setSelectedProviderId(provider.id)}
            />
          ))}
        </div>

        {/* Right: Provider details */}
        <div className="flex-1 bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col min-w-0">
          {currentConfig ? (
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
              {/* Provider header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Text className="!text-text-01 dark:!text-text-01-dark text-xl font-semibold">
                      {currentConfig.name}
                    </Text>
                    {!isBuiltin && (
                      <Tag color="purple" className="!border-purple-500/30">
                        {t('providers.custom_provider').toUpperCase()}
                      </Tag>
                    )}
                    {isActive && (
                      <Tag color="green" className="!border-green-500/30">
                        {t('providers.active')}
                      </Tag>
                    )}
                    {!isActive && hasApiKey && (
                      <Tag color="default" className="!border-gray-500/30">
                        {t('providers.inactive')}
                      </Tag>
                    )}
                  </div>
                  {isBuiltin && providerMeta && (
                    <Paragraph className="!text-text-12 dark:text-text-12-dark !mb-0">
                      {providerMeta.description}
                    </Paragraph>
                  )}
                  {!isBuiltin && (
                    <Paragraph className="!text-text-12 dark:text-text-12-dark !mb-0 text-sm">
                      {currentConfig.baseUrl}
                    </Paragraph>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!isBuiltin && (
                    <Popconfirm
                      title={t('providers.delete_provider')}
                      description={t('providers.delete_provider_confirm')}
                      onConfirm={handleDeleteProvider}
                      okText={t('providers.delete')}
                      cancelText={t('providers.cancel')}
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        className="!text-red-400 hover:!text-red-300 hover:!bg-red-500/10 cursor-pointer transition-all duration-200"
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
                  <ActionButton
                    variant="primary"
                    size="large"
                    onClick={handleEnableProvider}
                  >
                    {t('providers.enable_provider')}
                  </ActionButton>
                </div>
              )}

              {/* State 2 & 3: Enabled - Show configuration */}
              {(hasApiKey || isActive) && (
                <>
                  {/* Provider Name (Custom only) */}
                  {!isBuiltin && (
                    <div>
                      <Text className="!text-text-01 dark:!text-text-01-dark font-medium block mb-2">
                        {t('providers.provider_name')}
                      </Text>
                      <Input
                        placeholder={t('providers.provider_name_placeholder')}
                        value={currentConfig.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-text-01 dark:text-text-01-darkplaceholder-gray-400 dark:placeholder-gray-400"
                      />
                    </div>
                  )}

                  {/* Base URL */}
                  <div>
                    <Text className="!text-text-01 dark:!text-text-01-dark font-medium block mb-2">
                      {t('providers.base_url')} {isBuiltin && t('providers.base_url_optional')}
                    </Text>
                    <Input
                      placeholder={providerMeta?.defaultBaseUrl || t('providers.base_url_placeholder')}
                      value={currentConfig.baseUrl || ''}
                      onChange={(e) => handleBaseUrlChange(e.target.value)}
                      className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-text-01 dark:text-text-01-darkplaceholder-gray-400 dark:placeholder-gray-400"
                    />
                    {isBuiltin && (
                      <Text className="!text-text-12 dark:text-text-12-dark text-xs block mt-2">
                        {t('providers.base_url_hint', { name: currentConfig.name })}
                      </Text>
                    )}
                  </div>

                  {/* API Key */}
                  <div>
                    <Text className="!text-text-01 dark:!text-text-01-dark font-medium block mb-2">
                      {t('providers.api_key')}
                    </Text>
                    <div className="relative">
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder={t('providers.api_key_placeholder')}
                        value={currentConfig.apiKey}
                        onChange={(e) => handleApiKeyChange(e.target.value)}
                        className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-text-01 dark:text-text-01-darkplaceholder-gray-400 dark:placeholder-gray-400 pr-10"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-12 dark:text-text-12-dark hover:text-primary dark:hover:text-purple-400 cursor-pointer transition-colors duration-200"
                      >
                        {showApiKey ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      </button>
                    </div>
                    {isBuiltin && providerMeta && (
                      <div className="mt-2">
                        <Link
                          href={providerMeta.getKeyUrl}
                          target="_blank"
                          className="!text-primary dark:!text-purple-400 hover:!text-primary-hover dark:hover:!text-purple-300 text-xs transition-colors duration-200"
                        >
                          {t('providers.get_api_key', { name: currentConfig.name })}
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Models section */}
                  {hasApiKey && (
                    <div className="pt-4 border-t border-gray-200 dark:border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <Text className="!text-text-01 dark:!text-text-01-dark font-medium text-lg">
                          {t('providers.models_title')}
                        </Text>
                        <ActionButton
                          variant="secondary"
                          icon={<DownloadOutlined />}
                          onClick={handleFetchModels}
                          loading={isFetchingModels}
                        >
                          {t('providers.fetch')}
                        </ActionButton>
                      </div>

                      {/* Model search */}
                      <Input
                        placeholder={t('providers.search_models')}
                        prefix={<SearchOutlined className="text-text-12 dark:text-text-12-dark" />}
                        value={modelSearchQuery}
                        onChange={(e) => setModelSearchQuery(e.target.value)}
                        className="mb-4 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-text-01 dark:text-text-01-darkplaceholder-gray-400 dark:placeholder-gray-400 !w-36"
                      />

                      {/* Model list */}
                      {sortedModels.length > 0 ? (
                        <>
                          <Text className="!text-text-12 dark:text-text-12-dark text-xs block mb-3">
                            {t('providers.models_showing', { enabled: enabledModelCount, total: totalModelCount })}
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
                        <div className="text-center py-8 text-text-12 dark:text-text-12-dark">
                          <div className="text-3xl mb-2">📭</div>
                          <div className="font-medium mb-1">{t('providers.no_models_available')}</div>
                          <div className="text-sm">
                            {t('providers.no_models_hint')}
                          </div>
                        </div>
                      )}

                      {/* Add model manually */}
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                        <Text className="!text-text-12 dark:text-text-12-dark text-xs block mb-2">
                          {t('providers.add_model_manually')}
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
            <div className="flex items-center justify-center flex-1 text-text-12 dark:text-text-12-dark">
              {t('providers.select_provider')}
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
