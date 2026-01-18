/**
 * Global settings store
 * INPUT: Settings from Electron Store via IPC
 * OUTPUT: Reactive settings state for all components
 * POSITION: Central store for application settings
 */

import { create } from 'zustand';
import type { AppSettings } from '@/models/settings';
import { getDefaultSettings } from '@/config/settings-defaults';
import { logger } from '@/utils/logger';

interface SettingsStore {
  settings: AppSettings | null;
  loading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: AppSettings) => void;
  saveSettings: (settings: AppSettings) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  loading: true,

  loadSettings: async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).api) {
        const response = await (window as any).api.getAppSettings();
        const settings = response?.data || response || getDefaultSettings();
        set({ settings, loading: false });
        logger.info('Settings loaded into store', 'SettingsStore');
      }
    } catch (error) {
      logger.error('Failed to load settings', error, 'SettingsStore');
      set({ settings: getDefaultSettings(), loading: false });
    }
  },

  updateSettings: (settings: AppSettings) => {
    set({ settings });
    logger.debug('Settings updated in store', 'SettingsStore');
  },

  saveSettings: async (settings: AppSettings) => {
    try {
      if (typeof window !== 'undefined' && (window as any).api) {
        await (window as any).api.saveAppSettings(settings);
        set({ settings });
        logger.info('Settings saved to store', 'SettingsStore');
      }
    } catch (error) {
      logger.error('Failed to save settings', error, 'SettingsStore');
      throw error;
    }
  },
}));
