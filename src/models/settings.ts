/**
 * Settings data models and type definitions
 */

import React from 'react';

export type ProviderType = 'deepseek' | 'qwen' | 'google' | 'anthropic' | 'openai' | 'openrouter';

// UI Select component types
export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectOptionGroup {
  label: string;
  icon?: React.ReactNode;
  options: SelectOption[];
}

/**
 * Legacy config format from Electron Store (for backward compatibility)
 */
export interface LegacyProviderConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  enabled?: boolean;
  models?: any[];
  lastFetched?: number;
}

export interface LegacyUserModelConfigs {
  deepseek?: LegacyProviderConfig;
  qwen?: LegacyProviderConfig;
  google?: LegacyProviderConfig;
  anthropic?: LegacyProviderConfig;
  openrouter?: LegacyProviderConfig;
  openai?: LegacyProviderConfig;
  selectedProvider?: ProviderType;
}

export interface ProviderInfo {
  id: ProviderType;
  name: string;
  icon?: string;
  getKeyUrl: string;
  description: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  enabled: boolean;
  capabilities?: string[];
}

export interface ProviderConfig {
  id: ProviderType;
  enabled: boolean;
  apiKey: string;
  baseUrl?: string;
  customHeaders?: Record<string, string>;
  models: ModelInfo[];
  selectedModel?: string;
  lastFetched?: number; // Timestamp of last model fetch
}

export interface ProviderTestResult {
  success: boolean;
  error?: string;
  latency?: number;
}

export interface FetchModelsResult {
  success: boolean;
  models?: ModelInfo[];
  error?: string;
}

export interface GeneralSettings {
  toolModel: string; // Model ID for automated tasks (thread title generation, etc.)
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

// Default general settings
export function getDefaultGeneralSettings(): GeneralSettings {
  return {
    toolModel: 'deepseek-chat',
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

export interface ChatSettings {
  temperature: number; // 0.0 - 2.0
  maxTokens: number; // 1 - 8192
  streaming: boolean;
  showTokenUsage: boolean;
  markdownRendering: boolean;
  soundEffects: boolean;
  autoSaveHistory: boolean;
  historyRetentionDays: number; // 1 - 365
}

// Default chat settings
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

export interface AgentSettings {
  systemPrompt: string;
  enabledTools: string[];
  customTools: CustomToolConfig[];
}

export interface CustomToolConfig {
  id: string;
  name: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface UISettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number; // 10 - 32
  density: 'compact' | 'comfortable' | 'spacious';
  sidebarWidth: number; // 200 - 400
  editor: {
    showLineNumbers: boolean;
    wordWrap: boolean;
    showMinimap: boolean;
  };
}

export interface AppSettings {
  providers: {
    [key in ProviderType]?: ProviderConfig;
  };
  general: GeneralSettings;
  chat: ChatSettings;
  agent: AgentSettings;
  ui: UISettings;
}

// Predefined provider information
export const PROVIDER_INFO: Record<ProviderType, ProviderInfo> = {
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    getKeyUrl: 'https://platform.deepseek.com/api_keys',
    description: 'DeepSeek AI models with reasoning capabilities'
  },
  qwen: {
    id: 'qwen',
    name: 'Qwen (Alibaba)',
    getKeyUrl: 'https://bailian.console.aliyun.com/',
    description: 'Alibaba Qwen models with Chinese language support'
  },
  google: {
    id: 'google',
    name: 'Google Gemini',
    getKeyUrl: 'https://aistudio.google.com/app/apikey',
    description: 'Google Gemini models with multimodal capabilities'
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    getKeyUrl: 'https://console.anthropic.com/settings/keys',
    description: 'Anthropic Claude models with advanced reasoning'
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    getKeyUrl: 'https://platform.openai.com/api-keys',
    description: 'OpenAI GPT models with general intelligence'
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    getKeyUrl: 'https://openrouter.ai/keys',
    description: 'Access multiple AI models through OpenRouter'
  }
};

// Predefined model lists (used as fallback)
export const PREDEFINED_MODELS: Record<ProviderType, ModelInfo[]> = {
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', enabled: true },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', enabled: true }
  ],
  qwen: [
    { id: 'qwen-max', name: 'Qwen Max', enabled: true },
    { id: 'qwen-plus', name: 'Qwen Plus', enabled: true },
    { id: 'qwen-vl-max', name: 'Qwen VL Max', enabled: true, capabilities: ['vision'] }
  ],
  google: [
    { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash (Latest)', enabled: true },
    { id: 'gemini-2.0-flash-thinking-exp-01-21', name: 'Gemini 2.0 Flash Thinking', enabled: true },
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', enabled: true },
    { id: 'gemini-1.5-flash-002', name: 'Gemini 1.5 Flash 002', enabled: true },
    { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', enabled: true },
    { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro (Latest)', enabled: true },
    { id: 'gemini-1.5-pro-002', name: 'Gemini 1.5 Pro 002', enabled: true },
    { id: 'gemini-exp-1206', name: 'Gemini Experimental 1206', enabled: true }
  ],
  anthropic: [
    { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', enabled: true },
    { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet (Latest)', enabled: true },
    { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', enabled: true },
    { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku (Latest)', enabled: true },
    { id: 'claude-3-opus-latest', name: 'Claude 3 Opus (Latest)', enabled: true },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', enabled: true },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', enabled: true }
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', enabled: true },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', enabled: true },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', enabled: true },
    { id: 'gpt-4', name: 'GPT-4', enabled: true },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', enabled: true },
    { id: 'o1', name: 'O1', enabled: true },
    { id: 'o1-mini', name: 'O1 Mini', enabled: true }
  ],
  openrouter: [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', enabled: true },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', enabled: true },
    { id: 'deepseek/deepseek-coder', name: 'DeepSeek Coder', enabled: true },
    { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5', enabled: true },
    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', enabled: true },
    { id: 'openai/gpt-4o', name: 'GPT-4o', enabled: true },
    { id: 'x-ai/grok-beta', name: 'Grok Beta', enabled: true },
    { id: 'mistralai/mistral-nemo', name: 'Mistral Nemo', enabled: true },
    { id: 'qwen/qwen-110b-chat', name: 'Qwen 110B Chat', enabled: true },
    { id: 'cohere/command', name: 'Cohere Command', enabled: true }
  ]
};

// Default settings
export function getDefaultSettings(): AppSettings {
  return {
    providers: {},
    general: {
      toolModel: 'deepseek-chat',
      language: 'en',
      startup: {
        autoStart: false,
        startMinimized: false
      },
      window: {
        minimizeToTray: true,
        closeToTray: false
      }
    },
    chat: {
      temperature: 0.7,
      maxTokens: 2048,
      streaming: true,
      showTokenUsage: false,
      markdownRendering: true,
      soundEffects: false,
      autoSaveHistory: true,
      historyRetentionDays: 30
    },
    agent: {
      systemPrompt: '',
      enabledTools: [],
      customTools: []
    },
    ui: {
      theme: 'dark',
      fontSize: 14,
      density: 'comfortable',
      sidebarWidth: 240,
      editor: {
        showLineNumbers: false,
        wordWrap: true,
        showMinimap: false
      }
    }
  };
}
