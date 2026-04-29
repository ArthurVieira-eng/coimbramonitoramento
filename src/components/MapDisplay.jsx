import React, { memo, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Ícones personalizados
const redIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });
const userIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });

function AutoCenter({ coords }) {
  const map = useMap();
  useEffect(() => { 
    if (coords && Array.isArray(coords) && !isNaN(coords[0])) {
      map.setView(coords, map.getZoom()); 
    }
  }, [coords, map]);
  return null;
}

const MapDisplay = memo(({ position, path, markers }) => {
  // Coordenada central de Portugal (Coimbra) para o mapa não abrir no vazio
  const defaultCenter = [40.2033, -8.4103];

  // SE NÃO TIVER POSIÇÃO AINDA: Mostra uma tela de carregamento amigável
  if (!position) {
    return (
      <div style={{ 
        height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f8ff' 
      }}>
        <div className="spinner" style={{ 
          border: '4px solid rgba(0, 168, 255, 0.1)', borderLeft: '4px solid #00A8FF',
          borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' 
        }}></div>
        <p style={{ marginTop: '15px', color: '#00A8FF', fontWeight: 'bold', fontFamily: 'sans-serif' }}>
          Obtendo localização em Portugal...
        </p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <MapContainer 
      center={position || defaultCenter} 
      zoom={17} 
      zoomControl={false} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {/* Rastro do caminho */}
      <Polyline positions={path} color="#00A8FF" weight={6} />
      
      {/* Marcador do Usuário (SÓ APARECE SE TIVER POSIÇÃO) */}
      {position && <Marker position={position} icon={userIcon} />}
      
      {/* Ocorrências salvas */}
      {markers.map((m, i) => (
        <Marker key={i} position={m.pos} icon={redIcon}>
          <Popup>
            <strong>{m.categoria}</strong><br/>
            {m.detalhes}<br/>
            <small style={{color: '#666'}}>Por: {m.autor}</small>
          </Popup>
        </Marker>
      ))}

      {/* Centraliza automaticamente quando a posição mudar */}
      <AutoCenter coords={position} />
    </MapContainer>
  );
});

export default MapDisplay;