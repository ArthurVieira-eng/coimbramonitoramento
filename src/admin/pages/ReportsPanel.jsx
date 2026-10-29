import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { FileText, Printer, Filter, User, MapPin, Tag, Compass } from 'lucide-react';

export default function ReportsPanel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados dos Filtros Específicos do Relatório
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUsage, setSelectedUsage] = useState('');

  // Listas únicas para os dropdowns de filtro
  const [usersList, setUsersList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [usagesList, setUsagesList] = useState([]);

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

        // Extrair opções únicas para os filtros institucionais
        setUsersList([...new Set(list.map(item => item.email || item.autor).filter(Boolean))].sort());
        setCitiesList([...new Set(list.map(item => item.cidade).filter(Boolean))].sort());
        setCategoriesList([...new Set(list.map(item => item.categoria).filter(Boolean))].sort());
        
        const usages = list.map(item => item.inqueritoPosRegisto?.destinoObstaculo).filter(Boolean);
        setUsagesList([...new Set(usages)].sort());
      } else {
        setData([]);
      }
      setLoading(false);
    });
  }, []);

  // Filtragem dinâmica dos dados para o relatório demonstrativo
  const filteredReportData = useMemo(() => {
    return data.filter(item => {
      const matchUser = selectedUser ? (item.email === selectedUser || item.autor === selectedUser) : true;
      const matchCity = selectedCity ? item.cidade === selectedCity : true;
      const matchCategory = selectedCategory ? item.categoria === selectedCategory : true;
      const matchUsage = selectedUsage ? item.inqueritoPosRegisto?.destinoObstaculo === selectedUsage : true;

      return matchUser && matchCity && matchCategory && matchUsage;
    });
  }, [data, selectedUser, selectedCity, selectedCategory, selectedUsage]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div style={{ padding: '20px', color: '#64748B' }}>A carregar relatórios demonstrativos...</div>;

  return (
    <div style={{ fontFamily: 'sans-serif', color: '#334155', paddingBottom: '40px' }}>
      
      {/* Cabeçalho e Botão de Impressão (oculto na impressão) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }} className="no-print">
        <div>
          <h2 style={{ color: '#1E293B', margin: 0 }}>Relatórios Demonstrativos Institucionais</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748B' }}>
            Geração de relatórios filtrados para o Município (Plano "Primeiro Aqui ao Lado")[cite: 2].
          </p>
        </div>
        <button 
          onClick={handlePrint}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#00A8FF', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
        >
          <Printer size={18} /> Imprimir / Exportar Relatório
        </button>
      </div>

      {/* Painel de Filtros Avançados (oculto na impressão) */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', marginBottom: '25px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginBottom: '15px', color: '#1E293B' }}>
          <Filter size={18} color="#00A8FF" /> Filtrar Relatório por Critérios Institucionais[cite: 2]
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
          
          {/* Filtro por Pessoa */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748B', marginBottom: '5px' }}>Por Pessoa / Utilizador</label>
            <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} style={selectStyle}>
              <option value="">Todos os utilizadores</option>
              {usersList.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* Filtro por Área Geográfica */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748B', marginBottom: '5px' }}>Por Área Geográfica (Cidade)</label>
            <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} style={selectStyle}>
              <option value="">Todas as cidades</option>
              {citiesList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Filtro por Tipo de Intervenção */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748B', marginBottom: '5px' }}>Por Tipo de Intervenção (Categoria)</label>
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={selectStyle}>
              <option value="">Todas as categorias</option>
              {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Filtro por Tipo de Utilização */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748B', marginBottom: '5px' }}>Por Tipo de Utilização / Destino</label>
            <select value={selectedUsage} onChange={e => setSelectedUsage(e.target.value)} style={selectStyle}>
              <option value="">Todos os tipos de utilização</option>
              {usagesList.map(use => <option key={use} value={use}>{use}</option>)}
            </select>
          </div>

        </div>
      </div>

      {/* Relatório Visual / Documento Oficial Gerado */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        
        <div style={{ borderBottom: '2px solid #E2E8F0', paddingBottom: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00A8FF', textTransform: 'uppercase', letterSpacing: '1px' }}>Relatório Oficial Anónimo / Demonstrativo</span>
            <h1 style={{ margin: '5px 0 0 0', fontSize: '20px', color: '#0F172A' }}>Projeto "Primeiro Aqui ao Lado" – Coimbra[cite: 2]</h1>
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', textAlign: 'right' }}>
            Data de Emissão: {new Date().toLocaleDateString('pt-PT')}<br />
            Total de Registos Filtrados: <strong>{filteredReportData.length}</strong>
          </div>
        </div>

        {/* Listagem dos Registos do Relatório */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredReportData.length > 0 ? (
            filteredReportData.map((item, index) => (
              <div key={item.id} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '15px', backgroundColor: '#F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold', color: '#1E293B' }}>
                  <span>#{index + 1} - {item.categoria}</span>
                  <span style={{ color: '#00A8FF', backgroundColor: '#E0F2FE', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                    Estado: {item.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px', color: '#475569' }}>
                  <div><strong>📍 Local:</strong> {item.endereco || 'N/A'}, {item.cidade || 'N/A'} ({item.pais || 'N/A'})</div>
                  <div><strong>👤 Autor / Perfil:</strong> {item.autor || 'Anónimo'} ({item.perfilUtilizador?.categoria || 'Cidadão'})</div>
                  <div><strong>📅 Horário:</strong> {item.horario || 'N/A'}</div>
                  <div><strong>🎯 Destino / Utilização:</strong> {item.inqueritoPosRegisto?.destinoObstaculo || 'Não especificado'}</div>
                </div>

                {item.detalhes && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#334155', borderTop: '1px dashed #CBD5E1', paddingTop: '6px' }}>
                    <strong>Detalhes / Descrição:</strong> {item.detalhes}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center', color: '#94A3B8', padding: '30px 0' }}>Nenhum registo encontrado com os filtros selecionados.</p>
          )}
        </div>

      </div>

    </div>
  );
}

const selectStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #CBD5E1',
  fontSize: '14px',
  outline: 'none',
  backgroundColor: '#FFFFFF',
  color: '#334155'
};