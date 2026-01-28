const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const { createDeviceManager } = require('./devices');
const Vectorizer = require('./utils/vectorize');

let mainWindow;
let deviceManager;
let vectorizer;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icons/icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  // Create application menu
  const menu = Menu.buildFromTemplate(createMenuTemplate());
  Menu.setApplicationMenu(menu);
}

function createMenuTemplate() {
  return [
    {
      label: 'File',
      submenu: [
        { label: 'New Project', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('menu-new-project') },
        { label: 'Open...', accelerator: 'CmdOrCtrl+O', click: handleOpen },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => mainWindow.webContents.send('menu-save') },
        { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S', click: handleSaveAs },
        { type: 'separator' },
        { label: 'Import SVG...', click: handleImportSVG },
        { label: 'Export...', submenu: [
          { label: 'Export as SVG', click: () => mainWindow.webContents.send('export', 'svg') },
          { label: 'Export as PNG', click: () => mainWindow.webContents.send('export', 'png') },
          { label: 'Export as PDF', click: () => mainWindow.webContents.send('export', 'pdf') }
        ]},
        { type: 'separator' },
        { label: 'Exit', accelerator: 'Alt+F4', click: () => app.quit() }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => mainWindow.webContents.send('menu-undo') },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', click: () => mainWindow.webContents.send('menu-redo') },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Delete', accelerator: 'Delete', click: () => mainWindow.webContents.send('menu-delete') },
        { type: 'separator' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', click: () => mainWindow.webContents.send('menu-select-all') }
      ]
    },
    {
      label: 'Object',
      submenu: [
        { label: 'Group', accelerator: 'CmdOrCtrl+G', click: () => mainWindow.webContents.send('menu-group') },
        { label: 'Ungroup', accelerator: 'CmdOrCtrl+Shift+G', click: () => mainWindow.webContents.send('menu-ungroup') },
        { type: 'separator' },
        { label: 'Bring to Front', click: () => mainWindow.webContents.send('menu-bring-front') },
        { label: 'Send to Back', click: () => mainWindow.webContents.send('menu-send-back') },
        { type: 'separator' },
        { label: 'Flip Horizontal', click: () => mainWindow.webContents.send('menu-flip-h') },
        { label: 'Flip Vertical', click: () => mainWindow.webContents.send('menu-flip-v') },
        { type: 'separator' },
        { label: 'Weld', click: () => mainWindow.webContents.send('menu-weld') },
        { label: 'Slice', click: () => mainWindow.webContents.send('menu-slice') },
        { label: 'Attach', click: () => mainWindow.webContents.send('menu-attach') },
        { label: 'Flatten', click: () => mainWindow.webContents.send('menu-flatten') }
      ]
    },
    {
      label: 'Machine',
      submenu: [
        { label: 'Scan for Devices...', click: () => handleScanDevices() },
        { label: 'Connect...', click: () => mainWindow.webContents.send('show-device-dialog') },
        { label: 'Disconnect', click: () => handleDisconnect() },
        { type: 'separator' },
        { label: 'Load Mat', click: () => handleLoadMat() },
        { label: 'Unload Mat', click: () => handleUnloadMat() },
        { type: 'separator' },
        { label: 'Send to Cutter', accelerator: 'CmdOrCtrl+M', click: () => mainWindow.webContents.send('menu-send-cut') }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', click: () => mainWindow.webContents.send('menu-zoom-in') },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => mainWindow.webContents.send('menu-zoom-out') },
        { label: 'Fit to Window', accelerator: 'CmdOrCtrl+0', click: () => mainWindow.webContents.send('menu-fit-window') },
        { type: 'separator' },
        { label: 'Show Grid', type: 'checkbox', checked: true, click: (item) => mainWindow.webContents.send('menu-toggle-grid', item.checked) },
        { label: 'Show Rulers', type: 'checkbox', checked: true, click: (item) => mainWindow.webContents.send('menu-toggle-rulers', item.checked) },
        { type: 'separator' },
        { label: 'Toggle DevTools', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() }
      ]
    },
    {
      label: 'Help',
      submenu: [
{ label: 'Documentation', click: () => require('electron').shell.openExternal('https://nightmaredesigns.org/docs') },
        { label: 'Website', click: () => require('electron').shell.openExternal('https://nightmaredesigns.org') },
        { label: 'About CraftForge', click: showAbout }
      ]
    }
  ];
}

