import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import Database from 'better-sqlite3';

export interface Settings {
  id?: number;
  key: string;
  value: string;
  category: string;
  updated_at?: string;
}

export interface Project {
  id?: number;
  name: string;
  path: string;
  type: string;
  framework?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Service {
  id?: number;
  name: string;
  display_name: string;
  description: string;
  type: string;
  port?: number;
  auto_start?: boolean;
  enabled?: boolean;
  installed?: boolean;
  version?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Plugin {
  id?: number;
  name: string;
  display_name: string;
  description: string;
  version?: string;
  enabled?: boolean;
  installed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class DatabaseManager {
  private db!: Database.Database;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'kovan.db');
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    try {
      // Veritabanını oluştur veya aç
      this.db = new Database(this.dbPath);
      
      // WAL modunu etkinleştir (daha iyi performans)
      this.db.pragma('journal_mode = WAL');
      
      // Foreign key desteğini etkinleştir
      this.db.pragma('foreign_keys = ON');
      
      // Tabloları oluştur
      this.createTables();
      
      // Varsayılan verileri ekle
      this.insertDefaultData();
      
      console.log('✅ SQLite veritabanı başarıyla başlatıldı:', this.dbPath);
    } catch (error) {
      console.error('❌ Veritabanı başlatılırken hata:', error);
      throw error;
    }
  }

  private createTables(): void {
    // Settings tablosu
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        category TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Projects tablosu
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        framework TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Services tablosu
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        port INTEGER,
        auto_start BOOLEAN DEFAULT 0,
        enabled BOOLEAN DEFAULT 1,
        installed BOOLEAN DEFAULT 0,
        version TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Plugins tablosu
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS plugins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        description TEXT,
        version TEXT,
        enabled BOOLEAN DEFAULT 1,
        installed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Veritabanı tabloları oluşturuldu');
  }

  private insertDefaultData(): void {
    // Varsayılan ayarları ekle
    const defaultSettings = [
      { key: 'autoStart', value: 'false', category: 'general' },
      { key: 'startMinimized', value: 'false', category: 'general' },
      { key: 'checkUpdates', value: 'true', category: 'general' },
      { key: 'language', value: 'tr', category: 'general' },
      { key: 'theme', value: 'dark', category: 'appearance' },
      { key: 'accentColor', value: '#667eea', category: 'appearance' },
      { key: 'compactMode', value: 'false', category: 'appearance' },
      { key: 'autoStartServices', value: 'false', category: 'services' },
      { key: 'defaultProjectPath', value: '', category: 'development' },
      { key: 'autoDetectFrameworks', value: 'true', category: 'development' },
      { key: 'enableHotReload', value: 'true', category: 'development' }
    ];

    const insertSetting = this.db.prepare(`
      INSERT OR IGNORE INTO settings (key, value, category) 
      VALUES (?, ?, ?)
    `);

    for (const setting of defaultSettings) {
      insertSetting.run(setting.key, setting.value, setting.category);
    }

    // Varsayılan servisleri ekle
    const defaultServices = [
      { name: 'apache', display_name: 'Apache HTTP Server', description: 'Web sunucusu', type: 'web', port: 80 },
      { name: 'nginx', display_name: 'Nginx', description: 'Yüksek performanslı web sunucusu', type: 'web', port: 80 },
      { name: 'mysql', display_name: 'MySQL', description: 'İlişkisel veritabanı', type: 'database', port: 3306 },
      { name: 'postgresql', display_name: 'PostgreSQL', description: 'Gelişmiş ilişkisel veritabanı', type: 'database', port: 5432 },
      { name: 'redis', display_name: 'Redis', description: 'Bellek içi veri yapısı deposu', type: 'cache', port: 6379 }
    ];

    const insertService = this.db.prepare(`
      INSERT OR IGNORE INTO services (name, display_name, description, type, port) 
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const service of defaultServices) {
      insertService.run(service.name, service.display_name, service.description, service.type, service.port);
    }

    console.log('✅ Varsayılan veriler eklendi');
  }

  // Settings işlemleri
  getSettings(): Record<string, any> {
    const stmt = this.db.prepare('SELECT * FROM settings');
    const settings = stmt.all() as Settings[];
    
    const result: Record<string, any> = {
      general: {},
      appearance: {},
      services: {},
      development: {}
    };

    for (const setting of settings) {
      if (setting.category === 'general') {
        result.general[setting.key] = this.parseValue(setting.value);
      } else if (setting.category === 'appearance') {
        result.appearance[setting.key] = this.parseValue(setting.value);
      } else if (setting.category === 'services') {
        result.services[setting.key] = this.parseValue(setting.value);
      } else if (setting.category === 'development') {
        result.development[setting.key] = this.parseValue(setting.value);
      }
    }

    return result;
  }

  saveSettings(settings: Record<string, any>): boolean {
    const transaction = this.db.transaction(() => {
      const updateStmt = this.db.prepare(`
        UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE key = ? AND category = ?
      `);

      const insertStmt = this.db.prepare(`
        INSERT OR REPLACE INTO settings (key, value, category, updated_at) 
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `);

      // General settings
      for (const [key, value] of Object.entries(settings.general || {})) {
        insertStmt.run(key, this.stringifyValue(value), 'general');
      }

      // Appearance settings
      for (const [key, value] of Object.entries(settings.appearance || {})) {
        insertStmt.run(key, this.stringifyValue(value), 'appearance');
      }

      // Services settings
      for (const [key, value] of Object.entries(settings.services || {})) {
        insertStmt.run(key, this.stringifyValue(value), 'services');
      }

      // Development settings
      for (const [key, value] of Object.entries(settings.development || {})) {
        insertStmt.run(key, this.stringifyValue(value), 'development');
      }
    });

    try {
      transaction();
      return true;
    } catch (error) {
      console.error('❌ Ayarlar kaydedilirken hata:', error);
      return false;
    }
  }

  // Projects işlemleri
  getProjects(): Project[] {
    const stmt = this.db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
    return stmt.all() as Project[];
  }

  addProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): boolean {
    const stmt = this.db.prepare(`
      INSERT INTO projects (name, path, type, framework) 
      VALUES (?, ?, ?, ?)
    `);

    try {
      stmt.run(project.name, project.path, project.type, project.framework);
      return true;
    } catch (error) {
      console.error('❌ Proje eklenirken hata:', error);
      return false;
    }
  }

  removeProject(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
    
    try {
      stmt.run(id);
      return true;
    } catch (error) {
      console.error('❌ Proje silinirken hata:', error);
      return false;
    }
  }

  // Services işlemleri
  getServices(): Service[] {
    const stmt = this.db.prepare('SELECT * FROM services ORDER BY name');
    return stmt.all() as Service[];
  }

  updateService(service: Partial<Service> & { name: string }): boolean {
    const stmt = this.db.prepare(`
      UPDATE services SET 
        display_name = COALESCE(?, display_name),
        description = COALESCE(?, description),
        type = COALESCE(?, type),
        port = COALESCE(?, port),
        auto_start = COALESCE(?, auto_start),
        enabled = COALESCE(?, enabled),
        installed = COALESCE(?, installed),
        version = COALESCE(?, version),
        updated_at = CURRENT_TIMESTAMP
      WHERE name = ?
    `);

    try {
      stmt.run(
        service.display_name,
        service.description,
        service.type,
        service.port,
        service.auto_start,
        service.enabled,
        service.installed,
        service.version,
        service.name
      );
      return true;
    } catch (error) {
      console.error('❌ Servis güncellenirken hata:', error);
      return false;
    }
  }

  // Plugins işlemleri
  getPlugins(): Plugin[] {
    const stmt = this.db.prepare('SELECT * FROM plugins ORDER BY name');
    return stmt.all() as Plugin[];
  }

  updatePlugin(plugin: Partial<Plugin> & { name: string }): boolean {
    const stmt = this.db.prepare(`
      UPDATE plugins SET 
        display_name = COALESCE(?, display_name),
        description = COALESCE(?, description),
        version = COALESCE(?, version),
        enabled = COALESCE(?, enabled),
        installed = COALESCE(?, installed),
        updated_at = CURRENT_TIMESTAMP
      WHERE name = ?
    `);

    try {
      stmt.run(
        plugin.display_name,
        plugin.description,
        plugin.version,
        plugin.enabled,
        plugin.installed,
        plugin.name
      );
      return true;
    } catch (error) {
      console.error('❌ Plugin güncellenirken hata:', error);
      return false;
    }
  }

  // Yardımcı fonksiyonlar
  private parseValue(value: string): any {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(Number(value))) return Number(value);
    return value;
  }

  private stringifyValue(value: any): string {
    return String(value);
  }

  // Veritabanını kapat
  close(): void {
    if (this.db) {
      this.db.close();
      console.log('✅ Veritabanı bağlantısı kapatıldı');
    }
  }

  // Backup oluştur
  backup(backupPath: string): boolean {
    try {
      this.db.backup(backupPath);
      console.log('✅ Veritabanı yedeklendi:', backupPath);
      return true;
    } catch (error) {
      console.error('❌ Yedekleme hatası:', error);
      return false;
    }
  }
}
