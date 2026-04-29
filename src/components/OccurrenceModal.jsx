import React, { useRef } from 'react';
import { Camera, X } from 'lucide-react';

// Adicionei 'isSaving' nas props aqui embaixo
const OccurrenceModal = ({ tempPhoto, setTempPhoto, categoria, setCategoria, texto, setTexto, onSave, onClose, isSaving }) => {
  const fileRef = useRef(null);

  return (
    <div style={overlay}>
      <div style={modalStyle}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom: 15}}>
          <h3 style={{margin:0, color:'#00A8FF'}}>Registrar Barreira</h3>
          {/* Desativar o X enquanto salva para evitar que ela feche no meio do envio */}
          {!isSaving && <X onClick={onClose} style={{cursor:'pointer'}} />}
        </div>

        <div style={{maxHeight: '60vh', overflowY: 'auto'}}>
          <div onClick={() => !isSaving && fileRef.current.click()} style={dropzone}>
            {tempPhoto ? <img src={tempPhoto} style={{width:'100%', borderRadius:8}} /> : <Camera size={30} />}
            <input type="file" accept="image/*" capture="camera" ref={fileRef} hidden onChange={e => {
              const reader = new FileReader();
              reader.onload = () => setTempPhoto(reader.result);
              reader.readAsDataURL(e.target.files[0]);
            }} />
          </div>

          <div style={tagGrid}>
            {["Buraco", "Degrau", "Rampa", "Calçada"].map(t => (
              <button 
                key={t} 
                disabled={isSaving} // Desativa as tags enquanto salva
                onClick={() => setCategoria(t)} 
                style={{...tagBtn, backgroundColor: categoria === t ? '#00A8FF' : '#FFF', color: categoria === t ? '#FFF' : '#00A8FF', opacity: isSaving ? 0.6 : 1}}
              >
                {t}
              </button>
            ))}
          </div>

          <textarea 
            style={inputStyle} 
            placeholder="Observações..." 
            value={texto} 
            disabled={isSaving}
            onChange={e => setTexto(e.target.value)} 
          />

          {/* MUDANÇA PRINCIPAL NO BOTÃO AQUI ABAIXO */}
          <button 
            onClick={onSave} 
            style={{
                ...saveBtn, 
                backgroundColor: isSaving ? '#CCC' : '#00A8FF', // Fica cinza enquanto envia
                cursor: isSaving ? 'not-allowed' : 'pointer'
            }} 
            disabled={!tempPhoto || isSaving}
          >
            {isSaving ? "ENVIANDO PARA NUVEM..." : "SALVAR REGISTRO"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ... os estilos permanecem os mesmos ...
const overlay = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
const modalStyle = { backgroundColor: 'white', borderRadius: 20, width: '100%', maxWidth: 360, padding: 20 };
const dropzone = { border: '2px dashed #00A8FF', height: 120, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 15, overflow:'hidden' };
const tagGrid = { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 15 };
const tagBtn = { padding: '8px 12px', borderRadius: 10, border: '1px solid #00A8FF', fontSize: 12, fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: 12, marginBottom: 10, borderRadius: 10, border: '1px solid #DDD' };
const saveBtn = { width: '100%', backgroundColor: '#00A8FF', color: 'white', border: 'none', padding: 15, borderRadius: 10, fontWeight: 'bold' };

export default OccurrenceModal;