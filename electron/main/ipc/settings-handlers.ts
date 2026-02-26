import { ipcMain, net, session } from 'electron';
import { openSettingsWindow, closeSettingsWindow } from '../ui/settings-window';

export function registerSettingsHandlers() {
  // Open settings window with optional panel parameter
  ipcMain.handle('settings:open', async (_event, panel?: string) => {
    try {
      openSettingsWindow(panel);
      return { success: true };
    } catch (error: any) {
      console.error('[SettingsHandlers] Failed to open settings window:', error);
      return { success: false, error: error.message };
    }
  });

  // Close settings window
  ipcMain.handle('settings:close', async () => {
    try {
      closeSettingsWindow();
      return { success: true };
    } catch (error: any) {
      console.error('[SettingsHandlers] Failed to close settings window:', error);
      return { success: false, error: error.message };
    }
  });

  // Test proxy connection with specific proxy settings
  ipcMain.handle('settings:testProxy', async (_event, proxySettings: { type: string; server: string; port: number; username?: string; password?: string }) => {
    try {
      console.log('[SettingsHandlers] Testing proxy connection with:', proxySettings);

      // Build proxy URL from input parameters
      const proxyUrl = `${proxySettings.type}://${proxySettings.server}:${proxySettings.port}`;
      console.log('[SettingsHandlers] Testing proxy URL:', proxyUrl);

      // Test URL (use a reliable service)
      const testUrl = 'https://www.google.com';
      const startTime = Date.now();

      // Create custom partition for testing to avoid affecting main session
      const testSession = session.fromPartition('test-proxy-' + Date.now(), { cache: false });

      // Apply proxy to test session
      await testSession.setProxy({
        mode: 'fixed_servers',
        proxyRules: proxyUrl
      });
      console.log('[SettingsHandlers] Test proxy configured');

      return new Promise((resolve) => {
        const request = net.request({
          method: 'GET',
          url: testUrl,
          session: testSession
        });

        let isResolved = false;

        // Manual timeout implementation (10 seconds)
        const timeoutId = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            console.error('[SettingsHandlers] Proxy test timeout');
            request.abort();
            resolve({
              success: false,
              error: 'Connection timeout (10s)'
            });
          }
        }, 10000);

        request.on('response', (response) => {
          clearTimeout(timeoutId);
          const duration = Date.now() - startTime;
          console.log(`[SettingsHandlers] Proxy test successful (${duration}ms), status: ${response.statusCode}`);

          // Consume response data to complete the request
          response.on('data', () => {});
          response.on('end', () => {
            if (!isResolved) {
              isResolved = true;
              resolve({
                success: true,
                message: `Connected successfully (${duration}ms)`,
                statusCode: response.statusCode
              });
            }
          });
        });

        request.on('error', (error) => {
          clearTimeout(timeoutId);
          if (!isResolved) {
            isResolved = true;
            console.error('[SettingsHandlers] Proxy test failed:', error.message);
            resolve({
              success: false,
              error: error.message
            });
          }
        });

        request.end();
      });
    } catch (error: any) {
      console.error('[SettingsHandlers] Proxy test error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Fetch models from provider API (bypass CORS)
  ipcMain.handle('settings:fetch-models', async (_event, providerId: string, apiKey: string, baseUrl: string) => {
    try {
      console.log(`[SettingsHandlers] Fetching models for ${providerId}`);

      // Build headers based on provider
      const headers: Record<string, string> = {};
      if (providerId === 'anthropic') {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const url = `${baseUrl}/models`;

      return new Promise((resolve) => {
        const request = net.request({ method: 'GET', url });

        Object.entries(headers).forEach(([key, value]) => {
          request.setHeader(key, value);
        });

        let isResolved = false;

        const timeoutId = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            request.abort();
            resolve({ success: false, error: 'Request timeout (10s)' });
          }
        }, 10000);

        let responseData = '';

        request.on('response', (response) => {
          response.on('data', (chunk) => {
            responseData += chunk.toString();
          });

          response.on('end', () => {
            clearTimeout(timeoutId);
            if (isResolved) return;
            isResolved = true;

            if (response.statusCode !== 200) {
              resolve({ success: false, error: `API error: ${response.statusCode}` });
              return;
            }
            try {
              const data = JSON.parse(responseData);
              resolve({ success: true, data });
            } catch {
              resolve({ success: false, error: 'Invalid JSON response' });
            }
          });
        });

        request.on('error', (error) => {
          clearTimeout(timeoutId);
          if (isResolved) return;
          isResolved = true;
          resolve({ success: false, error: error.message });
        });

        request.end();
      });
    } catch (error: any) {
      console.error('[SettingsHandlers] Fetch models error:', error);
      return { success: false, error: error.message };
    }
  });

  console.log('[IPC] Settings handlers registered');
}
