import React, { useState } from 'react';
import { Play, Square, Camera, RefreshCw, LogOut, Volume2, VolumeX, Eye, Settings, X } from 'lucide-react';

const ControlHUD = ({ 
  isTracking, 
  isVoiceActive, 
  highContrast, 
  onToggleVoice, 
  onToggleContrast, 
  onStart, 
  onStop, 
  onOpenModal, 
  onReset, 
  onLogout 
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      {/* BOTÕES FLUTUANTES PRINCIPAIS NA TELA */}
      <div style={floatingContainer}>
        
        {/* BOTÃO DE CONFIGURAÇÕES (ENGRENAGEM) */}
        <button 
          onClick={() => setShowSettings(true)} 
          style={settingsBtn}
          title="Abrir Configurações e Acessibilidade"
        >
          <Settings size={22} color="#2D3748" />
        </button>

        {/* CONTROLO PRINCIPAL: INICIAR OU PAUSAR / REGISTAR */}
        {!isTracking ? (
          <button onClick={onStart} style={{...actionBtn, backgroundColor: '#00A8FF'}}>
            <Play size={20} fill="white" />
            <span style={labelStyle}>Iniciar Percurso</span>
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
            
            {/* REGISTAR OCORRÊNCIA */}
            <button onClick={onOpenModal} style={cameraBtn}>
              <Camera size={28} />
              <span style={labelStyle}>Registar Ocorrência</span>
            </button>

            {/* PAUSAR / PARAR */}
            <button onClick={onStop} style={{...actionBtn, backgroundColor: '#FF4444'}}>
              <Square size={18} fill="white" />
              <span style={labelStyle}>Pausar Monitoramento</span>
            </button>
          </div>
        )}

        {/* BOTÃO SECUNDÁRIO: REINICIAR */}
        <button onClick={onReset} style={miniBtn}>
          <RefreshCw size={16} />
          <span style={{...labelStyle, color: '#666', fontSize: '11px'}}>Reiniciar</span>
        </button>
      </div>

      {/* MODAL DE CONFIGURAÇÕES E ACESSIBILIDADE */}
      {showSettings && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            
            {/* Cabeçalho do Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={20} color="#00A8FF" />
                <h3 style={{ margin: 0, fontSize: '18px', color: '#1A202C' }}>Configurações</h3>
              </div>
              <button 
                onClick={() => setShowSettings(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} color="#A0AEC0" />
              </button>
            </div>

            {/* Seção de Acessibilidade */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096', textTransform: 'uppercase' }}>
                Acessibilidade
              </span>

              {/* Ativar/Desativar Voz */}
              <button 
                onClick={onToggleVoice} 
                style={{
                  ...settingOptionBtn,
                  backgroundColor: isVoiceActive ? '#EBF8FF' : '#F7FAFC',
                  border: isVoiceActive ? '2px solid #00A8FF' : '1px solid #E2E8F0',
                  color: isVoiceActive ? '#00A8FF' : '#4A5568'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isVoiceActive ? <Volume2 size={20} color="#00A8FF" /> : <VolumeX size={20} color="#718096" />}
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>Comandos e Leitura por Voz</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                  {isVoiceActive ? 'ATIVO' : 'DESATIVADO'}
                </span>
              </button>

              {/* Alternar Alto Contraste */}
              <button 
                onClick={onToggleContrast} 
                style={{
                  ...settingOptionBtn,
                  backgroundColor: highContrast ? '#1A202C' : '#F7FAFC',
                  border: highContrast ? '2px solid #000' : '1px solid #E2E8F0',
                  color: highContrast ? '#FFF' : '#4A5568'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Eye size={20} color={highContrast ? '#FFF' : '#718096'} />
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>Alto Contraste</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                  {highContrast ? 'ATIVO' : 'DESATIVADO'}
                </span>
              </button>
            </div>

            {/* Seção da Conta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096', textTransform: 'uppercase' }}>
                Sessão
              </span>

              {/* Botão de Sair */}
              <button 
                onClick={() => {
                  setShowSettings(false);
                  onLogout();
                }} 
                style={{
                  ...settingOptionBtn,
                  backgroundColor: '#FFF5F5',
                  border: '1px solid #FEB2B2',
                  color: '#E53E3E'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <LogOut size={20} color="#E53E3E" />
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>Sair da Conta</span>
                </div>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

// --- ESTILOS ---
const floatingContainer = { 
  position: 'absolute', 
  bottom: '40px', 
  right: '20px', 
  zIndex: 1000, 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '12px', 
  alignItems: 'flex-end'
};

const settingsBtn = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '46px',
  height: '46px',
  borderRadius: '50%',
  border: '1px solid #E2E8F0',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  cursor: 'pointer',
  transition: 'transform 0.2s'
};

const actionBtn = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '10px', 
  padding: '12px 22px', 
  borderRadius: '30px', 
  border: 'none', 
  color: 'white', 
  boxShadow: '0 4px 15px rgba(0,0,0,0.3)', 
  cursor: 'pointer',
  transition: 'transform 0.2s'
};

const cameraBtn = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '10px', 
  padding: '15px 25px', 
  borderRadius: '35px', 
  border: 'none', 
  backgroundColor: '#00A8FF', 
  color: 'white', 
  boxShadow: '0 6px 20px rgba(0,168,255,0.4)', 
  cursor: 'pointer',
  fontWeight: 'bold'
};

const miniBtn = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '8px', 
  padding: '8px 14px', 
  borderRadius: '20px', 
  border: '1px solid #E2E8F0', 
  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
  color: '#666', 
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)', 
  cursor: 'pointer' 
};

const labelStyle = { 
  fontSize: '14px', 
  fontWeight: '600',
  whiteSpace: 'nowrap'
};

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  zIndex: 2000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px'
};

const modalContentStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '20px',
  padding: '24px',
  width: '100%',
  maxWidth: '360px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  fontFamily: 'sans-serif'
};

const settingOptionBtn = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 16px',
  borderRadius: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  width: '100%',
  boxSizing: 'border-box'
};

export default ControlHUD;