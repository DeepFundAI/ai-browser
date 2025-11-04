import { ipcMain } from "electron";
import { ConfigManager, type UserModelConfigs, type ProviderType } from "../utils/config-manager";
import { windowContextManager } from "../services/window-context-manager";
import { store } from "../utils/store";

/**
 * Register all configuration-related IPC handlers
 */
export function registerConfigHandlers() {
  // Get user model configurations
  ipcMain.handle('config:get-user-configs', async () => {
    try {
      const configManager = ConfigManager.getInstance();
      return configManager.getUserModelConfigs();
    } catch (error: any) {
      console.error('IPC config:get-user-configs error:', error);
      throw error;
    }
  });

  // Save user model configurations
  ipcMain.handle('config:save-user-configs', async (_event, configs: UserModelConfigs) => {
    try {
      const configManager = ConfigManager.getInstance();
      configManager.saveUserModelConfigs(configs);

      // Reload EkoService configuration for all windows
      const contexts = windowContextManager.getAllContexts();
      contexts.forEach(context => {
        if (context.ekoService) {
          context.ekoService.reloadConfig();
        }
      });

      return { success: true };
    } catch (error: any) {
      console.error('IPC config:save-user-configs error:', error);
      throw error;
    }
  });

  // Get model configuration for specific provider
  ipcMain.handle('config:get-model-config', async (_event, provider: ProviderType) => {
    try {
      const configManager = ConfigManager.getInstance();
      return configManager.getModelConfig(provider);
    } catch (error: any) {
      console.error('IPC config:get-model-config error:', error);
      throw error;
    }
  });

  // Get API key source (user/env/none)
  ipcMain.handle('config:get-api-key-source', async (_event, provider: ProviderType) => {
    try {
      const configManager = ConfigManager.getInstance();
      return configManager.getApiKeySource(provider);
    } catch (error: any) {
      console.error('IPC config:get-api-key-source error:', error);
      throw error;
    }
  });

  // Get selected provider
  ipcMain.handle('config:get-selected-provider', async () => {
    try {
      const configManager = ConfigManager.getInstance();
      return configManager.getSelectedProvider();
    } catch (error: any) {
      console.error('IPC config:get-selected-provider error:', error);
      throw error;
    }
  });

  // Set selected provider
  ipcMain.handle('config:set-selected-provider', async (_event, provider: ProviderType) => {
    try {
      const configManager = ConfigManager.getInstance();
      configManager.setSelectedProvider(provider);

      // Reload EkoService configuration for all windows
      const contexts = windowContextManager.getAllContexts();
      contexts.forEach(context => {
        if (context.ekoService) {
          context.ekoService.reloadConfig();
        }
      });

      return { success: true };
    } catch (error: any) {
      console.error('IPC config:set-selected-provider error:', error);
      throw error;
    }
  });

  // Get saved language preference
  ipcMain.handle('config:get-language', async () => {
    try {
      const language = store.get('app.language', 'en-US');
      return language;
    } catch (error: any) {
      console.error('IPC config:get-language error:', error);
      return 'en-US';
    }
  });

  // Handle language change notification from renderer
  ipcMain.handle('language-changed', async (_event, language: string) => {
    try {
      // Store language preference in electron-store
      store.set('app.language', language);
      console.log(`[IPC] Language changed to: ${language}`);
      return { success: true };
    } catch (error: any) {
      console.error('IPC language-changed error:', error);
      throw error;
    }
  });

  console.log('[IPC] Configuration handlers registered');
}
