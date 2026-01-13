/**
 * INPUT: Server-provided initial config (language, theme, fontSize) from cookies
 * OUTPUT: ConfigProvider and App context for all child components
 * POSITION: Root client provider in layout.tsx wrapping entire application
 */

'use client';

import { ConfigProvider, App } from 'antd';
import { useLanguage } from '@/hooks/useLanguage';
import { useEffect, useMemo, useState } from 'react';
import { darkTheme, lightTheme } from '@/config/theme';
import { useLanguageStore } from '@/stores/languageStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { logger } from '@/utils/logger';
import { taskStorage } from '@/services/task-storage';

interface ProvidersProps {
  children: React.ReactNode;
  initialLanguage: string;
  initialTheme: string;
  initialFontSize: number;
}

export function Providers({
  children,
  initialLanguage,
  initialTheme,
  initialFontSize,
}: ProvidersProps) {
  const { setLanguage } = useLanguageStore();
  const { settings, loadSettings } = useSettingsStore();

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Use settings store values if available, fallback to initial props
  const currentTheme = settings?.ui?.theme || initialTheme;
  const currentFontSize = settings?.ui?.fontSize || initialFontSize;
  const currentLanguage = settings?.general?.language || initialLanguage;

  const themeConfig = useMemo(() => {
    const effectiveTheme = currentTheme === 'system' ? systemTheme : currentTheme;
    return effectiveTheme === 'dark' ? darkTheme : lightTheme;
  }, [currentTheme, systemTheme]);

  useEffect(() => {
    if (currentTheme !== 'system' || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [currentTheme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const effectiveTheme = currentTheme === 'system' ? systemTheme : currentTheme;
    document.documentElement.setAttribute('data-theme', effectiveTheme);

    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [currentTheme, systemTheme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__INITIAL_CONFIG__ = {
        theme: currentTheme,
        fontSize: currentFontSize,
        language: currentLanguage,
      };
    }

    setLanguage(currentLanguage);
  }, [currentLanguage, currentTheme, currentFontSize, setLanguage]);

  const { antdLocale } = useLanguage();

  useEffect(() => {
    const initializeApp = async () => {
      await loadSettings();

      const settings = useSettingsStore.getState().settings;
      if (settings?.chat?.autoSaveHistory && settings?.chat?.historyRetentionDays) {
        taskStorage.cleanupExpiredTasks(settings.chat.historyRetentionDays)
          .then(({ deletedCount }) => {
            if (deletedCount > 0) {
              logger.info(`Cleaned up ${deletedCount} expired tasks`, 'App');
            }
          })
          .catch(error => {
            logger.error('Task cleanup failed', error, 'App');
          });
      }
    };

    initializeApp();

    const handleSettingsUpdated = async () => {
      logger.debug('Settings updated event received, reloading...', 'App');
      await loadSettings();
    };

    const handleUIConfigUpdated = async () => {
      logger.debug('UI config updated, applying changes...', 'App');
      await loadSettings();

      // Update document properties
      if (typeof window !== 'undefined') {
        const newSettings = useSettingsStore.getState().settings;
        if (newSettings?.ui?.fontSize) {
          document.documentElement.style.fontSize = `${newSettings.ui.fontSize}px`;
        }
        if (newSettings?.general?.language) {
          setLanguage(newSettings.general.language);
        }
      }
    };

    let cleanupSettings: (() => void) | undefined;
    let cleanupUIConfig: (() => void) | undefined;

    if (typeof window !== 'undefined' && (window as any).api) {
      cleanupSettings = (window as any).api.onSettingsUpdated?.(handleSettingsUpdated);
      cleanupUIConfig = (window as any).api.onUIConfigUpdated?.(handleUIConfigUpdated);
    }

    return () => {
      cleanupSettings?.();
      cleanupUIConfig?.();
    };
  }, [loadSettings, setLanguage]);

  useEffect(() => {
    if (settings?.general?.language) {
      setLanguage(settings.general.language);
      logger.debug(`Language store synced to: ${settings.general.language}`, 'App');
    }
  }, [settings?.general?.language, setLanguage]);

  return (
    <ConfigProvider theme={themeConfig} locale={antdLocale}>
      <App className="h-full">
        {children}
      </App>
    </ConfigProvider>
  );
}
