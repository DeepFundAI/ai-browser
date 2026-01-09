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

/**
 * Dynamic theme hook with system preference support
 */
export const useTheme = (): UseThemeReturn => {
  const { settings } = useSettingsStore();
  const themeMode = settings?.ui?.theme || 'dark';

  // Track system theme preference
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Listen to system theme changes (only when mode is 'system')
  useEffect(() => {
    if (themeMode !== 'system' || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // Compute effective theme mode
  const effectiveMode = themeMode === 'system' ? systemTheme : themeMode;

  // Update HTML data-theme attribute and class for CSS switching
  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.documentElement.setAttribute('data-theme', effectiveMode);

    // Add/remove 'dark' class for Tailwind dark mode
    if (effectiveMode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [effectiveMode]);

  // Return theme configuration and effective theme
  return {
    themeConfig: effectiveMode === 'dark' ? darkTheme : lightTheme,
    effectiveTheme: effectiveMode,
  };
};
