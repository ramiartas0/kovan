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
exports.ProjectManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const events_1 = require("events");
class ProjectManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.projects = new Map();
        this.templates = new Map();
        this.configPath = path.join(os.homedir(), '.kovan', 'projects.json');
        this.loadProjects();
        this.initializeTemplates();
    }
    loadProjects() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readFileSync(this.configPath, 'utf8');
                const projects = JSON.parse(data);
                projects.forEach((project) => {
                    project.createdAt = new Date(project.createdAt);
                    project.updatedAt = new Date(project.updatedAt);
                    if (project.lastOpened) {
                        project.lastOpened = new Date(project.lastOpened);
                    }
                    this.projects.set(project.id, project);
                });
            }
        }
        catch (error) {
            console.error('Projeler yüklenirken hata:', error);
        }
    }
    saveProjects() {
        try {
            const projectsDir = path.dirname(this.configPath);
            if (!fs.existsSync(projectsDir)) {
                fs.mkdirSync(projectsDir, { recursive: true });
            }
            const projectsArray = Array.from(this.projects.values());
            fs.writeFileSync(this.configPath, JSON.stringify(projectsArray, null, 2));
        }
        catch (error) {
            console.error('Projeler kaydedilirken hata:', error);
        }
    }
    initializeTemplates() {
        const defaultTemplates = [
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
    async addProject(projectPath) {
        if (!fs.existsSync(projectPath)) {
            throw new Error(`Proje dizini bulunamadı: ${projectPath}`);
        }
        const projectName = path.basename(projectPath);
        const projectId = this.generateProjectId(projectName);
        // Proje tipini tespit et
        const projectType = await this.detectProjectType(projectPath);
        const framework = await this.detectFramework(projectPath, projectType);
        const project = {
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
    async removeProject(projectId) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error(`Proje bulunamadı: ${projectId}`);
        }
        this.projects.delete(projectId);
        this.saveProjects();
        this.emit('projectRemoved', project);
    }
    async openProject(projectId) {
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
    async getProjects() {
        return Array.from(this.projects.values()).sort((a, b) => {
            if (a.lastOpened && b.lastOpened) {
                return b.lastOpened.getTime() - a.lastOpened.getTime();
            }
            return b.updatedAt.getTime() - a.updatedAt.getTime();
        });
    }
    async getProject(projectId) {
        return this.projects.get(projectId) || null;
    }
    async updateProject(projectId, updates) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error(`Proje bulunamadı: ${projectId}`);
        }
        Object.assign(project, updates, { updatedAt: new Date() });
        this.saveProjects();
        this.emit('projectUpdated', project);
        return project;
    }
    async createProjectFromTemplate(templateName, projectPath, projectName) {
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
    async getTemplates() {
        return Array.from(this.templates.values());
    }
    generateProjectId(name) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}-${random}`;
    }
    async detectProjectType(projectPath) {
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
    async detectFramework(projectPath, type) {
        const files = fs.readdirSync(projectPath);
        switch (type) {
            case 'php':
                if (files.includes('artisan'))
                    return 'Laravel';
                if (files.includes('symfony.lock'))
                    return 'Symfony';
                if (files.includes('wp-config.php'))
                    return 'WordPress';
                if (files.includes('composer.json'))
                    return 'PHP';
                break;
            case 'nodejs':
                if (files.includes('package.json')) {
                    try {
                        const packageJson = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'));
                        if (packageJson.dependencies?.react)
                            return 'React';
                        if (packageJson.dependencies?.vue)
                            return 'Vue';
                        if (packageJson.dependencies?.express)
                            return 'Express';
                        if (packageJson.dependencies?.next)
                            return 'Next.js';
                        return 'Node.js';
                    }
                    catch (error) {
                        return 'Node.js';
                    }
                }
                break;
            case 'python':
                if (files.includes('manage.py'))
                    return 'Django';
                if (files.includes('app.py') || files.includes('flask'))
                    return 'Flask';
                return 'Python';
            case 'ruby':
                if (files.includes('Gemfile'))
                    return 'Rails';
                return 'Ruby';
            case 'go':
                return 'Go';
        }
        return undefined;
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
exports.ProjectManager = ProjectManager;
