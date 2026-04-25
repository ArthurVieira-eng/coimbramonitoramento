import React from 'react';

const LoginScreen = ({ perfil, setPerfil, onLogin }) => (
  <div style={containerStyle}>
    <div style={cardStyle}>
      <div style={logoCircle}>AU</div>
      <h2 style={{ color: '#00A8FF', marginBottom: '5px' }}>Auditoria Urbana</h2>
      <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>Acesse o sistema para iniciar</p>
      
      <input 
        style={inputStyle} 
        placeholder="Seu Nome" 
        value={perfil.nome} 
        onChange={e => setPerfil({...perfil, nome: e.target.value})} 
      />
      
      <input 
        style={inputStyle} 
        type="email" 
        placeholder="Seu E-mail" 
        value={perfil.email} 
        onChange={e => setPerfil({...perfil, email: e.target.value})} 
      />

      <div style={{ marginTop: '15px', marginBottom: '25px', textAlign: 'left', width: '100%' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '5px', 
          fontWeight: 'bold', 
          color: '#374151',
          fontSize: '14px'
        }}>
          Você é deficiente?
        </label>
        <select 
          value={perfil.vinculo || ""} 
          onChange={(e) => setPerfil({ ...perfil, vinculo: e.target.value })}
          style={{
            ...inputStyle,
            marginBottom: '0', // Reseta a margem do inputStyle para usar a do container
            backgroundColor: 'white',
            color: perfil.vinculo ? '#000' : '#999',
            outline: 'none',
            appearance: 'none', // Remove estilos padrão de alguns navegadores
            cursor: 'pointer'
          }}
        >
          <option value="" disabled>Clique para selecionar...</option>
          <option value="Sim" style={{ color: '#000' }}>Sim (PCD)</option>
          <option value="Não/Apoiador" style={{ color: '#000' }}>Não / Apoiador</option>
          <option value="Parente" style={{ color: '#000' }}>Parente</option>
        </select>
      </div>
      
      <button onClick={onLogin} style={mainBtn}>ENTRAR NO SISTEMA</button>
    </div>
  </div>
);

// Estilos internos
const containerStyle = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F8FF', fontFamily: 'sans-serif' };
const cardStyle = { backgroundColor: 'white', padding: '35px', borderRadius: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', width: '85%', maxWidth: '350px' };
const logoCircle = { width: '60px', height: '60px', backgroundColor: '#00A8FF', borderRadius: '18px', margin: '0 auto 15px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' };
const inputStyle = { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #DDD', boxSizing: 'border-box', fontSize: '16px' };
const mainBtn = { width: '100%', backgroundColor: '#00A8FF', color: 'white', border: 'none', padding: '16px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' };

export default LoginScreen;