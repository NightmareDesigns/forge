const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const KeyGenerator = require('./key-generator');

let mainWindow;
let keyGenerator;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'keygen-preload.js')
    },
    icon: path.join(__dirname, '../assets/icons/icon.png'),
    title: 'CraftForge License Key Generator - ADMIN ONLY'
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer/keygen.html'));

  // Create menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'About', click: showAbout }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);
}

function showAbout() {
  const { dialog } = require('electron');
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'CraftForge License Key Generator',
    message: '🔐 CraftForge License Key Generator v1.0.0',
    detail: 'ADMIN TOOL ONLY - License key generation and management\n\nThis tool is for remote administration only.\nNot included in user licenses.\n\nhttps://nightmaredesigns.org'
  });
}

app.whenReady().then(() => {
  keyGenerator = new KeyGenerator();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // IPC Handlers for key generation
  ipcMain.handle('keygen-generate', async (event, count) => {
    try {
      const keys = keyGenerator.generateBatch(count);
      return { success: true, keys, count: keys.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('keygen-export-json', async () => {
    try {
      const filePath = path.join(app.getPath('userData'), 'license_keys.json');
      const result = keyGenerator.exportToJSON(filePath);
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('keygen-export-csv', async () => {
    try {
      const filePath = path.join(app.getPath('userData'), 'license_keys.csv');
      const result = keyGenerator.exportToCSV(filePath);
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('keygen-load-keys', async () => {
    try {
      const filePath = path.join(app.getPath('userData'), 'license_keys.json');
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        keyGenerator.keys = data.keys || [];
        return { success: true, keys: keyGenerator.keys };
      }
      return { success: false, error: 'No keys file found' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
