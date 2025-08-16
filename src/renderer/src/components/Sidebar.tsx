import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const menuItems = [
    {
      path: '/',
      name: 'Dashboard',
      icon: '📊',
      description: 'Ana sayfa ve genel bakış'
    },
    {
      path: '/projects',
      name: 'Projeler',
      icon: '📁',
      description: 'Proje yönetimi'
    },
    {
      path: '/services',
      name: 'Servisler',
      icon: '⚙️',
      description: 'Web sunucuları ve veritabanları'
    },
    {
      path: '/plugins',
      name: 'Eklentiler',
      icon: '🔌',
      description: 'Plugin yönetimi'
    },
    {
      path: '/settings',
      name: 'Ayarlar',
      icon: '⚙️',
      description: 'Uygulama ayarları'
    }
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🚀</span>
          {isOpen && <span className="logo-text">Kovan</span>}
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => (
            <li key={item.path} className="nav-item">
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'active' : ''}`
                }
                title={!isOpen ? item.description : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {isOpen && <span className="nav-text">{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;


