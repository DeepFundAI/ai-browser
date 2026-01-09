import React from 'react';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import Document, { Head, Html, Main, NextScript } from 'next/document';
import type { DocumentContext } from 'next/document';

// Inline script to parse config from UserAgent and apply settings
const initScript = `
  (function() {
    // Parse config from UserAgent (format: theme/dark fontsize/14 density/comfortable)
    let theme = 'dark';
    let fontSize = 14;

    try {
      const ua = navigator.userAgent;

      // Extract theme
      const themeMatch = ua.match(/theme\\/([a-z]+)/);
      if (themeMatch?.[1]) {
        const themeValue = themeMatch[1];

        if (themeValue === 'system') {
          theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } else {
          theme = themeValue;
        }
      }

      // Extract fontSize
      const fontSizeMatch = ua.match(/fontsize\\/(\\d+)/);
      if (fontSizeMatch?.[1]) {
        fontSize = parseInt(fontSizeMatch[1], 10);
      }
    } catch (e) {
      console.error('[Document] Failed to parse UserAgent config:', e);
    }

    // Apply theme class and attribute
    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }

    // Apply font size
    document.documentElement.style.fontSize = fontSize + 'px';
  })();
`;

const MyDocument = () => (
  <Html lang="en">
    <Head>
      <script dangerouslySetInnerHTML={{ __html: initScript }} />
    </Head>
    <body>
      <Main />
      <NextScript />
    </body>
  </Html>
);

MyDocument.getInitialProps = async (ctx: DocumentContext) => {
  const cache = createCache();
  const originalRenderPage = ctx.renderPage;
  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) => (props) => (
        <StyleProvider cache={cache}>
          <App {...props} />
        </StyleProvider>
      ),
    });

  const initialProps = await Document.getInitialProps(ctx);
  const style = extractStyle(cache, true);
  return {
    ...initialProps,
    styles: (
      <>
        {initialProps.styles}
        <style dangerouslySetInnerHTML={{ __html: style }} />
      </>
    ),
  };
};

export default MyDocument;