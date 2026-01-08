import { WorkflowAgent } from "@jarvis-agent/core";

/**
 * Tool execution parameters
 */
export type ToolParams = Record<string, unknown>;

/**
 * File write result structure
 */
export interface FileWriteResult {
  fileName: string;
  filePath: string;
  previewUrl?: string;
  size?: number;
}

/**
 * Text content result structure
 */
export interface TextContentResult {
  content: string;
}

/**
 * Tool execution result - can be various types depending on the tool
 */
export type ToolResult = string | FileWriteResult | TextContentResult | Record<string, unknown> | unknown;

/**
 * Tool execution action
 */
export interface ToolAction {
  id: string;
  toolName: string;
  type: 'tool';
  params?: ToolParams;
  status: 'streaming' | 'use' | 'running' | 'completed';
  // Note: result type varies by tool, using any for flexibility
  // Common structures: string | FileWriteResult | TextContentResult
  result?: any;
  timestamp: Date;
  agentName: string;
}

// Text output in workflow
export interface TextMessage {
  type: 'text';
  id: string;
  content: string;
}

export type AgentMessage = ToolAction | TextMessage;

/**
 * Workflow data structure
 */
export type WorkflowData = Record<string, unknown>;

/**
 * Workflow message - contains planning and thinking process
 */
export interface WorkflowMessage {
  id: string;
  type: 'workflow';
  taskId: string;
  workflow?: WorkflowData;
  thinking?: {
    text: string;
    completed: boolean;
  };
  timestamp: Date;
}

// Agent group message - contains complete execution process of an agent
export interface AgentGroupMessage {
  id: string;
  type: 'agent_group';
  taskId: string;
  agentName: string;
  agentNode?: WorkflowAgent; // WorkflowAgent type
  messages: AgentMessage[];  // Tool execution sequence
  result?: string;
  status: 'running' | 'completed' | 'error';
  timestamp: Date;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// User message type
export interface UserMessage {
  id: string;
  type: 'user';
  content: string;
  timestamp: Date;
}

// Display layer message union type
export type DisplayMessage = WorkflowMessage | AgentGroupMessage | UserMessage;

/**
 * Fragment data types for atomic message fragments
 */
export interface ThinkingFragmentData {
  isCompleted: boolean;
}

export interface AgentTaskFragmentData {
  agentName: string;
  agentId: string;
}

export interface AgentNodeFragmentData {
  agentName: string;
  nodeIndex: number;
  totalNodes: number;
}

export interface AgentGroupHeaderFragmentData {
  agentName: string;
  agentNode?: WorkflowAgent;
  status: 'running' | 'completed' | 'error';
}

export interface ToolFragmentData {
  toolMessage: AgentMessage;
}

export type FragmentData =
  | ThinkingFragmentData
  | AgentTaskFragmentData
  | AgentNodeFragmentData
  | AgentGroupHeaderFragmentData
  | ToolFragmentData;

export type FragmentType =
  | 'user'
  | 'thinking'
  | 'agent-task'
  | 'agent-node'
  | 'text'
  | 'tool'
  | 'human-interaction'
  | 'agent-group-header';

/**
 * Atomic message fragment - the smallest unit for playback
 * Each fragment contains a single piece of text that can be displayed with typewriter effect
 */
export interface AtomicMessageFragment {
  id: string;
  type: FragmentType;
  content: string;
  originalMessageId: string;
  timestamp?: Date;
  data?: FragmentData;
}