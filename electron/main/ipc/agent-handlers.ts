import { ipcMain } from 'electron';
import { ConfigManager } from '../utils/config-manager';
import { windowContextManager } from '../services/window-context-manager';
import { successResponse, errorResponse } from '../utils/ipc-response';

export function registerAgentHandlers() {
  const configManager = ConfigManager.getInstance();

  ipcMain.handle('agent:get-config', async () => {
    try {
      const agentConfig = configManager.getAgentConfig();
      return successResponse({ agentConfig });
    } catch (error: unknown) {
      console.error('[AgentHandlers] get-config error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('agent:save-config', async (_, config) => {
    try {
      configManager.saveAgentConfig(config);

      const contexts = windowContextManager.getAllContexts();
      contexts.forEach(context => {
        if (context.ekoService) {
          context.ekoService.reloadConfig();
        }
      });

      return successResponse();
    } catch (error: unknown) {
      console.error('[AgentHandlers] save-config error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('agent:reload-config', async () => {
    try {
      const agentConfig = configManager.getAgentConfig();

      const contexts = windowContextManager.getAllContexts();
      contexts.forEach(context => {
        if (context.ekoService) {
          context.ekoService.reloadConfig();
        }
      });

      return successResponse({ agentConfig });
    } catch (error: unknown) {
      console.error('[AgentHandlers] reload-config error:', error);
      return errorResponse(error);
    }
  });

  console.log('[IPC] Agent configuration handlers registered');
}
