import { NextRequest } from 'next/server';

// Store all SSE connected clients - use global variable to avoid hot reload reset
declare global {
  var __sseClients: Set<WritableStreamDefaultWriter<Uint8Array>> | undefined;
}

const clients = globalThis.__sseClients ?? (globalThis.__sseClients = new Set());

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const customReadable = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode('data: connected\n\n'));

      // Create a writer for this client
      const writer = {
        write: (chunk: Uint8Array) => controller.enqueue(chunk),
        writable: true,
        destroyed: false
      } as any;

      // Add to client list
      clients.add(writer);
      console.log(`SSE client connected, total clients: ${clients.size}`);

      // Send endpoint info after brief delay
      setTimeout(() => {
        try {
          controller.enqueue(encoder.encode(`event: endpoint\ndata: /api/mcp/message\n\n`));
          console.log('Sent endpoint info to client');
        } catch (error) {
          console.error('Error sending endpoint info:', error);
          clients.delete(writer);
        }
      }, 100);

      // Handle disconnection
      req.signal.addEventListener('abort', () => {
        clients.delete(writer);
        writer.destroyed = true;
        console.log(`Client disconnected from SSE, remaining clients: ${clients.size}`);
        controller.close();
      });
    }
  });

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream;charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no'
    }
  });
}

// Export a function for other APIs to use, for sending messages to all clients
export function sendSseMessage(id: string, data: any) {
  console.log(`sendSseMessage ${id}, active clients: ${clients.size}`, data);
  const encoder = new TextEncoder();
  const message = encoder.encode(`event: message\ndata: ${JSON.stringify(data)}\n\n`);

  if (clients.size === 0) {
    console.warn(`No SSE clients available for message ${id}`);
    return;
  }

  // Send message to all connected clients
  const failedClients: any[] = [];
  clients.forEach(client => {
    try {
      if (client.writable && !client.destroyed) {
        client.write(message);
        console.log('Successfully sent SSE message to client');
      } else {
        console.warn('Client connection is not writable, removing from clients');
        failedClients.push(client);
      }
    } catch (error) {
      console.error('Error sending SSE message to client:', error);
      failedClients.push(client);
    }
  });

  // Clean up invalid client connections
  failedClients.forEach(client => clients.delete(client));
}

// Export client count for health check use
export function getClientCount() {
  return clients.size;
}
