/**
 * Default values for settings
 * INPUT: None
 * OUTPUT: Default configuration objects
 * POSITION: Provides default values for all settings types
 */

import {
  GeneralSettings,
  ChatSettings,
  UISettings,
  NetworkSettings,
  AppSettings,
  ProviderConfig,
  BUILTIN_PROVIDER_IDS,
  createBuiltinProviderConfig
} from '@/models/settings';

/**
 * Default general settings
 */
export function getDefaultGeneralSettings(): GeneralSettings {
  return {
    language: 'en',
    startup: {
      autoStart: false,
      startMinimized: false
    },
    window: {
      minimizeToTray: true,
      closeToTray: true
    }
  };
}

/**
 * Default chat settings
 */
export function getDefaultChatSettings(): ChatSettings {
  return {
    temperature: 0.7,
    maxTokens: 8192,
    showTokenUsage: false,
    autoSaveHistory: true,
    historyRetentionDays: 30
  };
}

/**
 * Default UI settings
 */
export function getDefaultUISettings(): UISettings {
  return {
    theme: 'dark',
    fontSize: 14,
    density: 'comfortable',
    editor: {
      showLineNumbers: true,
      wordWrap: true
    }
  };
}

/**
 * Default network settings
 */
export function getDefaultNetworkSettings(): NetworkSettings {
  return {
    proxy: {
      enabled: false,
      type: 'http',
      server: '',
      port: 8080,
      username: '',
      password: ''
    },
    requestTimeout: 30,
    retryAttempts: 3,
    customUserAgent: ''
  };
}

/**
 * Default app settings (all settings combined)
 */
export function getDefaultSettings(): AppSettings {
  const providers: Record<string, ProviderConfig> = {};
  BUILTIN_PROVIDER_IDS.forEach(id => {
    providers[id] = createBuiltinProviderConfig(id);
  });

  return {
    providers,
    general: getDefaultGeneralSettings(),
    chat: getDefaultChatSettings(),
    agent: {
      systemPrompt: '',
      enabledTools: [],
      customTools: [],
      mcpTools: {},
      browserAgent: {
        enabled: true,
        customPrompt: ''
      },
      fileAgent: {
        enabled: true,
        customPrompt: ''
      }
    },
    ui: getDefaultUISettings(),
    network: getDefaultNetworkSettings()
  };
}
