import { Task, DisplayMessage, AgentGroupMessage, WorkflowMessage } from '@/models';
import { produce } from 'immer';

export type PlaybackSpeed = 0.5 | 1 | 2 | 5 | 10 | 20 | 50;
export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'completed';

interface PlaybackState {
  status: PlaybackStatus;
  currentMessageIndex: number;
  currentCharIndex: number;
  speed: PlaybackSpeed;
  completedFragments: number; // Track completed atomic fragments
  totalFragments: number; // Total atomic fragments
}

/**
 * PlaybackEngine - Data-driven message playback engine
 *
 * Instead of controlling which fragments to display, this engine progressively
 * builds a growing message list by injecting data character-by-character.
 *
 * The UI simply renders the playback task object, which grows over time.
 */
export class PlaybackEngine {
  private sourceTask: Task;
  private playbackTask: Task;
  private state: PlaybackState;
  private onUpdate: (task: Task, progress: number, status: PlaybackStatus) => void;
  private timers: NodeJS.Timeout[] = [];
  private isPaused: boolean = false;
  private shouldStop: boolean = false;

  constructor(
    sourceTask: Task,
    onUpdate: (task: Task, progress: number, status: PlaybackStatus) => void,
    initialSpeed: PlaybackSpeed = 1
  ) {
    this.sourceTask = sourceTask;
    this.onUpdate = onUpdate;

    const totalFragments = this.countTotalFragments();

    this.state = {
      status: 'idle',
      currentMessageIndex: 0,
      currentCharIndex: 0,
      speed: initialSpeed,
      completedFragments: 0,
      totalFragments: totalFragments,
    };

    // Initialize playback task with basic info, but empty messages
    this.playbackTask = {
      ...sourceTask,
      messages: [],
    };
  }

  /**
   * Count total atomic fragments in the source task
   * Atomic fragments: user messages, thinking text, agents, agent tasks, nodes, agent group messages
   */
  private countTotalFragments(): number {
    let count = 0;

    for (const msg of this.sourceTask.messages) {
      if (msg.type === 'user') {
        count++; // 1 fragment for user message
      } else if (msg.type === 'workflow') {
        const workflow = (msg as any).workflow;
        if (workflow) {
          if (workflow.thought) {
            count++; // 1 for thinking text
          }
          if (workflow.agents && workflow.agents.length > 0) {
            workflow.agents.forEach((agent: any) => {
              if (agent.task) {
                count++; // 1 for agent task
              }
              if (agent.nodes && agent.nodes.length > 0) {
                count += agent.nodes.length; // 1 per node
              }
            });
          }
        }
      } else if (msg.type === 'agent_group') {
        const agentGroup = msg as AgentGroupMessage;
        if (agentGroup.messages && agentGroup.messages.length > 0) {
          agentGroup.messages.forEach((innerMsg: any) => {
            if (innerMsg.type === 'text' && innerMsg.content) {
              count++; // 1 per text message
            } else if (innerMsg.type === 'tool') {
              count++; // 1 per tool
            } else if (innerMsg.type === 'human-interaction') {
              count++; // 1 per interaction
            }
          });
        }
      }
    }

    return count;
  }

  /**
   * Start playback from beginning
   */
  async play(): Promise<void> {
    // Always start from beginning
    this.reset();

    this.state.status = 'playing';
    this.isPaused = false;
    this.shouldStop = false;

    await this.streamMessages();
  }

  /**
   * Pause playback
   */
  pause(): void {
    this.state.status = 'paused';
    this.isPaused = true;
    this.clearTimers();
  }

  /**
   * Stop playback and reset
   */
  stop(): void {
    this.shouldStop = true;
    this.state.status = 'idle';
    this.clearTimers();
    this.reset();
  }

  /**
   * Set playback speed
   */
  setSpeed(speed: PlaybackSpeed): void {
    this.state.speed = speed;
  }

