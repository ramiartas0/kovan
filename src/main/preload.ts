import { contextBridge, ipcRenderer } from 'electron';

// API'yi window objesine expose et
contextBridge.exposeInMainWorld('kovanAPI', {
  // Servis yönetimi
  services: {
    list: () => ipcRenderer.invoke('services:list'),
    start: (serviceName: string) => ipcRenderer.invoke('services:start', serviceName),
    stop: (serviceName: string) => ipcRenderer.invoke('services:stop', serviceName),
    status: (serviceName: string) => ipcRenderer.invoke('services:status', serviceName),
    download: (serviceName: string) => ipcRenderer.invoke('services:download', serviceName),
    install: (serviceName: string, installerPath: string) => ipcRenderer.invoke('services:install', serviceName, installerPath),
    updatePort: (serviceName: string, newPort: number) => ipcRenderer.invoke('services:updatePort', serviceName, newPort),
  },
  
  // Proje yönetimi
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    add: (projectPath: string) => ipcRenderer.invoke('projects:add', projectPath),
    remove: (projectId: string) => ipcRenderer.invoke('projects:remove', projectId),
    open: (projectId: string) => ipcRenderer.invoke('projects:open', projectId),
  },
  
  // Plugin yönetimi
  plugins: {
    list: () => ipcRenderer.invoke('plugins:list'),
    install: (pluginName: string) => ipcRenderer.invoke('plugins:install', pluginName),
    uninstall: (pluginName: string) => ipcRenderer.invoke('plugins:uninstall', pluginName),
    enable: (pluginId: string) => ipcRenderer.invoke('plugins:enable', pluginId),
    disable: (pluginId: string) => ipcRenderer.invoke('plugins:disable', pluginId),
  },
  
  // Sistem bilgileri
  system: {
    info: () => ipcRenderer.invoke('system:info'),
  },
  
  // Ayarlar
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (settings: any) => ipcRenderer.invoke('settings:save', settings),
  },
  
  // Dosya işlemleri
  file: {
    selectDirectory: () => ipcRenderer.invoke('file:select-directory'),
    selectFile: (options?: any) => ipcRenderer.invoke('file:select-file', options),
  },

  // Event listener'lar
  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
  
  off: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Console log'ları dinle ve renderer console'a yönlendir
  setupConsoleLogs: () => {
    ipcRenderer.on('console-log', (event, level, args) => {
      switch (level) {
        case 'log':
          console.log('[Main Process]', ...args);
          break;
        case 'error':
          console.error('[Main Process]', ...args);
          break;
        case 'warn':
          console.warn('[Main Process]', ...args);
          break;
      }
    });
  },
});

// TypeScript için global type tanımları
declare global {
  interface Window {
    kovanAPI: {
      services: {
        list: () => Promise<any>;
        start: (serviceName: string) => Promise<any>;
        stop: (serviceName: string) => Promise<any>;
        status: (serviceName: string) => Promise<any>;
        download: (serviceName: string) => Promise<any>;
        install: (serviceName: string, installerPath: string) => Promise<any>;
        updatePort: (serviceName: string, newPort: number) => Promise<any>;
      };
      projects: {
        list: () => Promise<any>;
        add: (projectPath: string) => Promise<any>;
        remove: (projectId: string) => Promise<any>;
        open: (projectId: string) => Promise<any>;
      };
      plugins: {
        list: () => Promise<any>;
        install: (pluginName: string) => Promise<any>;
        uninstall: (pluginName: string) => Promise<any>;
        enable: (pluginId: string) => Promise<any>;
        disable: (pluginId: string) => Promise<any>;
      };
      system: {
        info: () => Promise<any>;
      };
      settings: {
        get: () => Promise<any>;
        save: (settings: any) => Promise<any>;
      };
      file: {
        selectDirectory: () => Promise<string | null>;
        selectFile: (options?: any) => Promise<string | null>;
      };
      on: (channel: string, callback: Function) => void;
      off: (channel: string) => void;
      setupConsoleLogs: () => void;
    };
  }
}

