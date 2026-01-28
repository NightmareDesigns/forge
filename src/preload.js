const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('craftforge', {
  // File operations
  onFileOpened: (callback) => ipcRenderer.on('file-opened', (event, path) => callback(path)),
  onFileSaveAs: (callback) => ipcRenderer.on('file-save-as', (event, path) => callback(path)),
  onImportSVG: (callback) => ipcRenderer.on('import-svg', (event, path) => callback(path)),
  onExport: (callback) => ipcRenderer.on('export', (event, format) => callback(format)),

  // Menu commands
  onMenuCommand: (command, callback) => ipcRenderer.on(`menu-${command}`, () => callback()),
  
  // Canvas operations
  onNewProject: (callback) => ipcRenderer.on('menu-new-project', () => callback()),
  onSave: (callback) => ipcRenderer.on('menu-save', () => callback()),
  onUndo: (callback) => ipcRenderer.on('menu-undo', () => callback()),
  onRedo: (callback) => ipcRenderer.on('menu-redo', () => callback()),
  onDelete: (callback) => ipcRenderer.on('menu-delete', () => callback()),
  onSelectAll: (callback) => ipcRenderer.on('menu-select-all', () => callback()),
  
  // Object operations
  onGroup: (callback) => ipcRenderer.on('menu-group', () => callback()),
  onUngroup: (callback) => ipcRenderer.on('menu-ungroup', () => callback()),
  onBringFront: (callback) => ipcRenderer.on('menu-bring-front', () => callback()),
  onSendBack: (callback) => ipcRenderer.on('menu-send-back', () => callback()),
  onFlipH: (callback) => ipcRenderer.on('menu-flip-h', () => callback()),
  onFlipV: (callback) => ipcRenderer.on('menu-flip-v', () => callback()),
  onWeld: (callback) => ipcRenderer.on('menu-weld', () => callback()),
  onSlice: (callback) => ipcRenderer.on('menu-slice', () => callback()),
  onAttach: (callback) => ipcRenderer.on('menu-attach', () => callback()),
  onFlatten: (callback) => ipcRenderer.on('menu-flatten', () => callback()),
  
  // View operations
  onZoomIn: (callback) => ipcRenderer.on('menu-zoom-in', () => callback()),
  onZoomOut: (callback) => ipcRenderer.on('menu-zoom-out', () => callback()),
  onFitWindow: (callback) => ipcRenderer.on('menu-fit-window', () => callback()),
  onToggleGrid: (callback) => ipcRenderer.on('menu-toggle-grid', (event, show) => callback(show)),
  onToggleRulers: (callback) => ipcRenderer.on('menu-toggle-rulers', (event, show) => callback(show)),
  
  // Device operations
  scanDevices: () => ipcRenderer.invoke('scan-devices'),
  connectDevice: (deviceInfo, driverName) => ipcRenderer.invoke('connect-device', deviceInfo, driverName),
  disconnectDevice: (deviceId) => ipcRenderer.invoke('disconnect-device', deviceId),
  getDeviceStatus: () => ipcRenderer.invoke('get-device-status'),
  sendCutJob: (job) => ipcRenderer.invoke('send-cut-job', job),
  
  onDeviceConnected: (callback) => ipcRenderer.on('device-connected', (event, data) => callback(data)),
  onDeviceDisconnected: (callback) => ipcRenderer.on('device-disconnected', (event, data) => callback(data)),
  onDevicesFound: (callback) => ipcRenderer.on('devices-found', (event, devices) => callback(devices)),
  onCutProgress: (callback) => ipcRenderer.on('cut-progress', (event, data) => callback(data)),
  onCutCompleted: (callback) => ipcRenderer.on('cut-completed', (event, data) => callback(data)),
  onDeviceError: (callback) => ipcRenderer.on('device-error', (event, data) => callback(data)),
  onShowDeviceDialog: (callback) => ipcRenderer.on('show-device-dialog', () => callback()),
  onSendCut: (callback) => ipcRenderer.on('menu-send-cut', () => callback()),
  
  // Vectorization/Trace operations
  selectImageForTrace: () => ipcRenderer.invoke('select-image-for-trace'),
  traceImage: (imagePath, options) => ipcRenderer.invoke('trace-image', imagePath, options),
  posterizeImage: (imagePath, steps, options) => ipcRenderer.invoke('posterize-image', imagePath, steps, options),
  preprocessImage: (imagePath, options) => ipcRenderer.invoke('preprocess-image', imagePath, options)
});
