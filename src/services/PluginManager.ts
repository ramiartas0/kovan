import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EventEmitter } from 'events';

export interface Plugin {
  name: string;
  displayName: string;
  description: string;
  version: string;
  author: string;
  homepage?: string;
  repository?: string;
  license?: string;
  dependencies?: string[];
  enabled: boolean;
  installed: boolean;
  installedAt?: Date;
  updatedAt?: Date;
  config?: any;
}

export interface PluginManifest {
  name: string;
  displayName: string;
  description: string;
  version: string;
  author: string;
  homepage?: string;
  repository?: string;
  license?: string;
  dependencies?: string[];
  main: string;
  hooks?: {
    [key: string]: string;
  };
}

export class PluginManager extends EventEmitter {
  private plugins: Map<string, Plugin> = new Map();
  private configPath: string;
  private pluginsDir: string;
  private loadedPlugins: Map<string, any> = new Map();

  constructor() {
    super();
    this.configPath = path.join(os.homedir(), '.kovan', 'plugins.json');
    this.pluginsDir = path.join(os.homedir(), '.kovan', 'plugins');
    this.loadPlugins();
    this.initializePluginsDirectory();
  }

  private loadPlugins(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const plugins = JSON.parse(data);
        plugins.forEach((plugin: Plugin) => {
          if (plugin.installedAt) {
            plugin.installedAt = new Date(plugin.installedAt);
          }
          if (plugin.updatedAt) {
            plugin.updatedAt = new Date(plugin.updatedAt);
          }
          this.plugins.set(plugin.name, plugin);
        });
      }
    } catch (error) {
      console.error('Pluginler yüklenirken hata:', error);
    }
  }

  private savePlugins(): void {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      const pluginsArray = Array.from(this.plugins.values());
      fs.writeFileSync(this.configPath, JSON.stringify(pluginsArray, null, 2));
    } catch (error) {
      console.error('Pluginler kaydedilirken hata:', error);
    }
  }

  private initializePluginsDirectory(): void {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
    }
  }

  async installPlugin(pluginName: string): Promise<Plugin> {
    // NPM'den plugin'i yükle
    const pluginPath = path.join(this.pluginsDir, pluginName);
    
    try {
      // Plugin dizinini oluştur
      if (!fs.existsSync(pluginPath)) {
        fs.mkdirSync(pluginPath, { recursive: true });
      }

      // NPM install komutunu çalıştır
      await this.executeCommand(`npm install ${pluginName}`, pluginPath);

      // Plugin manifest'ini oku
      const manifestPath = path.join(pluginPath, 'node_modules', pluginName, 'package.json');
      if (!fs.existsSync(manifestPath)) {
        throw new Error(`Plugin manifest dosyası bulunamadı: ${manifestPath}`);
      }

      const manifestData = fs.readFileSync(manifestPath, 'utf8');
      const manifest: PluginManifest = JSON.parse(manifestData);

      // Plugin'i kaydet
      const plugin: Plugin = {
        name: manifest.name,
        displayName: manifest.displayName || manifest.name,
        description: manifest.description || '',
        version: manifest.version,
        author: manifest.author,
        homepage: manifest.homepage,
        repository: manifest.repository,
        license: manifest.license,
        dependencies: manifest.dependencies,
        enabled: true,
        installed: true,
        installedAt: new Date(),
        updatedAt: new Date(),
      };

      this.plugins.set(plugin.name, plugin);
      this.savePlugins();

      // Plugin'i yükle
      await this.loadPlugin(plugin.name);

      this.emit('pluginInstalled', plugin);
      return plugin;
    } catch (error) {
      throw new Error(`Plugin yüklenirken hata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async uninstallPlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin bulunamadı: ${pluginName}`);
    }

    try {
      // Plugin'i devre dışı bırak
      await this.disablePlugin(pluginName);

      // Plugin dosyalarını sil
      const pluginPath = path.join(this.pluginsDir, pluginName);
      if (fs.existsSync(pluginPath)) {
        fs.rmSync(pluginPath, { recursive: true, force: true });
      }

      // Plugin'i listeden kaldır
      this.plugins.delete(pluginName);
      this.loadedPlugins.delete(pluginName);
      this.savePlugins();

      this.emit('pluginUninstalled', plugin);
    } catch (error) {
      throw new Error(`Plugin kaldırılırken hata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async enablePlugin(pluginName: string): Promise<Plugin> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin bulunamadı: ${pluginName}`);
    }

    if (!plugin.installed) {
      throw new Error(`Plugin yüklü değil: ${pluginName}`);
    }

    plugin.enabled = true;
    plugin.updatedAt = new Date();
    this.savePlugins();

    // Plugin'i yükle
    await this.loadPlugin(pluginName);

    this.emit('pluginEnabled', plugin);
    return plugin;
  }

  async disablePlugin(pluginName: string): Promise<Plugin> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin bulunamadı: ${pluginName}`);
    }

    plugin.enabled = false;
    plugin.updatedAt = new Date();
    this.savePlugins();

    // Plugin'i kaldır
    this.unloadPlugin(pluginName);

    this.emit('pluginDisabled', plugin);
    return plugin;
  }

  async getPlugins(): Promise<Plugin[]> {
    return Array.from(this.plugins.values());
  }

  async getPlugin(pluginName: string): Promise<Plugin | null> {
    return this.plugins.get(pluginName) || null;
  }

  async updatePlugin(pluginName: string): Promise<Plugin> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin bulunamadı: ${pluginName}`);
    }

    try {
      // Plugin'i güncelle
      const pluginPath = path.join(this.pluginsDir, pluginName);
      await this.executeCommand(`npm update ${pluginName}`, pluginPath);

      // Manifest'i yeniden oku
      const manifestPath = path.join(pluginPath, 'node_modules', pluginName, 'package.json');
      const manifestData = fs.readFileSync(manifestPath, 'utf8');
      const manifest: PluginManifest = JSON.parse(manifestData);

      // Plugin bilgilerini güncelle
      plugin.version = manifest.version;
      plugin.updatedAt = new Date();
      this.savePlugins();

      // Plugin'i yeniden yükle
      if (plugin.enabled) {
        await this.loadPlugin(pluginName);
      }

      this.emit('pluginUpdated', plugin);
      return plugin;
    } catch (error) {
      throw new Error(`Plugin güncellenirken hata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async loadAllPlugins(): Promise<void> {
    const enabledPlugins = Array.from(this.plugins.values())
      .filter(plugin => plugin.enabled && plugin.installed);

    for (const plugin of enabledPlugins) {
      try {
        await this.loadPlugin(plugin.name);
      } catch (error) {
        console.error(`${plugin.name} yüklenirken hata:`, error);
      }
    }
  }

  private async loadPlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin bulunamadı: ${pluginName}`);
    }

    try {
      const pluginPath = path.join(this.pluginsDir, pluginName, 'node_modules', pluginName);
      const manifestPath = path.join(pluginPath, 'package.json');
      
      if (!fs.existsSync(manifestPath)) {
        throw new Error(`Plugin manifest dosyası bulunamadı: ${manifestPath}`);
      }

      const manifestData = fs.readFileSync(manifestPath, 'utf8');
      const manifest: PluginManifest = JSON.parse(manifestData);

      // Plugin modülünü yükle
      const mainPath = path.join(pluginPath, manifest.main);
      if (!fs.existsSync(mainPath)) {
        throw new Error(`Plugin main dosyası bulunamadı: ${mainPath}`);
      }

      // Plugin'i require et (Node.js modül sistemi)
      const pluginModule = require(mainPath);
      this.loadedPlugins.set(pluginName, pluginModule);

      // Plugin hooks'larını çalıştır
      if (manifest.hooks) {
        for (const [hookName, hookFunction] of Object.entries(manifest.hooks)) {
          if (typeof pluginModule[hookFunction] === 'function') {
            try {
              await pluginModule[hookFunction]();
            } catch (error) {
              console.error(`Plugin hook hatası (${pluginName}.${hookFunction}):`, error);
            }
          }
        }
      }

      console.log(`Plugin yüklendi: ${pluginName}`);
    } catch (error) {
      throw new Error(`Plugin yüklenirken hata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private unloadPlugin(pluginName: string): void {
    const pluginModule = this.loadedPlugins.get(pluginName);
    if (pluginModule) {
      // Plugin cleanup işlemleri
      if (typeof pluginModule.cleanup === 'function') {
        try {
          pluginModule.cleanup();
        } catch (error) {
          console.error(`Plugin cleanup hatası (${pluginName}):`, error);
        }
      }

      this.loadedPlugins.delete(pluginName);
      console.log(`Plugin kaldırıldı: ${pluginName}`);
    }
  }

  async getPluginConfig(pluginName: string): Promise<any> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin bulunamadı: ${pluginName}`);
    }

    return plugin.config || {};
  }

  async setPluginConfig(pluginName: string, config: any): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin bulunamadı: ${pluginName}`);
    }

    plugin.config = config;
    plugin.updatedAt = new Date();
    this.savePlugins();

    this.emit('pluginConfigChanged', plugin);
  }

  async searchPlugins(query: string): Promise<Plugin[]> {
    // NPM registry'den plugin arama
    // Bu kısım daha sonra implement edilecek
    return [];
  }

  async getInstalledPlugins(): Promise<Plugin[]> {
    return Array.from(this.plugins.values())
      .filter(plugin => plugin.installed);
  }

  async getEnabledPlugins(): Promise<Plugin[]> {
    return Array.from(this.plugins.values())
      .filter(plugin => plugin.enabled && plugin.installed);
  }

  private async executeCommand(command: string, cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const [cmd, ...args] = command.split(' ');
      
      const process = spawn(cmd, args, {
        cwd,
        stdio: 'inherit',
        shell: true,
      });

      process.on('close', (code: number) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Komut başarısız: ${command} (kod: ${code})`));
        }
      });

      process.on('error', (error: Error) => {
        reject(new Error(`Komut hatası: ${command} - ${error.message}`));
      });
    });
  }
}

