import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { Play, Square, Camera, User, Trash2, Building2 } from 'lucide-react';
import L from 'leaflet';

// --- ÍCONES ---
const redIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });
const userIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });

// --- CENTRALIZAÇÃO AUTOMÁTICA ---
function AutoCenter({ coords }) {
  const map = useMap();
  useEffect(() => { 
    if (coords && !isNaN(coords[0])) {
      map.setView(coords, map.getZoom()); 
    }
  }, [coords]);
  return null;
}

function App() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [perfil, setPerfil] = useState({ nome: '', tipo: '', deficiencia: '' });
  const [position, setPosition] = useState([-8.122672, -34.965546]); 
  const [path, setPath] = useState([]); 
  const [isTracking, setIsTracking] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [tempPhoto, setTempPhoto] = useState(null);
  const [comentario, setComentario] = useState("");
  const fileInputRef = useRef(null);

  // --- CARREGAR DADOS SALVOS ---
  useEffect(() => {
    const salvoPerfil = localStorage.getItem('auditor_perfil');
    if (salvoPerfil) {
      setPerfil(JSON.parse(salvoPerfil));
      setIsRegistered(true);
    }
    const salvoPath = localStorage.getItem('auditor_path');
    const salvoMarkers = localStorage.getItem('auditor_markers');
    if (salvoPath) setPath(JSON.parse(salvoPath));
    if (salvoMarkers) setMarkers(JSON.parse(salvoMarkers));
  }, []);

  // --- PERSISTÊNCIA ---
  useEffect(() => { localStorage.setItem('auditor_path', JSON.stringify(path)); }, [path]);
  useEffect(() => { localStorage.setItem('auditor_markers', JSON.stringify(markers)); }, [markers]);

  // --- GPS ROBUSTO ---
  useEffect(() => {
    let watchId = null;
    if (isTracking) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (!isNaN(lat) && !isNaN(lng)) {
            setPosition([lat, lng]);
            setPath(prev => [...prev, [lat, lng]]);
          }
        },
        (err) => console.error("Erro GPS:", err),
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [isTracking]);

  const finalizarCadastro = () => {
    if (perfil.nome) {
      localStorage.setItem('auditor_perfil', JSON.stringify(perfil));
      setIsRegistered(true);
    } else {
      alert("Por favor, introduza o seu nome.");
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

  const salvarOcorrencia = () => {
    const nova = { 
      pos: position, 
      tipo: 'Barreira Detectada', 
      comentario: comentario, 
      foto: tempPhoto, 
      hora: new Date().toLocaleTimeString() 
    };
    setMarkers([...markers, nova]);
    setShowModal(false);
    setTempPhoto(null);
    setComentario("");
  };

  // --- TELA DE CADASTRO (DE VOLTA) ---
  if (!isRegistered) {
    return (
      <div style={{ padding: '40px 20px', fontFamily: 'sans-serif', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#22c55e', width: 70, height: 70, borderRadius: 20, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>APP</div>
        <h2 style={{ color: '#333' }}>Auditoria Cidadã</h2>
        <p style={{ color: '#666', marginBottom: 30 }}>Identifique-se para começar o percurso.</p>
        
        <input style={inputStyle} placeholder="O seu nome completo" value={perfil.nome} onChange={e => setPerfil({...perfil, nome: e.target.value})} />
        
        <select style={inputStyle} value={perfil.tipo} onChange={e => setPerfil({...perfil, tipo: e.target.value})}>
          <option value="">Você é portador de deficiência?</option>
          <option value="sim">Sim</option>
          <option value="nao">Não / Apoiador</option>
        </select>

        {perfil.tipo === 'sim' && (
          <input style={inputStyle} placeholder="Qual a deficiência?" value={perfil.deficiencia} onChange={e => setPerfil({...perfil, deficiencia: e.target.value})} />
        )}

        <button onClick={finalizarCadastro} style={{...btnStyle, width: '100%', backgroundColor: '#22c55e', marginTop: 10}}>Aceder ao Mapa</button>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden' }}>
      {/* HEADER */}
      <div style={{ position: 'absolute', top: 15, zIndex: 1000, width: '100%', display: 'flex', justifyContent: 'center', gap: 10 }}>
        <button onClick={() => setIsTracking(!isTracking)} style={{...btnStyle, backgroundColor: isTracking ? '#ef4444' : '#22c55e'}}>
          {isTracking ? <Square size={18}/> : <Play size={18}/>} {isTracking ? 'Parar' : 'Iniciar'}
        </button>
        {isTracking && (
          <button onClick={() => setShowModal(true)} style={{...btnStyle, backgroundColor: '#f59e0b'}}>
            <Camera size={18}/> Ocorrência
          </button>
        )}
      </div>

      {/* MAPA COM PROTEÇÃO ANTI-TELA PRETA */}
      {position && !isNaN(position[0]) ? (
        <MapContainer center={position} zoom={17} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Polyline positions={path} color="#ef4444" weight={6} />
          <Marker position={position} icon={userIcon} />
          {markers.map((m, i) => (
            <Marker key={i} position={m.pos} icon={redIcon}>
              <Popup><b>{m.tipo}</b><br/>{m.hora}</Popup>
            </Marker>
          ))}
          <AutoCenter coords={position} />
        </MapContainer>
      ) : (
        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
          A localizar GPS...
        </div>
      )}

      {/* MODAL DE OCORRÊNCIA */}
      {showModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ marginTop: 0 }}>Registar Barreira</h3>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleCapture} style={{ display: 'none' }} />
            
            <div onClick={() => fileInputRef.current.click()} style={uploadArea}>
              {tempPhoto ? <img src={tempPhoto} style={{width:'100%', borderRadius:10}} /> : <span>Tirar Foto da Ocorrência</span>}
            </div>

            <textarea style={inputStyle} placeholder="Descrição curta..." onChange={e => setComentario(e.target.value)} />
            
            <button onClick={salvarOcorrencia} style={{...btnStyle, width: '100%', backgroundColor: '#22c55e', marginBottom: 10}} disabled={!tempPhoto}>Confirmar</button>
            <button onClick={() => setShowModal(false)} style={{...btnStyle, width: '100%', backgroundColor: '#6b7280'}}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- ESTILOS REVISADOS ---
const inputStyle = { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '15px' };
const btnStyle = { padding: '12px 20px', borderRadius: '50px', border: 'none', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: '15px' };
const modalOverlay = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalContent = { backgroundColor: 'white', padding: 25, borderRadius: 25, width: '85%', maxWidth: 350, textAlign: 'center' };
const uploadArea = { border: '2px dashed #ccc', borderRadius: 15, padding: 30, marginBottom: 20, cursor: 'pointer', color: '#666', fontWeight: 'bold' };

export default App;