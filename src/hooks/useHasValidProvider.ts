/**
 * Check if user has configured at least one valid provider
 * INPUT: Settings from settingsStore
 * OUTPUT: Boolean indicating if valid provider exists
 * POSITION: Utility hook for enabling/disabling chat input
 */

import { useMemo } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

export function useHasValidProvider(): boolean {
  const { settings } = useSettingsStore();

  return useMemo(() => {
    if (!settings?.providers) return false;

    // Check if at least one provider has:
    // 1. enabled = true
    // 2. apiKey configured
    // 3. at least one enabled model
    // 4. selectedModel configured
    return Object.values(settings.providers).some(
      (provider) =>
        provider.enabled &&
        provider.apiKey?.trim() &&
        provider.models?.some((m) => m.enabled) &&
        provider.selectedModel
    );
  }, [settings]);
}
