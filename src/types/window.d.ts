/**
 * Global Window API type declarations
 */

import type { ProviderType, UserModelConfigs } from './model-config';
import type { AgentConfig } from './agent-config';
import type { EkoResult } from '@jarvis-agent/core';
import type { AppSettings, McpToolInfo } from '@/models/settings';

// Unified IPC response structure
interface IpcResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

declare global {
  interface Window {
    api: {
      getMainViewScreenshot: () => Promise<IpcResponse<{ imageBase64: string; imageType: "image/jpeg" | "image/png" }>>

      // Voice and TTS
      sendTTSSubtitle: (text: string, isStart: boolean) => Promise<IpcResponse<void>>
      removeAllListeners: (channel: string) => void

      // Eko AI agent APIs
      ekoRun: (prompt: string) => Promise<IpcResponse<{ result: EkoResult }>>
      ekoModify: (taskId: string, prompt: string) => Promise<IpcResponse<{ result: EkoResult }>>
      ekoExecute: (taskId: string) => Promise<IpcResponse<void>>
      onEkoStreamMessage: (callback: (message: any) => void) => void
      ekoCancelTask: (taskId: string) => Promise<IpcResponse<void>>
      ekoPauseTask: (taskId: string, pause: boolean) => Promise<IpcResponse<{ result: boolean }>>
      ekoGetTaskContext: (taskId: string) => Promise<IpcResponse<{
        taskContext: {
          workflow: unknown;
          contextParams: Record<string, unknown>;
          chainPlanRequest?: unknown;
          chainPlanResult?: string;
        };
      }>>
      ekoRestoreTask: (
        workflow: unknown,
        contextParams?: Record<string, unknown>,
        chainPlanRequest?: unknown,
        chainPlanResult?: string
      ) => Promise<IpcResponse<{ taskId: string | null }>>
      sendHumanResponse: (response: any) => Promise<IpcResponse<void>>

      // Unified settings APIs
      getAppSettings: () => Promise<IpcResponse<AppSettings>>
      saveAppSettings: (settings: AppSettings) => Promise<IpcResponse<void>>
      onSettingsUpdated: (callback: (event: { timestamp: number }) => void) => () => void
      onUIConfigUpdated: (callback: (event: { timestamp: number }) => void) => () => void

      // Agent configuration APIs
      getAgentConfig: () => Promise<IpcResponse<{ agentConfig: AgentConfig }>>
      saveAgentConfig: (config: AgentConfig) => Promise<IpcResponse<void>>
      reloadAgentConfig: () => Promise<IpcResponse<{ agentConfig: AgentConfig }>>

      // MCP service APIs
      fetchMcpTools: (url: string) => Promise<IpcResponse<{ tools: McpToolInfo[] }>>

      // Detail view APIs
      setDetailViewVisible: (visible: boolean) => Promise<IpcResponse<void>>
      navigateDetailView: (url: string) => Promise<IpcResponse<{ url: string }>>
      refreshDetailView: () => Promise<IpcResponse<{ success: boolean }>>
      goBackDetailView: () => Promise<IpcResponse<{ success: boolean }>>
      goForwardDetailView: () => Promise<IpcResponse<{ success: boolean }>>
      getCurrentUrl: () => Promise<IpcResponse<{ url: string }>>
      onUrlChange: (callback: (url: string) => void) => void
      showHistoryView: (screenshot: string) => Promise<IpcResponse<void>>
      hideHistoryView: () => Promise<IpcResponse<void>>

      // Settings window APIs
      openSettings: () => Promise<IpcResponse<void>>
      closeSettings: () => Promise<IpcResponse<void>>

      // Event listener APIs
      onTaskExecutionComplete: (callback: (event: unknown) => void) => void
      onOpenHistoryPanel: (callback: (event: unknown) => void) => void
      onTaskAbortedBySystem: (callback: (event: unknown) => void) => void

      // File download API
      downloadFile: (filePath: string, fileName: string) => Promise<IpcResponse<void>>

      // Tab management APIs
      tabsGetAll: () => Promise<IpcResponse<{ tabs: Array<{ tabId: number; url: string; title: string }>; activeTabId: number }>>
      tabsCreate: (url?: string) => Promise<IpcResponse<{ tabId: number }>>
      tabsSwitch: (tabId: number) => Promise<IpcResponse<void>>
      tabsClose: (tabId: number) => Promise<IpcResponse<void>>
      onTabsChanged: (callback: (data: { tabs: Array<{ tabId: number; url: string; title: string }>; activeTabId: number }) => void) => () => void

      // Fetch models from provider API (bypass CORS)
      fetchModels: (providerId: string, apiKey: string, baseUrl: string) => Promise<IpcResponse<any>>

      // Generic IPC invoke method
      invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>
    }

    // PDF.js type declarations
    pdfjsLib?: {
      GlobalWorkerOptions: {
        workerSrc: string;
      };
      getDocument: (params: any) => {
        promise: Promise<{
          numPages: number;
          getPage: (pageNum: number) => Promise<{
            getTextContent: () => Promise<{
              items: Array<{ str: string; [key: string]: any }>;
            }>;
          }>;
        }>;
      };
    };
  }
}

export {};
