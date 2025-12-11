import { ipcMain, dialog, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { successResponse, errorResponse } from '../utils/ipc-response';

/**
 * Get base path for static files (same logic as eko-service)
 */
function getStaticBasePath(): string {
  return app.isPackaged
    ? app.getPath('userData')
    : path.join(process.cwd(), 'public');
}

export function registerFileHandlers() {
  // File download handler
  ipcMain.handle('file:download', async (_event, filePath: string, fileName: string) => {
    try {
      // If filePath is absolute, use it directly; otherwise join with basePath
      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(getStaticBasePath(), filePath);

      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        return errorResponse(`File not found: ${filePath}`);
      }

      // Show save dialog
      const result = await dialog.showSaveDialog({
        title: 'Save File',
        defaultPath: fileName,
        filters: [
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return successResponse({ canceled: true });
      }

      // Copy file to selected location
      fs.copyFileSync(fullPath, result.filePath);

      return successResponse({
        saved: true,
        savedPath: result.filePath
      });
    } catch (error) {
      console.error('Failed to download file:', error);
      return errorResponse(error instanceof Error ? error.message : 'Download failed');
    }
  });
}
