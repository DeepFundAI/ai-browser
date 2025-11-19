import { Eko, Log, SimpleSseMcpClient, type LLMs, type StreamCallbackMessage, type AgentContext } from "@jarvis-agent/core";
import { BrowserAgent, FileAgent } from "@jarvis-agent/electron";
import type { EkoResult } from "@jarvis-agent/core/types";
import { BrowserWindow, WebContentsView, app } from "electron";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { ConfigManager } from "../utils/config-manager";
import type { HumanRequestMessage, HumanResponseMessage, HumanInteractionContext } from "../../../src/models/human-interaction";

export class EkoService {
  private eko: Eko | null = null;
  private mainWindow: BrowserWindow;
  private detailView: WebContentsView;
  private mcpClient!: SimpleSseMcpClient;
  private agents!: any[];

  // Store pending human interaction requests
  private pendingHumanRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }>();

  // Map toolId to requestId for human interactions
  private toolIdToRequestId = new Map<string, string>();

  // Store current human_interact toolId
  private currentHumanInteractToolId: string | null = null;

  constructor(mainWindow: BrowserWindow, detailView: WebContentsView) {
    this.mainWindow = mainWindow;
    this.detailView = detailView;
    this.initializeEko();
  }

  /**
   * Create stream callback handler
   */
  private createCallback() {
    return {
      onMessage: (message: StreamCallbackMessage): Promise<void> => {
        Log.info('EkoService stream callback:', message);

        // Window destroyed, return directly to avoid errors
        if (!this.mainWindow || this.mainWindow.isDestroyed()) {
          Log.warn('Main window destroyed, skipping message processing');
          return Promise.resolve();
        }

        // Capture human_interact tool's toolId when tool is being used
        if (message.type === 'tool_use' && message.toolName === 'human_interact' && message.toolId) {
          this.currentHumanInteractToolId = message.toolId;
          Log.info('Captured human_interact toolId:', message.toolId);
        }

        return new Promise((resolve) => {
           // Send stream message to renderer process via IPC
        this.mainWindow.webContents.send('eko-stream-message', message);

        // When file is modified, main view window loads file content display page
        if (message.type === 'tool_streaming' && message.toolName === 'file_write') {

          let args;
          try {
            args = JSON.parse(message.paramsText);
          } catch (error) {
            Log.error('File stream incomplete! Need to complete')
          }

          try {
            args = JSON.parse(`${message.paramsText}\"}`);
          } catch (error) {
            Log.error('File stream completion failed!');
          }

          if (args && args.content) {
            Log.info('File write detected, loading file-view in mainView', args.content);
            const url = this.detailView.webContents.getURL();
            Log.info('current URL', url, !url.includes('file-view'))
            if (!url.includes('file-view')) {
              this.detailView.webContents.loadURL(`http://localhost:5173/file-view`);
              this.detailView.webContents.once('did-finish-load', () => {
                this.detailView.webContents.send('file-updated', 'code', args.content);
                resolve();
              });
            } else {
              this.detailView.webContents.send('file-updated',  'code', args.content);
              resolve();
            }
          } else {
            resolve();
          }
        } else {
          resolve();
        }
        })
      },

      // Human interaction callbacks
      onHumanConfirm: async (agentContext: AgentContext, prompt: string): Promise<boolean> => {
        const result = await this.requestHumanInteraction(agentContext, {
          interactType: 'confirm',
          prompt
        });
        return Boolean(result);
      },

      onHumanInput: async (agentContext: AgentContext, prompt: string): Promise<string> => {
        const result = await this.requestHumanInteraction(agentContext, {
          interactType: 'input',
          prompt
        });
        return String(result ?? '');
      },

      onHumanSelect: async (
        agentContext: AgentContext,
        prompt: string,
        options: string[],
        multiple: boolean
      ): Promise<string[]> => {
        const result = await this.requestHumanInteraction(agentContext, {
          interactType: 'select',
          prompt,
          selectOptions: options,
          selectMultiple: multiple
        });
        return Array.isArray(result) ? result : [];
      },

      onHumanHelp: async (
        agentContext: AgentContext,
        helpType: 'request_login' | 'request_assistance',
        prompt: string
      ): Promise<boolean> => {
        // Get current page information for context
        let context: HumanInteractionContext | undefined;
        try {
          const url = this.detailView.webContents.getURL();
          if (url && url.startsWith('http')) {
            const hostname = new URL(url).hostname;
            context = {
              siteName: hostname,
              actionUrl: url
            };
          }
        } catch (error) {
          Log.error('Failed to get URL for human help context:', error);
        }

        const result = await this.requestHumanInteraction(agentContext, {
          interactType: 'request_help',
          prompt,
          helpType,
          context
        });
        return Boolean(result);
      }
    };
  }

  private initializeEko() {
    // Get LLMs configuration from ConfigManager
    // Priority: user config > env > default
    const configManager = ConfigManager.getInstance();
    const llms: LLMs = configManager.getLLMsConfig();

    // Get agent configuration
    const agentConfig = configManager.getAgentConfig();

    // Get correct application path
    const appPath = app.isPackaged
      ? path.join(app.getPath('userData'), 'static')  // Packaged path
      : path.join(process.cwd(), 'public', 'static');    // Development environment path

    Log.info(`FileAgent working path: ${appPath}`);

    // MCP client configuration - configure based on your MCP server address
    const sseUrl = "http://localhost:5173/api/mcp/sse";
    this.mcpClient = new SimpleSseMcpClient(sseUrl);

    // Create agents with custom prompts
    this.agents = [];

    if (agentConfig.browserAgent.enabled) {
      this.agents.push(
        new BrowserAgent(
          this.detailView,
          this.mcpClient,
          agentConfig.browserAgent.customPrompt
        )
      );
      Log.info('BrowserAgent enabled with custom prompt:', agentConfig.browserAgent.customPrompt ? 'Yes' : 'No');
    }

    if (agentConfig.fileAgent.enabled) {
      this.agents.push(
        new FileAgent(
          this.detailView,
          appPath,
          this.mcpClient,
          agentConfig.fileAgent.customPrompt
        )
      );
      Log.info('FileAgent enabled with custom prompt:', agentConfig.fileAgent.customPrompt ? 'Yes' : 'No');
    }

    // Create callback and initialize Eko instance
    const callback = this.createCallback();
    this.eko = new Eko({ llms, agents: this.agents, callback });
    Log.info('EkoService initialized with LLMs:', llms.default?.model);
  }

  /**
   * Reload LLM configuration and reinitialize Eko instance
   * Called when user changes model configuration in UI
   */
  public reloadConfig(): void {
    Log.info('Reloading EkoService configuration...');

    // Abort all running tasks before reloading
    if (this.eko) {
      const allTaskIds = this.eko.getAllTaskId();
      allTaskIds.forEach((taskId: any) => {
        try {
          this.eko!.abortTask(taskId, 'config-reload');
        } catch (error) {
          Log.error(`Failed to abort task ${taskId}:`, error);
        }
      });
    }

    // Reject all pending human interactions
    this.rejectAllHumanRequests(new Error('EkoService configuration reloaded'));

    // Get new LLMs configuration
    const configManager = ConfigManager.getInstance();
    const llms: LLMs = configManager.getLLMsConfig();

    Log.info('New LLMs config:', llms.default?.model);

    // Create new Eko instance with updated config and fresh callback
    const callback = this.createCallback();
    this.eko = new Eko({ llms, agents: this.agents, callback });

    Log.info('EkoService configuration reloaded successfully');

    // Notify frontend about config reload
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    this.mainWindow.webContents.send('eko-config-reloaded', {
      model: llms.default?.model,
      provider: llms.default?.provider
    });
  }

  /**
   * Run new task
   */
  async run(message: string): Promise<EkoResult | null> {
    if (!this.eko) {
      const errorMsg = 'Eko service not initialized';
      Log.error(errorMsg);
      this.sendErrorToFrontend(errorMsg);
      return null;
    }

    console.log('EkoService running task:', message);
    let result = null;
    try {
      result = await this.eko.run(message);
    } catch (error: any) {
      Log.error('EkoService run error:', error);

      // Extract error message
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      this.sendErrorToFrontend(errorMessage, error);
    }
    return result;
  }

  /**
   * Send error message to frontend
   */
  private sendErrorToFrontend(errorMessage: string, error?: any, taskId?: string): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      Log.warn('Main window destroyed, cannot send error message');
      return;
    }

    this.mainWindow.webContents.send('eko-stream-message', {
      type: 'error',
      error: errorMessage,
      detail: error?.stack || error?.toString() || errorMessage,
      taskId: taskId // Include taskId if available
    });
  }

  /**
   * Modify existing task
   */
  async modify(taskId: string, message: string): Promise<EkoResult | null> {
    if (!this.eko) {
      const errorMsg = 'Eko service not initialized';
      Log.error(errorMsg);
      this.sendErrorToFrontend(errorMsg, undefined, taskId);
      return null;
    }

    let result = null;
    try {
      await this.eko.modify(taskId, message);
      result = await this.eko.execute(taskId);
    } catch (error: any) {
      Log.error('EkoService modify error:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to modify task';
      this.sendErrorToFrontend(errorMessage, error, taskId);
    }
    return result;
  }

  /**
   * Execute task
   */
  async execute(taskId: string): Promise<EkoResult | null> {
    if (!this.eko) {
      const errorMsg = 'Eko service not initialized';
      Log.error(errorMsg);
      this.sendErrorToFrontend(errorMsg, undefined, taskId);
      return null;
    }

    console.log('EkoService executing task:', taskId);
    try {
      return await this.eko.execute(taskId);
    } catch (error: any) {
      Log.error('EkoService execute error:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to execute task';
      this.sendErrorToFrontend(errorMessage, error, taskId);
      return null;
    }
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<any> {
    if (!this.eko) {
      throw new Error('Eko service not initialized');
    }

    // If Eko has a method to get task status, it can be called here
    // return await this.eko.getTaskStatus(taskId);
    console.log('EkoService getting task status:', taskId);
    return { taskId, status: 'unknown' };
  }

  /**
   * Cancel task
   */
  async cancleTask(taskId: string): Promise<any> {
    if (!this.eko) {
      throw new Error('Eko service not initialized');
    }

    const res = await this.eko.abortTask(taskId, 'cancle');
    return res;
  }

  /**
   * Check if any task is running
   */
  hasRunningTask(): boolean {
    if (!this.eko) {
      return false;
    }

    const allTaskIds = this.eko.getAllTaskId();

    // Iterate through all tasks, check if any task is not terminated
    for (const taskId of allTaskIds) {
      const context = this.eko.getTask(taskId);
      if (context && !context.controller.signal.aborted) {
        // Task exists and not terminated, meaning it may be running
        return true;
      }
    }

    return false;
  }

  /**
   * Get task context (for restoring conversation)
   * Returns workflow, contextParams, and chain history needed to restore the task
   */
  getTaskContext(taskId: string): {
    workflow: any;
    contextParams: Record<string, any>;
    chainPlanRequest?: any;
    chainPlanResult?: string;
  } | null {
    if (!this.eko) {
      Log.error('Eko service not initialized');
      return null;
    }

    const context = this.eko.getTask(taskId);
    if (!context) {
      Log.error(`Task ${taskId} not found in Eko`);
      return null;
    }

    // Extract workflow and convert variables Map to plain object
    const workflow = context.workflow;
    const contextParams: Record<string, any> = {};

    // Convert Map to plain object for serialization
    context.variables.forEach((value, key) => {
      contextParams[key] = value;
    });

    // Extract chain history (critical for replan to maintain conversation context)
    const chainPlanRequest = context.chain?.planRequest;
    const chainPlanResult = context.chain?.planResult;

    Log.info('Extracted task context:', {
      taskId,
      hasWorkflow: !!workflow,
      contextParamsCount: Object.keys(contextParams).length,
      hasChainHistory: !!(chainPlanRequest && chainPlanResult)
    });

    return {
      workflow,
      contextParams,
      chainPlanRequest,
      chainPlanResult
    };
  }

  /**
   * Restore task from saved workflow and contextParams
   * Used to continue conversation from history
   */
  async restoreTask(
    workflow: any,
    contextParams?: Record<string, any>,
    chainPlanRequest?: any,
    chainPlanResult?: string
  ): Promise<string> {
    if (!this.eko) {
      throw new Error('Eko service not initialized');
    }

    try {
      Log.info('Restoring task from workflow:', workflow.taskId);

      // Use Eko's initContext to restore the task
      const context = await this.eko.initContext(workflow, contextParams);

      // Restore chain history (critical for replan to maintain conversation context)
      if (chainPlanRequest && chainPlanResult) {
        context.chain.planRequest = chainPlanRequest;
        context.chain.planResult = chainPlanResult;
        Log.info('Chain history restored successfully');
      } else {
        Log.warn('No chain history to restore - replan will treat as new task');
      }

      Log.info('Task restored successfully:', workflow.taskId);
      return workflow.taskId;
    } catch (error: any) {
      Log.error('Failed to restore task:', error);
      throw error;
    }
  }

  /**
   * Abort all running tasks
   */
  async abortAllTasks(): Promise<void> {
    if (!this.eko) {
      return;
    }

    const allTaskIds = this.eko.getAllTaskId();
    const abortPromises = allTaskIds.map((taskId: any) => this.eko!.abortTask(taskId, 'window-closing'));

    await Promise.all(abortPromises);

    // Reject all pending human interactions (also clears toolId mappings)
    this.rejectAllHumanRequests(new Error('All tasks aborted'));

    Log.info('All tasks aborted');
  }

  /**
   * Request human interaction
   * Sends interaction request to frontend and waits for user response
   */
  private requestHumanInteraction(
    agentContext: AgentContext,
    payload: Omit<HumanRequestMessage, 'type' | 'requestId' | 'timestamp'>
  ): Promise<any> {
    const requestId = randomUUID();
    const message: HumanRequestMessage = {
      type: 'human_interaction',
      requestId,
      taskId: agentContext?.context?.taskId,
      agentName: agentContext?.agent?.Name,
      timestamp: new Date(),
      ...payload
    };

    return new Promise((resolve, reject) => {
      // Store promise resolver/rejector
      this.pendingHumanRequests.set(requestId, { resolve, reject });

      // Map toolId to requestId for frontend response matching
      if (this.currentHumanInteractToolId) {
        this.toolIdToRequestId.set(this.currentHumanInteractToolId, requestId);
        Log.info('Mapped toolId to requestId:', {
          toolId: this.currentHumanInteractToolId,
          requestId
        });
        // Clear after mapping
        this.currentHumanInteractToolId = null;
      }

      // Listen for task abort signal
      const controllerSignal = agentContext?.context?.controller?.signal;
      if (controllerSignal) {
        controllerSignal.addEventListener('abort', () => {
          this.pendingHumanRequests.delete(requestId);
          reject(new Error('Task aborted during human interaction'));
        });
      }

      // Send request to frontend as a special message
      if (!this.mainWindow || this.mainWindow.isDestroyed()) {
        this.pendingHumanRequests.delete(requestId);
        reject(new Error('Main window destroyed, cannot request human interaction'));
        return;
      }

      Log.info('Requesting human interaction:', { requestId, interactType: payload.interactType, prompt: payload.prompt });
      this.mainWindow.webContents.send('eko-stream-message', message);
    });
  }

  /**
   * Handle human response from frontend
   * Called via IPC when user completes interaction
   */
  public handleHumanResponse(response: HumanResponseMessage): boolean {
    Log.info('Received human response:', response);

    // First try direct requestId match
    let pending = this.pendingHumanRequests.get(response.requestId);
    let actualRequestId = response.requestId;

    // If not found, try to find via toolId mapping (frontend might send toolId as requestId)
    if (!pending) {
      const mappedRequestId = this.toolIdToRequestId.get(response.requestId);
      if (mappedRequestId) {
        pending = this.pendingHumanRequests.get(mappedRequestId);
        actualRequestId = mappedRequestId;
        Log.info('Found requestId via toolId mapping:', {
          toolId: response.requestId,
          actualRequestId: mappedRequestId
        });
      }
    }

    if (!pending) {
      Log.error(`Human interaction request ${response.requestId} not found or already processed`);
      return false;
    }

    // Clean up both maps
    this.pendingHumanRequests.delete(actualRequestId);
    this.toolIdToRequestId.delete(response.requestId);

    if (response.success) {
      // Resolve promise, AI continues execution
      pending.resolve(response.result);

      // Send result message to frontend to update card state
      if (!this.mainWindow || this.mainWindow.isDestroyed()) {
        Log.warn('Main window destroyed, cannot send interaction result');
        return true;
      }

      this.mainWindow.webContents.send('eko-stream-message', {
        type: 'human_interaction_result',
        requestId: response.requestId,
        result: response.result,
        timestamp: new Date()
      });
    } else {
      // Reject promise, AI handles error
      pending.reject(new Error(response.error || 'Human interaction cancelled'));
    }

    return true;
  }

  /**
   * Reject all pending human interaction requests
   * Used when config reloads or service shuts down
   */
  private rejectAllHumanRequests(error: Error): void {
    if (this.pendingHumanRequests.size === 0) {
      return;
    }

    Log.info(`Rejecting ${this.pendingHumanRequests.size} pending human interaction requests`);

    for (const pending of this.pendingHumanRequests.values()) {
      pending.reject(error);
    }

    this.pendingHumanRequests.clear();
    this.toolIdToRequestId.clear();
    this.currentHumanInteractToolId = null;
  }

  /**
   * Destroy service
   */
  destroy() {
    Log.info('EkoService destroyed');
    this.rejectAllHumanRequests(new Error('EkoService destroyed'));
    this.eko = null;
  }
}