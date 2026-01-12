import { NextRequest, NextResponse } from 'next/server';
import mcpToolManager from '@/services/mcp';
import { sendSseMessage, getClientCount } from '../sse/route';
import { logger } from '@/utils/logger';

interface McpListToolParam {
  taskId: string;
  nodeId: string;
  environment: string;
  agent_name: string;
  prompt: string;
  browser_url?: string;
  params: Record<string, any>;
}

interface McpCallToolParam {
  name: string;
  arguments: Record<string, any>;
  extInfo?: Record<string, any>;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jsonrpc, id, method, params } = body;

    logger.debug(`Received ${method} request`, 'McpMessageAPI', { id, params });

    let result: any;

    switch (method) {
      case 'initialize':
        result = {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {
              listChanged: true,
            },
            sampling: {},
          },
          serverInfo: {
            name: 'EkoMcpServer',
            version: '1.0.0',
          },
        };
        break;

      case 'tools/list':
        result = await handleListTools(params);
        break;

      case 'tools/call':
        result = await handleCallTool(params);
        break;

      case 'ping':
        result = {};
        break;

      default:
        throw new Error(`Unknown method: ${method}`);
    }

    // Check if there are active SSE connections
    if (getClientCount() === 0) {
      logger.warn(`No SSE clients connected for message ${id}`, 'McpMessageAPI');
    } else {
      // Send result via SSE, add brief delay to ensure SSE connection is ready
      setTimeout(() => {
        try {
          sendSseMessage(id, { jsonrpc, id, result });
        } catch (error) {
          logger.error(`Failed to send SSE message for ${id}`, error, 'McpMessageAPI');
        }
      }, 50);
    }

    return NextResponse.json({ status: 'Accepted' });

  } catch (error) {
    logger.error('Error handling request', error, 'McpMessageAPI');
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: (await req.json()).id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error'
        }
      },
      { status: 500 }
    );
  }
}

async function handleListTools(params: McpListToolParam): Promise<{ tools: any[] }> {
  logger.debug('Listing MCP tools', 'McpMessageAPI', params);

  const tools = mcpToolManager.getTools();
  return { tools };
}

async function handleCallTool(params: McpCallToolParam): Promise<any> {
  const { name, arguments: args, extInfo } = params;
  logger.debug(`Calling MCP tool: ${name}`, 'McpMessageAPI', { args, extInfo });

  try {
    const result = await mcpToolManager.callTool(name, args, extInfo);
    return result;
  } catch (error) {
    logger.error(`Error executing tool ${name}`, error, 'McpMessageAPI');
    throw error;
  }
}
