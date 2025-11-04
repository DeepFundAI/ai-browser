import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ConfigProvider, App } from 'antd';
import theme from '@/config/themeConfig';
import '@/lib/i18n';  // Initialize i18n
import { useLanguage } from '@/hooks/useLanguage';
import { useEffect } from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import i18n from '@/lib/i18n';

export default function MyApp({ Component, pageProps }: AppProps) {
  const { antdLocale } = useLanguage();
  const { setLanguage } = useLanguageStore();

  // Load saved language from Electron store on mount
  useEffect(() => {
    const loadSavedLanguage = async () => {
      if (typeof window !== 'undefined' && (window as any).api) {
        try {
          const savedLanguage = await (window as any).api.invoke('config:get-language');
          if (savedLanguage) {
            await i18n.changeLanguage(savedLanguage);
            setLanguage(savedLanguage);
            console.log(`[App] Loaded saved language: ${savedLanguage}`);
          }
        } catch (error) {
          console.error('[App] Failed to load saved language:', error);
        }
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
