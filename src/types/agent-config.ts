/**
 * Agent configuration types
 * INPUT: AgentMcpConfig from settings model
 * OUTPUT: AgentConfig, CustomAgentConfig types
 * POSITION: Core type definitions for agent settings
 */

import { AgentMcpConfig } from '@/models/settings';

export interface CustomAgentConfig {
  id: string
  name: string              // English name for workflow matching
  description: string       // System prompt
  planDescription: string
  enabled: boolean
  mcpServices: AgentMcpConfig
}

export interface AgentConfig {
  browserAgent: {
    enabled: boolean
    customPrompt?: string
    mcpServices: AgentMcpConfig
  }
  fileAgent: {
    enabled: boolean
    customPrompt?: string
    mcpServices: AgentMcpConfig
  }
  customAgents: CustomAgentConfig[]
}
