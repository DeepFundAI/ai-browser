import { config } from "dotenv";
import path from "node:path";
import { app } from "electron";
import fs from "fs";
import { store } from "./store";

export type ProviderType = 'deepseek' | 'qwen' | 'google' | 'anthropic' | 'openrouter';

export interface ModelConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseURL?: string;
}

export interface UserModelConfigs {
  deepseek?: {
    apiKey?: string;
    baseURL?: string;
    model?: string;
  };
  qwen?: {
    apiKey?: string;
    model?: string;
  };
  google?: {
    apiKey?: string;
    model?: string;
  };
  anthropic?: {
    apiKey?: string;
    model?: string;
  };
  openrouter?: {
    apiKey?: string;
    model?: string;
  };
  selectedProvider?: ProviderType;
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

export class ConfigManager {
  private static instance: ConfigManager;
  private initialized = false;

  private constructor() {}

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public initialize(): void {
    if (this.initialized) return;

    const isDev = !app.isPackaged;

    if (isDev) {
      const envLocalPath = path.join(process.cwd(), '.env.local');
      if (fs.existsSync(envLocalPath)) {
        config({ path: envLocalPath });
        console.log('[ConfigManager] Loaded environment variables from .env.local');
        this.initialized = true;
        return;
      }
    }

    const bundledConfigPath = path.join(app.getAppPath(), '../../.env.production');

    if (fs.existsSync(bundledConfigPath)) {
      config({ path: bundledConfigPath });
      console.log('[ConfigManager] Loaded environment variables from bundled .env.production');
    } else {
      console.log('[ConfigManager] No bundled config found, using system environment variables');
    }

    this.logAvailableKeys();
    this.initialized = true;
  }

  public getApiKey(key: string, defaultValue: string = ''): string {
    return process.env[key] || defaultValue;
  }

  public validateApiKeys(): { isValid: boolean; missingKeys: string[] } {
    const requiredKeys = ['DEEPSEEK_API_KEY', 'BAILIAN_API_KEY'];
    const missingKeys = requiredKeys.filter(key => !this.getApiKey(key));

    return {
      isValid: missingKeys.length === 0,
      missingKeys
    };
  }

  private logAvailableKeys(): void {
    const availableKeys = ['DEEPSEEK_API_KEY', 'BAILIAN_API_KEY', 'OPENROUTER_API_KEY']
      .filter(key => process.env[key])
      .map(key => `${key.substring(0, 8)}...`);

    if (availableKeys.length > 0) {
      console.log('[ConfigManager] Available API keys:', availableKeys);
    } else {
      console.warn('[ConfigManager] No API keys found! Please configure your API keys in .env.production before building.');
    }

    const validation = this.validateApiKeys();
    if (!validation.isValid) {
      console.warn('[ConfigManager] Missing required API keys:', validation.missingKeys);
    }
  }

  public getUserModelConfigs(): UserModelConfigs {
    return store.get('modelConfigs', {}) as UserModelConfigs;
  }

  public saveUserModelConfigs(configs: UserModelConfigs): void {
    store.set('modelConfigs', configs);
    console.log('[ConfigManager] User model configurations saved');
  }

  public getModelConfig(provider: ProviderType): ModelConfig | null {
    const userConfigs = this.getUserModelConfigs();

    switch (provider) {
      case 'deepseek':
        return {
          provider: 'deepseek',
          model: userConfigs.deepseek?.model || 'deepseek-chat',
          apiKey: userConfigs.deepseek?.apiKey || process.env.DEEPSEEK_API_KEY || '',
          baseURL: userConfigs.deepseek?.baseURL || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
        };

      case 'qwen':
        return {
          provider: 'openai',
          model: userConfigs.qwen?.model || 'qwen-max',
          apiKey: userConfigs.qwen?.apiKey || process.env.QWEN_API_KEY || '',
          baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
        };

      case 'google':
        return {
          provider: 'google',
          model: userConfigs.google?.model || 'gemini-1.5-flash-latest',
          apiKey: userConfigs.google?.apiKey || process.env.GOOGLE_API_KEY || ''
        };

      case 'anthropic':
        return {
          provider: 'anthropic',
          model: userConfigs.anthropic?.model || 'claude-3-5-sonnet-latest',
          apiKey: userConfigs.anthropic?.apiKey || process.env.ANTHROPIC_API_KEY || ''
        };

      case 'openrouter':
        return {
          provider: 'openrouter',
          model: userConfigs.openrouter?.model || 'anthropic/claude-3.5-sonnet',
          apiKey: userConfigs.openrouter?.apiKey || process.env.OPENROUTER_API_KEY || ''
        };

      default:
        return null;
    }
  }

