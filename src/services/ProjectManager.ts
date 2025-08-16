import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EventEmitter } from 'events';

export interface Project {
  id: string;
  name: string;
  path: string;
  type: 'php' | 'nodejs' | 'python' | 'ruby' | 'go' | 'other';
  framework?: string;
  description?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastOpened?: Date;
  url?: string;
  port?: number;
  database?: string;
  version?: string;
  autoStart?: boolean;
  enabled?: boolean;
}

export interface ProjectTemplate {
  name: string;
  displayName: string;
  description: string;
  type: string;
  framework: string;
  url: string;
  commands: string[];
  files: string[];
}

export class ProjectManager extends EventEmitter {
  private projects: Map<string, Project> = new Map();
  private configPath: string;
  private templates: Map<string, ProjectTemplate> = new Map();

  constructor() {
    super();
    this.configPath = path.join(os.homedir(), '.kovan', 'projects.json');
    this.loadProjects();
    this.initializeTemplates();
  }

  private loadProjects(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const projects = JSON.parse(data);
        projects.forEach((project: Project) => {
          project.createdAt = new Date(project.createdAt);
          project.updatedAt = new Date(project.updatedAt);
          if (project.lastOpened) {
            project.lastOpened = new Date(project.lastOpened);
          }
          this.projects.set(project.id, project);
        });
      }
    } catch (error) {
      console.error('Projeler yüklenirken hata:', error);
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
      console.error('Projeler kaydedilirken hata:', error);
    }
  }

  private initializeTemplates(): void {
    const defaultTemplates: ProjectTemplate[] = [
      {
        name: 'laravel',
        displayName: 'Laravel',
        description: 'Modern PHP framework for web artisans',
        type: 'php',
        framework: 'Laravel',
        url: 'https://laravel.com',
        commands: [
          'composer create-project laravel/laravel .',
          'php artisan key:generate',
          'php artisan migrate',
        ],
        files: ['composer.json', 'artisan'],
      },
      {
        name: 'symfony',
        displayName: 'Symfony',
        description: 'High Performance PHP Framework for Web Development',
        type: 'php',
        framework: 'Symfony',
        url: 'https://symfony.com',
        commands: [
          'composer create-project symfony/skeleton .',
          'composer require webapp',
        ],
        files: ['composer.json', 'symfony.lock'],
      },
      {
        name: 'wordpress',
        displayName: 'WordPress',
        description: 'The world\'s most popular CMS',
        type: 'php',
        framework: 'WordPress',
        url: 'https://wordpress.org',
        commands: [
          'wp core download',
          'wp config create --dbname=wordpress --dbuser=root --dbpass=',
        ],
        files: ['wp-config.php', 'wp-content'],
      },
      {
        name: 'express',
        displayName: 'Express.js',
        description: 'Fast, unopinionated, minimalist web framework for Node.js',
        type: 'nodejs',
        framework: 'Express',
        url: 'https://expressjs.com',
        commands: [
          'npm init -y',
          'npm install express',
          'npm install --save-dev nodemon',
        ],
        files: ['package.json', 'app.js'],
      },
      {
        name: 'react',
        displayName: 'React',
        description: 'A JavaScript library for building user interfaces',
        type: 'nodejs',
        framework: 'React',
        url: 'https://reactjs.org',
        commands: [
          'npx create-react-app .',
        ],
        files: ['package.json', 'src/App.js'],
      },
      {
        name: 'vue',
        displayName: 'Vue.js',
        description: 'The Progressive JavaScript Framework',
        type: 'nodejs',
        framework: 'Vue',
        url: 'https://vuejs.org',
        commands: [
          'npm create vue@latest .',
        ],
        files: ['package.json', 'src/main.js'],
      },
      {
        name: 'django',
        displayName: 'Django',
        description: 'The Web framework for perfectionists with deadlines',
        type: 'python',
        framework: 'Django',
        url: 'https://djangoproject.com',
        commands: [
          'pip install django',
          'django-admin startproject .',
          'python manage.py migrate',
        ],
        files: ['manage.py', 'requirements.txt'],
      },
      {
        name: 'flask',
        displayName: 'Flask',
        description: 'A lightweight WSGI web application framework',
        type: 'python',
        framework: 'Flask',
        url: 'https://flask.palletsprojects.com',
        commands: [
          'pip install flask',
        ],
        files: ['app.py', 'requirements.txt'],
      },
      {
        name: 'rails',
        displayName: 'Ruby on Rails',
        description: 'Web application framework for Ruby',
        type: 'ruby',
        framework: 'Rails',
        url: 'https://rubyonrails.org',
        commands: [
          'gem install rails',
          'rails new . --database=mysql',
          'rails db:create',
        ],
        files: ['Gemfile', 'config/application.rb'],
      },
      {
        name: 'gin',
        displayName: 'Gin',
        description: 'HTTP web framework written in Go',
        type: 'go',
        framework: 'Gin',
        url: 'https://gin-gonic.com',
        commands: [
          'go mod init myapp',
          'go get github.com/gin-gonic/gin',
        ],
        files: ['go.mod', 'main.go'],
      },
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.name, template);
    });
  }

  async addProject(projectPath: string): Promise<Project> {
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Proje dizini bulunamadı: ${projectPath}`);
    }

    const projectName = path.basename(projectPath);
    const projectId = this.generateProjectId(projectName);
    
    // Proje tipini tespit et
    const projectType = await this.detectProjectType(projectPath);
    const framework = await this.detectFramework(projectPath, projectType);

    const project: Project = {
      id: projectId,
      name: projectName,
      path: projectPath,
      type: projectType,
      framework,
      description: '',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      enabled: true,
    };

    this.projects.set(projectId, project);
    this.saveProjects();
    this.emit('projectAdded', project);

    return project;
  }

  async removeProject(projectId: string): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Proje bulunamadı: ${projectId}`);
    }

    this.projects.delete(projectId);
    this.saveProjects();
    this.emit('projectRemoved', project);
  }

  async openProject(projectId: string): Promise<Project> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Proje bulunamadı: ${projectId}`);
    }

    if (!fs.existsSync(project.path)) {
      throw new Error(`Proje dizini bulunamadı: ${project.path}`);
    }

    project.lastOpened = new Date();
    project.updatedAt = new Date();
    this.saveProjects();

    this.emit('projectOpened', project);
    return project;
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).sort((a, b) => {
      if (a.lastOpened && b.lastOpened) {
        return b.lastOpened.getTime() - a.lastOpened.getTime();
      }
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }

  async getProject(projectId: string): Promise<Project | null> {
    return this.projects.get(projectId) || null;
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Proje bulunamadı: ${projectId}`);
    }

    Object.assign(project, updates, { updatedAt: new Date() });
    this.saveProjects();
    this.emit('projectUpdated', project);

    return project;
  }

  async createProjectFromTemplate(
    templateName: string, 
    projectPath: string, 
    projectName: string
  ): Promise<Project> {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Şablon bulunamadı: ${templateName}`);
    }

    if (fs.existsSync(projectPath)) {
      throw new Error(`Proje dizini zaten mevcut: ${projectPath}`);
    }

    // Proje dizinini oluştur
    fs.mkdirSync(projectPath, { recursive: true });

    // Template komutlarını çalıştır
    for (const command of template.commands) {
      await this.executeCommand(command, projectPath);
    }

    // Projeyi ekle
    const project = await this.addProject(projectPath);
    
    // Template bilgilerini güncelle
    await this.updateProject(project.id, {
      name: projectName,
      framework: template.framework,
      description: template.description,
    });

    return project;
  }

  async getTemplates(): Promise<ProjectTemplate[]> {
    return Array.from(this.templates.values());
  }

  private generateProjectId(name: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}-${random}`;
  }

  private async detectProjectType(projectPath: string): Promise<Project['type']> {
    const files = fs.readdirSync(projectPath);

    if (files.includes('composer.json') || files.includes('artisan') || files.includes('wp-config.php')) {
      return 'php';
    }
    if (files.includes('package.json') || files.includes('yarn.lock')) {
      return 'nodejs';
    }
    if (files.includes('requirements.txt') || files.includes('manage.py') || files.includes('app.py')) {
      return 'python';
    }
    if (files.includes('Gemfile') || files.includes('config.ru')) {
      return 'ruby';
    }
    if (files.includes('go.mod') || files.includes('main.go')) {
      return 'go';
    }

    return 'other';
  }

  private async detectFramework(projectPath: string, type: Project['type']): Promise<string | undefined> {
    const files = fs.readdirSync(projectPath);

    switch (type) {
      case 'php':
        if (files.includes('artisan')) return 'Laravel';
        if (files.includes('symfony.lock')) return 'Symfony';
        if (files.includes('wp-config.php')) return 'WordPress';
        if (files.includes('composer.json')) return 'PHP';
        break;
      case 'nodejs':
        if (files.includes('package.json')) {
          try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'));
            if (packageJson.dependencies?.react) return 'React';
            if (packageJson.dependencies?.vue) return 'Vue';
            if (packageJson.dependencies?.express) return 'Express';
            if (packageJson.dependencies?.next) return 'Next.js';
            return 'Node.js';
          } catch (error) {
            return 'Node.js';
          }
        }
        break;
      case 'python':
        if (files.includes('manage.py')) return 'Django';
        if (files.includes('app.py') || files.includes('flask')) return 'Flask';
        return 'Python';
      case 'ruby':
        if (files.includes('Gemfile')) return 'Rails';
        return 'Ruby';
      case 'go':
        return 'Go';
    }

    return undefined;
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

