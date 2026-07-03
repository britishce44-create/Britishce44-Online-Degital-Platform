const { app, ipcMain } = require('electron');
const path = require('path');
const { ChildProcessManager } = require('./src/child-process');
const { WindowManager } = require('./src/windows');
const { createAppMenu } = require('./src/menu');
const { createTray } = require('./src/tray');
const { registerIpcHandlers } = require('./src/ipc-handlers');

const isDev = !app.isPackaged;

let childProcessManager;
let windowManager;

async function bootstrap() {
  /* ── 1. Start api-server child process ── */
  childProcessManager = new ChildProcessManager();
  const serverReady = await childProcessManager.start(isDev);
  if (!serverReady) {
    const { dialog } = require('electron');
    await dialog.showMessageBox({
      type: 'error',
      title: 'Server Error',
      message: 'Failed to start the platform server.\nPlease make sure PostgreSQL is running.',
      buttons: ['Exit'],
    });
    app.quit();
    return;
  }

  /* ── 2. Create main window ── */
  windowManager = new WindowManager();
  let mainUrl;
  if (isDev) {
    mainUrl = 'http://localhost:8080';
  } else {
    const frontendPath = path.join(process.resourcesPath, 'frontend', 'index.html');
    mainUrl = `file://${frontendPath}`;
  }
  windowManager.createMainWindow(mainUrl);

  /* ── 3. Menu + Tray ── */
  createAppMenu(windowManager);
  createTray(windowManager);

  /* ── 4. IPC handlers ── */
  registerIpcHandlers(ipcMain, windowManager, childProcessManager);
}

app.whenReady().then(bootstrap);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (!windowManager?.mainWindow) {
    const mainUrl = isDev
      ? 'http://localhost:8080'
      : `file://${path.join(__dirname, '..', '..', 'britishce44', 'dist', 'public', 'index.html')}`;
    windowManager?.createMainWindow(mainUrl);
  }
});

app.on('before-quit', async () => {
  if (childProcessManager) {
    await childProcessManager.stop();
  }
});
