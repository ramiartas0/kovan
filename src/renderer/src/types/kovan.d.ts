declare global {
  interface Window {
    kovanAPI: {
      // Servis yönetimi
      services: {
        list(): Promise<any[]>;
        start(serviceName: string): Promise<any>;
        stop(serviceName: string): Promise<any>;
        status(serviceName: string): Promise<any>;
        download(serviceName: string): Promise<any>;
        install(serviceName: string, installerPath: string): Promise<any>;
        updatePort(serviceName: string, newPort: number): Promise<any>;
      };
      
      // Proje yönetimi
      projects: {
        list(): Promise<any[]>;
        add(projectPath: string): Promise<any>;
        remove(projectId: string): Promise<any>;
        open(projectId: string): Promise<any>;
      };
      
      // Plugin yönetimi
      plugins: {
        list(): Promise<any[]>;
        install(pluginName: string): Promise<any>;
        uninstall(pluginName: string): Promise<any>;
        enable(pluginId: string): Promise<any>;
        disable(pluginId: string): Promise<any>;
      };
      
      // Sistem bilgileri
      system: {
        info(): Promise<any>;
      };
      
      // Ayarlar
      settings: {
        get(): Promise<any>;
        save(settings: any): Promise<any>;
      };
      
      // Dosya işlemleri
      file: {
        selectDirectory(): Promise<string | null>;
        selectFile(options?: any): Promise<string | null>;
      };

      // Event listener'lar
      on(channel: string, callback: Function): void;
      off(channel: string): void;
      setupConsoleLogs(): void;
    };
  }
}

export {};
