import React, { useState } from 'react';

export default function LoginScreen({ perfil, setPerfil, onLogin }) {
  const [outraDeficiencia, setOutraDeficiencia] = useState('');

  const handleTipologiaChange = (tipo) => {
    let atualizadas = perfil.tipologias || [];
    if (atualizadas.includes(tipo)) {
      atualizadas = atualizadas.filter((t) => t !== tipo);
    } else {
      atualizadas = [...atualizadas, tipo];
    }
    setPerfil({ ...perfil, tipologias: atualizadas });
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={{ color: '#00A8FF', marginBottom: 5 }}>AccessCity</h2>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Registo de Acessibilidade</p>

        {/* Tópico 3: Nome & Email */}
        <div style={{ textAlign: 'left', marginBottom: 12 }}>
          <label style={labelStyle}>Nome Completo *</label>
          <input 
            type="text" 
            value={perfil.nome} 
            onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
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
            placeholder="seu.email@exemplo.com"
            style={inputStyle}
          />
        </div>

        {/* Tópico 6.1: Seleção de Perfil */}
        <div style={{ textAlign: 'left', marginBottom: 15 }}>
          <label style={labelStyle}>Categoria *</label>
          <select 
            value={perfil.categoria} 
            onChange={(e) => setPerfil({ ...perfil, categoria: e.target.value })}
            style={inputStyle}
          >
            <option value="">Selecione a sua categoria...</option>
            <option value="pcd">Sou pessoa com deficiência</option>
            <option value="tutor">Sou tutor de uma pessoa com deficiência</option>
            <option value="apoiante">Sou apoiante da causa!</option>
          </select>
        </div>

        {/* Se for Tutor */}
        {perfil.categoria === 'tutor' && (
          <div style={{ textAlign: 'left', marginBottom: 15 }}>
            <label style={labelStyle}>Nome da pessoa que represento *</label>
            <input 
              type="text" 
              value={perfil.nomeRepresentado || ''} 
              onChange={(e) => setPerfil({ ...perfil, nomeRepresentado: e.target.value })}
              placeholder="Nome do representado"
              style={inputStyle}
            />
          </div>
        )}

        {/* Tópico 6.2: Tipologia de Deficiência (Se 'pcd') */}
        {perfil.categoria === 'pcd' && (
          <div style={{ textAlign: 'left', marginBottom: 15, backgroundColor: '#F0F8FF', padding: 12, borderRadius: 8 }}>
            <label style={{ ...labelStyle, color: '#00A8FF' }}>Tipologia de deficiência (pode marcar várias):</label>
            {[
              'Deficiência física',
              'Deficiência auditiva',
              'Deficiência visual',
              'Deficiência intelectual'
            ].map((tipo) => (
              <label key={tipo} style={{ display: 'block', fontSize: 13, margin: '5px 0' }}>
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

        <button onClick={onLogin} style={btnStyle}>
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