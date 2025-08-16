import React, { useState, useEffect } from 'react';
import './Settings.css';

interface ServiceConfig {
  name: string;
  displayName: string;
  description: string;
  type: 'web' | 'database' | 'cache' | 'other';
  executable: string;
  port?: number;
  configPath?: string;
  installed?: boolean;
  enabled?: boolean;
}

interface Settings {
  general: {
    autoStart: boolean;
    startMinimized: boolean;
    checkUpdates: boolean;
    language: string;
  };
  services: {
    autoStartServices: boolean;
    defaultPorts: {
      apache: number;
      nginx: number;
      mysql: number;
      postgresql: number;
      redis: number;
    };
  };
  appearance: {
    theme: 'dark' | 'light' | 'auto';
    accentColor: string;
    compactMode: boolean;
  };
  development: {
    defaultProjectPath: string;
    autoDetectFrameworks: boolean;
    enableHotReload: boolean;
  };
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    general: {
      autoStart: false,
      startMinimized: false,
      checkUpdates: true,
      language: 'tr'
    },
    services: {
      autoStartServices: false,
      defaultPorts: {
        apache: 80,
        nginx: 80,
        mysql: 3306,
        postgresql: 5432,
        redis: 6379
      }
    },
    appearance: {
      theme: 'dark',
      accentColor: '#667eea',
      compactMode: false
    },
    development: {
      defaultProjectPath: '',
      autoDetectFrameworks: true,
      enableHotReload: true
    }
  });
  const [installedServices, setInstalledServices] = useState<ServiceConfig[]>([]);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
    loadInstalledServices();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await window.kovanAPI.settings.get();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error);
    }
  };

  const loadInstalledServices = async () => {
    try {
      const services = await window.kovanAPI.services.list();
      const installed = services.filter((service: any) => service.installed);
      setInstalledServices(installed);
    } catch (error) {
      console.error('Kurulu servisler yüklenirken hata:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const result = await window.kovanAPI.settings.save(settings);
      if (result.success) {
        console.log('Ayarlar başarıyla kaydedildi');
      } else {
        console.error('Ayarlar kaydedilirken hata:', result.error);
        alert('Ayarlar kaydedilirken hata oluştu: ' + result.error);
      }
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      alert('Ayarlar kaydedilirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section: keyof Settings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const updateNestedSetting = (section: keyof Settings, nestedKey: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nestedKey]: {
          ...(prev[section] as any)[nestedKey],
          [key]: value
        }
      }
    }));
  };

  const updateServicePort = async (serviceName: string, newPort: number) => {
    try {
      // Ayarları güncelle
      updateNestedSetting('services', 'defaultPorts', serviceName, newPort);
      
      // Servis konfigürasyonunu güncelle
      const result = await window.kovanAPI.services.updatePort(serviceName, newPort);
      
      if (result.success) {
        console.log(`${serviceName} portu ${newPort} olarak güncellendi`);
        
        // Servis listesini yeniden yükle
        await loadInstalledServices();
      } else {
        console.error(`${serviceName} portu güncellenirken hata:`, result.message);
        alert(`${serviceName} portu güncellenirken hata oluştu: ${result.message}`);
      }
    } catch (error) {
      console.error(`${serviceName} portu güncellenirken hata:`, error);
      alert(`${serviceName} portu güncellenirken hata oluştu: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const tabs = [
    { id: 'general', name: 'Genel', icon: '⚙️' },
    { id: 'services', name: 'Servisler', icon: '🔧' },
    { id: 'appearance', name: 'Görünüm', icon: '🎨' },
    { id: 'development', name: 'Geliştirme', icon: '💻' }
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Ayarlar</h1>
        <button 
          className="btn btn-primary"
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>

      <div className="settings-content">
        <div className="settings-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-name">{tab.name}</span>
            </button>
          ))}
        </div>

        <div className="settings-panel">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h2>Genel Ayarlar</h2>
              
              <div className="setting-group">
                <h3>Başlangıç</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Windows başlangıcında otomatik başlat</label>
                    <p>Kovan uygulaması Windows başlangıcında otomatik olarak başlatılır</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.general.autoStart}
                      onChange={(e) => updateSetting('general', 'autoStart', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Başlangıçta simge durumunda küçült</label>
                    <p>Uygulama başlangıçta simge durumunda küçültülmüş olarak açılır</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.general.startMinimized}
                      onChange={(e) => updateSetting('general', 'startMinimized', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-group">
                <h3>Güncellemeler</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Otomatik güncelleme kontrolü</label>
                    <p>Uygulama başlangıcında güncellemeleri otomatik olarak kontrol et</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.general.checkUpdates}
                      onChange={(e) => updateSetting('general', 'checkUpdates', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-group">
                <h3>Dil</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Uygulama dili</label>
                    <p>Kovan arayüzünün dilini seçin</p>
                  </div>
                  <select
                    value={settings.general.language}
                    onChange={(e) => updateSetting('general', 'language', e.target.value)}
                    className="setting-select"
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="settings-section">
              <h2>Servis Ayarları</h2>
              
              <div className="setting-group">
                <h3>Otomatik Başlatma</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Servisleri otomatik başlat</label>
                    <p>Kovan başlangıcında belirlenen servisleri otomatik olarak başlat</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.services.autoStartServices}
                      onChange={(e) => updateSetting('services', 'autoStartServices', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              {installedServices.length > 0 ? (
                <div className="setting-group">
                  <h3>Kurulu Servisler</h3>
                  
                  {installedServices.map(service => (
                    <div key={service.name} className="setting-item">
                      <div className="setting-info">
                        <label>{service.displayName} Port</label>
                        <p>{service.description} için port ayarı</p>
                      </div>
                      <input
                        type="number"
                        value={service.port || 8080}
                        onChange={(e) => {
                          const newPort = parseInt(e.target.value);
                          if (!isNaN(newPort) && newPort > 0 && newPort <= 65535) {
                            updateServicePort(service.name, newPort);
                          }
                        }}
                        className="setting-input"
                        min="1"
                        max="65535"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="setting-group">
                  <h3>Kurulu Servisler</h3>
                  <p className="no-services">Henüz kurulu servis bulunmuyor. Servisler sekmesinden servis kurun.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h2>Görünüm Ayarları</h2>
              
              <div className="setting-group">
                <h3>Tema</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Uygulama teması</label>
                    <p>Kovan arayüzünün görsel temasını seçin</p>
                  </div>
                  <select
                    value={settings.appearance.theme}
                    onChange={(e) => updateSetting('appearance', 'theme', e.target.value)}
                    className="setting-select"
                  >
                    <option value="dark">Koyu Tema</option>
                    <option value="light">Açık Tema</option>
                    <option value="auto">Sistem</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Vurgu rengi</label>
                    <p>Uygulama genelinde kullanılacak vurgu rengini seçin</p>
                  </div>
                  <input
                    type="color"
                    value={settings.appearance.accentColor}
                    onChange={(e) => updateSetting('appearance', 'accentColor', e.target.value)}
                    className="setting-color"
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Kompakt mod</label>
                    <p>Daha az boşluk kullanan kompakt görünüm</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.appearance.compactMode}
                      onChange={(e) => updateSetting('appearance', 'compactMode', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'development' && (
            <div className="settings-section">
              <h2>Geliştirme Ayarları</h2>
              
              <div className="setting-group">
                <h3>Proje Yönetimi</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Varsayılan proje yolu</label>
                    <p>Yeni projelerin oluşturulacağı varsayılan dizin</p>
                  </div>
                  <div className="setting-input-group">
                    <input
                      type="text"
                      value={settings.development.defaultProjectPath}
                      onChange={(e) => updateSetting('development', 'defaultProjectPath', e.target.value)}
                      className="setting-input"
                      placeholder="C:\Projects"
                    />
                    <button className="btn btn-secondary">Gözat</button>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Framework otomatik tespiti</label>
                    <p>Proje klasörlerinde framework'leri otomatik olarak tespit et</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.development.autoDetectFrameworks}
                      onChange={(e) => updateSetting('development', 'autoDetectFrameworks', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Hot reload desteği</label>
                    <p>Geliştirme sırasında dosya değişikliklerini otomatik yenile</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.development.enableHotReload}
                      onChange={(e) => updateSetting('development', 'enableHotReload', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;


