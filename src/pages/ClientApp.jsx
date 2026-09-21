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
  const [perfil, setPerfil] = useState({ 
    nome: '', 
    email: '', 
    categoria: '', 
    nomeRepresentado: '', 
    tipologias: [] 
  });
  
  const [isTracking, setIsTracking] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado para guardar a ocorrência guardada temporariamente para responder ao inquérito pós-registo (Topico 7)
  const [pendingOccurrence, setPendingOccurrence] = useState(null);
  const [frequencia, setFrequencia] = useState('');
  const [frequenciaOutro, setFrequenciaOutro] = useState('');
  const [destino, setDestino] = useState('');
  const [destinoOutro, setDestinoOutro] = useState('');

  const [tempPhoto, setTempPhoto] = useState(null);
  const [categoria, setCategoria] = useState("");
  const [texto, setTexto] = useState(""); 
  const [tempAudio, setTempAudio] = useState(null);

  const { position, path, setPath } = useGPS(isRegistered, isTracking);
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
    // Tópico 3: Email e Nome obrigatórios
    if (!perfil.nome || !perfil.email || !perfil.categoria) {
      alert("Por favor, preencha o Nome, Email e selecione a sua categoria.");
      return;
    }
    if (perfil.categoria === 'tutor' && !perfil.nomeRepresentado) {
      alert("Por favor, indique o nome da pessoa que representa.");
      return;
    }

    localStorage.setItem('auditor_perfil', JSON.stringify(perfil));
    setIsRegistered(true);
  };

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
      setPerfil({ nome: '', email: '', categoria: '', nomeRepresentado: '', tipologias: [] });
    }
  };

  const salvarOcorrencia = useCallback(async (coordenadasDoModal) => {
    if (isSaving) return;

    let finalPos = null;
    if (coordenadasDoModal) {
      finalPos = [coordenadasDoModal.latitude, coordenadasDoModal.longitude];
    } else {
      finalPos = clickedPosition || position;
    }

    if (!finalPos) {
      alert("📍 Localização obrigatória. Verifique se o GPS do telemóvel está ativo.");
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
        audio: tempAudio,
        autor: perfil.nome || "Utilizador Anónimo",
        email: perfil.email,
        perfilUtilizador: perfil, // Guarda informações do tipo de perfil e deficiências
        timestamp: new Date().getTime(),
        horario: new Date().toLocaleString('pt-PT'),
      };

      // Gravação temporária para concluir as perguntas do Tópico 7
      setPendingOccurrence(nova);
      setShowModal(false);

    } catch (error) {
      console.error(error);
      alert("❌ Erro ao processar o registo.");
    } finally {
      setIsSaving(false);
    }
  }, [position, clickedPosition, categoria, texto, tempPhoto, tempAudio, perfil, isSaving]);

  // Grava definitivamente no Firebase após responder às perguntas do Tópico 7
  const submeterInqueritoEGuardar = async () => {
    if (!pendingOccurrence) return;

    const frequenciaFinal = frequencia === 'Outro' ? frequenciaOutro : frequencia;
    const destinoFinal = destino === 'Outro' ? destinoOutro : destino;

    const ocorrenciaCompleta = {
      ...pendingOccurrence,
      inqueritoPosRegisto: {
        frequenciaPassagem: frequenciaFinal || 'Prefiro não responder',
        destinoObstaculo: destinoFinal || 'Prefiro não responder'
      }
    };

    try {
      const ocorrenciasRef = ref(db, 'ocorrencias');
      await set(push(ocorrenciasRef), ocorrenciaCompleta);

      const lista = [...markers, ocorrenciaCompleta];
      setMarkers(lista);
      localStorage.setItem('auditor_markers', JSON.stringify(lista));

      // Limpar formulário
      setPendingOccurrence(null);
      setFrequencia('');
      setFrequenciaOutro('');
      setDestino('');
      setDestinoOutro('');
      setTempPhoto(null); 
      setTempAudio(null); 
      setCategoria(""); 
      setTexto(""); 
      setClickedPosition(null);

      alert("Ocorrência e inquérito guardados com sucesso!");
    } catch (e) {
      console.error(e);
      alert("Erro ao guardar dados.");
    }
  };

  // Modal com Perguntas Pós-Registo (Tópicos 7.1 e 7.2)
  const SurveyModal = () => (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, textAlign: 'left', maxHeight: '85vh', overflowY: 'auto' }}>
        <h3 style={{ color: '#00A8FF', marginTop: 0 }}>✓ Registo efetuado! Ajude-nos com 2 perguntas simples:</h3>
        
        {/* 7.1 Frequência */}
        <div style={{ marginBottom: 15 }}>
          <label style={labelStyle}>7.1 Quando esta ocorrência for resolvida, com que frequência tenciono passar neste local?</label>
          {[
            'Sempre que visitar a cidade',
            'Todos os dias',
            'Quase todos os dias',
            'De vez em quando',
            'Outro',
            'Prefiro não responder'
          ].map((op) => (
            <label key={op} style={{ display: 'block', fontSize: 13, margin: '4px 0' }}>
              <input 
                type="radio" 
                name="frequencia" 
                value={op} 
                checked={frequencia === op} 
                onChange={(e) => setFrequencia(e.target.value)} 
              /> {op}
            </label>
          ))}
          {frequencia === 'Outro' && (
            <input 
              type="text" 
              placeholder="Especifique..." 
              value={frequenciaOutro} 
              onChange={(e) => setFrequenciaOutro(e.target.value)}
              style={inputTextStyle} 
            />
          )}
        </div>

        {/* 7.2 Destino */}
        <div style={{ marginBottom: 15 }}>
          <label style={labelStyle}>7.2 Este obstáculo encontra-se:</label>
          {[
            'a caminho de casa',
            'a caminho do trabalho',
            'a caminho de uma área de lazer',
            'a caminho de um espaço cultural',
            'a caminho de uma loja',
            'a caminho de um serviço da cidade',
            'enquanto faço turismo',
            'Outro',
            'Prefiro não responder'
          ].map((op) => (
            <label key={op} style={{ display: 'block', fontSize: 13, margin: '4px 0' }}>
              <input 
                type="radio" 
                name="destino" 
                value={op} 
                checked={destino === op} 
                onChange={(e) => setDestino(e.target.value)} 
              /> {op}
            </label>
          ))}
          {destino === 'Outro' && (
            <input 
              type="text" 
              placeholder="Especifique..." 
              value={destinoOutro} 
              onChange={(e) => setDestinoOutro(e.target.value)}
              style={inputTextStyle} 
            />
          )}
        </div>

        <button onClick={submeterInqueritoEGuardar} style={btnSuccess}>
          Concluir e Guardar
        </button>
      </div>
    </div>
  );

  if (!isRegistered) {
    return <LoginScreen perfil={perfil} setPerfil={setPerfil} onLogin={handleLogin} />;
  }

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden' }}>
      {/* Tópico 5: Apenas os markers do próprio utilizador são passados para a app */}
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
          tempAudio={tempAudio} setTempAudio={setTempAudio}
          categoria={categoria} setCategoria={setCategoria}
          texto={texto} setTexto={setTexto}
          onSave={salvarOcorrencia}
          onClose={() => setShowModal(false)}
          isSaving={isSaving}
        />
      )}

      {pendingOccurrence && <SurveyModal />}
    </div>
  );
}

const overlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
const modalStyle = { backgroundColor: 'white', borderRadius: 20, padding: 25, maxWidth: 420, width: '100%', fontFamily: 'sans-serif' };
const labelStyle = { display: 'block', fontWeight: 'bold', fontSize: 14, color: '#333', marginBottom: 6 };
const inputTextStyle = { width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 5, boxSizing: 'border-box' };
const btnSuccess = { width: '100%', backgroundColor: '#00A8FF', color: 'white', border: 'none', padding: '12px', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer', marginTop: 10 };