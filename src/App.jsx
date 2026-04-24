import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { Play, Square, Camera, RefreshCw, MapPin } from 'lucide-react';
import L from 'leaflet';

// --- ÍCONES ---
const redIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });
const userIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });

function AutoCenter({ coords }) {
  const map = useMap();
  useEffect(() => { 
    if (coords && !isNaN(coords[0])) map.setView(coords, map.getZoom()); 
  }, [coords]);
  return null;
}

function App() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [perfil, setPerfil] = useState({ nome: '', email: '', tipo: '' });
  const [position, setPosition] = useState([-8.122672, -34.965546]); 
  const [path, setPath] = useState([]); 
  const [isTracking, setIsTracking] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [tempPhoto, setTempPhoto] = useState(null);
  
  // ESTADOS SEPARADOS PARA NÃO INTERFERIREM
  const [sugestaoSelecionada, setSugestaoSelecionada] = useState("");
  const [textoLivre, setTextoLivre] = useState("");
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const salvo = localStorage.getItem('auditor_perfil');
    if (salvo) { setPerfil(JSON.parse(salvo)); setIsRegistered(true); }
    const p = localStorage.getItem('auditor_path');
    const m = localStorage.getItem('auditor_markers');
    if (p) setPath(JSON.parse(p));
    if (m) setMarkers(JSON.parse(m));
  }, []);

  useEffect(() => {
    let watchId = null;
    if (isTracking) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (!isNaN(lat)) {
            setPosition([lat, lng]);
            setPath(prev => [...prev, [lat, lng]]);
            localStorage.setItem('auditor_path', JSON.stringify([...path, [lat, lng]]));
          }
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [isTracking]);

  const handleLogin = () => {
    if (perfil.nome && perfil.email) {
      localStorage.setItem('auditor_perfil', JSON.stringify(perfil));
      setIsRegistered(true);
    } else { alert("Preencha os dados de acesso."); }
  };

  const handleNewRun = () => {
    if(window.confirm("Iniciar nova corrida? O mapa atual será limpo.")) {
      setPath([]); setMarkers([]); setIsTracking(false);
      localStorage.removeItem('auditor_path');
      localStorage.removeItem('auditor_markers');
    }
  };

  const salvarOcorrencia = () => {
    const novaOcorrencia = { 
      pos: position, 
      categoria: sugestaoSelecionada || "Geral", 
      detalhes: textoLivre,
      foto: tempPhoto 
    };
    const listaAtualizada = [...markers, novaOcorrencia];
    setMarkers(listaAtualizada);
    localStorage.setItem('auditor_markers', JSON.stringify(listaAtualizada));
    
    // Reseta tudo para a próxima
    setShowModal(false); setTempPhoto(null); setSugestaoSelecionada(""); setTextoLivre("");
  };

  if (!isRegistered) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={logoCircle}>Logo</div>
          <h2 style={{ color: '#00A8FF', marginBottom: '5px' }}>Auditoria Urbana</h2>
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>Sistema de Mapeamento de Acessibilidade</p>
          <input style={inputStyle} placeholder="Nome Completo" onChange={e => setPerfil({...perfil, nome: e.target.value})} />
          <input style={inputStyle} type="email" placeholder="E-mail Institucional" onChange={e => setPerfil({...perfil, email: e.target.value})} />
          <button onClick={handleLogin} style={mainBtn}>ENTRAR NO SISTEMA</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden' }}>
      
      <div style={headerStyle}>
        {!isTracking ? (
          <button onClick={() => setIsTracking(true)} style={{...controlBtn, backgroundColor: '#00A8FF', flex: 2}}>
            <Play size={20}/> <span style={{marginLeft: 8}}>Iniciar Corrida</span>
          </button>
        ) : (
          <>
            <button onClick={() => setIsTracking(false)} style={{...controlBtn, backgroundColor: '#ff4444'}}>
              <Square size={18}/>
            </button>
            <button onClick={() => setShowModal(true)} style={{...controlBtn, backgroundColor: '#00A8FF', flex: 2}}>
              <Camera size={20}/> <span style={{marginLeft: 8}}>Ocorrência</span>
            </button>
          </>
        )}
        <button onClick={handleNewRun} style={{...controlBtn, backgroundColor: '#6b7280', fontSize: '11px'}}>
          <RefreshCw size={14} style={{marginRight: 4}}/> Reiniciar
        </button>
      </div>

      {position && !isNaN(position[0]) ? (
        <MapContainer center={position} zoom={17} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Polyline positions={path} color="#00A8FF" weight={6} />
          <Marker position={position} icon={userIcon} />
          {markers.map((m, i) => (
            <Marker key={i} position={m.pos} icon={redIcon}>
              <Popup>
                <strong>{m.categoria}</strong><br/>
                {m.detalhes}
              </Popup>
            </Marker>
          ))}
          <AutoCenter coords={position} />
        </MapContainer>
      ) : (
        <div style={loadingArea}><MapPin className="animate-bounce" /> Buscando Sinal GPS...</div>
      )}

      {showModal && (
        <div style={overlay}>
          <div style={modalStyle}>
            <h3 style={{color: '#00A8FF', margin: '0 0 15px 0'}}>Nova Ocorrência</h3>
            
            <input type="file" accept="image/*" capture="camera" ref={fileInputRef} onChange={(e) => {
                 const file = e.target.files[0];
                 if (file) {
                   const reader = new FileReader();
                   reader.onloadend = () => setTempPhoto(reader.result);
                   reader.readAsDataURL(file);
                 }
            }} style={{ display: 'none' }} />

            <div onClick={() => fileInputRef.current.click()} style={dropzone}>
              {tempPhoto ? <img src={tempPhoto} style={{width:'100%', borderRadius: '10px'}} /> : 
              <div style={{color: '#00A8FF'}}><Camera size={30}/><div style={{fontWeight:'bold'}}>CLICK AQUI</div></div>}
            </div>

            {/* SEÇÃO DE SUGESTÕES (TAGS SEPARADAS) */}
            <p style={labelStyle}>Selecione o tipo de barreira:</p>
            <div style={tagGrid}>
               {["Buraco", "Calçada Estreita", "Degrau", "Rampa Inexistente"].map(tag => (
                 <button key={tag} 
                   onClick={() => setSugestaoSelecionada(tag)} 
                   style={{...tagBtn, backgroundColor: sugestaoSelecionada === tag ? '#00A8FF' : '#FFF', color: sugestaoSelecionada === tag ? '#FFF' : '#00A8FF'}}>
                   {tag}
                 </button>
               ))}
            </div>

            {/* CAMPO DE TEXTO INDEPENDENTE */}
            <p style={labelStyle}>Observações adicionais:</p>
            <textarea 
              style={inputStyle} 
              placeholder="Ex: Próximo ao poste x..." 
              value={textoLivre}
              onChange={e => setTextoLivre(e.target.value)}
            />

            <button onClick={salvarOcorrencia} style={{...mainBtn, width: '100%'}} disabled={!tempPhoto}>SALVAR REGISTRO</button>
            <button onClick={() => setShowModal(false)} style={cancelLink}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- ESTILOS ---
const containerStyle = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F8FF', fontFamily: 'sans-serif' };
const cardStyle = { backgroundColor: 'white', padding: '35px', borderRadius: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', width: '85%', maxWidth: '350px', borderTop: '8px solid #00A8FF' };
const logoCircle = { width: '60px', height: '60px', backgroundColor: '#00A8FF', borderRadius: '18px', margin: '0 auto 15px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #DDD', boxSizing: 'border-box', backgroundColor: '#F9F9F9', fontSize: '14px' };
const mainBtn = { backgroundColor: '#00A8FF', color: 'white', border: 'none', padding: '16px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' };
const headerStyle = { position: 'absolute', top: '20px', zIndex: 1000, width: '94%', left: '3%', display: 'flex', gap: '8px' };
const controlBtn = { border: 'none', padding: '12px', borderRadius: '16px', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', cursor: 'pointer' };
const overlay = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' };
const modalStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '25px', width: '85%', maxWidth: '340px', textAlign: 'center' };
const dropzone = { border: '2px dashed #00A8FF', backgroundColor: '#F0F8FF', borderRadius: '15px', padding: '20px', marginBottom: '15px', cursor: 'pointer' };
const tagGrid = { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '15px', justifyContent: 'center' };
const tagBtn = { padding: '8px 12px', borderRadius: '10px', border: '1px solid #00A8FF', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' };
const labelStyle = { fontSize: '12px', color: '#666', textAlign: 'left', marginBottom: '5px', fontWeight: 'bold' };
const cancelLink = { background: 'none', border: 'none', marginTop: '15px', color: '#999', cursor: 'pointer', fontSize: '13px' };
const loadingArea = { display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#00A8FF', fontWeight: 'bold', gap: '10px' };

export default App;