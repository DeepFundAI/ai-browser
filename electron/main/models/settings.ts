/**
 * Application settings type definitions
 * INPUT: None (pure type definitions)
 * OUTPUT: Settings types for settings-manager
 * POSITION: Core types for application settings
 */

// Builtin provider IDs (sync with frontend)
export const BUILTIN_PROVIDER_IDS = ['deepseek', 'qwen', 'google', 'anthropic', 'openai', 'openrouter'] as const;
export type BuiltinProviderId = typeof BUILTIN_PROVIDER_IDS[number];

// Model information
export interface ModelInfo {
  id: string;
  name: string;
  enabled: boolean;
  capabilities?: string[];
}

// Provider configuration
export interface ProviderConfig {
  id: string;
  name: string;
  type: 'builtin' | 'custom';
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  models: ModelInfo[];
  selectedModel?: string;
  lastFetched?: number;
}

// Builtin provider metadata
export interface BuiltinProviderMeta {
  id: BuiltinProviderId;
  name: string;
  defaultBaseUrl: string;
  getKeyUrl: string;
  description: string;
}

// Builtin provider metadata (sync with frontend)
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
  maxTokens: number; // 1 - 128000 (capped by model limit)
  showTokenUsage: boolean;
  autoSaveHistory: boolean;
  historyRetentionDays: number; // 1 - 365
}

export interface AgentConfig {
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

export interface UISettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  density: 'compact' | 'comfortable' | 'spacious';
  editor: {
    showLineNumbers: boolean;
    wordWrap: boolean;
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
  requestTimeout: number; // Initial response timeout (seconds)
  streamTimeout: number;  // Streaming token interval timeout (seconds)
  retryAttempts: number;
}

export interface AppSettings {
  providers: Record<string, ProviderConfig>;
  general: GeneralSettings;
  chat: ChatSettings;
  agent: AgentConfig;
  ui: UISettings;
  network: NetworkSettings;
}
