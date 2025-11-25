interface HealthCheckOptions {
  maxRetries?: number;
  retryInterval?: number;
  timeout?: number;
}

export class HealthChecker {
  private readonly defaultOptions: Required<HealthCheckOptions> = {
    maxRetries: 30,
    retryInterval: 1000,
    timeout: 5000,
  };

  async checkHealth(url: string, timeout?: number): Promise<boolean> {
    const checkTimeout = timeout || this.defaultOptions.timeout;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), checkTimeout);

      const response = await fetch(url, {
        signal: controller.signal,
        method: 'GET',
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error(`[HealthChecker] Health check failed for ${url}:`, error);
      return false;
    }
  }

  async waitUntilHealthy(url: string, options?: HealthCheckOptions): Promise<boolean> {
    const opts = { ...this.defaultOptions, ...options };
    let retryCount = 0;

    while (retryCount < opts.maxRetries) {
      const isHealthy = await this.checkHealth(url, opts.timeout);

      if (isHealthy) {
        return true;
      }

      retryCount++;
      if (retryCount < opts.maxRetries) {
        await this.sleep(opts.retryInterval);
      }
    }

    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
