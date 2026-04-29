import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { db } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { useSearchParams } from 'react-router-dom';

const redIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });
const greenIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });
const orangeIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });
const violetIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [35, 51], iconAnchor: [17, 51] });

// --- Componentes Internos para o Mapa ---
function HeatmapLayer({ data }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const points = data.map(d => [d.pos[0], d.pos[1], 1]);
    const heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, data]);
  return null;
}

function MapEffect({ data, selectedCity, loading }) {
  const map = useMap();
  useEffect(() => {
    if (loading || data.length === 0) return;
    if (selectedCity) {
      const bounds = L.latLngBounds(data.map(d => [d.pos[0], d.pos[1]]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [map, data, selectedCity, loading]);
  return null;
}
// ----------------------------------------

export default function AdminMap() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const markerRefs = useRef({});

  // Filtros State
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [viewMode, setViewMode] = useState('both'); // 'pins', 'heat', 'both'

  const targetId = searchParams.get('id');
  const targetLat = parseFloat(searchParams.get('lat'));
  const targetLng = parseFloat(searchParams.get('lng'));

  useEffect(() => {
    const ocorrenciasRef = ref(db, 'ocorrencias');
    onValue(ocorrenciasRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list = Object.keys(val).map(key => ({
          id: key,
          ...val[key],
          status: val[key].status || 'pendente'
        }));
        setData(list);

        // Extrai países únicos (apenas das ocorrências que têm a propriedade 'pais')
        const uniqueCountries = [...new Set(list.map(item => item.pais).filter(Boolean))].sort();
        setCountries(uniqueCountries);
      } else {
        setData([]);
      }
      setLoading(false);
    });
  }, []);

  // Lógica de Filtro
  useEffect(() => {
    let filtered = data;
    
    if (selectedCountry) {
      filtered = filtered.filter(item => item.pais === selectedCountry);
      // Atualiza cidades disponíveis
      const uniqueCities = [...new Set(filtered.map(item => item.cidade).filter(Boolean))].sort();
      setCities(uniqueCities);
    } else {
      setCities([]);
      setSelectedCity('');
    }

    if (selectedCity) {
      filtered = filtered.filter(item => item.cidade === selectedCity);
    }
    
    setFilteredData(filtered);
  }, [data, selectedCountry, selectedCity]);

  // Popups para targetId
  useEffect(() => {
    if (!loading && targetId && markerRefs.current[targetId]) {
      setTimeout(() => {
        markerRefs.current[targetId].openPopup();
      }, 600);
    }
  }, [loading, targetId, filteredData]);

  const getIcon = (status, isTarget) => {
    if (isTarget) return violetIcon;
    if (status === 'resolvido') return greenIcon;
    if (status === 'analise') return orangeIcon;
    return redIcon;
  };

  if (loading) return <div>Carregando mapa...</div>;

  const defaultCenter = (targetLat && targetLng && !isNaN(targetLat)) 
    ? [targetLat, targetLng] 
    : (data.length > 0 && data[0].pos ? data[0].pos : [40.2033, -8.4103]);

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 120px)', width: '100%', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
      
      {/* Overlay de Filtros */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 1000, backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', minWidth: '220px', fontFamily: 'sans-serif' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#010615', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
          Filtros do Mapa
        </h3>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748B', marginBottom: '5px' }}>País</label>
          <select value={selectedCountry} onChange={e => { setSelectedCountry(e.target.value); setSelectedCity(''); }} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}>
             <option value="">Selecione um país</option>
             {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748B', marginBottom: '5px' }}>Cidade</label>
          <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} disabled={!selectedCountry} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none', opacity: !selectedCountry ? 0.6 : 1 }}>
             <option value="">Selecione uma cidade</option>
             {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748B', marginBottom: '5px' }}>Visualização</label>
          <select value={viewMode} onChange={e => setViewMode(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}>
             <option value="both">Calor e Pins</option>
             <option value="heat">Apenas Calor</option>
             <option value="pins">Apenas Pins</option>
          </select>
        </div>
        
        {filteredData.length === 0 && !loading && (
          <div style={{ marginTop: '15px', padding: '8px', backgroundColor: '#FEF2F2', borderRadius: '5px', fontSize: '12px', color: '#EF4444', fontWeight: 'bold', textAlign: 'center' }}>
            Nenhuma ocorrência disponível.
          </div>
        )}
      </div>

      <MapContainer 
        center={defaultCenter} 
        zoom={targetId ? 18 : 16} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        <MapEffect data={filteredData} selectedCity={selectedCity} loading={loading} />
        
        {(viewMode === 'heat' || viewMode === 'both') && <HeatmapLayer data={filteredData} />}

        {(viewMode === 'pins' || viewMode === 'both') && filteredData.map((m) => (
          <Marker 
            key={m.id} 
            position={m.pos} 
            icon={getIcon(m.status, m.id === targetId)}
            ref={(ref) => {
              if (ref) markerRefs.current[m.id] = ref;
            }}
          >
            <Popup minWidth={220} maxWidth={300}>
              <div style={{ fontFamily: 'sans-serif' }}>
                {m.foto && (
                  <div style={{ marginBottom: '10px', width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={m.foto} alt="Ocorrência" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <h4 style={{ margin: '0 0 5px 0', color: '#334155', fontSize: '16px' }}>{m.categoria}</h4>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#64748B' }}>{m.detalhes}</p>
                
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                  <span><strong style={{color: '#64748B'}}>Status:</strong> {m.status.toUpperCase()}</span><br/>
                  <span><strong style={{color: '#64748B'}}>Autor:</strong> {m.autor}</span><br/>
                  {m.cidade && m.pais && (
                    <span style={{ display: 'inline-block', marginTop: '5px', padding: '2px 6px', backgroundColor: '#F1F5F9', borderRadius: '4px' }}>
                      📍 {m.cidade}, {m.pais}
                    </span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
