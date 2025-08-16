import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import AdmZip from 'adm-zip';

export interface ServiceConfig {
  name: string;
  displayName: string;
  description: string;
  type: 'web' | 'database' | 'cache' | 'other';
  executable: string;
  args?: string[];
  port?: number;
  configPath?: string;
  dataPath?: string;
  logPath?: string;
  autoStart?: boolean;
  enabled?: boolean;
  installed?: boolean;
  downloadUrl?: string;
  version?: string;
}

export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
  pid?: number;
  port?: number;
  memory?: number;
  cpu?: number;
  uptime?: number;
  lastError?: string;
}

export class ServiceManager extends EventEmitter {
  private services: Map<string, ServiceConfig> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private status: Map<string, ServiceStatus> = new Map();
  private configPath: string;
  private portCache: Map<number, { inUse: boolean; timestamp: number }> = new Map();
  private readonly PORT_CACHE_DURATION = 5000; // 5 saniye cache süresi
  private lastStatusCheck: Map<string, number> = new Map(); // Son durum kontrol zamanı
  private readonly STATUS_CHECK_INTERVAL = 5000; // 5 saniye durum kontrol aralığı

  constructor() {
    super();
    this.configPath = path.join(os.homedir(), '.kovan', 'services.json');
    this.loadServices();
    this.initializeDefaultServices();
  }

