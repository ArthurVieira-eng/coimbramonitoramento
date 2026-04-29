import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { ref, onValue, update, remove } from 'firebase/database';
import { Trash2, Image as ImageIcon, MapPin, X } from 'lucide-react';

// Função de Haversine para calcular distância em metros
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Raio da Terra em metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

export default function OccurrencesList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const ocorrenciasRef = ref(db, 'ocorrencias');
    onValue(ocorrenciasRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        let list = Object.keys(val).map(key => ({
          id: key,
          ...val[key],
          status: val[key].status || 'pendente'
        }));

        // Calcular Agrupamentos
        list.forEach((item, _, arr) => {
          let relacionadas = 0;
          if (item.pos && item.pos.length === 2) {
            arr.forEach(other => {
              if (item.id !== other.id && item.categoria === other.categoria && other.pos && other.pos.length === 2) {
                const dist = getDistanceFromLatLonInMeters(item.pos[0], item.pos[1], other.pos[0], other.pos[1]);
                if (dist <= 20) {
                  relacionadas++;
                }
              }
            });
          }
          item.relacionadas = relacionadas;
          
          if (relacionadas >= 5) item.impacto = 'Alto';
          else if (relacionadas >= 2) item.impacto = 'Médio';
          else item.impacto = 'Baixo';
        });

        // Ordenar por data (mais recentes primeiro)
        list.reverse();
        setData(list);
      } else {
        setData([]);
      }
      setLoading(false);
    });
  }, []);

  const handleStatusChange = (id, newStatus) => {
    update(ref(db, `ocorrencias/${id}`), { status: newStatus })
      .then(() => console.log('Status atualizado'))
      .catch(e => alert('Erro ao atualizar'));
  };

  const handleDelete = (id) => {
    if (window.confirm("Deseja realmente excluir este registro?")) {
      remove(ref(db, `ocorrencias/${id}`))
        .then(() => alert('Excluído com sucesso'))
        .catch(e => alert('Erro ao excluir'));
    }
  };

  const handleViewMap = (item) => {
    if (item.pos && item.pos.length === 2) {
      navigate(`/admin/mapa?lat=${item.pos[0]}&lng=${item.pos[1]}&id=${item.id}`);
    } else {
      alert("Localização não disponível para este registro.");
    }
  };

  if (loading) return <div>Carregando ocorrências...</div>;

  return (
    <div>
      <h2 style={{ color: '#334155', marginTop: 0, marginBottom: '20px' }}>Gerenciar Ocorrências</h2>

      <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F1F5F9', color: '#64748B' }}>
              <th style={thStyle}>Foto</th>
              <th style={thStyle}>Data</th>
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>Autor</th>
              <th style={thStyle}>Impacto</th>
              <th style={thStyle}>Localização</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={tdStyle}>
                  {item.foto ? (
                    <img 
                      src={item.foto} 
                      alt="Ocorrencia" 
                      style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', cursor: 'pointer' }} 
                      onClick={() => setSelectedImage(item.foto)}
                      title="Clique para ampliar"
                    />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}>
                      <ImageIcon size={20} />
                    </div>
                  )}
                </td>
                <td style={tdStyle}>{item.horario || '-'}</td>
                <td style={{...tdStyle, fontWeight: 'bold', color: '#334155'}}>{item.categoria}</td>
                <td style={tdStyle}>{item.autor}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ 
                      display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', width: 'fit-content',
                      backgroundColor: item.impacto === 'Alto' ? '#FEE2E2' : item.impacto === 'Médio' ? '#FEF3C7' : '#DCFCE7',
                      color: item.impacto === 'Alto' ? '#991B1B' : item.impacto === 'Médio' ? '#92400E' : '#166534'
                    }}>
                      {item.impacto}
                    </span>
                    {item.relacionadas > 0 && (
                      <span style={{ fontSize: '11px', color: '#64748B' }}>+{item.relacionadas} similares</span>
                    )}
                  </div>
                </td>
                <td style={tdStyle}>
                  <button 
                    onClick={() => handleViewMap(item)}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F1F5F9', color: '#00A8FF', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                  >
                    <MapPin size={14} /> Ver no Mapa
                  </button>
                </td>
                <td style={tdStyle}>
                  <select 
                    value={item.status} 
                    onChange={e => handleStatusChange(item.id, e.target.value)}
                    style={{
                      padding: '6px 10px', borderRadius: '20px', border: '1px solid #E2E8F0', outline: 'none', cursor: 'pointer',
                      backgroundColor: item.status === 'resolvido' ? '#DCFCE7' : item.status === 'pendente' ? '#FEE2E2' : '#FEF3C7',
                      color: item.status === 'resolvido' ? '#166534' : item.status === 'pendente' ? '#991B1B' : '#92400E',
                      fontWeight: 'bold', fontSize: '12px'
                    }}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="analise">Em Análise</option>
                    <option value="resolvido">Resolvido</option>
                  </select>
                </td>
                <td style={tdStyle}>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF4444', padding: '5px' }}
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && <p style={{ textAlign: 'center', color: '#94A3B8', marginTop: '20px' }}>Nenhuma ocorrência registrada.</p>}
      </div>

      {/* Modal de Imagem */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <button 
              onClick={() => setSelectedImage(null)}
              style={{ position: 'absolute', top: '-40px', right: 0, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={32} />
            </button>
            <img 
              src={selectedImage} 
              alt="Ampliada" 
              style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '10px', objectFit: 'contain', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
              onClick={e => e.stopPropagation()} // Evita fechar ao clicar na própria imagem
            />
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '15px 10px' };
const tdStyle = { padding: '15px 10px', verticalAlign: 'middle', color: '#475569' };
