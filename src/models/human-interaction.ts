/**
 * Human Interaction Types
 * Used for AI agent requesting user intervention during task execution
 */

export type HumanInteractType = 'confirm' | 'input' | 'select' | 'request_help';
export type HelpType = 'request_login' | 'request_assistance';

/**
 * Context information for human interaction
 */
export interface HumanInteractionContext {
  siteName?: string;      // Site name (e.g., "Xueqiu", "Zhihu")
  siteIcon?: string;      // Site icon URL or data URI
  actionUrl?: string;     // Action URL (e.g., login page URL)
}

/**
 * Human interaction request message (Main process → Renderer process)
 */
export interface HumanRequestMessage {
  type: 'human_interaction';
  requestId: string;           // Unique request ID (UUID)
  taskId?: string;             // Associated task ID
  agentName?: string;          // Agent name requesting interaction
  interactType: HumanInteractType;
  prompt: string;              // Prompt text to display to user
  selectOptions?: string[];    // Options for 'select' type
  selectMultiple?: boolean;    // Whether to allow multiple selections (for 'select' type)
  helpType?: HelpType;         // Help type (for 'request_help' type)
  context?: HumanInteractionContext;
  timestamp: Date;
}

/**
 * Human interaction response message (Renderer process → Main process)
 */
export interface HumanResponseMessage {
  requestId: string;
  success: boolean;            // Whether user completed the interaction successfully
  result?: boolean | string | string[]; // Result data (type depends on interactType)
  error?: string;              // Error message (e.g., user cancelled)
}

/**
 * Human interaction result message (Main process → Renderer process)
 * Sent after response is processed, used to update card state
 */
export interface HumanInteractionResultMessage {
  type: 'human_interaction_result';
  requestId: string;
  result: boolean | string | string[];
  timestamp: Date;
}
