import React, { useState, useEffect, useCallback } from 'react';
import MapDisplay from '../components/MapDisplay';
import ControlHUD from '../components/ControlHUD';
import OccurrenceModal from '../components/OccurrenceModal';
import LoginScreen from '../components/LoginScreen';
import { useGPS } from '../hooks/useGPS';

// IMPORTAÇÃO DO FIREBASE
import { db } from '../firebase'; 
import { ref, push, set } from "firebase/database";

const compressImage = (base64Str, maxWidth = 600, maxHeight = 600) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
      } else {
        if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7)); 
    };
  });
};

export default function ClientApp() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [perfil, setPerfil] = useState({ nome: '', email: '' });
  const [isTracking, setIsTracking] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [showFinishInfo, setShowFinishInfo] = useState(null);

  const [tempPhoto, setTempPhoto] = useState(null);
  const [categoria, setCategoria] = useState("");
  const [texto, setTexto] = useState("");

  const { position, path, setPath, fallbackActive } = useGPS(isRegistered, isTracking);
  const [clickedPosition, setClickedPosition] = useState(null);

  useEffect(() => {
    const p = localStorage.getItem('auditor_perfil');
    if (p) { setPerfil(JSON.parse(p)); setIsRegistered(true); }
    const m = localStorage.getItem('auditor_markers');
    if (m) setMarkers(JSON.parse(m));
    const pt = localStorage.getItem('auditor_path');
    if (pt) setPath(JSON.parse(pt));
  }, [setPath]);

  const handleLogin = () => {
    if (perfil.nome && perfil.email) {
      localStorage.setItem('auditor_perfil', JSON.stringify(perfil));
      setIsRegistered(true);
    } else {
      alert("Por favor, preencha todos os campos.");
    }
  };

  // --- FUNÇÕES QUE ESTAVAM FALTANDO (RESTAURADAS) ---
  const handleReset = () => {
    if(window.confirm("Deseja limpar todos os dados da corrida atual?")) {
      localStorage.removeItem('auditor_path');
      localStorage.removeItem('auditor_markers');
      setPath([]);
      setMarkers([]);
      setIsTracking(false);
      setClickedPosition(null);
      window.location.reload();
    }
  };

  const handleLogout = () => {
    if(window.confirm("Deseja realmente sair? Você precisará fazer login novamente.")) {
      localStorage.removeItem('auditor_perfil');
      setIsRegistered(false);
      setPerfil({ nome: '', email: '' });
    }
  };
  // ------------------------------------------------

  const salvarOcorrencia = useCallback(async () => {
    if (isSaving) return;
    const finalPos = clickedPosition || position;

    if (!finalPos) {
      alert("📍 Localização obrigatória. Aguarde o GPS ou clique no mapa para marcar.");
      return;
    }

    try {
      setIsSaving(true);
      let fotoFinal = null;
      if (tempPhoto) { fotoFinal = await compressImage(tempPhoto); }

      let pais = "Desconhecido", cidade = "Desconhecida", endereco = "Desconhecido";

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${finalPos[0]}&lon=${finalPos[1]}`, {
          headers: { 'Accept-Language': 'pt-PT,pt;q=0.9' }
        });
        const data = await response.json();
        if (data && data.address) {
          pais = data.address.country || "Desconhecido";
          cidade = data.address.city || data.address.town || data.address.village || "Desconhecida";
          endereco = data.address.road || data.display_name || "Desconhecido";
        }
      } catch (err) { console.error(err); }

      const nova = { 
        pos: finalPos,
        latitude: finalPos[0],
        longitude: finalPos[1],
        pais, cidade, endereco,
        categoria: categoria || "Geral", 
        detalhes: texto || "", 
        foto: fotoFinal,
        autor: perfil.nome || "Utilizador Anónimo",
        emailAutor: perfil.email,
        timestamp: new Date().getTime(),
        horario: new Date().toLocaleString('pt-PT'),
      };

      const ocorrenciasRef = ref(db, 'ocorrencias');
      await set(push(ocorrenciasRef), nova);
      
      const ocorrenciasNaMesmaRua = markers.filter(m => m.endereco === endereco).length + 1;

      setShowFinishInfo({
        endereco: endereco,
        contagem: ocorrenciasNaMesmaRua
      });

      const lista = [...markers, nova];
      setMarkers(lista);
      localStorage.setItem('auditor_markers', JSON.stringify(lista));
      
      setShowModal(false); 
      setTempPhoto(null); setCategoria(""); setTexto(""); setClickedPosition(null);

    } catch (error) {
      alert("❌ Erro ao guardar o registo.");
    } finally {
      setIsSaving(false);
    }
  }, [position, clickedPosition, categoria, texto, tempPhoto, markers, perfil, isSaving]);

  const FinishModal = () => (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{color: '#00A8FF', marginTop: 0}}>✓ Registo Concluído!</h2>
        <p>Obrigado, <strong>{perfil.nome}</strong>. A sua contribuição ajuda a tornar a cidade mais acessível.</p>
        
        <div style={infoBox}>
          <p style={{margin: '5px 0'}}>📍 <strong>Local:</strong> {showFinishInfo.endereco}</p>
          <p style={{margin: '5px 0'}}>👥 <strong>Impacto:</strong> {showFinishInfo.contagem === 1 
            ? "É o primeiro a registar este ponto!" 
            : `${showFinishInfo.contagem} pessoas já reportaram problemas nesta zona.`}
          </p>
        </div>

        <p style={{fontSize: '14px', color: '#666'}}>Deseja receber o resumo deste registo no seu e-mail ({perfil.email})?</p>
        
        <div style={{display: 'flex', gap: '10px'}}>
          <button onClick={() => { alert("E-mail enviado!"); setShowFinishInfo(null); }} style={btnSuccess}>Sim, enviar</button>
          <button onClick={() => setShowFinishInfo(null)} style={btnOutline}>Agora não</button>
        </div>
      </div>
    </div>
  );

  if (!isRegistered) {
    return <LoginScreen perfil={perfil} setPerfil={setPerfil} onLogin={handleLogin} />;
  }

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden' }}>
      <MapDisplay 
        position={position} path={path} markers={markers} 
        clickedPosition={clickedPosition} onMapClick={setClickedPosition}
      />
      
      <ControlHUD 
        isTracking={isTracking}
        onStart={() => setIsTracking(true)}
        onStop={() => setIsTracking(false)}
        onOpenModal={() => setShowModal(true)}
        onReset={handleReset}
        onLogout={handleLogout}
      />
      
      {showModal && (
        <OccurrenceModal 
          tempPhoto={tempPhoto} setTempPhoto={setTempPhoto}
          categoria={categoria} setCategoria={setCategoria}
          texto={texto} setTexto={setTexto}
          onSave={salvarOcorrencia}
          onClose={() => setShowModal(false)}
          isSaving={isSaving}
        />
      )}

      {showFinishInfo && <FinishModal />}
    </div>
  );
}

const overlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
const modalStyle = { backgroundColor: 'white', borderRadius: 20, padding: 25, maxWidth: 400, width: '100%', textAlign: 'center', fontFamily: 'sans-serif' };
const infoBox = { backgroundColor: '#F0F8FF', padding: 15, borderRadius: 12, margin: '20px 0', textAlign: 'left', border: '1px solid #00A8FF' };
const btnSuccess = { flex: 1, backgroundColor: '#00A8FF', color: 'white', border: 'none', padding: '12px', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer' };
const btnOutline = { flex: 1, backgroundColor: 'transparent', color: '#00A8FF', border: '1px solid #00A8FF', padding: '12px', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer' };