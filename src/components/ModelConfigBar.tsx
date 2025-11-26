import React, { useState, useEffect } from 'react';
import { Select, Button, Input, App } from 'antd';
import { EditOutlined, CheckOutlined, CloseOutlined, LinkOutlined } from '@ant-design/icons';
import type { UserModelConfigs } from '@/types';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

// Provider options
const PROVIDERS = [
  { value: 'deepseek', label: 'Deepseek', getKeyUrl: 'https://platform.deepseek.com/api_keys' },
  { value: 'qwen', label: 'Qwen (Alibaba)', getKeyUrl: 'https://bailian.console.aliyun.com/' },
  { value: 'google', label: 'Google Gemini', getKeyUrl: 'https://aistudio.google.com/app/apikey' },
  { value: 'anthropic', label: 'Anthropic', getKeyUrl: 'https://console.anthropic.com/settings/keys' },
  { value: 'openrouter', label: 'OpenRouter', getKeyUrl: 'https://openrouter.ai/keys' },
];

// Model options for each provider
const MODELS: Record<string, string[]> = {
  deepseek: [
    'deepseek-chat',
    'deepseek-reasoner',
  ],
  google: [
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash-thinking-exp-01-21',
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash-002',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro-latest',
    'gemini-1.5-pro-002',
    'gemini-exp-1206',
  ],
  openrouter: [
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3-haiku',
    'deepseek/deepseek-coder',
    'google/gemini-flash-1.5',
    'google/gemini-pro-1.5',
    'x-ai/grok-beta',
    'mistralai/mistral-nemo',
    'qwen/qwen-110b-chat',
    'cohere/command',
  ],
  anthropic: [
    'claude-3-7-sonnet-20250219',
    'claude-3-5-sonnet-latest',
    'claude-3-5-sonnet-20240620',
    'claude-3-5-haiku-latest',
    'claude-3-opus-latest',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ],
  qwen: [
    'qwen-max',
    'qwen-plus',
    'qwen-vl-max',
  ],
};

type ProviderType = 'deepseek' | 'qwen' | 'google' | 'anthropic' | 'openrouter';

export const ModelConfigBar: React.FC = () => {
  const { t } = useTranslation('modelConfig');
  const message = App.useApp().message;

  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('deepseek');
  const [selectedModel, setSelectedModel] = useState<string>('deepseek-chat');
  const [apiKeySource, setApiKeySource] = useState<'user' | 'env' | 'none'>('none');
  const [configs, setConfigs] = useState<UserModelConfigs>({});
  const [isEditingApiKey, setIsEditingApiKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  // Load initial configurations
  useEffect(() => {
    loadConfigs();
  }, []);

  // Update model when provider changes
  useEffect(() => {
    const models = MODELS[selectedProvider];
    if (models && models.length > 0) {
      const currentModel = configs[selectedProvider]?.model || models[0];
      setSelectedModel(currentModel);
    }
  }, [selectedProvider, configs]);

  const loadConfigs = async () => {
    const configsResponse = await window.api.getUserModelConfigs();
    const providerResponse = await window.api.getSelectedProvider();

    if (configsResponse?.success && configsResponse.data?.configs) {
      setConfigs(configsResponse.data.configs);
    }

    const provider = providerResponse?.success && providerResponse.data?.provider
      ? providerResponse.data.provider
      : 'deepseek';
    setSelectedProvider(provider);

    const sourceResponse = await window.api.getApiKeySource(provider);
    if (sourceResponse?.success && sourceResponse.data?.source) {
      setApiKeySource(sourceResponse.data.source);
    }
  };

  const handleProviderChange = async (value: ProviderType) => {
    setSelectedProvider(value);
    await window.api.setSelectedProvider(value);
    const sourceResponse = await window.api.getApiKeySource(value);
    if (sourceResponse?.success && sourceResponse.data?.source) {
      setApiKeySource(sourceResponse.data.source);
    }
  };

  const handleModelChange = async (value: string) => {
    setSelectedModel(value);
    const updatedConfigs = {
      ...configs,
      [selectedProvider]: {
        ...configs[selectedProvider],
        model: value,
      },
    };
    const response = await window.api.saveUserModelConfigs(updatedConfigs);
    if (response?.success) {
      setConfigs(updatedConfigs);
      message.success(t('model_updated'));
    } else {
      message.error(t('model_update_failed'));
    }
  };

  const handleEditApiKey = () => {
    setIsEditingApiKey(true);
    setTempApiKey(configs[selectedProvider]?.apiKey || '');
  };

  const handleCancelEdit = () => {
    setIsEditingApiKey(false);
    setTempApiKey('');
  };

  const handleSaveApiKey = async () => {
    if (!tempApiKey || tempApiKey.trim() === '') {
      message.warning(t('api_key_empty_warning'));
      return;
    }

    const updatedConfigs = {
      ...configs,
      [selectedProvider]: {
        ...configs[selectedProvider],
        apiKey: tempApiKey.trim(),
      },
    };
    const response = await window.api.saveUserModelConfigs(updatedConfigs);
    if (response?.success) {
      setConfigs(updatedConfigs);
      setIsEditingApiKey(false);
      setApiKeySource('user');
      message.success(t('api_key_saved'));
    } else {
      message.error(t('api_key_save_failed'));
    }
  };

  const currentProvider = PROVIDERS.find(p => p.value === selectedProvider);

  return (
    <div className="w-full px-4 pt-3 pb-3 border-[rgba(255,255,255,0.1)]">
      {/* Provider and Model Selection */}
      <div className="flex gap-3 mb-3">
        <Select
          value={selectedProvider}
          onChange={handleProviderChange}
          className="flex-1 custom-select min-w-[160px]"
          size="middle"
        >
          {PROVIDERS.map(p => (
            <Option key={p.value} value={p.value}>{p.label}</Option>
          ))}
        </Select>

        <Select
          value={selectedModel}
          onChange={handleModelChange}
          className="flex-1 custom-select min-w-[200px]"
          size="middle"
        >
          {MODELS[selectedProvider]?.map(model => (
            <Option key={model} value={model}>{model}</Option>
          ))}
        </Select>
      </div>

      {/* API Key Section */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-gray-400 whitespace-nowrap">
            {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API Key:
          </span>

          {apiKeySource === 'env' && !isEditingApiKey && (
            <span className="flex items-center gap-1 text-green-400">
              <CheckOutlined />
              {t('api_key_env')}
            </span>
          )}

          {apiKeySource === 'user' && !isEditingApiKey && (
            <span className="flex items-center gap-1 text-blue-400">
              <CheckOutlined />
              {t('api_key_user')}
            </span>
          )}

          {apiKeySource === 'none' && !isEditingApiKey && (
            <span className="text-yellow-400">{t('api_key_not_configured')}</span>
          )}

          {isEditingApiKey && (
            <Input
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder={t('api_key_placeholder')}
              className="flex-1 max-w-sm"
              size="small"
              onPressEnter={handleSaveApiKey}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isEditingApiKey ? (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={handleEditApiKey}
                size="small"
                type="text"
                className="text-gray-300 hover:text-white"
              >
                {t('edit_api_key')}
              </Button>
              <a
                href={currentProvider?.getKeyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 whitespace-nowrap"
              >
                <LinkOutlined />
                {t('get_api_key')}
              </a>
            </>
          ) : (
            <>
              <CheckOutlined
                onClick={handleSaveApiKey}
                className="!text-green-400 hover:!text-green-300 cursor-pointer text-xs"
              />
              <CloseOutlined
                onClick={handleCancelEdit}
                className="!text-red-400 hover:!text-red-300 cursor-pointer text-xs"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
