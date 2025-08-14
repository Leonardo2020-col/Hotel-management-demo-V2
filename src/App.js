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

// Lazy loading para optimización (opcional)
// const Dashboard = React.lazy(() => import('./pages/Dashboard.jsx'))
// const AdminPanel = React.lazy(() => import('./pages/AdminPanel.jsx'))

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Router>
        <AuthProvider>
          <div className="App">
            {/* Configuración de rutas */}
            <Routes>
              {/* Ruta raíz - redirecciona según autenticación */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Login - accesible solo si no está autenticado */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Dashboard - requiere estar autenticado (recepción o admin) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requireReception>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* Panel de administrador - solo para administradores */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              
              {/* Páginas del hotel (todas requieren recepción o admin) */}
              <Route
                path="/checkin"
                element={
                  <ProtectedRoute requireReception>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Check-in Rápido</h1>
                        <p className="text-gray-600">Página en desarrollo</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/reservations"
                element={
                  <ProtectedRoute requireReception>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Reservaciones</h1>
                        <p className="text-gray-600">Página en desarrollo</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/guests"
                element={
                  <ProtectedRoute requireReception>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Huéspedes</h1>
                        <p className="text-gray-600">Página en desarrollo</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/rooms"
                element={
                  <ProtectedRoute requireReception>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Habitaciones</h1>
                        <p className="text-gray-600">Página en desarrollo</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/supplies"
                element={
                  <ProtectedRoute requireReception>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Suministros</h1>
                        <p className="text-gray-600">Página en desarrollo</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/reports"
                element={
                  <ProtectedRoute requireReception>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Reportes</h1>
                        <p className="text-gray-600">Página en desarrollo</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/settings"
                element={
                  <ProtectedRoute requireAdmin>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Configuración</h1>
                        <p className="text-gray-600">Página en desarrollo</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              
              {/* Rutas de administrador */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requireAdmin>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Usuarios</h1>
                        <p className="text-gray-600">Página en desarrollo</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requireAdmin>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Configuración del Hotel</h1>
                        <p className="text-gray-600">Página en desarrollo</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/admin/branches"
                element={
                  <ProtectedRoute requireAdmin>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Sucursales</h1>
                        <p className="text-gray-600">Página en desarrollo</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute requireAdmin>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Reportes Avanzados</h1>
                        <p className="text-gray-600">Página en desarrollo</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/admin/audit"
                element={
                  <ProtectedRoute requireAdmin>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Auditoría del Sistema</h1>
                        <p className="text-gray-600">Página en desarrollo</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/admin/database"
                element={
                  <ProtectedRoute requireAdmin>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Base de Datos</h1>
                        <p className="text-gray-600">Página en desarrollo</p>
                      </div>
                    </div>
                  </ProtectedRoute>
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
          </div>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App