/**
 * Configuration converter utilities for backward compatibility
 * INPUT: Legacy/new config formats
 * OUTPUT: Converted config objects
 * POSITION: Bridge between frontend state and Electron Store
 */

import {
  ProviderConfig,
  LegacyProviderConfig,
  ModelInfo,
  GeneralSettings,
  ChatSettings,
  getDefaultGeneralSettings,
  getDefaultChatSettings,
  BUILTIN_PROVIDER_IDS,
  BUILTIN_PROVIDER_META,
  BuiltinProviderId,
  createBuiltinProviderConfig
} from '@/models/settings';

// All providers stored as Record<string, ProviderConfig>
export type ProviderConfigs = Record<string, ProviderConfig>;

export interface SettingsConfigs {
  providers: ProviderConfigs;
  general: GeneralSettings;
  chat: ChatSettings;
}

// Legacy storage format (for backward compatibility)
export interface LegacyStorageFormat {
  [key: string]: LegacyProviderConfig | GeneralSettings | ChatSettings | string | undefined;
  generalSettings?: GeneralSettings;
  chatSettings?: ChatSettings;
  selectedProvider?: string;
}

/**
 * Check if a provider ID is a builtin provider
 */
function isBuiltinProvider(id: string): id is BuiltinProviderId {
  return BUILTIN_PROVIDER_IDS.includes(id as BuiltinProviderId);
}

/**
 * Convert legacy config format to new config format
 * Ensures backward compatibility with existing stored configurations
 */
export function convertLegacyToNewConfig(legacy: LegacyStorageFormat): SettingsConfigs {
  const providers: ProviderConfigs = {};

  // Initialize all builtin providers with defaults
  BUILTIN_PROVIDER_IDS.forEach(id => {
    providers[id] = createBuiltinProviderConfig(id);
  });

  // Process legacy config entries
  Object.entries(legacy).forEach(([key, value]) => {
    // Skip non-provider fields
    if (key === 'selectedProvider' || key === 'generalSettings' || key === 'chatSettings') {
      return;
    }

    const legacyConfig = value as LegacyProviderConfig | undefined;
    if (!legacyConfig || typeof legacyConfig !== 'object') {
      return;
    }

    if (isBuiltinProvider(key)) {
      // Update builtin provider config
      const meta = BUILTIN_PROVIDER_META[key];
      providers[key] = {
        id: key,
        name: legacyConfig.name || meta.name,
        type: 'builtin',
        enabled: legacyConfig.enabled ?? false,
        apiKey: legacyConfig.apiKey ?? '',
        baseUrl: legacyConfig.baseURL || meta.defaultBaseUrl,
        models: (legacyConfig.models as ModelInfo[]) ?? [],
        selectedModel: legacyConfig.model,
        lastFetched: legacyConfig.lastFetched
      };
    } else {
      // Custom provider
      providers[key] = {
        id: key,
        name: legacyConfig.name || key,
        type: 'custom',
        enabled: legacyConfig.enabled ?? true,
        apiKey: legacyConfig.apiKey ?? '',
        baseUrl: legacyConfig.baseURL ?? '',
        models: (legacyConfig.models as ModelInfo[]) ?? [],
        selectedModel: legacyConfig.model,
        lastFetched: legacyConfig.lastFetched
      };
    }
  });

  return {
    providers,
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
    // Skip providers with no meaningful configuration
    const hasConfig = config.apiKey || config.models.length > 0 ||
                      config.selectedModel || config.lastFetched || config.enabled === true;

    if (!hasConfig && config.type === 'builtin') {
      return;
    }

    const legacyConfig: LegacyProviderConfig = {
      name: config.name,
      type: config.type
    };

    if (config.apiKey) legacyConfig.apiKey = config.apiKey;
    if (config.baseUrl) legacyConfig.baseURL = config.baseUrl;
    if (config.selectedModel) legacyConfig.model = config.selectedModel;
    if (config.enabled) legacyConfig.enabled = config.enabled;
    if (config.models.length > 0) legacyConfig.models = config.models;
    if (config.lastFetched) legacyConfig.lastFetched = config.lastFetched;

    legacy[providerId] = legacyConfig;
  });

  // Add general and chat settings
  legacy.generalSettings = newConfigs.general;
  legacy.chatSettings = newConfigs.chat;

  return legacy;
}
