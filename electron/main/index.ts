/// <reference types="vite/client" />
import {
  app,
  BrowserWindow,
  WebContentsView,
  protocol,
} from "electron";
import log from "electron-log";
import path from "node:path";
import * as pkg from "../../package.json";
// import { setupAutoUpdater } from './utils/auto-update';
import { isDev } from "./utils/constants";
import { setupMenu } from "./ui/menu";
import { createTray } from "./ui/tray";
import { initCookies } from "./utils/cookie";
import { reloadOnChange } from "./utils/reload";
import { registerClientProtocol } from "./utils/protocol";
import { ConfigManager } from "./utils/config-manager";

// Initialize configuration manager
ConfigManager.getInstance().initialize();

import { showCloseConfirmModal } from "./ui/modal";
import { EkoService } from "./services/eko-service";
import { ServerManager } from "./services/server-manager";
import { MainWindowManager } from "./windows/main-window";
import { taskScheduler } from "./services/task-scheduler";
import { windowContextManager } from "./services/window-context-manager";
import { TabManager } from "./services/tab-manager";
import { SettingsManager } from "./utils/settings-manager";
import { settingsWatcher } from "./utils/settings-watcher";
import { cwd } from "node:process";
import { registerAllIpcHandlers } from "./ipc";

Object.assign(console, log.functions);

console.debug("main: import.meta.env:", import.meta.env);
console.log("main: isDev:", isDev);
console.log("NODE_ENV:", global.process.env.NODE_ENV);
console.log("isPackaged:", app.isPackaged);

// Log unhandled errors for debugging
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
});

// Configure custom app paths if APP_PATH_ROOT is specified
(() => {
  const root = global.process.env.APP_PATH_ROOT ?? import.meta.env.VITE_APP_PATH_ROOT;

  if (!root) {
    console.log("No APP_PATH_ROOT or VITE_APP_PATH_ROOT specified, using default paths");
    return;
  }

  if (!path.isAbsolute(root)) {
    console.error("APP_PATH_ROOT must be an absolute path");
    global.process.exit(1);
  }

  console.log(`Configuring custom APP_PATH_ROOT: ${root}`);

  const subdirName = pkg.name;

  // Set app paths
  const pathConfigs: Array<[Parameters<typeof app.setPath>[0], string]> = [
    ["appData", ""],
    ["userData", subdirName],
    ["sessionData", subdirName],
  ];

  pathConfigs.forEach(([key, val]) => {
    app.setPath(key, path.join(root, val));
  });

  app.setAppLogsPath(path.join(root, subdirName, "Logs"));
})();

console.log("appPath:", app.getAppPath());

const pathKeys: Array<Parameters<typeof app.getPath>[0]> = [
  "home", "appData", "userData", "sessionData", "logs", "temp"
];
pathKeys.forEach((key) => console.log(`${key}:`, app.getPath(key)));

// Register custom protocol scheme before app ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'client',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      bypassCSP: true
    }
  }
]);

// Initialize server manager
const serverManager = new ServerManager();

// Start Next.js server in production environment
if (!isDev) {
  try {
    serverManager.startServer();
    console.log('Next.js server started successfully');
  } catch (error) {
    console.error('Failed to start Next.js server:', error);
  }
}

let mainWindow: BrowserWindow;
let tabManager: TabManager;
let historyView: WebContentsView | null = null;
let ekoService: EkoService;
let mainWindowManager: MainWindowManager;

/**
 * Destroy all application windows safely
 */
function destroyAllWindows(): void {
  BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed()) {
      win.destroy();
    }
  });
}

/**
 * Setup main window close handler
 * closeToTray=true: hide to tray | closeToTray=false: quit app
 */
function setupMainWindowCloseHandler(window: BrowserWindow, service: EkoService): void {
  let isShowingModal = false;

  window.on('close', async (event) => {
    event.preventDefault();

    const settingsManager = SettingsManager.getInstance();
    const { closeToTray } = settingsManager.getGeneralSettings().window;

    // Handle running tasks if any
    if (service.hasRunningTask()) {
      if (isShowingModal) return;
      isShowingModal = true;

      const confirmed = await showCloseConfirmModal(window);
      isShowingModal = false;

      if (!confirmed) return;

      const allTaskIds = service['eko']?.getAllTaskId() || [];
      await service.abortAllTasks();

      allTaskIds.forEach((taskId: string) => {
        window.webContents.send('task-aborted-by-system', {
          taskId,
          reason: 'User closed window, task terminated',
          timestamp: new Date().toISOString()
        });
      });

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Apply close behavior
    if (closeToTray) {
      window.hide();
      console.log('[Settings] Closed to tray');
    } else {
      destroyAllWindows();
      app.quit();
      console.log('[Settings] App quitting');
    }
  });
}

/**
 * Initialize main window and all related components
 * Including: detailView, ekoService, windowContext registration
 */
async function initializeMainWindow(): Promise<BrowserWindow> {
  mainWindow = await mainWindowManager.createMainWindow();

  const windowBounds = mainWindow.getBounds();
  mainWindow.contentView.setBounds({
    x: 0,
    y: 0,
    width: windowBounds.width,
    height: windowBounds.height,
  });

  // Initialize TabManager for multi-tab browser support
  tabManager = new TabManager(mainWindow, { x: 818, y: 264, width: 748, height: 560 });
  tabManager.createTab("https://www.google.com");
  tabManager.setVisible(false);

  ekoService = new EkoService(mainWindow, tabManager);

  windowContextManager.registerWindow({
    window: mainWindow,
    tabManager,
    historyView,
    ekoService,
    webContentsId: mainWindow.webContents.id,
    windowType: 'main'
  });

  setupMainWindowCloseHandler(mainWindow, ekoService);

  // Register main window with SettingsWatcher for window-related settings
  settingsWatcher.setMainWindow(mainWindow);

  mainWindow.on('closed', () => {
    try {
      if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
        windowContextManager.unregisterWindow(mainWindow.webContents.id);
      }
    } catch (error) {
      console.error('[Main] Failed to clean up window context:', error);
    }
  });

  return mainWindow;
}

(async () => {
  await app.whenReady();

  registerClientProtocol(protocol);

  if (isDev) {
    app.dock?.setIcon(path.join(cwd(), "assets/icons/logo.png"));
  }

  await initCookies();

  // Initialize SettingsWatcher (apply all settings including auto-start)
  settingsWatcher.initialize();

  mainWindowManager = new MainWindowManager(serverManager);
  mainWindow = await initializeMainWindow();

  // Handle start minimized setting
  if (settingsWatcher.shouldStartMinimized()) {
    mainWindow.hide();
    console.log('[Main] App started minimized to tray');
  }

  createTray(mainWindow);
  taskScheduler.start();

  app.on("activate", async () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      mainWindow = await initializeMainWindow();
      setupMenu(mainWindow);
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  return mainWindow;
})().then((win) => setupMenu(win));

app.on("window-all-closed", () => {
  // Keep app running in background for scheduled tasks
});

registerAllIpcHandlers();
reloadOnChange();
