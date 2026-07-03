const { BrowserWindow, screen } = require('electron');
const path = require('path');

class WindowManager {
  constructor() {
    this.mainWindow = null;
    this.meetingWindows = new Map();
  }

  createMainWindow(url) {
    this.mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 1024,
      minHeight: 600,
      icon: path.join(__dirname, '..', 'public', 'icon.png'),
      title: 'Britishce44',
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '..', 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        webRTC: true,
      },
    });

    this.mainWindow.loadURL(url);

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      if (process.platform === 'win32') {
        this.mainWindow.maximize();
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  openMeetingWindow(roomId, userId, userName) {
    const existing = this.meetingWindows.get(roomId);
    if (existing && !existing.isDestroyed()) {
      existing.focus();
      return;
    }

    const displays = screen.getAllDisplays();
    const externalDisplay = displays.length > 1 ? displays[1] : displays[0];
    const { x, y, width, height } = externalDisplay.workArea;

    const win = new BrowserWindow({
      x: x + 50,
      y: y + 50,
      width: Math.min(width - 100, 1200),
      height: Math.min(height - 100, 800),
      icon: path.join(__dirname, '..', 'public', 'icon.png'),
      title: `Meeting Room ${roomId}`,
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, '..', 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        webRTC: true,
      },
    });

    const meetingUrl = this.mainWindow?.webContents?.getURL()?.split('?')[0] + `?room=${roomId}&meeting=1`;
    win.loadURL(meetingUrl || `http://localhost:8080?room=${roomId}&meeting=1`);

    this.meetingWindows.set(roomId, win);

    win.on('closed', () => {
      this.meetingWindows.delete(roomId);
    });
  }

  closeMeetingWindow(roomId) {
    const win = this.meetingWindows.get(roomId);
    if (win && !win.isDestroyed()) {
      win.close();
    }
    this.meetingWindows.delete(roomId);
  }

  closeAllMeetingWindows() {
    for (const [id, win] of this.meetingWindows) {
      if (!win.isDestroyed()) win.close();
    }
    this.meetingWindows.clear();
  }
}

module.exports = { WindowManager };
