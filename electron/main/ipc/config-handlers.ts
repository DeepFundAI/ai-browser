import { ipcMain } from "electron";
import { ConfigManager, type UserModelConfigs, type ProviderType } from "../utils/config-manager";
import { windowContextManager } from "../services/window-context-manager";
import { store } from "../utils/store";
import { successResponse, errorResponse } from "../utils/ipc-response";

export function registerConfigHandlers() {
  ipcMain.handle('config:get-user-configs', async () => {
    try {
      const configManager = ConfigManager.getInstance();
      return successResponse({ configs: configManager.getUserModelConfigs() });
    } catch (error: any) {
      console.error('[ConfigHandlers] get-user-configs error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('config:save-user-configs', async (_event, configs: UserModelConfigs) => {
    try {
      const configManager = ConfigManager.getInstance();
      configManager.saveUserModelConfigs(configs);

      const contexts = windowContextManager.getAllContexts();
      contexts.forEach(context => {
        if (context.ekoService) {
          context.ekoService.reloadConfig();
        }
      });

      return successResponse();
    } catch (error: any) {
      console.error('[ConfigHandlers] save-user-configs error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('config:get-model-config', async (_event, provider: ProviderType) => {
    try {
      const configManager = ConfigManager.getInstance();
      return successResponse({ config: configManager.getModelConfig(provider) });
    } catch (error: any) {
      console.error('[ConfigHandlers] get-model-config error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('config:get-api-key-source', async (_event, provider: ProviderType) => {
    try {
      const configManager = ConfigManager.getInstance();
      return successResponse({ source: configManager.getApiKeySource(provider) });
    } catch (error: any) {
      console.error('[ConfigHandlers] get-api-key-source error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('config:get-selected-provider', async () => {
    try {
      const configManager = ConfigManager.getInstance();
      return successResponse({ provider: configManager.getSelectedProvider() });
    } catch (error: any) {
      console.error('[ConfigHandlers] get-selected-provider error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('config:set-selected-provider', async (_event, provider: ProviderType) => {
    try {
      const configManager = ConfigManager.getInstance();
      configManager.setSelectedProvider(provider);

      const contexts = windowContextManager.getAllContexts();
      contexts.forEach(context => {
        if (context.ekoService) {
          context.ekoService.reloadConfig();
        }
      });

      return successResponse();
    } catch (error: any) {
      console.error('[ConfigHandlers] set-selected-provider error:', error);
      return errorResponse(error);
    }
  });

  ipcMain.handle('config:get-language', async () => {
    try {
      const language = store.get('app.language', 'en-US');
      return successResponse({ language });
    } catch (error: any) {
      console.error('[ConfigHandlers] get-language error:', error);
      return successResponse({ language: 'en-US' });
    }
  });

  ipcMain.handle('language-changed', async (_event, language: string) => {
    try {
      store.set('app.language', language);
      console.log(`[ConfigHandlers] Language changed to: ${language}`);
      return successResponse();
    } catch (error: any) {
      console.error('[ConfigHandlers] language-changed error:', error);
      return errorResponse(error);
    }
  });

  console.log('[IPC] Configuration handlers registered');
}
