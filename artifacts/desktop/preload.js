const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('b44Desktop', {
  /* ── Window management ── */
  openMeetingWindow: (roomId, userId, userName) =>
    ipcRenderer.invoke('open-meeting-window', { roomId, userId, userName }),
  closeMeetingWindow: () =>
    ipcRenderer.invoke('close-meeting-window'),

  /* ── Server status ── */
  getServerPort: () => ipcRenderer.invoke('get-server-port'),
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),

  /* ── Notifications ── */
  showNotification: (title, body) =>
    ipcRenderer.invoke('show-notification', { title, body }),

  /* ── File dialogs ── */
  saveFileDialog: (defaultName) =>
    ipcRenderer.invoke('save-file-dialog', { defaultName }),

  /* ── App info ── */
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => process.platform,

  /* ── Events from main process ── */
  onServerStatusChange: (callback) => {
    ipcRenderer.on('server-status-changed', (_event, status) => callback(status));
    return () => ipcRenderer.removeAllListeners('server-status-changed');
  },
});
