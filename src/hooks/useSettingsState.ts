/**
 * Unified settings state management hook
 * INPUT: Electron Store via IPC
 * OUTPUT: Settings state with dirty detection and save/reset
 * POSITION: Core hook for settings window state management
 */

import { useState, useEffect, useCallback } from 'react';
import { isEqual } from 'lodash';
import {
  convertLegacyToNewConfig,
  convertNewToLegacyConfig,
  SettingsConfigs,
  ProviderConfigs
} from '@/utils/config-converter';
import { GeneralSettings, ChatSettings, UISettings, ProviderConfig } from '@/models/settings';

export function useSettingsState() {
  const [originalConfigs, setOriginalConfigs] = useState<SettingsConfigs | null>(null);
  const [currentConfigs, setCurrentConfigs] = useState<SettingsConfigs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).api) {
        const response = await (window as any).api.getUserModelConfigs();
        const legacyConfigs = response?.data?.configs || response || {};
        const newConfigs = convertLegacyToNewConfig(legacyConfigs);
        setOriginalConfigs(newConfigs);
        setCurrentConfigs(newConfigs);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = useCallback(() => {
    if (!originalConfigs || !currentConfigs) return false;
    return !isEqual(originalConfigs, currentConfigs);
  }, [originalConfigs, currentConfigs]);

  /**
   * Update provider configurations
   */
  const updateProviders = useCallback((
    newProviders: ProviderConfigs | ((prev: ProviderConfigs) => ProviderConfigs)
  ) => {
    setCurrentConfigs(prev => {
      if (!prev) return prev;
      const providers = typeof newProviders === 'function'
        ? newProviders(prev.providers)
        : newProviders;
      return { ...prev, providers };
    });
  }, []);

  /**
   * Update a single provider configuration
   */
  const updateProvider = useCallback((
    providerId: string,
    updates: Partial<ProviderConfig> | ((prev: ProviderConfig) => ProviderConfig)
  ) => {
    setCurrentConfigs(prev => {
      if (!prev || !prev.providers[providerId]) return prev;
      const currentProvider = prev.providers[providerId];
      const updatedProvider = typeof updates === 'function'
        ? updates(currentProvider)
        : { ...currentProvider, ...updates };
      return {
        ...prev,
        providers: {
          ...prev.providers,
          [providerId]: updatedProvider
        }
      };
    });
  }, []);

  /**
   * Add a new custom provider
   */
  const addProvider = useCallback((provider: ProviderConfig) => {
    setCurrentConfigs(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        providers: {
          ...prev.providers,
          [provider.id]: provider
        }
      };
    });
  }, []);

  /**
   * Remove a custom provider
   */
  const removeProvider = useCallback((providerId: string) => {
    setCurrentConfigs(prev => {
      if (!prev) return prev;
      const { [providerId]: removed, ...rest } = prev.providers;
      return {
        ...prev,
        providers: rest
      };
    });
  }, []);

  /**
   * Update general settings
   */
  const updateGeneral = useCallback((
    newGeneral: GeneralSettings | ((prev: GeneralSettings) => GeneralSettings)
  ) => {
    setCurrentConfigs(prev => {
      if (!prev) return prev;
      const general = typeof newGeneral === 'function'
        ? newGeneral(prev.general)
        : newGeneral;
      return { ...prev, general };
    });
  }, []);

  /**
   * Update chat settings
   */
  const updateChat = useCallback((
    newChat: ChatSettings | ((prev: ChatSettings) => ChatSettings)
  ) => {
    setCurrentConfigs(prev => {
      if (!prev) return prev;
      const chat = typeof newChat === 'function'
        ? newChat(prev.chat)
        : newChat;
      return { ...prev, chat };
    });
  }, []);

  /**
   * Update UI settings
   */
  const updateUI = useCallback((
    newUI: UISettings | ((prev: UISettings) => UISettings)
  ) => {
    setCurrentConfigs(prev => {
      if (!prev) return prev;
      const ui = typeof newUI === 'function'
        ? newUI(prev.ui)
        : newUI;
      return { ...prev, ui };
    });
  }, []);

  const saveConfigs = useCallback(async () => {
    if (!currentConfigs) return;

    setSaving(true);
    try {
      if (typeof window !== 'undefined' && (window as any).api) {
        const legacyConfigs = convertNewToLegacyConfig(currentConfigs);
        await (window as any).api.saveUserModelConfigs(legacyConfigs);
        setOriginalConfigs(currentConfigs);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [currentConfigs]);

  const resetConfigs = useCallback(() => {
    if (originalConfigs) {
      setCurrentConfigs(originalConfigs);
    }
  }, [originalConfigs]);

  const reloadConfigs = useCallback(async () => {
    await loadConfigs();
  }, []);

  return {
    configs: currentConfigs,
    providers: currentConfigs?.providers ?? null,
    general: currentConfigs?.general ?? null,
    chat: currentConfigs?.chat ?? null,
    ui: currentConfigs?.ui ?? null,
    loading,
    saving,
    hasChanges: hasChanges(),
    updateProviders,
    updateProvider,
    addProvider,
    removeProvider,
    updateGeneral,
    updateChat,
    updateUI,
    saveConfigs,
    resetConfigs,
    reloadConfigs
  };
}
