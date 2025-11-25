import { app } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { HealthChecker } from './health-checker';
import { isDev, DEFAULT_PORT } from '../utils/constants';

export class ServerManager {
  private healthChecker: HealthChecker;
  private serverStarted: boolean = false;

  constructor() {
    this.healthChecker = new HealthChecker();
  }

  async startServer(): Promise<void> {
    if (isDev || this.serverStarted) {
      return;
    }

    try {
      const serverPath = path.join(app.getAppPath(), "server.js");
      const fileUrl = pathToFileURL(serverPath).href;

      await import(fileUrl);
      this.serverStarted = true;
    } catch (error) {
      console.error('[ServerManager] Failed to start server:', error);
      throw new Error(`Failed to start Next.js server: ${error}`);
    }
  }

  async waitForServer(timeout: number = 30000): Promise<boolean> {
    const url = `http://localhost:${DEFAULT_PORT}/home`;
    const maxRetries = Math.floor(timeout / 1000);

    const isHealthy = await this.healthChecker.waitUntilHealthy(url, {
      maxRetries,
      retryInterval: 1000,
      timeout: 3000,
    });

    if (!isHealthy) {
      console.error('[ServerManager] Server startup timeout');
    }

    return isHealthy;
  }

  getServerURL(): string {
    return `http://localhost:${DEFAULT_PORT}/home`;
  }
}
