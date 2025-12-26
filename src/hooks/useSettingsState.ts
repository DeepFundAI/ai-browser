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
import { GeneralSettings, ChatSettings } from '@/models/settings';

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
    loading,
    saving,
    hasChanges: hasChanges(),
    updateProviders,
    updateGeneral,
    updateChat,
    saveConfigs,
    resetConfigs,
    reloadConfigs
  };
}
