import React, { useState, useEffect, useCallback } from 'react';
import MapDisplay from './components/MapDisplay';
import ControlHUD from './components/ControlHUD';
import OccurrenceModal from './components/OccurrenceModal';
import LoginScreen from './components/LoginScreen';
import { useGPS } from './hooks/useGPS';

// IMPORTAÇÃO DO FIREBASE
import { db } from './firebase'; 
import { ref, push, set } from "firebase/database";

// --- FUNÇÃO AUXILIAR PARA COMPRIMIR A FOTO ---
const compressImage = (base64Str, maxWidth = 600, maxHeight = 600) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7)); 
    };
  });
};

export default function App() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [perfil, setPerfil] = useState({ nome: '', email: '', vinculo: '' });
  const [isTracking, setIsTracking] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [tempPhoto, setTempPhoto] = useState(null);
  const [categoria, setCategoria] = useState("");
  const [texto, setTexto] = useState("");

  // --- MUDANÇA AQUI ---
  // Passamos isRegistered para o GPS ligar o sensor no Login
  // Passamos isTracking para o GPS saber quando gravar o rastro (path)
  const { position, path, setPath } = useGPS(isRegistered, isTracking);

  useEffect(() => {
    const p = localStorage.getItem('auditor_perfil');
    if (p) { 
      setPerfil(JSON.parse(p)); 
      setIsRegistered(true); 
    }
    const m = localStorage.getItem('auditor_markers');
    if (m) setMarkers(JSON.parse(m));
    const pt = localStorage.getItem('auditor_path');
    if (pt) setPath(JSON.parse(pt));
  }, [setPath]);

  const handleLogin = () => {
    if (perfil.nome && perfil.email && perfil.vinculo) {
      localStorage.setItem('auditor_perfil', JSON.stringify(perfil));
      setIsRegistered(true);
    } else {
      alert("Por favor, preencha todos os campos.");
    }
  };

  const salvarOcorrencia = useCallback(async () => {
    if (isSaving) return;

    // --- SEGURANÇA ---
    // Impede o envio se o GPS ainda for null (evita enviar 0,0 ou erro)
    if (!position) {
      alert("📍 Ainda obtendo sinal de GPS... Aguarde um instante.");
      return;
    }

    try {
      setIsSaving(true);

      let fotoFinal = null;
      if (tempPhoto) {
        fotoFinal = await compressImage(tempPhoto);
      }

      const nova = { 
        pos: position, // Agora position já vem limpa do hook
        categoria: categoria || "Geral", 
        detalhes: texto || "", 
        foto: fotoFinal,
        autor: perfil.nome || "Usuário Anônimo",
        perfilUsuario: perfil.vinculo || "Não informado",
        timestamp: new Date().getTime(),
        horario: new Date().toLocaleString()
      };

      const ocorrenciasRef = ref(db, 'ocorrencias');
      const novaRef = push(ocorrenciasRef);
      await set(novaRef, nova);
      
      alert("✅ Registro concluído com sucesso!");

      const lista = [...markers, nova];
      setMarkers(lista);
      localStorage.setItem('auditor_markers', JSON.stringify(lista));
      
      setShowModal(false); 
      setTempPhoto(null); 
      setCategoria(""); 
      setTexto("");

    } catch (error) {
      console.error("Erro no processo de salvamento:", error);
      alert("❌ Erro ao salvar. Verifique sua conexão.");
    } finally {
      setIsSaving(false);
    }
  }, [position, categoria, texto, tempPhoto, markers, perfil, isSaving]);

  const handleReset = () => {
    if(window.confirm("Deseja limpar todos os dados da corrida atual?")) {
      localStorage.removeItem('auditor_path');
      localStorage.removeItem('auditor_markers');
      setPath([]);
      setMarkers([]);
      setIsTracking(false);
      window.location.reload();
    }
  };

  if (!isRegistered) {
    return <LoginScreen perfil={perfil} setPerfil={setPerfil} onLogin={handleLogin} />;
  }

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden' }}>
      {/* Passamos a posição que agora começa como null */}
      <MapDisplay position={position} path={path} markers={markers} />
      
      <ControlHUD 
        isTracking={isTracking}
        onStart={() => setIsTracking(true)}
        onStop={() => setIsTracking(false)}
        onOpenModal={() => setShowModal(true)}
        onReset={handleReset}
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
    </div>
  );
}