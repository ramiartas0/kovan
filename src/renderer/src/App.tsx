import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Services from './pages/Services';
import Plugins from './pages/Plugins';
import Settings from './pages/Settings';
import './App.css';

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Console log'ları başlat
  useEffect(() => {
    if (window.kovanAPI.setupConsoleLogs) {
      window.kovanAPI.setupConsoleLogs();
    }
    
    // Test console log'u
    console.log('Renderer process başlatıldı');
    console.log('Kovan API mevcut:', !!window.kovanAPI);
  }, []);

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="app-main">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/services" element={<Services />} />
            <Route path="/plugins" element={<Plugins />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;

