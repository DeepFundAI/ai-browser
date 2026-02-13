import { ipcMain, WebContentsView } from "electron";
import { windowContextManager } from "../services/window-context-manager";
import { taskWindowManager } from "../services/task-window-manager";
import { successResponse, errorResponse } from "../utils/ipc-response";

const ongoingScreenshotLoads = new Map<number, Promise<any>>();

export function registerHistoryHandlers() {
  ipcMain.handle('show-history-view', async (event, screenshot: string) => {
    const senderId = event.sender.id;

    const ongoingLoad = ongoingScreenshotLoads.get(senderId);
    if (ongoingLoad) {
      try {
        await ongoingLoad;
      } catch (error) {
        // Ignore errors from previous load
      }
    }

    const loadPromise = (async () => {
      try {
        const context = windowContextManager.getContext(senderId);
        if (!context) {
          console.error('[HistoryHandlers] Window context not found');
          return errorResponse('Window context not found');
        }

        if (context.historyView) {
          context.window.contentView.removeChildView(context.historyView);
          context.historyView = null;
        }

        context.historyView = new WebContentsView();

        const htmlTemplate = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        margin: 0;
        padding: 0;
        background: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        overflow: hidden;
      }
      img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    </style>
  </head>
  <body>
    <img id="screenshot" alt="Historical screenshot" />
  </body>
</html>`;

        await context.historyView.webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlTemplate)}`);
        await context.historyView.webContents.executeJavaScript('document.readyState === "complete"');
        await context.historyView.webContents.executeJavaScript(`
          document.getElementById('screenshot').src = ${JSON.stringify(screenshot)};
        `);

        context.window.contentView.addChildView(context.historyView);
        context.historyView.setBounds({
          x: 818,
          y: 200,
          width: 748,
          height: 624,
        });

        return successResponse();
      } catch (error: any) {
        console.error('[HistoryHandlers] show-history-view error:', error);
        return errorResponse(error);
      }
    })();

    ongoingScreenshotLoads.set(senderId, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } finally {
      ongoingScreenshotLoads.delete(senderId);
    }
  });

  ipcMain.handle('hide-history-view', async (event) => {
    const senderId = event.sender.id;

    try {
      ongoingScreenshotLoads.delete(senderId);

      const context = windowContextManager.getContext(senderId);
      if (context && context.historyView) {
        context.window.contentView.removeChildView(context.historyView);
        context.historyView = null;
      }
      return successResponse();
    } catch (error: any) {
      console.error('[HistoryHandlers] hide-history-view error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('open-task-history', async (_event, taskId: string) => {
    try {
      let taskWindow = taskWindowManager.getTaskWindow(taskId);

      if (taskWindow) {
        taskWindow.window.show();
        taskWindow.window.focus();
      } else {
        const executionId = `view_history_${Date.now()}`;
        taskWindow = await taskWindowManager.createTaskWindow(taskId, executionId);
      }

      setTimeout(() => {
        taskWindow!.window.webContents.send('open-history-panel', { taskId });
      }, 1000);

      return successResponse();
    } catch (error: any) {
      console.error('[HistoryHandlers] open-task-history error:', error);
      return errorResponse(error);
    }
  });
}
