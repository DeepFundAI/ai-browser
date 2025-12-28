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
    toolModel: '',
    language: 'en',
    startup: {
      autoStart: false,
      startMinimized: false
    },
    window: {
      minimizeToTray: true,
      closeToTray: false
    }
  };
}

/**
 * Default chat settings
 */
export function getDefaultChatSettings(): ChatSettings {
  return {
    temperature: 0.7,
    maxTokens: 2048,
    streaming: true,
    showTokenUsage: false,
    markdownRendering: true,
    soundEffects: false,
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
      showLineNumbers: false,
      wordWrap: true,
      showMinimap: false
    }
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
      customTools: []
    },
    ui: getDefaultUISettings()
  };
}
