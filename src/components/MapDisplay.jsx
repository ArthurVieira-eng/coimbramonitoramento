import React, { memo, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Ícones personalizados
const redIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });
const userIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });
const clickIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });

function AutoCenter({ coords }) {
  const map = useMap();
  useEffect(() => { 
    if (coords && Array.isArray(coords) && !isNaN(coords[0])) {
      map.setView(coords, map.getZoom()); 
    }
  }, [coords, map]);
  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

const MapDisplay = memo(({ position, path, markers, clickedPosition, onMapClick }) => {
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
        <Marker key={i} position={m.pos || [m.latitude, m.longitude]} icon={redIcon}>
          <Popup minWidth={220} maxWidth={280}>
            <div style={{ fontFamily: 'sans-serif', padding: '2px 0' }}>
              {m.foto && (
                <img 
                  src={m.foto} 
                  alt="Foto da Barreira" 
                  style={{ 
                    width: '100%', 
                    height: '140px', 
                    objectFit: 'cover', 
                    borderRadius: '8px', 
                    marginBottom: '10px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                  }} 
                />
              )}
              <h4 style={{ margin: '0 0 5px 0', color: '#00A8FF', fontSize: '16px', fontWeight: 'bold' }}>
                {m.categoria}
              </h4>
              {m.detalhes && (
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333', lineHeight: '1.4' }}>
                  {m.detalhes}
                </p>
              )}
              
              <div style={{ 
                borderTop: '1px solid #EEE', 
                paddingTop: '8px', 
                fontSize: '12px', 
                color: '#777',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
              }}>
                <span><strong style={{color: '#555'}}>Por:</strong> {m.autor}</span>
                {m.horario && <span><strong style={{color: '#555'}}>Data:</strong> {m.horario}</span>}
                {m.endereco && <span><strong style={{color: '#555'}}>Endereço:</strong> {m.endereco}</span>}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Rastro de Clique (Manual Location) */}
      {clickedPosition && (
        <Marker position={clickedPosition} icon={clickIcon}>
          <Popup>Posição selecionada manualmente</Popup>
        </Marker>
      )}

      {/* Centraliza automaticamente quando a posição mudar */}
      <AutoCenter coords={position} />

      <MapClickHandler onMapClick={onMapClick} />
    </MapContainer>
  );
});

export default MapDisplay;