  private loadServices(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const services = JSON.parse(data);
        services.forEach((service: ServiceConfig) => {
          this.services.set(service.name, service);
          this.status.set(service.name, {
            name: service.name,
            status: 'stopped',
          });
        });
      }
    } catch (error) {
      console.error('Servisler yüklenirken hata:', error);
    }
  }

  private saveServices(): void {
    try {
      const servicesDir = path.dirname(this.configPath);
      if (!fs.existsSync(servicesDir)) {
        fs.mkdirSync(servicesDir, { recursive: true });
      }
      
      const servicesArray = Array.from(this.services.values());
      fs.writeFileSync(this.configPath, JSON.stringify(servicesArray, null, 2));
    } catch (error) {
      console.error('Servisler kaydedilirken hata:', error);
    }
  }

  private initializeDefaultServices(): void {
    const defaultServices: ServiceConfig[] = [
                     {
          name: 'apache',
          displayName: 'Apache',
          description: 'Apache HTTP Server',
          type: 'web',
          executable: process.platform === 'win32' ? 'httpd.exe' : 'httpd',
          port: 8080,
          configPath: 'C:/kovan/Apache24/conf/httpd.conf',
          autoStart: true,
          enabled: true,
          installed: false,
          downloadUrl: 'https://httpd.apache.org/download.cgi',
          version: '2.4.57',
        },
      {
        name: 'nginx',
        displayName: 'Nginx',
        description: 'Nginx Web Server',
        type: 'web',
        executable: process.platform === 'win32' ? 'nginx.exe' : 'nginx',
        port: 80,
        configPath: path.join(os.homedir(), '.kovan', 'nginx', 'nginx.conf'),
        autoStart: false,
        enabled: true,
        installed: false,
        downloadUrl: 'https://nginx.org/en/download.html',
        version: '1.24.0',
      },
      {
        name: 'mysql',
        displayName: 'MySQL',
        description: 'MySQL Database Server',
        type: 'database',
        executable: process.platform === 'win32' ? 'mysqld.exe' : 'mysqld',
        port: 3306,
        dataPath: path.join(os.homedir(), '.kovan', 'mysql', 'data'),
        logPath: path.join(os.homedir(), '.kovan', 'mysql', 'logs'),
        autoStart: true,
        enabled: true,
        installed: false,
        downloadUrl: 'https://dev.mysql.com/downloads/mysql/',
        version: '8.0.35',
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
        executable: process.platform === 'win32' ? 'redis-server.exe' : 'redis-server',
        port: 6379,
        configPath: path.join(os.homedir(), '.kovan', 'redis', 'redis.conf'),
        autoStart: false,
        enabled: true,
        installed: false,
        downloadUrl: 'https://redis.io/download',
        version: '7.2.4',
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

  async getAllServices(): Promise<ServiceConfig[]> {
    const services = Array.from(this.services.values());
    
    // Her servisin kurulum durumunu kontrol et
    for (const service of services) {
      service.installed = await this.checkServiceInstallation(service);
    }
    
    return services;
  }

  async getInstalledServices(): Promise<ServiceConfig[]> {
    const allServices = await this.getAllServices();
    return allServices.filter(service => service.installed);
  }

  async getRunningServices(): Promise<ServiceConfig[]> {
    const runningServices: ServiceConfig[] = [];
    
    for (const [serviceName, status] of this.status.entries()) {
      if (status.status === 'running') {
        const service = this.services.get(serviceName);
        if (service) {
          runningServices.push(service);
        }
      }
    }
    
    return runningServices;
  }

  async downloadService(serviceName: string): Promise<{ success: boolean; message: string }> {
    console.log(`🔽 ${serviceName} servisi indirme işlemi başlatılıyor...`);
    
    const service = this.services.get(serviceName);
    if (!service) {
      console.error(`❌ ${serviceName} servisi bulunamadı`);
      return { success: false, message: 'Servis bulunamadı' };
    }

    if (service.installed) {
      console.log(`✅ ${serviceName} servisi zaten yüklü`);
      return { success: true, message: 'Servis zaten yüklü' };
    }

    try {
      // Gerçek indirme işlemi için HTTP isteği yap
      const https = require('https');
      const http = require('http');
      const fs = require('fs');
      const path = require('path');
      const os = require('os');

      // İndirme dizinini oluştur
      const downloadDir = path.join(os.homedir(), '.kovan', 'downloads');
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      // Servis için indirme URL'lerini tanımla (güncel ve çalışan URL'ler)
      const downloadUrls: { [key: string]: string } = {
        apache:
          "https://www.apachelounge.com/download/VS17/binaries/httpd-2.4.65-250724-Win64-VS17.zip",
        nginx: "https://nginx.org/download/nginx-1.24.0.zip",
        mysql:
          "https://dev.mysql.com/get/Downloads/MySQLInstaller/mysql-installer-community-8.0.35.0.msi",
        redis:
          "https://github.com/microsoftarchive/redis/releases/download/win-3.0.504/Redis-x64-3.0.504.msi",
      };

      // Eğer URL bulunamazsa hata döndür
      if (!downloadUrls[serviceName]) {
        console.error(`❌ ${serviceName} için indirme URL'i bulunamadı`);
        return { success: false, message: `Bu servis için indirme URL'i bulunamadı. Lütfen manuel olarak indirin.` };
      }

      const downloadUrl = downloadUrls[serviceName] || service.downloadUrl;
      
      if (!downloadUrl) {
        return { success: false, message: 'Bu servis için indirme URL\'i bulunamadı' };
      }

      // Dosya adını belirle
      const fileName = path.basename(downloadUrl);
      const filePath = path.join(downloadDir, fileName);

             // İndirme işlemini başlat
       return new Promise((resolve) => {
         const protocol = downloadUrl.startsWith('https:') ? https : http;
         
                   const request = protocol.get(downloadUrl, (response: any) => {
            if (response.statusCode !== 200) {
              // HTTP hatası durumunda hata döndür
              console.error(`HTTP ${response.statusCode} hatası: ${downloadUrl}`);
              resolve({ 
                success: false, 
                message: `İndirme hatası: HTTP ${response.statusCode}. URL: ${downloadUrl}` 
              });
              return;
            }

           const fileStream = fs.createWriteStream(filePath);
           const totalSize = parseInt(response.headers['content-length'] || '0');
           let downloadedSize = 0;

           response.on('data', (chunk: Buffer) => {
             downloadedSize += chunk.length;
             // Progress event'i emit et
             this.emit('download-progress', serviceName, {
               downloaded: downloadedSize,
               total: totalSize,
               percentage: totalSize > 0 ? Math.round((downloadedSize / totalSize) * 100) : 0
             });
           });

           fileStream.on('finish', () => {
             fileStream.close();
             resolve({ 
               success: true, 
               message: `${service.displayName} başarıyla indirildi: ${filePath}` 
             });
           });

           fileStream.on('error', (error: any) => {
             fs.unlink(filePath, () => {}); // Hatalı dosyayı sil
             resolve({ 
               success: false, 
               message: `Dosya yazma hatası: ${error.message}` 
             });
           });

           response.pipe(fileStream);
         });

                   request.on('error', (error: any) => {
            // Network hatası durumunda hata döndür
            console.error(`Network hatası: ${error.message}`);
            resolve({ 
              success: false, 
              message: `Network hatası: ${error.message}` 
            });
          });

                   // 5 dakika timeout
          request.setTimeout(300000, () => {
            request.destroy();
            // Timeout durumunda hata döndür
            console.error('İndirme zaman aşımı');
            resolve({ 
              success: false, 
              message: 'İndirme zaman aşımı (5 dakika)' 
            });
          });
       });

    } catch (error) {
      return { 
        success: false, 
        message: `Servis indirme hatası: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  async installService(serviceName: string, installerPath: string): Promise<{ success: boolean; message: string }> {
    const service = this.services.get(serviceName);
    if (!service) {
      return { success: false, message: 'Servis bulunamadı' };
    }

    if (service.installed) {
      return { success: true, message: 'Servis zaten yüklü' };
    }

    try {
      // Kurulum işlemini başlat
      const result = await this.runInstaller(installerPath, service);
      
      if (result.success) {
        // Kurulum başarılıysa PATH'e ekle
        await this.addToPath(service);
        
        // Servis durumunu güncelle
        service.installed = true;
        this.saveServices();
        
        return { 
          success: true, 
          message: `${service.displayName} başarıyla kuruldu ve PATH'e eklendi.` 
        };
      } else {
        return { 
          success: false, 
          message: `Kurulum başarısız: ${result.message}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Kurulum hatası: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  async addToPath(service: ServiceConfig): Promise<void> {
    try {
      const kovanBinPath = path.join(os.homedir(), '.kovan', 'bin');
      
      // Kovan bin dizinini oluştur
      if (!fs.existsSync(kovanBinPath)) {
        fs.mkdirSync(kovanBinPath, { recursive: true });
      }

      // Servis executable'ını kovan bin dizinine kopyala
      const servicePath = await this.findServiceExecutable(service.executable);
      if (servicePath) {
        const targetPath = path.join(kovanBinPath, service.executable);
        fs.copyFileSync(servicePath, targetPath);
      }

      // PATH'e ekle (Windows için)
      if (process.platform === 'win32') {
        await this.addToWindowsPath(kovanBinPath);
      }
    } catch (error) {
      console.error('PATH ekleme hatası:', error);
    }
  }

  private async findServiceExecutable(executable: string): Promise<string | null> {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      if (process.platform === 'win32') {
        const { stdout } = await execAsync(`where ${executable}`);
        const paths = stdout.trim().split('\n');
        return paths[0] || null;
      } else {
        const { stdout } = await execAsync(`which ${executable}`);
        return stdout.trim() || null;
      }
    } catch (error) {
      return null;
    }
  }

  private async addToWindowsPath(binPath: string): Promise<void> {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      // Kullanıcı PATH'ini al ve ekle
      const { stdout } = await execAsync('reg query "HKCU\\Environment" /v PATH');
      const match = stdout.match(/PATH\s+REG_EXPAND_SZ\s+(.+)/);
      
      if (match) {
        const currentPath = match[1].trim();
        
        // Eğer zaten PATH'te yoksa ekle
        if (!currentPath.includes(binPath)) {
          const newPath = `${currentPath};${binPath}`;
          await execAsync(`setx PATH "${newPath}"`);
          console.log(`✅ PATH'e eklendi: ${binPath}`);
        } else {
          console.log(`ℹ️ PATH zaten mevcut: ${binPath}`);
        }
      } else {
        // PATH bulunamadıysa yeni oluştur
        await execAsync(`setx PATH "${binPath}"`);
        console.log(`✅ Yeni PATH oluşturuldu: ${binPath}`);
      }
    } catch (error) {
      console.error('Windows PATH ekleme hatası:', error);
      // Hata durumunda manuel ekleme talimatı ver
      console.log(`⚠️ PATH manuel olarak eklenmeli: ${binPath}`);
    }
  }

  private async runInstaller(installerPath: string, service: ServiceConfig): Promise<{ success: boolean; message: string }> {
    return new Promise(async (resolve) => {
      try {
        const { spawn } = require('child_process');
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        console.log(`🔧 ${service.displayName} kurulum işlemi başlatılıyor: ${installerPath}`);
        
        // Dosya uzantısına göre kurulum yöntemini belirle
        if (process.platform === 'win32') {
          if (installerPath.endsWith('.zip')) {
            // ZIP dosyası için adm-zip ile çıkarma
            console.log(`📦 ZIP dosyası tespit edildi, adm-zip ile çıkarma başlatılıyor...`);
            
            try {
              // Çıkarma dizinini belirle
              const extractDir = path.join(os.homedir(), '.kovan', 'services', service.name);
              if (!fs.existsSync(extractDir)) {
                fs.mkdirSync(extractDir, { recursive: true });
              }
              
              // Tam dosya yolunu belirle
              const downloadDir = path.join(os.homedir(), '.kovan', 'downloads');
              const fullInstallerPath = path.isAbsolute(installerPath) ? installerPath : path.join(downloadDir, installerPath);
              
              console.log(`🔧 ZIP dosyası çıkarılıyor: ${fullInstallerPath} -> ${extractDir}`);
              
              // adm-zip ile çıkarma
              const zip = new AdmZip(fullInstallerPath);
              zip.extractAllTo(extractDir, true); // true = overwrite
              
              console.log(`✅ Çıkarma tamamlandı: ${extractDir}`);
              
              // Apache için özel kurulum
              if (service.name === 'apache') {
                await this.setupApache(extractDir, service);
              }
              
              resolve({ success: true, message: `${service.displayName} başarıyla çıkarıldı ve kuruldu: ${extractDir}` });
              
            } catch (error) {
              console.error(`❌ ZIP çıkarma hatası:`, error);
              resolve({ success: false, message: `ZIP çıkarma hatası: ${error instanceof Error ? error.message : String(error)}` });
            }
            
          } else if (installerPath.endsWith('.msi')) {
            // MSI dosyası için msiexec
            console.log(`📦 MSI dosyası tespit edildi, msiexec ile kurulum başlatılıyor...`);
            const command = 'msiexec';
            const args = ['/i', installerPath, '/quiet', '/norestart'];
            
            const installer = spawn(command, args, {
              stdio: 'pipe',
              shell: true
            });

            installer.on('close', (code: number) => {
              if (code === 0) {
                console.log(`✅ MSI kurulum tamamlandı`);
                resolve({ success: true, message: 'Kurulum tamamlandı' });
              } else {
                console.error(`❌ MSI kurulum hatası: ${code}`);
                resolve({ success: false, message: `Kurulum hatası: ${code}` });
              }
            });

            installer.on('error', (error: any) => {
              console.error(`❌ MSI kurulum hatası:`, error);
              resolve({ success: false, message: `Kurulum hatası: ${error.message}` });
            });

            // 5 dakika timeout
            setTimeout(() => {
              installer.kill();
              resolve({ success: false, message: 'Kurulum zaman aşımı' });
            }, 300000);
            
          } else if (installerPath.endsWith('.exe')) {
            // EXE dosyası için sessiz kurulum
            console.log(`📦 EXE dosyası tespit edildi, sessiz kurulum başlatılıyor...`);
            const command = installerPath;
            const args = ['/S', '/D=C:\\Program Files\\' + service.displayName];
            
            const installer = spawn(command, args, {
              stdio: 'pipe',
              shell: true
            });

            installer.on('close', (code: number) => {
              if (code === 0) {
                console.log(`✅ EXE kurulum tamamlandı`);
                resolve({ success: true, message: 'Kurulum tamamlandı' });
              } else {
                console.error(`❌ EXE kurulum hatası: ${code}`);
                resolve({ success: false, message: `Kurulum hatası: ${code}` });
              }
            });

            installer.on('error', (error: any) => {
              console.error(`❌ EXE kurulum hatası:`, error);
              resolve({ success: false, message: `Kurulum hatası: ${error.message}` });
            });

            // 5 dakika timeout
            setTimeout(() => {
              installer.kill();
              resolve({ success: false, message: 'Kurulum zaman aşımı' });
            }, 300000);
            
          } else {
            // Diğer dosya türleri için doğrudan çalıştır
            console.log(`📦 Diğer dosya türü tespit edildi, doğrudan çalıştırılıyor...`);
            const command = installerPath;
            
            const installer = spawn(command, [], {
              stdio: 'pipe',
              shell: true
            });

            installer.on('close', (code: number) => {
              if (code === 0) {
                console.log(`✅ Kurulum tamamlandı`);
                resolve({ success: true, message: 'Kurulum tamamlandı' });
              } else {
                console.error(`❌ Kurulum hatası: ${code}`);
                resolve({ success: false, message: `Kurulum hatası: ${code}` });
              }
            });

            installer.on('error', (error: any) => {
              console.error(`❌ Kurulum hatası:`, error);
              resolve({ success: false, message: `Kurulum hatası: ${error.message}` });
            });

            // 5 dakika timeout
            setTimeout(() => {
              installer.kill();
              resolve({ success: false, message: 'Kurulum zaman aşımı' });
            }, 300000);
          }
        } else {
          // Linux/Mac için
          const command = installerPath;
          const installer = spawn(command, [], {
            stdio: 'pipe',
            shell: true
          });

          installer.on('close', (code: number) => {
            if (code === 0) {
              resolve({ success: true, message: 'Kurulum tamamlandı' });
            } else {
              resolve({ success: false, message: `Kurulum hatası: ${code}` });
            }
          });

          installer.on('error', (error: any) => {
            resolve({ success: false, message: `Kurulum hatası: ${error.message}` });
          });

          // 5 dakika timeout
          setTimeout(() => {
            installer.kill();
            resolve({ success: false, message: 'Kurulum zaman aşımı' });
          }, 300000);
        }

      } catch (error) {
        console.error(`❌ Kurulum başlatma hatası:`, error);
        resolve({ success: false, message: `Kurulum başlatma hatası: ${error instanceof Error ? error.message : String(error)}` });
      }
    });
  }

  async getServiceStatus(serviceName: string): Promise<ServiceStatus> {
    const service = this.services.get(serviceName);
    if (!service) {
      return {
        name: serviceName,
        status: 'stopped',
      };
    }

    // Mevcut durumu al
    const status = this.status.get(serviceName);
    const now = Date.now();
    const lastCheck = this.lastStatusCheck.get(serviceName) || 0;

    // Eğer son 5 saniyede kontrol edildiyse ve durum "running" ise, cache'den döndür
    if (status?.status === 'running' && (now - lastCheck) < this.STATUS_CHECK_INTERVAL) {
      return status;
    }

    // Son kontrol zamanını güncelle
    this.lastStatusCheck.set(serviceName, now);

    // Apache için özel port tabanlı durum kontrolü
    if (serviceName === 'apache' && service.port) {
      try {
        const portInUse = await this.isPortInUse(service.port);
        if (portInUse) {
          return {
            name: serviceName,
            status: 'running',
            port: service.port,
            pid: status?.pid, // Eğer PID varsa koru
          };
        } else {
          return {
            name: serviceName,
            status: 'stopped',
            port: service.port,
          };
        }
      } catch (error) {
        // Hata durumunda mevcut durumu döndür, sadece debug modunda log yaz
        if (process.env.NODE_ENV === 'development') {
          console.error(`Apache port kontrolünde hata: ${error}`);
        }
      }
    }

    // Diğer servisler için mevcut PID tabanlı kontrol
    if (!status) {
      return {
        name: serviceName,
        status: 'stopped',
      };
    }

    // Eğer servis çalışıyorsa, gerçek durumu kontrol et
    if (status.status === 'running' && status.pid) {
      try {
        const isRunning = await this.checkProcessStatus(status.pid);
        if (!isRunning) {
          // Port kontrolü yap
          if (service.port) {
            const portInUse = await this.isPortInUse(service.port);
            if (portInUse) {
              console.log(`⚠️ ${serviceName} process yok ama port ${service.port} kullanımda - Hata durumu`);
              return {
                name: serviceName,
                status: 'error',
                port: service.port,
                lastError: `Process yok ama port ${service.port} kullanımda`,
              };
            }
          }
          
          // Port da boşsa durmuş kabul et
          status.status = 'stopped';
          status.pid = undefined;
          this.processes.delete(serviceName);
        }
      } catch (error) {
        console.error(`Process durumu kontrol edilirken hata: ${error}`);
      }
    }

    return status;
  }

  async startService(serviceName: string): Promise<ServiceStatus> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Servis bulunamadı: ${serviceName}`);
    }

    if (!service.enabled) {
      throw new Error(`Servis devre dışı: ${serviceName}`);
    }

    // Servis zaten çalışıyorsa
    const currentStatus = await this.getServiceStatus(serviceName);
    if (currentStatus.status === 'running') {
      return currentStatus;
    }

    // Durumu güncelle
    this.status.set(serviceName, {
      name: serviceName,
      status: 'starting',
    });

    try {
      // Port kontrolü - eğer port kullanımda ise Apache çalışıyor kabul et
      if (service.port && await this.isPortInUse(service.port)) {
        // Log mesajını kaldırdık - gereksiz tekrar
        
        // Durumu güncelle
        const status: ServiceStatus = {
          name: serviceName,
          status: 'running',
          port: service.port,
          uptime: 0,
        };

        this.status.set(serviceName, status);
        this.clearStatusCache(serviceName); // Cache'i temizle
        this.emit('service-started', serviceName, status);

        return status;
      }

      // Servisi başlat
      const process = await this.spawnService(service);
      this.processes.set(serviceName, process);

      // Durumu güncelle
      const status: ServiceStatus = {
        name: serviceName,
        status: 'running',
        pid: process.pid,
        port: service.port,
        uptime: 0,
      };

      this.status.set(serviceName, status);
      this.clearStatusCache(serviceName); // Cache'i temizle
      this.emit('service-started', serviceName, status);

      return status;
    } catch (error) {
      const errorStatus: ServiceStatus = {
        name: serviceName,
        status: 'error',
        lastError: error instanceof Error ? error.message : String(error),
      };
      this.status.set(serviceName, errorStatus);
      this.emit('service-error', serviceName, error);
      throw error;
    }
  }

  async stopService(serviceName: string): Promise<ServiceStatus> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Servis bulunamadı: ${serviceName}`);
    }

    const currentStatus = await this.getServiceStatus(serviceName);
    if (currentStatus.status === 'stopped') {
      return currentStatus;
    }

    // Durumu güncelle
    this.status.set(serviceName, {
      name: serviceName,
      status: 'stopping',
    });

    try {
      const process = this.processes.get(serviceName);
      if (process) {
        console.log(`🛑 ${serviceName} servisi durduruluyor...`);
        
        // Önce graceful shutdown dene
        process.kill('SIGTERM');
        
        // 3 saniye bekle
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.log(`⚠️ ${serviceName} graceful shutdown zaman aşımı, zorla durduruluyor...`);
            reject(new Error('Servis durdurma zaman aşımı'));
          }, 3000);

          process.once('exit', () => {
            clearTimeout(timeout);
            resolve();
          });
        });
      }

      // Apache için özel durdurma kontrolü - sadece graceful shutdown başarısızsa
      if (serviceName === 'apache' && service.port) {
        // Port kontrolü yap - eğer port hala kullanımdaysa zorla durdur
        const portInUse = await this.isPortInUse(service.port);
        if (portInUse) {
          console.log(`⚠️ Apache port ${service.port} hala kullanımda, zorla durduruluyor...`);
          await this.forceStopApache();
        }
      }

      // Durumu güncelle
      const status: ServiceStatus = {
        name: serviceName,
        status: 'stopped',
      };

      this.status.set(serviceName, status);
      this.clearStatusCache(serviceName); // Cache'i temizle
      this.processes.delete(serviceName);
      this.emit('service-stopped', serviceName, status);

      console.log(`✅ ${serviceName} servisi durduruldu`);
      return status;
    } catch (error) {
      console.log(`⚠️ ${serviceName} graceful shutdown başarısız, taskkill ile zorla durduruluyor...`);
      
      // Taskkill ile zorla durdur
      try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        // Servis türüne göre process adını belirle
        let processName = service.executable;
        if (service.name === 'apache') {
          processName = 'httpd.exe';
        } else if (service.name === 'nginx') {
          processName = 'nginx.exe';
        } else if (service.name === 'mysql') {
          processName = 'mysqld.exe';
        } else if (service.name === 'redis') {
          processName = 'redis-server.exe';
        }

        await execAsync(`taskkill /f /im ${processName}`);
        console.log(`✅ ${serviceName} taskkill ile durduruldu`);
        
        // Durumu güncelle
        const status: ServiceStatus = {
          name: serviceName,
          status: 'stopped',
        };

        this.status.set(serviceName, status);
        this.clearStatusCache(serviceName); // Cache'i temizle
        this.processes.delete(serviceName);
        this.emit('service-stopped', serviceName, status);

        return status;
      } catch (taskkillError) {
        console.error(`❌ ${serviceName} taskkill ile de durdurulamadı:`, taskkillError);
        
        const errorStatus: ServiceStatus = {
          name: serviceName,
          status: 'error',
          lastError: `Durdurma hatası: ${error instanceof Error ? error.message : String(error)}`,
        };
        this.status.set(serviceName, errorStatus);
        this.emit('service-error', serviceName, error);
        throw error;
      }
    }
  }

  async startAllServices(): Promise<void> {
    const enabledServices = Array.from(this.services.values()).filter(s => s.enabled && s.autoStart);
    
    for (const service of enabledServices) {
      try {
        await this.startService(service.name);
      } catch (error) {
        console.error(`${service.name} başlatılırken hata:`, error);
      }
    }
  }

  async stopAllServices(): Promise<void> {
    const runningServices = Array.from(this.processes.keys());
    
    console.log(`🛑 ${runningServices.length} adet servis durduruluyor...`);
    
    for (const serviceName of runningServices) {
      try {
        await this.stopService(serviceName);
      } catch (error) {
        console.error(`${serviceName} durdurulurken hata:`, error);
      }
    }
    
    // Son kontrol - kalan process'leri temizle
    await this.cleanupRemainingProcesses();
  }

  private async cleanupRemainingProcesses(): Promise<void> {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      // Tüm servis process'lerini kontrol et ve temizle
      const serviceProcesses = ['httpd.exe', 'nginx.exe', 'mysqld.exe', 'redis-server.exe'];
      
      for (const processName of serviceProcesses) {
        try {
          // Process'in çalışıp çalışmadığını kontrol et
          const { stdout } = await execAsync(`tasklist /FI "IMAGENAME eq ${processName}" /FO CSV`);
          
          if (stdout.includes(processName)) {
            // Process çalışıyorsa zorla durdur
            await execAsync(`taskkill /f /im ${processName}`);
            console.log(`✅ Kalan ${processName} process'i temizlendi`);
          }
        } catch (error) {
          // Process yoksa hata vermez
        }
      }
    } catch (error) {
      console.error('❌ Kalan process temizleme hatası:', error);
    }
  }

  private async spawnService(service: ServiceConfig): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
      try {
        const args = service.args || [];
        
        // Windows'ta servis yolunu kontrol et
        let executable = service.executable;
        if (process.platform === 'win32') {
          // Apache için özel yol kontrolü
          if (service.name === 'apache') {
            const apachePaths = [
              'C:/kovan/Apache24/bin/httpd.exe',
              path.join(os.homedir(), '.kovan', 'bin', 'httpd.exe'),
              path.join(process.cwd(), 'bin', 'httpd.exe'),
              'httpd.exe'
            ];
            
            for (const servicePath of apachePaths) {
              if (fs.existsSync(servicePath)) {
                executable = servicePath;
                console.log(`✅ Apache executable bulundu: ${executable}`);
                break;
              }
            }
          } else {
            // Diğer servisler için genel yol kontrolü
            const servicePaths = [
              path.join(os.homedir(), '.kovan', 'bin', executable),
              path.join(process.cwd(), 'bin', executable),
              executable
            ];
            
            for (const servicePath of servicePaths) {
              if (fs.existsSync(servicePath)) {
                executable = servicePath;
                break;
              }
            }
          }
        }

        console.log(`🚀 ${service.name} servisi başlatılıyor: ${executable} ${args.join(' ')}`);

        const childProcess = spawn(executable, args, {
          stdio: ['pipe', 'pipe', 'pipe'],
          detached: false,
          shell: process.platform === 'win32',
          cwd: process.platform === 'win32' ? 'C:/kovan/Apache24/bin' : undefined
        });

        childProcess.on('error', (error: any) => {
          console.error(`❌ Servis başlatma hatası (${service.name}):`, error);
          reject(error);
        });

        childProcess.on('exit', (code: any, signal: any) => {
          if (code !== 0 && signal !== 'SIGTERM') {
            console.error(`❌ ${service.name} servisi beklenmedik şekilde kapandı: ${code} ${signal}`);
          }
          this.processes.delete(service.name);
        });

        // Apache için özel hata kontrolü
        if (service.name === 'apache') {
          childProcess.stderr.on('data', (data: Buffer) => {
            const errorMessage = data.toString();
            console.error(`Apache stderr: ${errorMessage}`);
            
            // Eğer port hatası varsa
            if (errorMessage.includes('Address already in use') || errorMessage.includes('port')) {
              console.error(`❌ Port hatası: ${errorMessage}`);
            }
          });
          
          childProcess.stdout.on('data', (data: Buffer) => {
            const output = data.toString();
            console.log(`Apache stdout: ${output}`);
          });
        }

                 // Servis başlatıldığını kontrol et
         setTimeout(async () => {
           console.log(`✅ ${service.name} servisi başlatıldı (PID: ${childProcess.pid})`);
           
           // Apache için güvenlik duvarı iznini otomatik ekle
           if (service.name === 'apache' && process.platform === 'win32') {
             await this.addApacheFirewallRule();
           }
           
           // Durumu güncelle ve event emit et
           const status: ServiceStatus = {
             name: service.name,
             status: 'running',
             pid: childProcess.pid,
             port: service.port,
             uptime: 0,
           };
           this.status.set(service.name, status);
           this.emit('service-started', service.name, status);
           this.emit('service-status-updated', service.name, status); // UI güncellemesi için
           
           resolve(childProcess);
         }, 2000);
      } catch (error) {
        console.error(`❌ Servis spawn hatası (${service.name}):`, error);
        reject(error);
      }
    });
  }

  private async checkProcessStatus(pid: number): Promise<boolean> {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      if (process.platform === 'win32') {
        const { stdout } = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV`);
        // CSV formatında PID'yi doğru kontrol et
        const lines = stdout.split('\n');
        for (const line of lines) {
          if (line.includes(`"${pid}"`)) {
            return true;
          }
        }
        return false;
      } else {
        const { stdout } = await execAsync(`ps -p ${pid}`);
        return stdout.includes(pid.toString());
      }
    } catch (error) {
      console.log(`⚠️ Process durumu kontrol edilirken hata (PID ${pid}):`, error);
      return false;
    }
  }

  private async checkServiceInstallation(service: ServiceConfig): Promise<boolean> {
    try {
      // Servis yollarını kontrol et
      const servicePaths = [
        path.join(os.homedir(), '.kovan', 'bin', service.executable),
        path.join(process.cwd(), 'bin', service.executable),
        service.executable
      ];
      
      // İlk bulunan yolu kullan
      for (const servicePath of servicePaths) {
        if (fs.existsSync(servicePath)) {
          return true;
        }
      }

      // PATH'ta kontrol et
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      try {
        if (process.platform === 'win32') {
          const { stdout } = await execAsync(`where ${service.executable}`);
          return stdout.trim().length > 0;
        } else {
          const { stdout } = await execAsync(`which ${service.executable}`);
          return stdout.trim().length > 0;
        }
      } catch (error) {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Port cache'ini temizle (port değişikliklerinde kullanılır)
   */
  private clearPortCache(): void {
    this.portCache.clear();
  }

  /**
   * Servis durumu cache'ini temizle (servis durumu değişikliklerinde kullanılır)
   */
  private clearStatusCache(serviceName?: string): void {
    if (serviceName) {
      this.lastStatusCheck.delete(serviceName);
    } else {
      this.lastStatusCheck.clear();
    }
  }

  /**
   * Apache'yi zorla durdur (taskkill ile)
   */
  private async forceStopApache(): Promise<void> {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      // Önce httpd.exe process'lerini kontrol et
      const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq httpd.exe" /FO CSV');
      
      if (stdout.includes('httpd.exe')) {
        // Process varsa zorla durdur
        await execAsync('taskkill /f /im httpd.exe');
        
        // 2 saniye bekle ve tekrar kontrol et
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Tekrar kontrol et
        const { stdout: checkStdout } = await execAsync('tasklist /FI "IMAGENAME eq httpd.exe" /FO CSV');
        if (!checkStdout.includes('httpd.exe')) {
          console.log('✅ Apache başarıyla durduruldu');
        } else {
          console.log('⚠️ Apache hala çalışıyor olabilir');
        }
      }
    } catch (error) {
      console.error('❌ Apache zorla durdurma hatası:', error);
    }
  }

  private async isPortInUse(port: number): Promise<boolean> {
    const now = Date.now();
    const cached = this.portCache.get(port);
    
    // Cache'de varsa ve süresi geçmemişse cache'den döndür
    if (cached && (now - cached.timestamp) < this.PORT_CACHE_DURATION) {
      return cached.inUse;
    }

    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      if (process.platform === 'win32') {
        // Basit port kontrolü - sadece port numarasını ara
        const { stdout } = await execAsync(`netstat -an | findstr ":${port}"`);
        const inUse = stdout.trim().length > 0 && stdout.includes('LISTENING');
        
        // Sonucu cache'e kaydet
        this.portCache.set(port, { inUse, timestamp: now });
        return inUse;
      } else {
        const { stdout } = await execAsync(`lsof -i :${port}`);
        const inUse = stdout.length > 0;
        
        // Sonucu cache'e kaydet
        this.portCache.set(port, { inUse, timestamp: now });
        return inUse;
      }
    } catch (error) {
      // Hata durumunda port boş kabul et, sadece debug modunda log yaz
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚠️ Port ${port} kontrolünde hata: ${error}`);
      }
      
      // Hata durumunda da cache'e kaydet (false olarak)
      this.portCache.set(port, { inUse: false, timestamp: now });
      return false;
    }
  }



  private async setupApache(extractDir: string, service: ServiceConfig): Promise<void> {
    try {
      console.log(`🔧 Apache kurulumu yapılandırılıyor: ${extractDir}`);
      
      // Apache24 klasörünü bul
      const apacheDir = path.join(extractDir, 'Apache24');
      if (!fs.existsSync(apacheDir)) {
        console.log(`⚠️ Apache24 klasörü bulunamadı: ${extractDir}`);
        return;
      }

      // Kovan ana dizinini oluştur (c:/kovan)
      const kovanRootDir = 'C:/kovan';
      if (!fs.existsSync(kovanRootDir)) {
        fs.mkdirSync(kovanRootDir, { recursive: true });
      }

      // Apache24 klasörünü kovan ana dizinine kopyala
      const targetApacheDir = path.join(kovanRootDir, 'Apache24');
      if (fs.existsSync(targetApacheDir)) {
        fs.rmSync(targetApacheDir, { recursive: true, force: true });
      }
      
      // Klasörü kopyala
      this.copyDirectory(apacheDir, targetApacheDir);
      console.log(`✅ Apache24 klasörü kopyalandı: ${targetApacheDir}`);

      // httpd.conf dosyasını güncelle
      const httpdConfPath = path.join(targetApacheDir, 'conf', 'httpd.conf');
      if (fs.existsSync(httpdConfPath)) {
        let httpdConf = fs.readFileSync(httpdConfPath, 'utf8');
        
        // SRVROOT yolunu güncelle
        const newServerRoot = targetApacheDir.replace(/\\/g, '/');
        httpdConf = httpdConf.replace(
          /Define SRVROOT "c:\/Apache24"/g,
          `Define SRVROOT "${newServerRoot}"`
        );
        
        // DocumentRoot yolunu güncelle
        const newDocumentRoot = path.join(targetApacheDir, 'htdocs').replace(/\\/g, '/');
        httpdConf = httpdConf.replace(
          /DocumentRoot "c:\/Apache24\/htdocs"/g,
          `DocumentRoot "${newDocumentRoot}"`
        );
        
        // Directory yolunu güncelle
        httpdConf = httpdConf.replace(
          /<Directory "c:\/Apache24\/htdocs">/g,
          `<Directory "${newDocumentRoot}">`
        );
        
        // Port'u 8080 olarak güncelle
        httpdConf = httpdConf.replace(
          /Listen 80/g,
          'Listen 8080'
        );
        
        // ServerName direktifini ekle (uyarıyı gidermek için)
        if (!httpdConf.includes('ServerName')) {
          httpdConf = httpdConf.replace(
            /#ServerName www\.example\.com:80/,
            'ServerName localhost:8080'
          );
        }
        
        fs.writeFileSync(httpdConfPath, httpdConf);
        console.log(`✅ httpd.conf güncellendi: ${httpdConfPath}`);
      }

      // Apache executable'ını kovan bin dizinine kopyala
      const kovanBinPath = path.join(os.homedir(), '.kovan', 'bin');
      if (!fs.existsSync(kovanBinPath)) {
        fs.mkdirSync(kovanBinPath, { recursive: true });
      }

      const httpdExe = path.join(targetApacheDir, 'bin', 'httpd.exe');
      if (fs.existsSync(httpdExe)) {
        const targetPath = path.join(kovanBinPath, 'httpd.exe');
        fs.copyFileSync(httpdExe, targetPath);
        console.log(`✅ Apache executable kopyalandı: ${targetPath}`);
      }

      // Servis konfigürasyonunu güncelle
      service.configPath = httpdConfPath;
      service.executable = path.join(kovanBinPath, 'httpd.exe');
      
      // Servis durumunu güncelle
      service.installed = true;
      this.saveServices();

      console.log(`✅ Apache kurulumu tamamlandı`);
    } catch (error) {
      console.error('Apache kurulum hatası:', error);
    }
  }

  private copyDirectory(source: string, destination: string): void {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }

    const files = fs.readdirSync(source);
    for (const file of files) {
      const sourcePath = path.join(source, file);
      const destPath = path.join(destination, file);
      
      const stat = fs.statSync(sourcePath);
      if (stat.isDirectory()) {
        this.copyDirectory(sourcePath, destPath);
      } else {
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  }

  async updateServicePort(serviceName: string, newPort: number): Promise<{ success: boolean; message: string }> {
    try {
      const service = this.services.get(serviceName);
      if (!service) {
        return { success: false, message: 'Servis bulunamadı' };
      }

      if (!service.installed) {
        return { success: false, message: 'Servis kurulu değil' };
      }

      // Eğer servis çalışıyorsa önce durdur
      const currentStatus = await this.getServiceStatus(serviceName);
      let wasRunning = false;
      
      if (currentStatus.status === 'running') {
        console.log(`🛑 ${service.displayName} port değişikliği için durduruluyor...`);
        await this.stopService(serviceName);
        wasRunning = true;
      }

      // Servis portunu güncelle
      service.port = newPort;

      // Port cache'ini temizle (port değişikliği olduğu için)
      this.clearPortCache();

      // Servis türüne göre konfigürasyon dosyasını güncelle
      if (service.name === 'apache' && service.configPath) {
        await this.updateApachePort(service.configPath, newPort);
      }

      // Servisleri kaydet
      this.saveServices();

      console.log(`✅ ${service.displayName} portu ${newPort} olarak güncellendi ve kaydedildi`);

      // Eğer servis çalışıyorduysa yeniden başlat
      if (wasRunning) {
        console.log(`🚀 ${service.displayName} yeni port ile yeniden başlatılıyor...`);
        await this.startService(serviceName);
      }

      return { success: true, message: `${service.displayName} portu ${newPort} olarak güncellendi` };
    } catch (error) {
      console.error(`❌ Port güncelleme hatası:`, error);
      return { 
        success: false, 
        message: `Port güncelleme hatası: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  private async updateApachePort(configPath: string, newPort: number): Promise<void> {
    try {
      if (fs.existsSync(configPath)) {
        let httpdConf = fs.readFileSync(configPath, 'utf8');
        
        // Port'u güncelle - daha spesifik regex kullan
        // Sadece Listen ile başlayan ve sayı ile biten satırları değiştir
        httpdConf = httpdConf.replace(
          /^Listen \d+$/gm,
          `Listen ${newPort}`
        );
        
        fs.writeFileSync(configPath, httpdConf);
        console.log(`✅ Apache portu güncellendi: ${newPort}`);
        
        // Güncellenmiş dosyayı kontrol et
        const updatedConf = fs.readFileSync(configPath, 'utf8');
        const listenLines = updatedConf.match(/^Listen \d+$/gm);
        if (listenLines) {
          console.log(`🔍 Güncellenmiş portlar: ${listenLines.join(', ')}`);
        }
        
        // Dosyayı doğrulamak için tekrar oku
        console.log(`🔍 httpd.conf dosyası güncellendi: ${configPath}`);
      }
    } catch (error) {
      console.error('Apache port güncelleme hatası:', error);
      throw error;
    }
  }

  private async addApacheFirewallRule(): Promise<void> {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      // Apache için güvenlik duvarı kuralı ekle
      const apachePath = 'C:/kovan/Apache24/bin/httpd.exe';
      
      // Önce mevcut kuralları sil
      try {
        await execAsync('netsh advfirewall firewall delete rule name="Apache HTTP Server"');
        console.log('✅ Eski Apache güvenlik duvarı kuralları silindi');
      } catch (error) {
        // Kural yoksa hata vermez
      }

      // Yeni kural ekle - daha basit komut kullan
      const command = `netsh advfirewall firewall add rule name="Apache HTTP Server" dir=in action=allow program="${apachePath}" enable=yes`;
      
      try {
        await execAsync(command);
        console.log('✅ Apache güvenlik duvarı izni eklendi');
      } catch (error) {
        // Eğer yönetici hakları yoksa, kullanıcıya bilgi ver
        console.log('⚠️ Güvenlik duvarı izni eklenemedi (yönetici hakları gerekli)');
        console.log('ℹ️ Apache çalışıyor ama güvenlik duvarı izni manuel olarak eklenmeli');
        console.log(`ℹ️ Manuel komut: ${command}`);
      }
    } catch (error) {
      console.error('❌ Apache güvenlik duvarı izni eklenirken hata:', error);
      console.log('ℹ️ Apache çalışıyor ama güvenlik duvarı izni manuel olarak eklenmeli');
    }
  }
}
