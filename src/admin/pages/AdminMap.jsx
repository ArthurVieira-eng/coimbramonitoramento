import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { db } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { useSearchParams } from 'react-router-dom';

// 1. IMPORTA A IMAGEM DIRETAMENTE DA PASTA ASSETS
import logoPinImg from '../../assets/logo-pin.png'; 

// 2. CONFIGURAÇÃO DO ÍCONE USANDO A IMAGEM IMPORTADA
const createCustomIcon = (statusClass) => {
  return new L.Icon({
    iconUrl: logoPinImg, 
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [35, 45],       
    iconAnchor: [17, 45],     
    popupAnchor: [0, -40],
    shadowSize: [41, 41],
    className: `custom-pin-${statusClass}`
  });
};

// Função auxiliar para calcular distância em metros entre duas coordenadas (Haversine)
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

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

function MapEffect({ data, selectedCity, selectedUser, loading }) {
  const map = useMap();
  useEffect(() => {
    if (loading || data.length === 0) return;
    if (selectedCity || selectedUser) {
      const bounds = L.latLngBounds(data.map(d => [d.pos[0], d.pos[1]]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [map, data, selectedCity, selectedUser, loading]);
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
  const [users, setUsers] = useState([]); // Lista única de utilizadores
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedUser, setSelectedUser] = useState(''); // Utilizador selecionado
  const [onlyCommonPoints, setOnlyCommonPoints] = useState(false); // Toggle Tópico 4
  const [viewMode, setViewMode] = useState('both');

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

        const uniqueCountries = [...new Set(list.map(item => item.pais).filter(Boolean))].sort();
        setCountries(uniqueCountries);

        const uniqueUsers = [...new Set(list.map(item => item.email || item.autor).filter(Boolean))].sort();
        setUsers(uniqueUsers);
      } else {
        setData([]);
      }
      setLoading(false);
    });
  }, []);

  // TÓPICO 4: Cruzamento de Dados e identificação de pontos comuns (com base em raio de 30 metros)
  const processedData = useMemo(() => {
    return data.map((item) => {
      if (!item.pos) return { ...item, isCommon: false, commonUsersCount: 1 };

      const [lat1, lon1] = item.pos;
      const itemUser = item.email || item.autor || 'Anónimo';

      // Procura todas as ocorrências num raio de 30m
      const nearbyItems = data.filter((other) => {
        if (!other.pos) return false;
        const [lat2, lon2] = other.pos;
        const dist = getDistanceInMeters(lat1, lon1, lat2, lon2);
        return dist <= 30; // Raio em metros para considerar o mesmo ponto
      });

      // Contagem de utilizadores distintos que marcaram nesta mesma zona
      const uniqueUsersInArea = new Set(
        nearbyItems.map((o) => o.email || o.autor || 'Anónimo')
      );

      return {
        ...item,
        isCommon: uniqueUsersInArea.size > 1, // É ponto comum se mais de 1 utilizador marcou
        commonUsersCount: uniqueUsersInArea.size
      };
    });
  }, [data]);

  useEffect(() => {
    let filtered = processedData;
    
    if (selectedCountry) {
      filtered = filtered.filter(item => item.pais === selectedCountry);
      const uniqueCities = [...new Set(filtered.map(item => item.cidade).filter(Boolean))].sort();
      setCities(uniqueCities);
    } else {
      setCities([]);
      setSelectedCity('');
    }

    if (selectedCity) {
      filtered = filtered.filter(item => item.cidade === selectedCity);
    }

    // Filtro por Utilizador (Tópico 2)
    if (selectedUser) {
      filtered = filtered.filter(item => (item.email === selectedUser || item.autor === selectedUser));
    }

    // Filtro por Pontos Comuns / Sobrepostos (Tópico 4)
    if (onlyCommonPoints) {
      filtered = filtered.filter(item => item.isCommon);
    }
    
    setFilteredData(filtered);
  }, [processedData, selectedCountry, selectedCity, selectedUser, onlyCommonPoints]);

  useEffect(() => {
    if (!loading && targetId && markerRefs.current[targetId]) {
      setTimeout(() => {
        markerRefs.current[targetId].openPopup();
      }, 600);
    }
  }, [loading, targetId, filteredData]);

  // Ícones baseado no estado e se é um ponto comum cruzado
  const getIcon = (item, isTarget) => {
    if (isTarget) return createCustomIcon('target');
    if (item.isCommon) return createCustomIcon('comum'); // Destaque para pontos cruzados
    if (item.status === 'resolvido') return createCustomIcon('verde');
    if (item.status === 'analise') return createCustomIcon('amarelo');
    return createCustomIcon('vermelho');
  };

  if (loading) return <div>Carregando mapa...</div>;

  const defaultCenter = (targetLat && targetLng && !isNaN(targetLat)) 
    ? [targetLat, targetLng] 
    : (data.length > 0 && data[0].pos ? data[0].pos : [40.2033, -8.4103]);

  // Rota do utilizador selecionado
  const userPath = selectedUser 
    ? filteredData
        .filter(item => item.pos && Array.isArray(item.pos))
        .map(item => item.pos)
    : [];

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 120px)', width: '100%', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
      
      {/* Estilos CSS com classe para o novo Pin Comum */}
      <style>{`
        .custom-pin-vermelho { filter: hue-rotate(180deg) saturate(8) brightness(0.8) contrast(1.5); }
        .custom-pin-amarelo { filter: hue-rotate(200deg) saturate(4) brightness(1.2); }
        .custom-pin-verde { filter: hue-rotate(260deg) saturate(2.5) brightness(0.9); }
        .custom-pin-target { filter: hue-rotate(70deg) saturate(3) brightness(1); }
        .custom-pin-comum { filter: hue-rotate(280deg) saturate(10) brightness(1.1) contrast(1.4); }
      `}</style>

      {/* Overlay de Filtros */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 1000, backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', minWidth: '240px', fontFamily: 'sans-serif' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#010615', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
          Filtros do Mapa
        </h3>

        {/* Toggle para Cruzamento de Dados / Pontos Comuns (Tópico 4) */}
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#FFF5F5', borderRadius: '8px', border: '1px solid #FEB2B2' }}>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 'bold', color: '#C53030', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={onlyCommonPoints} 
              onChange={e => setOnlyCommonPoints(e.target.checked)} 
              style={{ marginRight: '8px', cursor: 'pointer' }}
            />
            📍 Apenas Pontos Comuns (Vários Utilizadores)
          </label>
        </div>

        {/* Filtro por Utilizador */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#00A8FF', marginBottom: '5px' }}>👤 Utilizador / Rota</label>
          <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #00A8FF', fontSize: '14px', outline: 'none', backgroundColor: '#F0F8FF' }}>
             <option value="">Todos os Utilizadores</option>
             {users.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        
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
             {selectedUser && <option value="route">Apenas Rota do Utilizador</option>}
             <option value="heat">Apenas Calor</option>
             <option value="pins">Apenas Pins</option>
          </select>
        </div>
      </div>

      <MapContainer center={defaultCenter} zoom={targetId ? 18 : 16} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapEffect data={filteredData} selectedCity={selectedCity} selectedUser={selectedUser} loading={loading} />
        
        {(viewMode === 'heat' || viewMode === 'both') && <HeatmapLayer data={filteredData} />}

        {/* Linha da Rota */}
        {selectedUser && userPath.length > 1 && (
          <Polyline positions={userPath} color="#00A8FF" weight={5} dashArray="8, 8" />
        )}

        {(viewMode === 'pins' || viewMode === 'both' || viewMode === 'route') && filteredData.map((m) => (
          <Marker 
            key={m.id} 
            position={m.pos} 
            icon={getIcon(m, m.id === targetId)}
            ref={(ref) => {
              if (ref) markerRefs.current[m.id] = ref;
            }}
          >
            <Popup minWidth={220} maxWidth={300}>
              <div style={{ fontFamily: 'sans-serif' }}>
                {/* Badge de Destaque no Popup para Pontos Comuns */}
                {m.isCommon && (
                  <div style={{ backgroundColor: '#E9D5FF', border: '1px solid #9333EA', color: '#6B21A8', padding: '6px', borderRadius: '6px', marginBottom: '10px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>
                    🔥 Ponto Comum: Reportado por {m.commonUsersCount} utilizadores
                  </div>
                )}

                {m.foto && (
                  <div style={{ marginBottom: '10px', width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={m.foto} alt="Ocorrência" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <h4 style={{ margin: '0 0 5px 0', color: '#334155', fontSize: '16px' }}>{m.categoria}</h4>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#64748B' }}>{m.detalhes}</p>
                
                {m.audio && (
                  <div style={{ marginBottom: '12px', padding: '6px', backgroundColor: '#F0F8FF', borderRadius: '8px', border: '1px solid #00A8FF' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#00A8FF', display: 'block', marginBottom: '4px' }}>🎙️ Relato de Voz:</span>
                    <audio src={m.audio} controls style={{ width: '100%', height: '30px' }} />
                  </div>
                )}

                {/* Exibição dos dados do Inquérito se existirem */}
                {m.inqueritoPosRegisto && (
                  <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#F8FAFC', borderRadius: '6px', fontSize: '11px', color: '#475569' }}>
                    <strong>Freq. Passagem:</strong> {m.inqueritoPosRegisto.frequenciaPassagem}<br/>
                    <strong>Destino:</strong> {m.inqueritoPosRegisto.destinoObstaculo}
                  </div>
                )}

                <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                  <span><strong style={{color: '#64748B'}}>Status:</strong> {m.status.toUpperCase()}</span><br/>
                  <span><strong style={{color: '#64748B'}}>Autor:</strong> {m.autor}</span><br/>
                  {m.email && <span><strong style={{color: '#64748B'}}>Email:</strong> {m.email}</span>}<br/>
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