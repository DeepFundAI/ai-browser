import { useState } from 'react';
import { ProviderType, ModelInfo } from '@/models/settings';

/**
 * Default base URLs for each provider
 */
const DEFAULT_BASE_URLS: Record<ProviderType, string> = {
  deepseek: 'https://api.deepseek.com/v1',
  openai: 'https://api.openai.com/v1',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta',
  anthropic: 'https://api.anthropic.com/v1'
};

/**
 * Fetch models from DeepSeek API
 */
async function fetchDeepSeekModels(apiKey: string, baseUrl: string): Promise<ModelInfo[]> {
  const response = await fetch(`${baseUrl}/models`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.data && Array.isArray(data.data)) {
    return data.data.map((model: any) => ({
      id: model.id,
      name: model.id.split('/').pop() || model.id,
      enabled: true,
    }));
  }

  return [];
}

/**
 * Fetch models from OpenAI API
 */
async function fetchOpenAIModels(apiKey: string, baseUrl: string): Promise<ModelInfo[]> {
  const response = await fetch(`${baseUrl}/models`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.data && Array.isArray(data.data)) {
    return data.data
      .filter((model: any) =>
        model.id.startsWith('gpt-') ||
        model.id.startsWith('o1') ||
        model.id.includes('turbo')
      )
      .map((model: any) => ({
        id: model.id,
        name: model.id,
        enabled: true,
      }));
  }

  return [];
}

/**
 * Fetch models from OpenRouter API
 */
async function fetchOpenRouterModels(apiKey: string, baseUrl: string): Promise<ModelInfo[]> {
  const response = await fetch(`${baseUrl}/models`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.data && Array.isArray(data.data)) {
    return data.data.map((model: any) => ({
      id: model.id,
      name: model.name || model.id,
      enabled: true,
    }));
  }

  return [];
}

/**
 * Fetch models from Qwen API
 */
async function fetchQwenModels(apiKey: string, baseUrl: string): Promise<ModelInfo[]> {
  const response = await fetch(`${baseUrl}/models`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.data && Array.isArray(data.data)) {
    return data.data
      .filter((model: any) => model.id.startsWith('qwen-'))
      .map((model: any) => ({
        id: model.id,
        name: model.id,
        enabled: true,
      }));
  }

  return [];
}

/**
 * Hook for fetching models from different AI providers
 */
export function useFetchModels() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch models from a provider
   * @param providerId - The provider to fetch models from
   * @param apiKey - API key for the provider
   * @param customBaseUrl - Optional custom base URL (if not provided, uses default)
   * @returns Array of models or null if provider doesn't support dynamic fetching
   */
  const fetchModels = async (
    providerId: ProviderType,
    apiKey: string,
    customBaseUrl?: string
  ): Promise<ModelInfo[] | null> => {
    setLoading(true);
    setError(null);

    try {
      // Use custom baseUrl if provided, otherwise use default
      const baseUrl = customBaseUrl || DEFAULT_BASE_URLS[providerId];

      let models: ModelInfo[] = [];

      switch (providerId) {
        case 'deepseek':
          models = await fetchDeepSeekModels(apiKey, baseUrl);
          break;

        case 'openai':
          models = await fetchOpenAIModels(apiKey, baseUrl);
          break;

        case 'openrouter':
          models = await fetchOpenRouterModels(apiKey, baseUrl);
          break;

        case 'qwen':
          models = await fetchQwenModels(apiKey, baseUrl);
          break;

        case 'google':
        case 'anthropic':
          // These providers don't support dynamic model listing
          return null;

        default:
          throw new Error(`Unsupported provider: ${providerId}`);
      }

      return models;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch models';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchModels,
    loading,
    error
  };
}
