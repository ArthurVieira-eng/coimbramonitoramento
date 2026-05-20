import React, { useRef, useState } from 'react';
import { Camera, X, Mic, Square, Play, Trash2 } from 'lucide-react';

const OccurrenceModal = ({ tempPhoto, setTempPhoto, categoria, setCategoria, texto, setTexto, onSave, onClose, isSaving, tempAudio, setTempAudio }) => {
  const fileRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  const [isRecording, setIsRecording] = useState(false);

  // FUNÇÃO PARA INICIAR A GRAVAÇÃO DO ÁUDIO REAL
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Converter o Blob de áudio para Base64 para enviar facilmente para o Firebase
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setTempAudio(reader.result); // Guarda o áudio Base64 no componente pai
        };

        // Fechar os canais do microfone para libertar o dispositivo
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Erro ao aceder ao microfone:", err);
      alert("Não foi possível aceder ao microfone. Verifique as permissões.");
    }
  };

  // FUNÇÃO PARA PARAR A GRAVAÇÃO
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Lógica de Validação: Aceita foto, texto OR áudio gravado
  const handleValidationAndSave = () => {
    const temAlgo = tempPhoto || texto.trim().length > 0 || categoria || tempAudio;
    
    if (!temAlgo) {
      alert("Por favor, preencha pelo menos uma informação (foto, áudio, categoria ou observação).");
      return;
    }
    
    onSave(); // Executa o salvamento no ClientApp
  };

  return (
    <div style={overlay}>
      <div style={modalStyle}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom: 15}}>
          <h3 style={{margin:0, color:'#00A8FF'}}>Registar Barreira</h3>
          {!isSaving && <X onClick={onClose} style={{cursor:'pointer'}} />}
        </div>

        <div style={{maxHeight: '60vh', overflowY: 'auto'}}>
          {/* Dropzone da Foto */}
          <div onClick={() => !isSaving && fileRef.current.click()} style={dropzone}>
            {tempPhoto ? <img src={tempPhoto} alt="Preview" style={{width:'100%', borderRadius:8}} /> : <Camera size={30} />}
            <input type="file" accept="image/*" capture="camera" ref={fileRef} hidden onChange={e => {
              if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = () => setTempPhoto(reader.result);
                reader.readAsDataURL(e.target.files[0]);
              }
            }} />
          </div>

          {/* Categorias */}
          <div style={tagGrid}>
            {["Buraco", "Degrau", "Rampa", "Calçada", "Elevador", "Piso", "Outros"].map(t => (
              <button 
                key={t} 
                disabled={isSaving} 
                onClick={() => setCategoria(t)} 
                style={{...tagBtn, backgroundColor: categoria === t ? '#00A8FF' : '#FFF', color: categoria === t ? '#FFF' : '#00A8FF', opacity: isSaving ? 0.6 : 1}}
              >
                {t}
              </button>
            ))}
          </div>

          {/* SEÇÃO DE GRAVAÇÃO DE ÁUDIO REAL */}
          <div style={audioContainer}>
            <p style={{margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: '#555'}}>Relato em Áudio:</p>
            
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              {!tempAudio ? (
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isSaving}
                  style={{
                    ...audioBtn,
                    backgroundColor: isRecording ? '#FF4444' : '#00A8FF',
                    color: 'white'
                  }}
                >
                  {isRecording ? <Square size={18} /> : <Mic size={18} />}
                  {isRecording ? "Parar Gravação" : "Gravar Áudio"}
                </button>
              ) : (
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', width: '100%'}}>
                  {/* Player para o utilizador ouvir o que gravou antes de enviar */}
                  <audio src={tempAudio} controls style={{height: '35px', flex: 1}} />
                  <button 
                    onClick={() => setTempAudio(null)} 
                    style={{background: 'none', border: 'none', color: '#FF4444', cursor: 'pointer'}}
                    title="Apagar áudio"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              )}
            </div>
            {isRecording && <span style={recordingText}>● A gravar o relato...</span>}
          </div>

          {/* Campo de Texto Tradicional Opcional */}
          <div style={{ position: 'relative', marginBottom: 15 }}>
            <textarea 
              style={inputStyle} 
              placeholder="Observações por texto (opcional)..." 
              value={texto} 
              disabled={isSaving}
              onChange={e => setTexto(e.target.value)} 
            />
          </div>

          <button 
            onClick={handleValidationAndSave} 
            style={{
                ...saveBtn, 
                backgroundColor: isSaving ? '#CCC' : '#00A8FF', 
                cursor: isSaving ? 'not-allowed' : 'pointer'
            }} 
            disabled={isSaving}
          >
            {isSaving ? "A ENVIAR PARA A NUVEM..." : "SALVAR REGISTO"}
          </button>
        </div>
      </div>
    </div>
  );
};

const overlay = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
const modalStyle = { backgroundColor: 'white', borderRadius: 20, width: '100%', maxWidth: 360, padding: 20 };
const dropzone = { border: '2px dashed #00A8FF', height: 120, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 15, overflow:'hidden', cursor: 'pointer' };
const tagGrid = { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 15 };
const tagBtn = { padding: '8px 12px', borderRadius: 10, border: '1px solid #00A8FF', fontSize: 12, fontWeight: 'bold', cursor: 'pointer' };
const inputStyle = { width: '100%', padding: 12, marginBottom: 0, borderRadius: 10, border: '1px solid #DDD', minHeight: '60px', fontFamily: 'inherit', resize: 'none' };
const saveBtn = { width: '100%', backgroundColor: '#00A8FF', color: 'white', border: 'none', padding: 15, borderRadius: 10, fontWeight: 'bold' };
const audioContainer = { backgroundColor: '#F9F9F9', padding: '12px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #EEE' };
const audioBtn = { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', width: '100%', justifyContent: 'center' };
const recordingText = { display: 'block', fontSize: '11px', color: '#FF4444', marginTop: '6px', textAlign: 'center', fontWeight: 'bold', animation: 'pulse 1s infinite' };

export default OccurrenceModal;