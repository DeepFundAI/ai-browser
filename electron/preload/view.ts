import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

console.log("view preload");

// Custom APIs for renderer
const api = {

  // Remove listeners
  removeAllListeners: (channel: string) =>
    ipcRenderer.removeAllListeners(channel),

  // TTS subtitle related APIs
  sendTTSSubtitle: (text: string, isStart: boolean) => ipcRenderer.invoke('send-tts-subtitle', text, isStart),

  onFileUpdated: (callback: (status: string, content: string, fileName?: string) => void) => ipcRenderer.on('file-updated', (_, status, content, fileName) => callback(status, content, fileName)),

  // Settings APIs
  getAppSettings: () => ipcRenderer.invoke('settings:get'),
  saveAppSettings: (settings: any) => ipcRenderer.invoke('settings:save', settings),
  onSettingsUpdated: (callback: (event: { timestamp: number }) => void) => {
    const handler = (_: any, event: any) => callback(event);
    ipcRenderer.on('settings-updated', handler);
    return () => ipcRenderer.removeListener('settings-updated', handler);
  },
  onUIConfigUpdated: (callback: (event: { timestamp: number }) => void) => {
    const handler = (_: any, event: any) => callback(event);
    ipcRenderer.on('ui-config-updated', handler);
    return () => ipcRenderer.removeListener('ui-config-updated', handler);
  },

  // Generic invoke method (for config and other features)
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}