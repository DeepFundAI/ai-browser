import { Agent, Eko, ChatAgent, SimpleSseMcpClient, SimpleHttpMcpClient, resetWorkflowXml, global as ekoGlobal, type IMcpClient, type LLMs, type StreamCallbackMessage, type AgentContext, type EkoResult, type EkoDialogueConfig, type ChatStreamCallback, type ChatStreamMessage } from "@jarvis-agent/core";
import { BrowserAgent, FileAgent } from "@jarvis-agent/electron";
import { BrowserWindow, app } from "electron";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { ConfigManager } from "../utils/config-manager";
import { SettingsManager } from "../utils/settings-manager";
import { TabManager } from "./tab-manager";
import { AppChatService } from "./app-chat-service";
import { AppBrowserService } from "./app-browser-service";
import { SkillService } from "./skill-service";
import { MemoryService, buildMemoryTools } from "./memory";
import { buildMcpDialogueTools } from "./mcp-dialogue-tools";
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

  // Store pending workflow confirm requests
  private pendingWorkflowConfirms = new Map<string, {
    resolve: (result: "confirm" | "cancel" | "regenerate") => void;
  }>();

  // Map confirmId → taskId for regeneration
  private confirmIdToTaskId = new Map<string, string>();

  // Track running task IDs for accurate status checking
  private runningTaskIds: Set<string> = new Set();

  // Store original prompts for regeneration
  private taskPrompts = new Map<string, string>();

  // ChatAgent instance for chat mode
  private chatAgent: ChatAgent | null = null;
  private chatMcpClients: IMcpClient[] = [];
  private chatAbortControllers = new Map<string, AbortController>();

  // Global services for eko-core
  private appChatService: AppChatService;
  private skillService: SkillService;
  private memoryService: MemoryService;

  constructor(mainWindow: BrowserWindow, tabManager: TabManager) {
    this.mainWindow = mainWindow;
    this.tabManager = tabManager;
    this.skillService = new SkillService();
    this.memoryService = new MemoryService();
    this.appChatService = this.initializeGlobalServices();
    this.initializeEko();
    // Async init memory (non-blocking)
    this.memoryService.initialize().catch(err =>
      console.error('[EkoService] Memory init failed:', err)
    );
  }

  /** Inject ChatService & BrowserService into eko-core global (only once) */
  private initializeGlobalServices(): AppChatService {
    // Only set global services if not already initialized,
    // to avoid task windows overwriting main window's services.
    if (!ekoGlobal.browserService) {
      ekoGlobal.browserService = new AppBrowserService(this.tabManager);
    }

    // Inject SkillService (type will be available after next jarvis-agent release)
    if (!(ekoGlobal as any).skillService) {
      (ekoGlobal as any).skillService = this.skillService;
    }

    if (!ekoGlobal.chatService) {
      const searchConfig = SettingsManager.getInstance().getAppSettings().chat.searchProvider;
      const chatService = new AppChatService(searchConfig);
      chatService.setMemoryService(this.memoryService);
      ekoGlobal.chatService = chatService;
      console.log("[EkoService] Global services injected");
      return chatService;
    }

    return ekoGlobal.chatService as AppChatService;
  }

  // Remap duplicate thinking streamIds across ReAct loops
  private thinkingStreamIdMap: { originalId: string; mappedId: string; done: boolean } | null = null;

  /** Ensure each thinking round gets a unique streamId */
  private deduplicateThinkingStreamId(msg: any): void {
    const map = this.thinkingStreamIdMap;

    if (!map || map.done) {
      // First thinking ever, or previous round finished — start new mapping
      const needsRemap = map?.done && map.originalId === msg.streamId;
      const mappedId = needsRemap ? randomUUID() : msg.streamId;
      this.thinkingStreamIdMap = { originalId: msg.streamId, mappedId, done: false };
      msg.streamId = mappedId;
    } else {
      // Ongoing round — apply current mapping
      msg.streamId = map.mappedId;
    }

    if (msg.streamDone && this.thinkingStreamIdMap) {
      this.thinkingStreamIdMap.done = true;
    }
  }

  private createCallback() {
    return {
      onMessage: (message: StreamCallbackMessage): Promise<void> => {
        if (!this.mainWindow || this.mainWindow.isDestroyed()) {
          return Promise.resolve();
        }

        // Fix duplicate thinking streamId (e.g. DeepSeek always returns "reasoning-0")
        if (message.type === 'thinking') {
          this.deduplicateThinkingStreamId(message as any);
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
                let resolved = false;
                const done = (sendFile: boolean) => {
                  if (resolved) return;
                  resolved = true;
                  clearTimeout(timer);
                  if (sendFile) activeView.webContents.send('file-updated', 'code', args.content, fileName);
                  resolve();
                };
                const timer = setTimeout(() => done(true), 5000);
                activeView.webContents.once('did-finish-load', () => done(true));
                activeView.webContents.once('did-fail-load', () => done(false));
                activeView.webContents.loadURL(`http://localhost:5173/file-view`);
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
      .filter(service => agentMcpConfig[service.id]?.enabled && service.url)
      .map(service => service.type === 'http'
        ? new SimpleHttpMcpClient(service.url, undefined, service.headers)
        : new SimpleSseMcpClient(service.url, undefined, service.headers)
      );
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

  /** Build plan/compress LLM key arrays from chat settings */
  private buildOptionalLlmKeys(): { planLlms?: string[]; compressLlms?: string[] } {
    const chatSettings = SettingsManager.getInstance().getAppSettings().chat;
    const result: { planLlms?: string[]; compressLlms?: string[] } = {};
    if (chatSettings.planModel) result.planLlms = ['plan'];
    if (chatSettings.compressModel) result.compressLlms = ['compress'];
    return result;
  }

  /** Build globalConfig from app settings */
  private buildGlobalConfig(): Record<string, unknown> {
    const settings = SettingsManager.getInstance().getAppSettings();
    const { network, chat } = settings;
    return {
      maxOutputTokens: chat.maxTokens,
      streamFirstTimeout: network.requestTimeout * 1000,
      streamTokenTimeout: network.streamTimeout * 1000,
      maxRetryNum: network.retryAttempts,
      ...(chat.expertMode && { expertMode: true }),
    };
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

    return new Eko({
      llms,
      agents,
      ...this.buildOptionalLlmKeys(),
      callback: this.createCallback(),
      globalConfig: this.buildGlobalConfig(),
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

    this.eko = new Eko({
      llms,
      agents: defaultAgents,
      ...this.buildOptionalLlmKeys(),
      callback: this.createCallback(),
      globalConfig: this.buildGlobalConfig(),
    });
  }

  /** Expose SkillService for IPC handlers */
  getSkillService(): SkillService {
    return this.skillService;
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

    // Hot-swap search provider
    const searchConfig = SettingsManager.getInstance().getAppSettings().chat.searchProvider;
    this.appChatService.updateSearchProvider(searchConfig);

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

    this.eko = new Eko({
      llms,
      agents: reloadAgents,
      ...this.buildOptionalLlmKeys(),
      callback: this.createCallback(),
      globalConfig: this.buildGlobalConfig(),
    });

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('eko-config-reloaded', {
        model: llms.default?.model,
        provider: llms.default?.provider
      });
    }
  }

  /** Send workflow_confirm to frontend and wait for user response */
  private requestWorkflowConfirm(taskId: string): Promise<"confirm" | "cancel" | "regenerate"> {
    if (!this.eko || !this.mainWindow || this.mainWindow.isDestroyed()) {
      return Promise.resolve("confirm");
    }

    const context = this.eko.getTask(taskId);
    if (!context?.workflow) return Promise.resolve("confirm");

    const confirmId = randomUUID();
    this.confirmIdToTaskId.set(confirmId, taskId);
    return new Promise((resolve) => {
      this.pendingWorkflowConfirms.set(confirmId, { resolve });
      this.mainWindow.webContents.send('eko-stream-message', {
        type: 'workflow_confirm',
        taskId,
        confirmId,
        workflow: context.workflow,
      });
    });
  }

  /** Generate workflow and loop confirm until confirmed or cancelled */
  private async generateAndConfirm(taskId: string, prompt: string, contextParams?: Record<string, string>): Promise<boolean> {
    if (!this.eko) return false;

    await this.eko.generate(prompt, taskId, contextParams);

    // Loop: confirm → regenerate → confirm → ...
    while (true) {
      const result = await this.requestWorkflowConfirm(taskId);
      if (result === 'confirm') return true;
      if (result === 'cancel') return false;
      // regenerate: re-generate and loop back
      await this.eko.generate(prompt, taskId, contextParams);
    }
  }

  /** Extract <use_skill> tag and load skill instructions for Planner */
  private async extractSkillContext(message: string): Promise<{ cleanMessage: string; skillContext?: string }> {
    const match = message.match(/<use_skill\s+name="([^"]+)"\s*\/>/);
    if (!match) return { cleanMessage: message };

    const skillName = match[1];
    const content = await this.skillService.loadSkill(skillName);
    if (!content) return { cleanMessage: message };

    const cleanMessage = message.replace(match[0], '').trim();
    const skillContext = [
      `## Skill: ${content.metadata.name}`,
      content.instructions.trim(),
      content.resources.length > 0
        ? `\nAvailable resources (base: ${content.basePath}):\n${content.resources.map(r => `  - ${r}`).join('\n')}`
        : '',
    ].filter(Boolean).join('\n');

    return { cleanMessage, skillContext };
  }

  async run(message: string, skipConfirm = false): Promise<EkoResult | null> {
    let taskId: string | null = null;
    try {
      // Extract skill context for Planner if /skill-name was used
      const { cleanMessage, skillContext } = await this.extractSkillContext(message);
      const contextParams: Record<string, string> | undefined = skillContext
        ? { planExtPrompt: skillContext }
        : undefined;

      // Generate unique taskId for this execution
      taskId = randomUUID();

      // Create Eko instance with task-specific work directory
      this.eko = this.createEkoForTask(taskId);
      this.runningTaskIds.add(taskId);
      this.taskPrompts.set(taskId, cleanMessage);
      this.thinkingStreamIdMap = null;

      if (skipConfirm) {
        await this.eko.generate(cleanMessage, taskId, contextParams);
      } else {
        const confirmed = await this.generateAndConfirm(taskId, cleanMessage, contextParams);
        if (!confirmed) {
          return { taskId, success: false, stopReason: 'abort', result: 'User cancelled workflow' };
        }
      }

      const result = await this.eko.execute(taskId);
      this.triggerExploreMemoryExtraction(cleanMessage, result);
      return result;
    } catch (error: unknown) {
      console.error('[EkoService] Run error:', error);
      const errMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      this.sendErrorToFrontend(errMsg, error);
      return null;
    } finally {
      if (taskId) {
        this.runningTaskIds.delete(taskId);
        this.taskPrompts.delete(taskId);
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
      // Extract skill context and inject into existing task context
      const { cleanMessage, skillContext } = await this.extractSkillContext(message);
      const context = this.eko.getTask(taskId);

      // Reset aborted context before modify to avoid stale abort signal
      if (context?.controller?.signal?.aborted) {
        context.reset();
      }

      // Inject skill context into existing task variables
      if (skillContext && context) {
        context.variables.set('planExtPrompt', skillContext);
      }

      await this.eko.modify(taskId, cleanMessage);
      this.runningTaskIds.add(taskId);
      this.taskPrompts.set(taskId, cleanMessage);

      // Loop: confirm → regenerate → confirm → ...
      while (true) {
        const result = await this.requestWorkflowConfirm(taskId);
        if (result === 'cancel') {
          return { taskId, success: false, stopReason: 'abort', result: 'User cancelled workflow' };
        }
        if (result === 'confirm') break;
        // regenerate
        await this.eko.modify(taskId, cleanMessage);
      }

      const result = await this.eko.execute(taskId);
      this.triggerExploreMemoryExtraction(cleanMessage, result);
      return result;
    } catch (error: unknown) {
      console.error('[EkoService] Modify error:', error);
      const errMsg = error instanceof Error ? error.message : 'Failed to modify task';
      this.sendErrorToFrontend(errMsg, error, taskId);
      return null;
    } finally {
      this.runningTaskIds.delete(taskId);
      this.taskPrompts.delete(taskId);
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
    } catch (error: unknown) {
      console.error('[EkoService] Execute error:', error);
      const errMsg = error instanceof Error ? error.message : 'Failed to execute task';
      this.sendErrorToFrontend(errMsg, error, taskId);
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

  async cancelTask(taskId: string): Promise<any> {
    if (!this.eko) {
      console.error('[EkoService] Eko service not initialized');
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const result = await this.eko.abortTask(taskId, 'cancel');
      return { success: result };
    } catch (error: unknown) {
      console.error('[EkoService] Failed to cancel task:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private sendErrorToFrontend(errorMessage: string, error?: unknown, taskId?: string): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('eko-stream-message', {
        type: 'error',
        error: errorMessage,
        detail: error instanceof Error ? error.stack : String(error ?? errorMessage),
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

  /** Resolve a pending workflow confirm request */
  public resolveWorkflowConfirm(confirmId: string, confirmed: boolean, modifiedWorkflow?: any): void {
    const pending = this.pendingWorkflowConfirms.get(confirmId);
    if (!pending) return;

    // Apply modified workflow agents before confirming
    if (confirmed && modifiedWorkflow?.agents && this.eko) {
      const taskId = this.confirmIdToTaskId.get(confirmId);
      if (taskId) {
        const context = this.eko.getTask(taskId);
        if (context?.workflow) {
          context.workflow.agents = modifiedWorkflow.agents;
          resetWorkflowXml(context.workflow);
        }
      }
    }

    pending.resolve(confirmed ? "confirm" : "cancel");
    this.pendingWorkflowConfirms.delete(confirmId);
    this.confirmIdToTaskId.delete(confirmId);
  }

  /** Trigger workflow regeneration by resolving pending confirm */
  public regenerateWorkflow(taskId: string): void {
    for (const [cid, pending] of this.pendingWorkflowConfirms) {
      if (this.confirmIdToTaskId.get(cid) === taskId) {
        pending.resolve('regenerate');
        this.pendingWorkflowConfirms.delete(cid);
        this.confirmIdToTaskId.delete(cid);
        return;
      }
    }
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

    // Cancel all pending workflow confirms
    for (const pending of this.pendingWorkflowConfirms.values()) {
      pending.resolve("cancel");
    }
    this.pendingWorkflowConfirms.clear();
  }

  /** Create ChatAgent with current config */
  private async createChatAgent(chatId: string): Promise<ChatAgent> {
    // Close previous MCP clients
    await this.closeChatMcpClients();

    const configManager = ConfigManager.getInstance();
    const llms = configManager.getLLMsConfig();
    const agentConfig = configManager.getAgentConfig();
    const config: EkoDialogueConfig = {
      llms,
      agents: this.buildChatAgents(),
      ...this.buildOptionalLlmKeys(),
      globalConfig: this.buildGlobalConfig(),
    };

    // Build MCP DialogueTools for chat mode
    this.chatMcpClients = this.buildMcpClients(agentConfig?.chatAgent?.mcpServices ?? {});
    const mcpTools = await buildMcpDialogueTools(this.chatMcpClients);
    const memoryTools = buildMemoryTools(this.memoryService);

    return new ChatAgent(config, chatId, undefined, [...mcpTools, ...memoryTools]);
  }

  /** Close chat MCP clients */
  private async closeChatMcpClients(): Promise<void> {
    await Promise.allSettled(this.chatMcpClients.map(c => c.close()));
    this.chatMcpClients = [];
  }

  /** Build agents for ChatAgent (browser + custom) */
  private buildChatAgents(): Agent[] {
    const agentConfig = ConfigManager.getInstance().getAgentConfig();
    const agents: Agent[] = [];
    if (this.browserAgent) agents.push(this.browserAgent);
    agents.push(...this.buildCustomAgents(agentConfig));
    return agents;
  }

  /** Create ChatStreamCallback forwarding to frontend */
  private createChatCallback(): ChatStreamCallback {
    return {
      chatCallback: {
        onMessage: async (message: ChatStreamMessage) => {
          if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
          this.mainWindow.webContents.send('eko-stream-message', message);
        }
      },
      taskCallback: this.createCallback(),
    };
  }

  /** Run a chat turn */
  async chatRun(chatId: string, messageId: string, text: string): Promise<{ chatId: string; result: string | null; error?: string }> {
    try {
      if (!this.chatAgent || this.chatAgent.getChatContext().getChatId() !== chatId) {
        this.chatAgent = await this.createChatAgent(chatId);
      }

      this.runningTaskIds.add(chatId);
      const controller = new AbortController();
      this.chatAbortControllers.set(chatId, controller);

      const result = await this.chatAgent.chat({
        messageId,
        user: [{ type: 'text', text }],
        callback: this.createChatCallback(),
        signal: controller.signal,
      });

      return { chatId, result };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Chat error';
      console.error('[EkoService] chatRun error:', errMsg);
      this.sendErrorToFrontend(errMsg, error, chatId);
      return { chatId, result: null, error: errMsg };
    } finally {
      this.runningTaskIds.delete(chatId);
      this.chatAbortControllers.delete(chatId);
      this.triggerMemoryExtraction();
    }
  }

  /** Trigger async memory extraction from recent chat messages */
  private triggerMemoryExtraction(): void {
    if (!this.chatAgent) return;
    try {
      const memory = this.chatAgent.getMemory();
      const ekoMessages = memory.getMessages();
      if (ekoMessages.length < 2) return;

      // Convert EkoMessage to simple format for extraction
      const messages = ekoMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
          role: m.role,
          content: typeof m.content === 'string'
            ? m.content
            : (m.content as Array<{ type: string; text?: string }>)
                .filter(p => p.type === 'text')
                .map(p => p.text || '')
                .join('\n'),
        }))
        .filter(m => m.content.trim());

      if (messages.length < 2) return;

      this.memoryService.extractFromConversation(messages)
        .catch(err => console.error('[EkoService] Memory extraction failed:', err));
    } catch (err) {
      console.error('[EkoService] Memory extraction trigger failed:', err);
    }
  }

  /** Extract memories from Explore mode prompt + result */
  private triggerExploreMemoryExtraction(prompt: string, result: EkoResult | null): void {
    if (!prompt?.trim() || !result?.result) return;
    const messages = [
      { role: 'user', content: prompt },
      { role: 'assistant', content: typeof result.result === 'string' ? result.result : JSON.stringify(result.result) },
    ];
    this.memoryService.extractFromConversation(messages)
      .catch(err => console.error('[EkoService] Explore memory extraction failed:', err));
  }

  /** Get memory service instance */
  getMemoryService(): MemoryService {
    return this.memoryService;
  }

  /** Cancel a running chat */
  async chatCancel(chatId: string): Promise<void> {
    const controller = this.chatAbortControllers.get(chatId);
    if (controller) controller.abort();
  }

  /** Clean up all tasks, MCP connections, and internal state */
  async destroy(): Promise<void> {
    // Abort and delete all Eko tasks (triggers MCP client.close() in Agent.run finally block)
    if (this.eko) {
      for (const taskId of this.eko.getAllTaskId()) {
        try { this.eko.deleteTask(taskId); } catch {}
      }
    }

    // Cancel all running chats
    for (const controller of this.chatAbortControllers.values()) {
      controller.abort();
    }

    // Clean up ChatAgent from global chatMap
    if (this.chatAgent) {
      const chatId = this.chatAgent.getChatContext().getChatId();
      ekoGlobal.chatMap?.delete(chatId);
    }

    // Flush pending memory writes
    await this.memoryService.flush();

    this.rejectAllHumanRequests(new Error('EkoService destroyed'));
    await this.closeChatMcpClients();
    this.eko = null;
    this.browserAgent = null;
    this.chatAgent = null;
    this.chatAbortControllers.clear();
    this.runningTaskIds.clear();
    this.taskPrompts.clear();
  }
}
