const { Menu, app } = require('electron');

function createAppMenu(windowManager) {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about', label: 'About Britishce44' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),

    {
      label: 'File',
      submenu: [
        { role: 'reload', label: 'Reload Platform' },
        { role: 'forceReload', label: 'Hard Reload' },
        { type: 'separator' },
        { role: 'toggleDevTools', label: 'Developer Tools' },
        { type: 'separator' },
        ...(isMac ? [] : [{ role: 'quit', label: 'Exit Britishce44' }]),
      ],
    },

    {
      label: 'View',
      submenu: [
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Full Screen' },
      ],
    },

    {
      label: 'Meetings',
      submenu: [
        {
          label: 'Close All Meeting Windows',
          click: () => windowManager.closeAllMeetingWindows(),
          accelerator: 'CmdOrCtrl+Shift+W',
        },
      ],
    },

    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
        ] : [{ role: 'close' }]),
      ],
    },

    {
      label: 'Help',
      submenu: [
        {
          label: 'Britishce44 Website',
          click: () => require('electron').shell.openExternal('https://britishce44.com'),
        },
        { type: 'separator' },
        { role: 'about', label: 'Version 1.0.0' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

module.exports = { createAppMenu };
