/**
 * Agent configuration types
 */

export interface AgentConfig {
  browserAgent: {
    enabled: boolean
    customPrompt?: string
  }
  fileAgent: {
    enabled: boolean
    customPrompt?: string
  }
  mcpTools: {
    [toolName: string]: {
      enabled: boolean
      config?: Record<string, any>
    }
  }
}
