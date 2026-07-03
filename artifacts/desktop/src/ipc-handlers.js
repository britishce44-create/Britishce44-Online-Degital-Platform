const { app, Notification, dialog } = require('electron');
const path = require('path');

function registerIpcHandlers(ipcMain, windowManager, childProcessManager) {
  /* ── Meeting windows ── */
  ipcMain.handle('open-meeting-window', (_event, { roomId, userId, userName }) => {
    windowManager.openMeetingWindow(roomId, userId, userName);
  });

  ipcMain.handle('close-meeting-window', (_event, { roomId } = {}) => {
    if (roomId) {
      windowManager.closeMeetingWindow(roomId);
    } else {
      windowManager.closeAllMeetingWindows();
    }
  });

  /* ── Server status ── */
  ipcMain.handle('get-server-port', () => childProcessManager.getPort());

  ipcMain.handle('get-server-status', () => ({
    running: childProcessManager.isRunning(),
    port: childProcessManager.getPort(),
  }));

  /* ── Notifications ── */
  ipcMain.handle('show-notification', (_event, { title, body }) => {
    if (Notification.isSupported()) {
      const notif = new Notification({ title, body, icon: path.join(__dirname, '..', 'public', 'icon.png') });
      notif.show();
      notif.on('click', () => {
        if (windowManager.mainWindow) {
          windowManager.mainWindow.show();
          windowManager.mainWindow.focus();
        }
      });
    }
  });

  /* ── File dialogs ── */
  ipcMain.handle('save-file-dialog', async (_event, { defaultName }) => {
    if (!windowManager.mainWindow) return null;
    const result = await dialog.showSaveDialog(windowManager.mainWindow, {
      defaultPath: defaultName || 'download',
      filters: [
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    return result.canceled ? null : result.filePath;
  });

  /* ── App info ── */
  ipcMain.handle('get-app-version', () => app.getVersion());
}

module.exports = { registerIpcHandlers };
