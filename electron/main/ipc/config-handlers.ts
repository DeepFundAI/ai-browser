/**
 * Unified settings IPC handlers
 * INPUT: IPC requests from renderer
 * OUTPUT: AppSettings read/write operations
 * POSITION: Bridge between renderer and settings manager
 */

import { ipcMain, BrowserWindow } from "electron";
import { SettingsManager } from "../utils/settings-manager";
import { windowContextManager } from "../services/window-context-manager";
import { successResponse, errorResponse } from "../utils/ipc-response";
import type { AppSettings } from "../models";

export function registerConfigHandlers() {
  const settingsManager = SettingsManager.getInstance();

  // Get complete app settings
  ipcMain.handle('settings:get', async () => {
    try {
      const settings = settingsManager.getAppSettings();
      return successResponse(settings);
    } catch (error: any) {
      console.error('[ConfigHandlers] Failed to get settings:', error);
      return errorResponse(error);
    }
  });

  // Save complete app settings
  ipcMain.handle('settings:save', async (_event, settings: AppSettings) => {
    try {
      settingsManager.saveAppSettings(settings);

      // Notify all EkoService instances to reload config
      const contexts = windowContextManager.getAllContexts();
      contexts.forEach(context => {
        if (context.ekoService) {
          context.ekoService.reloadConfig();
        }
      });

      // Broadcast lightweight notification to all windows
      // Components should reload their own config after receiving this event
      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed()) {
          win.webContents.send('settings-updated', { timestamp: Date.now() });
        }
      });

      console.log('[ConfigHandlers] Settings saved and notification broadcasted');
      return successResponse();
    } catch (error: any) {
      console.error('[ConfigHandlers] Failed to save settings:', error);
      return errorResponse(error);
    }
  });

  // Language change handler (for i18n)
  ipcMain.handle('language-changed', async (_event, language: string) => {
    try {
      const settings = settingsManager.getAppSettings();
      settings.general.language = language as 'en' | 'zh';
      settingsManager.saveAppSettings(settings);
      console.log(`[ConfigHandlers] Language changed to: ${language}`);
      return successResponse();
    } catch (error: any) {
      console.error('[ConfigHandlers] Failed to change language:', error);
      return errorResponse(error);
    }
  });

  console.log('[IPC] Config handlers registered');
}
