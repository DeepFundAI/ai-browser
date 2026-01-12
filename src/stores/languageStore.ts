import { create } from 'zustand';

interface LanguageStore {
  language: string;
  setLanguage: (lang: string) => void;
}

const getInitialLanguage = () => {
  // On SSR, return placeholder (will be overridden on client)
  if (typeof window === 'undefined') {
    console.log('[LANG_DEBUG] languageStore: SSR mode, returning placeholder en');
    return 'en';
  }

  // On client: Priority 1 - Read from window.__INITIAL_CONFIG__ (set by inline script)
  const initialConfig = (window as any).__INITIAL_CONFIG__;
  if (initialConfig?.language) {
    console.log('[LANG_DEBUG] languageStore: Using window.__INITIAL_CONFIG__.language:', initialConfig.language);
    return initialConfig.language;
  }

  // Priority 2: Read from HTML data attribute (fallback)
  const htmlLang = document.documentElement.dataset.initialLanguage;
  if (htmlLang && (htmlLang === 'zh' || htmlLang === 'en')) {
    console.log('[LANG_DEBUG] languageStore: Using HTML data attribute:', htmlLang);
    return htmlLang;
  }

  // Priority 3: Fallback to localStorage
  const stored = localStorage.getItem('i18nextLng');
  console.log('[LANG_DEBUG] languageStore: Fallback to localStorage:', stored);
  return stored || 'en';
};

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: getInitialLanguage(),
  setLanguage: (lang) => {
    console.log('[LANG_DEBUG] languageStore: setLanguage called with:', lang);
    set({ language: lang });
  },
}));
