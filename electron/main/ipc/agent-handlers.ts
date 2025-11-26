import { ipcMain } from 'electron';
import { ConfigManager } from '../utils/config-manager';
import { windowContextManager } from '../services/window-context-manager';
import mcpToolManager from '../../../src/services/mcp';
import { successResponse, errorResponse } from '../utils/ipc-response';

export function registerAgentHandlers() {
  const configManager = ConfigManager.getInstance();

  ipcMain.handle('agent:get-config', async () => {
    try {
      const agentConfig = configManager.getAgentConfig();
      return successResponse({ agentConfig });
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('[AgentHandlers] save-config error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('agent:get-mcp-tools', async () => {
    try {
      const tools = mcpToolManager.getAllToolsWithStatus();
      return successResponse({ tools });
    } catch (error: any) {
      console.error('[AgentHandlers] get-mcp-tools error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('agent:set-mcp-tool-enabled', async (_, toolName: string, enabled: boolean) => {
    try {
      mcpToolManager.setToolEnabled(toolName, enabled);
      configManager.setMcpToolConfig(toolName, { enabled });
      return successResponse();
    } catch (error: any) {
      console.error('[AgentHandlers] set-mcp-tool-enabled error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('agent:reload-config', async () => {
    try {
      const agentConfig = configManager.getAgentConfig();

      const availableTools = mcpToolManager.getAllToolNames();
      availableTools.forEach((toolName: string) => {
        const toolConfig = agentConfig.mcpTools[toolName];
        if (toolConfig !== undefined) {
          mcpToolManager.setToolEnabled(toolName, toolConfig.enabled);
        }
      });

      const contexts = windowContextManager.getAllContexts();
      contexts.forEach(context => {
        if (context.ekoService) {
          context.ekoService.reloadConfig();
        }
      });

      return successResponse({ agentConfig });
    } catch (error: any) {
      console.error('[AgentHandlers] reload-config error:', error);
      return errorResponse(error);
    }
  });

  console.log('[IPC] Agent configuration handlers registered');
}
