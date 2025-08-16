import React from 'react';
import { useAppInfo } from '../hooks/useAppInfo';
import './Header.css';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { name, version, versionWithName } = useAppInfo();

  return (
    <header className="header">
      <div className="header-left">
        <button 
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Menüyü aç/kapat"
        >
          <span className="menu-icon">☰</span>
        </button>
        
        <div className="breadcrumb">
          <span className="breadcrumb-item">{name}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-item">Dashboard</span>
        </div>
      </div>

      <div className="header-right">
        <div className="system-info">
          <span className="platform-icon" title="Platform: Windows">
            🪟
          </span>
          <span className="version-info" title={versionWithName}>
            v{version}
          </span>
        </div>

        <div className="header-actions">
          <button className="action-button" title="Bildirimler">
            <span className="action-icon">🔔</span>
          </button>
          
          <button className="action-button" title="Ayarlar">
            <span className="action-icon">⚙️</span>
          </button>
          
          <button className="action-button" title="Yardım">
            <span className="action-icon">❓</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;


