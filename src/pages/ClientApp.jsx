import React, { useState, useEffect, useCallback } from 'react';
import MapDisplay from '../components/MapDisplay';
import ControlHUD from '../components/ControlHUD';
import OccurrenceModal from '../components/OccurrenceModal';
import LoginScreen from '../components/LoginScreen'; 
import { useGPS } from '../hooks/useGPS';

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

  // Estados de Acessibilidade Dinâmica
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const [isTracking, setIsTracking] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [pendingOccurrence, setPendingOccurrence] = useState(null);
  
  // ESTADOS DO INQUÉRITO REFORMULADOS
  const [stepSurvey, setStepSurvey] = useState(1);
  const [frequencia, setFrequencia] = useState('');
  const [frequenciaOutro, setFrequenciaOutro] = useState('');
  const [destinosSelecionados, setDestinosSelecionados] = useState([]);
  const [destinoOutro, setDestinoOutro] = useState('');

  const [tempPhoto, setTempPhoto] = useState(null);
  const [categoria, setCategoria] = useState("");
  const [texto, setTexto] = useState(""); 
  const [tempAudio, setTempAudio] = useState(null);

  const { position, path, setPath } = useGPS(isRegistered, isTracking);
  const [clickedPosition, setClickedPosition] = useState(null);

  // Função global de leitura de voz por síntese (TTS)
  const falar = useCallback((texto) => {
    if ('speechSynthesis' in window && isVoiceActive) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'pt-PT';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [isVoiceActive]);

  // Aplicar acessibilidade adaptativa conforme perfil
  const aplicarAcessibilidadePerfil = useCallback((perfilUtilizador) => {
    const deficiencia = perfilUtilizador.tipologias || [];

    if (deficiencia.includes('Deficiência visual')) {
      setIsVoiceActive(true);
      setHighContrast(true);
      falar("Modo de Deficiência Visual ativado. Alto contraste e leitor por voz ligados.");
    }
    if (deficiencia.includes('Deficiência auditiva')) {
      falar("Modo de Deficiência Auditiva ativado. Avisos visuais em destaque.");
    }
  }, [falar]);

  useEffect(() => {
    const p = localStorage.getItem('auditor_perfil');
    if (p) { 
      const perfilObj = JSON.parse(p);
      setPerfil(perfilObj); 
      setIsRegistered(true);
      aplicarAcessibilidadePerfil(perfilObj);
    }
    const m = localStorage.getItem('auditor_markers');
    if (m) setMarkers(JSON.parse(m));
    const pt = localStorage.getItem('auditor_path');
    if (pt) setPath(JSON.parse(pt));
  }, [setPath, aplicarAcessibilidadePerfil]);

  const handleLogin = () => {
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
    aplicarAcessibilidadePerfil(perfil);
  };

  const handleReset = () => {
    falar("Reiniciar percurso");
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
    falar("Sair da aplicação");
    if(window.confirm("Deseja realmente sair? Você precisará fazer login novamente.")) {
      localStorage.removeItem('auditor_perfil');
      setIsRegistered(false);
      setIsVoiceActive(false);
      setHighContrast(false);
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
      falar("Erro. Localização não encontrada.");
      return;
    }

    try {
      setIsSaving(true);
      falar("A processar e a gravar ocorrência.");
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
        perfilUtilizador: perfil,
        timestamp: new Date().getTime(),
        horario: new Date().toLocaleString('pt-PT'),
      };

      setPendingOccurrence(nova);
      setShowModal(false);
      setStepSurvey(1);
      falar("Ocorrência guardada! Responda à primeira pergunta.");

    } catch (error) {
      console.error(error);
      alert("❌ Erro ao processar o registo.");
    } finally {
      setIsSaving(false);
    }
  }, [position, clickedPosition, categoria, texto, tempPhoto, tempAudio, perfil, isSaving, falar]);

  const handleToggleDestino = (opcao) => {
    let atualizados = [...destinosSelecionados];
    if (atualizados.includes(opcao)) {
      atualizados = atualizados.filter((d) => d !== opcao);
      falar(`${opcao} desmarcado`);
    } else {
      atualizados.push(opcao);
      falar(`${opcao} selecionado`);
    }
    setDestinosSelecionados(atualizados);
  };

  const submeterInqueritoEGuardar = async () => {
    if (!pendingOccurrence) return;

    const frequenciaFinal = frequencia === 'Outro' ? (frequenciaOutro ? `Outro: ${frequenciaOutro}` : 'Outro') : frequencia;
    
    let listaDestinos = [...destinosSelecionados];
    if (listaDestinos.includes('Outro') && destinoOutro) {
      listaDestinos = listaDestinos.map(d => d === 'Outro' ? `Outro: ${destinoOutro}` : d);
    }
    const destinosFinaisString = listaDestinos.length > 0 ? listaDestinos.join(', ') : 'Prefiro não responder';

    const ocorrenciaCompleta = {
      ...pendingOccurrence,
      inqueritoPosRegisto: {
        frequenciaPassagem: frequenciaFinal || 'Prefiro não responder',
        destinoObstaculo: destinosFinaisString
      }
    };

    try {
      const ocorrenciasRef = ref(db, 'ocorrencias');
      await set(push(ocorrenciasRef), ocorrenciaCompleta);

      const lista = [...markers, ocorrenciaCompleta];
      setMarkers(lista);
      localStorage.setItem('auditor_markers', JSON.stringify(lista));

      setPendingOccurrence(null);
      setStepSurvey(1);
      setFrequencia('');
      setFrequenciaOutro('');
      setDestinosSelecionados([]);
      setDestinoOutro('');
      setTempPhoto(null); 
      setTempAudio(null); 
      setCategoria(""); 
      setTexto(""); 
      setClickedPosition(null);

      falar("Registo e inquérito concluídos com sucesso.");
      alert("Ocorrência e inquérito guardados com sucesso!");
    } catch (e) {
      console.error(e);
      alert("Erro ao guardar dados.");
    }
  };

  const SurveyModal = () => (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, textAlign: 'left', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <h3 style={{ color: '#00A8FF', margin: 0, fontSize: 18 }}>✓ Registo efetuado!</h3>
          <span style={{ fontSize: 12, fontWeight: 'bold', color: '#666', backgroundColor: '#EDF2F7', padding: '4px 10px', borderRadius: 12 }}>
            Pergunta {stepSurvey} de 2
          </span>
        </div>

        {stepSurvey === 1 && (
          <div>
            <p style={{ fontWeight: 'bold', fontSize: 16, color: '#1A202C', marginBottom: 15, lineHeight: '1.4' }}>
              Quando esta ocorrência for resolvida, com que frequência tenciono passar neste local?
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Sempre que visitar a cidade',
                'Todos os dias',
                'Quase todos os dias',
                'De vez em quando',
                'Outro',
                'Prefiro não responder'
              ].map((op) => {
                const isSelected = frequencia === op;
                return (
                  <button
                    key={op}
                    type="button"
                    onClick={() => {
                      setFrequencia(op);
                      falar(`Opção selecionada: ${op}`);
                    }}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #00A8FF' : '1px solid #CBD5E0',
                      backgroundColor: isSelected ? '#EBF8FF' : '#FFF',
                      color: isSelected ? '#00A8FF' : '#2D3748',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      fontSize: '15px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{op}</span>
                    {isSelected && <span style={{ fontWeight: 'bold', fontSize: 16 }}>●</span>}
                  </button>
                );
              })}
            </div>

            {frequencia === 'Outro' && (
              <input 
                type="text" 
                placeholder="Especifique a frequência..." 
                value={frequenciaOutro} 
                onFocus={() => falar("A introduzir outra frequência")}
                onChange={(e) => setFrequenciaOutro(e.target.value)}
                style={inputTextStyle} 
              />
            )}

            <button 
              disabled={!frequencia}
              onClick={() => {
                setStepSurvey(2);
                falar("Pergunta seguinte: Onde se encontra o obstáculo?");
              }} 
              style={{ ...btnSuccess, opacity: frequencia ? 1 : 0.5, marginTop: 20 }}
            >
              Próxima Pergunta →
            </button>
          </div>
        )}

        {stepSurvey === 2 && (
          <div>
            <p style={{ fontWeight: 'bold', fontSize: 16, color: '#1A202C', marginBottom: 4 }}>
              Este obstáculo encontra-se:
            </p>
            <span style={{ fontSize: 13, color: '#718096', display: 'block', marginBottom: 15 }}>
              (Pode selecionar várias opções)
            </span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
              ].map((op) => {
                const isSelected = destinosSelecionados.includes(op);
                return (
                  <button
                    key={op}
                    type="button"
                    onClick={() => handleToggleDestino(op)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #00A8FF' : '1px solid #CBD5E0',
                      backgroundColor: isSelected ? '#EBF8FF' : '#FFF',
                      color: isSelected ? '#00A8FF' : '#2D3748',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      fontSize: '14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{op}</span>
                    {isSelected && <span style={{ fontWeight: 'bold', fontSize: 16 }}>✓</span>}
                  </button>
                );
              })}
            </div>

            {destinosSelecionados.includes('Outro') && (
              <input 
                type="text" 
                placeholder="Especifique o destino..." 
                value={destinoOutro} 
                onFocus={() => falar("A introduzir outro destino")}
                onChange={(e) => setDestinoOutro(e.target.value)}
                style={inputTextStyle} 
              />
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button 
                type="button"
                onClick={() => {
                  setStepSurvey(1);
                  falar("Voltar para a primeira pergunta");
                }} 
                style={{ ...btnSuccess, backgroundColor: '#EDF2F7', color: '#4A5568', width: '35%' }}
              >
                ← Voltar
              </button>
              <button 
                type="button"
                onClick={submeterInqueritoEGuardar} 
                style={{ ...btnSuccess, width: '65%' }}
              >
                Concluir e Guardar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );

  if (!isRegistered) {
    return <LoginScreen perfil={perfil} setPerfil={setPerfil} onLogin={handleLogin} />;
  }

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      position: 'relative', 
      overflow: 'hidden',
      filter: highContrast ? 'contrast(150%) invert(10%)' : 'none'
    }}>
      <MapDisplay 
        position={position} path={path} markers={markers} 
        clickedPosition={clickedPosition} onMapClick={(pos) => {
          setClickedPosition(pos);
          falar("Ponto marcado no mapa.");
        }}
      />
      
      <ControlHUD 
        isTracking={isTracking}
        isVoiceActive={isVoiceActive}
        highContrast={highContrast}
        onToggleVoice={() => {
          const novoEstado = !isVoiceActive;
          setIsVoiceActive(novoEstado);
          if (novoEstado) falar("Leitor de Voz Ativado");
        }}
        onToggleContrast={() => {
          const novoContraste = !highContrast;
          setHighContrast(novoContraste);
          falar(novoContraste ? "Alto contraste ativado" : "Alto contraste desativado");
        }}
        onStart={() => {
          setIsTracking(true);
          falar("Monitorização de percurso iniciada.");
        }}
        onStop={() => {
          setIsTracking(false);
          falar("Monitorização pausada.");
        }}
        onOpenModal={() => {
          setShowModal(true);
          falar("A abrir registo de ocorrência.");
        }}
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
          onClose={() => {
            setShowModal(false);
            falar("Registo fechado.");
          }}
          isSaving={isSaving}
          falar={falar}
        />
      )}

      {pendingOccurrence && <SurveyModal />}
    </div>
  );
}

const overlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
const modalStyle = { backgroundColor: 'white', borderRadius: 20, padding: 25, maxWidth: 420, width: '100%', fontFamily: 'sans-serif' };
const inputTextStyle = { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #CBD5E0', marginTop: 10, boxSizing: 'border-box', fontSize: 14 };
const btnSuccess = { width: '100%', backgroundColor: '#00A8FF', color: 'white', border: 'none', padding: '14px', borderRadius: 10, fontWeight: 'bold', fontSize: 15, cursor: 'pointer', marginTop: 10 };