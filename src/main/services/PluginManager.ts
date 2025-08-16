import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  enabled: boolean;
  installed: boolean;
  category: string;
  icon?: string;
  dependencies?: string[];
  settings?: any;
  path?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private configPath: string;
  private pluginsDir: string;

  constructor() {
    this.configPath = path.join(os.homedir(), '.kovan', 'plugins.json');
    this.pluginsDir = path.join(os.homedir(), '.kovan', 'plugins');
    this.loadPlugins();
    this.initializeDefaultPlugins();
  }

  private loadPlugins(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const plugins = JSON.parse(data);
        plugins.forEach((plugin: Plugin) => {
          this.plugins.set(plugin.id, plugin);
        });
      }
    } catch (error) {
      console.error('Eklentiler yüklenirken hata:', error);
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
      console.error('Eklentiler kaydedilirken hata:', error);
    }
  }

  private initializeDefaultPlugins(): void {
    const defaultPlugins: Plugin[] = [
      {
        id: 'database-manager',
        name: 'Database Manager',
        description: 'Veritabanı yönetimi için gelişmiş arayüz',
        version: '1.2.0',
        author: 'Kovan Team',
        enabled: true,
        installed: true,
        category: 'database',
        icon: '🗄️',
        dependencies: ['mysql', 'postgresql'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'code-editor',
        name: 'Code Editor',
        description: 'Entegre kod editörü ve syntax highlighting',
        version: '2.1.0',
        author: 'Kovan Team',
        enabled: true,
        installed: true,
        category: 'development',
        icon: '📝',
        dependencies: ['nodejs'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'system-monitor',
        name: 'System Monitor',
        description: 'Sistem kaynaklarını gerçek zamanlı izleme',
        version: '1.0.5',
        author: 'Kovan Team',
        enabled: false,
        installed: true,
        category: 'monitoring',
        icon: '📊',
        dependencies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'ssl-manager',
        name: 'SSL Manager',
        description: 'SSL sertifikalarını otomatik yönetme',
        version: '1.3.2',
        author: 'Kovan Team',
        enabled: false,
        installed: false,
        category: 'security',
        icon: '🔒',
        dependencies: ['apache', 'nginx'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'backup-manager',
        name: 'Backup Manager',
        description: 'Proje ve veritabanı yedekleme sistemi',
        version: '1.1.0',
        author: 'Kovan Team',
        enabled: true,
        installed: true,
        category: 'utility',
        icon: '💾',
        dependencies: ['mysql', 'postgresql'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Sadece yeni eklentileri ekle
    defaultPlugins.forEach(plugin => {
      if (!this.plugins.has(plugin.id)) {
        this.plugins.set(plugin.id, plugin);
      }
    });

    this.savePlugins();
  }

  async getPlugins(): Promise<Plugin[]> {
    return Array.from(this.plugins.values());
  }

  async installPlugin(pluginName: string): Promise<Plugin> {
    // Eğer plugin zaten yüklüyse
    const existingPlugin = Array.from(this.plugins.values()).find(p => p.name === pluginName);
    if (existingPlugin && existingPlugin.installed) {
      throw new Error('Eklenti zaten yüklü');
    }

    try {
      // Plugin dizinini oluştur
      if (!fs.existsSync(this.pluginsDir)) {
        fs.mkdirSync(this.pluginsDir, { recursive: true });
      }

      // Plugin'i indir ve yükle (basit implementasyon)
      const pluginPath = path.join(this.pluginsDir, pluginName);
      
      // Mock plugin yükleme
      const plugin: Plugin = {
        id: this.generateId(),
        name: pluginName,
        description: 'Yeni yüklenen eklenti',
        version: '1.0.0',
        author: 'Kovan Team',
        enabled: false,
        installed: true,
        category: 'utility',
        icon: '🔌',
        dependencies: [],
        path: pluginPath,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.plugins.set(plugin.id, plugin);
      this.savePlugins();

      return plugin;
    } catch (error) {
      throw new Error(`Eklenti yüklenirken hata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async uninstallPlugin(pluginName: string): Promise<void> {
    const plugin = Array.from(this.plugins.values()).find(p => p.name === pluginName);
    if (!plugin) {
      throw new Error('Eklenti bulunamadı');
    }

    if (!plugin.installed) {
      throw new Error('Eklenti zaten yüklü değil');
    }

    try {
      // Plugin dosyalarını sil
      if (plugin.path && fs.existsSync(plugin.path)) {
        fs.rmSync(plugin.path, { recursive: true, force: true });
      }

      // Plugin'i listeden kaldır
      this.plugins.delete(plugin.id);
      this.savePlugins();
    } catch (error) {
      throw new Error(`Eklenti kaldırılırken hata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error('Eklenti bulunamadı');
    }

    if (!plugin.installed) {
      throw new Error('Eklenti yüklü değil');
    }

    plugin.enabled = true;
    plugin.updatedAt = new Date();
    this.savePlugins();
  }

  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error('Eklenti bulunamadı');
    }

    plugin.enabled = false;
    plugin.updatedAt = new Date();
    this.savePlugins();
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

