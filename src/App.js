// src/App.js - VERSIÓN SIMPLIFICADA PARA EVITAR BUCLES DE CARGA
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReceptionProvider } from './context/ReceptionContext';

// Auth Components
import LoginPage from './pages/Auth/LoginPage';
import BranchSelectionPage from './pages/Auth/BranchSelectionPage';

// Layout
import MainLayout from './layout/MainLayout';

// Pages
import Dashboard from './pages/Dashboard/Dashboard';
import CheckIn from './pages/CheckIn/CheckIn';
import Reservations from './pages/Reservations/Reservations';
import Guests from './pages/Guests/Guests';
import Rooms from './pages/Rooms/Rooms';
import Supplies from './pages/Supplies/Supplies';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';

import './index.css';

// =============================================
// COMPONENTE DE LOADING MEJORADO
// =============================================
const LoadingScreen = ({ message = "Cargando..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Hotel Paraíso</h2>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

// =============================================
// COMPONENTE PARA RUTAS PROTEGIDAS SIMPLIFICADO
// =============================================
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, needsBranchSelection, user, isReady } = useAuth();

  // Mostrar loading mientras verifica
  if (loading) {
    return <LoadingScreen message="Verificando sesión..." />;
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si es admin y necesita seleccionar sucursal
  if (needsBranchSelection && user?.role === 'admin') {
    return <Navigate to="/select-branch" replace />;
  }

  // Si no está listo (falta configuración)
  if (!isReady()) {
    return <LoadingScreen message="Configurando acceso..." />;
  }

  return children;
};

// =============================================
// COMPONENTE PRINCIPAL DE RUTAS SIMPLIFICADO
// =============================================
const AppRoutes = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingScreen message="Inicializando aplicación..." />;
  }

  return (
    <Routes>
      {/* Ruta de Login */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        } 
      />
      
      {/* Ruta de selección de sucursal */}
      <Route 
        path="/select-branch" 
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : user?.role !== 'admin' ? (
            <Navigate to="/" replace />
          ) : (
            <BranchSelectionPage />
          )
        } 
      />
      
      {/* Rutas protegidas */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                {/* Dashboard - Ruta principal */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Check In */}
                <Route path="/checkin" element={<CheckIn />} />
                
                {/* Reservations */}
                <Route path="/reservations" element={<Reservations />} />
                
                {/* Guests */}
                <Route path="/guests" element={<Guests />} />
                
                {/* Rooms */}
                <Route path="/rooms" element={<Rooms />} />
                
                {/* Supplies */}
                <Route path="/supplies" element={<Supplies />} />
                
                {/* Reports */}
                <Route path="/reports" element={<Reports />} />
                
                {/* Settings - Solo admin */}
                <Route 
                  path="/settings" 
                  element={
                    user?.role === 'admin' ? <Settings /> : <Navigate to="/" replace />
                  } 
                />
                
                {/* Catch all - redirige al dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

// =============================================
// COMPONENTE PRINCIPAL DE LA APP
// =============================================
function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Configuraciones globales una sola vez
    const initializeApp = () => {
      try {
        // Ocultar splash screen después de que React esté listo
        setTimeout(() => {
          const loadingElement = document.getElementById('pwa-loading');
          if (loadingElement) {
            document.body.classList.add('app-loaded');
          }
          setAppReady(true);
        }, 1500);

        // Configurar tema para PWA
        const setThemeColor = (color) => {
          const metaThemeColor = document.querySelector('meta[name="theme-color"]');
          if (metaThemeColor) {
            metaThemeColor.setAttribute('content', color);
          }
        };

        setThemeColor('#2563eb');

        // Configurar título dinámico
        const updateTitle = () => {
          if (window.matchMedia('(display-mode: standalone)').matches) {
            document.title = 'Hotel Paraíso';
          } else {
            document.title = 'Hotel Paraíso - Sistema de Gestión';
          }
        };

        updateTitle();

        // Listener para cambios de display mode
        const displayModeQuery = window.matchMedia('(display-mode: standalone)');
        displayModeQuery.addEventListener('change', updateTitle);

        // Cleanup
        return () => {
          displayModeQuery.removeEventListener('change', updateTitle);
        };
      } catch (error) {
        console.error('Error initializing app:', error);
        setAppReady(true); // Continuar aunque haya errores
      }
    };

    const cleanup = initializeApp();
    
    return cleanup;
  }, []);

  // Mostrar loading hasta que la app esté lista
  if (!appReady) {
    return <LoadingScreen message="Preparando aplicación..." />;
  }

  return (
    <Router>
      <AuthProvider>
        <ReceptionProvider>
          <div className="App">
            {/* Toaster para notificaciones */}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  style: {
                    background: '#10b981',
                  },
                },
                error: {
                  style: {
                    background: '#ef4444',
                  },
                },
                loading: {
                  style: {
                    background: '#3b82f6',
                  },
                },
              }}
            />
            
            {/* Rutas principales */}
            <AppRoutes />
          </div>
        </ReceptionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;