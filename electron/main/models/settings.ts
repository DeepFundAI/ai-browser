/**
 * Application settings type definitions
 * INPUT: None (pure type definitions)
 * OUTPUT: Settings types for settings-manager
 * POSITION: Core types for application settings
 */

export interface GeneralSettings {
  toolModel: string;
  language: 'en' | 'zh';
  startup: {
    autoStart: boolean;
    startMinimized: boolean;
  };
  window: {
    minimizeToTray: boolean;
    closeToTray: boolean;
  };
}

export interface ChatSettings {
  temperature: number;
  maxTokens: number;
  streaming: boolean;
  showTokenUsage: boolean;
  markdownRendering: boolean;
  soundEffects: boolean;
  autoSaveHistory: boolean;
  historyRetentionDays: number;
}

export interface AgentConfig {
  browserAgent: {
    enabled: boolean;
    customPrompt: string;
  };
  fileAgent: {
    enabled: boolean;
    customPrompt: string;
  };
  mcpTools: {
    [toolName: string]: {
      enabled: boolean;
      config?: Record<string, any>;
    };
  };
}