  /**
   * Get current playback state
   */
  getState(): PlaybackState {
    return { ...this.state };
  }

  /**
   * Reset playback to beginning
   */
  private reset(): void {
    this.state.currentMessageIndex = 0;
    this.state.currentCharIndex = 0;
    this.playbackTask = {
      ...this.sourceTask,
      messages: [],
    };
    this.notifyUpdate(0);
  }

  /**
   * Stream all messages sequentially
   */
  private async streamMessages(): Promise<void> {
    await this.streamMessagesRecursive(this.state.currentMessageIndex);

    // Mark as completed if not stopped
    if (!this.shouldStop) {
      this.state.status = 'completed';
      this.notifyUpdate(100);
    }
  }

  /**
   * Recursively stream messages one by one
   */
  private async streamMessagesRecursive(index: number): Promise<void> {
    const sourceMessages = this.sourceTask.messages;

    // Base case: all messages processed
    if (index >= sourceMessages.length) return;
    if (this.shouldStop || this.isPaused) return;

    this.state.currentMessageIndex = index;
    const sourceMessage = sourceMessages[index];

    // Stream the message based on its type
    if (sourceMessage.type === 'user') {
      await this.streamUserMessage(sourceMessage);
    } else if (sourceMessage.type === 'workflow') {
      await this.streamWorkflowMessage(sourceMessage);
    } else if (sourceMessage.type === 'agent_group') {
      await this.streamAgentGroupMessage(sourceMessage as AgentGroupMessage);
    }

    // Fixed delay between messages (300ms)
    if (index < sourceMessages.length - 1) {
      await this.delay(300 / this.state.speed);
    }

    // Recursively process next message
    await this.streamMessagesRecursive(index + 1);
  }

  /**
   * Stream user message character-by-character
   */
  private async streamUserMessage(source: DisplayMessage): Promise<void> {
    if (this.shouldStop || this.isPaused) return;
    if (source.type !== 'user') return;

    // Add empty user message
    this.playbackTask = produce(this.playbackTask, (draft) => {
      draft.messages.push({ ...source, content: '' } as any);
    });
    this.notifyUpdate(this.calculateProgress());

    // Stream content character-by-character (15ms per char) using recursion
    await this.streamUserContentRecursive(source.content, 0);

    // Increment completed fragments after user message is done
    this.state.completedFragments++;
  }

  /**
   * Recursively stream user message content character by character
   */
  private async streamUserContentRecursive(content: string, charIndex: number): Promise<void> {
    // Base case: all characters streamed
    if (charIndex >= content.length) return;
    if (this.shouldStop || this.isPaused) return;

    this.playbackTask = produce(this.playbackTask, (draft) => {
      const msg = draft.messages[draft.messages.length - 1];
      if (msg) {
        (msg as any).content = content.substring(0, charIndex + 1);
      }
    });
    this.notifyUpdate(this.calculateProgress());

    await this.delay(15 / this.state.speed);

    // Recursively process next character
    await this.streamUserContentRecursive(content, charIndex + 1);
  }

  /**
   * Stream workflow message (thinking + agents)
   */
  private async streamWorkflowMessage(source: DisplayMessage): Promise<void> {
    if (this.shouldStop || this.isPaused) return;

    const sourceWorkflow = (source as WorkflowMessage).workflow;
    if (!sourceWorkflow) return;

    // Add workflow message with empty thought
    this.playbackTask = produce(this.playbackTask, (draft) => {
      draft.messages.push({
        ...source,
        workflow: {
          ...sourceWorkflow,
          thought: '',
          agents: [],
        },
      } as any);
    });
    this.notifyUpdate(this.calculateProgress());

    // Stream thinking text (25ms per char) using recursion
    // Type assertion for dynamic workflow data access
    const thought = (sourceWorkflow as any)?.thought;
    if (thought && typeof thought === 'string') {
      await this.streamThoughtTextRecursive(thought, 0);
      // Increment completed fragments after thinking is done
      this.state.completedFragments++;
    }

    // Stream agents sequentially using recursion
    // Type assertion for dynamic workflow data access
    const agents = (sourceWorkflow as any)?.agents;
    if (agents && Array.isArray(agents) && agents.length > 0) {
      await this.streamAgentsRecursive(agents, 0);
    }
  }

