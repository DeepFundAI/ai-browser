import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '@/stores/languageStore';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';

const antdLocales = {
  'zh': zhCN,
  'en': enUS,
};

export const useLanguage = () => {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  // Track mount state for hydration safety checks
  useEffect(() => {
    setMounted(true);
  }, []);

  console.log('[LANG_DEBUG] useLanguage: Hook called, i18n.language:', i18n.language, 'store.language:', language);

  // Sync i18n with store on mount
  useEffect(() => {
    console.log('[LANG_DEBUG] useLanguage: Effect triggered, i18n.language:', i18n.language, 'store.language:', language);
    if (i18n.language !== language) {
      console.log('[LANG_DEBUG] useLanguage: Mismatch detected! Changing i18n language from', i18n.language, 'to', language);
      i18n.changeLanguage(language);
    }
  }, [i18n, language]);

  const changeLanguage = async (lang: string) => {
    // Update both i18n and store
    await i18n.changeLanguage(lang);
    setLanguage(lang);

    // Notify Electron main process (if needed for menu, etc.)
    if (typeof window !== 'undefined' && (window as any).api) {
      await (window as any).api.invoke('language-changed', lang);
    }
  };

  return {
    language,
    changeLanguage,
    antdLocale: antdLocales[language as keyof typeof antdLocales] || enUS,
    // Return actual t function directly - hydration handled by suppressHydrationWarning on elements
    t: i18n.t,
    mounted,
  };
};
