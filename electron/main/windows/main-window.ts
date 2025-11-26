import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { WindowState, type WindowStateInfo } from './window-states';
import { ServerManager } from '../services/server-manager';
import { createWindow } from '../ui/window';
import { isDev } from '../utils/constants';

export class MainWindowManager {
  private window?: BrowserWindow;
  private serverManager: ServerManager;
  private currentState: WindowStateInfo;
  private readonly loadingTimeout = 30000;

  constructor(serverManager: ServerManager) {
    this.serverManager = serverManager;
    this.currentState = {
      state: WindowState.LOADING,
      timestamp: Date.now()
    };
  }

  async createMainWindow(): Promise<BrowserWindow> {
    await this.showLoading();
    this.waitForServerAndLoad();
    return this.window!;
  }

  private async showLoading(): Promise<void> {
    const loadingPath = isDev
      ? path.join(process.cwd(), 'electron/renderer/loading/index.html')
      : path.join(app.getAppPath(), 'renderer/loading/index.html');

    this.window = await createWindow(`file://${loadingPath}`);
    this.updateState(WindowState.LOADING, 'Starting service...');
  }

  private async waitForServerAndLoad(): Promise<void> {
    try {
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Service startup timeout')), this.loadingTimeout);
      });

      const serverPromise = this.serverManager.waitForServer(this.loadingTimeout);
      const isServerReady = await Promise.race([serverPromise, timeoutPromise]);

      if (isServerReady) {
        await this.loadApplication();
      }
    } catch (error) {
      console.error('[MainWindow] Service startup failed:', error);
      await this.handleLoadingError(error as Error);
    }
  }

  private async loadApplication(): Promise<void> {
    if (!this.window) {
      console.error('[MainWindow] Window not initialized');
      return;
    }

    try {
      const appURL = this.serverManager.getServerURL();
      this.updateState(WindowState.READY, 'Service ready, loading application...');
      await this.window.loadURL(appURL);
    } catch (error) {
      console.error('[MainWindow] Application loading failed:', error);
      await this.handleLoadingError(error as Error);
    }
  }

  private async handleLoadingError(error: Error): Promise<void> {
    this.updateState(WindowState.ERROR, `Loading failed: ${error.message}`);

    if (!this.window) return;

    await this.window.webContents.executeJavaScript(`
      const mainText = document.querySelector('.main-text');
      const subText = document.querySelector('.sub-text');
      const progressFill = document.querySelector('.progress-fill');

      if (mainText) mainText.textContent = 'Service startup failed';
      if (subText) subText.textContent = 'Please check network connection or restart application';
      if (progressFill) {
        progressFill.style.background = '#ef4444';
        progressFill.style.width = '100%';
      }
    `).catch(err => console.error('[MainWindow] Failed to update error state:', err));
  }

  private updateState(state: WindowState, message?: string): void {
    this.currentState = {
      state,
      message,
      timestamp: Date.now()
    };
  }

  getCurrentState(): WindowStateInfo {
    return { ...this.currentState };
  }

  getWindow(): BrowserWindow | undefined {
    return this.window;
  }

  async reload(): Promise<void> {
    if (!this.window) return;
    await this.showLoading();
    this.waitForServerAndLoad();
  }
}