  /**
   * Recursively stream thought text character by character
   */
  private async streamThoughtTextRecursive(thought: string, charIndex: number): Promise<void> {
    // Base case: all characters streamed
    if (charIndex >= thought.length) return;
    if (this.shouldStop || this.isPaused) return;

    this.playbackTask = produce(this.playbackTask, (draft) => {
      const msg = draft.messages[draft.messages.length - 1] as any;
      if (msg && msg.workflow) {
        msg.workflow.thought = thought.substring(0, charIndex + 1);
      }
    });
    this.notifyUpdate(this.calculateProgress());

    await this.delay(25 / this.state.speed);

    // Recursively process next character
    await this.streamThoughtTextRecursive(thought, charIndex + 1);
  }

  /**
   * Recursively stream agents one by one
   */
  private async streamAgentsRecursive(agents: any[], index: number): Promise<void> {
    // Base case: all agents processed
    if (index >= agents.length) return;
    if (this.shouldStop || this.isPaused) return;

    const sourceAgent = agents[index];

    // Add agent with empty task and no nodes
    this.playbackTask = produce(this.playbackTask, (draft) => {
      const msg = draft.messages[draft.messages.length - 1] as any;
      if (msg && msg.workflow) {
        if (!msg.workflow.agents) {
          msg.workflow.agents = [];
        }
        msg.workflow.agents.push({
          ...sourceAgent,
          task: '',
          nodes: [], // Empty nodes initially
        });
      }
    });
    this.notifyUpdate(this.calculateProgress());

    // Stream agent task text (25ms per char)
    if (sourceAgent.task) {
      await this.streamTaskTextRecursive(sourceAgent.task, 0);
      // Increment completed fragments after agent task is done
      this.state.completedFragments++;
    }

    // Stream agent nodes recursively
    if (sourceAgent.nodes && sourceAgent.nodes.length > 0) {
      await this.streamNodesRecursive(sourceAgent.nodes, 0);
    }

    // Delay between agents
    await this.delay(300 / this.state.speed);

    // Recursively process next agent
    await this.streamAgentsRecursive(agents, index + 1);
  }

  /**
   * Recursively stream task text character by character
   */
  private async streamTaskTextRecursive(task: string, charIndex: number): Promise<void> {
    // Base case: all characters streamed
    if (charIndex >= task.length) return;
    if (this.shouldStop || this.isPaused) return;

    // Update task with one more character
    this.playbackTask = produce(this.playbackTask, (draft) => {
      const msg = draft.messages[draft.messages.length - 1] as any;
      if (msg && msg.workflow && msg.workflow.agents) {
        const agent = msg.workflow.agents[msg.workflow.agents.length - 1];
        if (agent) {
          agent.task = task.substring(0, charIndex + 1);
        }
      }
    });
    this.notifyUpdate(this.calculateProgress());

    await this.delay(25 / this.state.speed);

    // Recursively process next character
    await this.streamTaskTextRecursive(task, charIndex + 1);
  }

  /**
   * Recursively stream nodes one by one
   */
  private async streamNodesRecursive(nodes: any[], index: number): Promise<void> {
    // Base case: all nodes processed
    if (index >= nodes.length) return;
    if (this.shouldStop || this.isPaused) return;

    const node = nodes[index];

    // Add node to current agent
    this.playbackTask = produce(this.playbackTask, (draft) => {
      const msg = draft.messages[draft.messages.length - 1] as any;
      if (msg && msg.workflow && msg.workflow.agents) {
        const agent = msg.workflow.agents[msg.workflow.agents.length - 1];
        if (agent && agent.nodes) {
          agent.nodes.push(node);
        }
      }
    });

    // Increment completed fragments after each node is done
    this.state.completedFragments++;
    this.notifyUpdate(this.calculateProgress());

    // Delay between nodes
    await this.delay(150 / this.state.speed);

    // Recursively process next node
    await this.streamNodesRecursive(nodes, index + 1);
  }

