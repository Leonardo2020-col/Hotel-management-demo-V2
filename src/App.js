// src/App.js - VERSIÓN CORREGIDA CON MEJORES PRÁCTICAS
import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReceptionProvider } from './context/ReceptionContext';

// PWA Components
import PWAInstallBanner, { ConnectionStatus, PWADebugInfo } from './components/common/PWAInstallBanner';

// Layout Components
import MainLayout from './layout/MainLayout';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorFallback from './components/common/ErrorFallback';

// Lazy load components for better performance
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const BranchSelectionPage = lazy(() => import('./pages/Auth/BranchSelectionPage'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const CheckIn = lazy(() => import('./pages/CheckIn/CheckIn'));
const Reservations = lazy(() => import('./pages/Reservations/Reservations'));
const Guests = lazy(() => import('./pages/Guests/Guests'));
const Rooms = lazy(() => import('./pages/Rooms/Rooms'));
const Supplies = lazy(() => import('./pages/Supplies/Supplies'));
const Reports = lazy(() => import('./pages/Reports/Reports'));
const Settings = lazy(() => import('./pages/Settings/Settings'));

// Loading Screen Component
const LoadingScreen = ({ message = "Cargando..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2 mt-4">Hotel Paraíso</h2>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, permission = null, role = null }) => {
  const { isAuthenticated, loading, needsBranchSelection, user, isReady, hasPermission, hasRole } = useAuth();

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
    return <LoadingScreen message="Configurando acceso..." />;
  }

  // Verificar permisos específicos
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Verificar rol específico
  if (role && !hasRole(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Role-based redirect component
const RoleBasedRedirect = () => {
  const { user, hasPermission, isReady } = useAuth();
  
  if (!isReady()) {
    return <LoadingScreen message="Configurando acceso..." />;
  }
  
  // Redirect based on user role and permissions
  if (user?.role === 'reception' && hasPermission('checkin')) {
    return <Navigate to="/checkin" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
};

// Main App Routes Component
const AppRoutes = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingScreen message="Inicializando aplicación..." />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          } 
        />
        
        {/* Branch Selection Route - Only for admins */}
        <Route 
          path="/select-branch" 
          element={
            <ProtectedRoute role="admin">
              <BranchSelectionPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    {/* Root redirect */}
                    <Route path="/" element={<RoleBasedRedirect />} />
                    
                    {/* Dashboard - accessible to all */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* Reception-only routes */}
                    <Route 
                      path="/checkin" 
                      element={
                        <ProtectedRoute permission="checkin">
                          <CheckIn />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/reservations" 
                      element={
                        <ProtectedRoute permission="reservations">
                          <Reservations />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Shared routes with permissions */}
                    <Route 
                      path="/guests" 
                      element={
                        <ProtectedRoute permission="guests">
                          <Guests />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/rooms" 
                      element={
                        <ProtectedRoute permission="rooms">
                          <Rooms />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/supplies" 
                      element={
                        <ProtectedRoute permission="supplies">
                          <Supplies />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/reports" 
                      element={
                        <ProtectedRoute permission="reports">
                          <Reports />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Admin-only routes */}
                    <Route 
                      path="/settings" 
                      element={
                        <ProtectedRoute permission="settings">
                          <Settings />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Unauthorized page */}
                    <Route 
                      path="/unauthorized" 
                      element={
                        <div className="min-h-screen flex items-center justify-center">
                          <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
                            <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta página</p>
                            <button 
                              onClick={() => window.history.back()}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                              Volver
                            </button>
                          </div>
                        </div>
                      } 
                    />
                    
                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
};

// PWA Configuration
const usePWAConfiguration = () => {
  useEffect(() => {
    // Configure global notifications
    window.showNotification = (type, message, options = {}) => {
      console.log(`${type.toUpperCase()}: ${message}`);
      // Here you can integrate with react-hot-toast or your notification system
    };

    // Hide splash screen when React is ready
    const loadingElement = document.getElementById('pwa-loading');
    if (loadingElement) {
      setTimeout(() => {
        document.body.classList.add('app-loaded');
      }, 1000);
    }

    // Configure theme for PWA
    const setThemeColor = (color) => {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', color);
      }
    };

    setThemeColor('#2563eb');

    // Configure dynamic title for PWA
    const updateTitle = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        document.title = 'Hotel Paraíso';
      } else {
        document.title = 'Hotel Paraíso - Sistema de Gestión';
      }
    };

    updateTitle();

    // Listen for display mode changes
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    displayModeQuery.addEventListener('change', updateTitle);

    // Cleanup localStorage for invalid branches on startup
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
};

// Error Boundary wrapper
const AppWithErrorBoundary = () => (
  <ErrorBoundary
    FallbackComponent={ErrorFallback}
    onError={(error, errorInfo) => {
      console.error('App Error:', error, errorInfo);
      // You can send error to monitoring service here
    }}
  >
    <App />
  </ErrorBoundary>
);

// Main App Component
function App() {
  usePWAConfiguration();

  return (
    <Router>
      <AuthProvider>
        <ReceptionProvider>
          <div className="App">
            {/* Toast notifications */}
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
            
            {/* PWA Components */}
            <ConnectionStatus />
            <PWAInstallBanner />
            
            {/* Main App Routes */}
            <AppRoutes />
            
            {/* PWA Debug Info - only in development */}
            {process.env.NODE_ENV === 'development' && <PWADebugInfo />}
          </div>
        </ReceptionProvider>
      </AuthProvider>
    </Router>
  );
}

// Export with Error Boundary wrapper
export default AppWithErrorBoundary;