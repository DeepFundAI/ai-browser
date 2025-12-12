import { ipcRenderer } from 'electron';

// Store callback for when options arrive
let initCallback: ((options: any) => void) | null = null;
let pendingOptions: any = null;

// Listen for modal-init immediately in preload
ipcRenderer.on('modal-init', (_event, options) => {
  if (initCallback) {
    initCallback(options);
  } else {
    // Store options if callback not yet registered
    pendingOptions = options;
  }
});

// Modal API exposed to renderer (contextIsolation: false)
(window as any).modalApi = {
  onInit: (callback: (options: any) => void) => {
    initCallback = callback;
    // If options already received, call callback immediately
    if (pendingOptions) {
      callback(pendingOptions);
      pendingOptions = null;
    }
  },
  sendResponse: (channel: string, value: string | null) => {
    ipcRenderer.send(channel, value);
  },
};