  public getApiKeySource(provider: ProviderType): 'user' | 'env' | 'none' {
    const userConfigs = this.getUserModelConfigs();

    if (userConfigs[provider]?.apiKey) {
      return 'user';
    }

    const envKeys: Record<ProviderType, string> = {
      deepseek: 'DEEPSEEK_API_KEY',
      qwen: 'QWEN_API_KEY',
      google: 'GOOGLE_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      openrouter: 'OPENROUTER_API_KEY'
    };

    const envKey = envKeys[provider];
    if (process.env[envKey]) {
      return 'env';
    }

    return 'none';
  }

  public getSelectedProvider(): ProviderType {
    const userConfigs = this.getUserModelConfigs();
    return userConfigs.selectedProvider || 'deepseek';
  }

  public setSelectedProvider(provider: ProviderType): void {
    const userConfigs = this.getUserModelConfigs();
    userConfigs.selectedProvider = provider;
    this.saveUserModelConfigs(userConfigs);
  }

  private getMaxTokensForModel(provider: ProviderType, model: string): number {
    const tokenLimits: Record<string, number> = {
      'deepseek-chat': 8192,
      'deepseek-reasoner': 65536,
      'gemini-2.0-flash-thinking-exp-01-21': 65536,
      'gemini-1.5-flash-latest': 8192,
      'gemini-2.0-flash-exp': 8192,
      'gemini-1.5-flash-002': 8192,
      'gemini-1.5-flash-8b': 8192,
      'gemini-1.5-pro-latest': 8192,
      'gemini-1.5-pro-002': 8192,
      'gemini-exp-1206': 8192,
      'claude-3-7-sonnet-20250219': 128000,
      'claude-3-5-sonnet-latest': 8000,
      'claude-3-5-sonnet-20240620': 8000,
      'claude-3-5-haiku-latest': 8000,
      'claude-3-opus-latest': 8000,
      'claude-3-sonnet-20240229': 8000,
      'claude-3-haiku-20240307': 8000,
      'qwen-max': 8192,
      'qwen-plus': 8192,
      'qwen-vl-max': 8192,
    };

    return tokenLimits[model] || (provider === 'openrouter' ? 8000 : 8192);
  }

  public getLLMsConfig(): any {
    const selectedProvider = this.getSelectedProvider();
    const providerConfig = this.getModelConfig(selectedProvider);

    if (!providerConfig) {
      console.error(`[ConfigManager] No config found for provider: ${selectedProvider}`);
      return { default: null };
    }

    const logInfo = (msg: string, ...args: any[]) => console.log(`[ConfigManager] ${msg}`, ...args);
    const maxTokens = this.getMaxTokensForModel(selectedProvider, providerConfig.model);

    let defaultLLM: any;

    switch (selectedProvider) {
      case 'deepseek':
        defaultLLM = {
          provider: providerConfig.provider,
          model: providerConfig.model,
          apiKey: providerConfig.apiKey || "",
          config: {
            baseURL: providerConfig.baseURL || "https://api.deepseek.com/v1",
            maxTokens,
            mode: 'regular',
          },
          fetch: (url: string, options?: any) => {
            const body = JSON.parse((options?.body as string) || '{}');
            body.thinking = { type: "disabled" };
            logInfo('Deepseek request:', providerConfig.model);
            return fetch(url, { ...options, body: JSON.stringify(body) });
          }
        };
        break;

      case 'qwen':
        defaultLLM = {
          provider: providerConfig.provider,
          model: providerConfig.model,
          apiKey: providerConfig.apiKey || "",
          config: {
            baseURL: providerConfig.baseURL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
            maxTokens,
            timeout: 60000,
            temperature: 0.7
          },
          fetch: (url: string, options?: any) => {
            logInfo('Qwen request:', providerConfig.model);
            return fetch(url, options);
          }
        };
        break;

      case 'google':
        defaultLLM = {
          provider: providerConfig.provider,
          model: providerConfig.model,
          apiKey: providerConfig.apiKey || "",
          config: {
            maxTokens,
            temperature: 0.7
          }
        };
        break;

      case 'anthropic':
        defaultLLM = {
          provider: providerConfig.provider,
          model: providerConfig.model,
          apiKey: providerConfig.apiKey || "",
          config: {
            maxTokens,
            temperature: 0.7
          }
        };
        break;

      case 'openrouter':
        defaultLLM = {
          provider: providerConfig.provider,
          model: providerConfig.model,
          apiKey: providerConfig.apiKey || "",
          config: {
            maxTokens
          }
        };
        break;

      default:
        console.error(`[ConfigManager] Unsupported provider: ${selectedProvider}`);
        return { default: null };
    }

    logInfo(`Using provider: ${selectedProvider}, model: ${providerConfig.model}, maxTokens: ${maxTokens}`);

    return { default: defaultLLM };
  }

  public getAgentConfig(): AgentConfig {
    const defaultConfig: AgentConfig = {
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

    return store.get('agentConfig', defaultConfig) as AgentConfig;
  }

  public saveAgentConfig(config: AgentConfig): void {
    store.set('agentConfig', config);
    console.log('[ConfigManager] Agent configurations saved');
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
      .map(([name, _]) => name);
  }
}