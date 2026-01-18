import { useState } from 'react';
import { ModelInfo, BUILTIN_PROVIDER_META, BuiltinProviderId, BUILTIN_PROVIDER_IDS } from '@/models/settings';

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
 * Fetch models using generic OpenAI-compatible API
 * Used for custom providers
 */
async function fetchGenericModels(apiKey: string, baseUrl: string): Promise<ModelInfo[]> {
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
 * Check if provider is a builtin provider
 */
function isBuiltinProvider(id: string): id is BuiltinProviderId {
  return BUILTIN_PROVIDER_IDS.includes(id as BuiltinProviderId);
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
   * @param baseUrl - Base URL for the API
   * @returns Array of models or null if provider doesn't support dynamic fetching
   */
  const fetchModels = async (
    providerId: string,
    apiKey: string,
    baseUrl?: string
  ): Promise<ModelInfo[] | null> => {
    setLoading(true);
    setError(null);

    try {
      // Determine the base URL
      let effectiveBaseUrl = baseUrl;
      if (!effectiveBaseUrl && isBuiltinProvider(providerId)) {
        effectiveBaseUrl = BUILTIN_PROVIDER_META[providerId].defaultBaseUrl;
      }

      if (!effectiveBaseUrl) {
        throw new Error('Base URL is required for custom providers');
      }

      let models: ModelInfo[] = [];

      // Handle builtin providers with specific logic
      if (isBuiltinProvider(providerId)) {
        switch (providerId) {
          case 'deepseek':
            models = await fetchDeepSeekModels(apiKey, effectiveBaseUrl);
            break;

          case 'openai':
            models = await fetchOpenAIModels(apiKey, effectiveBaseUrl);
            break;

          case 'openrouter':
            models = await fetchOpenRouterModels(apiKey, effectiveBaseUrl);
            break;

          case 'qwen':
            models = await fetchQwenModels(apiKey, effectiveBaseUrl);
            break;

          case 'google':
          case 'anthropic':
            // These providers don't support dynamic model listing via standard API
            return null;
        }
      } else {
        // Custom provider - use generic OpenAI-compatible API
        models = await fetchGenericModels(apiKey, effectiveBaseUrl);
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
