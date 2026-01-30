const { contextBridge, ipcRenderer } = require('electron');

// Expose key generator functions
contextBridge.exposeInMainWorld('keygen', {
  generateKeys: (count) => ipcRenderer.invoke('keygen-generate', count),
  exportJSON: () => ipcRenderer.invoke('keygen-export-json'),
  exportCSV: () => ipcRenderer.invoke('keygen-export-csv'),
  loadKeys: () => ipcRenderer.invoke('keygen-load-keys')
});
