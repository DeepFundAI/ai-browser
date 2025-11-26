import logger from 'electron-log';
import { app, dialog } from 'electron';
import type { AppUpdater, UpdateInfo } from 'electron-updater';
import path from 'node:path';
import * as electronUpdater from 'electron-updater';
import { isDev } from './constants';

const autoUpdater: AppUpdater = (electronUpdater as any).default.autoUpdater;

export async function setupAutoUpdater() {
  logger.transports.file.level = 'debug';
  autoUpdater.logger = logger;

  const resourcePath = isDev
    ? path.join(process.cwd(), 'electron-update.yml')
    : path.join(app.getAppPath(), 'electron-update.yml');
  autoUpdater.updateConfigPath = resourcePath;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', async (info: UpdateInfo) => {
    const response = await dialog.showMessageBox({
      type: 'info',
      buttons: ['Update', 'Later'],
      title: 'Application Update',
      message: `Version ${info.version} is available.`,
      detail: 'A new version is available. Would you like to update now?',
    });

    if (response.response === 0) autoUpdater.downloadUpdate();
  });

  autoUpdater.on('update-downloaded', async () => {
    const response = await dialog.showMessageBox({
      type: 'info',
      buttons: ['Restart', 'Later'],
      title: 'Application Update',
      message: 'Update Downloaded',
      detail: 'A new version has been downloaded. Restart the application to apply the updates.',
    });

    if (response.response === 0) autoUpdater.quitAndInstall(false);
  });

  await autoUpdater.checkForUpdates().catch(err => {
    logger.error('[AutoUpdate] Check failed:', err);
  });

  setInterval(() => {
    autoUpdater.checkForUpdates().catch(err => {
      logger.error('[AutoUpdate] Periodic check failed:', err);
    });
  }, 4 * 60 * 60 * 1000);
}
