/**
 * Model configuration manager
 * INPUT: Environment variables, Electron store
 * OUTPUT: LLM provider configurations
 * POSITION: Core manager for model/API configurations
 */

import { config } from "dotenv";
import path from "node:path";
import { app } from "electron";
import fs from "fs";
import { SettingsManager } from "./settings-manager";

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

  private getMaxTokensForModel(provider: string, model: string): number {
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
    // Read from unified settings
    const appSettings = SettingsManager.getInstance().getAppSettings();
    const chatSettings = appSettings.chat;

    // Find the first enabled provider with selectedModel and apiKey
    const enabledProvider = Object.values(appSettings.providers).find(
      (p) => p.enabled && p.selectedModel && p.apiKey
    );

    if (!enabledProvider) {
      console.error('[ConfigManager] No enabled provider found with selectedModel and apiKey');
      return { default: null };
    }

    const { id: providerId, selectedModel, apiKey, baseUrl: baseURL } = enabledProvider;

    if (!selectedModel) {
      console.error('[ConfigManager] selectedModel is undefined');
      return { default: null };
    }

    const logInfo = (msg: string, ...args: any[]) => console.log(`[ConfigManager] ${msg}`, ...args);
    const modelMaxTokens = this.getMaxTokensForModel(providerId, selectedModel);

    // Use user-configured maxTokens, but cap it at model's maximum
    const maxTokens = Math.min(chatSettings.maxTokens, modelMaxTokens);

    // Determine provider type for jarvis-agent
    // Most providers use OpenAI-compatible API, with some exceptions
    let providerType: string;
    if (providerId === 'google') {
      providerType = 'google';
    } else if (providerId === 'anthropic') {
      providerType = 'anthropic';
    } else if (providerId === 'deepseek') {
      providerType = 'deepseek';
    } else if (providerId === 'openrouter') {
      providerType = 'openrouter';
    } else {
      // Custom providers and qwen default to OpenAI-compatible
      providerType = 'openai';
    }

    // Build LLM config with user settings
    const defaultLLM: any = {
      provider: providerType,
      model: selectedModel,
      apiKey: apiKey || "",
      config: {
        maxTokens,
        temperature: chatSettings.temperature
      }
    };

    // Add baseURL if provider uses it
    if (baseURL && (providerType === 'openai' || providerType === 'deepseek' || providerType === 'qwen')) {
      defaultLLM.config.baseURL = baseURL;
    }

    // Provider-specific customizations
    if (providerId === 'deepseek') {
      defaultLLM.config.mode = 'regular';
      defaultLLM.fetch = (url: string, options?: any) => {
        const body = JSON.parse((options?.body as string) || '{}');
        body.thinking = { type: "disabled" };
        logInfo('Deepseek request:', selectedModel);
        return fetch(url, { ...options, body: JSON.stringify(body) });
      };
    } else if (providerId === 'qwen') {
      defaultLLM.config.timeout = 60000;
      defaultLLM.fetch = (url: string, options?: any) => {
        logInfo('Qwen request:', selectedModel);
        return fetch(url, options);
      };
    }

    logInfo(`Using provider: ${providerId}, model: ${selectedModel}`);
    logInfo(`Chat settings - temperature: ${chatSettings.temperature}, maxTokens: ${maxTokens} (user: ${chatSettings.maxTokens}, model limit: ${modelMaxTokens})`);

    return { default: defaultLLM };
  }

  // Delegate to SettingsManager for backward compatibility
  public getAgentConfig() {
    return SettingsManager.getInstance().getAgentConfig();
  }

  public saveAgentConfig(config: any): void {
    SettingsManager.getInstance().saveAgentConfig(config);
  }

  public getMcpToolConfig(toolName: string) {
    return SettingsManager.getInstance().getMcpToolConfig(toolName);
  }

  public setMcpToolConfig(toolName: string, config: { enabled: boolean; config?: Record<string, any> }): void {
    SettingsManager.getInstance().setMcpToolConfig(toolName, config);
  }

  public getAllMcpToolsConfig(availableTools: string[]) {
    return SettingsManager.getInstance().getAllMcpToolsConfig(availableTools);
  }

  public getEnabledMcpTools(availableTools: string[]): string[] {
    return SettingsManager.getInstance().getEnabledMcpTools(availableTools);
  }
}