"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const events_1 = require("events");
class PluginManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.plugins = new Map();
        this.loadedPlugins = new Map();
        this.configPath = path.join(os.homedir(), '.kovan', 'plugins.json');
        this.pluginsDir = path.join(os.homedir(), '.kovan', 'plugins');
        this.loadPlugins();
        this.initializePluginsDirectory();
    }
    loadPlugins() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readFileSync(this.configPath, 'utf8');
                const plugins = JSON.parse(data);
                plugins.forEach((plugin) => {
                    if (plugin.installedAt) {
                        plugin.installedAt = new Date(plugin.installedAt);
                    }
                    if (plugin.updatedAt) {
                        plugin.updatedAt = new Date(plugin.updatedAt);
                    }
                    this.plugins.set(plugin.name, plugin);
                });
            }
        }
        catch (error) {
            console.error('Pluginler yüklenirken hata:', error);
        }
    }
    savePlugins() {
        try {
            const configDir = path.dirname(this.configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            const pluginsArray = Array.from(this.plugins.values());
            fs.writeFileSync(this.configPath, JSON.stringify(pluginsArray, null, 2));
        }
        catch (error) {
            console.error('Pluginler kaydedilirken hata:', error);
        }
    }
    initializePluginsDirectory() {
        if (!fs.existsSync(this.pluginsDir)) {
            fs.mkdirSync(this.pluginsDir, { recursive: true });
        }
    }
    async installPlugin(pluginName) {
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
            const manifest = JSON.parse(manifestData);
            // Plugin'i kaydet
            const plugin = {
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
        }
        catch (error) {
            throw new Error(`Plugin yüklenirken hata: ${error.message}`);
        }
    }
    async uninstallPlugin(pluginName) {
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
        }
        catch (error) {
            throw new Error(`Plugin kaldırılırken hata: ${error.message}`);
        }
    }
    async enablePlugin(pluginName) {
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
    async disablePlugin(pluginName) {
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
    async getPlugins() {
        return Array.from(this.plugins.values());
    }
    async getPlugin(pluginName) {
        return this.plugins.get(pluginName) || null;
    }
    async updatePlugin(pluginName) {
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
            const manifest = JSON.parse(manifestData);
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
        }
        catch (error) {
            throw new Error(`Plugin güncellenirken hata: ${error.message}`);
        }
    }
    async loadAllPlugins() {
        const enabledPlugins = Array.from(this.plugins.values())
            .filter(plugin => plugin.enabled && plugin.installed);
        for (const plugin of enabledPlugins) {
            try {
                await this.loadPlugin(plugin.name);
            }
            catch (error) {
                console.error(`${plugin.name} yüklenirken hata:`, error);
            }
        }
    }
    async loadPlugin(pluginName) {
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
            const manifest = JSON.parse(manifestData);
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
                        }
                        catch (error) {
                            console.error(`Plugin hook hatası (${pluginName}.${hookFunction}):`, error);
                        }
                    }
                }
            }
            console.log(`Plugin yüklendi: ${pluginName}`);
        }
        catch (error) {
            throw new Error(`Plugin yüklenirken hata: ${error.message}`);
        }
    }
    unloadPlugin(pluginName) {
        const pluginModule = this.loadedPlugins.get(pluginName);
        if (pluginModule) {
            // Plugin cleanup işlemleri
            if (typeof pluginModule.cleanup === 'function') {
                try {
                    pluginModule.cleanup();
                }
                catch (error) {
                    console.error(`Plugin cleanup hatası (${pluginName}):`, error);
                }
            }
            this.loadedPlugins.delete(pluginName);
            console.log(`Plugin kaldırıldı: ${pluginName}`);
        }
    }
    async getPluginConfig(pluginName) {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Plugin bulunamadı: ${pluginName}`);
        }
        return plugin.config || {};
    }
    async setPluginConfig(pluginName, config) {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Plugin bulunamadı: ${pluginName}`);
        }
        plugin.config = config;
        plugin.updatedAt = new Date();
        this.savePlugins();
        this.emit('pluginConfigChanged', plugin);
    }
    async searchPlugins(query) {
        // NPM registry'den plugin arama
        // Bu kısım daha sonra implement edilecek
        return [];
    }
    async getInstalledPlugins() {
        return Array.from(this.plugins.values())
            .filter(plugin => plugin.installed);
    }
    async getEnabledPlugins() {
        return Array.from(this.plugins.values())
            .filter(plugin => plugin.enabled && plugin.installed);
    }
    async executeCommand(command, cwd) {
        return new Promise((resolve, reject) => {
            const { spawn } = require('child_process');
            const [cmd, ...args] = command.split(' ');
            const process = spawn(cmd, args, {
                cwd,
                stdio: 'inherit',
                shell: true,
            });
            process.on('close', (code) => {
                if (code === 0) {
                    resolve();
                }
                else {
                    reject(new Error(`Komut başarısız: ${command} (kod: ${code})`));
                }
            });
            process.on('error', (error) => {
                reject(new Error(`Komut hatası: ${command} - ${error.message}`));
            });
        });
    }
}
exports.PluginManager = PluginManager;
