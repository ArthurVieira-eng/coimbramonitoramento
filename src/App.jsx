import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ClientApp from './pages/ClientApp';
import AdminLogin from './admin/AdminLogin';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import AdminMap from './admin/pages/AdminMap';
import OccurrencesList from './admin/pages/OccurrencesList';

export default function App() {
  return (
    <BrowserRouter basename="/coimbra">
      <Routes>
        {/* App do Cliente (App principal) */}
        <Route path="/" element={<ClientApp />} />
        
        {/* Telas do Administrador */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="mapa" element={<AdminMap />} />
          <Route path="ocorrencias" element={<OccurrencesList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}