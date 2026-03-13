/**
 * Unified application settings manager
 * INPUT: Electron store for persistence
 * OUTPUT: Centralized settings with single data source
 * POSITION: Singleton for all app settings
 */

import { store } from './store';
import type { AppSettings, GeneralSettings, ChatSettings, AgentConfig, ProviderConfig } from '../models';
import { BUILTIN_PROVIDER_IDS, createBuiltinProviderConfig } from '../models/settings';

/**
 * Default application settings
 */
const getDefaultAppSettings = (): AppSettings => {
  // Initialize all builtin providers
  const providers: Record<string, ProviderConfig> = {};
  BUILTIN_PROVIDER_IDS.forEach(providerId => {
    providers[providerId] = createBuiltinProviderConfig(providerId);
  });

  return {
    providers,
    general: {
      language: 'en',
      startup: {
        autoStart: false,
        startMinimized: false
      },
      window: {
        minimizeToTray: true,
        closeToTray: true
      }
    },
    chat: {
      temperature: 0.7,
      maxTokens: 8192,
      showTokenUsage: false,
      autoSaveHistory: true,
      historyRetentionDays: 30
    },
    agent: {
      browserAgent: {
        enabled: true,
        customPrompt: '',
        mcpServices: {}
      },
      fileAgent: {
        enabled: true,
        customPrompt: '',
        mcpServices: {}
      }
    },
    mcp: {
      services: []
    },
    ui: {
      theme: 'dark',
      fontSize: 14,
      density: 'comfortable',
      editor: {
        showLineNumbers: true,
        wordWrap: true
      }
    },
    network: {
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
    }
  };
};

/**
 * Singleton settings manager
 */
export class SettingsManager {
  private static instance: SettingsManager;
  private readonly SETTINGS_KEY = 'appSettings';

  private constructor() {}

  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  /**
   * Get complete app settings
   */
  public getAppSettings(): AppSettings {
    return store.get(this.SETTINGS_KEY, getDefaultAppSettings()) as AppSettings;
  }

  /**
   * Save complete app settings
   */
  public saveAppSettings(settings: AppSettings): void {
    store.set(this.SETTINGS_KEY, settings);
    console.log('[SettingsManager] Settings saved');
  }

  /**
   * Read-only convenience getters
   */
  public getGeneralSettings(): GeneralSettings {
    return this.getAppSettings().general;
  }

  public getChatSettings(): ChatSettings {
    return this.getAppSettings().chat;
  }

  public getAgentConfig(): AgentConfig {
    const agentConfig = this.getAppSettings().agent;
    if (!agentConfig.browserAgent) {
      agentConfig.browserAgent = { enabled: true, customPrompt: '', mcpServices: {} };
    }
    if (!agentConfig.browserAgent.mcpServices) {
      agentConfig.browserAgent.mcpServices = {};
    }
    if (!agentConfig.fileAgent) {
      agentConfig.fileAgent = { enabled: true, customPrompt: '', mcpServices: {} };
    }
    if (!agentConfig.fileAgent.mcpServices) {
      agentConfig.fileAgent.mcpServices = {};
    }
    if (!agentConfig.customAgents) {
      agentConfig.customAgents = [];
    }
    return agentConfig;
  }

  public getProviderConfig(id: string): ProviderConfig | undefined {
    return this.getAppSettings().providers[id];
  }

  /**
   * Get MCP settings
   */
  public getMcpSettings() {
    const settings = this.getAppSettings();
    return settings.mcp || { services: [] };
  }

  /**
   * Save agent configuration
   */
  public saveAgentConfig(agentConfig: AgentConfig): void {
    const settings = this.getAppSettings();
    settings.agent = agentConfig;
    this.saveAppSettings(settings);
  }
}
