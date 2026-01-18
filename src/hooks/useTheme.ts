/**
 * Theme switching hook with system theme support
 * INPUT: Settings from useSettingsStore (ui.theme)
 * OUTPUT: Current effective theme configuration
 * POSITION: Global theme provider for _app.tsx
 */

import { useState, useEffect } from 'react';
import { ThemeConfig } from 'antd';
import { darkTheme, lightTheme } from '@/config/theme';
import { useSettingsStore } from '@/stores/settingsStore';

export interface UseThemeReturn {
  themeConfig: ThemeConfig;
  effectiveTheme: 'light' | 'dark';
}

const getInitialTheme = (): 'light' | 'dark' | 'system' => {
  if (typeof window === 'undefined') return 'dark';

  const initialConfig = (window as any).__INITIAL_CONFIG__;
  if (initialConfig?.theme) {
    return initialConfig.theme as 'light' | 'dark' | 'system';
  }

  const htmlTheme = document.documentElement.getAttribute('data-theme');
  if (htmlTheme === 'light' || htmlTheme === 'dark') {
    return htmlTheme;
  }

  return 'dark';
};

export const useTheme = (): UseThemeReturn => {
  const { settings } = useSettingsStore();
  const themeMode = settings?.ui?.theme || getInitialTheme();

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (themeMode !== 'system' || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  const effectiveMode = themeMode === 'system' ? systemTheme : themeMode;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.documentElement.setAttribute('data-theme', effectiveMode);

    if (effectiveMode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [effectiveMode]);

  return {
    themeConfig: effectiveMode === 'dark' ? darkTheme : lightTheme,
    effectiveTheme: effectiveMode,
  };
};
