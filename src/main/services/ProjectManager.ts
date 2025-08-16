import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';

export interface Project {
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

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  framework: string;
  gitUrl?: string;
  commands?: string[];
  port: number;
}

export class ProjectManager {
  private projects: Map<string, Project> = new Map();
  private configPath: string;
  private templates: ProjectTemplate[] = [];

  constructor() {
    this.configPath = path.join(os.homedir(), ".kovan", "projects.json");
    this.loadProjects();
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'laravel',
        name: 'Laravel',
        description: 'Modern PHP web framework',
        type: 'php',
        framework: 'laravel',
        gitUrl: 'https://github.com/laravel/laravel.git',
        commands: ['composer install', 'cp .env.example .env', 'php artisan key:generate'],
        port: 8000
      },
      {
        id: 'react',
        name: 'React App',
        description: 'Modern React application',
        type: 'javascript',
        framework: 'react',
        gitUrl: 'https://github.com/facebook/create-react-app.git',
        commands: ['npm install'],
        port: 3000
      },
      {
        id: 'vue',
        name: 'Vue.js App',
        description: 'Modern Vue.js application',
        type: 'javascript',
        framework: 'vue',
        gitUrl: 'https://github.com/vuejs/vue.git',
        commands: ['npm install'],
        port: 8080
      },
      {
        id: 'nodejs',
        name: 'Node.js API',
        description: 'Express.js API server',
        type: 'javascript',
        framework: 'express',
        commands: ['npm install'],
        port: 3000
      },
      {
        id: 'python-flask',
        name: 'Python Flask',
        description: 'Flask web application',
        type: 'python',
        framework: 'flask',
        commands: ['pip install -r requirements.txt'],
        port: 5000
      },
      {
        id: 'wordpress',
        name: 'WordPress',
        description: 'WordPress blog/CMS',
        type: 'php',
        framework: 'wordpress',
        gitUrl: 'https://github.com/WordPress/WordPress.git',
        commands: ['composer install'],
        port: 8000
      }
    ];
  }

  private loadProjects(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, "utf8");
        const projects = JSON.parse(data);
        projects.forEach((project: Project) => {
          this.projects.set(project.id, project);
        });
      }
    } catch (error) {
      console.error("Projeler yüklenirken hata:", error);
    }
  }

  private saveProjects(): void {
    try {
      const projectsDir = path.dirname(this.configPath);
      if (!fs.existsSync(projectsDir)) {
        fs.mkdirSync(projectsDir, { recursive: true });
      }

      const projectsArray = Array.from(this.projects.values());
      fs.writeFileSync(this.configPath, JSON.stringify(projectsArray, null, 2));
    } catch (error) {
      console.error("Projeler kaydedilirken hata:", error);
    }
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getTemplates(): Promise<ProjectTemplate[]> {
    return this.templates;
  }

  async createProjectFromTemplate(templateId: string, projectName: string, projectPath: string): Promise<Project> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Şablon bulunamadı: ${templateId}`);
    }

    // Proje dizinini oluştur
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    // Git clone yap (eğer gitUrl varsa)
    if (template.gitUrl) {
      await this.runCommand('git', ['clone', template.gitUrl, projectPath]);
    }

    // Komutları çalıştır
    if (template.commands) {
      for (const command of template.commands) {
        await this.runCommandInDirectory(projectPath, command);
      }
    }

    // Projeyi ekle
    return await this.addProject(projectPath);
  }

  async addProject(projectPath: string): Promise<Project> {
    // Proje yolunun var olduğunu kontrol et
    if (!fs.existsSync(projectPath)) {
      throw new Error("Proje yolu bulunamadı");
    }

    // Proje adını al
    const projectName = path.basename(projectPath);

    // Proje tipini tespit et
    const projectType = await this.detectProjectType(projectPath);

    // Framework'ü tespit et
    const framework = await this.detectFramework(projectPath, projectType);

    const project: Project = {
      id: this.generateId(),
      name: projectName,
      path: projectPath,
      type: projectType,
      framework,
      description: `${projectType.toUpperCase()} projesi`,
      url: `http://${projectName.toLowerCase()}.test`,
      port: this.getDefaultPort(projectType),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.projects.set(project.id, project);
    this.saveProjects();

    return project;
  }

  async removeProject(projectId: string): Promise<void> {
    if (!this.projects.has(projectId)) {
      throw new Error("Proje bulunamadı");
    }

    this.projects.delete(projectId);
    this.saveProjects();
  }

  async openProject(projectId: string): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error("Proje bulunamadı");
    }

    console.log("Proje açılıyor:", project.name, "Yol:", project.path);

    // Proje yolunun hala var olduğunu kontrol et
    if (!fs.existsSync(project.path)) {
      console.error("Proje yolu bulunamadı:", project.path);
      throw new Error("Proje yolu artık mevcut değil");
    }

    // Proje klasörünü aç
    await this.openInFileManager(project.path);

    // Son açılma tarihini güncelle
    project.lastOpened = new Date();
    project.updatedAt = new Date();
    this.saveProjects();
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private async runCommand(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const childProcess = spawn(command, args, {
        stdio: 'inherit',
        shell: process.platform === 'win32'
      });

      childProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Komut başarısız: ${command} ${args.join(' ')}`));
        }
      });

      childProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  private async runCommandInDirectory(directory: string, command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const childProcess = spawn(command, [], {
        stdio: 'inherit',
        shell: true,
        cwd: directory
      });

      childProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Komut başarısız: ${command}`));
        }
      });

      childProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  private async detectProjectType(projectPath: string): Promise<string> {
    const files = fs.readdirSync(projectPath);

    // PHP projesi kontrolü
    if (files.includes("composer.json") || files.includes("index.php")) {
      return "php";
    }

    // Node.js projesi kontrolü
    if (files.includes("package.json")) {
      return "nodejs";
    }

    // Python projesi kontrolü
    if (
      files.includes("requirements.txt") ||
      files.includes("setup.py") ||
      files.includes("pyproject.toml")
    ) {
      return "python";
    }

    // Ruby projesi kontrolü
    if (files.includes("Gemfile")) {
      return "ruby";
    }

    // Go projesi kontrolü
    if (files.includes("go.mod")) {
      return "go";
    }

    // Genel web projesi
    if (files.includes("index.html") || files.includes("index.htm")) {
      return "web";
    }

    return "unknown";
  }

  private async detectFramework(
    projectPath: string,
    projectType: string
  ): Promise<string | undefined> {
    const files = fs.readdirSync(projectPath);

    switch (projectType) {
      case "php":
        if (files.includes("artisan")) return "Laravel";
        if (files.includes("symfony")) return "Symfony";
        if (files.includes("wp-config.php")) return "WordPress";
        if (files.includes("config.php") && files.includes("system"))
          return "CodeIgniter";
        return "PHP";

      case "nodejs":
        try {
          const packageJson = JSON.parse(
            fs.readFileSync(path.join(projectPath, "package.json"), "utf8")
          );
          const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
          };

          if (dependencies["react"]) return "React";
          if (dependencies["vue"]) return "Vue.js";
          if (dependencies["angular"]) return "Angular";
          if (dependencies["express"]) return "Express.js";
          if (dependencies["next"]) return "Next.js";
          if (dependencies["nuxt"]) return "Nuxt.js";
          return "Node.js";
        } catch (error) {
          return "Node.js";
        }

      case "python":
        if (files.includes("manage.py")) return "Django";
        if (files.includes("app.py") || files.includes("main.py"))
          return "Flask";
        if (files.includes("fastapi")) return "FastAPI";
        return "Python";

      case "ruby":
        if (files.includes("config.ru")) return "Sinatra";
        if (files.includes("Gemfile.lock")) {
          try {
            const gemfileLock = fs.readFileSync(
              path.join(projectPath, "Gemfile.lock"),
              "utf8"
            );
            if (gemfileLock.includes("rails")) return "Ruby on Rails";
          } catch (error) {
            // Ignore
          }
        }
        return "Ruby";

      default:
        return undefined;
    }
  }

  private getDefaultPort(projectType: string): number {
    switch (projectType) {
      case "php":
        return 8000;
      case "nodejs":
        return 3000;
      case "python":
        return 5000;
      case "ruby":
        return 3000;
      case "go":
        return 8080;
      default:
        return 8000;
    }
  }

  private async openInFileManager(projectPath: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        // Mutlak yol al
        const folderPath = path.resolve(projectPath);
        console.log("Klasör açılıyor:", folderPath);

        if (process.platform === "win32") {
          // Windows için daha güvenilir yöntem
          const { exec } = require('child_process');
          const command = `start "" "${folderPath}"`;
          console.log("Windows komutu:", command);
          
          exec(command, (error: any) => {
            if (error) {
              console.error("Windows explorer hatası:", error);
            } else {
              console.log("Windows explorer başarılı");
            }
            resolve();
          });
        } else {
          // Diğer platformlar için
          let command: string;
          let args: string[];

          switch (process.platform) {
            case "darwin":
              command = "open";
              args = [folderPath];
              break;
            default:
              command = "xdg-open";
              args = [folderPath];
              break;
          }

          const childProcess = spawn(command, args, {
            stdio: "ignore",
            shell: true,
          });

          childProcess.on("error", (err) => {
            console.error("Dosya yöneticisi hatası:", err);
            resolve();
          });

          childProcess.on("exit", () => resolve());
        }

        // 3 saniye timeout ile garanti çözüm
        setTimeout(() => resolve(), 3000);
      } catch (error) {
        console.error("Dosya yöneticisi açma hatası:", error);
        resolve();
      }
    });
  }
}

