/**
 * Simple model selector component
 * INPUT: AppSettings from config panel
 * OUTPUT: Selected model for chat
 * POSITION: Home page model selection (bottom-left)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Select, Button, App } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import type { AppSettings } from '@/models/settings';
import { useSettingsStore } from '@/stores/settingsStore';
import { logger } from '@/utils/logger';

const { Option, OptGroup } = Select;

interface ModelOption {
  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string;
  maxTokens?: number;
}

/**
 * Get max tokens limit for a specific model
 */
const getMaxTokensForModel = (modelId: string): number => {
  const tokenLimits: Record<string, number> = {
    'deepseek-chat': 8192,
    'deepseek-reasoner': 65536,
    'gemini-2.0-flash-thinking-exp-01-21': 65536,
    'gemini-1.5-flash-latest': 8192,
    'gemini-2.0-flash-exp': 8192,
    'claude-3-7-sonnet-20250219': 128000,
    'claude-3-5-sonnet-latest': 8000,
    'qwen-max': 8192,
  };
  return tokenLimits[modelId] || 8192;
};

export const ModelSelector: React.FC = () => {
  const { message } = App.useApp();
  const { settings: appSettings, saveSettings } = useSettingsStore();
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);

  // Update selected model when settings change
  useEffect(() => {
    if (appSettings?.providers) {
      const enabledProvider = Object.values(appSettings.providers).find(
        (p) => p.enabled && p.apiKey && p.selectedModel && p.models?.length > 0
      );
      if (enabledProvider) {
        setSelectedModel(`${enabledProvider.id}:${enabledProvider.selectedModel}`);
      }
    }
  }, [appSettings]);

  // Build model options grouped by provider
  const modelOptions = useMemo((): ModelOption[] => {
    if (!appSettings) return [];

    const options: ModelOption[] = [];

    Object.values(appSettings.providers).forEach((provider) => {
      // Only show enabled providers with API key and models
      if (!provider.enabled || !provider.apiKey?.trim() || !provider.models?.length) {
        return;
      }

      // Filter enabled models
      provider.models
        .filter((m) => m.enabled)
        .forEach((model) => {
          options.push({
            providerId: provider.id,
            providerName: provider.name,
            modelId: model.id,
            modelName: model.name || model.id,
            maxTokens: getMaxTokensForModel(model.id)
          });
        });
    });

    return options;
  }, [appSettings]);

  // Group options by provider
  const groupedOptions = useMemo(() => {
    const groups: Record<string, ModelOption[]> = {};
    modelOptions.forEach(option => {
      if (!groups[option.providerId]) {
        groups[option.providerId] = [];
      }
      groups[option.providerId].push(option);
    });
    return groups;
  }, [modelOptions]);

  const handleModelChange = async (value: string) => {
    if (!appSettings) return;

    setSelectedModel(value);

    // Parse providerId:modelId
    const [providerId, modelId] = value.split(':');

    try {
      const updatedProviders = { ...appSettings.providers };

      // Clear selectedModel from all providers
      Object.values(updatedProviders).forEach((p) => {
        p.selectedModel = undefined;
      });

      // Set selected model for the chosen provider
      if (updatedProviders[providerId]) {
        updatedProviders[providerId].selectedModel = modelId;
      }

      const updatedSettings: AppSettings = {
        ...appSettings,
        providers: updatedProviders
      };

      await saveSettings(updatedSettings);
      message.success(`Switched to ${modelId}`);
    } catch (error) {
      message.error(`Failed to switch model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleOpenSettings = useCallback(async () => {
    if (typeof window !== 'undefined' && (window as any).api?.invoke) {
      // Open settings window and navigate to Providers panel
      await (window as any).api.invoke('settings:open', 'providers');
    }
  }, []);

  // Empty state - show configure button
  if (modelOptions.length === 0) {
    return (
      <div className="group flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-blue-400/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
        <SettingOutlined className="text-gray-400 group-hover:text-blue-400 text-base transition-colors duration-300" />
        <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300">No models</span>
        <Button
          type="link"
          size="small"
          icon={<SettingOutlined />}
          onClick={handleOpenSettings}
          className="!text-blue-400 hover:!text-blue-300 !p-0 !h-auto !text-xs transition-colors duration-300"
        >
          Configure
        </Button>
      </div>
    );
  }

  // Normal state - show compact selector with border
  return (
    <div className="group flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-purple-400/40 hover:shadow-[0_0_20px_rgba(145,75,241,0.2)] transition-all duration-300">
      <SettingOutlined className="text-gray-400 group-hover:text-purple-400 text-base flex-shrink-0 transition-colors duration-300" />
      <Select
        value={selectedModel}
        onChange={handleModelChange}
        className="custom-select-compact"
        size="small"
        showSearch
        placeholder="Select model"
        variant="borderless"
        suffixIcon={null}
        style={{ minWidth: 180, maxWidth: 280 }}
        filterOption={(input, option) => {
          const label = option?.children?.toString().toLowerCase() || '';
          return label.includes(input.toLowerCase());
        }}
        popupMatchSelectWidth={false}
      >
        {Object.entries(groupedOptions).map(([providerId, models]) => (
          <OptGroup key={providerId} label={models[0].providerName}>
            {models.map(model => (
              <Option
                key={`${model.providerId}:${model.modelId}`}
                value={`${model.providerId}:${model.modelId}`}
              >
                <div className="flex items-center justify-between">
                  <span>{model.modelName}</span>
                  {model.maxTokens && (
                    <span className="text-xs text-gray-400 ml-2">
                      {model.maxTokens >= 1000 ? `${model.maxTokens / 1000}K` : model.maxTokens}
                    </span>
                  )}
                </div>
              </Option>
            ))}
          </OptGroup>
        ))}
      </Select>
    </div>
  );
};
