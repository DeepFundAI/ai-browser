/**
 * Application settings manager
 * INPUT: Electron store for persistence
 * OUTPUT: General, Chat, and Agent settings management
 * POSITION: Singleton manager for all application settings
 */

import { store } from './store';
import type { GeneralSettings, ChatSettings, AgentConfig } from '../models';

// Default values
const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
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

const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  temperature: 0.7,
  maxTokens: 2048,
  streaming: true,
  showTokenUsage: false,
  markdownRendering: true,
  soundEffects: false,
  autoSaveHistory: true,
  historyRetentionDays: 30
};

const DEFAULT_AGENT_CONFIG: AgentConfig = {
  browserAgent: {
    enabled: true,
    customPrompt: ''
  },
  fileAgent: {
    enabled: true,
    customPrompt: ''
  },
  mcpTools: {}
};

/**
 * Singleton manager for application settings
 */
export class SettingsManager {
  private static instance: SettingsManager;

  private constructor() {}

  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  // General Settings
  public getGeneralSettings(): GeneralSettings {
    return store.get('generalSettings', DEFAULT_GENERAL_SETTINGS) as GeneralSettings;
  }

  public saveGeneralSettings(settings: GeneralSettings): void {
    store.set('generalSettings', settings);
    console.log('[SettingsManager] General settings saved');
  }

  // Chat Settings
  public getChatSettings(): ChatSettings {
    return store.get('chatSettings', DEFAULT_CHAT_SETTINGS) as ChatSettings;
  }

  public saveChatSettings(settings: ChatSettings): void {
    store.set('chatSettings', settings);
    console.log('[SettingsManager] Chat settings saved');
  }

  // Agent Config
  public getAgentConfig(): AgentConfig {
    return store.get('agentConfig', DEFAULT_AGENT_CONFIG) as AgentConfig;
  }

  public saveAgentConfig(config: AgentConfig): void {
    store.set('agentConfig', config);
    console.log('[SettingsManager] Agent config saved');
  }

  public getMcpToolConfig(toolName: string): { enabled: boolean; config?: Record<string, any> } {
    const agentConfig = this.getAgentConfig();
    return agentConfig.mcpTools[toolName] || { enabled: true };
  }

  public setMcpToolConfig(toolName: string, config: { enabled: boolean; config?: Record<string, any> }): void {
    const agentConfig = this.getAgentConfig();
    agentConfig.mcpTools[toolName] = config;
    this.saveAgentConfig(agentConfig);
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
}
