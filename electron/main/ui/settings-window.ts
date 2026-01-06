import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { isDev } from '../utils/constants';
import { store } from '../utils/store';

let settingsWindow: BrowserWindow | null = null;

/**
 * Opens the settings window
 * Implements singleton pattern to prevent duplicate windows
 * @param panel - Optional panel to navigate to (e.g., 'providers', 'general')
 */
export function openSettingsWindow(panel?: string) {
  // Reuse existing window if available
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    // Navigate to specific panel if provided
    if (panel) {
      const hash = `#${panel}`;
      const currentURL = settingsWindow.webContents.getURL();
      const baseURL = currentURL.split('#')[0];
      settingsWindow.loadURL(`${baseURL}${hash}`).catch(err => {
        console.error('[Settings Window] Failed to navigate to panel:', err);
      });
    }
    return;
  }

  const preloadPath = isDev
    ? path.join(app.getAppPath(), '..', 'preload', 'index.cjs')
    : path.join(app.getAppPath(), 'dist', 'electron', 'preload', 'index.cjs');

  // Get saved window bounds or use defaults
  const savedBounds = store.get('settingsWindowBounds');
  const defaultBounds = {
    width: 1200,
    height: 800,
  };

  settingsWindow = new BrowserWindow({
    ...defaultBounds,
    ...savedBounds,
    minWidth: 900,
    minHeight: 600,
    title: 'Settings',
    // macOS style: hidden inset title bar with traffic lights
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: process.platform !== 'darwin',
    // Traffic light position for macOS
    trafficLightPosition: process.platform === 'darwin' ? { x: 16, y: 16 } : undefined,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: false,
      webSecurity: true,
      zoomFactor: 1.0,
    },
  });

  // Load settings page with optional panel hash
  const hash = panel ? `#${panel}` : '';
  const settingsURL = isDev
    ? `http://localhost:5173/settings${hash}`
    : `client://./settings.html${hash}`;

  settingsWindow.loadURL(settingsURL).catch(err => {
    console.error('[Settings Window] Failed to load URL:', err);
  });

  // Handle load errors
  settingsWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error('[Settings Window] Load failed:', errorCode, errorDescription);
  });

  // Save window bounds when moved or resized
  const saveBounds = () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      store.set('settingsWindowBounds', settingsWindow.getBounds());
    }
  };

  settingsWindow.on('moved', saveBounds);
  settingsWindow.on('resized', saveBounds);

  // Clean up reference when window is closed
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

/**
 * Closes the settings window if it exists
 */
export function closeSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close();
  }
}

/**
 * Gets the settings window instance (may be null)
 */
export function getSettingsWindow(): BrowserWindow | null {
  return settingsWindow && !settingsWindow.isDestroyed() ? settingsWindow : null;
}
