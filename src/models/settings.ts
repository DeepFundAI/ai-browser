/**
 * Settings data models and type definitions
 * INPUT: None (type definitions)
 * OUTPUT: Type definitions for settings system
 * POSITION: Core type definitions for the entire settings module
 */

import React from 'react';

// Builtin provider IDs (for type safety where needed)
export const BUILTIN_PROVIDER_IDS = ['deepseek', 'qwen', 'google', 'anthropic', 'openai', 'openrouter'] as const;
export type BuiltinProviderId = typeof BUILTIN_PROVIDER_IDS[number];

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
  // New fields for unified structure
  name?: string;
  type?: 'builtin' | 'custom';
}

export interface LegacyUserModelConfigs {
  [key: string]: LegacyProviderConfig | string | undefined;
  selectedProvider?: string;
}

// Model information
export interface ModelInfo {
  id: string;
  name: string;
  enabled: boolean;
  capabilities?: string[];
}

/**
 * Unified Provider configuration (works for both builtin and custom providers)
 */
export interface ProviderConfig {
  id: string;                      // Unique identifier
  name: string;                    // Display name
  type: 'builtin' | 'custom';      // Provider type
  enabled: boolean;
  apiKey: string;
  baseUrl: string;                 // API endpoint
  models: ModelInfo[];             // Dynamically fetched models
  selectedModel?: string;
  lastFetched?: number;            // Timestamp of last model fetch
}

// Builtin provider metadata (static info, not stored)
export interface BuiltinProviderMeta {
  id: BuiltinProviderId;
  name: string;
  defaultBaseUrl: string;
  getKeyUrl: string;
  description: string;
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
  temperature: number; // 0.0 - 2.0
  maxTokens: number; // 1 - 8192
  showTokenUsage: boolean;
  markdownRendering: boolean;
  autoSaveHistory: boolean;
  historyRetentionDays: number; // 1 - 365
}

export interface AgentSettings {
  systemPrompt: string;
  enabledTools: string[];
  customTools: CustomToolConfig[];
  mcpTools: {
    [toolName: string]: {
      enabled: boolean;
      config?: Record<string, any>;
    };
  };
  browserAgent: {
    enabled: boolean;
    customPrompt?: string;
  };
  fileAgent: {
    enabled: boolean;
    customPrompt?: string;
  };
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
  editor: {
    showLineNumbers: boolean;
    wordWrap: boolean;
    showMinimap: boolean;
  };
}

export interface NetworkSettings {
  proxy: {
    enabled: boolean;
    type: 'http' | 'https' | 'socks5';
    server: string;
    port: number;
    username?: string;
    password?: string;
  };
  requestTimeout: number; // 5 - 120 seconds
  retryAttempts: number; // 0 - 10
  customUserAgent?: string;
}

export interface AppSettings {
  providers: Record<string, ProviderConfig>;
  general: GeneralSettings;
  chat: ChatSettings;
  agent: AgentSettings;
  ui: UISettings;
  network: NetworkSettings;
}

/**
 * Builtin provider metadata
 * Static information about supported providers (not stored in config)
 */
export const BUILTIN_PROVIDER_META: Record<BuiltinProviderId, BuiltinProviderMeta> = {
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    getKeyUrl: 'https://platform.deepseek.com/api_keys',
    description: 'DeepSeek AI models with reasoning capabilities'
  },
  qwen: {
    id: 'qwen',
    name: 'Qwen (Alibaba)',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    getKeyUrl: 'https://bailian.console.aliyun.com/',
    description: 'Alibaba Qwen models with Chinese language support'
  },
  google: {
    id: 'google',
    name: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    getKeyUrl: 'https://aistudio.google.com/app/apikey',
    description: 'Google Gemini models with multimodal capabilities'
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    getKeyUrl: 'https://console.anthropic.com/settings/keys',
    description: 'Anthropic Claude models with advanced reasoning'
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    getKeyUrl: 'https://platform.openai.com/api-keys',
    description: 'OpenAI GPT models with general intelligence'
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    getKeyUrl: 'https://openrouter.ai/keys',
    description: 'Access multiple AI models through OpenRouter'
  }
};

// Backward compatibility: alias for PROVIDER_INFO
export const PROVIDER_INFO = BUILTIN_PROVIDER_META;

/**
 * Create a default provider config for a builtin provider
 */
export function createBuiltinProviderConfig(providerId: BuiltinProviderId): ProviderConfig {
  const meta = BUILTIN_PROVIDER_META[providerId];
  return {
    id: providerId,
    name: meta.name,
    type: 'builtin',
    enabled: false,
    apiKey: '',
    baseUrl: meta.defaultBaseUrl,
    models: [],
    lastFetched: undefined
  };
}

/**
 * Create a default provider config for a custom provider
 */
export function createCustomProviderConfig(id: string, name: string, baseUrl: string): ProviderConfig {
  return {
    id,
    name,
    type: 'custom',
    enabled: true,
    apiKey: '',
    baseUrl,
    models: [],
    lastFetched: undefined
  };
}
