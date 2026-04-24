import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { Play, Square, Camera, User, Trash2, LogOut } from 'lucide-react';
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
  const [perfil, setPerfil] = useState({ nome: '', tipo: '' });
  const [position, setPosition] = useState([-8.122672, -34.965546]); 
  const [path, setPath] = useState([]); 
  const [isTracking, setIsTracking] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [tempPhoto, setTempPhoto] = useState(null);
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
          }
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [isTracking]);

  const handleLogin = () => {
    if (perfil.nome) {
      localStorage.setItem('auditor_perfil', JSON.stringify(perfil));
      setIsRegistered(true);
    }
  };

  const handleLogout = () => {
    if(window.confirm("Deseja sair e trocar de usuário?")) {
      localStorage.removeItem('auditor_perfil');
      setIsRegistered(false);
      setPerfil({ nome: '', tipo: '' });
    }
  };

  if (!isRegistered) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={logoCircle}>AUD</div>
          <h2 style={{ margin: '10px 0' }}>Auditoria Cidadã</h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Inicie o seu percurso</p>
          <input style={inputStyle} placeholder="Nome Completo" onChange={e => setPerfil({...perfil, nome: e.target.value})} />
          <button onClick={handleLogin} style={mainBtn}>Entrar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden' }}>
      <div style={headerStyle}>
        <button onClick={() => setIsTracking(!isTracking)} style={{...controlBtn, backgroundColor: isTracking ? '#ff4444' : '#22c55e'}}>
          {isTracking ? <Square size={18}/> : <Play size={18}/>}
        </button>
        {isTracking && (
          <button onClick={() => setShowModal(true)} style={{...controlBtn, backgroundColor: '#f59e0b'}}>
            <Camera size={18}/>
          </button>
        )}
        <button onClick={handleLogout} style={{...controlBtn, backgroundColor: '#6b7280'}}>
          <LogOut size={18}/>
        </button>
      </div>

      {position && !isNaN(position[0]) ? (
        <MapContainer center={position} zoom={17} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Polyline positions={path} color="#ff4444" weight={5} />
          <Marker position={position} icon={userIcon} />
          {markers.map((m, i) => (
            <Marker key={i} position={m.pos} icon={redIcon} />
          ))}
          <AutoCenter coords={position} />
        </MapContainer>
      ) : (
        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>A localizar GPS...</div>
      )}

      {showModal && (
        <div style={overlay}>
          <div style={modalStyle}>
            <h3>Nova Ocorrência</h3>
            
            {/* INPUT COM CAPTURE="CAMERA" PARA FORÇAR O ANDROID */}
            <input 
              type="file" 
              accept="image/*" 
              capture="camera" 
              ref={fileInputRef} 
              onChange={(e) => {
                 const file = e.target.files[0];
                 if (file) {
                   const reader = new FileReader();
                   reader.onloadend = () => setTempPhoto(reader.result);
                   reader.readAsDataURL(file);
                 }
              }} 
              style={{ display: 'none' }} 
            />

            <div onClick={() => fileInputRef.current.click()} style={dropzone}>
              {tempPhoto ? (
                <img src={tempPhoto} style={{width:'100%', borderRadius: '10px'}} alt="Preview" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Camera size={30} />
                  <span>Tirar Foto</span>
                </div>
              )}
            </div>

            <button onClick={() => {
              setMarkers([...markers, { pos: position, foto: tempPhoto }]);
              setShowModal(false); setTempPhoto(null);
            }} style={{...mainBtn, width: '100%'}} disabled={!tempPhoto}>Confirmar</button>
            <button onClick={() => { setShowModal(false); setTempPhoto(null); }} style={{ background: 'none', border: 'none', marginTop: '15px', color: '#666', cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- ESTILOS ---
const containerStyle = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' };
const cardStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', width: '85%', maxWidth: '350px' };
const logoCircle = { width: '60px', height: '60px', backgroundColor: '#22c55e', borderRadius: '20px', margin: '0 auto 15px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '12px', border: '1px solid #ddd', boxSizing: 'border-box' };
const mainBtn = { backgroundColor: '#22c55e', color: 'white', border: 'none', padding: '14px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', width: '100%' };
const headerStyle = { position: 'absolute', top: '20px', zIndex: 1000, width: '100%', display: 'flex', justifyContent: 'center', gap: '10px' };
const controlBtn = { border: 'none', padding: '15px', borderRadius: '50%', color: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const overlay = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '25px', width: '80%', maxWidth: '320px', textAlign: 'center' };
const dropzone = { border: '2px dashed #ccc', borderRadius: '15px', padding: '30px', marginBottom: '15px', color: '#666', fontWeight: 'bold', cursor: 'pointer' };

export default App;