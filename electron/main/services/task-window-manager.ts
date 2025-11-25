import { BrowserWindow, dialog, WebContentsView } from "electron";
import { EkoService } from "./eko-service";
import { windowContextManager, type WindowContext } from "./window-context-manager";
import { createWindow } from '../ui/window';
import { createView } from "../ui/view";

interface TaskWindowContext {
  window: BrowserWindow;
  view: WebContentsView;
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
      if (existingContext.executionId) {
        try {
          await existingContext.ekoService.cancleTask(existingContext.executionId);
        } catch (error) {
          console.error('[TaskWindowManager] Failed to terminate old task:', error);
        }
      }

      existingContext.executionId = executionId;
      existingContext.window.loadURL(`http://localhost:5173/main?taskId=${taskId}&executionId=${executionId}`);
      existingContext.window.show();
      existingContext.window.focus();

      return existingContext;
    }

    if (this.taskWindows.size >= this.maxConcurrentTasks) {
      throw new Error(`Maximum concurrent tasks reached (${this.maxConcurrentTasks})`);
    }

    const taskWindow = createWindow(`http://localhost:5173/main?taskId=${taskId}&executionId=${executionId}`)
    const detailView = createView(`https://www.google.com`, "view", '2');

    taskWindow.contentView.addChildView(detailView);
    detailView.setBounds({ x: 818, y: 264, width: 748, height: 560 });
    detailView.setVisible(false);

    detailView.webContents.setWindowOpenHandler(({url}) => {
      detailView.webContents.loadURL(url);
      return { action: "deny" }
    });

    detailView.webContents.on('did-navigate', (_event, url) => {
      taskWindow?.webContents.send('url-changed', url);
    });

    detailView.webContents.on('did-navigate-in-page', (_event, url) => {
      taskWindow?.webContents.send('url-changed', url);
    });

    const ekoService = new EkoService(taskWindow, detailView);

    taskWindow.show();
    taskWindow.focus();

    const context: TaskWindowContext = {
      window: taskWindow,
      view: detailView,
      ekoService,
      taskId,
      executionId,
      createdAt: new Date()
    };

    this.taskWindows.set(taskId, context);

    const windowContext: WindowContext = {
      window: taskWindow,
      detailView,
      historyView: null,
      ekoService,
      webContentsId: taskWindow.webContents.id,
      windowType: 'scheduled-task',
      taskId,
      currentExecutionId: executionId
    };
    windowContextManager.registerWindow(windowContext);

    taskWindow.on('close', async (event) => {
      const hasRunningTask = ekoService.hasRunningTask();

      if (hasRunningTask) {
        event.preventDefault();

        const { response } = await dialog.showMessageBox(taskWindow, {
          type: 'warning',
          title: 'Scheduled Task Running',
          message: 'A scheduled task is currently executing. Closing the window will terminate the task',
          detail: 'Please choose an action:',
          buttons: ['Cancel', 'Stop Task and Close'],
          defaultId: 0,
          cancelId: 0
        });

        if (response === 1) {
          const allTaskIds = ekoService['eko']?.getAllTaskId() || [];
          await ekoService.abortAllTasks();

          allTaskIds.forEach(tid => {
            taskWindow.webContents.send('task-aborted-by-system', {
              taskId: tid,
              reason: 'User closed scheduled task window, task terminated',
              timestamp: new Date().toISOString()
            });
          });

          await new Promise(resolve => setTimeout(resolve, 1000));
          taskWindow.destroy();
        }
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
