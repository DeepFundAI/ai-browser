import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { isDev } from '../utils/constants';
import { store } from '../utils/store';

export function createWindow(rendererURL: string) {
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
