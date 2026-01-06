import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ConfigProvider, App } from 'antd';
import theme from '@/config/theme';
import '@/config/i18n';  // Initialize i18n
import { useLanguage } from '@/hooks/useLanguage';
import { useEffect } from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import { useSettingsStore } from '@/stores/settingsStore';
import i18n from '@/config/i18n';
import { logger } from '@/utils/logger';

export default function MyApp({ Component, pageProps }: AppProps) {
  const { antdLocale } = useLanguage();
  const { setLanguage } = useLanguageStore();
  const { settings, loadSettings } = useSettingsStore();

  // Load settings on mount and subscribe to changes
  useEffect(() => {
    // Initial load
    loadSettings();

    // Listen for settings updates from main process
    const handleSettingsUpdated = async () => {
      logger.debug('Settings updated event received, reloading...', 'App');
      await loadSettings();
    };

    if (typeof window !== 'undefined' && (window as any).api?.onSettingsUpdated) {
      const cleanup = (window as any).api.onSettingsUpdated(handleSettingsUpdated);
      return cleanup;
    }
  }, [loadSettings]);

  // Sync language when settings change
  useEffect(() => {
    if (settings?.general?.language) {
      const language = settings.general.language;
      if (i18n.language !== language) {
        i18n.changeLanguage(language);
        setLanguage(language);
        logger.info(`Language synced to: ${language}`, 'App');
      }
    }
  }, [settings, setLanguage]);

  return (
    <ConfigProvider theme={theme} locale={antdLocale}>
      <App className="h-full">
        <Component {...pageProps} />
      </App>
    </ConfigProvider>
  );
}
