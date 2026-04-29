import React from 'react';
import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map as MapIcon, List, LogOut } from 'lucide-react';
import logo from '../assets/logo.png';

export default function AdminLayout() {
  const isAuthenticated = localStorage.getItem('adminToken') === 'true';
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F8FAFC', fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: '#FFFFFF', color: '#334155', display: 'flex', flexDirection: 'column', borderRight: '1px solid #E2E8F0' }}>
        <div style={{ padding: '20px', fontSize: '18px', fontWeight: 'bold', borderBottom: '1px solid #E2E8F0', textAlign: 'center' }}>
          <img src={logo} alt="Primeiro Aqui ao Lado" style={{ height: '60px', marginBottom: '10px' }} />
          <div style={{ color: '#010615' }}>Primeiro Aqui ao Lado</div>
          <span style={{ color: '#00A8FF', fontSize: '14px', marginTop: '5px', display: 'block' }}>Área Admin</span>
        </div>
        <nav style={{ flex: 1, padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <NavItem to="/admin" icon={<LayoutDashboard size={20} />} label="Dashboard" end />
          <NavItem to="/admin/mapa" icon={<MapIcon size={20} />} label="Mapa de Calor" />
          <NavItem to="/admin/ocorrencias" icon={<List size={20} />} label="Ocorrências" />
        </nav>
        <div style={{ padding: '20px', borderTop: '1px solid #E2E8F0' }}>
          <button 
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#FF4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', width: '100%', fontWeight: '500' }}
          >
            <LogOut size={20} /> Sair
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ height: '60px', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#00A8FF', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              A
            </div>
            <span style={{ fontWeight: 'bold', color: '#334155' }}>Administrador</span>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label, end }) {
  return (
    <NavLink 
      to={to} 
      end={end}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 20px',
        color: isActive ? '#00A8FF' : '#64748B',
        backgroundColor: isActive ? 'rgba(0, 168, 255, 0.1)' : 'transparent',
        borderRight: isActive ? '3px solid #00A8FF' : '3px solid transparent',
        textDecoration: 'none', fontSize: '15px', fontWeight: isActive ? 'bold' : '500',
        transition: 'all 0.2s'
      })}
    >
      {icon} {label}
    </NavLink>
  );
}
