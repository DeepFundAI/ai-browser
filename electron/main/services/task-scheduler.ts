import { taskWindowManager } from "./task-window-manager";
import { ipcMain } from "electron";

interface QueuedTask {
  taskId: string;
  taskName: string;
  steps: Array<{ id: string; name: string; content: string; order: number }>;
  scheduledTime: Date;
}

interface RunningTask {
  taskId: string;
  executionId: string;
  startTime: Date;
}

export class TaskScheduler {
  private taskQueue: QueuedTask[] = [];
  private runningTasks: Map<string, RunningTask> = new Map();
  private scheduledTimers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    this.setupIpcHandlers();
  }

  private setupIpcHandlers(): void {
    ipcMain.handle('scheduler:add-task', async (_event, task: any) => this.scheduleTask(task));
    ipcMain.handle('scheduler:remove-task', async (_event, taskId: string) => this.removeScheduledTask(taskId));
    ipcMain.handle('scheduler:execute-now', async (_event, task: any) => this.executeTaskNow(task));
    ipcMain.handle('scheduler:is-initialized', async () => this.isInitialized);
    ipcMain.handle('scheduler:mark-initialized', async () => {
      this.isInitialized = true;
      return { success: true };
    });
  }

  start(): { success: boolean; message: string } {
    if (this.isRunning) {
      return { success: false, message: 'Scheduler is already running' };
    }

    this.isRunning = true;
    return { success: true, message: 'Scheduler started successfully' };
  }

  stop(): { success: boolean; message: string } {
    if (!this.isRunning) {
      return { success: false, message: 'Scheduler is not running' };
    }

    this.scheduledTimers.forEach(timer => clearTimeout(timer));
    this.scheduledTimers.clear();
    this.taskQueue = [];
    this.isRunning = false;

    return { success: true, message: 'Scheduler stopped successfully' };
  }

  scheduleTask(task: any): { success: boolean; message: string; nextExecuteAt?: Date } {
    if (!this.isRunning) {
      return { success: false, message: 'Scheduler not started' };
    }

    const { id, name, steps, schedule } = task;
    const nextExecuteAt = this.calculateNextExecuteTime(schedule);

    if (!nextExecuteAt) {
      return { success: false, message: 'Invalid schedule configuration' };
    }

    const delay = nextExecuteAt.getTime() - Date.now();
    if (delay < 0) {
      return { success: false, message: 'Calculated execution time has expired' };
    }

    if (this.scheduledTimers.has(id)) {
      clearTimeout(this.scheduledTimers.get(id));
    }

    const timer = setTimeout(() => {
      this.executeTask(id, name, steps);
      this.scheduledTimers.delete(id);

      if (schedule.type === 'interval') {
        this.scheduleTask(task);
      }
    }, delay);

    this.scheduledTimers.set(id, timer);
    return { success: true, message: 'Task scheduled successfully', nextExecuteAt };
  }

  removeScheduledTask(taskId: string): { success: boolean; message: string } {
    const timer = this.scheduledTimers.get(taskId);

    if (!timer) {
      return { success: false, message: 'Task schedule not found' };
    }

    clearTimeout(timer);
    this.scheduledTimers.delete(taskId);

    return { success: true, message: 'Task schedule removed' };
  }

  async executeTaskNow(task: any): Promise<{ success: boolean; message: string; executionId?: string }> {
    const { id, name, steps } = task;
    return this.executeTask(id, name, steps);
  }

  private async executeTask(
    taskId: string,
    taskName: string,
    steps: Array<{ id: string; name: string; content: string; order: number }>
  ): Promise<{ success: boolean; message: string; executionId?: string }> {
    try {
      if (!taskWindowManager.canRunNewTask()) {
        this.taskQueue.push({ taskId, taskName, steps, scheduledTime: new Date() });
        return { success: true, message: 'Task added to queue' };
      }

      const executionId = this.generateExecutionId();
      await this.runTaskInNewWindow(taskId, taskName, steps, executionId);

      return { success: true, message: 'Task execution started', executionId };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  private async runTaskInNewWindow(
    taskId: string,
    taskName: string,
    steps: Array<{ id: string; name: string; content: string; order: number }>,
    executionId: string
  ): Promise<void> {
    try {
      const { window, ekoService } = await taskWindowManager.createTaskWindow(taskId, executionId);

      this.runningTasks.set(executionId, {
        taskId,
        executionId,
        startTime: new Date()
      });

      window.webContents.send('task-execution-start', {
        taskId,
        taskName,
        executionId,
        steps
      });

      const taskPrompt = this.buildTaskPrompt(steps);
      const result = await ekoService.run(taskPrompt);

      window.webContents.send('task-execution-complete', {
        taskId,
        taskName,
        executionId,
        status: result?.stopReason || 'done',
        endTime: new Date()
      });

      this.runningTasks.delete(executionId);
      this.processQueue();

    } catch (error) {
      console.error('[TaskScheduler] Task execution failed:', error);
      this.runningTasks.delete(executionId);
      this.processQueue();
    }
  }

  private buildTaskPrompt(steps: Array<{ id: string; name: string; content: string; order: number }>): string {
    const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
    const stepTexts = sortedSteps.map((step, index) => `${index + 1}. ${step.content}`).join('\n');
    return `Please execute the task following these steps:\n${stepTexts}`;
  }

  private async processQueue(): Promise<void> {
    if (this.taskQueue.length === 0 || !taskWindowManager.canRunNewTask()) {
      return;
    }

    const nextTask = this.taskQueue.shift();
    if (nextTask) {
      const executionId = this.generateExecutionId();
      await this.runTaskInNewWindow(nextTask.taskId, nextTask.taskName, nextTask.steps, executionId);
    }
  }

  private calculateNextExecuteTime(schedule: any): Date | null {
    if (schedule.type === 'interval') {
      const { intervalUnit, intervalValue } = schedule;
      if (!intervalUnit || !intervalValue) return null;

      const timeUnits: Record<string, number> = {
        minute: 60 * 1000,
        hour: 60 * 60 * 1000,
        day: 24 * 60 * 60 * 1000
      };

      const milliseconds = timeUnits[intervalUnit];
      if (!milliseconds) return null;

      return new Date(Date.now() + intervalValue * milliseconds);
    }

    return null;
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  getStatus(): {
    isRunning: boolean;
    queueLength: number;
    runningCount: number;
    scheduledCount: number;
  } {
    return {
      isRunning: this.isRunning,
      queueLength: this.taskQueue.length,
      runningCount: this.runningTasks.size,
      scheduledCount: this.scheduledTimers.size
    };
  }

  destroy(): void {
    this.stop();
    this.runningTasks.clear();
  }
}

// Singleton instance
export const taskScheduler = new TaskScheduler();
