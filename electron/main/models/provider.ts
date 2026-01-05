/**
 * Provider and model type definitions
 * INPUT: None (pure type definitions)
 * OUTPUT: Provider/Model related types for config-manager
 * POSITION: Core types for LLM provider configuration
 */

import type { GeneralSettings, ChatSettings } from './settings';

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
  generalSettings?: GeneralSettings;
  chatSettings?: ChatSettings;
}
