export interface KovanAPI {
  services: {
    list: () => Promise<any[]>;
    installed: () => Promise<any[]>;
    start: (serviceName: string) => Promise<any>;
    stop: (serviceName: string) => Promise<any>;
    status: (serviceName: string) => Promise<any>;
    download: (serviceName: string) => Promise<any>;
    install: (serviceName: string, installerPath: string) => Promise<any>;
    updatePort: (serviceName: string, newPort: number) => Promise<any>;
  };
  projects: {
    list: () => Promise<any[]>;
    add: (projectPath: string) => Promise<any>;
    remove: (projectId: string) => Promise<any>;
    open: (projectId: string) => Promise<any>;
    templates: () => Promise<any[]>;
    createFromTemplate: (templateId: string, projectName: string, projectPath: string) => Promise<any>;
  };
  plugins: {
    list: () => Promise<any[]>;
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
    save: (settings: any) => Promise<{ success: boolean; error?: string }>;
  };
  database: {
    backup: (backupPath: string) => Promise<{ success: boolean; error?: string }>;
  };
  file: {
    selectDirectory: () => Promise<string | null>;
    selectFile: (options?: any) => Promise<string | null>;
  };
  window: {
    minimize: () => Promise<any>;
    maximize: () => Promise<any>;
    close: () => Promise<any>;
  };
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string) => void;
  setupConsoleLogs: () => void;
}

declare global {
  interface Window {
    kovanAPI: KovanAPI;
  }
  
  // Vite tarafından tanımlanan global değişkenler
  const __APP_VERSION__: string;
  const __APP_NAME__: string;
  const __APP_DESCRIPTION__: string;
}
