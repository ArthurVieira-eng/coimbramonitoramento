import React, { useRef } from 'react';
import { Camera, X } from 'lucide-react';

const OccurrenceModal = ({ tempPhoto, setTempPhoto, categoria, setCategoria, texto, setTexto, onSave, onClose }) => {
  const fileRef = useRef(null);

  return (
    <div style={overlay}>
      <div style={modalStyle}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom: 15}}>
          <h3 style={{margin:0, color:'#00A8FF'}}>Registrar Barreira</h3>
          <X onClick={onClose} style={{cursor:'pointer'}} />
        </div>

        <div style={{maxHeight: '60vh', overflowY: 'auto'}}>
          <div onClick={() => fileRef.current.click()} style={dropzone}>
            {tempPhoto ? <img src={tempPhoto} style={{width:'100%', borderRadius:8}} /> : <Camera size={30} />}
            <input type="file" accept="image/*" capture="camera" ref={fileRef} hidden onChange={e => {
              const reader = new FileReader();
              reader.onload = () => setTempPhoto(reader.result);
              reader.readAsDataURL(e.target.files[0]);
            }} />
          </div>

          <div style={tagGrid}>
            {["Buraco", "Degrau", "Rampa", "Calçada"].map(t => (
              <button key={t} onClick={() => setCategoria(t)} style={{...tagBtn, backgroundColor: categoria === t ? '#00A8FF' : '#FFF', color: categoria === t ? '#FFF' : '#00A8FF'}}>
                {t}
              </button>
            ))}
          </div>

          <textarea style={inputStyle} placeholder="Observações..." value={texto} onChange={e => setTexto(e.target.value)} />
          <button onClick={onSave} style={saveBtn} disabled={!tempPhoto}>SALVAR REGISTRO</button>
        </div>
      </div>
    </div>
  );
};

// Estilos (Overlay, Modal, Dropzone, TagGrid, etc. - iguais aos anteriores mas movidos para cá)
const overlay = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
const modalStyle = { backgroundColor: 'white', borderRadius: 20, width: '100%', maxWidth: 360, padding: 20 };
const dropzone = { border: '2px dashed #00A8FF', height: 120, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 15, overflow:'hidden' };
const tagGrid = { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 15 };
const tagBtn = { padding: '8px 12px', borderRadius: 10, border: '1px solid #00A8FF', fontSize: 12, fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: 12, marginBottom: 10, borderRadius: 10, border: '1px solid #DDD' };
const saveBtn = { width: '100%', backgroundColor: '#00A8FF', color: 'white', border: 'none', padding: 15, borderRadius: 10, fontWeight: 'bold' };

export default OccurrenceModal;