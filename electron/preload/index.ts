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
  ekoPauseTask: (taskId: string, pause: boolean) => safeInvoke('eko:pause-task', taskId, pause),
  ekoWorkflowConfirmResponse: (confirmId: string, confirmed: boolean, modifiedWorkflow?: any) => safeInvoke('eko:workflow-confirm-response', confirmId, confirmed, modifiedWorkflow),
  ekoRegenerateWorkflow: (taskId: string) => safeInvoke('eko:regenerate-workflow', taskId),
  onEkoStreamMessage: (callback: (message: any) => void) => ipcRenderer.on('eko-stream-message', (_, message) => callback(message)),

  sendHumanResponse: (response: any) => safeInvoke('eko:human-response', response),

  // ChatAgent APIs
  ekoChatRun: (chatId: string, messageId: string, text: string) => safeInvoke('eko:chat-run', chatId, messageId, text),
  ekoChatCancel: (chatId: string) => safeInvoke('eko:chat-cancel', chatId),

  ekoGetTaskContext: (taskId: string) => safeInvoke('eko:get-task-context', taskId),
  ekoRestoreTask: (workflow: any, contextParams?: Record<string, any>, chainPlanRequest?: any, chainPlanResult?: string) =>
    safeInvoke('eko:restore-task', workflow, contextParams, chainPlanRequest, chainPlanResult),

  // Unified settings APIs
  getAppSettings: () => safeInvoke('settings:get'),
  saveAppSettings: (settings: any) => safeInvoke('settings:save', settings),
  onSettingsUpdated: (callback: (event: { timestamp: number }) => void) => {
    const handler = (_: any, event: any) => callback(event);
    ipcRenderer.on('settings-updated', handler);
    // Return cleanup function
    return () => ipcRenderer.removeListener('settings-updated', handler);
  },
  onUIConfigUpdated: (callback: (event: { timestamp: number }) => void) => {
    const handler = (_: any, event: any) => callback(event);
    ipcRenderer.on('ui-config-updated', handler);
    // Return cleanup function
    return () => ipcRenderer.removeListener('ui-config-updated', handler);
  },

  // Agent configuration APIs
  getAgentConfig: () => safeInvoke('agent:get-config'),
  saveAgentConfig: (config: any) => safeInvoke('agent:save-config', config),
  reloadAgentConfig: () => safeInvoke('agent:reload-config'),

  // MCP service APIs
  fetchMcpTools: (url: string, headers?: Record<string, string>) => safeInvoke('settings:fetch-mcp-tools', url, headers),

  // Detail view control APIs
  setDetailViewVisible: (visible: boolean) => safeInvoke('set-detail-view-visible', visible),
  navigateDetailView: (url: string) => safeInvoke('navigate-detail-view', url),
  refreshDetailView: () => safeInvoke('refresh-detail-view'),
  goBackDetailView: () => safeInvoke('go-back-detail-view'),
  goForwardDetailView: () => safeInvoke('go-forward-detail-view'),
  getCurrentUrl: () => safeInvoke('get-current-url'),
  onUrlChange: (callback: (url: string) => void) => ipcRenderer.on('url-changed', (_event, url) => callback(url)),

  // Tab management APIs
  tabsGetAll: () => safeInvoke('tabs:get-all'),
  tabsCreate: (url?: string) => safeInvoke('tabs:create', url),
  tabsSwitch: (tabId: number) => safeInvoke('tabs:switch', tabId),
  tabsClose: (tabId: number) => safeInvoke('tabs:close', tabId),
  onTabsChanged: (callback: (data: { tabs: any[]; activeTabId: number }) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('tabs-changed', handler);
    return () => ipcRenderer.removeListener('tabs-changed', handler);
  },

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

  // Settings window APIs
  openSettings: () => safeInvoke('settings:open'),
  closeSettings: () => safeInvoke('settings:close'),

  // Fetch models from provider API (bypass CORS)
  fetchModels: (providerId: string, apiKey: string, baseUrl: string) =>
    safeInvoke('settings:fetch-models', providerId, apiKey, baseUrl),

  // Skills management APIs
  skillsList: () => safeInvoke('skills:list'),
  skillsGetContent: (name: string) => safeInvoke('skills:get-content', name),
  skillsImportZip: () => safeInvoke('skills:import-zip'),
  skillsImportFolder: () => safeInvoke('skills:import-folder'),
  skillsDelete: (name: string) => safeInvoke('skills:delete', name),
  skillsLoad: (name: string) => safeInvoke('skills:load', name),
  skillsLoadResource: (name: string, path: string) => safeInvoke('skills:load-resource', name, path),

  // Memory management APIs
  memoryList: (filter?: { keyword?: string; source?: string }) => safeInvoke('memory:list', filter),
  memorySearch: (query: string, maxResults?: number) => safeInvoke('memory:search', query, maxResults),
  memoryAdd: (content: string) => safeInvoke('memory:add', content),
  memoryDelete: (id: string) => safeInvoke('memory:delete', id),
  memoryClear: () => safeInvoke('memory:clear'),
  memoryStats: () => safeInvoke('memory:stats'),
  memoryEmbeddingModels: () => safeInvoke('memory:embedding-models'),
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
