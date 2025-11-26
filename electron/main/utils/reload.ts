import { app } from 'electron';
import path from 'node:path';
import { promises as fs } from 'node:fs';

// Reload on change.
let isQuited = false;

const abort = new AbortController();
const { signal } = abort;

export async function reloadOnChange() {
  const dir = path.join(app.getAppPath(), 'electron');

  try {
    const watcher = fs.watch(dir, { signal, recursive: true });

    for await (const _event of watcher) {
      if (!isQuited) {
        isQuited = true;
        app.relaunch();
        app.quit();
      }
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return;
    console.error('[Reload] Watch error:', err);
  }
}
