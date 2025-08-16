import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('kovanAPI', {
  services: {
    list: () => ipcRenderer.invoke('services:list'),
    installed: () => ipcRenderer.invoke('services:installed'),
    start: (serviceName: string) => ipcRenderer.invoke('services:start', serviceName),
    stop: (serviceName: string) => ipcRenderer.invoke('services:stop', serviceName),
    status: (serviceName: string) => ipcRenderer.invoke('services:status', serviceName),
    download: (serviceName: string) => ipcRenderer.invoke('services:download', serviceName),
    install: (serviceName: string, installerPath: string) => ipcRenderer.invoke('services:install', serviceName, installerPath),
  },
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    add: (projectPath: string) => ipcRenderer.invoke('projects:add', projectPath),
    remove: (projectId: string) => ipcRenderer.invoke('projects:remove', projectId),
    open: (projectId: string) => ipcRenderer.invoke('projects:open', projectId),
    templates: () => ipcRenderer.invoke('projects:templates'),
    createFromTemplate: (templateId: string, projectName: string, projectPath: string) => 
      ipcRenderer.invoke('projects:create-from-template', templateId, projectName, projectPath),
  },
  plugins: {
    list: () => ipcRenderer.invoke('plugins:list'),
    install: (pluginName: string) => ipcRenderer.invoke('plugins:install', pluginName),
    uninstall: (pluginName: string) => ipcRenderer.invoke('plugins:uninstall', pluginName),
    enable: (pluginId: string) => ipcRenderer.invoke('plugins:enable', pluginId),
    disable: (pluginId: string) => ipcRenderer.invoke('plugins:disable', pluginId),
  },
  system: {
    info: () => ipcRenderer.invoke('system:info'),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (settings: any) => ipcRenderer.invoke('settings:save', settings),
  },
  file: {
    selectDirectory: () => ipcRenderer.invoke('file:select-directory'),
    selectFile: (options?: any) => ipcRenderer.invoke('file:select-file', options),
  },
});
