import { BrowserWindow, WebContentsView } from "electron";
import { EkoService } from "./eko-service";

export interface WindowContext {
  window: BrowserWindow;
  detailView: WebContentsView;
  historyView?: WebContentsView | null;
  ekoService: EkoService;
  webContentsId: number;
  windowType: 'main' | 'scheduled-task';
  taskId?: string;
  currentExecutionId?: string;
}

export class WindowContextManager {
  private contexts: Map<number, WindowContext> = new Map();
  private taskWindows: Map<string, WindowContext> = new Map();

  registerWindow(context: WindowContext): void {
    this.contexts.set(context.webContentsId, context);

    if (context.windowType === 'scheduled-task' && context.taskId) {
      this.taskWindows.set(context.taskId, context);
    }
  }

  getContext(webContentsId: number): WindowContext | undefined {
    return this.contexts.get(webContentsId);
  }

  unregisterWindow(webContentsId: number): void {
    const context = this.contexts.get(webContentsId);

    if (context) {
      if (context.windowType === 'scheduled-task' && context.taskId) {
        this.taskWindows.delete(context.taskId);
      }

      this.contexts.delete(webContentsId);
    }
  }

  getAllContexts(): WindowContext[] {
    return Array.from(this.contexts.values());
  }
}

export const windowContextManager = new WindowContextManager();
