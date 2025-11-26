import { ipcMain } from "electron";
import { windowContextManager } from "../services/window-context-manager";
import type { HumanResponseMessage } from "../../../src/models/human-interaction";
import { successResponse, errorResponse } from "../utils/ipc-response";

export function registerEkoHandlers() {
  ipcMain.handle('eko:run', async (event, message: string) => {
    try {
      const context = windowContextManager.getContext(event.sender.id);
      if (!context || !context.ekoService) {
        console.error('[EkoHandlers] EkoService not found');
        return errorResponse('EkoService not found for this window');
      }
      const result = await context.ekoService.run(message);
      return successResponse({ result });
    } catch (error: any) {
      console.error('[EkoHandlers] run error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('eko:modify', async (event, taskId: string, message: string) => {
    try {
      console.log('[EkoHandlers] modify received:', taskId, message);
      const context = windowContextManager.getContext(event.sender.id);
      if (!context || !context.ekoService) {
        console.error('[EkoHandlers] EkoService not found');
        return errorResponse('EkoService not found for this window');
      }
      const result = await context.ekoService.modify(taskId, message);
      return successResponse({ result });
    } catch (error: any) {
      console.error('[EkoHandlers] modify error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('eko:execute', async (event, taskId: string) => {
    try {
      console.log('[EkoHandlers] execute received:', taskId);
      const context = windowContextManager.getContext(event.sender.id);
      if (!context || !context.ekoService) {
        console.error('[EkoHandlers] EkoService not found');
        return errorResponse('EkoService not found for this window');
      }
      const result = await context.ekoService.execute(taskId);
      return successResponse({ result });
    } catch (error: any) {
      console.error('[EkoHandlers] execute error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('eko:cancel-task', async (event, taskId: string) => {
    try {
      console.log('[EkoHandlers] cancel-task received:', taskId);
      const context = windowContextManager.getContext(event.sender.id);
      if (!context || !context.ekoService) {
        console.error('[EkoHandlers] EkoService not found');
        return errorResponse('EkoService not found for this window');
      }
      const result = await context.ekoService.cancleTask(taskId);
      return successResponse({ result });
    } catch (error: any) {
      console.error('[EkoHandlers] cancel-task error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('eko:human-response', async (event, response: HumanResponseMessage) => {
    try {
      console.log('[EkoHandlers] human-response received:', response);
      const context = windowContextManager.getContext(event.sender.id);
      if (!context || !context.ekoService) {
        console.error('[EkoHandlers] EkoService not found');
        return errorResponse('EkoService not found for this window');
      }
      const result = context.ekoService.handleHumanResponse(response);
      return successResponse({ result });
    } catch (error: any) {
      console.error('[EkoHandlers] human-response error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('eko:get-task-context', async (event, taskId: string) => {
    try {
      console.log('[EkoHandlers] get-task-context received:', taskId);
      const context = windowContextManager.getContext(event.sender.id);
      if (!context || !context.ekoService) {
        console.error('[EkoHandlers] EkoService not found');
        return errorResponse('EkoService not found for this window');
      }
      const taskContext = context.ekoService.getTaskContext(taskId);
      return successResponse({ taskContext });
    } catch (error: any) {
      console.error('[EkoHandlers] get-task-context error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('eko:restore-task', async (
    event,
    workflow: any,
    contextParams?: Record<string, any>,
    chainPlanRequest?: any,
    chainPlanResult?: string
  ) => {
    try {
      console.log('[EkoHandlers] restore-task received:', workflow.taskId);
      const context = windowContextManager.getContext(event.sender.id);
      if (!context || !context.ekoService) {
        console.error('[EkoHandlers] EkoService not found');
        return errorResponse('EkoService not found for this window');
      }
      const taskId = await context.ekoService.restoreTask(
        workflow,
        contextParams,
        chainPlanRequest,
        chainPlanResult
      );
      return successResponse({ taskId });
    } catch (error: any) {
      console.error('[EkoHandlers] restore-task error:', error);
      return errorResponse(error);
    }
  });

  console.log('[IPC] Eko service handlers registered');
}
