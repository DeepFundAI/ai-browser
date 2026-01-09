import { app, BrowserWindow, systemPreferences } from 'electron';
import path from 'node:path';
import { isDev } from '../utils/constants';
import { store } from '../utils/store';

/**
 * Set UserAgent with app settings for any window
 */
export function setWindowUserAgent(win: BrowserWindow) {
  const settings = store.get('appSettings') as any;
  const theme = settings?.ui?.theme || 'dark';
  const fontSize = settings?.ui?.fontSize || 14;
  const density = settings?.ui?.density || 'comfortable';

  const defaultUA = app.userAgentFallback || 'Mozilla/5.0';
  const customUA = `${defaultUA} theme/${theme} fontsize/${fontSize} density/${density}`;

  win.webContents.setUserAgent(customUA);
}

async function setupMacPermissions() {
  // macOS requires explicit microphone permission request
  if (process.platform === 'darwin') {
    const status = systemPreferences.getMediaAccessStatus('microphone');
    console.log('[Window] Current microphone permission status:', status);

    if (status !== 'granted') {
      const result = await systemPreferences.askForMediaAccess('microphone');
      console.log('[Window] Permission request result:', result);
    }
  }
}

export async function createWindow(rendererURL: string) {
  const preloadPath = isDev
    ? path.join(app.getAppPath(), '..', 'preload', 'index.cjs')
    : path.join(app.getAppPath(), 'dist', 'electron', 'preload', 'index.cjs');

  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    useContentSize: true,
    frame: process.platform !== 'darwin',
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default',
    resizable: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: false,
      webSecurity: true,
      zoomFactor: 1.0,
    },
  });

  // Set custom UserAgent with config
  setWindowUserAgent(win);

  win.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
    // Allow media permissions (includes microphone and camera)
    if (permission === 'media') {
      console.log(`[Window] Granting ${permission} permission`);
      setupMacPermissions();
      callback(true);
    } else {
      console.log(`[Window] Denying ${permission} permission`);
      callback(false);
    }
  });

  win.loadURL(rendererURL).catch(err => {
    console.error('[Window] Failed to load URL:', err);
  });

  win.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error('[Window] Load failed:', errorCode, errorDescription);
  });

  const boundsListener = () => store.set('bounds', win.getBounds());
  win.on('moved', boundsListener);
  win.on('resized', boundsListener);

  return win;
}
