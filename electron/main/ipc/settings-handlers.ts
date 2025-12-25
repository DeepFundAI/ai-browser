import { ipcMain } from 'electron';
import { openSettingsWindow, closeSettingsWindow } from '../ui/settings-window';

export function registerSettingsHandlers() {
  // Open settings window
  ipcMain.handle('settings:open', async () => {
    try {
      openSettingsWindow();
      return { success: true };
    } catch (error: any) {
      console.error('[SettingsHandlers] Failed to open settings window:', error);
      return { success: false, error: error.message };
    }
  });

  // Close settings window
  ipcMain.handle('settings:close', async () => {
    try {
      closeSettingsWindow();
      return { success: true };
    } catch (error: any) {
      console.error('[SettingsHandlers] Failed to close settings window:', error);
      return { success: false, error: error.message };
    }
  });

  console.log('[IPC] Settings handlers registered');
}
