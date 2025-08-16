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
exports.ServiceManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
const events_1 = require("events");
class ServiceManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.services = new Map();
        this.processes = new Map();
        this.status = new Map();
        this.configPath = path.join(os.homedir(), '.kovan', 'services.json');
        this.loadServices();
        this.initializeDefaultServices();
    }
    loadServices() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readFileSync(this.configPath, 'utf8');
                const services = JSON.parse(data);
                services.forEach((service) => {
                    this.services.set(service.name, service);
                    this.status.set(service.name, {
                        name: service.name,
                        status: 'stopped',
                    });
                });
            }
        }
        catch (error) {
            console.error('Servisler yüklenirken hata:', error);
        }
    }
    saveServices() {
        try {
            const servicesDir = path.dirname(this.configPath);
            if (!fs.existsSync(servicesDir)) {
                fs.mkdirSync(servicesDir, { recursive: true });
            }
            const servicesArray = Array.from(this.services.values());
            fs.writeFileSync(this.configPath, JSON.stringify(servicesArray, null, 2));
        }
        catch (error) {
            console.error('Servisler kaydedilirken hata:', error);
        }
    }
    initializeDefaultServices() {
        const defaultServices = [
            {
                name: 'apache',
                displayName: 'Apache',
                description: 'Apache HTTP Server',
                type: 'web',
                executable: 'httpd',
                port: 80,
                configPath: path.join(os.homedir(), '.kovan', 'apache', 'httpd.conf'),
                autoStart: true,
                enabled: true,
            },
            {
                name: 'nginx',
                displayName: 'Nginx',
                description: 'Nginx Web Server',
                type: 'web',
                executable: 'nginx',
                port: 80,
                configPath: path.join(os.homedir(), '.kovan', 'nginx', 'nginx.conf'),
                autoStart: false,
                enabled: true,
            },
            {
                name: 'mysql',
                displayName: 'MySQL',
                description: 'MySQL Database Server',
                type: 'database',
                executable: 'mysqld',
                port: 3306,
                dataPath: path.join(os.homedir(), '.kovan', 'mysql', 'data'),
                logPath: path.join(os.homedir(), '.kovan', 'mysql', 'logs'),
                autoStart: true,
                enabled: true,
            },
            {
                name: 'mariadb',
                displayName: 'MariaDB',
                description: 'MariaDB Database Server',
                type: 'database',
                executable: 'mariadbd',
                port: 3306,
                dataPath: path.join(os.homedir(), '.kovan', 'mariadb', 'data'),
                logPath: path.join(os.homedir(), '.kovan', 'mariadb', 'logs'),
                autoStart: false,
                enabled: true,
            },
            {
                name: 'postgresql',
                displayName: 'PostgreSQL',
                description: 'PostgreSQL Database Server',
                type: 'database',
                executable: 'postgres',
                port: 5432,
                dataPath: path.join(os.homedir(), '.kovan', 'postgresql', 'data'),
                logPath: path.join(os.homedir(), '.kovan', 'postgresql', 'logs'),
                autoStart: false,
                enabled: true,
            },
            {
                name: 'redis',
                displayName: 'Redis',
                description: 'Redis Cache Server',
                type: 'cache',
                executable: 'redis-server',
                port: 6379,
                configPath: path.join(os.homedir(), '.kovan', 'redis', 'redis.conf'),
                autoStart: false,
                enabled: true,
            },
            {
                name: 'memcached',
                displayName: 'Memcached',
                description: 'Memcached Cache Server',
                type: 'cache',
                executable: 'memcached',
                port: 11211,
                autoStart: false,
                enabled: true,
            },
        ];
        // Varsayılan servisleri ekle (eğer yoksa)
        defaultServices.forEach(service => {
            if (!this.services.has(service.name)) {
                this.services.set(service.name, service);
                this.status.set(service.name, {
                    name: service.name,
                    status: 'stopped',
                });
            }
        });
        this.saveServices();
    }
    async startService(serviceName) {
        const service = this.services.get(serviceName);
        if (!service) {
            throw new Error(`Servis bulunamadı: ${serviceName}`);
        }
        if (this.processes.has(serviceName)) {
            throw new Error(`Servis zaten çalışıyor: ${serviceName}`);
        }
        try {
            // Servis durumunu güncelle
            this.updateServiceStatus(serviceName, 'starting');
            // Servis dizinlerini oluştur
            await this.createServiceDirectories(service);
            // Servisi başlat
            const process = this.spawnService(service);
            this.processes.set(serviceName, process);
            // Process event'lerini dinle
            process.on('error', (error) => {
                console.error(`Servis hatası (${serviceName}):`, error);
                this.updateServiceStatus(serviceName, 'error', error.message);
                this.processes.delete(serviceName);
            });
            process.on('exit', (code, signal) => {
                console.log(`Servis çıktı (${serviceName}):`, code, signal);
                this.updateServiceStatus(serviceName, 'stopped');
                this.processes.delete(serviceName);
            });
            // Servisin başlamasını bekle
            await this.waitForServiceStart(service);
            return this.getServiceStatus(serviceName);
        }
        catch (error) {
            this.updateServiceStatus(serviceName, 'error', error.message);
            throw error;
        }
    }
    async stopService(serviceName) {
        const process = this.processes.get(serviceName);
        if (!process) {
            throw new Error(`Servis çalışmıyor: ${serviceName}`);
        }
        try {
            this.updateServiceStatus(serviceName, 'stopping');
            // Graceful shutdown için SIGTERM gönder
            process.kill('SIGTERM');
            // 5 saniye bekle
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Servis durdurma zaman aşımı'));
                }, 5000);
                process.once('exit', () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
            this.processes.delete(serviceName);
            this.updateServiceStatus(serviceName, 'stopped');
            return this.getServiceStatus(serviceName);
        }
        catch (error) {
            // Force kill
            process.kill('SIGKILL');
            this.processes.delete(serviceName);
            this.updateServiceStatus(serviceName, 'stopped');
            throw error;
        }
    }
    async getServiceStatus(serviceName) {
        const status = this.status.get(serviceName);
        if (!status) {
            throw new Error(`Servis bulunamadı: ${serviceName}`);
        }
        // Çalışan servisler için ek bilgileri güncelle
        if (status.status === 'running') {
            const process = this.processes.get(serviceName);
            if (process) {
                status.pid = process.pid;
                // CPU ve memory kullanımını al (platform specific)
                // Bu kısım daha sonra implement edilecek
            }
        }
        return status;
    }
    async getAllServices() {
        return Array.from(this.services.values());
    }
    async startAllServices() {
        const autoStartServices = Array.from(this.services.values())
            .filter(service => service.autoStart && service.enabled);
        for (const service of autoStartServices) {
            try {
                await this.startService(service.name);
            }
            catch (error) {
                console.error(`${service.name} başlatılırken hata:`, error);
            }
        }
    }
    async stopAllServices() {
        const runningServices = Array.from(this.processes.keys());
        for (const serviceName of runningServices) {
            try {
                await this.stopService(serviceName);
            }
            catch (error) {
                console.error(`${serviceName} durdurulurken hata:`, error);
            }
        }
    }
    spawnService(service) {
        const args = service.args || [];
        const env = { ...process.env };
        // Servis-specific environment variables
        if (service.name === 'mysql' || service.name === 'mariadb') {
            env.MYSQL_HOME = path.dirname(service.dataPath);
        }
        return (0, child_process_1.spawn)(service.executable, args, {
            env,
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: false,
        });
    }
    async createServiceDirectories(service) {
        const directories = [];
        if (service.configPath) {
            directories.push(path.dirname(service.configPath));
        }
        if (service.dataPath) {
            directories.push(service.dataPath);
        }
        if (service.logPath) {
            directories.push(service.logPath);
        }
        for (const dir of directories) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }
    async waitForServiceStart(service) {
        // Basit bir bekleme mekanizması
        // Gerçek uygulamada port kontrolü yapılmalı
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.updateServiceStatus(service.name, 'running');
    }
    updateServiceStatus(serviceName, status, error) {
        const currentStatus = this.status.get(serviceName);
        if (currentStatus) {
            currentStatus.status = status;
            if (error) {
                currentStatus.lastError = error;
            }
            this.emit('serviceStatusChanged', currentStatus);
        }
    }
}
exports.ServiceManager = ServiceManager;
