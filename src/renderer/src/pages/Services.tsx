import React, { useState, useEffect, useCallback } from 'react';
import './Services.css';
import ServiceInstallModal from '../components/ServiceInstallModal';

interface Service {
  name: string;
  displayName: string;
  description: string;
  type: string;
  port?: number;
  autoStart?: boolean;
  enabled?: boolean;
  installed?: boolean;
  downloadUrl?: string;
  version?: string;
}

interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
  pid?: number;
  port?: number;
  memory?: number;
  cpu?: number;
  uptime?: number;
  lastError?: string;
}

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceStatuses, setServiceStatuses] = useState<Map<string, ServiceStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showAllServices, setShowAllServices] = useState(false);
  const [installModal, setInstallModal] = useState({
    isOpen: false,
    serviceName: '',
    serviceDisplayName: ''
  });

  /** Servisleri yükle */
  const loadServices = useCallback(async () => {
    try {
      const serviceList = await window.kovanAPI.services.list();
      setServices(serviceList);
    } catch (error) {
      console.error('Servisler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Servis durumlarını yükle */
  const loadServiceStatuses = useCallback(async () => {
    if (!services.length) return;

    const statuses = new Map<string, ServiceStatus>();
    await Promise.all(
      services.map(async (service) => {
        try {
          const status = await window.kovanAPI.services.status(service.name);
          statuses.set(service.name, status);
        } catch (error) {
          console.warn(`${service.name} durumu alınamadı.`, error);
          statuses.set(service.name, { name: service.name, status: 'stopped' });
        }
      })
    );

    setServiceStatuses(statuses);
  }, [services]);

  /** İlk yükleme ve event dinleme */
  useEffect(() => {
    let interval: number;

    const init = async () => {
      await loadServices();
      await loadServiceStatuses();

      // periyodik refresh - daha uzun aralık (10 saniye)
      interval = setInterval(loadServiceStatuses, 10000);
    };

    const handleServiceStatusUpdate = (serviceName: string, status: ServiceStatus) => {
      setServiceStatuses((prev) => {
        const newMap = new Map(prev);
        newMap.set(serviceName, status);
        return newMap;
      });
    };

    init();
    window.kovanAPI.on('service-status-updated', handleServiceStatusUpdate);

    return () => {
      clearInterval(interval);
      window.kovanAPI.off('service-status-updated');
    };
  }, [loadServices, loadServiceStatuses]);

  /** Servis kontrol işlemleri */
  const handleStartService = async (serviceName: string) => {
    try {
      await window.kovanAPI.services.start(serviceName);
    } catch (error) {
      console.error('Servis başlatılırken hata:', error);
      alert('Servis başlatılırken hata oluştu: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleStopService = async (serviceName: string) => {
    try {
      await window.kovanAPI.services.stop(serviceName);
    } catch (error) {
      console.error('Servis durdurulurken hata:', error);
      alert('Servis durdurulurken hata oluştu: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  /** Modal işlemleri */
  const handleDownloadService = (serviceName: string) => {
    const service = services.find(s => s.name === serviceName);
    if (service) {
      setInstallModal({ isOpen: true, serviceName: service.name, serviceDisplayName: service.displayName });
    }
  };

  const handleModalDownload = async (serviceName: string) => {
    try {
      return await (window.kovanAPI.services as any).download(serviceName);
    } catch (error) {
      console.error('Servis indirme hatası:', error);
      return { success: false, message: `Servis indirme hatası: ${String(error)}` };
    }
  };

  const handleModalInstall = async (serviceName: string, installerPath: string) => {
    try {
      const result = await (window.kovanAPI.services as any).install(serviceName, installerPath);
      if (result.success) {
        await loadServices();
      }
      return result;
    } catch (error) {
      console.error('Servis kurulum hatası:', error);
      return { success: false, message: `Servis kurulum hatası: ${String(error)}` };
    }
  };

  const closeInstallModal = () => setInstallModal({ isOpen: false, serviceName: '', serviceDisplayName: '' });

  /** Skeleton Loading Component */
  const ServiceSkeleton = () => (
    <div className="skeleton-card">
      <div className="skeleton-header">
        <div className="service-info">
          <div className="skeleton skeleton-icon"></div>
          <div>
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-description"></div>
            <div className="skeleton skeleton-version"></div>
          </div>
        </div>
        <div className="skeleton skeleton-status"></div>
      </div>
      <div className="skeleton-meta">
        <div className="skeleton skeleton-meta-item"></div>
        <div className="skeleton skeleton-meta-item"></div>
        <div className="skeleton skeleton-meta-item"></div>
      </div>
      <div className="skeleton-actions">
        <div className="skeleton skeleton-button"></div>
        <div className="skeleton skeleton-badge"></div>
      </div>
    </div>
  );

  /** Yardımcı UI fonksiyonları */
  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'web': return '🌐';
      case 'database': return '🗄️';
      case 'cache': return '⚡';
      default: return '🔧';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'var(--color-success)';
      case 'stopped': return 'var(--color-text-tertiary)';
      case 'starting':
      case 'stopping': return 'var(--color-warning)';
      case 'error': return 'var(--color-danger)';
      default: return 'var(--color-text-tertiary)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return 'Çalışıyor';
      case 'stopped': return 'Durduruldu';
      case 'starting': return 'Başlatılıyor';
      case 'stopping': return 'Durduruluyor';
      case 'error': return 'Hata';
      default: return 'Bilinmiyor';
    }
  };

  const installedServices = services.filter(s => s.installed);
  const uninstalledServices = services.filter(s => !s.installed);

  return (
    <div className="services-page">
      <div className="services-header">
        <h1>Servisler</h1>
        <div className="services-actions">
          <button className="btn btn-secondary" onClick={() => setShowAllServices(!showAllServices)}>
            {showAllServices ? 'Sadece Yüklü Servisleri Göster' : 'Tüm Servisleri Göster'}
          </button>
          <button className="btn btn-primary" onClick={() => {
            installedServices.forEach(service => {
              if (service.autoStart && service.enabled) {
                handleStartService(service.name);
              }
            });
          }}>
            Otomatik Servisleri Başlat
          </button>
        </div>
      </div>

      {loading ? (
        <div className="services-section">
          <h2>Yüklü Servisler</h2>
          <div className="services-grid">
            {[1, 2, 3, 4].map((index) => (
              <ServiceSkeleton key={index} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Yüklü Servisler */}
          {installedServices.length > 0 && (
            <div className="services-section">
              <h2>Yüklü Servisler</h2>
              <div className="services-grid">
                {installedServices.map((service) => {
                  const status = serviceStatuses.get(service.name);
                  const isRunning = status?.status === 'running';

                  return (
                    <div key={service.name} className="service-card">
                      <div className="service-header">
                        <div className="service-info">
                          <span className="service-icon">{getServiceIcon(service.type)}</span>
                          <div>
                            <h3>{service.displayName}</h3>
                            <p className="service-description">{service.description}</p>
                            {service.version && <span className="service-version">v{service.version}</span>}
                          </div>
                        </div>
                        <div className="service-status">
                          <span className="status-indicator" style={{ backgroundColor: getStatusColor(status?.status || 'stopped') }} />
                          <span className="status-text">{getStatusText(status?.status || 'stopped')}</span>
                        </div>
                      </div>

                      <div className="service-details">
                        <div className="service-meta">
                          <span className="service-type">{service.type}</span>
                          {service.port && <span className="service-port">Port: {service.port}</span>}
                          {status?.pid && <span className="service-pid">PID: {status.pid}</span>}
                        </div>

                        {status?.memory && (
                          <div className="service-metrics">
                            <span>RAM: {Math.round(status.memory / 1024 / 1024)}MB</span>
                            {status.cpu && <span>CPU: {status.cpu.toFixed(1)}%</span>}
                          </div>
                        )}

                        {status?.lastError && <div className="service-error"><span>Hata: {status.lastError}</span></div>}
                      </div>

                      <div className="service-actions">
                        {isRunning ? (
                          <button className="btn btn-danger" onClick={() => handleStopService(service.name)} disabled={status?.status === 'stopping'}>
                            {status?.status === 'stopping' ? 'Durduruluyor...' : 'Durdur'}
                          </button>
                        ) : (
                          <button className="btn btn-primary" onClick={() => handleStartService(service.name)} disabled={status?.status === 'starting'}>
                            {status?.status === 'starting' ? 'Başlatılıyor...' : 'Başlat'}
                          </button>
                        )}
                        {service.autoStart && <span className="auto-start-badge">Otomatik Başlat</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kurulabilir Servisler */}
          {showAllServices && uninstalledServices.length > 0 && (
            <div className="services-section">
              <h2>Kurulabilir Servisler</h2>
              <div className="services-grid">
                {uninstalledServices.map((service) => (
                  <div key={service.name} className="service-card service-card-uninstalled">
                    <div className="service-header">
                      <div className="service-info">
                        <span className="service-icon">{getServiceIcon(service.type)}</span>
                        <div>
                          <h3>{service.displayName}</h3>
                          <p className="service-description">{service.description}</p>
                          {service.version && <span className="service-version">v{service.version}</span>}
                        </div>
                      </div>
                      <div className="service-status">
                        <span className="status-indicator" style={{ backgroundColor: 'var(--color-text-tertiary)' }} />
                        <span className="status-text">Yüklü Değil</span>
                      </div>
                    </div>

                    <div className="service-details">
                      <div className="service-meta">
                        <span className="service-type">{service.type}</span>
                        {service.port && <span className="service-port">Port: {service.port}</span>}
                      </div>
                    </div>

                    <div className="service-actions">
                      <button className="btn btn-primary" onClick={() => handleDownloadService(service.name)}>
                        📦 Kur
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Boş state */}
          {installedServices.length === 0 && !showAllServices && (
            <div className="services-empty">
              <div className="empty-state">
                <span className="empty-icon">🔧</span>
                <h3>Henüz Hiç Servis Yüklü Değil</h3>
                <p>Geliştirme ortamınız için servisleri indirip kurabilirsiniz.</p>
                <button className="btn btn-primary" onClick={() => setShowAllServices(true)}>
                  Servisleri Görüntüle
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <ServiceInstallModal
        isOpen={installModal.isOpen}
        onClose={closeInstallModal}
        serviceName={installModal.serviceName}
        serviceDisplayName={installModal.serviceDisplayName}
        onDownload={handleModalDownload}
        onInstall={handleModalInstall}
      />
    </div>
  );
};

export default Services;
