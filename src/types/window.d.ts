/**
 * Global Window API type declarations
 */

import type { ProviderType, UserModelConfigs } from './model-config';
import type { AgentConfig } from './agent-config';
import type { McpToolSchema } from './mcp';
import type { EkoResult } from '@jarvis-agent/core/dist/types';
import type { AppSettings } from '@/models/settings';

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
      sendHumanResponse: (response: any) => Promise<IpcResponse<void>>

      // Unified settings APIs
      getAppSettings: () => Promise<IpcResponse<AppSettings>>
      saveAppSettings: (settings: AppSettings) => Promise<IpcResponse<void>>
      onSettingsUpdated: (callback: (event: { timestamp: number }) => void) => () => void

      // Agent configuration APIs
      getAgentConfig: () => Promise<IpcResponse<{ agentConfig: AgentConfig }>>
      saveAgentConfig: (config: AgentConfig) => Promise<IpcResponse<void>>
      getMcpTools: () => Promise<IpcResponse<{ tools: McpToolSchema[] }>>
      setMcpToolEnabled: (toolName: string, enabled: boolean) => Promise<IpcResponse<void>>
      reloadAgentConfig: () => Promise<IpcResponse<{ agentConfig: AgentConfig }>>
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
