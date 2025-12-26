/**
 * Configuration converter utilities for backward compatibility
 * Converts between legacy and new config formats
 */

import {
  ProviderType,
  ProviderConfig,
  LegacyUserModelConfigs,
  LegacyProviderConfig,
  PROVIDER_INFO,
  ModelInfo
} from '@/models/settings';

export type SettingsConfigs = Record<ProviderType, ProviderConfig>;

/**
 * Convert legacy config format to new config format
 * Ensures backward compatibility with existing stored configurations
 */
export function convertLegacyToNewConfig(legacy: LegacyUserModelConfigs): SettingsConfigs {
  const newConfigs: Partial<SettingsConfigs> = {};

  // Convert each provider's config
  Object.keys(PROVIDER_INFO).forEach((providerId) => {
    const id = providerId as ProviderType;
    const legacyConfig: LegacyProviderConfig | undefined = legacy[id];

    newConfigs[id] = {
      id,
      enabled: legacyConfig?.enabled ?? false,
      apiKey: legacyConfig?.apiKey ?? '',
      baseUrl: legacyConfig?.baseURL ?? '',
      models: (legacyConfig?.models as ModelInfo[]) ?? [],
      selectedModel: legacyConfig?.model,
      lastFetched: legacyConfig?.lastFetched
    };
  });

  return newConfigs as SettingsConfigs;
}

/**
 * Convert new config format back to legacy format for storage
 * Maintains compatibility with existing backend APIs
 */
export function convertNewToLegacyConfig(newConfigs: SettingsConfigs): LegacyUserModelConfigs {
  const legacy: LegacyUserModelConfigs = {};

  Object.entries(newConfigs).forEach(([providerId, config]) => {
    const id = providerId as ProviderType;

    // Skip providers with no meaningful configuration
    // Don't save if only enabled=false or all fields are empty
    const hasConfig = config.apiKey || config.baseUrl || config.models.length > 0 ||
                      config.selectedModel || config.lastFetched || config.enabled === true;

    if (!hasConfig) {
      return; // Skip empty configs
    }

    const legacyConfig: LegacyProviderConfig = {};

    // Only add fields with actual values
    if (config.apiKey) legacyConfig.apiKey = config.apiKey;
    if (config.baseUrl) legacyConfig.baseURL = config.baseUrl;
    if (config.selectedModel) legacyConfig.model = config.selectedModel;
    if (config.enabled) legacyConfig.enabled = config.enabled;
    if (config.models.length > 0) legacyConfig.models = config.models;
    if (config.lastFetched) legacyConfig.lastFetched = config.lastFetched;

    legacy[id] = legacyConfig;
  });

  return legacy;
}
