import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  MapPin, 
  Activity, 
  HelpCircle,
  TrendingUp 
} from 'lucide-react';

// Função de Haversine para cálculo de proximidade e identificação de pontos sobrepostos
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    total: 0,
    pendentes: 0,
    emAnalise: 0,
    resolvidos: 0,
    pcdCount: 0,
    pontosCriticos: 0,
    categorias: {},
    tipologias: {},
    frequencias: {},
    destinos: {}
  });

  useEffect(() => {
    const ocorrenciasRef = ref(db, 'ocorrencias');
    onValue(ocorrenciasRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list = Object.keys(val).map(key => ({ id: key, ...val[key] }));

        let pendentes = 0;
        let emAnalise = 0;
        let resolvidos = 0;
        let pcdCount = 0;

        const categoriasMap = {};
        const tipologiasMap = {};
        const frequenciasMap = {};
        const destinosMap = {};

        // Processamento das métricas gerais e perfis
        list.forEach(item => {
          // Status
          const status = item.status || 'pendente';
          if (status === 'resolvido') resolvidos++;
          else if (status === 'analise') emAnalise++;
          else pendentes++;

          // Categoria do Obstáculo
          if (item.categoria) {
            categoriasMap[item.categoria] = (categoriasMap[item.categoria] || 0) + 1;
          }

          // Perfil PCD
          const isPCD = item.perfilUtilizador?.categoria 
            ? item.perfilUtilizador.categoria.includes('PCD') 
            : item.usuarioPCD;
          if (isPCD) pcdCount++;

          // Tipologia de Deficiência
          const tipo = item.perfilUtilizador?.tipologia || item.tipoDeficiencia;
          if (tipo) {
            tipologiasMap[tipo] = (tipologiasMap[tipo] || 0) + 1;
          }

          // Dados do Inquérito Pós-Registo (Frequência e Destino)
          if (item.inqueritoPosRegisto) {
            const freq = item.inqueritoPosRegisto.frequenciaPassagem;
            const dest = item.inqueritoPosRegisto.destinoObstaculo;

            if (freq) frequenciasMap[freq] = (frequenciasMap[freq] || 0) + 1;
            if (dest) destinosMap[dest] = (destinosMap[dest] || 0) + 1;
          }
        });

        // Identificação de Pontos Críticos / Sobrepostos (Raio de 30m com múltiplos utilizadores)
        let pontosCriticosCount = 0;
        list.forEach((item, index) => {
          if (!item.pos || item.pos.length !== 2) return;
          const [lat1, lon1] = item.pos;

          const usuariosProximos = new Set();
          list.forEach((other) => {
            if (other.pos && other.pos.length === 2) {
              const dist = getDistanceInMeters(lat1, lon1, other.pos[0], other.pos[1]);
              if (dist <= 30) {
                usuariosProximos.add(other.email || other.autor || other.id);
              }
            }
          });

          if (usuariosProximos.size > 1) {
            pontosCriticosCount++;
          }
        });

        setMetrics({
          total: list.length,
          pendentes,
          emAnalise,
          resolvidos,
          pcdCount,
          pontosCriticos: pontosCriticosCount,
          categorias: categoriasMap,
          tipologias: tipologiasMap,
          frequencias: frequenciasMap,
          destinos: destinosMap
        });
      } else {
        setMetrics({
          total: 0,
          pendentes: 0,
          emAnalise: 0,
          resolvidos: 0,
          pcdCount: 0,
          pontosCriticos: 0,
          categorias: {},
          tipologias: {},
          frequencias: {},
          destinos: {}
        });
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: '20px', color: '#64748B' }}>Carregando dados da Dashboard...</div>;

  return (
    <div style={{ fontFamily: 'sans-serif', color: '#334155', pb: '40px' }}>
      <h2 style={{ color: '#1E293B', marginTop: 0, marginBottom: '20px' }}>Dashboard de Métricas & Impacto</h2>

      {/* Cartões de Resumo Geral */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <MetricCard 
          title="Total de Ocorrências" 
          value={metrics.total} 
          icon={<Activity color="#00A8FF" size={24} />} 
          bgColor="#F0F9FF" 
        />
        <MetricCard 
          title="Pontos Críticos (Sobrepostos)" 
          value={metrics.pontosCriticos} 
          icon={<MapPin color="#EF4444" size={24} />} 
          bgColor="#FEF2F2" 
          subtext="Locais com múltiplos alertas"
        />
        <MetricCard 
          title="Relatos por PCD / Rep." 
          value={metrics.pcdCount} 
          icon={<Users color="#8B5CF6" size={24} />} 
          bgColor="#F3E8FF" 
          subtext={`${metrics.total ? Math.round((metrics.pcdCount / metrics.total) * 100) : 0}% do total`}
        />
        <MetricCard 
          title="Taxa de Resolução" 
          value={`${metrics.total ? Math.round((metrics.resolvidos / metrics.total) * 100) : 0}%`} 
          icon={<CheckCircle color="#10B981" size={24} />} 
          bgColor="#ECFDF5" 
          subtext={`${metrics.resolvidos} de ${metrics.total} resolvidos`}
        />
      </div>

      {/* Status de Ocorrências e Categorias Principais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* Painel de Estados */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}><Clock size={18} /> Estado dos Chamados</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
            <ProgressBar label="Pendentes" count={metrics.pendentes} total={metrics.total} color="#EF4444" />
            <ProgressBar label="Em Análise" count={metrics.emAnalise} total={metrics.total} color="#F59E0B" />
            <ProgressBar label="Resolvidos" count={metrics.resolvidos} total={metrics.total} color="#10B981" />
          </div>
        </div>

        {/* Tipos de Deficiência / Tipologia Impactada */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}><Users size={18} /> Tipologias Afetadas</h3>
          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.keys(metrics.tipologias).length > 0 ? (
              Object.entries(metrics.tipologias).map(([tipo, count]) => (
                <div key={tipo} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                  <span>{tipo}</span>
                  <span style={{ fontWeight: 'bold', color: '#8B5CF6' }}>{count}</span>
                </div>
              ))
            ) : (
              <span style={{ fontSize: '13px', color: '#94A3B8' }}>Nenhuma tipologia declarada ainda.</span>
            )}
          </div>
        </div>

      </div>

      {/* Análise de Impacto (Inquérito Pós-Registo) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Frequência de Passagem */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}><TrendingUp size={18} /> Frequência no Local Afectado</h3>
          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.keys(metrics.frequencias).length > 0 ? (
              Object.entries(metrics.frequencias).map(([freq, count]) => (
                <ProgressBar key={freq} label={freq} count={count} total={metrics.total} color="#00A8FF" />
              ))
            ) : (
              <span style={{ fontSize: '13px', color: '#94A3B8' }}>Sem dados de inquérito registrados.</span>
            )}
          </div>
        </div>

        {/* Principais Destinos Prejudicados */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}><AlertTriangle size={18} /> Destinos Prejudicados</h3>
          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.keys(metrics.destinos).length > 0 ? (
              Object.entries(metrics.destinos).map(([destino, count]) => (
                <div key={destino} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                  <span>{destino}</span>
                  <span style={{ fontWeight: 'bold', color: '#00A8FF' }}>{count} ocorrência(s)</span>
                </div>
              ))
            ) : (
              <span style={{ fontSize: '13px', color: '#94A3B8' }}>Sem dados de inquérito registrados.</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Componentes Auxiliares de Estilo
function MetricCard({ title, value, icon, bgColor, subtext }) {
  return (
    <div style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 'bold', display: 'block' }}>{title}</span>
        <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#0F172A' }}>{value}</span>
        {subtext && <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginTop: '2px' }}>{subtext}</span>}
      </div>
    </div>
  );
}

function ProgressBar({ label, count, total, color }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
        <span style={{ color: '#475569', fontWeight: '500' }}>{label}</span>
        <span style={{ fontWeight: 'bold', color: '#1E293B' }}>{count} ({percentage}%)</span>
      </div>
      <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

const cardStyle = {
  backgroundColor: 'white',
  border: '1px solid #E2E8F0',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
};

const cardTitleStyle = {
  margin: 0,
  fontSize: '15px',
  color: '#1E293B',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  borderBottom: '1px solid #F1F5F9',
  paddingBottom: '10px'
};