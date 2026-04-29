import React from 'react';
import { Play, Square, Camera, RefreshCw, LogOut } from 'lucide-react';

const ControlHUD = ({ isTracking, onStart, onStop, onOpenModal, onReset, onLogout }) => {
  return (
    <div style={floatingContainer}>
      
      {/* BOTÃO PRINCIPAL: INICIAR OU PAUSAR */}
      {!isTracking ? (
        <button onClick={onStart} style={{...actionBtn, backgroundColor: '#00A8FF'}}>
          <Play size={20} fill="white" />
          <span style={labelStyle}>Iniciar Percurso</span>
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
          
          {/* BOTÃO DE OCORRÊNCIA (CÂMERA) - DESTACADO */}
          <button onClick={onOpenModal} style={cameraBtn}>
            <Camera size={28} />
            <span style={labelStyle}>Registrar Ocorrência</span>
          </button>

          {/* BOTÃO DE PAUSAR/PARAR */}
          <button onClick={onStop} style={{...actionBtn, backgroundColor: '#FF4444'}}>
            <Square size={18} fill="white" />
            <span style={labelStyle}>Pausar Monitoramento</span>
          </button>
        </div>
      )}

      {/* BOTÕES SECUNDÁRIOS: REINICIAR E SAIR */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onLogout} style={miniBtn}>
          <LogOut size={16} color="#FF4444" />
          <span style={{...labelStyle, color: '#FF4444', fontSize: '10px'}}>Sair</span>
        </button>
        <button onClick={onReset} style={miniBtn}>
          <RefreshCw size={16} />
          <span style={{...labelStyle, color: '#666', fontSize: '10px'}}>Reiniciar</span>
        </button>
      </div>
    </div>
  );
};

// --- ESTILOS ---
const floatingContainer = { 
  position: 'absolute', 
  bottom: '100px', // Aumentamos de 30px para 80px para fugir dos botões do sistema
  right: '20px', 
  zIndex: 1000, 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '15px', 
  alignItems: 'flex-end'
};

const actionBtn = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '10px', 
  padding: '10px 20px', 
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
  padding: '8px 15px', 
  borderRadius: '20px', 
  border: 'none', 
  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
  color: '#666', 
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)', 
  cursor: 'pointer' 
};

const labelStyle = { 
  fontSize: '14px', 
  fontWeight: '600',
  whiteSpace: 'nowrap' // Impede que o texto quebre em duas linhas
};

export default ControlHUD;