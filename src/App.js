// src/App.js - ACTUALIZADO CON PWA
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Import adicional
import { Shield, Building2 } from 'lucide-react';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReceptionProvider } from './context/ReceptionContext';

// PWA Components
import PWAInstallBanner, { ConnectionStatus, PWADebugInfo } from './components/common/PWAInstallBanner';

// Auth Components
import LoginPage from './pages/Auth/LoginPage';
import BranchSelectionPage from './pages/Auth/BranchSelectionPage';

// Layout
import MainLayout from './layout/MainLayout';

// debug
import BranchSwitcherDebug from './components/debug/BranchSwitcherDebug';


// Import pages
import Dashboard from './pages/Dashboard/Dashboard';
import CheckIn from './pages/CheckIn/CheckIn';
import Reservations from './pages/Reservations/Reservations';
import Guests from './pages/Guests/Guests';
import Rooms from './pages/Rooms/Rooms';
import Supplies from './pages/Supplies/Supplies';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';

import './index.css';

// Componente para rutas protegidas mejorado
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, needsBranchSelection, user, isReady } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si es administrador y necesita seleccionar sucursal
  if (needsBranchSelection && user?.role === 'admin') {
    return <Navigate to="/select-branch" replace />;
  }

  // Si no está listo (falta sucursal para admin)
  if (!isReady()) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Selección de Sucursal Requerida
            </h1>
            <p className="text-gray-600 mb-6">
              Como administrador, necesitas seleccionar una sucursal para continuar.
            </p>
            <button
              onClick={() => window.location.href = '/select-branch'}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full"
            >
              Seleccionar Sucursal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

// Componente para redirección automática según el rol (ACTUALIZADO)
const RoleBasedRedirect = () => {
  const { user, hasPermission, isReady } = useAuth();
  
  // Verificar que esté listo antes de redirigir
  if (!isReady()) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Configurando acceso...</p>
        </div>
      </div>
    );
  }
  
  // Si es recepción, redirigir a Check In
  if (user?.role === 'reception' && hasPermission('checkin')) {
    return <Navigate to="/checkin" replace />;
  }
  
  // Si es admin o no tiene acceso a checkin, redirigir a Dashboard
  return <Navigate to="/dashboard" replace />;
};

// Componente para verificar permisos específicos
const PermissionRoute = ({ children, permission }) => {
  const { hasPermission } = useAuth();
  
  if (!hasPermission(permission)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Acceso Denegado</h1>
            <p className="text-gray-600 mb-2">
              No tienes permisos para acceder a esta sección.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Esta función está reservada para otros roles.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver Atrás
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return children;
};

// Componente principal de rutas
const AppRoutes = () => {
  const { isAuthenticated, loading, needsBranchSelection, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Componentes PWA globales */}
      <ConnectionStatus />
      <PWAInstallBanner />
      <PWADebugInfo />
      
      <Routes>
        {/* Ruta de Login */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          } 
        />
        
        {/* Ruta de selección de sucursal - Solo para administradores */}
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
                  {/* Ruta raíz con redirección automática según rol */}
                  <Route path="/" element={<RoleBasedRedirect />} />
                  
                  {/* Dashboard */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* Check In */}
                  <Route 
                    path="/checkin" 
                    element={
                      <PermissionRoute permission="checkin">
                        <CheckIn />
                      </PermissionRoute>
                    } 
                  />
                  
                  {/* Reservations */}
                  <Route 
                    path="/reservations" 
                    element={
                      <PermissionRoute permission="reservations">
                        <Reservations />
                      </PermissionRoute>
                    } 
                  />
                  
                  <Route path="/guests" element={<Guests />} />
                  <Route path="/rooms" element={<Rooms />} />
                  <Route path="/supplies" element={<Supplies />} />
                  <Route path="/reports" element={<Reports />} />
                  
                  <Route 
                    path="/settings" 
                    element={
                      <PermissionRoute permission="settings">
                        <Settings />
                      </PermissionRoute>
                    } 
                  />
                  
                  {/* Ruta por defecto - redirige según rol */}
                  <Route path="*" element={<RoleBasedRedirect />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

function App() {
  useEffect(() => {
    // Ocultar splash screen cuando React esté listo
    const loadingElement = document.getElementById('pwa-loading');
    if (loadingElement) {
      setTimeout(() => {
        document.body.classList.add('app-loaded');
      }, 1000);
    }

    // Configurar tema para PWA
    const setThemeColor = (color) => {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', color);
      }
    };

    // Tema azul por defecto
    setThemeColor('#2563eb');

    // Configurar título dinámico para PWA
    const updateTitle = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        document.title = 'Hotel Paraíso';
      } else {
        document.title = 'Hotel Paraíso - Sistema de Gestión';
      }
    };

    updateTitle();

    // Escuchar cambios de display mode
    window.matchMedia('(display-mode: standalone)').addEventListener('change', updateTitle);

    return () => {
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', updateTitle);
    };
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ReceptionProvider>
          <div className="App">
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
              }}
            />
            
            <AppRoutes />
          </div>
        </ReceptionProvider>
        <BranchSwitcherDebug />
      </AuthProvider>
    </Router>
  );
}

export default App;