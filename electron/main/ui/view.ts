import { app, BrowserWindow, clipboard, Menu, shell, WebContentsView } from 'electron';
import path from 'node:path';
import { isDev } from '../utils/constants';
import { store } from '../utils/store';
import { registerClientProtocol } from '../utils/protocol';

interface VideoUrlInfo {
  videoUrl: string;
  timestamp: number;
  platform: string;
}

export function createView(rendererURL: string, preloadFileName: string, id?: string) {
  const preloadPath = isDev
    ? path.join(app.getAppPath(), '..', 'preload', `${preloadFileName}.cjs`)
    : path.join(app.getAppPath(), 'dist', 'electron', 'preload', `${preloadFileName}.cjs`);

  const mainView = new WebContentsView({
    webPreferences: {
      preload: preloadPath,
      contextIsolation: false,
      partition: `persist:detail-view-${id}`,
      webSecurity: true,
    },
  });

  const session = mainView.webContents.session;
  if (!session.protocol.isProtocolHandled('client')) {
    registerClientProtocol(session.protocol);
  }

  mainView.webContents.on("did-finish-load", () => {
    mainView.webContents.setZoomFactor(0.5);
  });

  mainView.webContents.session.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
    const url = details.url;

    if (url.includes('xhscdn.com') && url.includes('/stream/') && url.includes('.mp4')) {
      const videoUrlMap = store.get('videoUrlMap', {}) as Record<string, VideoUrlInfo>;
      videoUrlMap[mainView.webContents.getURL()] = {
        videoUrl: url,
        timestamp: Date.now(),
        platform: 'xiaohongshu'
      };
      store.set('videoUrlMap', videoUrlMap);
    }

    callback({});
  });

  mainView.webContents.loadURL(rendererURL);

  mainView.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error('[View] Load failed:', errorCode, errorDescription);
  });

  mainView.webContents.on("context-menu", (event, params) => {
    const menuTemplate: Electron.MenuItemConstructorOptions[] = [];

    if (params.linkURL) {
      menuTemplate.push(
        { label: "Open Link in New Window", click: () => shell.openExternal(params.linkURL) },
        { label: "Copy Link Address", click: () => clipboard.writeText(params.linkURL) },
        { type: "separator" }
      );
    }

    if (params.mediaType === "image" && params.srcURL) {
      menuTemplate.push(
        { label: "Copy Image Address", click: () => clipboard.writeText(params.srcURL) },
        { label: "Open Image in New Window", click: () => shell.openExternal(params.srcURL) },
        { type: "separator" }
      );
    }

    if (params.selectionText) {
      menuTemplate.push({ label: "Copy", role: "copy" }, { type: "separator" });
    }

    if (params.isEditable) {
      menuTemplate.push(
        { label: "Cut", role: "cut" },
        { label: "Copy", role: "copy" },
        { label: "Paste", role: "paste" },
        { type: "separator" }
      );
    }

    menuTemplate.push(
      { label: "Inspect Element", click: () => mainView.webContents.inspectElement(params.x, params.y) },
      { label: "Refresh", click: () => mainView.webContents.reload() }
    );

    Menu.buildFromTemplate(menuTemplate).popup({
      window: BrowserWindow.fromWebContents(mainView.webContents) || undefined,
    });
  });

  return mainView;
}
