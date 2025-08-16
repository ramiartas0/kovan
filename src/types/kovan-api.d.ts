declare global {
  interface Window {
    kovanAPI: {
      services: {
        list(): Promise<Service[]>;
        installed(): Promise<Service[]>;
        start(serviceName: string): Promise<ServiceStatus>;
        stop(serviceName: string): Promise<ServiceStatus>;
        status(serviceName: string): Promise<ServiceStatus>;
        download(serviceName: string): Promise<{ success: boolean; message: string }>;
        install(serviceName: string, installerPath: string): Promise<{ success: boolean; message: string }>;
      };
      projects: {
        list(): Promise<Project[]>;
        add(projectPath: string): Promise<Project>;
        remove(projectId: string): Promise<void>;
        open(projectId: string): Promise<void>;
        templates(): Promise<ProjectTemplate[]>;
        createFromTemplate(templateId: string, projectName: string, projectPath: string): Promise<Project>;
      };
      plugins: {
        list(): Promise<Plugin[]>;
        install(pluginName: string): Promise<void>;
        uninstall(pluginName: string): Promise<void>;
        enable(pluginId: string): Promise<void>;
        disable(pluginId: string): Promise<void>;
      };
      system: {
        info(): Promise<SystemInfo>;
      };
      settings: {
        get(): Promise<Settings>;
        save(settings: Settings): Promise<{ success: boolean; error?: string }>;
      };
      file: {
        selectDirectory(): Promise<string | null>;
        selectFile(options?: { filters?: any[] }): Promise<string | null>;
      };
      window: {
        minimize(): Promise<any>;
        maximize(): Promise<any>;
        close(): Promise<any>;
      };
      on(channel: string, callback: Function): void;
      off(channel: string): void;
      setupConsoleLogs(): void;
    };
  }
}

interface Service {
  name: string;
  displayName: string;
  description: string;
  type: 'web' | 'database' | 'cache' | 'other';
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
  port?: number;
  enabled?: boolean;
  installed?: boolean;
  downloadUrl?: string;
  version?: string;
}

interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
  pid?: number;
  port?: number;
  memory?: number;
  cpu?: number;
  uptime?: number;
  lastError?: string;
}

interface Project {
  id: string;
  name: string;
  path: string;
  type: string;
  framework?: string;
  description?: string;
  url?: string;
  port?: number;
  lastOpened?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  framework: string;
  gitUrl?: string;
  commands?: string[];
  port: number;
}

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: string;
  icon: string;
  enabled: boolean;
  settings?: any;
  path: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SystemInfo {
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
  platform: string;
  arch: string;
  version: string;
  nodeVersion: string;
  electronVersion: string;
}

interface Settings {
  general: {
    autoStart: boolean;
    startMinimized: boolean;
    checkUpdates: boolean;
    language: string;
  };
  services: {
    autoStartServices: boolean;
    defaultPorts: {
      apache: number;
      nginx: number;
      mysql: number;
      postgresql: number;
      redis: number;
    };
  };
  appearance: {
    theme: string;
    accentColor: string;
    compactMode: boolean;
  };
  development: {
    defaultProjectPath: string;
    autoDetectFrameworks: boolean;
    enableHotReload: boolean;
  };
}

export {};
