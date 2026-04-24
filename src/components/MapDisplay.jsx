import React, { memo, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const redIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });
const userIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });

function AutoCenter({ coords }) {
  const map = useMap();
  useEffect(() => { 
    if (coords && !isNaN(coords[0])) map.setView(coords, map.getZoom()); 
  }, [coords]);
  return null;
}

const MapDisplay = memo(({ position, path, markers }) => {
  return (
    <MapContainer center={position} zoom={17} zoomControl={false} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Polyline positions={path} color="#00A8FF" weight={6} />
      <Marker position={position} icon={userIcon} />
      {markers.map((m, i) => (
        <Marker key={i} position={m.pos} icon={redIcon}>
          <Popup>
            <strong>{m.categoria}</strong><br/>
            {m.detalhes}<br/>
            <small style={{color: '#666'}}>Por: {m.autor}</small>
          </Popup>
        </Marker>
      ))}
      <AutoCenter coords={position} />
    </MapContainer>
  );
});

export default MapDisplay;