async function handleOpen() {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [
      { name: 'CraftForge Projects', extensions: ['cfproj'] },
      { name: 'SVG Files', extensions: ['svg'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (!result.canceled) {
    mainWindow.webContents.send('file-opened', result.filePaths[0]);
  }
}

async function handleSaveAs() {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'CraftForge Project', extensions: ['cfproj'] }]
  });
  if (!result.canceled) {
    mainWindow.webContents.send('file-save-as', result.filePath);
  }
}

async function handleImportSVG() {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'SVG Files', extensions: ['svg'] }]
  });
  if (!result.canceled) {
    mainWindow.webContents.send('import-svg', result.filePaths[0]);
  }
}

function showAbout() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'About Nightmare Designs Forge',
    message: '🩸 Nightmare Designs Forge v0.1.0',
    detail: 'A powerful design and cutting software.\nMore tools. More options. Complete creative freedom.\n\nForged in darkness, cut with precision.\n\nhttps://nightmaredesigns.org'
  });
}

// Initialize services
app.whenReady().then(() => {
  deviceManager = createDeviceManager();
  vectorizer = new Vectorizer();
  
  // Device manager events
  deviceManager.on('device-connected', (data) => {
    mainWindow.webContents.send('device-connected', data);
  });
  
  deviceManager.on('device-disconnected', (data) => {
    mainWindow.webContents.send('device-disconnected', data);
  });
  
  deviceManager.on('cut-progress', (data) => {
    mainWindow.webContents.send('cut-progress', data);
  });
  
  deviceManager.on('cut-completed', (data) => {
    mainWindow.webContents.send('cut-completed', data);
  });
  
  deviceManager.on('device-error', (data) => {
    mainWindow.webContents.send('device-error', data);
  });
  
  createWindow();
  setupIPC();
});

app.on('window-all-closed', async () => {
  if (deviceManager) {
    await deviceManager.disconnectAll();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Device handlers
async function handleScanDevices() {
  try {
    const devices = await deviceManager.scanAllDevices();
    mainWindow.webContents.send('devices-found', devices);
  } catch (err) {
    mainWindow.webContents.send('device-error', { error: err.message });
  }
}

async function handleDisconnect() {
  try {
    await deviceManager.disconnectAll();
  } catch (err) {
    console.error('Disconnect error:', err);
  }
}

function handleLoadMat() {
  const status = deviceManager.getStatus();
  if (status.connected) {
    const device = deviceManager.devices.get(deviceManager.activeDevice);
    if (device && device.driver.loadMat) {
      device.driver.loadMat();
    }
  }
}

function handleUnloadMat() {
  const status = deviceManager.getStatus();
  if (status.connected) {
    const device = deviceManager.devices.get(deviceManager.activeDevice);
    if (device && device.driver.unloadMat) {
      device.driver.unloadMat();
    }
  }
}

// IPC handlers
function setupIPC() {
  // Device IPC
  ipcMain.handle('scan-devices', async () => {
    return await deviceManager.scanAllDevices();
  });
  
  ipcMain.handle('connect-device', async (event, deviceInfo, driverName) => {
    return await deviceManager.connect(deviceInfo, driverName);
  });
  
  ipcMain.handle('disconnect-device', async (event, deviceId) => {
    await deviceManager.disconnect(deviceId);
  });
  
  ipcMain.handle('get-device-status', () => {
    return deviceManager.getStatus();
  });
  
  ipcMain.handle('send-cut-job', async (event, job) => {
    return await deviceManager.sendCutJob(job);
  });
  
  // Vectorization IPC
  ipcMain.handle('trace-image', async (event, imagePath, options) => {
    return await vectorizer.traceImage(imagePath, options);
  });
  
  ipcMain.handle('posterize-image', async (event, imagePath, steps, options) => {
    return await vectorizer.posterizeTrace(imagePath, steps, options);
  });
  
  ipcMain.handle('preprocess-image', async (event, imagePath, options) => {
    return await vectorizer.preprocessImage(imagePath, options);
  });
  
  ipcMain.handle('select-image-for-trace', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'gif'] }
      ]
    });
    if (!result.canceled) {
      return result.filePaths[0];
    }
    return null;
  });
}
