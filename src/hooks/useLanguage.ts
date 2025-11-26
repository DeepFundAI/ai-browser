import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '@/stores/languageStore';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';

const antdLocales = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

export const useLanguage = () => {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useLanguageStore();

  // Sync i18n with store on mount
  useEffect(() => {
    if (i18n.language !== language) {
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
    t: i18n.t,
  };
};