  /**
   * Stream agent group message (header + internal messages)
   */
  private async streamAgentGroupMessage(source: AgentGroupMessage): Promise<void> {
    if (this.shouldStop || this.isPaused) return;

    // Add agent group message with empty messages array
    this.playbackTask = produce(this.playbackTask, (draft) => {
      draft.messages.push({
        ...source,
        messages: [],
      } as any);
    });
    this.notifyUpdate(this.calculateProgress());

    // Stream internal messages recursively
    await this.streamInnerMessagesRecursive(source.messages, 0);
  }

  /**
   * Recursively stream inner messages of agent group
   */
  private async streamInnerMessagesRecursive(messages: any[], index: number): Promise<void> {
    // Base case: all messages processed
    if (index >= messages.length) return;
    if (this.shouldStop || this.isPaused) return;

    const innerMsg = messages[index];

    if (innerMsg.type === 'text' && innerMsg.content) {
      // Text message: stream character-by-character
      // First add empty text message
      this.playbackTask = produce(this.playbackTask, (draft) => {
        const msg = draft.messages[draft.messages.length - 1] as any;
        if (msg && msg.messages) {
          msg.messages.push({ ...innerMsg, content: '' });
        }
      });
      this.notifyUpdate(this.calculateProgress());

      // Stream text content recursively
      await this.streamTextContentRecursive(innerMsg.content, 0);

      // Increment completed fragments after text message is done
      this.state.completedFragments++;
    } else {
      // Tool/human-interaction: add complete object instantly
      this.playbackTask = produce(this.playbackTask, (draft) => {
        const msg = draft.messages[draft.messages.length - 1] as any;
        if (msg && msg.messages) {
          msg.messages.push(innerMsg);
        }
      });

      // Increment completed fragments after tool/interaction is added
      this.state.completedFragments++;
      this.notifyUpdate(this.calculateProgress());
    }

    // Delay between internal messages
    await this.delay(100 / this.state.speed);

    // Recursively process next message
    await this.streamInnerMessagesRecursive(messages, index + 1);
  }

  /**
   * Recursively stream text content character by character (for agent group text messages)
   */
  private async streamTextContentRecursive(content: string, charIndex: number): Promise<void> {
    // Base case: all characters streamed
    if (charIndex >= content.length) return;
    if (this.shouldStop || this.isPaused) return;

    // Update text content with one more character
    this.playbackTask = produce(this.playbackTask, (draft) => {
      const msg = draft.messages[draft.messages.length - 1] as any;
      if (msg && msg.messages && msg.messages.length > 0) {
        const textMsg = msg.messages[msg.messages.length - 1];
        if (textMsg) {
          textMsg.content = content.substring(0, charIndex + 1);
        }
      }
    });
    this.notifyUpdate(this.calculateProgress());

    await this.delay(25 / this.state.speed);

    // Recursively process next character
    await this.streamTextContentRecursive(content, charIndex + 1);
  }

  /**
   * Delay helper with timer tracking
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, ms);
      this.timers.push(timer);
    });
  }

  /**
   * Clear all pending timers
   */
  private clearTimers(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
  }

  /**
   * Calculate current progress percentage based on atomic fragments
   */
  private calculateProgress(): number {
    if (this.state.totalFragments === 0) return 0;

    return Math.round((this.state.completedFragments / this.state.totalFragments) * 100);
  }

  /**
   * Notify update callback with current playback task
   */
  private notifyUpdate(progress: number): void {
    this.onUpdate({ ...this.playbackTask }, progress, this.state.status);
  }
}
