import React, { useState, useEffect } from 'react';
import './Plugins.css';

interface Plugin {
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
}

const Plugins: React.FC = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [newPluginUrl, setNewPluginUrl] = useState('');

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    try {
      const pluginList = await window.kovanAPI.plugins.list();
      setPlugins(pluginList);
    } catch (error) {
      console.error('Eklentiler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstallPlugin = async () => {
    try {
      await window.kovanAPI.plugins.install(newPluginUrl);
      await loadPlugins();
      setShowInstallModal(false);
      setNewPluginUrl('');
    } catch (error) {
      console.error('Eklenti yüklenirken hata:', error);
      alert('Eklenti yüklenirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleUninstallPlugin = async (pluginId: string) => {
    try {
      await window.kovanAPI.plugins.uninstall(pluginId);
      await loadPlugins();
    } catch (error) {
      console.error('Eklenti kaldırılırken hata:', error);
      alert('Eklenti kaldırılırken hata oluştu: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleTogglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      if (enabled) {
        await window.kovanAPI.plugins.enable(pluginId);
      } else {
        await window.kovanAPI.plugins.disable(pluginId);
      }
      await loadPlugins();
    } catch (error) {
      console.error('Eklenti durumu değiştirilirken hata:', error);
      alert('Eklenti durumu değiştirilirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const getPluginIcon = (plugin: Plugin) => {
    if (plugin.icon) return plugin.icon;
    
    switch (plugin.category) {
      case 'database': return '🗄️';
      case 'development': return '🛠️';
      case 'monitoring': return '📊';
      case 'security': return '🔒';
      case 'utility': return '⚙️';
      default: return '🔌';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'database': return 'Veritabanı';
      case 'development': return 'Geliştirme';
      case 'monitoring': return 'İzleme';
      case 'security': return 'Güvenlik';
      case 'utility': return 'Yardımcı';
      default: return 'Diğer';
    }
  };

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'database', 'development', 'monitoring', 'security', 'utility'];

  if (loading) {
    return (
      <div className="plugins-page">
        <div className="loading">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="plugins-page">
      <div className="plugins-header">
        <h1>Eklentiler</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowInstallModal(true)}
        >
          <span>➕</span>
          Yeni Eklenti Yükle
        </button>
      </div>

      <div className="plugins-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Eklenti ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'Tümü' : getCategoryName(category)}
            </button>
          ))}
        </div>
      </div>

      <div className="plugins-grid">
        {filteredPlugins.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔌</div>
            <h3>Eklenti Bulunamadı</h3>
            <p>Arama kriterlerinize uygun eklenti bulunamadı.</p>
          </div>
        ) : (
          filteredPlugins.map(plugin => (
            <div key={plugin.id} className="plugin-card">
              <div className="plugin-header">
                <div className="plugin-icon">{getPluginIcon(plugin)}</div>
                <div className="plugin-info">
                  <h3>{plugin.name}</h3>
                  <div className="plugin-meta">
                    <span className="plugin-version">v{plugin.version}</span>
                    <span className="plugin-author">by {plugin.author}</span>
                  </div>
                </div>
                <div className="plugin-status">
                  {plugin.installed ? (
                    <span className={`status-badge ${plugin.enabled ? 'enabled' : 'disabled'}`}>
                      {plugin.enabled ? 'Aktif' : 'Pasif'}
                    </span>
                  ) : (
                    <span className="status-badge not-installed">Yüklü Değil</span>
                  )}
                </div>
              </div>

              <div className="plugin-description">
                {plugin.description}
              </div>

              <div className="plugin-category">
                <span className="category-badge">{getCategoryName(plugin.category)}</span>
              </div>

              {plugin.dependencies && plugin.dependencies.length > 0 && (
                <div className="plugin-dependencies">
                  <h4>Bağımlılıklar:</h4>
                  <div className="dependencies-list">
                    {plugin.dependencies.map(dep => (
                      <span key={dep} className="dependency-badge">{dep}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="plugin-actions">
                {plugin.installed ? (
                  <>
                    <button
                      className={`btn ${plugin.enabled ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => handleTogglePlugin(plugin.id, !plugin.enabled)}
                    >
                      {plugin.enabled ? 'Devre Dışı Bırak' : 'Etkinleştir'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleUninstallPlugin(plugin.id)}
                    >
                      Kaldır
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleInstallPlugin()}
                  >
                    Yükle
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Yeni Eklenti Yükleme Modal */}
      {showInstallModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Yeni Eklenti Yükle</h2>
            <p>Eklenti URL'sini veya paket adını girin:</p>
            
            <input
              type="text"
              placeholder="https://github.com/user/plugin veya @kovan/plugin-name"
              value={newPluginUrl}
              onChange={(e) => setNewPluginUrl(e.target.value)}
              className="modal-input"
            />
            
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowInstallModal(false);
                  setNewPluginUrl('');
                }}
              >
                İptal
              </button>
              <button
                className="btn btn-primary"
                onClick={handleInstallPlugin}
                disabled={!newPluginUrl.trim()}
              >
                Yükle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plugins;


