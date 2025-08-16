import React from 'react';
import './Header.css';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
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
          <span className="breadcrumb-item">Kovan</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-item">Dashboard</span>
        </div>
      </div>

      <div className="header-right">
        <div className="system-info">
          <span className="platform-icon" title="Platform: Windows">
            🪟
          </span>
          <span className="version-info" title="Kovan v1.0.0">
            v1.0.0
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


