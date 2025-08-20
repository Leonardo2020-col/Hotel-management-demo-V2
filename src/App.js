// src/App.js - CON RUTA DE RESERVATIONS AGREGADA
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from 'react-error-boundary'

// Contexts
import { AuthProvider } from './context/AuthContext'

// Components
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import ErrorFallback from './components/common/ErrorFallback.jsx'
import Layout from './layout/Layout.jsx'

// Pages
import LoginPage from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import CheckIn from './pages/CheckIn.jsx'
import Reservations from './pages/Reservations.jsx' 
import Unauthorized from './pages/Unauthorized.jsx'
import NotFound from './pages/NotFound.jsx'

function App() {
  console.log('🚀 App rendering...')

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
            <Routes>
              {/* Ruta raíz */}
              <Route 
                path="/" 
                element={<Navigate to="/dashboard" replace />} 
              />
              
              {/* Login SIN Layout */}
              <Route 
                path="/login" 
                element={<LoginPage />} 
              />
              
              {/* Dashboard CON Layout */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requireReception>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* Panel de administrador CON Layout */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <Layout>
                      <AdminPanel />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* Check-in CON Layout */}
              <Route
                path="/checkin"
                element={
                  <ProtectedRoute requireReception>
                    <Layout>
                      <CheckIn />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* ✅ NUEVA RUTA DE RESERVATIONS CON Layout */}
              <Route
                path="/reservations"
                element={
                  <ProtectedRoute requireReception>
                    <Layout>
                      <Reservations />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* Resto de páginas CON Layout - REMOVIDA LA ANTIGUA RUTA PLACEHOLDER */}
              <Route
                path="/guests"
                element={
                  <ProtectedRoute requireReception>
                    <Layout>
                      <div className="p-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Huéspedes</h1>
                        <p className="text-gray-600">Página en desarrollo</p>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/rooms"
                element={
                  <ProtectedRoute requireReception>
                    <Layout>
                      <div className="p-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Habitaciones</h1>
                        <p className="text-gray-600">Página en desarrollo</p>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/supplies"
                element={
                  <ProtectedRoute requireReception>
                    <Layout>
                      <div className="p-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Suministros</h1>
                        <p className="text-gray-600">Página en desarrollo</p>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/reports"
                element={
                  <ProtectedRoute requireReception>
                    <Layout>
                      <div className="p-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Reportes</h1>
                        <p className="text-gray-600">Página en desarrollo</p>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/settings"
                element={
                  <ProtectedRoute requireAdmin>
                    <Layout>
                      <div className="p-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Configuración</h1>
                        <p className="text-gray-600">Página en desarrollo</p>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* Páginas de error SIN Layout */}
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
          </div>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App