import { Agent, Eko, SimpleSseMcpClient, type IMcpClient, type LLMs, type StreamCallbackMessage, type AgentContext, type EkoResult } from "@jarvis-agent/core";
import { BrowserAgent, FileAgent } from "@jarvis-agent/electron";
import { BrowserWindow, app } from "electron";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { ConfigManager } from "../utils/config-manager";
import { SettingsManager } from "../utils/settings-manager";
import { TabManager } from "./tab-manager";
import type { AgentMcpConfig, McpServiceConfig } from "../models/settings";
import type { HumanRequestMessage, HumanResponseMessage, HumanInteractionContext } from "../../../src/models/human-interaction";

export class EkoService {
  private eko: Eko | null = null;
  private mainWindow: BrowserWindow;
  private tabManager: TabManager;
  private browserAgent: BrowserAgent | null = null;

  // Store pending human interaction requests
  private pendingHumanRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }>();

  // Map toolCallId to requestId for human interactions
  private toolCallIdToRequestId = new Map<string, string>();

  // Store current human_interact toolCallId
  private currentHumanInteractToolCallId: string | null = null;

  // Track running task IDs for accurate status checking
  private runningTaskIds: Set<string> = new Set();

  constructor(mainWindow: BrowserWindow, tabManager: TabManager) {
    this.mainWindow = mainWindow;
    this.tabManager = tabManager;
    this.initializeEko();
  }

  /**
   * Create stream callback handler
   */
  private createCallback() {
    return {
      onMessage: (message: StreamCallbackMessage): Promise<void> => {
        if (!this.mainWindow || this.mainWindow.isDestroyed()) {
          return Promise.resolve();
        }

        if (message.type === 'tool_use' && message.toolName === 'human_interact' && message.toolCallId) {
          this.currentHumanInteractToolCallId = message.toolCallId;
        }

        return new Promise((resolve) => {
          this.mainWindow.webContents.send('eko-stream-message', message);

          if (message.type === 'tool_streaming' && message.toolName === 'file_write') {
            let args;
            try {
              args = JSON.parse(message.paramsText);
            } catch {
              try {
                args = JSON.parse(`${message.paramsText}\"}`);
              } catch {
                resolve();
                return;
              }
            }

            if (args?.content) {
              const activeView = this.tabManager.getActiveView();
              if (!activeView) {
                resolve();
                return;
              }
              const url = activeView.webContents.getURL();
              const fileName = args.fileName || args.path || 'file.txt';
              if (!url.includes('file-view')) {
                activeView.webContents.loadURL(`http://localhost:5173/file-view`);
                activeView.webContents.once('did-finish-load', () => {
                  activeView.webContents.send('file-updated', 'code', args.content, fileName);
                  resolve();
                });
              } else {
                activeView.webContents.send('file-updated', 'code', args.content, fileName);
                resolve();
              }
            } else {
              resolve();
            }
          } else {
            resolve();
          }
        });
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
        multiple?: boolean,
        _extInfo?: any
      ): Promise<string[]> => {
        const result = await this.requestHumanInteraction(agentContext, {
          interactType: 'select',
          prompt,
          selectOptions: options,
          selectMultiple: multiple ?? false
        });
        return Array.isArray(result) ? result : [];
      },

      onHumanHelp: async (
        agentContext: AgentContext,
        helpType: 'request_login' | 'request_assistance',
        prompt: string
      ): Promise<boolean> => {
        let context: HumanInteractionContext | undefined;
        try {
          const activeView = this.tabManager.getActiveView();
          const url = activeView?.webContents.getURL();
          if (url?.startsWith('http')) {
            context = {
              siteName: new URL(url).hostname,
              actionUrl: url
            };
          }
        } catch {}

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

  /**
   * Build custom Agent instances from config
   */
  private buildCustomAgents(agentConfig: ReturnType<ConfigManager['getAgentConfig']>): Agent[] {
    return (agentConfig?.customAgents ?? [])
      .filter(c => c.enabled)
      .map(c => new Agent({
        name: c.name,
        description: c.description,
        planDescription: c.planDescription,
        tools: [],
        mcpClients: this.buildMcpClients(c.mcpServices),
      }));
  }

  /**
   * Build MCP clients for a specific agent based on its config
   */
  private buildMcpClients(agentMcpConfig: AgentMcpConfig): IMcpClient[] {
    const mcpSettings = ConfigManager.getInstance().getMcpSettings();
    const services: McpServiceConfig[] = mcpSettings?.services ?? [];

    return services
      .filter(service => agentMcpConfig[service.id]?.enabled)
      .map(service => new SimpleSseMcpClient(service.url));
  }

  /**
   * Get base work path for file storage
   */
  private getBaseWorkPath(): string {
    return app.isPackaged
      ? path.join(app.getPath('userData'), 'static')
      : path.join(process.cwd(), 'public', 'static');
  }

  /**
   * Get task-specific work path with unique taskId
   */
  private getTaskWorkPath(taskId: string): string {
    return path.join(this.getBaseWorkPath(), taskId);
  }

  /**
   * Build plan/compress LLM key arrays from chat settings
   */
  private buildOptionalLlmKeys(): { planLlms?: string[]; compressLlms?: string[] } {
    const chatSettings = SettingsManager.getInstance().getAppSettings().chat;
    const result: { planLlms?: string[]; compressLlms?: string[] } = {};
    if (chatSettings.planModel) result.planLlms = ['plan'];
    if (chatSettings.compressModel) result.compressLlms = ['compress'];
    return result;
  }

  /**
   * Create Eko instance for a specific task with unique work directory
   */
  private createEkoForTask(taskId: string): Eko {
    const configManager = ConfigManager.getInstance();
    const llms: LLMs = configManager.getLLMsConfig();
    const agentConfig = configManager.getAgentConfig();
    const agents: any[] = [];

    // Reuse BrowserAgent (no file storage involved)
    if (this.browserAgent) {
      agents.push(this.browserAgent);
    }

    // Create FileAgent with task-specific work directory
    if (agentConfig?.fileAgent?.enabled) {
      const taskWorkPath = this.getTaskWorkPath(taskId);
      fs.mkdirSync(taskWorkPath, { recursive: true });
      const activeView = this.tabManager.getActiveView();
      if (activeView) {
        const fileMcpClients = this.buildMcpClients(agentConfig.fileAgent.mcpServices);
        agents.push(
          new FileAgent(activeView, taskWorkPath, fileMcpClients, agentConfig.fileAgent.customPrompt)
        );
      }
    }

    // Create custom agents
    agents.push(...this.buildCustomAgents(agentConfig));

    // Get network settings for timeout and retry configuration
    const settingsManager = SettingsManager.getInstance();
    const networkSettings = settingsManager.getAppSettings().network;

    return new Eko({
      llms,
      agents,
      ...this.buildOptionalLlmKeys(),
      callback: this.createCallback(),
      globalConfig: {
        streamFirstTimeout: networkSettings.requestTimeout * 1000,
        streamTokenTimeout: networkSettings.streamTimeout * 1000,
        maxRetryNum: networkSettings.retryAttempts
      }
    });
  }

  private initializeEko() {
    const configManager = ConfigManager.getInstance();
    const llms: LLMs = configManager.getLLMsConfig();
    const agentConfig = configManager.getAgentConfig();

    // Only create BrowserAgent once (no file storage involved)
    if (agentConfig?.browserAgent?.enabled) {
      const browserMcpClients = this.buildMcpClients(agentConfig.browserAgent.mcpServices);
      this.browserAgent = new BrowserAgent(this.tabManager, browserMcpClients, agentConfig.browserAgent.customPrompt);
    }

    // Create default Eko instance with BrowserAgent + custom agents for restore/modify
    const defaultAgents: any[] = this.browserAgent ? [this.browserAgent] : [];
    defaultAgents.push(...this.buildCustomAgents(agentConfig));

    // Get network settings for timeout and retry configuration
    const settingsManager = SettingsManager.getInstance();
    const networkSettings = settingsManager.getAppSettings().network;

    this.eko = new Eko({
      llms,
      agents: defaultAgents,
      ...this.buildOptionalLlmKeys(),
      callback: this.createCallback(),
      globalConfig: {
        streamFirstTimeout: networkSettings.requestTimeout * 1000,
        streamTokenTimeout: networkSettings.streamTimeout * 1000,
        maxRetryNum: networkSettings.retryAttempts
      }
    });
  }

  /**
   * Reload LLM configuration and reinitialize Eko instance
   */
  public reloadConfig(): void {
    if (this.eko) {
      this.eko.getAllTaskId().forEach((taskId: any) => {
        try {
          this.eko!.abortTask(taskId, 'config-reload');
        } catch (error) {
          console.error(`[EkoService] Failed to abort task ${taskId}:`, error);
        }
      });
    }

    this.rejectAllHumanRequests(new Error('EkoService configuration reloaded'));

    const configManager = ConfigManager.getInstance();
    const llms: LLMs = configManager.getLLMsConfig();
    const agentConfig = configManager.getAgentConfig();

    // Recreate BrowserAgent with new config
    if (agentConfig?.browserAgent?.enabled) {
      const browserMcpClients = this.buildMcpClients(agentConfig.browserAgent.mcpServices);
      this.browserAgent = new BrowserAgent(this.tabManager, browserMcpClients, agentConfig.browserAgent.customPrompt);
    } else {
      this.browserAgent = null;
    }

    // Create default Eko instance with custom agents
    const reloadAgents: any[] = this.browserAgent ? [this.browserAgent] : [];
    reloadAgents.push(...this.buildCustomAgents(agentConfig));

    // Get network settings for timeout and retry configuration
    const settingsManager = SettingsManager.getInstance();
    const networkSettings = settingsManager.getAppSettings().network;

    this.eko = new Eko({
      llms,
      agents: reloadAgents,
      ...this.buildOptionalLlmKeys(),
      callback: this.createCallback(),
      globalConfig: {
        streamFirstTimeout: networkSettings.requestTimeout * 1000,
        streamTokenTimeout: networkSettings.streamTimeout * 1000,
        maxRetryNum: networkSettings.retryAttempts
      }
    });

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('eko-config-reloaded', {
        model: llms.default?.model,
        provider: llms.default?.provider
      });
    }
  }

  async run(message: string): Promise<EkoResult | null> {
    let taskId: string | null = null;
    try {
      // Generate unique taskId for this execution
      taskId = randomUUID();

      // Create Eko instance with task-specific work directory
      this.eko = this.createEkoForTask(taskId);
      this.runningTaskIds.add(taskId);

      // Execute with the specified taskId
      return await this.eko.run(message, taskId);
    } catch (error: any) {
      console.error('[EkoService] Run error:', error);
      this.sendErrorToFrontend(error?.message || 'Unknown error occurred', error);
      return null;
    } finally {
      if (taskId) {
        this.runningTaskIds.delete(taskId);
      }
    }
  }

  async modify(taskId: string, message: string): Promise<EkoResult | null> {
    if (!this.eko) {
      console.error('[EkoService] Eko service not initialized');
      this.sendErrorToFrontend('Eko service not initialized', undefined, taskId);
      return null;
    }

    try {
      // Reset aborted context before modify to avoid stale abort signal
      const context = this.eko.getTask(taskId);
      if (context?.controller?.signal?.aborted) {
        context.reset();
      }

      await this.eko.modify(taskId, message);
      this.runningTaskIds.add(taskId);
      return await this.eko.execute(taskId);
    } catch (error: any) {
      console.error('[EkoService] Modify error:', error);
      this.sendErrorToFrontend(error?.message || 'Failed to modify task', error, taskId);
      return null;
    } finally {
      this.runningTaskIds.delete(taskId);
    }
  }

  async execute(taskId: string): Promise<EkoResult | null> {
    if (!this.eko) {
      console.error('[EkoService] Eko service not initialized');
      this.sendErrorToFrontend('Eko service not initialized', undefined, taskId);
      return null;
    }

    try {
      this.runningTaskIds.add(taskId);
      return await this.eko.execute(taskId);
    } catch (error: any) {
      console.error('[EkoService] Execute error:', error);
      this.sendErrorToFrontend(error?.message || 'Failed to execute task', error, taskId);
      return null;
    } finally {
      this.runningTaskIds.delete(taskId);
    }
  }

  /**
   * Pause or resume a running task
   */
  pauseTask(taskId: string, pause: boolean): boolean {
    if (!this.eko) return false;
    return this.eko.pauseTask(taskId, pause);
  }

  async cancleTask(taskId: string): Promise<any> {
    if (!this.eko) {
      console.error('[EkoService] Eko service not initialized');
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const result = await this.eko.abortTask(taskId, 'cancle');
      return { success: result };
    } catch (error: any) {
      console.error('[EkoService] Failed to cancel task:', error);
      return { success: false, error: error.message };
    }
  }

  private sendErrorToFrontend(errorMessage: string, error?: any, taskId?: string): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('eko-stream-message', {
        type: 'error',
        error: errorMessage,
        detail: error?.stack || error?.toString() || errorMessage,
        taskId
      });
    }
  }

  /**
   * Check if any task is running
   */
  hasRunningTask(): boolean {
    return this.runningTaskIds.size > 0;
  }

  getTaskContext(taskId: string): {
    workflow: any;
    contextParams: Record<string, any>;
    chainPlanRequest?: any;
    chainPlanResult?: string;
  } | null {
    if (!this.eko) return null;

    const context = this.eko.getTask(taskId);
    if (!context) return null;

    const contextParams: Record<string, any> = {};
    context.variables.forEach((value, key) => {
      contextParams[key] = value;
    });

    return {
      workflow: context.workflow,
      contextParams,
      chainPlanRequest: context.chain?.planRequest,
      chainPlanResult: context.chain?.planResult
    };
  }

  async restoreTask(
    workflow: any,
    contextParams?: Record<string, any>,
    chainPlanRequest?: any,
    chainPlanResult?: string
  ): Promise<string | null> {
    try {
      const taskId = workflow.taskId;

      // Create Eko instance with task-specific work directory for restored task
      this.eko = this.createEkoForTask(taskId);

      const context = await this.eko.initContext(workflow, contextParams);

      if (chainPlanRequest && chainPlanResult) {
        context.chain.planRequest = chainPlanRequest;
        context.chain.planResult = chainPlanResult;
      }

      return taskId;
    } catch (error: any) {
      console.error('[EkoService] Failed to restore task:', error);
      return null;
    }
  }

  async abortAllTasks(): Promise<void> {
    if (!this.eko) return;

    const abortPromises = this.eko.getAllTaskId().map((taskId: any) =>
      this.eko!.abortTask(taskId, 'window-closing')
    );

    await Promise.all(abortPromises);
    this.rejectAllHumanRequests(new Error('All tasks aborted'));
  }

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
      this.pendingHumanRequests.set(requestId, { resolve, reject });

      if (this.currentHumanInteractToolCallId) {
        this.toolCallIdToRequestId.set(this.currentHumanInteractToolCallId, requestId);
        this.currentHumanInteractToolCallId = null;
      }

      agentContext?.context?.controller?.signal?.addEventListener('abort', () => {
        this.pendingHumanRequests.delete(requestId);
        reject(new Error('Task aborted during human interaction'));
      });

      if (!this.mainWindow || this.mainWindow.isDestroyed()) {
        this.pendingHumanRequests.delete(requestId);
        reject(new Error('Main window destroyed'));
        return;
      }

      this.mainWindow.webContents.send('eko-stream-message', message);
    });
  }

  public handleHumanResponse(response: HumanResponseMessage): boolean {
    let pending = this.pendingHumanRequests.get(response.requestId);
    let actualRequestId = response.requestId;

    if (!pending) {
      const mappedRequestId = this.toolCallIdToRequestId.get(response.requestId);
      if (mappedRequestId) {
        pending = this.pendingHumanRequests.get(mappedRequestId);
        actualRequestId = mappedRequestId;
      }
    }

    if (!pending) return false;

    this.pendingHumanRequests.delete(actualRequestId);
    this.toolCallIdToRequestId.delete(response.requestId);

    if (response.success) {
      pending.resolve(response.result);

      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('eko-stream-message', {
          type: 'human_interaction_result',
          requestId: response.requestId,
          result: response.result,
          timestamp: new Date()
        });
      }
    } else {
      pending.reject(new Error(response.error || 'Human interaction cancelled'));
    }

    return true;
  }

  private rejectAllHumanRequests(error: Error): void {
    if (this.pendingHumanRequests.size === 0) return;

    for (const pending of this.pendingHumanRequests.values()) {
      pending.reject(error);
    }

    this.pendingHumanRequests.clear();
    this.toolCallIdToRequestId.clear();
    this.currentHumanInteractToolCallId = null;
  }

  destroy() {
    this.rejectAllHumanRequests(new Error('EkoService destroyed'));
    this.eko = null;
  }
}