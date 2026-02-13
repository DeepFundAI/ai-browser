/**
 * input: windowContextManager for accessing TabManager
 * output: IPC handlers for tab operations
 * pos: IPC layer bridging frontend and TabManager
 */

import { ipcMain } from "electron";
import { windowContextManager } from "../services/window-context-manager";
import { successResponse, errorResponse } from "../utils/ipc-response";

export function registerTabHandlers() {
  // Get all tabs
  ipcMain.handle("tabs:get-all", async (event) => {
    try {
      const context = windowContextManager.getContext(event.sender.id);
      if (!context?.tabManager) {
        return errorResponse("TabManager not found");
      }

      return successResponse({
        tabs: context.tabManager.getAllTabs(),
        activeTabId: context.tabManager.getActiveTabId(),
      });
    } catch (error: any) {
      console.error("[TabHandlers] tabs:get-all error:", error);
      return errorResponse(error);
    }
  });

  // Create new tab
  ipcMain.handle("tabs:create", async (event, url?: string) => {
    try {
      const context = windowContextManager.getContext(event.sender.id);
      if (!context?.tabManager) {
        return errorResponse("TabManager not found");
      }

      const tabId = context.tabManager.createTab(url);
      return successResponse({ tabId });
    } catch (error: any) {
      console.error("[TabHandlers] tabs:create error:", error);
      return errorResponse(error);
    }
  });

  // Switch tab
  ipcMain.handle("tabs:switch", async (event, tabId: number) => {
    try {
      const context = windowContextManager.getContext(event.sender.id);
      if (!context?.tabManager) {
        return errorResponse("TabManager not found");
      }

      const success = context.tabManager.switchTab(tabId);
      return successResponse({ success });
    } catch (error: any) {
      console.error("[TabHandlers] tabs:switch error:", error);
      return errorResponse(error);
    }
  });

  // Close tab
  ipcMain.handle("tabs:close", async (event, tabId: number) => {
    try {
      const context = windowContextManager.getContext(event.sender.id);
      if (!context?.tabManager) {
        return errorResponse("TabManager not found");
      }

      const success = context.tabManager.closeTab(tabId);
      return successResponse({ success });
    } catch (error: any) {
      console.error("[TabHandlers] tabs:close error:", error);
      return errorResponse(error);
    }
  });
}
