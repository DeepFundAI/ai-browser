import { DisplayMessage } from './message';

// Task status enum - consistent with eko-core
export type TaskStatus = 'running' | 'done' | 'error' | 'abort';

// Task type enum
export type TaskType = 'normal' | 'scheduled';

// File attachment interface
export interface FileAttachment {
  id: string;              // Unique ID
  name: string;            // File name
  path: string;            // File path (relative to appPath)
  url: string;             // Access URL (e.g., /static/xxx.md)
  type: 'markdown' | 'code' | 'text' | 'other'; // File type
  size?: number;           // File size (bytes)
  createdAt: Date;         // Creation time
}

// Task object (unified for normal tasks and scheduled task execution history)
export interface Task {
  id: string;
  name: string;
  workflow?: any; // Workflow type (from jarvis-agent/eko-core)
  messages: DisplayMessage[]; // Use specific message types
  executionId?: string; // Execution ID, used to associate specific execution records
  status?: TaskStatus; // Task status
  createdAt: Date; // Creation time
  updatedAt: Date; // Update time

  // Tool call history (includes screenshots)
  toolHistory?: Array<{
    id: string;
    toolName: string;
    type: 'tool';
    status: 'streaming' | 'use' | 'running' | 'completed';
    timestamp: Date;
    screenshot?: string;
    toolSequence?: number;
    agentName: string;
  }>;

  // === Task type identifier (key fields for unified storage) ===
  taskType: TaskType; // Task type: normal=normal task, scheduled=scheduled task execution history

  // === Scheduled task execution history related fields ===
  scheduledTaskId?: string; // Associated scheduled task configuration ID (only used when taskType=scheduled)
  startTime?: Date; // Execution start time
  endTime?: Date; // Execution end time
  duration?: number; // Execution duration (milliseconds)
  error?: string; // Error message
  windowId?: string; // Execution window ID

  // Whether it's a historical task (read-only)
  isHistorical?: boolean;

  // === Context restoration fields (for continuing conversation) ===
  contextParams?: Record<string, any>; // Task context parameters (variables from Context.variables)
  lastUrl?: string; // Last accessed URL in detail view
  files?: FileAttachment[]; // Generated files list

  // Chain history for replan (critical for context continuation)
  chainPlanRequest?: any; // Chain.planRequest - previous planning LLM request
  chainPlanResult?: string; // Chain.planResult - previous planning result
}