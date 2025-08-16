import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Services from './pages/Services';
import Plugins from './pages/Plugins';
import Settings from './pages/Settings';
import { useAppInfo } from './hooks/useAppInfo';
import './App.css';

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [accentColor, setAccentColor] = useState('#f59e0b');
  const [compactMode, setCompactMode] = useState(false);

  const { name, version, fullName } = useAppInfo();

  // Console log'ları başlat
  useEffect(() => {
    if (window.kovanAPI.setupConsoleLogs) {
      window.kovanAPI.setupConsoleLogs();
    }
    
    // Test console log'u
    console.log('Renderer process başlatıldı');
    console.log('Kovan API mevcut:', !!window.kovanAPI);
    console.log('Uygulama Versiyonu:', version);
  }, [version]);

  // Tema ayarlarını yükle
  useEffect(() => {
    const loadThemeSettings = async () => {
      try {
        const settings = await window.kovanAPI.settings.get();
        if (settings.appearance) {
          setTheme(settings.appearance.theme || 'dark');
          setAccentColor(settings.appearance.accentColor || '#667eea');
          setCompactMode(settings.appearance.compactMode || false);
        }
      } catch (error) {
        console.error('Tema ayarları yüklenirken hata:', error);
      }
    };

    loadThemeSettings();
  }, []);

  // Tema değişikliklerini uygula
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-compact', compactMode.toString());
    
    // Vurgu rengini CSS değişkeni olarak ayarla
    document.documentElement.style.setProperty('--color-primary', accentColor);
    document.documentElement.style.setProperty('--color-primary-dark', accentColor);
  }, [theme, accentColor, compactMode]);

  return (
    <div className="app">
      {/* Özel Title Bar */}
      <div className="title-bar">
        <div className="title-bar-left">
          <div className="title-bar-icon">K</div>
          <span className="title-bar-text">{fullName}</span>
        </div>
        <div className="title-bar-controls">
          <button 
            className="window-control-btn minimize" 
            onClick={() => window.kovanAPI?.window?.minimize()}
            title="Küçült"
          >
            ─
          </button>
          <button 
            className="window-control-btn maximize" 
            onClick={() => window.kovanAPI?.window?.maximize()}
            title="Büyült"
          >
            □
          </button>
          <button 
            className="window-control-btn close" 
            onClick={() => window.kovanAPI?.window?.close()}
            title="Kapat"
          >
            ×
          </button>
        </div>
      </div>
      
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="app-main">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/plugins" element={<Plugins />} />
            <Route path="/services" element={<Services />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;

