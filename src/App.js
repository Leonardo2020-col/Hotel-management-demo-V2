// src/App.js - ACTUALIZADO CON MEJOR INTEGRACIÓN DE BRANCH SWITCHER
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Import adicional
import { Shield, Building2, RefreshCw } from 'lucide-react';

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
import EnhancedBranchDebug from './components/debug/EnhancedBranchDebug';

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

// 🔧 COMPONENTE MEJORADO PARA SELECCIÓN DE SUCURSAL
const BranchSelectionButton = () => {
  const navigate = useNavigate();
  
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔄 Navigating to branch selection via React Router');
    navigate('/select-branch');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full flex items-center justify-center space-x-2"
    >
      <Building2 className="w-4 h-4" />
      <span>Seleccionar Sucursal</span>
    </button>
  );
};

// 🔧 COMPONENTE DE LOADING MEJORADO
const LoadingScreen = ({ message = "Cargando..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
        <RefreshCw className="w-8 h-8 text-white animate-spin" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Hotel Paraíso</h2>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

// Componente para rutas protegidas mejorado
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, needsBranchSelection, user, isReady } = useAuth();

  if (loading) {
    return <LoadingScreen message="Verificando sesión..." />;
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Selección de Sucursal Requerida
            </h1>
            <p className="text-gray-600 mb-6">
              Como administrador, necesitas seleccionar una sucursal para continuar con la gestión del sistema.
            </p>
            <BranchSelectionButton />
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>Tip:</strong> También puedes cambiar de sucursal más tarde usando el selector en el header.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

// Componente para redirección automática según el rol (ACTUALIZADO)
const RoleBasedRedirect = () => {
  const { user, hasPermission, isReady, selectedBranch } = useAuth();
  
  // Verificar que esté listo antes de redirigir
  if (!isReady()) {
    return <LoadingScreen message="Configurando acceso..." />;
  }
  
  console.log('🔄 RoleBasedRedirect - User:', user?.role, 'Branch:', selectedBranch?.name);
  
  // Si es recepción, redirigir a Check In
  if (user?.role === 'reception' && hasPermission('checkin')) {
    return <Navigate to="/checkin" replace />;
  }
  
  // Si es admin o no tiene acceso a checkin, redirigir a Dashboard
  return <Navigate to="/dashboard" replace />;
};

// Componente para verificar permisos específicos
const PermissionRoute = ({ children, permission }) => {
  const { hasPermission, user } = useAuth();
  
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
              No tienes permisos para acceder a la sección "{permission}".
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {user?.role === 'admin' 
                ? 'Esta función está reservada para el personal de recepción.'
                : 'Contacta con tu administrador para solicitar acceso.'
              }
            </p>
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full"
              >
                Volver Atrás
              </button>
              
              <button
                type="button"
                onClick={() => window.location.href = '/'}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors w-full"
              >
                Ir al Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return children;
};

// 🔧 NUEVO: Componente para manejar eventos de cambio de sucursal
const BranchChangeHandler = ({ children }) => {
  useEffect(() => {
    const handleBranchChange = (event) => {
      const { branch } = event.detail;
      console.log('🏢 Branch changed event received:', branch.name);
      
      // Aquí puedes agregar lógica adicional cuando cambie la sucursal
      // Por ejemplo, limpiar caché, recargar datos, etc.
      
      // Opcional: Mostrar notificación
      if (window.showNotification) {
        window.showNotification('success', `Cambiado a ${branch.name}`);
      }
    };

    window.addEventListener('branchChanged', handleBranchChange);
    
    return () => {
      window.removeEventListener('branchChanged', handleBranchChange);
    };
  }, []);

  return children;
};

// Componente principal de rutas
const AppRoutes = () => {
  const { isAuthenticated, loading, needsBranchSelection, user } = useAuth();

  if (loading) {
    return <LoadingScreen message="Inicializando aplicación..." />;
  }

  return (
    <BranchChangeHandler>
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
            ) : !needsBranchSelection ? (
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
                  
                  {/* Dashboard - Accesible para todos */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* Check In - Solo recepción */}
                  <Route 
                    path="/checkin" 
                    element={
                      <PermissionRoute permission="checkin">
                        <CheckIn />
                      </PermissionRoute>
                    } 
                  />
                  
                  {/* Reservations - Solo recepción */}
                  <Route 
                    path="/reservations" 
                    element={
                      <PermissionRoute permission="reservations">
                        <Reservations />
                      </PermissionRoute>
                    } 
                  />
                  
                  {/* Guests - Accesible para todos */}
                  <Route path="/guests" element={<Guests />} />
                  
                  {/* Rooms - Accesible para todos */}
                  <Route path="/rooms" element={<Rooms />} />
                  
                  {/* Supplies - Accesible para todos */}
                  <Route path="/supplies" element={<Supplies />} />
                  
                  {/* Reports - Accesible para todos */}
                  <Route path="/reports" element={<Reports />} />
                  
                  {/* Settings - Solo admin */}
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
    </BranchChangeHandler>
  );
};

// 🔧 CONFIGURACIÓN GLOBAL MEJORADA
function App() {
  useEffect(() => {
    // Configurar notificaciones globales
    window.showNotification = (type, message) => {
      // Aquí puedes integrar con react-hot-toast o tu sistema de notificaciones
      console.log(`${type.toUpperCase()}: ${message}`);
    };

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
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    displayModeQuery.addEventListener('change', updateTitle);

    // 🔧 CONFIGURACIÓN ADICIONAL PARA BRANCH SWITCHER
    // Limpiar localStorage de sucursales inválidas al iniciar
    try {
      const savedBranch = localStorage.getItem('hotel_selected_branch');
      if (savedBranch) {
        const branchData = JSON.parse(savedBranch);
        console.log('🏢 Found saved branch:', branchData.name);
      }
    } catch (error) {
      console.warn('Error reading saved branch, clearing localStorage');
      localStorage.removeItem('hotel_selected_branch');
    }

    return () => {
      displayModeQuery.removeEventListener('change', updateTitle);
      delete window.showNotification;
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
                loading: {
                  style: {
                    background: '#3b82f6',
                  },
                },
              }}
            />
            
            <AppRoutes />
          </div>
          
          {/* 🔧 DEBUG SOLO EN DESARROLLO */}
          {process.env.NODE_ENV === 'development' && (
            <EnhancedBranchDebug />
          )}
        </ReceptionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;