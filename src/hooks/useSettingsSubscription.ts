/**
 * Hook for subscribing to settings changes
 * INPUT: Callback function to handle settings updates
 * OUTPUT: Automatic subscription/unsubscription on mount/unmount
 * POSITION: Core hook for settings change notifications
 */

import { useEffect } from 'react';
import { logger } from '@/utils/logger';

/**
 * Subscribe to settings update notifications
 * When settings are saved (from any window), this hook will trigger the callback
 * Components should reload their config in the callback
 */
export function useSettingsSubscription(onUpdate: () => void) {
  useEffect(() => {
    const handleSettingsUpdate = () => {
      logger.debug('Settings updated, triggering callback', 'useSettingsSubscription');
      onUpdate();
    };

    // Subscribe to settings-updated event
    let cleanup: (() => void) | undefined;
    if (typeof window !== 'undefined' && (window as any).api?.onSettingsUpdated) {
      cleanup = (window as any).api.onSettingsUpdated(handleSettingsUpdate);
    }

    // Cleanup on unmount or when callback changes
    return () => {
      if (cleanup) {
        logger.debug('Cleaning up listener', 'useSettingsSubscription');
        cleanup();
      }
    };
  }, [onUpdate]);
}
