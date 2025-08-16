import { app, BrowserWindow, Menu, ipcMain, dialog, shell } from "electron";
import * as path from "path";
import * as fs from "fs";
import { ServiceManager } from "./services/ServiceManager";
import { ProjectManager } from "./services/ProjectManager";
import { PluginManager } from "./services/PluginManager";

class KovanApp {
  private mainWindow: BrowserWindow | null = null;
  private serviceManager: ServiceManager;
  private projectManager: ProjectManager;
  private pluginManager: PluginManager;

  constructor() {
    this.serviceManager = new ServiceManager();
    this.projectManager = new ProjectManager();
    this.pluginManager = new PluginManager();

    this.initializeApp();
  }

  private initializeApp(): void {
    app.whenReady().then(() => {
      this.createMainWindow();
      this.setupMenu();
      this.setupIPC();
      this.setupEventListeners();
      this.setupAppEvents();
    });

    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        // Direkt kapatma, uyarı göster
        this.handleAppQuit();
      }
    });

    app.on("before-quit", (event) => {
      // Çarpıdan kapatma durumunda event'i engelle ve uyarı göster
      event.preventDefault();
      this.handleAppQuit();
    });

    // Uygulama kapatma isteği geldiğinde
    app.on("quit", () => {
      // Tüm servisleri zorla durdur
      this.forceStopAllServices();
    });

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });
  }

  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        // enableRemoteModule: false, // Bu özellik Electron 12'den sonra kaldırıldı
        preload: path.join(__dirname, "preload.js"),
      },
      icon: path.join(__dirname, "../../assets/icon.png"),
      titleBarStyle: "default",
      show: false,
    });

    // Development modunda Vite dev server'ı kullan
    this.mainWindow.loadURL("http://localhost:3001");
    this.mainWindow.webContents.openDevTools(); // DevTools'u aç

    this.mainWindow.once("ready-to-show", () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on("closed", () => {
      this.mainWindow = null;
    });

    // External link'leri default browser'da aç
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: "deny" };
    });
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: "Dosya",
        submenu: [
          {
            label: "Yeni Proje",
            accelerator: "CmdOrCtrl+N",
            click: () => {
              this.mainWindow?.webContents.send("menu-new-project");
            },
          },
          {
            label: "Proje Aç",
            accelerator: "CmdOrCtrl+O",
            click: async () => {
              const result = await dialog.showOpenDialog(this.mainWindow!, {
                properties: ["openDirectory"],
              });
              if (!result.canceled) {
                this.mainWindow?.webContents.send(
                  "menu-open-project",
                  result.filePaths[0]
                );
              }
            },
          },
          { type: "separator" },
          {
            label: "Çıkış",
            accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
            click: () => {
              app.quit();
            },
          },
        ],
      },
      {
        label: "Görünüm",
        submenu: [
          { role: "reload" },
          { role: "forceReload" },
          { role: "toggleDevTools" },
          { type: "separator" },
          { role: "resetZoom" },
          { role: "zoomIn" },
          { role: "zoomOut" },
          { type: "separator" },
          { role: "togglefullscreen" },
        ],
      },
      {
        label: "Servisler",
        submenu: [
          {
            label: "Tüm Servisleri Başlat",
            click: () => {
              this.serviceManager.startAllServices();
            },
          },
          {
            label: "Tüm Servisleri Durdur",
            click: () => {
              this.serviceManager.stopAllServices();
            },
          },
          { type: "separator" },
          {
            label: "Servis Durumunu Göster",
            click: () => {
              this.mainWindow?.webContents.send("show-service-status");
            },
          },
        ],
      },
      {
        label: "Yardım",
        submenu: [
          {
            label: "Hakkında",
            click: () => {
              this.mainWindow?.webContents.send("show-about");
            },
          },
          {
            label: "Dokümantasyon",
            click: () => {
              shell.openExternal("https://docs.kovan.dev");
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupIPC(): void {
    // Servis yönetimi
    ipcMain.handle("services:start", async (event, serviceName: string) => {
      return await this.serviceManager.startService(serviceName);
    });

    ipcMain.handle("services:stop", async (event, serviceName: string) => {
      return await this.serviceManager.stopService(serviceName);
    });

    ipcMain.handle("services:status", async (event, serviceName: string) => {
      return await this.serviceManager.getServiceStatus(serviceName);
    });

    ipcMain.handle("services:list", async () => {
      return await this.serviceManager.getAllServices();
    });

    ipcMain.handle("services:installed", async () => {
      return await this.serviceManager.getInstalledServices();
    });

    ipcMain.handle("services:download", async (event, serviceName: string) => {
      return await this.serviceManager.downloadService(serviceName);
    });

    ipcMain.handle("services:install", async (event, serviceName: string, installerPath: string) => {
      return await this.serviceManager.installService(serviceName, installerPath);
    });

    ipcMain.handle("services:updatePort", async (event, serviceName: string, newPort: number) => {
      return await this.serviceManager.updateServicePort(serviceName, newPort);
    });

    ipcMain.handle("services:install", async (event, serviceName: string, installerPath: string) => {
      return await this.serviceManager.installService(serviceName, installerPath);
    });

    ipcMain.handle("services:updatePort", async (event, serviceName: string, newPort: number) => {
      return await this.serviceManager.updateServicePort(serviceName, newPort);
    });

    // Proje yönetimi
    ipcMain.handle("projects:list", async () => {
      return await this.projectManager.getProjects();
    });

    ipcMain.handle("projects:add", async (event, projectPath: string) => {
      return await this.projectManager.addProject(projectPath);
    });

    ipcMain.handle("projects:remove", async (event, projectId: string) => {
      return await this.projectManager.removeProject(projectId);
    });

    ipcMain.handle("projects:open", async (event, projectId: string) => {
      return await this.projectManager.openProject(projectId);
    });

    ipcMain.handle("projects:templates", async () => {
      return await this.projectManager.getTemplates();
    });

    ipcMain.handle("projects:create-from-template", async (event, templateId: string, projectName: string, projectPath: string) => {
      return await this.projectManager.createProjectFromTemplate(templateId, projectName, projectPath);
    });

    // Plugin yönetimi
    ipcMain.handle("plugins:list", async () => {
      return await this.pluginManager.getPlugins();
    });

    ipcMain.handle("plugins:install", async (event, pluginName: string) => {
      return await this.pluginManager.installPlugin(pluginName);
    });

    ipcMain.handle("plugins:uninstall", async (event, pluginName: string) => {
      return await this.pluginManager.uninstallPlugin(pluginName);
    });

    ipcMain.handle("plugins:enable", async (event, pluginId: string) => {
      return await this.pluginManager.enablePlugin(pluginId);
    });

    ipcMain.handle("plugins:disable", async (event, pluginId: string) => {
      return await this.pluginManager.disablePlugin(pluginId);
    });

    // Sistem bilgileri
    ipcMain.handle("system:info", async () => {
      const os = require("os");
      const { exec } = require("child_process");
      const { promisify } = require("util");
      const execAsync = promisify(exec);

      try {
        // CPU kullanımı - Windows için daha doğru hesaplama
        let cpuUsage = 0;
        if (process.platform === "win32") {
          try {
            // WMIC ile CPU kullanımı (daha güvenilir)
            const { stdout } = await execAsync(
              "wmic cpu get loadpercentage /format:value"
            );
            const match = stdout.match(/LoadPercentage=(\d+)/);
            if (match) {
              cpuUsage = parseInt(match[1]);
            }
          } catch (error) {
            console.error("CPU kullanımı alınamadı:", error);
            // Fallback: os.loadavg() kullan
            cpuUsage = Math.round(os.loadavg()[0] * 100);
          }
        } else {
          cpuUsage = Math.round(os.loadavg()[0] * 100);
        }

        // Bellek kullanımı - daha doğru hesaplama
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memoryUsage = Math.round((usedMem / totalMem) * 100);

        // Disk kullanımı - Windows için düzeltilmiş
        let diskUsage = 0;
        try {
          if (process.platform === "win32") {
            // Windows: Daha basit PowerShell komutu
            const { stdout } = await execAsync(
              `powershell -Command "Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DeviceID -eq 'C:'} | ForEach-Object {[math]::Round((($_.Size - $_.FreeSpace)/$_.Size)*100,1)}"`
            );

            diskUsage = parseFloat(stdout.trim());
            if (isNaN(diskUsage) || diskUsage < 0) diskUsage = 0;
          } else {
            // Linux / MacOS
            const { stdout } = await execAsync(
              `df / | tail -1 | awk '{print $5}' | sed 's/%//'`
            );

            diskUsage = parseFloat(stdout.trim());
            if (isNaN(diskUsage) || diskUsage < 0) diskUsage = 0;
          }
        } catch (error) {
          console.error("PowerShell disk kullanımı alınamadı:", error);
          try {
            // Fallback: WMIC ile disk kullanımı (value format)
            const { stdout } = await execAsync(
              "wmic logicaldisk where \"DeviceID='C:'\" get Size,FreeSpace /format:value"
            );
            
            // Parse the output
            const sizeMatch = stdout.match(/Size=(\d+)/);
            const freeSpaceMatch = stdout.match(/FreeSpace=(\d+)/);
            
            if (sizeMatch && freeSpaceMatch) {
              const size = parseInt(sizeMatch[1]);
              const freeSpace = parseInt(freeSpaceMatch[1]);
              if (size > 0 && freeSpace >= 0) {
                diskUsage = Math.round(((size - freeSpace) / size) * 100);
              }
            }
          } catch (wmicError) {
            console.error("WMIC disk kullanımı da alınamadı:", wmicError);
            diskUsage = 0;
          }
        }

        // Uptime - saniye cinsinden
        const uptime = os.uptime();

        const result = {
          cpu: cpuUsage,
          memory: memoryUsage,
          disk: diskUsage,
          uptime: Math.round(uptime),
          platform: process.platform,
          arch: process.arch,
          version: app.getVersion(),
          nodeVersion: process.version,
          electronVersion: process.versions.electron,
        };

        console.log("Sistem bilgileri:", result);
        return result;
      } catch (error) {
        console.error("Sistem bilgileri alınamadı:", error);
        return {
          cpu: 0,
          memory: 0,
          disk: 0,
          uptime: 0,
          platform: process.platform,
          arch: process.arch,
          version: app.getVersion(),
          nodeVersion: process.version,
          electronVersion: process.versions.electron,
        };
      }
    });

    // Ayarlar yönetimi
    ipcMain.handle("settings:get", async () => {
      const settingsPath = path.join(app.getPath("userData"), "settings.json");
      try {
        if (fs.existsSync(settingsPath)) {
          const data = fs.readFileSync(settingsPath, "utf8");
          return JSON.parse(data);
        }
        return this.getDefaultSettings();
      } catch (error) {
        console.error("Ayarlar yüklenirken hata:", error);
        return this.getDefaultSettings();
      }
    });

    ipcMain.handle("settings:save", async (event, settings: any) => {
      const settingsPath = path.join(app.getPath("userData"), "settings.json");
      try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        return { success: true };
      } catch (error) {
        console.error("Ayarlar kaydedilirken hata:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    // Dosya işlemleri
    ipcMain.handle("file:select-directory", async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ["openDirectory"],
      });
      return result.canceled ? null : result.filePaths[0];
    });

    ipcMain.handle("file:select-file", async (event, options: any) => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ["openFile"],
        filters: options?.filters || [],
      });
      return result.canceled ? null : result.filePaths[0];
    });
  }

  private setupEventListeners(): void {
    // İndirme progress event'ini dinle
    this.serviceManager.on('download-progress', (serviceName: string, progress: any) => {
      this.mainWindow?.webContents.send('download-progress', serviceName, progress);
    });

    // Servis event'lerini dinle
    this.serviceManager.on('service-started', (serviceName: string, status: any) => {
      console.log(`✅ ${serviceName} servisi başlatıldı:`, status);
      this.mainWindow?.webContents.send('service-status-updated', serviceName, status);
    });

    this.serviceManager.on('service-stopped', (serviceName: string, status: any) => {
      console.log(`🛑 ${serviceName} servisi durduruldu:`, status);
      this.mainWindow?.webContents.send('service-status-updated', serviceName, status);
    });

    this.serviceManager.on('service-status-updated', (serviceName: string, status: any) => {
      console.log(`🔄 ${serviceName} servisi durumu güncellendi:`, status);
      this.mainWindow?.webContents.send('service-status-updated', serviceName, status);
    });

    this.serviceManager.on('service-error', (serviceName: string, error: any) => {
      console.error(`❌ ${serviceName} servisi hatası:`, error);
      this.mainWindow?.webContents.send('service-error', serviceName, error);
    });
  }

  private getDefaultSettings() {
    return {
      general: {
        autoStart: false,
        startMinimized: false,
        checkUpdates: true,
        language: "tr",
      },
      services: {
        autoStartServices: false,
        defaultPorts: {
          apache: 80,
          nginx: 80,
          mysql: 3306,
          postgresql: 5432,
          redis: 6379,
        },
      },
      appearance: {
        theme: "dark",
        accentColor: "#667eea",
        compactMode: false,
      },
      development: {
        defaultProjectPath: "",
        autoDetectFrameworks: true,
        enableHotReload: true,
      },
    };
  }

  private setupAppEvents(): void {
    // Sistem bilgilerini logla
    const os = require("os");
    const systemInfo = {
      cpu: os.cpus().length,
      memory: Math.round(os.totalmem() / (1024 * 1024 * 1024)),
      disk: 0, // Disk bilgisi için ayrı hesaplama gerekir
      uptime: Math.round(os.uptime()),
      platform: os.platform(),
      arch: os.arch(),
      version: app.getVersion(),
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
    };
    console.log("Sistem bilgileri:", systemInfo);
  }

  private async handleAppQuit(): Promise<void> {
    try {
      // Çalışan servisleri kontrol et
      const runningServices = await this.serviceManager.getRunningServices();
      
      if (runningServices.length > 0) {
        console.log(`🛑 Çalışan servisler tespit edildi: ${runningServices.map(s => s.name).join(', ')}`);
        
        // Kullanıcıya uyarı göster
        const result = await dialog.showMessageBox(this.mainWindow!, {
          type: 'warning',
          title: 'Çalışan Servisler',
          message: `${runningServices.length} adet servis hala çalışıyor.`,
          detail: `Çalışan servisler: ${runningServices.map(s => s.displayName).join(', ')}\n\nUygulamayı kapatmadan önce tüm servisler durdurulacak.`,
          buttons: ['Devam Et', 'İptal'],
          defaultId: 0,
          cancelId: 1
        });

        if (result.response === 1) {
          // İptal edildi
          return;
        }
      }

      // Tüm servisleri durdur
      console.log('🛑 Tüm servisler durduruluyor...');
      await this.serviceManager.stopAllServices();
      
      // Taskkill ile kalan process'leri temizle
      await this.cleanupProcesses();
      
      console.log('✅ Uygulama güvenli şekilde kapatılıyor...');
      app.exit(0);
    } catch (error) {
      console.error('❌ Uygulama kapatılırken hata:', error);
      app.exit(1);
    }
  }

  private async cleanupProcesses(): Promise<void> {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      // Apache process'lerini temizle
      try {
        await execAsync('taskkill /f /im httpd.exe');
        console.log('✅ Apache process\'leri temizlendi');
      } catch (error) {
        // Process yoksa hata vermez
      }

      // Diğer servis process'lerini de ekleyebiliriz
      const serviceProcesses = ['nginx.exe', 'mysqld.exe', 'redis-server.exe'];
      
      for (const processName of serviceProcesses) {
        try {
          await execAsync(`taskkill /f /im ${processName}`);
          console.log(`✅ ${processName} process'leri temizlendi`);
        } catch (error) {
          // Process yoksa hata vermez
        }
      }
    } catch (error) {
      console.error('❌ Process temizleme hatası:', error);
    }
  }

  private async forceStopAllServices(): Promise<void> {
    try {
      console.log('🛑 Tüm servisler zorla durduruluyor...');
      
      // Taskkill ile tüm servis process'lerini zorla durdur
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      // Apache, Nginx, MySQL, Redis process'lerini zorla durdur
      const processes = ['httpd.exe', 'nginx.exe', 'mysqld.exe', 'redis-server.exe'];
      
      for (const processName of processes) {
        try {
          await execAsync(`taskkill /f /im ${processName}`);
          console.log(`✅ ${processName} zorla durduruldu`);
        } catch (error) {
          // Process yoksa hata vermez
          console.log(`ℹ️ ${processName} zaten durmuş`);
        }
      }
      
      console.log('✅ Tüm servisler temizlendi');
    } catch (error) {
      console.error('❌ Servis temizleme hatası:', error);
    }
  }
}

// Uygulamayı başlat
new KovanApp();
