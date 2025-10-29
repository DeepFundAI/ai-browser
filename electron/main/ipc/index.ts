import { registerEkoHandlers } from "./eko-handlers";
import { registerViewHandlers } from "./view-handlers";
import { registerHistoryHandlers } from "./history-handlers";
import { registerConfigHandlers } from "./config-handlers";
import { registerAgentHandlers } from "./agent-handlers";

/**
 * Register all IPC handlers
 * Centralized registration point for all IPC communication handlers
 */
export function registerAllIpcHandlers() {
  registerEkoHandlers();
  registerViewHandlers();
  registerHistoryHandlers();
  registerConfigHandlers();
  registerAgentHandlers();

  console.log('[IPC] All IPC handlers registered successfully');
}

// Export individual registration functions for selective use if needed
export {
  registerEkoHandlers,
  registerViewHandlers,
  registerHistoryHandlers,
  registerConfigHandlers,
  registerAgentHandlers
};
