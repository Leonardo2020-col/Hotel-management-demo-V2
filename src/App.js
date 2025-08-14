// src/App.js - VERSIÓN CON DEBUG
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from 'react-error-boundary'

// Contexts
import { AuthProvider } from './context/AuthContext'

// Components
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import ErrorFallback from './components/common/ErrorFallback.jsx'

// Pages
import LoginPage from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import Unauthorized from './pages/Unauthorized.jsx'
import NotFound from './pages/NotFound.jsx'

// Componente de debug para verificar que todo se carga
const AppDebug = () => {
  console.log('🚀 App component rendering...')
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Sistema de Hotel Cargando...
        </h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  )
}

function App() {
  console.log('🏗️ App function starting...')

  // Verificar que las variables de entorno están configuradas
  if (!process.env.REACT_APP_SUPABASE_URL) {
    console.error('❌ REACT_APP_SUPABASE_URL no está configurada')
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-900 mb-4">
            Error de Configuración
          </h1>
          <p className="text-red-700">
            Variables de entorno de Supabase no configuradas
          </p>
          <p className="text-sm text-red-600 mt-2">
            Verifica tu archivo .env
          </p>
        </div>
      </div>
    )
  }

  console.log('✅ Variables de entorno OK')

  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('🚨 Error capturado por ErrorBoundary:', error)
        console.error('📍 Error Info:', errorInfo)
      }}
    >
      <Router>
        <AuthProvider>
          <div className="App">
            {console.log('🛣️ Configurando rutas...')}
            
            <Routes>
              {/* Ruta raíz */}
              <Route 
                path="/" 
                element={<Navigate to="/dashboard" replace />} 
              />
              
              {/* Login */}
              <Route 
                path="/login" 
                element={<LoginPage />} 
              />
              
              {/* Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requireReception>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* Admin Panel */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              
              {/* Páginas del hotel - Placeholders simples sin ProtectedRoute por ahora */}
              <Route
                path="/checkin"
                element={
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">Check-in Rápido</h1>
                      <p className="text-gray-600">Página en desarrollo</p>
                    </div>
                  </div>
                }
              />
              
              <Route
                path="/reservations"
                element={
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">Reservaciones</h1>
                      <p className="text-gray-600">Página en desarrollo</p>
                    </div>
                  </div>
                }
              />
              
              {/* Páginas de error */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            
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
                  duration: 3000,
                  style: {
                    background: '#10b981',
                  },
                },
                error: {
                  duration: 5000,
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
            
            {console.log('✅ App configurada correctamente')}
          </div>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App