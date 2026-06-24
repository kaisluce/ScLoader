const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  browseFolder: () => ipcRenderer.invoke('dialog:browse-folder'),
})
