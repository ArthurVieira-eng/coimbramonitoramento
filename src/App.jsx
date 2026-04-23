import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { Play, Square, Camera, Mic, User, Building2, Trash2 } from 'lucide-react';
import L from 'leaflet';

// --- CONFIGURAÇÃO DE ÍCONES ---
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

const yellowIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

function AutoCenter({ coords }) {
  const map = useMap();
  useEffect(() => { if (coords) map.setView(coords, map.getZoom()); }, [coords]);
  return null;
}

function App() {
  // --- ESTADOS DE CADASTRO E PERFIL ---
  const [isRegistered, setIsRegistered] = useState(false);
  const [perfil, setPerfil] = useState({ nome: '', contato: '', tipo: '', deficiencia: '' });

  // --- ESTADOS DO MAPA ---
  const [position, setPosition] = useState([-8.122672, -34.965546]); // Ponto Recife que você usou
  const [path, setPath] = useState([]); 
  const [isTracking, setIsTracking] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // --- ESTADOS DA OCORRÊNCIA ---
  const [showModal, setShowModal] = useState(false);
  const [tempPhoto, setTempPhoto] = useState(null);
  const [comentario, setComentario] = useState("");
  const [orgaoAlvo, setOrgaoAlvo] = useState("Câmara Municipal");
  const [outrosAtivo, setOutrosAtivo] = useState(false);
  const [valorOutros, setValorOutros] = useState("");

  const tiposProblema = ["Buraco na calçada", "Degrau sem rampa", "Poste/Obstáculo", "Calçada estreita", "Outros"];

  // --- 1. CARREGAMENTO INICIAL (PERSISTÊNCIA) ---
  useEffect(() => {
    const salvoPerfil = localStorage.getItem('auditor_perfil');
    const salvoPath = localStorage.getItem('auditor_path');
    const salvoMarkers = localStorage.getItem('auditor_markers');

    if (salvoPerfil) {
      setPerfil(JSON.parse(salvoPerfil));
      setIsRegistered(true);
    }
    if (salvoPath) setPath(JSON.parse(salvoPath));
    if (salvoMarkers) setMarkers(JSON.parse(salvoMarkers));
  }, []);

  // --- 2. SALVAMENTO AUTOMÁTICO ---
  useEffect(() => {
    if (path.length > 0) localStorage.setItem('auditor_path', JSON.stringify(path));
  }, [path]);

  useEffect(() => {
    if (markers.length > 0) localStorage.setItem('auditor_markers', JSON.stringify(markers));
  }, [markers]);

  // --- LÓGICA DE GPS ---
  useEffect(() => {
    let watchId = null;
    if (isTracking) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos = [pos.coords.latitude, pos.coords.longitude];
          setPosition(newPos);
          setPath((prev) => [...prev, newPos]);
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, distanceFilter: 2 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [isTracking]);

  // --- FUNÇÕES DE INTERAÇÃO ---
  const handleFinalizarCadastro = () => {
    if (perfil.nome) {
      localStorage.setItem('auditor_perfil', JSON.stringify(perfil));
      setIsRegistered(true);
    }
  };

  const limparDados = () => {
    if (window.confirm("Deseja apagar o percurso e as ocorrências atuais?")) {
      setPath([]);
      setMarkers([]);
      localStorage.removeItem('auditor_path');
      localStorage.removeItem('auditor_markers');
    }
  };

  const handleCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTempPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const salvarOcorrencia = async (tipoFinal) => {
    const novaOcorrencia = {
      pos: position,
      tipo: tipoFinal,
      comentario: comentario,
      orgao: orgaoAlvo,
      foto: tempPhoto,
      status: 'denunciado',
      hora: new Date().toLocaleString(),
      usuario: perfil.nome,
      id_anonimo: "OCR_" + Math.random().toString(36).substr(2, 5).toUpperCase()
    };
    
    const novosMarkers = [...markers, novaOcorrencia];
    setMarkers(novosMarkers);
    setIsSuccess(true);

    // Espaço para o SheetDB futuro:
    // await fetch('SUA_URL_AQUI', { method: 'POST', ... })

    setTimeout(() => {
      setIsSuccess(false);
      setTempPhoto(null); 
      setComentario("");
      setOutrosAtivo(false);
      setShowModal(false);
    }, 2500);
  };

  // --- TELA DE CADASTRO ---
  if (!isRegistered) {
    return (
      <div style={{ padding: '40px 20px', fontFamily: 'sans-serif', maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: '#22c55e', borderRadius: '20px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>LOGO</div>
          <h2 style={{ color: '#333', marginTop: '20px' }}>Bem-vindo ao Auditor</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>Identifique-se para começar a inclusão.</p>
        </div>

        <input type="text" placeholder="Nome Completo" style={inputStyle} value={perfil.nome} onChange={e => setPerfil({...perfil, nome: e.target.value})} />
        <input type="text" placeholder="E-mail ou Fone (Opcional)" style={inputStyle} value={perfil.contato} onChange={e => setPerfil({...perfil, contato: e.target.value})} />
        
        <select style={inputStyle} value={perfil.tipo} onChange={e => setPerfil({...perfil, tipo: e.target.value})}>
          <option value="">Você é deficiente?</option>
          <option value="deficiente">Sim, sou deficiente</option>
          <option value="parente">Parente/Responsável</option>
          <option value="apoiador">Apoiador/Amigo</option>
          <option value="não">Não</option>
        </select>

        {perfil.tipo === 'deficiente' && (
          <input type="text" placeholder="Qual a deficiência?" style={inputStyle} value={perfil.deficiencia} onChange={e => setPerfil({...perfil, deficiencia: e.target.value})} />
        )}

        <button 
          onClick={handleFinalizarCadastro}
          style={{ width: '100%', padding: '15px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
        >
          Acessar Mapa
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', fontFamily: 'sans-serif' }}>
      
      {/* BOTÕES DE CONTROLE */}
      <div style={{ position: 'absolute', top: 15, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', gap: '10px', width: '95%', justifyContent: 'center' }}>
        <button 
          onClick={() => setIsTracking(!isTracking)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 15px', borderRadius: '50px', border: 'none', backgroundColor: isTracking ? '#ff4444' : '#22c55e', color: 'white', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', fontSize: '14px' }}
        >
          {isTracking ? <><Square size={16}/> Parar</> : <><Play size={16}/> Iniciar</>}
        </button>

        {isTracking && (
          <button 
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 15px', borderRadius: '50px', border: 'none', backgroundColor: '#eab308', color: 'white', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', fontSize: '14px' }}
          >
            <Camera size={16}/> Ocorrência
          </button>
        )}

        {!isTracking && path.length > 0 && (
          <button 
            onClick={limparDados}
            style={{ display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '50%', border: 'none', backgroundColor: 'white', color: '#ff4444', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}
          >
            <Trash2 size={20}/>
          </button>
        )}
      </div>

      {/* MODAL DE OCORRÊNCIA */}
      {showModal && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', borderRadius: '25px', zIndex: 2000, width: '90%', maxWidth: '350px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
          {!isSuccess ? (
            <>
              <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><Building2 size={24}/> Nova Ocorrência</h3>
              <div style={{ textAlign: 'left', marginBottom: '15px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Encaminhar para:</label>
                <select value={orgaoAlvo} onChange={(e) => setOrgaoAlvo(e.target.value)} style={inputStyle}>
                  <option value="Câmara Municipal">Câmara Municipal (Prefeitura)</option>
                  <option value="Associação Salvador">Associação Salvador</option>
                  <option value="Junta de Freguesia">Junta de Freguesia</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                {!tempPhoto ? (
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px', border: '2px dashed #ccc', borderRadius: '15px', cursor: 'pointer' }}>
                    <Camera size={30} color="#999" />
                    <span style={{ fontSize: '13px', color: '#999', fontWeight: 'bold' }}>Tirar Foto</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleCapture} style={{ display: 'none' }} />
                  </label>
                ) : (
                  <img src={tempPhoto} alt="Preview" style={{ width: '100%', borderRadius: '15px', height: '140px', objectFit: 'cover' }} />
                )}
              </div>

              <div style={{ textAlign: 'left', marginBottom: '15px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Relato:</label>
                <textarea placeholder="Escreva o problema..." value={comentario} onChange={(e) => setComentario(e.target.value)} style={{ ...inputStyle, height: '60px' }} />
              </div>

              {!outrosAtivo ? (
                tiposProblema.map(tipo => (
                  <button key={tipo} onClick={() => tipo === "Outros" ? setOutrosAtivo(true) : salvarOcorrencia(tipo)} disabled={!tempPhoto} style={{ display: 'block', width: '100%', padding: '12px', marginBottom: '8px', borderRadius: '12px', border: 'none', backgroundColor: tempPhoto ? '#f0f0f0' : '#f9f9f9', textAlign: 'left', color: tempPhoto ? '#333' : '#ccc', fontWeight: '500' }}>
                    {tipo}
                  </button>
                ))
              ) : (
                <div>
                  <input type="text" placeholder="Qual a ocorrência?" autoFocus onChange={(e) => setValorOutros(e.target.value)} style={inputStyle} />
                  <button onClick={() => valorOutros && salvarOcorrencia(valorOutros)} style={{ width: '100%', padding: '12px', marginTop: '10px', borderRadius: '10px', backgroundColor: '#eab308', color: 'white', border: 'none', fontWeight: 'bold' }}>Salvar</button>
                </div>
              )}
              <button onClick={() => { setShowModal(false); setTempPhoto(null); setOutrosAtivo(false); }} style={{ width: '100%', border: 'none', background: 'none', color: '#999', marginTop: '10px' }}>Cancelar</button>
            </>
          ) : (
            <div style={{ padding: '30px 10px', textAlign: 'center' }}>
              <div style={{ backgroundColor: '#22c55e', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h3 style={{ color: '#22c55e', margin: 0 }}>Ocorrência Registrada!</h3>
            </div>
          )}
        </div>
      )}

      {/* MAPA */}
      <MapContainer center={position} zoom={16} zoomControl={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Polyline positions={path} color="red" weight={5} opacity={0.6} />
        <Marker position={position} icon={userIcon}><Popup>Você está aqui</Popup></Marker>

        {markers.map((m, i) => (
          <Marker key={i} position={m.pos} icon={m.status === 'resolvido' ? greenIcon : m.status === 'providencia' ? yellowIcon : redIcon}>
            <Popup>
              <div style={{ width: '180px' }}>
                <strong>{m.tipo}</strong>
                <div style={{ fontSize: '11px', color: '#eab308' }}>Para: {m.orgao}</div>
                {m.foto && <img src={m.foto} alt="Evidência" style={{ width: '100%', borderRadius: '8px', marginTop: '5px' }} />}
                <div style={{ marginTop: '8px', fontSize: '10px', color: '#999' }}>{m.hora}</div>
              </div>
            </Popup>
          </Marker>
        ))}
        <AutoCenter coords={position} />
      </MapContainer>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '12px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px' };

export default App;