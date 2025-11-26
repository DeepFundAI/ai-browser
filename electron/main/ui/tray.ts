import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron';
import path from 'node:path';
import { isDev } from '../utils/constants';
import { taskScheduler } from '../services/task-scheduler';

let tray: Tray | null = null;
let updateInterval: NodeJS.Timeout | null = null;

export function createTray(mainWindow: BrowserWindow): Tray {
  const icon = nativeImage.createFromPath(getTrayIconPath());
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip('DeepFundAI Browser');

  updateTrayMenu(mainWindow);

  tray.on('click', () => {
    if (process.platform !== 'darwin') {
      showMainWindow(mainWindow);
    }
  });

  if (updateInterval) clearInterval(updateInterval);
  updateInterval = setInterval(() => updateTrayMenu(mainWindow), 5000);

  return tray;
}

export function updateTrayMenu(mainWindow: BrowserWindow): void {
  if (!tray) return;

  const schedulerStatus = getSchedulerStatus();

  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'DeepFundAI Browser', enabled: false },
    { type: 'separator' },
    { label: 'Show Main Window', click: () => showMainWindow(mainWindow) },
    { type: 'separator' },
    { label: `Scheduler Status: ${schedulerStatus.isRunning ? 'Running' : 'Stopped'}`, enabled: false },
    { label: `Scheduled: ${schedulerStatus.scheduledCount}`, enabled: false },
    { label: `Running: ${schedulerStatus.runningCount}`, enabled: false },
    { type: 'separator' },
    { label: 'Quit Application', click: () => quitApplication() },
  ]));
}

function showMainWindow(mainWindow: BrowserWindow): void {
  if (mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function quitApplication(): void {
  taskScheduler.stop();
  if (tray) {
    tray.destroy();
    tray = null;
  }
  app.quit();
}

function getSchedulerStatus() {
  return taskScheduler.getStatus();
}

function getTrayIconPath(): string {
  if (isDev) return path.join(process.cwd(), 'assets/icons/icon.png');

  if (process.platform === 'win32') return path.join(process.resourcesPath, 'assets/icons/icon.ico');
  if (process.platform === 'darwin') return path.join(process.resourcesPath, 'assets/icons/icon.icns');
  return path.join(process.resourcesPath, 'assets/icons/icon.png');
}

export function destroyTray(): void {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

export function getTray(): Tray | null {
  return tray;
}
