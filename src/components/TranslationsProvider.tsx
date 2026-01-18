/**
 * INPUT: Server-provided locale and pre-loaded translation resources
 * OUTPUT: I18nextProvider wrapping children with initialized i18n instance
 * POSITION: Root provider in layout.tsx for SSR-safe i18n
 */

'use client';

import { I18nextProvider } from 'react-i18next';
import { createInstance, Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ReactNode, useMemo } from 'react';

interface TranslationsProviderProps {
  children: ReactNode;
  locale: string;
  resources: Resource;
}

/** Prevents hydration mismatches by using server-provided translations */
export default function TranslationsProvider({
  children,
  locale,
  resources,
}: TranslationsProviderProps) {
  const i18n = useMemo(() => {
    const instance = createInstance();

    instance.use(initReactI18next).init({
      lng: locale,
      resources,
      fallbackLng: 'en',
      defaultNS: 'common',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

    return instance;
  }, [locale, resources]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
