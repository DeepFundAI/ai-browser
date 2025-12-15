import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Log IPC errors, return original response for frontend handling
async function safeInvoke<T = any>(channel: string, ...args: any[]): Promise<T> {
  const response = await ipcRenderer.invoke(channel, ...args);

  if (response && typeof response === 'object' && 'success' in response && !response.success) {
    console.error(`[IPC:${channel}] Error:`, response.error);
  }

  return response;
}

// Custom APIs for renderer
const api = {
  // Remove listeners
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
  
  // TTS subtitle related APIs
  sendTTSSubtitle: (text: string, isStart: boolean) => ipcRenderer.invoke('send-tts-subtitle', text, isStart),
  
  // EkoService related APIs
  ekoRun: (message: string) => safeInvoke('eko:run', message),
  ekoModify: (taskId: string, message: string) => safeInvoke('eko:modify', taskId, message),
  ekoExecute: (taskId: string) => safeInvoke('eko:execute', taskId),
  ekoCancelTask: (taskId: string) => safeInvoke('eko:cancel-task', taskId),
  onEkoStreamMessage: (callback: (message: any) => void) => ipcRenderer.on('eko-stream-message', (_, message) => callback(message)),

  sendHumanResponse: (response: any) => safeInvoke('eko:human-response', response),

  ekoGetTaskContext: (taskId: string) => safeInvoke('eko:get-task-context', taskId),
  ekoRestoreTask: (workflow: any, contextParams?: Record<string, any>, chainPlanRequest?: any, chainPlanResult?: string) =>
    safeInvoke('eko:restore-task', workflow, contextParams, chainPlanRequest, chainPlanResult),

  // Model configuration APIs
  getUserModelConfigs: () => safeInvoke('config:get-user-configs'),
  saveUserModelConfigs: (configs: any) => safeInvoke('config:save-user-configs', configs),
  getModelConfig: (provider: 'deepseek' | 'qwen' | 'google' | 'anthropic' | 'openrouter') => safeInvoke('config:get-model-config', provider),
  getApiKeySource: (provider: 'deepseek' | 'qwen' | 'google' | 'anthropic' | 'openrouter') => safeInvoke('config:get-api-key-source', provider),
  getSelectedProvider: () => safeInvoke('config:get-selected-provider'),
  setSelectedProvider: (provider: 'deepseek' | 'qwen' | 'google' | 'anthropic' | 'openrouter') => safeInvoke('config:set-selected-provider', provider),

  // Agent configuration APIs
  getAgentConfig: () => safeInvoke('agent:get-config'),
  saveAgentConfig: (config: any) => safeInvoke('agent:save-config', config),
  getMcpTools: () => safeInvoke('agent:get-mcp-tools'),
  setMcpToolEnabled: (toolName: string, enabled: boolean) => safeInvoke('agent:set-mcp-tool-enabled', toolName, enabled),
  reloadAgentConfig: () => safeInvoke('agent:reload-config'),

  // Detail view control APIs
  setDetailViewVisible: (visible: boolean) => safeInvoke('set-detail-view-visible', visible),
  navigateDetailView: (url: string) => safeInvoke('navigate-detail-view', url),
  getCurrentUrl: () => safeInvoke('get-current-url'),
  onUrlChange: (callback: (url: string) => void) => ipcRenderer.on('url-changed', (_event, url) => callback(url)),

  getMainViewScreenshot: () => safeInvoke('get-main-view-screenshot'),
  showHistoryView: (screenshot: string) => safeInvoke('show-history-view', screenshot),
  hideHistoryView: () => safeInvoke('hide-history-view'),

  invoke: (channel: string, ...args: any[]) => safeInvoke(channel, ...args),

  // Scheduled task execution completion listener
  onTaskExecutionComplete: (callback: (event: any) => void) =>
    ipcRenderer.on('task-execution-complete', (_, event) => callback(event)),

  // Open history panel listener
  onOpenHistoryPanel: (callback: (event: any) => void) =>
    ipcRenderer.on('open-history-panel', (_, event) => callback(event)),

  // Task aborted by system listener
  onTaskAbortedBySystem: (callback: (event: any) => void) =>
    ipcRenderer.on('task-aborted-by-system', (_, event) => callback(event)),

  // File download API
  downloadFile: (filePath: string, fileName: string) => safeInvoke('file:download', filePath, fileName),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
} 
