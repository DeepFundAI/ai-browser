# Testing Guide

This document describes how to run and write tests for the AI Browser project.

## Overview

The project uses **Playwright** for E2E (End-to-End) testing of the Electron application.

```
┌─────────────────┐
│  Playwright     │  ← Test runner
└────────┬────────┘
         │ Electron API
┌────────▼────────┐
│  ai-browser     │  ← Your Electron app
│  (dev mode)     │
└─────────────────┘
```

## Prerequisites

1. **Build Electron code**:
   ```bash
   pnpm run build:deps
   ```

2. **Start Next.js dev server** (in a separate terminal):
   ```bash
   pnpm run next
   ```

## Running Tests

### Command Line (Quick)

```bash
pnpm run test:e2e
```

Output example:
```
Running 4 tests using 1 worker

✓  1 e2e/basic.test.ts:44:7 › Electron App › app launches successfully (5ms)
✓  2 e2e/basic.test.ts:50:7 › Electron App › can take screenshot (460ms)
✓  3 e2e/basic.test.ts:56:7 › Electron App › main window is visible (6ms)
✓  4 e2e/basic.test.ts:64:7 › Electron App › can get window count (2ms)

4 passed
```

### UI Mode (Interactive)

```bash
pnpm run test:e2e:ui
```

Opens an interactive interface where you can:
- Watch tests execute in real-time
- View screenshots at each step
- Debug failed tests
- Re-run specific tests

### HTML Report

After running tests, view the detailed HTML report:

```bash
pnpm exec playwright show-report
```

Then open http://localhost:9323 in your browser.

## Test Structure

```
e2e/
├── basic.test.ts       # Basic app launch tests
├── screenshots/        # Test screenshots
│   └── app.png
└── (future tests...)
```

## Writing Tests

### Basic Test Example

```typescript
import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';

let electronApp;
let window;

test.beforeAll(async () => {
  // Launch Electron app
  electronApp = await electron.launch({
    args: [path.join(process.cwd(), 'dist/electron/main/index.mjs')],
    env: { ...process.env, NODE_ENV: 'development' },
  });

  // Get the first window
  window = await electronApp.firstWindow();
  await window.waitForTimeout(5000); // Wait for app to load
});

test.afterAll(async () => {
  await electronApp?.close();
});

test('app launches successfully', async () => {
  expect(window).toBeTruthy();
  const title = await window.title();
  console.log('Window title:', title);
});
```

### Taking Screenshots

```typescript
test('can take screenshot', async () => {
  const screenshot = await window.screenshot({
    path: 'e2e/screenshots/my-test.png'
  });
  expect(screenshot).toBeTruthy();
});
```

### Interacting with UI Elements

```typescript
test('can click button', async () => {
  await window.click('[data-testid="my-button"]');
  await expect(window.locator('.result')).toBeVisible();
});

test('can type text', async () => {
  await window.fill('[data-testid="input"]', 'Hello World');
  await window.press('[data-testid="input"]', 'Enter');
});
```

### Evaluating in Main Process

```typescript
test('can access BrowserWindow', async () => {
  const windowCount = await electronApp.evaluate(({ BrowserWindow }) => {
    return BrowserWindow.getAllWindows().length;
  });
  expect(windowCount).toBe(1);
});
```

### Testing IPC Communication

```typescript
test('can send IPC message', async () => {
  const result = await electronApp.evaluate(async ({ ipcMain }) => {
    return new Promise((resolve) => {
      ipcMain.once('test-response', (event, data) => {
        resolve(data);
      });
    });
  });
  expect(result).toBeDefined();
});
```

## Best Practices

### 1. Add `data-testid` Attributes

For reliable element selection, add `data-testid` to components:

```tsx
// In React component
<button data-testid="submit-btn">Submit</button>

// In test
await window.click('[data-testid="submit-btn"]');
```

### 2. Wait for State Changes

```typescript
// Wait for element to appear
await window.waitForSelector('.loading', { state: 'hidden' });

// Wait for navigation
await window.waitForURL('**/dashboard');

// Custom wait
await window.waitForFunction(() => {
  return document.querySelector('.content')?.textContent?.includes('Ready');
});
```

### 3. Use Page Object Pattern (for complex tests)

```typescript
// e2e/pages/home-page.ts
export class HomePage {
  constructor(private page: Page) {}

  async clickNewTask() {
    await this.page.click('[data-testid="new-task-btn"]');
  }

  async getTaskCount() {
    return await this.page.locator('.task-item').count();
  }
}

// In test
const homePage = new HomePage(window);
await homePage.clickNewTask();
expect(await homePage.getTaskCount()).toBe(1);
```

### 4. Screenshot on Failure

In `playwright.config.ts`:

```typescript
export default defineConfig({
  use: {
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
});
```

## Configuration

### playwright.config.ts

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,           // Test timeout
  retries: 0,               // Retry failed tests
  workers: 1,               // Run tests sequentially for Electron
  use: {
    trace: 'on-first-retry',
  },
  reporter: [
    ['list'],               // Console output
    ['html', { open: 'never' }],  // HTML report
  ],
});
```

## Troubleshooting

### App doesn't launch

1. Ensure Next.js server is running: `pnpm run next`
2. Ensure Electron is built: `pnpm run build:deps`
3. Check if port 5173 is available

### Tests timeout

- Increase timeout in config or test:
  ```typescript
  test('slow test', async () => {
    test.setTimeout(120000); // 2 minutes
    // ...
  });
  ```

### Can't find elements

- Use `window.pause()` to debug:
  ```typescript
  test('debug test', async () => {
    await window.pause(); // Opens inspector
  });
  ```

### Screenshots are blank

- Add wait time after navigation:
  ```typescript
  await window.waitForTimeout(2000);
  await window.screenshot({ path: 'screenshot.png' });
  ```

## CI Integration (Future)

```yaml
# .github/workflows/test.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm run build:deps
      - run: pnpm run next &
      - run: sleep 10 && pnpm run test:e2e

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Related Files

- `e2e/` - Test files
- `playwright.config.ts` - Playwright configuration
- `e2e/screenshots/` - Test screenshots
- `playwright-report/` - HTML reports (generated)
