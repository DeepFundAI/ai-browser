/**
 * INPUT: None (client-only initialization)
 * OUTPUT: Initialized i18n instance for client components
 * POSITION: Client-side i18n config, must NOT be imported on server
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './translations';

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
