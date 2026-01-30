const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const { createDeviceManager } = require('./devices');
const Vectorizer = require('./utils/vectorize');
const { validateFilePath, validateDeviceInfo, validateCutJob, validateTraceOptions, handleSecureError } = require('./security');
const LicenseManager = require('./licensing');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;
let deviceManager;
let vectorizer;
let licenseManager;
let aiServerProcess;

// Start AI server in background
function startAiServer() {
  try {
    const serverPath = path.join(__dirname, 'server', 'server.js');
    const nodeCandidates = [
      process.env.NODE_BINARY,
      'C:\\Program Files\\nodejs\\node.exe',
      'C:\\Program Files (x86)\\nodejs\\node.exe'
    ].filter(Boolean);

    let nodeBinary = nodeCandidates.find(candidate => fs.existsSync(candidate));
    if (!nodeBinary) {
      nodeBinary = 'node';
    }

    aiServerProcess = spawn(nodeBinary, [serverPath], {
      stdio: 'pipe',
      detached: false
    });
    
    aiServerProcess.stdout.on('data', (data) => {
      console.log(`[AI Server] ${data.toString().trim()}`);
    });
    
    aiServerProcess.stderr.on('data', (data) => {
      console.error(`[AI Server Error] ${data.toString().trim()}`);
    });
    
    aiServerProcess.on('close', (code) => {
      console.log(`[AI Server] Process exited with code ${code}`);
    });
    
    console.log(`[AI Server] Started on port 4000 using ${nodeBinary}`);
  } catch (error) {
    console.error('[AI Server] Failed to start:', error.message);
  }
}

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
    title: 'About Nightmare Designs SVG Forge',
    message: '🩸 Nightmare Designs SVG Forge v0.1.0',
    detail: 'A powerful design and cutting software.\nMore tools. More options. Complete creative freedom.\n\nForged in darkness, cut with precision.\n\nhttps://nightmaredesigns.org'
  });
}

// Initialize services
app.whenReady().then(() => {
  licenseManager = new LicenseManager();
  
  // Check license on startup
  const licenseStatus = licenseManager.getStatus();
  console.log('License Status:', licenseStatus);
  
  // If no license exists, start trial
  if (!licenseManager.license) {
    licenseManager.startTrial();
    console.log('Trial started');
  }
  
  // Check if locked (trial expired, not activated)
  if (licenseManager.isLocked()) {
    console.warn('Software is locked. Trial expired and not activated.');
  }
  
  deviceManager = createDeviceManager();
  vectorizer = new Vectorizer();
  
  // Start AI server
  startAiServer();
  
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
  
  // Send license status to renderer
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('license-status', licenseManager.getStatus());
  });
  
  setupIPC();
});

app.on('window-all-closed', async () => {
  if (deviceManager) {
    await deviceManager.disconnectAll();
  }
  
  // Kill AI server
  if (aiServerProcess) {
    aiServerProcess.kill();
    console.log('[AI Server] Stopped');
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
    try {
      const validated = validateDeviceInfo(deviceInfo);
      const res = await deviceManager.connect(validated, driverName);
      // Don't return driver objects or native handles over IPC — only serializable info
      return { deviceId: res.deviceId, info: res.driver && res.driver.info ? res.driver.info : validated };
    } catch (err) {
      throw new Error(handleSecureError(err, 'connect-device'));
    }
  });
  
  ipcMain.handle('disconnect-device', async (event, deviceId) => {
    try {
      await deviceManager.disconnect(deviceId);
    } catch (err) {
      throw new Error(handleSecureError(err, 'disconnect-device'));
    }
  });
  
  ipcMain.handle('get-device-status', () => {
    return deviceManager.getStatus();
  });
  
  ipcMain.handle('send-cut-job', async (event, job) => {
    try {
      const validated = validateCutJob(job);
      return await deviceManager.sendCutJob(validated);
    } catch (err) {
      throw new Error(handleSecureError(err, 'send-cut-job'));
    }
  });
  
  // Vectorization IPC
  ipcMain.handle('trace-image', async (event, imagePath, options) => {
    try {
      // Allow data URLs (base64 encoded images) to pass through without path validation
      const validatedPath = imagePath.startsWith('data:') ? imagePath : validateFilePath(imagePath);
      const validatedOptions = validateTraceOptions(options);
      return await vectorizer.traceImage(validatedPath, validatedOptions);
    } catch (err) {
      throw new Error(handleSecureError(err, 'trace-image'));
    }
  });
  
  ipcMain.handle('posterize-image', async (event, imagePath, steps, options) => {
    try {
      // Allow data URLs (base64 encoded images) to pass through without path validation
      const validatedPath = imagePath.startsWith('data:') ? imagePath : validateFilePath(imagePath);
      const validatedOptions = validateTraceOptions(options);
      const validatedSteps = Math.max(2, Math.min(8, parseInt(steps) || 3));
      return await vectorizer.posterizeTrace(validatedPath, validatedSteps, validatedOptions);
    } catch (err) {
      throw new Error(handleSecureError(err, 'posterize-image'));
    }
  });
  
  ipcMain.handle('preprocess-image', async (event, imagePath, options) => {
    try {
      // Allow data URLs (base64 encoded images) to pass through without path validation
      const validatedPath = imagePath.startsWith('data:') ? imagePath : validateFilePath(imagePath);
      const validatedOptions = validateTraceOptions(options);
      return await vectorizer.preprocessImage(validatedPath, validatedOptions);
    } catch (err) {
      throw new Error(handleSecureError(err, 'preprocess-image'));
    }
  });

  ipcMain.handle('trace-color-only', async (event, imagePath, colorHex, options) => {
    try {
      // Allow data URLs (base64 encoded images) to pass through without path validation
      const validatedPath = imagePath.startsWith('data:') ? imagePath : validateFilePath(imagePath);
      const validatedOptions = validateTraceOptions(options);
      // colorHex comes as #RRGGBB
      return await vectorizer.traceColorOnly(validatedPath, colorHex, validatedOptions);
    } catch (err) {
      throw new Error(handleSecureError(err, 'trace-color-only'));
    }
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
  
  // Licensing IPC handlers
  ipcMain.handle('get-license-status', () => {
    return licenseManager.getStatus();
  });
  
  ipcMain.handle('activate-license', async (event, keyString) => {
    if (!keyString || typeof keyString !== 'string') {
      return { success: false, error: 'Invalid key' };
    }
    const result = licenseManager.activateKey(keyString);
    if (result.success) {
      mainWindow.webContents.send('license-status', licenseManager.getStatus());
    }
    return result;
  });
  
  ipcMain.handle('check-license-locked', () => {
    return {
      isLocked: licenseManager.isLocked(),
      status: licenseManager.getStatus()
    };
  });
}
