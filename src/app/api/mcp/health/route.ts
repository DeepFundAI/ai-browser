import { NextResponse } from 'next/server';
import mcpToolManager from '@/services/mcp';
import { getClientCount } from '../sse/route';

export async function GET() {
  const tools = mcpToolManager.getTools();

  return NextResponse.json({
    status: 'ok',
    tools: tools.map(t => t.name),
    connectedClients: getClientCount(),
    timestamp: new Date().toISOString(),
    serverInfo: {
      name: 'EkoMcpServer (Next.js)',
      version: '1.0.0',
      totalTools: tools.length
    }
  });
}
