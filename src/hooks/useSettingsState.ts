import { useState, useEffect, useCallback } from 'react';
import { isEqual } from 'lodash';
import {
  convertLegacyToNewConfig,
  convertNewToLegacyConfig,
  SettingsConfigs
} from '@/utils/config-converter';

/**
 * Hook for managing settings state with dirty data detection
 * Provides unified save/reset functionality for all settings panels
 */
export function useSettingsState() {
  const [originalConfigs, setOriginalConfigs] = useState<SettingsConfigs | null>(null);
  const [currentConfigs, setCurrentConfigs] = useState<SettingsConfigs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /**
   * Load configurations from Electron Store on mount
   */
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).api) {
        // Load legacy format from Electron Store
        const response = await (window as any).api.getUserModelConfigs();

        // Extract configs from response
        const legacyConfigs = response?.data?.configs || response || {};

        // Convert to new format
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

  /**
   * Check if current configs differ from original (dirty data detection)
   * Uses deep equality check to detect changes
   */
  const hasChanges = useCallback(() => {
    if (!originalConfigs || !currentConfigs) return false;
    return !isEqual(originalConfigs, currentConfigs);
  }, [originalConfigs, currentConfigs]);

  /**
   * Update current configurations
   */
  const updateConfigs = useCallback((newConfigs: SettingsConfigs | ((prev: SettingsConfigs) => SettingsConfigs)) => {
    setCurrentConfigs(prev => {
      if (!prev) return prev;
      return typeof newConfigs === 'function' ? newConfigs(prev) : newConfigs;
    });
  }, []);

  /**
   * Save current configurations to Electron Store
   */
  const saveConfigs = useCallback(async () => {
    if (!currentConfigs) return;

    setSaving(true);
    try {
      if (typeof window !== 'undefined' && (window as any).api) {
        // Convert to legacy format before saving
        const legacyConfigs = convertNewToLegacyConfig(currentConfigs);
        await (window as any).api.saveUserModelConfigs(legacyConfigs);
        // Update original configs to match saved state
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

  /**
   * Reset current configurations to original state
   */
  const resetConfigs = useCallback(() => {
    if (originalConfigs) {
      setCurrentConfigs(originalConfigs);
    }
  }, [originalConfigs]);

  /**
   * Reload configurations from store (discard all changes)
   */
  const reloadConfigs = useCallback(async () => {
    await loadConfigs();
  }, []);

  return {
    configs: currentConfigs,
    loading,
    saving,
    hasChanges: hasChanges(),
    updateConfigs,
    saveConfigs,
    resetConfigs,
    reloadConfigs
  };
}
