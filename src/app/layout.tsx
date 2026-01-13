import "@/styles/globals.css";
import type { Metadata } from "next";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { Providers } from "./providers";
import { cookies } from 'next/headers';
import TranslationsProvider from '@/components/TranslationsProvider';
import { resources } from '@/config/translations';

export const metadata: Metadata = {
  title: "AI Browser",
  description: "AI-powered browser application",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const theme = cookieStore.get('app-theme')?.value || 'dark';
  const fontSize = cookieStore.get('app-fontsize')?.value || '14';
  const language = cookieStore.get('app-language')?.value || 'en';

  const themeClass = theme === 'dark' || theme === 'system' ? 'dark' : 'light';
  const dataTheme = theme === 'system' ? 'dark' : theme;

  const initScript = `
    (function() {
      const serverTheme = '${theme}';
      const serverLanguage = '${language}';
      const serverFontSize = ${fontSize};

      window.__INITIAL_CONFIG__ = {
        theme: serverTheme,
        fontSize: serverFontSize,
        language: serverLanguage
      };

      try {
        localStorage.setItem('i18nextLng', serverLanguage);
      } catch (e) {
        console.error('Failed to set localStorage:', e);
      }

      if (serverTheme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', systemTheme);
        document.documentElement.classList.remove('dark', 'light');
        document.documentElement.classList.add(systemTheme);
      }
    })();
  `;

  return (
    <html
      lang={language}
      data-theme={dataTheme}
      className={themeClass}
      style={{ fontSize: `${fontSize}px`, height: '100vh' }}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
      </head>
      <body suppressHydrationWarning className="h-full">
        <AntdRegistry>
          <TranslationsProvider locale={language} resources={resources}>
            <Providers initialLanguage={language} initialTheme={theme} initialFontSize={parseInt(fontSize)}>
              {children}
            </Providers>
          </TranslationsProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
