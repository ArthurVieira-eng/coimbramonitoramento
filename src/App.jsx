import React, { useState, useEffect, useCallback } from 'react';
import MapDisplay from './components/MapDisplay';
import ControlHUD from './components/ControlHUD';
import OccurrenceModal from './components/OccurrenceModal';
import LoginScreen from './components/LoginScreen';
import { useGPS } from './hooks/useGPS';

// IMPORTAÇÃO DO FIREBASE
import { db } from './firebase'; 
import { ref, push, set } from "firebase/database";

export default function App() {
  // 1. ESTADOS GLOBAIS
  const [isRegistered, setIsRegistered] = useState(false);
  const [perfil, setPerfil] = useState({ nome: '', email: '', vinculo: '' });
  const [isTracking, setIsTracking] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // 2. ESTADOS DO FORMULÁRIO (OCORRÊNCIA)
  const [tempPhoto, setTempPhoto] = useState(null);
  const [categoria, setCategoria] = useState("");
  const [texto, setTexto] = useState("");

  // 3. HOOK DE GPS
  const { position, path, setPath } = useGPS(isTracking);

  // 4. CARREGAR DADOS SALVOS AO INICIAR
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

  // 5. FUNÇÕES DE AÇÃO
  const handleLogin = () => {
    if (perfil.nome && perfil.email && perfil.vinculo) {
      localStorage.setItem('auditor_perfil', JSON.stringify(perfil));
      setIsRegistered(true);
    } else {
      alert("Por favor, preencha todos os campos.");
    }
  };

  const salvarOcorrencia = useCallback(() => {
    const nova = { 
      pos: position || { latitude: 0, longitude: 0 }, 
      categoria: categoria || "Geral", 
      detalhes: texto || "", 
      foto: tempPhoto || null, 
      autor: perfil.nome || "Usuário Anônimo",
      perfilUsuario: perfil.vinculo || "Não informado",
      timestamp: new Date().getTime(),
      horario: new Date().toLocaleString()
    };

    // --- ENVIO PARA O FIREBASE (NUVEM) ---
    try {
      const ocorrenciasRef = ref(db, 'ocorrencias');
      const novaRef = push(ocorrenciasRef);
      set(novaRef, nova);
      console.log("Sucesso no Firebase!");
    } catch (error) {
      console.error("Erro ao enviar para nuvem:", error);
    }

    // --- SALVAMENTO LOCAL (BACKUP) ---
    const lista = [...markers, nova];
    setMarkers(lista);
    localStorage.setItem('auditor_markers', JSON.stringify(lista));
    
    // Resetar campos
    setShowModal(false); 
    setTempPhoto(null); 
    setCategoria(""); 
    setTexto("");
  }, [position, categoria, texto, tempPhoto, markers, perfil]);

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

  // 6. RENDERIZAÇÃO CONDICIONAL
  if (!isRegistered) {
    return <LoginScreen perfil={perfil} setPerfil={setPerfil} onLogin={handleLogin} />;
  }

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden' }}>
      
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
        />
      )}
    </div>
  );
}