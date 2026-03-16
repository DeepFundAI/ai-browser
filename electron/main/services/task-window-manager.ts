import { BrowserWindow } from "electron";
import { EkoService } from "./eko-service";
import { TabManager } from "./tab-manager";
import { windowContextManager, type WindowContext } from "./window-context-manager";
import { createWindow } from '../ui/window';
import { showCloseConfirmModal } from "../ui/modal";

interface TaskWindowContext {
  window: BrowserWindow;
  tabManager: TabManager;
  ekoService: EkoService;
  taskId: string;
  executionId: string;
  createdAt: Date;
}

export class TaskWindowManager {
  private taskWindows: Map<string, TaskWindowContext> = new Map();
  private maxConcurrentTasks: number = 3;

  async createTaskWindow(taskId: string, executionId: string): Promise<TaskWindowContext> {
    const existingContext = this.taskWindows.get(taskId);

    if (existingContext) {
      // Fully destroy old EkoService (aborts tasks, closes MCP connections)
      try {
        await existingContext.ekoService.destroy();
      } catch (error) {
        console.error('[TaskWindowManager] Failed to destroy old EkoService:', error);
      }

      // Rebuild EkoService with fresh state
      const newEkoService = new EkoService(existingContext.window, existingContext.tabManager);
      existingContext.ekoService = newEkoService;
      existingContext.executionId = executionId;

      // Update window context registry
      const wcId = existingContext.window.webContents.id;
      windowContextManager.updateWindowContext(wcId, {
        ekoService: newEkoService,
        currentExecutionId: executionId,
      });

      existingContext.window.loadURL(`http://localhost:5173/main?taskId=${taskId}&executionId=${executionId}`);
      existingContext.window.show();
      existingContext.window.focus();

      return existingContext;
    }

    if (this.taskWindows.size >= this.maxConcurrentTasks) {
      throw new Error(`Maximum concurrent tasks reached (${this.maxConcurrentTasks})`);
    }

    const taskWindow = await createWindow(`http://localhost:5173/main?taskId=${taskId}&executionId=${executionId}`)

    // Create TabManager for this task window (same bounds as main window)
    const tabManager = new TabManager(taskWindow, { x: 818, y: 264, width: 748, height: 560 });
    tabManager.createTab("https://www.google.com");
    tabManager.setVisible(false);

    const ekoService = new EkoService(taskWindow, tabManager);

    taskWindow.show();
    taskWindow.focus();

    const context: TaskWindowContext = {
      window: taskWindow,
      tabManager,
      ekoService,
      taskId,
      executionId,
      createdAt: new Date()
    };

    this.taskWindows.set(taskId, context);

    const windowContext: WindowContext = {
      window: taskWindow,
      tabManager,
      historyView: null,
      ekoService,
      webContentsId: taskWindow.webContents.id,
      windowType: 'scheduled-task',
      taskId,
      currentExecutionId: executionId
    };
    windowContextManager.registerWindow(windowContext);

    // Track close confirmation state
    let closeConfirmed = false;
    let isShowingModal = false;

    taskWindow.on('close', async (event) => {
      if (closeConfirmed) {
        closeConfirmed = false;
        return;
      }

      // Read current ekoService from context (may have been replaced on reuse)
      const currentContext = this.taskWindows.get(taskId);
      const currentEkoService = currentContext?.ekoService ?? ekoService;

      if (!currentEkoService.hasRunningTask()) return;

      event.preventDefault();

      // Prevent multiple modals
      if (isShowingModal) return;
      isShowingModal = true;

      const confirmed = await showCloseConfirmModal(taskWindow);
      isShowingModal = false;

      if (confirmed) {
        await currentEkoService.destroy();

        if (!taskWindow.isDestroyed()) {
          taskWindow.webContents.send('task-aborted-by-system', {
            taskId,
            reason: 'User closed scheduled task window',
            timestamp: new Date().toISOString()
          });
        }

        await new Promise(resolve => setTimeout(resolve, 300));
        closeConfirmed = true;
        taskWindow.destroy();
      }
    });

    taskWindow.on('closed', () => {
      this.taskWindows.delete(taskId);

      try {
        if (!taskWindow.isDestroyed() && taskWindow.webContents) {
          windowContextManager.unregisterWindow(taskWindow.webContents.id);
        }
      } catch (error) {
        console.error('[TaskWindowManager] Failed to unregister window context:', error);
      }
    });

    return context;
  }

  getTaskWindow(taskId: string): TaskWindowContext | undefined {
    return this.taskWindows.get(taskId);
  }

  canRunNewTask(): boolean {
    return this.taskWindows.size < this.maxConcurrentTasks;
  }
}

// Singleton instance
export const taskWindowManager = new TaskWindowManager();
