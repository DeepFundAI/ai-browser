// Supported providers
export type ProviderType = 'deepseek' | 'qwen' | 'google' | 'anthropic' | 'openrouter';

// Model configuration types
export interface UserModelConfigs {
  deepseek?: {
    apiKey?: string
    baseURL?: string
    model?: string
  }
  qwen?: {
    apiKey?: string
    model?: string
  }
  google?: {
    apiKey?: string
    model?: string
  }
  anthropic?: {
    apiKey?: string
    model?: string
  }
  openrouter?: {
    apiKey?: string
    model?: string
  }
  selectedProvider?: ProviderType
}

// Agent configuration types
export interface AgentConfig {
  browserAgent: {
    enabled: boolean
    customPrompt: string
  }
  fileAgent: {
    enabled: boolean
    customPrompt: string
  }
  mcpTools: {
    [toolName: string]: {
      enabled: boolean
      config?: Record<string, any>
    }
  }
}

// MCP Tool types
export interface McpToolSchema {
  name: string
  description: string
  enabled: boolean
  inputSchema: {
    type: string
    properties: Record<string, any>
    required: string[]
  }
}

declare global {
  interface Window {
    api: {
      sendToMainViewExecuteCode: (func: string, args: any[]) => Promise<any>
      navigateTo: (url: string) => Promise<{ url: string; title: string }>
      getMainViewSize: () => Promise<{ width: number; height: number }>
      getMainViewScreenshot: () => Promise<{ imageBase64: string; imageType: "image/jpeg" | "image/png" }>
      getMainViewUrlAndTitle: () => Promise<{ url: string; title: string }>
      getHiddenWindowSourceId: () => Promise<string>
      showViewWindow: () => Promise<void>
      hideViewWindow: () => Promise<void>
      sendVoiceTextToChat: (text: string) => Promise<void>
      onVoiceTextReceived: (callback: (text: string) => void) => void
      sendTTSSubtitle: (text: string, isStart: boolean) => Promise<boolean>
      onTTSSubtitleReceived: (callback: (text: string, isStart: boolean) => void) => void
      removeAllListeners: (channel: string) => void,
      getMainViewWindowNumber: () => Promise<number>
      captureWindow: (winNo: number, scale?: number) => Promise<{ width: number; height: number; stride: number; data: Buffer; error?: string }>
      captureWindowSync: (winNo: number, scale?: number) => { width: number; height: number; stride: number; data: Buffer; error?: string }
      requestCapturePermission: () => Promise<boolean>
      ekoRun: (prompt: string) => Promise<any>
      ekoModify: (taskId: string, prompt: string) => Promise<any>
      ekoExecute: (taskId: string) => Promise<any>
      onEkoStreamMessage: (callback: (message: any) => void) => void
      ekoGetTaskStatus: (taskId: string) => Promise<any>
      ekoCancelTask: (taskId: string) => Promise<any>
      sendHumanResponse: (response: any) => Promise<{ success: boolean }>

      // Model configuration APIs
      getUserModelConfigs: () => Promise<UserModelConfigs>
      saveUserModelConfigs: (configs: UserModelConfigs) => Promise<{ success: boolean }>
      getModelConfig: (provider: ProviderType) => Promise<any>
      getApiKeySource: (provider: ProviderType) => Promise<'user' | 'env' | 'none'>
      getSelectedProvider: () => Promise<ProviderType>
      setSelectedProvider: (provider: ProviderType) => Promise<{ success: boolean }>

      // Agent configuration APIs
      getAgentConfig: () => Promise<{ success: boolean; data: AgentConfig }>
      saveAgentConfig: (config: AgentConfig) => Promise<{ success: boolean }>
      getMcpTools: () => Promise<{ success: boolean; data: McpToolSchema[] }>
      setMcpToolEnabled: (toolName: string, enabled: boolean) => Promise<{ success: boolean }>
      reloadAgentConfig: () => Promise<{ success: boolean; data: AgentConfig }>
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

export {} 