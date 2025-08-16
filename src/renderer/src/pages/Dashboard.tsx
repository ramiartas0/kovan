import React, { useState, useEffect } from 'react';
import './Dashboard.css';

interface SystemInfo {
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
}

interface QuickStats {
  totalProjects: number;
  runningServices: number;
  activePlugins: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

const Dashboard: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    cpu: 0,
    memory: 0,
    disk: 0,
    uptime: 0
  });
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalProjects: 0,
    runningServices: 0,
    activePlugins: 0,
    systemHealth: 'excellent'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Main process'in hazır olmasını bekle
    const waitForKovanAPI = () => {
      if (window.kovanAPI && window.kovanAPI.system) {
        loadDashboardData();
        const interval = setInterval(loadDashboardData, 5000);
        return () => clearInterval(interval);
      } else {
        // KovanAPI henüz hazır değil, 100ms sonra tekrar dene
        setTimeout(waitForKovanAPI, 100);
      }
    };

    waitForKovanAPI();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Main process'in hazır olup olmadığını kontrol et
      if (!window.kovanAPI || !window.kovanAPI.system) {
        console.warn('KovanAPI henüz hazır değil, tekrar deneniyor...');
        return;
      }

      // Gerçek sistem bilgilerini yükle
      const systemData = await window.kovanAPI.system.info();
      setSystemInfo({
        cpu: systemData.cpu || 0,
        memory: systemData.memory || 0,
        disk: systemData.disk || 0,
        uptime: systemData.uptime || 0
      });
      
      // Gerçek proje sayısını yükle
      const projects = await window.kovanAPI.projects.list();
      
      // Gerçek servisleri yükle
      const services = await window.kovanAPI.services.list();
      const runningServices = services.filter((service: any) => service.status === 'running');
      
      // Gerçek plugin sayısını yükle
      const plugins = await window.kovanAPI.plugins.list();
      const activePlugins = plugins.filter((plugin: any) => plugin.enabled);
      
      setQuickStats({
        totalProjects: projects.length,
        runningServices: runningServices.length,
        activePlugins: activePlugins.length,
        systemHealth: getSystemHealth(systemData.cpu || 0, systemData.memory || 0)
      });
    } catch (error) {
      console.error('Dashboard verileri yüklenirken hata:', error);
      // Hata durumunda varsayılan değerler kullan
      // Main process henüz hazır olmayabilir, bu normal bir durum
    } finally {
      setLoading(false);
    }
  };

  const getSystemHealth = (cpu: number, memory: number): 'excellent' | 'good' | 'warning' | 'critical' => {
    if (cpu > 80 || memory > 80) return 'critical';
    if (cpu > 60 || memory > 60) return 'warning';
    if (cpu > 30 || memory > 30) return 'good';
    return 'excellent';
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) return `${days}g ${hours}s`;
    if (hours > 0) return `${hours}s ${minutes}d`;
    if (minutes > 0) return `${minutes}d ${secs}s`;
    return `${secs}s`;
  };

  /** Skeleton Loading Components */
  const StatCardSkeleton = () => (
    <div className="skeleton-stat-card">
      <div className="skeleton skeleton-stat-icon"></div>
      <div className="skeleton-stat-content">
        <div className="skeleton skeleton-stat-title"></div>
        <div className="skeleton skeleton-stat-value"></div>
        <div className="skeleton skeleton-stat-bar"></div>
      </div>
    </div>
  );

  const QuickStatCardSkeleton = () => (
    <div className="skeleton-quick-stat-card">
      <div className="skeleton skeleton-quick-stat-icon"></div>
      <div className="skeleton-quick-stat-info">
        <div className="skeleton skeleton-quick-stat-title"></div>
        <div className="skeleton skeleton-quick-stat-value"></div>
      </div>
    </div>
  );

  const QuickActionSkeleton = () => (
    <div className="skeleton-quick-action-btn">
      <div className="skeleton skeleton-quick-action-icon"></div>
      <div className="skeleton skeleton-quick-action-text"></div>
    </div>
  );

  const ActivityItemSkeleton = () => (
    <div className="skeleton-activity-item">
      <div className="skeleton skeleton-activity-icon"></div>
      <div className="skeleton-activity-content">
        <div className="skeleton skeleton-activity-title"></div>
        <div className="skeleton skeleton-activity-time"></div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="system-health">
          <span className="health-indicator" style={{ backgroundColor: getHealthColor(quickStats.systemHealth) }}></span>
          <span className="health-text">Sistem Durumu: {quickStats.systemHealth === 'excellent' ? 'Mükemmel' : 
            quickStats.systemHealth === 'good' ? 'İyi' : 
            quickStats.systemHealth === 'warning' ? 'Uyarı' : 'Kritik'}</span>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-grid">
          {/* Sistem İstatistikleri Skeleton */}
          <div className="stats-section">
            <h2>Sistem İstatistikleri</h2>
            <div className="stats-grid">
              {[1, 2, 3, 4].map((index) => (
                <StatCardSkeleton key={index} />
              ))}
            </div>
          </div>

          {/* Hızlı İstatistikler Skeleton */}
          <div className="quick-stats-section">
            <h2>Hızlı İstatistikler</h2>
            <div className="quick-stats-grid">
              {[1, 2, 3].map((index) => (
                <QuickStatCardSkeleton key={index} />
              ))}
            </div>
          </div>

          {/* Hızlı Erişim Skeleton */}
          <div className="quick-actions-section">
            <h2>Hızlı Erişim</h2>
            <div className="quick-actions-grid">
              {[1, 2, 3, 4].map((index) => (
                <QuickActionSkeleton key={index} />
              ))}
            </div>
          </div>

          {/* Son Aktiviteler Skeleton */}
          <div className="recent-activities-section">
            <h2>Son Aktiviteler</h2>
            <div className="activities-list">
              {[1, 2, 3].map((index) => (
                <ActivityItemSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Sistem İstatistikleri */}
          <div className="stats-section">
            <h2>Sistem İstatistikleri</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🖥️</div>
                <div className="stat-content">
                  <h3>CPU Kullanımı</h3>
                  <div className="stat-value">{systemInfo?.cpu?.toFixed(1) || '0.0'}%</div>
                  <div className="stat-bar">
                    <div className="stat-bar-fill" style={{ width: `${systemInfo?.cpu || 0}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">💾</div>
                <div className="stat-content">
                  <h3>RAM Kullanımı</h3>
                  <div className="stat-value">{systemInfo?.memory?.toFixed(1) || '0.0'}%</div>
                  <div className="stat-bar">
                    <div className="stat-bar-fill" style={{ width: `${systemInfo?.memory || 0}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">💿</div>
                <div className="stat-content">
                  <h3>Disk Kullanımı</h3>
                  <div className="stat-value">{systemInfo?.disk?.toFixed(1) || '0.0'}%</div>
                  <div className="stat-bar">
                    <div className="stat-bar-fill" style={{ width: `${systemInfo?.disk || 0}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⏱️</div>
                <div className="stat-content">
                  <h3>Çalışma Süresi</h3>
                  <div className="stat-value">{formatUptime(systemInfo?.uptime || 0)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hızlı İstatistikler */}
          <div className="quick-stats-section">
            <h2>Hızlı İstatistikler</h2>
            <div className="quick-stats-grid">
              <div className="quick-stat-card">
                <div className="quick-stat-icon">📁</div>
                <div className="quick-stat-info">
                  <h3>Toplam Proje</h3>
                  <div className="quick-stat-value">{quickStats.totalProjects}</div>
                </div>
              </div>

              <div className="quick-stat-card">
                <div className="quick-stat-icon">⚙️</div>
                <div className="quick-stat-info">
                  <h3>Çalışan Servis</h3>
                  <div className="quick-stat-value">{quickStats.runningServices}</div>
                </div>
              </div>

              <div className="quick-stat-card">
                <div className="quick-stat-icon">🔌</div>
                <div className="quick-stat-info">
                  <h3>Aktif Eklenti</h3>
                  <div className="quick-stat-value">{quickStats.activePlugins}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hızlı Erişim */}
          <div className="quick-actions-section">
            <h2>Hızlı Erişim</h2>
            <div className="quick-actions-grid">
              <button className="quick-action-btn" onClick={() => window.location.hash = '#/projects'}>
                <div className="quick-action-icon">➕</div>
                <span>Yeni Proje Ekle</span>
              </button>
              
              <button className="quick-action-btn" onClick={() => window.location.hash = '#/services'}>
                <div className="quick-action-icon">🚀</div>
                <span>Tüm Servisleri Başlat</span>
              </button>
              
              <button className="quick-action-btn" onClick={() => window.location.hash = '#/plugins'}>
                <div className="quick-action-icon">🔌</div>
                <span>Eklenti Yönetimi</span>
              </button>
              
              <button className="quick-action-btn" onClick={() => window.location.hash = '#/settings'}>
                <div className="quick-action-icon">⚙️</div>
                <span>Ayarlar</span>
              </button>
            </div>
          </div>

          {/* Son Aktiviteler */}
          <div className="recent-activities-section">
            <h2>Son Aktiviteler</h2>
            <div className="activities-list">
              <div className="activity-item">
                <div className="activity-icon">📁</div>
                <div className="activity-content">
                  <div className="activity-title">Yeni proje eklendi</div>
                  <div className="activity-time">2 dakika önce</div>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon">⚙️</div>
                <div className="activity-content">
                  <div className="activity-title">Apache servisi başlatıldı</div>
                  <div className="activity-time">5 dakika önce</div>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon">🔌</div>
                <div className="activity-content">
                  <div className="activity-title">Yeni eklenti yüklendi</div>
                  <div className="activity-time">1 saat önce</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;


