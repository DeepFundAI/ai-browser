import { ipcMain } from "electron";
import { windowContextManager } from "../services/window-context-manager";

export function registerViewHandlers() {
  ipcMain.handle('get-main-view-screenshot', async (event) => {
    try {
      const context = windowContextManager.getContext(event.sender.id);
      if (!context || !context.detailView) {
        console.error('[ViewHandlers] DetailView not found');
        return null;
      }

      const image = await context.detailView.webContents.capturePage();
      return {
        imageBase64: image.toDataURL(),
        imageType: "image/jpeg",
      };
    } catch (error: any) {
      console.error('[ViewHandlers] get-main-view-screenshot error:', error);
      return null;
    }
  });

  ipcMain.handle('set-detail-view-visible', async (event, visible: boolean) => {
    try {
      const context = windowContextManager.getContext(event.sender.id);
      if (!context || !context.detailView) {
        console.error('[ViewHandlers] DetailView not found');
        return { success: false, error: 'DetailView not found for this window' };
      }

      context.detailView.setVisible(visible);
      return { success: true, visible };
    } catch (error: any) {
      console.error('[ViewHandlers] set-detail-view-visible error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-current-url', async (event) => {
    try {
      const context = windowContextManager.getContext(event.sender.id);
      if (!context || !context.detailView) {
        return '';
      }
      return context.detailView.webContents.getURL();
    } catch (error: any) {
      console.error('[ViewHandlers] get-current-url error:', error);
      return '';
    }
  });

  ipcMain.handle('navigate-detail-view', async (event, url: string) => {
    try {
      const context = windowContextManager.getContext(event.sender.id);
      if (!context || !context.detailView) {
        console.error('[ViewHandlers] DetailView not found');
        return { success: false, error: 'DetailView not found for this window' };
      }

      await context.detailView.webContents.loadURL(url);
      return { success: true, url };
    } catch (error: any) {
      console.error('[ViewHandlers] navigate-detail-view error:', error);
      return { success: false, error: error.message };
    }
  });
}
