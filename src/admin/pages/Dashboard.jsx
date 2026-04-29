import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#00A8FF', '#FF4444', '#00C851', '#FFBB33', '#AA66CC'];

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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
      } else {
        setData([]);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Carregando dashboard...</div>;

  const total = data.length;
  const resolvidas = data.filter(d => d.status === 'resolvido').length;
  const pendentes = data.filter(d => d.status === 'pendente').length;
  
  // Agrupar por categoria
  const categoriasMap = {};
  data.forEach(d => {
    categoriasMap[d.categoria] = (categoriasMap[d.categoria] || 0) + 1;
  });
  const pieData = Object.keys(categoriasMap).map(key => ({ name: key, value: categoriasMap[key] }));

  // Agrupar por status
  const barData = [
    { name: 'Pendente', quantidade: pendentes },
    { name: 'Resolvido', quantidade: resolvidas },
    { name: 'Em Análise', quantidade: data.filter(d => d.status === 'analise').length }
  ];

  return (
    <div>
      <h2 style={{ color: '#334155', marginTop: 0 }}>Visão Geral</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <KpiCard title="Total de Ocorrências" value={total} color="#00A8FF" />
        <KpiCard title="Resolvidas" value={resolvidas} color="#00C851" />
        <KpiCard title="Pendentes" value={pendentes} color="#FF4444" />
        <KpiCard title="% Resolvidas" value={total ? Math.round((resolvidas / total) * 100) + '%' : '0%'} color="#FFBB33" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        <div style={chartBox}>
          <h3 style={chartTitle}>Ocorrências por Tipo</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label>
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={chartBox}>
          <h3 style={chartTitle}>Status das Ocorrências</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#00A8FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

function KpiCard({ title, value, color }) {
  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', borderLeft: `5px solid ${color}` }}>
      <p style={{ margin: '0 0 10px 0', color: '#64748B', fontSize: '14px', fontWeight: 'bold' }}>{title}</p>
      <h2 style={{ margin: 0, fontSize: '32px', color: '#334155' }}>{value}</h2>
    </div>
  );
}

const chartBox = { backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' };
const chartTitle = { marginTop: 0, marginBottom: '20px', color: '#334155', fontSize: '16px' };
