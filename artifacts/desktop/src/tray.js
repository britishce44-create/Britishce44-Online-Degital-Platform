const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');

function createTray(windowManager) {
  let trayIcon;
  try {
    const iconPath = path.join(__dirname, '..', 'public', 'icon.png');
    const img = nativeImage.createFromPath(iconPath);
    trayIcon = img.resize({ width: 16, height: 16 });
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  const tray = new Tray(trayIcon);
  tray.setToolTip('Britishce44');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Britishce44',
      click: () => {
        if (windowManager.mainWindow) {
          windowManager.mainWindow.show();
          windowManager.mainWindow.focus();
        }
      },
    },
    {
      label: 'Close All Meeting Windows',
      click: () => windowManager.closeAllMeetingWindows(),
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (windowManager.mainWindow) {
      windowManager.mainWindow.show();
      windowManager.mainWindow.focus();
    }
  });

  return tray;
}

module.exports = { createTray };
