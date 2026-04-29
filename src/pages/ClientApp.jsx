import React, { useState, useEffect, useCallback } from 'react';
import MapDisplay from '../components/MapDisplay';
import ControlHUD from '../components/ControlHUD';
import OccurrenceModal from '../components/OccurrenceModal';
import LoginScreen from '../components/LoginScreen';
import { useGPS } from '../hooks/useGPS';

// IMPORTAÇÃO DO FIREBASE
import { db } from '../firebase'; 
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

export default function ClientApp() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [perfil, setPerfil] = useState({ nome: '', email: '' });
  const [isTracking, setIsTracking] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [tempPhoto, setTempPhoto] = useState(null);
  const [categoria, setCategoria] = useState("");
  const [texto, setTexto] = useState("");

  const { position, path, setPath, fallbackActive } = useGPS(isRegistered, isTracking);

  const [clickedPosition, setClickedPosition] = useState(null);

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
    if (perfil.nome && perfil.email) {
      localStorage.setItem('auditor_perfil', JSON.stringify(perfil));
      setIsRegistered(true);
    } else {
      alert("Por favor, preencha todos os campos.");
    }
  };

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
      if (tempPhoto) {
        fotoFinal = await compressImage(tempPhoto);
      }

      let pais = "Desconhecido";
      let cidade = "Desconhecida";
      let estado = "Desconhecido";
      let endereco = "Desconhecido";

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${finalPos[0]}&lon=${finalPos[1]}`, {
          headers: {
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
          }
        });
        const data = await response.json();
        if (data && data.address) {
          pais = data.address.country || "Desconhecido";
          cidade = data.address.city || data.address.town || data.address.village || data.address.municipality || "Desconhecida";
          estado = data.address.state || data.address.region || "Desconhecido";
          endereco = data.address.road || data.address.suburb || data.display_name || "Desconhecido";
        }
      } catch (err) {
        console.error("Erro ao buscar localização (Nominatim):", err);
      }

      // Log para Debug (Critério #9)
      console.log("DEBUG LOCALIZAÇÃO:", {
        lat: finalPos[0],
        lng: finalPos[1],
        pais_detectado: pais,
        fonte: clickedPosition ? "clique_mapa" : (fallbackActive ? "ip_fallback" : "gps")
      });

      const nova = { 
        pos: finalPos,
        latitude: finalPos[0],
        longitude: finalPos[1],
        pais,
        cidade,
        estado,
        endereco,
        categoria: categoria || "Geral", 
        detalhes: texto || "", 
        foto: fotoFinal,
        autor: perfil.nome || "Usuário Anônimo",
        perfilUsuario: perfil.vinculo || "Não informado",
        timestamp: new Date().getTime(),
        horario: new Date().toLocaleString(),
        precisao: (fallbackActive && !clickedPosition) ? "baixa" : "alta"
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
      setClickedPosition(null);

    } catch (error) {
      console.error("Erro no processo de salvamento:", error);
      alert("❌ Erro ao salvar. Verifique sua conexão.");
    } finally {
      setIsSaving(false);
    }
  }, [position, clickedPosition, fallbackActive, categoria, texto, tempPhoto, markers, perfil, isSaving]);

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

  if (!isRegistered) {
    return <LoginScreen perfil={perfil} setPerfil={setPerfil} onLogin={handleLogin} />;
  }

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden' }}>
      <MapDisplay 
        position={position} 
        path={path} 
        markers={markers} 
        clickedPosition={clickedPosition}
        onMapClick={setClickedPosition}
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
    </div>
  );
}
