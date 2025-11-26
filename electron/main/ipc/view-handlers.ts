import { ipcMain } from "electron";
import { windowContextManager } from "../services/window-context-manager";
import { successResponse, errorResponse } from "../utils/ipc-response";

export function registerViewHandlers() {
  ipcMain.handle('get-main-view-screenshot', async (event) => {
    try {
      const context = windowContextManager.getContext(event.sender.id);
      if (!context || !context.detailView) {
        console.error('[ViewHandlers] DetailView not found');
        return errorResponse('DetailView not found');
      }

      const image = await context.detailView.webContents.capturePage();
      return successResponse({
        imageBase64: image.toDataURL(),
        imageType: "image/jpeg",
      });
    } catch (error: any) {
      console.error('[ViewHandlers] get-main-view-screenshot error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('set-detail-view-visible', async (event, visible: boolean) => {
    try {
      const context = windowContextManager.getContext(event.sender.id);
      if (!context || !context.detailView) {
        console.error('[ViewHandlers] DetailView not found');
        return errorResponse('DetailView not found for this window');
      }

      context.detailView.setVisible(visible);
      return successResponse({ visible });
    } catch (error: any) {
      console.error('[ViewHandlers] set-detail-view-visible error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('get-current-url', async (event) => {
    try {
      const context = windowContextManager.getContext(event.sender.id);
      if (!context || !context.detailView) {
        return successResponse({ url: '' });
      }
      return successResponse({ url: context.detailView.webContents.getURL() });
    } catch (error: any) {
      console.error('[ViewHandlers] get-current-url error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('navigate-detail-view', async (event, url: string) => {
    try {
      const context = windowContextManager.getContext(event.sender.id);
      if (!context || !context.detailView) {
        console.error('[ViewHandlers] DetailView not found');
        return errorResponse('DetailView not found for this window');
      }

      await context.detailView.webContents.loadURL(url);
      return successResponse({ url });
    } catch (error: any) {
      console.error('[ViewHandlers] navigate-detail-view error:', error);
      return errorResponse(error);
    }
  });
}
