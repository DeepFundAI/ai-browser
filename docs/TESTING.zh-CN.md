# 测试指南

本文档介绍如何为 AI Browser 项目运行和编写测试。

## 概述

项目使用 **Playwright** 进行 Electron 应用的 E2E（端到端）测试。

```
┌─────────────────┐
│  Playwright     │  ← 测试运行器
└────────┬────────┘
         │ Electron API
┌────────▼────────┐
│  ai-browser     │  ← 你的 Electron 应用
│  (开发模式)      │
└─────────────────┘
```

## 前置条件

1. **构建 Electron 代码**：
   ```bash
   pnpm run build:deps
   ```

2. **启动 Next.js 开发服务器**（在另一个终端）：
   ```bash
   pnpm run next
   ```

## 运行测试

### 命令行（快速）

```bash
pnpm run test:e2e
```

输出示例：
```
Running 4 tests using 1 worker

✓  1 e2e/basic.test.ts:44:7 › Electron App › app launches successfully (5ms)
✓  2 e2e/basic.test.ts:50:7 › Electron App › can take screenshot (460ms)
✓  3 e2e/basic.test.ts:56:7 › Electron App › main window is visible (6ms)
✓  4 e2e/basic.test.ts:64:7 › Electron App › can get window count (2ms)

4 passed
```

### UI 模式（交互式）

```bash
pnpm run test:e2e:ui
```

打开交互式界面，你可以：
- 实时观看测试执行
- 查看每个步骤的截图
- 调试失败的测试
- 重新运行特定测试

### HTML 报告

运行测试后，查看详细的 HTML 报告：

```bash
pnpm exec playwright show-report
```

然后在浏览器中打开 http://localhost:9323。

## 测试结构

```
e2e/
├── basic.test.ts       # 基础应用启动测试
├── screenshots/        # 测试截图
│   └── app.png
└── (future tests...)
```

## 编写测试

### 基础测试示例

```typescript
import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';

let electronApp;
let window;

test.beforeAll(async () => {
  // 启动 Electron 应用
  electronApp = await electron.launch({
    args: [path.join(process.cwd(), 'dist/electron/main/index.mjs')],
    env: { ...process.env, NODE_ENV: 'development' },
  });

  // 获取第一个窗口
  window = await electronApp.firstWindow();
  await window.waitForTimeout(5000); // 等待应用加载
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

### 截图

```typescript
test('can take screenshot', async () => {
  const screenshot = await window.screenshot({
    path: 'e2e/screenshots/my-test.png'
  });
  expect(screenshot).toBeTruthy();
});
```

### 与 UI 元素交互

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

### 在主进程中执行代码

```typescript
test('can access BrowserWindow', async () => {
  const windowCount = await electronApp.evaluate(({ BrowserWindow }) => {
    return BrowserWindow.getAllWindows().length;
  });
  expect(windowCount).toBe(1);
});
```

### 测试 IPC 通信

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

## 最佳实践

### 1. 添加 `data-testid` 属性

为了可靠的元素选择，在组件中添加 `data-testid`：

```tsx
// React 组件中
<button data-testid="submit-btn">提交</button>

// 测试中
await window.click('[data-testid="submit-btn"]');
```

### 2. 等待状态变化

```typescript
// 等待元素出现
await window.waitForSelector('.loading', { state: 'hidden' });

// 等待导航
await window.waitForURL('**/dashboard');

// 自定义等待
await window.waitForFunction(() => {
  return document.querySelector('.content')?.textContent?.includes('Ready');
});
```

### 3. 使用页面对象模式（用于复杂测试）

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

// 测试中
const homePage = new HomePage(window);
await homePage.clickNewTask();
expect(await homePage.getTaskCount()).toBe(1);
```

### 4. 失败时截图

在 `playwright.config.ts` 中：

```typescript
export default defineConfig({
  use: {
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
});
```

## 配置

### playwright.config.ts

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,           // 测试超时
  retries: 0,               // 失败重试次数
  workers: 1,               // Electron 测试需要串行运行
  use: {
    trace: 'on-first-retry',
  },
  reporter: [
    ['list'],               // 控制台输出
    ['html', { open: 'never' }],  // HTML 报告
  ],
});
```

## 故障排除

### 应用无法启动

1. 确保 Next.js 服务器正在运行：`pnpm run next`
2. 确保 Electron 已构建：`pnpm run build:deps`
3. 检查端口 5173 是否可用

### 测试超时

- 在配置或测试中增加超时时间：
  ```typescript
  test('slow test', async () => {
    test.setTimeout(120000); // 2 分钟
    // ...
  });
  ```

### 找不到元素

- 使用 `window.pause()` 调试：
  ```typescript
  test('debug test', async () => {
    await window.pause(); // 打开检查器
  });
  ```

### 截图是空白的

- 在导航后添加等待时间：
  ```typescript
  await window.waitForTimeout(2000);
  await window.screenshot({ path: 'screenshot.png' });
  ```

## CI 集成（未来）

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

## 相关文件

- `e2e/` - 测试文件
- `playwright.config.ts` - Playwright 配置
- `e2e/screenshots/` - 测试截图
- `playwright-report/` - HTML 报告（自动生成）
