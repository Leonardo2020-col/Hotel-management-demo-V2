// src/App.js - VERSIÓN FINAL CON TODAS LAS RUTAS
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout - CORREGIR RUTA SEGÚN TU ESTRUCTURA
import DashboardLayout from './layout/DashboardLayout'; // Si está en src/layout/
// O usar: import DashboardLayout from './layouts/DashboardLayout'; // Si está en src/layouts/

// Components
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LoginPage from './pages/Auth/LoginPage';
import Dashboard from './pages/Dashboard/Dashboard';
import Rooms from './pages/Rooms/Rooms';
import Guests from './pages/Guests/Guests';
import CheckIn from './pages/CheckIn/CheckIn';
import Reservations from './pages/Reservations/Reservations';
import Supplies from './pages/Supplies/Supplies';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';

// Estilos
import './index.css';

// Componente principal de rutas
const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  // Loading global
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Ruta de login */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} 
      />

      {/* Rutas protegidas con layout */}
      <Route 
        path="/*" 
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Routes>
                {/* Dashboard principal */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />

                {/* Gestión de habitaciones */}
                <Route path="/rooms" element={<Rooms />} />

                {/* Gestión de huéspedes */}
                <Route path="/guests" element={<Guests />} />

                {/* Check-in/Check-out */}
                <Route path="/checkin" element={<CheckIn />} />

                {/* Reservaciones */}
                <Route path="/reservations" element={<Reservations />} />

                {/* Suministros e inventario */}
                <Route path="/supplies" element={<Supplies />} />

                {/* Reportes */}
                <Route path="/reports" element={<Reports />} />

                {/* Configuraciones */}
                <Route path="/settings" element={<Settings />} />

                {/* Ruta catch-all para rutas no encontradas */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />

      {/* Ruta catch-all global */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

// Componente principal de la aplicación
const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;