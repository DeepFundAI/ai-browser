/**
 * input: windowContextManager for accessing TabManager
 * output: IPC handlers for view operations
 * pos: IPC layer for detail view control (now using TabManager)
 */

import { ipcMain } from "electron";
import { windowContextManager } from "../services/window-context-manager";
import { successResponse, errorResponse } from "../utils/ipc-response";

export function registerViewHandlers() {
  ipcMain.handle('get-main-view-screenshot', async (event) => {
    try {
      const context = windowContextManager.getContext(event.sender.id);
      const activeView = context?.tabManager?.getActiveView();
      if (!activeView) {
        console.error('[ViewHandlers] No active view found');
        return errorResponse('No active view found');
      }

      const image = await activeView.webContents.capturePage();
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
      if (!context?.tabManager) {
        console.error('[ViewHandlers] TabManager not found');
        return errorResponse('TabManager not found for this window');
      }

      context.tabManager.setVisible(visible);
      return successResponse({ visible });
    } catch (error: any) {
      console.error('[ViewHandlers] set-detail-view-visible error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('get-current-url', async (event) => {
    try {
      const context = windowContextManager.getContext(event.sender.id);
      const activeView = context?.tabManager?.getActiveView();
      if (!activeView) {
        return successResponse({ url: '' });
      }
      return successResponse({ url: activeView.webContents.getURL() });
    } catch (error: any) {
      console.error('[ViewHandlers] get-current-url error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('navigate-detail-view', async (event, url: string) => {
    try {
      const context = windowContextManager.getContext(event.sender.id);
      if (!context?.tabManager) {
        console.error('[ViewHandlers] TabManager not found');
        return errorResponse('TabManager not found for this window');
      }

      await context.tabManager.navigateTo(url);
      return successResponse({ url });
    } catch (error: any) {
      console.error('[ViewHandlers] navigate-detail-view error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('refresh-detail-view', async (event) => {
    try {
      const context = windowContextManager.getContext(event.sender.id);
      const activeView = context?.tabManager?.getActiveView();
      if (!activeView) {
        console.error('[ViewHandlers] No active view found');
        return errorResponse('No active view found');
      }

      activeView.webContents.reload();
      return successResponse({ success: true });
    } catch (error: any) {
      console.error('[ViewHandlers] refresh-detail-view error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('go-back-detail-view', async (event) => {
    try {
      const context = windowContextManager.getContext(event.sender.id);
      const activeView = context?.tabManager?.getActiveView();
      if (!activeView) {
        return errorResponse('No active view found');
      }

      if (activeView.webContents.navigationHistory.canGoBack()) {
        activeView.webContents.navigationHistory.goBack();
      }
      return successResponse({ success: true });
    } catch (error: any) {
      console.error('[ViewHandlers] go-back-detail-view error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('go-forward-detail-view', async (event) => {
    try {
      const context = windowContextManager.getContext(event.sender.id);
      const activeView = context?.tabManager?.getActiveView();
      if (!activeView) {
        return errorResponse('No active view found');
      }

      if (activeView.webContents.navigationHistory.canGoForward()) {
        activeView.webContents.navigationHistory.goForward();
      }
      return successResponse({ success: true });
    } catch (error: any) {
      console.error('[ViewHandlers] go-forward-detail-view error:', error);
      return errorResponse(error);
    }
  });
}
