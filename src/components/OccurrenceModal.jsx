import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Mic } from 'lucide-react';

// Adicionei 'isSaving' nas props aqui embaixo
const OccurrenceModal = ({ tempPhoto, setTempPhoto, categoria, setCategoria, texto, setTexto, onSave, onClose, isSaving }) => {
  const fileRef = useRef(null);
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setTexto(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Erro no reconhecimento de voz:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [setTexto]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

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

          <div style={{ position: 'relative', marginBottom: 10 }}>
            <textarea 
              style={{...inputStyle, marginBottom: 0, paddingRight: 40}} 
              placeholder="Observações (digite ou fale)..." 
              value={texto} 
              disabled={isSaving}
              onChange={e => setTexto(e.target.value)} 
            />
            {recognitionRef.current && (
              <button
                type="button"
                onClick={toggleListen}
                disabled={isSaving}
                title={isListening ? "Parar de ouvir" : "Falar observação"}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: 10,
                  background: 'none',
                  border: 'none',
                  color: isListening ? '#FF4444' : '#00A8FF',
                  cursor: 'pointer',
                  padding: 5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  backgroundColor: isListening ? 'rgba(255, 68, 68, 0.1)' : 'transparent',
                  transition: 'background-color 0.3s'
                }}
              >
                <Mic size={24} />
              </button>
            )}
          </div>

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
const inputStyle = { width: '100%', padding: 12, marginBottom: 10, borderRadius: 10, border: '1px solid #DDD', minHeight: '80px', fontFamily: 'inherit' };
const saveBtn = { width: '100%', backgroundColor: '#00A8FF', color: 'white', border: 'none', padding: 15, borderRadius: 10, fontWeight: 'bold' };

export default OccurrenceModal;