import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map as MapIcon, List, LogOut, Menu, X } from 'lucide-react';
import logo from '../assets/logo.png';

export default function AdminLayout() {
  const isAuthenticated = localStorage.getItem('adminToken') === 'true';
  const navigate = useNavigate();
  
  // Estado para controlar se o menu lateral está aberto no celular
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Estado para identificar se a tela atual é de um dispositivo móvel
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Monitora o redimensionamento da tela para ajustar o comportamento
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsMobileMenuOpen(false); // Fecha o menu se a tela aumentar
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F8FAFC', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* Sidebar Overlay (Fundo escurecido ao abrir o menu no celular) */}
      {isMobile && isMobileMenuOpen && (
        <div 
          onClick={toggleMobileMenu}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 998 }}
        />
      )}

      {/* Sidebar */}
      <div style={{ 
        width: '250px', 
        backgroundColor: '#FFFFFF', 
        color: '#334155', 
        display: 'flex', 
        flexDirection: 'column', 
        borderRight: '1px solid #E2E8F0',
        // Estilos responsivos cruciais:
        position: isMobile ? 'fixed' : 'relative',
        height: '100vh',
        zIndex: 999,
        transition: 'transform 0.3s ease',
        transform: isMobile ? (isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)'
      }}>
        <div style={{ padding: '20px', fontSize: '18px', fontWeight: 'bold', borderBottom: '1px solid #E2E8F0', textAlign: 'center', position: 'relative' }}>
          {/* Botão de fechar visível apenas no celular */}
          {isMobile && (
            <button onClick={toggleMobileMenu} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
              <X size={24} />
            </button>
          )}
          <img src={logo} alt="Primeiro Aqui ao Lado" style={{ height: '60px', marginBottom: '10px' }} />
          <div style={{ color: '#010615' }}>Primeiro Aqui ao Lado</div>
          <span style={{ color: '#00A8FF', fontSize: '14px', marginTop: '5px', display: 'block' }}>Área Admin</span>
        </div>
        <nav style={{ flex: 1, padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <NavItem to="/admin" icon={<LayoutDashboard size={20} />} label="Dashboard" end onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem to="/admin/mapa" icon={<MapIcon size={20} />} label="Mapa de Calor" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem to="/admin/ocorrencias" icon={<List size={20} />} label="Ocorrências" onClick={() => setIsMobileMenuOpen(false)} />
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
        {/* Topbar */}
        <header style={{ 
          height: '60px', 
          backgroundColor: 'white', 
          borderBottom: '1px solid #E2E8F0', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isMobile ? 'space-between' : 'flex-end', 
          padding: '0 20px' 
        }}>
          {/* Menu Hambúrguer visível apenas no celular */}
          {isMobile && (
            <button 
              onClick={toggleMobileMenu} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', display: 'flex', alignItems: 'center', padding: '5px' }}
            >
              <Menu size={24} />
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#00A8FF', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              A
            </div>
            <span style={{ fontWeight: 'bold', color: '#334155' }}>Administrador</span>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: isMobile ? '15px' : '20px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label, end, onClick }) {
  return (
    <NavLink 
      to={to} 
      end={end}
      onClick={onClick}
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