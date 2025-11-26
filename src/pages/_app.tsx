import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ConfigProvider, App } from 'antd';
import theme from '@/config/theme';
import '@/config/i18n';  // Initialize i18n
import { useLanguage } from '@/hooks/useLanguage';
import { useEffect } from 'react';
import { useLanguageStore } from '@/stores/languageStore';
import i18n from '@/config/i18n';

export default function MyApp({ Component, pageProps }: AppProps) {
  const { antdLocale } = useLanguage();
  const { setLanguage } = useLanguageStore();

  // Load saved language from Electron store on mount
  useEffect(() => {
    const loadSavedLanguage = async () => {
      if (typeof window !== 'undefined' && (window as any).api) {
        const response = await (window as any).api.invoke('config:get-language');
        if (response?.success && response.data?.language) {
          await i18n.changeLanguage(response.data.language);
          setLanguage(response.data.language);
          console.log(`[App] Loaded saved language: ${response.data.language}`);
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
