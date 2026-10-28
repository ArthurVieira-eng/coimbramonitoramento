import React, { useState } from 'react';
import logoImg from '../assets/logo.png';

export default function LoginScreen({ perfil, setPerfil, onLogin }) {
  const [outraDeficiencia, setOutraDeficiencia] = useState('');
  const [erroValidacao, setErroValidacao] = useState('');

  const falar = (texto) => {
    if ('speechSynthesis' in window && perfil.tipologias?.includes('Deficiência visual')) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'pt-PT';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleTipologiaChange = (tipo) => {
    let atualizadas = perfil.tipologias || [];
    let estaMarcado = atualizadas.includes(tipo);

    if (estaMarcado) {
      atualizadas = atualizadas.filter((t) => t !== tipo);
      falar(`${tipo} desmarcado`);
    } else {
      atualizadas = [...atualizadas, tipo];
      falar(`${tipo} selecionado`);
    }
    setPerfil({ ...perfil, tipologias: atualizadas });
  };

  // Função Regex para validar formato real de e-mail (ex: nome@dominio.com)
  const validarEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).trim().toLowerCase());
  };

  const tentarEntrar = () => {
    // 1. Validação de campos vazios base
    if (!perfil.nome || !perfil.email) {
      setErroValidacao("Por favor, preencha o Nome Completo e o E-mail.");
      falar("Por favor, preencha o nome e o e-mail.");
      return;
    }

    // 2. Validação estrita do formato de e-mail
    if (!validarEmail(perfil.email)) {
      setErroValidacao("Por favor, introduza um e-mail válido (ex: seu.email@exemplo.com).");
      falar("E-mail inválido. Por favor, corrija o e-mail.");
      return;
    }

    // 3. Validação de categoria
    if (!perfil.categoria) {
      setErroValidacao("Por favor, selecione a sua categoria.");
      falar("Por favor, selecione a sua categoria.");
      return;
    }

    // 4. Validação de tutor
    if (perfil.categoria === 'tutor' && !perfil.nomeRepresentado) {
      setErroValidacao("Por favor, indique o nome da pessoa que representa.");
      falar("Por favor, indique o nome da pessoa representada.");
      return;
    }

    setErroValidacao('');
    falar("A entrar na aplicação");
    onLogin();
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        
        <div style={{ textAlign: 'center', marginBottom: 15 }}>
          <img 
            src={logoImg} 
            alt="AccessCity Logo" 
            style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain' }} 
          />
        </div>

        <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Registo de Acessibilidade</p>

        {erroValidacao && (
          <div style={{ backgroundColor: '#FFF5F5', color: '#E53E3E', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 15, fontWeight: 'bold' }}>
            {erroValidacao}
          </div>
        )}

        <div style={{ textAlign: 'left', marginBottom: 12 }}>
          <label style={labelStyle}>Nome Completo *</label>
          <input 
            type="text" 
            value={perfil.nome} 
            onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
            onFocus={() => falar("A introduzir Nome Completo")}
            placeholder="O seu nome"
            style={inputStyle}
          />
        </div>

        <div style={{ textAlign: 'left', marginBottom: 15 }}>
          <label style={labelStyle}>E-mail *</label>
          <input 
            type="email" 
            value={perfil.email} 
            onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
            onFocus={() => falar("A introduzir E-mail")}
            placeholder="seu.email@exemplo.com"
            style={inputStyle}
          />
        </div>

        <div style={{ textAlign: 'left', marginBottom: 15 }}>
          <label style={labelStyle}>Categoria *</label>
          <select 
            value={perfil.categoria} 
            onChange={(e) => {
              setPerfil({ ...perfil, categoria: e.target.value });
              falar(`Categoria selecionada: ${e.target.options[e.target.selectedIndex].text}`);
            }}
            style={inputStyle}
          >
            <option value="">Selecione a sua categoria...</option>
            <option value="pcd">Sou pessoa com deficiência</option>
            <option value="tutor">Sou tutor de uma pessoa com deficiência</option>
            <option value="apoiante">Sou apoiante da causa!</option>
          </select>
        </div>

        {perfil.categoria === 'tutor' && (
          <div style={{ textAlign: 'left', marginBottom: 15 }}>
            <label style={labelStyle}>Nome da pessoa que represento *</label>
            <input 
              type="text" 
              value={perfil.nomeRepresentado || ''} 
              onChange={(e) => setPerfil({ ...perfil, nomeRepresentado: e.target.value })}
              onFocus={() => falar("A introduzir Nome da pessoa representada")}
              placeholder="Nome do representado"
              style={inputStyle}
            />
          </div>
        )}

        {perfil.categoria === 'pcd' && (
          <div style={{ textAlign: 'left', marginBottom: 15, backgroundColor: '#F0F8FF', padding: 12, borderRadius: 8 }}>
            <label style={{ ...labelStyle, color: '#00A8FF' }}>Tipologia de deficiência (pode marcar várias):</label>
            {[
              'Deficiência física',
              'Deficiência auditiva',
              'Deficiência visual',
              'Deficiência intelectual'
            ].map((tipo) => (
              <label key={tipo} style={{ display: 'block', fontSize: 13, margin: '5px 0', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={(perfil.tipologias || []).includes(tipo)}
                  onChange={() => handleTipologiaChange(tipo)}
                /> {tipo}
              </label>
            ))}

            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 12, color: '#555' }}>Outra:</label>
              <input 
                type="text" 
                value={outraDeficiencia}
                onFocus={() => falar("A introduzir Outra tipologia de deficiência")}
                onChange={(e) => {
                  setOutraDeficiencia(e.target.value);
                  let limpas = (perfil.tipologias || []).filter(t => !t.startsWith('Outra: '));
                  if (e.target.value) limpas.push(`Outra: ${e.target.value}`);
                  setPerfil({ ...perfil, tipologias: limpas });
                }}
                placeholder="Especifique..."
                style={{ ...inputStyle, marginTop: 4, backgroundColor: '#fff' }}
              />
            </div>
          </div>
        )}

        <button onClick={tentarEntrar} style={btnStyle}>
          Entrar na Aplicação
        </button>
      </div>
    </div>
  );
}

const containerStyle = { height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2f5' };
const cardStyle = { backgroundColor: 'white', padding: 25, borderRadius: 16, width: '90%', maxWidth: 380, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'sans-serif' };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 4 };
const inputStyle = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: 14, boxSizing: 'border-box' };
const btnStyle = { width: '100%', padding: 12, borderRadius: 8, border: 'none', backgroundColor: '#00A8FF', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginTop: 10 };