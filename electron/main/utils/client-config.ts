import { BrowserWindow } from 'electron';
import { store } from './store';

/**
 * Client Configuration Manager
 * Manages app configuration transmission to renderer via Cookies
 */

export interface ClientConfig {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  density: 'compact' | 'comfortable' | 'spacious';
  language: 'en' | 'zh';
}

/**
 * Load current configuration from store
 */
export function loadClientConfig(): ClientConfig {
  const settings = store.get('appSettings') as any;

  return {
    theme: settings?.ui?.theme || 'dark',
    fontSize: settings?.ui?.fontSize || 14,
    density: settings?.ui?.density || 'comfortable',
    language: settings?.general?.language || 'en',
  };
}

/**
 * Apply configuration to a window via Cookies
 */
export function applyClientConfigToWindow(win: BrowserWindow): void {
  const config = loadClientConfig();

  console.log('[ClientConfig] Applying config to window:', config);

  // Set configuration cookies
  const cookies = [
    { name: 'app-theme', value: config.theme },
    { name: 'app-fontsize', value: String(config.fontSize) },
    { name: 'app-density', value: config.density },
    { name: 'app-language', value: config.language },
  ];

  cookies.forEach(({ name, value }) => {
    win.webContents.session.cookies.set({
      url: 'http://localhost',
      name,
      value,
      sameSite: 'no_restriction',
    }).catch(err => {
      console.error(`[ClientConfig] Failed to set cookie ${name}:`, err);
    });
  });
}

/**
 * Update configuration for all open windows
 */
export function updateAllWindowsConfig(): void {
  const allWindows = BrowserWindow.getAllWindows();
  console.log(`[ClientConfig] Updating config for ${allWindows.length} window(s)`);

  allWindows.forEach(win => {
    if (!win.isDestroyed()) {
      applyClientConfigToWindow(win);
      // Reload page to apply new config
      win.webContents.reload();
    }
  });
}
