import React, { useState, useEffect } from 'react';
import './Projects.css';

interface Project {
  id: string;
  name: string;
  path: string;
  type: string;
  framework?: string;
  description?: string;
  url?: string;
  port?: number;
  lastOpened?: Date;
}

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProjectPath, setNewProjectPath] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projectList = await window.kovanAPI.projects.list();
      setProjects(projectList);
    } catch (error) {
      console.error('Projeler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async () => {
    try {
      const selectedPath = await window.kovanAPI.file.selectDirectory();
      if (selectedPath) {
        await window.kovanAPI.projects.add(selectedPath);
        await loadProjects();
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Proje eklenirken hata:', error);
      alert('Proje eklenirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleOpenProject = async (projectId: string) => {
    try {
      await window.kovanAPI.projects.open(projectId);
    } catch (error) {
      console.error('Proje açılırken hata:', error);
      alert('Proje açılırken hata oluştu: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleRemoveProject = async (projectId: string) => {
    if (confirm('Bu projeyi kaldırmak istediğinizden emin misiniz?')) {
      try {
        await window.kovanAPI.projects.remove(projectId);
        await loadProjects();
      } catch (error) {
        console.error('Proje kaldırılırken hata:', error);
        alert('Proje kaldırılırken hata oluştu: ' + (error instanceof Error ? error.message : String(error)));
      }
    }
  };

  const handleViewProject = async (project: any) => {
    try {
      // Proje tipine göre farklı URL'ler oluştur
      let url = '';
      
      if (project.type === 'php') {
        url = `http://localhost:8000`;
      } else if (project.type === 'nodejs') {
        url = `http://localhost:${project.port || 3000}`;
      } else if (project.type === 'python') {
        url = `http://localhost:${project.port || 5000}`;
      } else {
        url = `http://localhost:${project.port || 8000}`;
      }
      
      // Tarayıcıda aç
      window.open(url, '_blank');
    } catch (error) {
      console.error('Proje görüntülenirken hata:', error);
      alert('Proje görüntülenirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const getProjectIcon = (type: string) => {
    switch (type) {
      case 'php':
        return '🐘';
      case 'nodejs':
        return '🟢';
      case 'python':
        return '🐍';
      case 'ruby':
        return '💎';
      default:
        return '📁';
    }
  };

  if (loading) {
    return (
      <div className="projects-page">
        <div className="loading">Projeler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="projects-header">
        <h1>Projeler</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          + Yeni Proje Ekle
        </button>
      </div>

      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3>Henüz proje yok</h3>
            <p>İlk projenizi ekleyerek başlayın</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              Proje Ekle
            </button>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <span className="project-icon">{getProjectIcon(project.type)}</span>
                <div className="project-actions">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleOpenProject(project.id)}
                  >
                    Aç
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleRemoveProject(project.id)}
                  >
                    Kaldır
                  </button>
                </div>
              </div>
              
              <div className="project-content">
                <h3>{project.name}</h3>
                <p className="project-path">{project.path}</p>
                {project.framework && (
                  <span className="project-framework">{project.framework}</span>
                )}
                {project.description && (
                  <p className="project-description">{project.description}</p>
                )}
              </div>

              <div className="project-footer">
                {project.url && (
                  <button 
                    className="btn btn-sm btn-link"
                    onClick={() => handleViewProject(project)}
                  >
                    🌐 Görüntüle
                  </button>
                )}
                {project.lastOpened && (
                  <span className="last-opened">
                    Son açılış: {new Date(project.lastOpened).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Yeni Proje Ekle</h2>
            <p>Proje klasörünü seçin:</p>
            <div className="modal-actions">
              <button 
                className="btn btn-primary"
                onClick={handleAddProject}
              >
                Klasör Seç
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;


