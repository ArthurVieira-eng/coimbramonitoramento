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
      
      <button onClick={onLogin} style={mainBtn}>ENTRAR NO SISTEMA</button>
    </div>
  </div>
);

// Estilos internos para evitar dependência de CSS externo
const containerStyle = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F8FF', fontFamily: 'sans-serif' };
const cardStyle = { backgroundColor: 'white', padding: '35px', borderRadius: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', width: '85%', maxWidth: '350px' };
const logoCircle = { width: '60px', height: '60px', backgroundColor: '#00A8FF', borderRadius: '18px', margin: '0 auto 15px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' };
const inputStyle = { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #DDD', boxSizing: 'border-box' };
const mainBtn = { width: '100%', backgroundColor: '#00A8FF', color: 'white', border: 'none', padding: '16px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' };

export default LoginScreen;