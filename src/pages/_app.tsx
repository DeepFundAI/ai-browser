import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ConfigProvider, App } from 'antd';
import theme from '@/config/theme';
import '@/config/i18n';  // Initialize i18n
import { useLanguage } from '@/hooks/useLanguage';
import { useEffect } from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import i18n from '@/config/i18n';
import { logger } from '@/utils/logger';

export default function MyApp({ Component, pageProps }: AppProps) {
  const { antdLocale } = useLanguage();
  const { setLanguage } = useLanguageStore();

  // Load saved language from Electron store on mount
  useEffect(() => {
    const loadSavedLanguage = async () => {
      if (typeof window !== 'undefined' && (window as any).api) {
        const response = await (window as any).api.getAppSettings();
        const language = response?.data?.general?.language || response?.general?.language || 'en';
        await i18n.changeLanguage(language);
        setLanguage(language);
        logger.info(`Loaded saved language: ${language}`, 'App');
      }
    };

    loadSavedLanguage();
  }, [setLanguage]);

  return (
    <ConfigProvider theme={theme} locale={antdLocale}>
      <App className="h-full">
        <Component {...pageProps} />
      </App>
    </ConfigProvider>
  );
}
