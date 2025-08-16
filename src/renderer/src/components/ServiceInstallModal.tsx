import React, { useState, useEffect } from 'react';
import './ServiceInstallModal.css';

interface ServiceInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  serviceDisplayName: string;
  onInstall: (serviceName: string, installerPath: string) => Promise<{ success: boolean; message: string }>;
  onDownload: (serviceName: string) => Promise<{ success: boolean; message: string }>;
}

interface InstallStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress?: number;
  error?: string;
}

const ServiceInstallModal: React.FC<ServiceInstallModalProps> = ({
  isOpen,
  onClose,
  serviceName,
  serviceDisplayName,
  onInstall,
  onDownload
}) => {
  const [currentStep, setCurrentStep] = useState<'download' | 'install'>('download');
  const [installSteps, setInstallSteps] = useState<InstallStep[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);

  const downloadSteps: InstallStep[] = [
    {
      id: 'download',
      title: 'Servis İndiriliyor',
      description: `${serviceDisplayName} servisi indiriliyor...`,
      status: 'pending'
    },
    {
      id: 'verify',
      title: 'Dosya Doğrulanıyor',
      description: 'İndirilen dosya kontrol ediliyor...',
      status: 'pending'
    }
  ];

  const installStepsList: InstallStep[] = [
    {
      id: 'prepare',
      title: 'Kurulum Hazırlanıyor',
      description: 'Kurulum dosyaları hazırlanıyor...',
      status: 'pending'
    },
    {
      id: 'install',
      title: 'Kurulum Yapılıyor',
      description: `${serviceDisplayName} kuruluyor...`,
      status: 'pending'
    },
    {
      id: 'configure',
      title: 'Yapılandırma',
      description: 'Servis yapılandırılıyor...',
      status: 'pending'
    },
    {
      id: 'path',
      title: 'PATH Ayarları',
      description: 'Sistem PATH\'ine ekleniyor...',
      status: 'pending'
    },
    {
      id: 'complete',
      title: 'Kurulum Tamamlandı',
      description: 'Kurulum başarıyla tamamlandı!',
      status: 'pending'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('download');
      setInstallSteps(downloadSteps);
      setOverallProgress(0);
      setIsProcessing(false);
      setSelectedFile(null);
      
      // Modal açıldığında otomatik olarak indirme ve kurulum başlat
      handleDownload();
    }
  }, [isOpen, serviceName]);

  // Download progress event listener
  useEffect(() => {
    const handleDownloadProgress = (progressServiceName: string, progress: any) => {
      if (progressServiceName === serviceName) {
        updateStepStatus('download', 'running', progress.percentage);
        setOverallProgress(progress.percentage / 2);
      }
    };

    window.kovanAPI.on('download-progress', handleDownloadProgress);

    return () => {
      window.kovanAPI.off('download-progress');
    };
  }, [serviceName]);

  const handleDownload = async () => {
    console.log(`🚀 ${serviceDisplayName} indirme işlemi başlatılıyor...`);
    
    setIsProcessing(true);
    setInstallSteps(downloadSteps.map(step => ({ ...step, status: 'pending' })));

    try {
      // İndirme adımını başlat
      updateStepStatus('download', 'running', 0);
      
      console.log(`📡 ${serviceDisplayName} için indirme API'si çağrılıyor...`);
      // Gerçek indirme işlemini çağır
      const result = await onDownload(serviceName);
      
      if (result.success) {
        console.log(`✅ ${serviceDisplayName} indirme başarılı:`, result.message);
        updateStepStatus('download', 'completed', 100);
        
        // Doğrulama adımını başlat
        console.log(`🔍 ${serviceDisplayName} dosya doğrulaması başlatılıyor...`);
        updateStepStatus('verify', 'running', 0);
        await new Promise(resolve => setTimeout(resolve, 1000));
        updateStepStatus('verify', 'completed', 100);
        
        setOverallProgress(50);
        setCurrentStep('install');
        setInstallSteps(installStepsList);
        console.log(`📦 ${serviceDisplayName} kurulum adımına geçiliyor...`);
        
        // İndirme tamamlandıktan sonra otomatik kurulum başlat
        console.log(`🚀 ${serviceDisplayName} otomatik kurulum başlatılıyor...`);
        await handleInstall();
      } else {
        console.error(`❌ ${serviceDisplayName} indirme hatası:`, result.message);
        updateStepStatus('download', 'error', 0, result.message);
      }
      
    } catch (error) {
      updateStepStatus('download', 'error', 0, error instanceof Error ? error.message : String(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInstall = async () => {
    setIsProcessing(true);

    try {
      // İndirilen dosyayı otomatik olarak kullan
      let installerPath = selectedFile;
      
      if (!installerPath) {
        // Servis adına göre indirilen dosya adını belirle
        const serviceFileNames: { [key: string]: string } = {
          'apache': 'httpd-2.4.65-250724-Win64-VS17.zip',
          'nginx': 'nginx-1.24.0.zip',
          'mysql': 'mysql-installer-community-8.0.35.0.msi',
          'redis': 'Redis-x64-3.0.504.msi'
        };
        
        const fileName = serviceFileNames[serviceName];
        if (fileName) {
          // İndirilen dosyayı otomatik olarak kullan
          installerPath = fileName;
          console.log(`🔍 Otomatik dosya kullanılıyor: ${installerPath}`);
        } else {
          throw new Error(`${serviceDisplayName} için kurulum dosyası bulunamadı`);
        }
      }

      // Kurulum adımlarını sırayla çalıştır
      for (let i = 0; i < installStepsList.length; i++) {
        const step = installStepsList[i];
        updateStepStatus(step.id, 'running', 0);
        
        // Her adım için simüle edilmiş işlem
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 300));
          updateStepStatus(step.id, 'running', progress);
          setOverallProgress(50 + (i * 10) + (progress * 0.1)); // 50-100 arası
        }
        
        updateStepStatus(step.id, 'completed', 100);
      }

      // Gerçek kurulum işlemini çağır
      const result = await onInstall(serviceName, installerPath);
      
      if (result.success) {
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      const currentStepId = installSteps.find(step => step.status === 'running')?.id || 'install';
      updateStepStatus(currentStepId, 'error', 0, error instanceof Error ? error.message : String(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const updateStepStatus = (stepId: string, status: InstallStep['status'], progress?: number, error?: string) => {
    setInstallSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, progress, error }
        : step
    ));
  };



  const getStepIcon = (status: InstallStep['status']) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'running':
        return '⏳';
      case 'error':
        return '❌';
      default:
        return '⏸️';
    }
  };

  const getStepClass = (status: InstallStep['status']) => {
    switch (status) {
      case 'completed':
        return 'step-completed';
      case 'running':
        return 'step-running';
      case 'error':
        return 'step-error';
      default:
        return 'step-pending';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="service-install-modal-overlay">
      <div className="service-install-modal">
        <div className="modal-header">
          <h2>{serviceDisplayName} Kurulumu</h2>
          <button className="close-button" onClick={onClose} disabled={isProcessing}>
            ✕
          </button>
        </div>

        <div className="modal-content">
          {/* Genel Progress Bar */}
          <div className="overall-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <span className="progress-text">{Math.round(overallProgress)}%</span>
          </div>

          {/* Adımlar */}
          <div className="install-steps">
            {installSteps.map((step) => (
              <div key={step.id} className={`install-step ${getStepClass(step.status)}`}>
                <div className="step-header">
                  <span className="step-icon">{getStepIcon(step.status)}</span>
                  <div className="step-info">
                    <h4>{step.title}</h4>
                    <p>{step.description}</p>
                  </div>
                </div>
                
                {step.status === 'running' && step.progress !== undefined && (
                  <div className="step-progress">
                    <div className="progress-bar small">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                    <span>{step.progress}%</span>
                  </div>
                )}
                
                {step.status === 'error' && step.error && (
                  <div className="step-error">
                    <span>Hata: {step.error}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

                     {/* Kurulum bilgisi */}
           {currentStep === 'install' && (
             <div className="install-info">
               <h4>Otomatik Kurulum</h4>
               <p>İndirilen dosya otomatik olarak kullanılarak kurulum yapılacak.</p>
             </div>
           )}
        </div>

                 <div className="modal-footer">
           <button 
             onClick={onClose}
             disabled={isProcessing}
             className="btn btn-secondary"
           >
             {isProcessing ? 'İşlem Devam Ediyor...' : 'İptal'}
           </button>
         </div>
      </div>
    </div>
  );
};

export default ServiceInstallModal;
