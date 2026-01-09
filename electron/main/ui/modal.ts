import { BrowserWindow, ipcMain, app } from 'electron';
import path from 'node:path';
import { isDev } from '../utils/constants';
import { t } from '../i18n';
import { setWindowUserAgent } from './window';

export interface ModalButton {
  label: string;
  type?: 'default' | 'primary' | 'danger';
  value: string;
}

export interface ModalOptions {
  parent: BrowserWindow;
  title: string;
  message: string;
  detail?: string;
  icon?: 'warning' | 'error' | 'info' | 'success';
  buttons: ModalButton[];
  width?: number;
  height?: number;
}

/**
 * Get preload script path for modal window
 */
function getPreloadPath(): string {
  return isDev
    ? path.join(app.getAppPath(), '..', 'preload', 'modal.cjs')
    : path.join(app.getAppPath(), 'dist', 'electron', 'preload', 'modal.cjs');
}

/**
 * Get modal HTML file path
 */
function getModalHtmlPath(): string {
  return isDev
    ? path.join(process.cwd(), 'electron', 'renderer', 'modal', 'index.html')
    : path.join(app.getAppPath(), 'renderer', 'modal', 'index.html');
}

/**
 * Show a modal dialog window
 * Returns the value of the clicked button, or null if closed without selection
 */
export function showModal(options: ModalOptions): Promise<string | null> {
  return new Promise((resolve) => {
    const { parent, width = 420, height = 280 } = options;

    // Calculate center position relative to parent window
    const parentBounds = parent.getBounds();
    const x = Math.round(parentBounds.x + (parentBounds.width - width) / 2);
    const y = Math.round(parentBounds.y + (parentBounds.height - height) / 2);

    const modalWindow = new BrowserWindow({
      width,
      height,
      x,
      y,
      parent,
      modal: true,
      show: false,
      frame: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      transparent: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: false,
        preload: getPreloadPath(),
      },
    });

    // Set UserAgent with app settings
    setWindowUserAgent(modalWindow);

    // Generate unique channel name for this modal
    const responseChannel = `modal-response-${Date.now()}`;

    // Handle modal response
    const handleResponse = (_event: Electron.IpcMainEvent, value: string | null) => {
      ipcMain.removeListener(responseChannel, handleResponse);
      modalWindow.close();
      resolve(value);
    };

    ipcMain.on(responseChannel, handleResponse);

    // Handle window close without button click
    modalWindow.on('closed', () => {
      ipcMain.removeListener(responseChannel, handleResponse);
      resolve(null);
    });

    // Load modal HTML
    modalWindow.loadFile(getModalHtmlPath());

    // Send options to renderer when ready
    modalWindow.webContents.on('did-finish-load', () => {
      // Only send serializable data (exclude parent BrowserWindow)
      const { parent, ...serializableOptions } = options;
      modalWindow.webContents.send('modal-init', {
        ...serializableOptions,
        responseChannel,
      });
      modalWindow.show();
    });
  });
}

/**
 * Show a close confirmation modal
 * Returns true if user confirms, false otherwise
 */
export function showCloseConfirmModal(parent: BrowserWindow): Promise<boolean> {
  return showModal({
    parent,
    title: t('modal.taskRunning.title'),
    message: t('modal.taskRunning.message'),
    detail: t('modal.taskRunning.detail'),
    icon: 'warning',
    buttons: [
      { label: t('modal.buttons.cancel'), type: 'default', value: 'cancel' },
      { label: t('modal.buttons.stopAndClose'), type: 'danger', value: 'confirm' },
    ],
  }).then((value) => value === 'confirm');
}
