// src/App.js - VERSIÓN CON AUTENTICACIÓN COMPLETA
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/Auth/LoginPage';
import './index.css';

// Componente temporal del Dashboard
const Dashboard = () => {
  const { user, logout, hasPermission } = useAuth();
  
  // Módulos disponibles según permisos
  const modules = [
    {
      name: 'Dashboard',
      description: 'Vista general del sistema',
      icon: '📊',
      color: 'blue',
      available: hasPermission('dashboard')
    },
    {
      name: 'Check-in/Check-out',
      description: 'Gestión de llegadas y salidas',
      icon: '🛎️',
      color: 'green',
      available: hasPermission('checkin')
    },
    {
      name: 'Reservaciones',
      description: 'Sistema de reservas',
      icon: '📅',
      color: 'purple',
      available: hasPermission('reservations')
    },
    {
      name: 'Huéspedes',
      description: 'Base de datos de clientes',
      icon: '👥',
      color: 'indigo',
      available: hasPermission('guests')
    },
    {
      name: 'Habitaciones',
      description: 'Gestión de inventario',
      icon: '🛏️',
      color: 'orange',
      available: hasPermission('rooms')
    },
    {
      name: 'Suministros',
      description: 'Inventario y consumo',
      icon: '📦',
      color: 'teal',
      available: hasPermission('supplies')
    },
    {
      name: 'Reportes',
      description: 'Análisis y estadísticas',
      icon: '📈',
      color: 'pink',
      available: hasPermission('reports')
    },
    {
      name: 'Configuración',
      description: 'Ajustes del sistema',
      icon: '⚙️',
      color: 'gray',
      available: hasPermission('settings')
    }
  ];

  const availableModules = modules.filter(module => module.available);
  const unavailableModules = modules.filter(module => !module.available);

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-900',
      green: 'bg-green-50 border-green-200 text-green-900',
      purple: 'bg-purple-50 border-purple-200 text-purple-900',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-900',
      orange: 'bg-orange-50 border-orange-200 text-orange-900',
      teal: 'bg-teal-50 border-teal-200 text-teal-900',
      pink: 'bg-pink-50 border-pink-200 text-pink-900',
      gray: 'bg-gray-50 border-gray-200 text-gray-900'
    };
    return colors[color] || colors.gray;
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2m0 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hotel Paraíso</h1>
                <p className="text-sm text-gray-600">Sistema de Gestión Hotelera</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-600 capitalize">
                  {user?.role === 'admin' ? 'Administrador' : 'Personal de Recepción'}
                </p>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Bienvenido, {user?.name}! 👋
          </h2>
          <p className="text-gray-600">
            Accede a los módulos disponibles según tu rol de {user?.role === 'admin' ? 'administrador' : 'recepción'}.
          </p>
        </div>

        {/* Role Info */}
        <div className="mb-8">
          <div className={`p-4 rounded-lg border ${
            user?.role === 'admin' 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                user?.role === 'admin' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                <svg className={`w-4 h-4 ${
                  user?.role === 'admin' ? 'text-blue-600' : 'text-green-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {user?.role === 'admin' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  )}
                </svg>
              </div>
              <div>
                <h3 className={`font-semibold ${
                  user?.role === 'admin' ? 'text-blue-900' : 'text-green-900'
                }`}>
                  {user?.role === 'admin' ? 'Panel de Administrador' : 'Panel de Recepción'}
                </h3>
                <p className={`text-sm ${
                  user?.role === 'admin' ? 'text-blue-700' : 'text-green-700'
                }`}>
                  {user?.role === 'admin' 
                    ? 'Acceso completo para gestión del sistema'
                    : 'Acceso a operaciones diarias del hotel'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Modules */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Módulos Disponibles ({availableModules.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {availableModules.map((module, index) => (
              <div
                key={index}
                className={`border-2 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-200 ${getColorClasses(module.color)}`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-3">{module.icon}</div>
                  <h4 className="font-semibold mb-2">{module.name}</h4>
                  <p className="text-sm opacity-75">{module.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unavailable Modules */}
        {unavailableModules.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Módulos Restringidos ({unavailableModules.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {unavailableModules.map((module, index) => (
                <div
                  key={index}
                  className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 opacity-50"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-3 grayscale">{module.icon}</div>
                    <h4 className="font-semibold mb-2 text-gray-600">{module.name}</h4>
                    <p className="text-sm text-gray-500">{module.description}</p>
                    <p className="text-xs text-red-600 mt-2 font-medium">Sin acceso</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Development Notice */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold text-yellow-900">Sistema en Desarrollo</h4>
              <p className="text-yellow-800 text-sm mt-1">
                Los módulos están siendo implementados gradualmente. 
                Actualmente funcional: Sistema de autenticación y gestión de roles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
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
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Componente principal de rutas
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                fontSize: '14px',
                borderRadius: '8px',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;