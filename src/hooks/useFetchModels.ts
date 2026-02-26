import { useState } from 'react';
import { ModelInfo, BUILTIN_PROVIDER_META, BuiltinProviderId, BUILTIN_PROVIDER_IDS } from '@/models/settings';

/** Model filter by provider */
const MODEL_FILTERS: Record<string, (id: string) => boolean> = {
  deepseek: () => true,
  openai: (id) => id.startsWith('gpt-') || id.startsWith('o1') || id.includes('turbo'),
  openrouter: () => true,
  qwen: (id) => id.startsWith('qwen-'),
  google: (id) => id.includes('gemini'),
  anthropic: (id) => id.includes('claude'),
};

/** Check if provider is builtin */
function isBuiltinProvider(id: string): id is BuiltinProviderId {
  return BUILTIN_PROVIDER_IDS.includes(id as BuiltinProviderId);
}

/** Parse API response to ModelInfo array */
function parseModels(data: any, providerId: string): ModelInfo[] {
  if (!data?.data || !Array.isArray(data.data)) return [];

  const filter = MODEL_FILTERS[providerId] || (() => true);

  return data.data
    .filter((model: any) => filter(model.id))
    .map((model: any) => ({
      id: model.id,
      name: model.name || model.id,
      enabled: true,
    }));
}

/**
 * Hook for fetching models from AI providers via IPC
 */
export function useFetchModels() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = async (
    providerId: string,
    apiKey: string,
    baseUrl?: string
  ): Promise<ModelInfo[] | null> => {
    setLoading(true);
    setError(null);

    try {
      // Determine base URL
      let effectiveBaseUrl = baseUrl;
      if (!effectiveBaseUrl && isBuiltinProvider(providerId)) {
        effectiveBaseUrl = BUILTIN_PROVIDER_META[providerId].defaultBaseUrl;
      }

      if (!effectiveBaseUrl) {
        throw new Error('Base URL is required for custom providers');
      }

      // Fetch via IPC to bypass CORS
      const result = await window.api.fetchModels(providerId, apiKey, effectiveBaseUrl);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch models');
      }

      return parseModels(result.data, providerId);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch models';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { fetchModels, loading, error };
}
