/**
 * Configuration converter utilities for backward compatibility
 * INPUT: Legacy/new config formats
 * OUTPUT: Converted config objects
 * POSITION: Bridge between frontend state and Electron Store
 */

import {
  ProviderType,
  ProviderConfig,
  LegacyUserModelConfigs,
  LegacyProviderConfig,
  PROVIDER_INFO,
  ModelInfo,
  GeneralSettings,
  ChatSettings,
  getDefaultGeneralSettings,
  getDefaultChatSettings
} from '@/models/settings';

export type ProviderConfigs = Record<ProviderType, ProviderConfig>;

export interface SettingsConfigs {
  providers: ProviderConfigs;
  general: GeneralSettings;
  chat: ChatSettings;
}

// Legacy storage format (for backward compatibility)
export interface LegacyStorageFormat extends LegacyUserModelConfigs {
  generalSettings?: GeneralSettings;
  chatSettings?: ChatSettings;
}

/**
 * Convert legacy config format to new config format
 * Ensures backward compatibility with existing stored configurations
 */
export function convertLegacyToNewConfig(legacy: LegacyStorageFormat): SettingsConfigs {
  const providerConfigs: Partial<ProviderConfigs> = {};

  // Convert each provider's config
  Object.keys(PROVIDER_INFO).forEach((providerId) => {
    const id = providerId as ProviderType;
    const legacyConfig: LegacyProviderConfig | undefined = legacy[id];

    providerConfigs[id] = {
      id,
      enabled: legacyConfig?.enabled ?? false,
      apiKey: legacyConfig?.apiKey ?? '',
      baseUrl: legacyConfig?.baseURL ?? '',
      models: (legacyConfig?.models as ModelInfo[]) ?? [],
      selectedModel: legacyConfig?.model,
      lastFetched: legacyConfig?.lastFetched
    };
  });

  return {
    providers: providerConfigs as ProviderConfigs,
    general: legacy.generalSettings ?? getDefaultGeneralSettings(),
    chat: legacy.chatSettings ?? getDefaultChatSettings()
  };
}

/**
 * Convert new config format back to legacy format for storage
 * Maintains compatibility with existing backend APIs
 */
export function convertNewToLegacyConfig(newConfigs: SettingsConfigs): LegacyStorageFormat {
  const legacy: LegacyStorageFormat = {};

  // Convert provider configs
  Object.entries(newConfigs.providers).forEach(([providerId, config]) => {
    const id = providerId as ProviderType;

    // Skip providers with no meaningful configuration
    const hasConfig = config.apiKey || config.baseUrl || config.models.length > 0 ||
                      config.selectedModel || config.lastFetched || config.enabled === true;

    if (!hasConfig) {
      return;
    }

    const legacyConfig: LegacyProviderConfig = {};

    if (config.apiKey) legacyConfig.apiKey = config.apiKey;
    if (config.baseUrl) legacyConfig.baseURL = config.baseUrl;
    if (config.selectedModel) legacyConfig.model = config.selectedModel;
    if (config.enabled) legacyConfig.enabled = config.enabled;
    if (config.models.length > 0) legacyConfig.models = config.models;
    if (config.lastFetched) legacyConfig.lastFetched = config.lastFetched;

    legacy[id] = legacyConfig;
  });

  // Add general and chat settings
  legacy.generalSettings = newConfigs.general;
  legacy.chatSettings = newConfigs.chat;

  return legacy;
}
