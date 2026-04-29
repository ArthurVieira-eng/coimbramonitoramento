import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // MVP Authentication
    if (email === 'admin@admin.com' && password === 'admin123') {
      localStorage.setItem('adminToken', 'true');
      navigate('/admin');
    } else {
      setError('Credenciais inválidas. Tente admin@admin.com / admin123');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F8FF', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <img src={logo} alt="Primeiro Aqui ao Lado" style={{ height: '80px', marginBottom: '10px' }} />
        <h2 style={{ color: '#00A8FF', marginBottom: '10px', fontSize: '22px' }}>Primeiro Aqui ao Lado</h2>
        <p style={{ color: '#666', marginBottom: '30px' }}>Acesso Restrito Admin</p>
        
        <form onSubmit={handleLogin}>
          <input 
            type="text" 
            placeholder="E-mail" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle} 
          />
          <input 
            type="password" 
            placeholder="Senha" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle} 
          />
          {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '15px' }}>{error}</p>}
          <button type="submit" style={btnStyle}>ENTRAR</button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '15px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #DDD', boxSizing: 'border-box', fontSize: '16px' };
const btnStyle = { width: '100%', padding: '15px', backgroundColor: '#00A8FF', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' };
