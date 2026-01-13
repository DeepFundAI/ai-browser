/**
 * Unified application settings manager
 * INPUT: Electron store for persistence
 * OUTPUT: Centralized settings with single data source
 * POSITION: Singleton for all app settings
 */

import { store } from './store';
import type { AppSettings, GeneralSettings, ChatSettings, AgentConfig, CustomToolConfig, ProviderConfig } from '../models';
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
    // Ensure browserAgent field exists for backward compatibility
    if (!agentConfig.browserAgent) {
      agentConfig.browserAgent = {
        enabled: true,
        customPrompt: ''
      };
    }
    // Ensure fileAgent field exists for backward compatibility
    if (!agentConfig.fileAgent) {
      agentConfig.fileAgent = {
        enabled: true,
        customPrompt: ''
      };
    }
    return agentConfig;
  }

  public getProviderConfig(id: string): ProviderConfig | undefined {
    return this.getAppSettings().providers[id];
  }

  /**
   * MCP tools helpers
   */
  public getMcpToolConfig(toolName: string): { enabled: boolean; config?: Record<string, any> } {
    return this.getAgentConfig().mcpTools[toolName] || { enabled: true };
  }

  public getAllMcpToolsConfig(availableTools: string[]): Record<string, { enabled: boolean; config?: Record<string, any> }> {
    const agentConfig = this.getAgentConfig();
    const result: Record<string, { enabled: boolean; config?: Record<string, any> }> = {};
    availableTools.forEach(toolName => {
      result[toolName] = agentConfig.mcpTools[toolName] || { enabled: true };
    });
    return result;
  }

  public getEnabledMcpTools(availableTools: string[]): string[] {
    const allConfigs = this.getAllMcpToolsConfig(availableTools);
    return Object.entries(allConfigs)
      .filter(([_, config]) => config.enabled)
      .map(([name]) => name);
  }

  /**
   * Save agent configuration
   */
  public saveAgentConfig(agentConfig: AgentConfig): void {
    const settings = this.getAppSettings();
    settings.agent = agentConfig;
    this.saveAppSettings(settings);
  }

  /**
   * Set MCP tool configuration
   */
  public setMcpToolConfig(toolName: string, config: { enabled: boolean; config?: Record<string, any> }): void {
    const settings = this.getAppSettings();
    if (!settings.agent.mcpTools) {
      settings.agent.mcpTools = {};
    }
    settings.agent.mcpTools[toolName] = config;
    this.saveAppSettings(settings);
  }
}
