/**
 * INPUT: IMcpClient instances from @jarvis-agent/core
 * OUTPUT: DialogueTool[] for ChatAgent direct MCP tool access
 * POSITION: Adapter bridging MCP clients to ChatAgent's tool interface
 */

import type { DialogueTool, ToolResult, IMcpClient, McpListToolResult } from '@jarvis-agent/core';

type McpToolDef = McpListToolResult[number];

/** Wraps a single MCP tool as DialogueTool */
class McpDialogueTool implements DialogueTool {
  readonly name: string;
  readonly description: string;
  readonly parameters: JSONSchema7;

  constructor(
    private client: IMcpClient,
    tool: McpToolDef
  ) {
    this.name = tool.name;
    this.description = tool.description ?? '';
    this.parameters = tool.inputSchema;
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    return this.client.callTool({ name: this.name, arguments: args });
  }
}

/** Connect MCP clients and wrap their tools as DialogueTools */
export async function buildMcpDialogueTools(clients: IMcpClient[]): Promise<DialogueTool[]> {
  const taskContext = {
    taskId: 'chat-mcp',
    environment: 'browser' as const,
    agent_name: 'chat',
    params: {},
    prompt: ''
  };

  const tools: DialogueTool[] = [];
  for (const client of clients) {
    try {
      if (!client.isConnected()) await client.connect();
      const toolList = await client.listTools(taskContext);
      tools.push(...toolList.map(t => new McpDialogueTool(client, t)));
    } catch (err) {
      console.error('[McpDialogueTools] Failed to load tools from client:', err);
    }
  }
  return tools;
}
