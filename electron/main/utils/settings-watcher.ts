/**
 * Centralized settings change listener for main process
 * INPUT: Settings changes from SettingsManager
 * OUTPUT: Trigger system operations (auto-start, window behavior, proxy, etc.)
 * POSITION: Bridge between settings storage and system operations
 */

import { app, BrowserWindow } from 'electron';
import type { AppSettings, GeneralSettings, NetworkSettings, UISettings } from '../models';
import { SettingsManager } from './settings-manager';
import { setWindowUserAgent } from '../ui/window';

/**
 * Singleton settings watcher
 * Monitors settings changes and applies them to system
 */
export class SettingsWatcher {
  private static instance: SettingsWatcher;
  private currentSettings: AppSettings | null = null;
  private mainWindow: BrowserWindow | null = null;

  private constructor() {}

  public static getInstance(): SettingsWatcher {
    if (!SettingsWatcher.instance) {
      SettingsWatcher.instance = new SettingsWatcher();
    }
    return SettingsWatcher.instance;
  }

  /**
   * Initialize watcher and apply all current settings
   */
  public initialize(window?: BrowserWindow): void {
    this.mainWindow = window || null;
    this.currentSettings = SettingsManager.getInstance().getAppSettings();
    this.applyAllSettings();
    console.log('[SettingsWatcher] Initialized and applied all settings');
  }

  /**
   * Check if app should start minimized
   * Only applies when app is auto-started, not when manually launched
   */
  public shouldStartMinimized(): boolean {
    const settings = SettingsManager.getInstance().getAppSettings();
    const { autoStart, startMinimized } = settings.general.startup;

    // Only minimize if both conditions are met:
    // 1. autoStart is enabled
    // 2. startMinimized is enabled
    // 3. app was actually launched at login (checked via app.getLoginItemSettings)
    if (!autoStart || !startMinimized) {
      return false;
    }

    // Check if app was launched at login
    const loginItemSettings = app.getLoginItemSettings();
    return loginItemSettings.wasOpenedAtLogin;
  }

  /**
   * Set main window reference (for window-related settings)
   */
  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Handle settings changes (called when settings are saved)
   */
  public onSettingsChanged(newSettings: AppSettings): void {
    if (!this.currentSettings) {
      console.warn('[SettingsWatcher] Not initialized, initializing now');
      this.currentSettings = newSettings;
      this.applyAllSettings();
      return;
    }

    const oldSettings = this.currentSettings;

    // Handle different setting categories
    this.handleGeneralChanges(newSettings.general, oldSettings.general);
    this.handleNetworkChanges(newSettings.network, oldSettings.network);
    this.handleUIChanges(newSettings.ui, oldSettings.ui);

    this.currentSettings = newSettings;
    console.log('[SettingsWatcher] Settings changes applied');
  }

  /**
   * Apply all current settings (used on app startup)
   */
  private applyAllSettings(): void {
    if (!this.currentSettings) return;

    this.applyGeneralSettings(this.currentSettings.general);
    this.applyNetworkSettings(this.currentSettings.network);
    this.applyUISettings(this.currentSettings.ui);
  }

  /**
   * Handle General settings changes
   */
  private handleGeneralChanges(newGeneral: GeneralSettings, oldGeneral: GeneralSettings): void {
    // Auto Start
    if (newGeneral.startup.autoStart !== oldGeneral.startup.autoStart) {
      this.applyAutoStart(newGeneral.startup.autoStart);
    }

    // Start Minimized (only applies on next app launch, no runtime change needed)

    // Minimize to Tray
    if (newGeneral.window.minimizeToTray !== oldGeneral.window.minimizeToTray) {
      this.updateMinimizeBehavior(newGeneral.window.minimizeToTray);
    }

    // Close to Tray (handled by setupMainWindowCloseHandler, no dynamic update needed)
  }

  /**
   * Apply all General settings
   */
  private applyGeneralSettings(general: GeneralSettings): void {
    this.applyAutoStart(general.startup.autoStart);
    this.updateMinimizeBehavior(general.window.minimizeToTray);
  }

  /**
   * Apply auto-start setting
   */
  private applyAutoStart(enabled: boolean): void {
    try {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: false
      });
      console.log(`[SettingsWatcher] Auto start ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('[SettingsWatcher] Failed to set auto start:', error);
    }
  }

  /**
   * Update minimize behavior (minimize to tray vs taskbar)
   */
  private updateMinimizeBehavior(minimizeToTray: boolean): void {
    if (!this.mainWindow) {
      console.warn('[SettingsWatcher] Main window not set, cannot update minimize behavior');
      return;
    }

    // Remove existing minimize listeners
    this.mainWindow.removeAllListeners('minimize');

    if (minimizeToTray) {
      // Hide to tray on minimize
      const minimizeHandler = (event: Electron.Event) => {
        event.preventDefault();
        this.mainWindow?.hide();
        console.log('[SettingsWatcher] Minimized to tray');
      };
      (this.mainWindow as any).on('minimize', minimizeHandler);
      console.log('[SettingsWatcher] Minimize to tray enabled');
    } else {
      // Default minimize behavior (to taskbar)
      console.log('[SettingsWatcher] Minimize to taskbar enabled');
    }
  }

  /**
   * Handle Network settings changes
   */
  private handleNetworkChanges(newNetwork: NetworkSettings, oldNetwork: NetworkSettings): void {
    // Proxy settings
    if (JSON.stringify(newNetwork.proxy) !== JSON.stringify(oldNetwork.proxy)) {
      this.applyProxySettings(newNetwork.proxy);
    }

    // Other network settings (timeout, retry, user-agent) are handled by request layer
  }

  /**
   * Apply all Network settings
   */
  private applyNetworkSettings(network: NetworkSettings): void {
    this.applyProxySettings(network.proxy);
  }

  /**
   * Apply proxy settings
   */
  private applyProxySettings(proxy: NetworkSettings['proxy']): void {
    // TODO: Implement proxy configuration
    // Will be implemented when Network settings are integrated
    console.log('[SettingsWatcher] Proxy settings:', proxy.enabled ? 'enabled' : 'disabled');
  }

  /**
   * Handle UI settings changes
   */
  private handleUIChanges(newUI: UISettings, oldUI: UISettings): void {
    // Check if theme, fontSize, or density changed
    const themeChanged = newUI.theme !== oldUI.theme;
    const fontSizeChanged = newUI.fontSize !== oldUI.fontSize;
    const densityChanged = newUI.density !== oldUI.density;

    if (themeChanged || fontSizeChanged || densityChanged) {
      console.log('[SettingsWatcher] UI settings changed, updating all windows UserAgent');
      this.updateAllWindowsUserAgent();
    }
  }

  /**
   * Apply all UI settings
   */
  private applyUISettings(ui: UISettings): void {
    // UI settings are primarily handled by renderer process
    // Main process doesn't need to apply UI settings
    void ui;
  }

  /**
   * Update UserAgent for all open windows
   * Called when UI settings (theme, fontSize, density) change
   */
  private updateAllWindowsUserAgent(): void {
    const allWindows = BrowserWindow.getAllWindows();

    if (allWindows.length === 0) {
      return;
    }

    allWindows.forEach((window) => {
      if (!window.isDestroyed()) {
        setWindowUserAgent(window);
      }
    });

    console.log(`[SettingsWatcher] Updated UserAgent for ${allWindows.length} window(s)`);
  }

  /**
   * Get current settings (read-only access for other modules)
   */
  public getCurrentSettings(): AppSettings | null {
    return this.currentSettings;
  }
}

// Export singleton instance
export const settingsWatcher = SettingsWatcher.getInstance();
