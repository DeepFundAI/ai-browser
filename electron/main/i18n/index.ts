import { store } from '../utils/store';
import enUS from './locales/en-US';
import zhCN from './locales/zh-CN';

type LocaleMessages = typeof enUS;

const locales: Record<string, LocaleMessages> = {
  'en-US': enUS,
  'zh-CN': zhCN,
};

/**
 * Get nested value from object by dot-notation path
 */
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Get current language from store
 */
export function getCurrentLanguage(): string {
  return store.get('app.language', 'en-US') as string;
}

/**
 * Translate key to current language
 * @param key - Dot-notation key (e.g., 'modal.taskRunning.title')
 * @param fallback - Optional fallback value if key not found
 */
export function t(key: string, fallback?: string): string {
  const lang = getCurrentLanguage();
  const messages = locales[lang] || locales['en-US'];
  const value = getNestedValue(messages, key);

  if (value !== undefined) {
    return value;
  }

  // Fallback to English if key not found in current language
  if (lang !== 'en-US') {
    const enValue = getNestedValue(locales['en-US'], key);
    if (enValue !== undefined) {
      return enValue;
    }
  }

  return fallback || key;
}
