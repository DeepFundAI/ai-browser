/**
 * Basic Electron app test
 * INPUT: Built electron app at dist/electron/main/index.mjs
 * OUTPUT: Test results
 * POSITION: E2E test for verifying app launches correctly
 *
 * PREREQUISITES:
 * 1. Run `pnpm run build:deps` to build electron code
 * 2. Run `pnpm run next` in another terminal to start Next.js dev server
 * 3. Then run `pnpm run test:e2e`
 */

import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test';
import path from 'path';

let electronApp: ElectronApplication;
let window: Page;

test.describe('Electron App', () => {
  test.beforeAll(async () => {
    // Launch Electron app in development mode
    electronApp = await electron.launch({
      args: [path.join(process.cwd(), 'dist/electron/main/index.mjs')],
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
      timeout: 30000,
    });

    // Wait for the first window
    window = await electronApp.firstWindow();

    // Wait for app to be ready (loading screen -> main content)
    await window.waitForTimeout(5000);
  });

  test.afterAll(async () => {
    if (electronApp) {
      // Graceful shutdown: try SIGTERM first, then force kill after timeout
      const pid = electronApp.process().pid;
      if (pid) {
        process.kill(pid, 'SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          process.kill(pid, 0); // Check if still running
          process.kill(pid, 'SIGKILL'); // Force kill if still alive
        } catch {
          // Process already terminated
        }
      }
    }
  });

  test('app launches successfully', async () => {
    expect(window).toBeTruthy();
    const title = await window.title();
    console.log('Window title:', title);
  });

  test('can take screenshot', async () => {
    const screenshot = await window.screenshot({ path: 'e2e/screenshots/app.png' });
    expect(screenshot).toBeTruthy();
    console.log('Screenshot saved to e2e/screenshots/app.png');
  });

  test('main window is visible', async () => {
    const isVisible = await electronApp.evaluate(({ BrowserWindow }) => {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      return mainWindow?.isVisible();
    });
    expect(isVisible).toBe(true);
  });

  test('can get window count', async () => {
    const windowCount = await electronApp.evaluate(({ BrowserWindow }) => {
      return BrowserWindow.getAllWindows().length;
    });
    console.log('Window count:', windowCount);
    expect(windowCount).toBeGreaterThan(0);
  });
});
