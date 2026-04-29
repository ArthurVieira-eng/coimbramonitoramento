import React from 'react';
import logoImg from '../assets/logo.png'; 

const LoginScreen = ({ perfil, setPerfil, onLogin }) => (
  <div style={containerStyle}>
    <div style={cardStyle}>
      {/* CORREÇÃO AQUI: src={logoImg} */}
      <img src={logoImg} alt="Logo do Projeto" style={logoStyle} />
      
      <h2 style={{ color: '#00A8FF', marginBottom: '5px' }}>Primeiro Aqui ao Lado</h2>
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

// Estilos internos (Adicionado logoStyle)
const logoStyle = { width: '120px', height: 'auto', marginBottom: '15px', display: 'block', margin: '0 auto' };
const containerStyle = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F8FF', fontFamily: 'sans-serif' };
const cardStyle = { backgroundColor: 'white', padding: '35px', borderRadius: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', width: '85%', maxWidth: '350px' };
const inputStyle = { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #DDD', boxSizing: 'border-box', fontSize: '16px' };
const mainBtn = { width: '100%', backgroundColor: '#00A8FF', color: 'white', border: 'none', padding: '16px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' };

export default LoginScreen;