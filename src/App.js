// src/App.js - ACTUALIZADO CON RUTAS DE ADMIN COMPLETAS
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
import Rooms from './pages/Rooms.jsx'
import GuestsPage from './pages/GuestsPage.jsx' 
import ReportsPage from './pages/ReportsPage.jsx'
import ReportsPageNew from './pages/ReportsPageNew.jsx'
import BranchSwitcher from './pages/BranchSwitcher.jsx'
import Unauthorized from './pages/Unauthorized.jsx'
import NotFound from './pages/NotFound.jsx'
import Supplies from './pages/Supplies.jsx'

// Admin Pages
import AdminUsersPage from './pages/Admin/AdminUsers.jsx'
import AdminBranchesPage from './pages/Admin/AdminBranches.jsx'
import AdminReportsPage from './pages/Admin/AdminReports.jsx'
import AdminSettingsPage from './pages/Admin/AdminSettings.jsx'
import AdminAuditPage from './pages/Admin/AdminAudit.jsx'

// Debug Components
import ReportsDebug from './debug/ReportsDebug.jsx'

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
              
              {/* =====================================================
                  RUTAS DE ADMINISTRACIÓN
                  ===================================================== */}
              
              {/* Ruta principal de admin - redirige a panel por defecto */}
              <Route 
                path="/admin" 
                element={<Navigate to="/admin/panel" replace />} 
              />
              
              {/* Panel de administración general */}
              <Route
                path="/admin/panel"
                element={
                  <ProtectedRoute requireAdmin>
                    <Layout>
                      <AdminPanel />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* Gestión de usuarios */}
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute requireAdmin>
                    <Layout>
                      <AdminUsersPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Gestión de sucursales */}
              <Route 
                path="/admin/branches" 
                element={
                  <ProtectedRoute requireAdmin>
                    <Layout>
                      <AdminBranchesPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Reportes avanzados */}
              <Route 
                path="/admin/reports" 
                element={
                  <ProtectedRoute requireAdmin>
                    <Layout>
                      <AdminReportsPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Configuración del sistema */}
              <Route 
                path="/admin/settings" 
                element={
                  <ProtectedRoute requireAdmin>
                    <Layout>
                      <AdminSettingsPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Sistema de auditoría */}
              <Route 
                path="/admin/audit" 
                element={
                  <ProtectedRoute requireAdmin>
                    <Layout>
                      <AdminAuditPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              {/* =====================================================
                  RUTAS DE OPERACIONES (RECEPCIÓN)
                  ===================================================== */}
              
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
              
              {/* Reservaciones CON Layout */}
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
              
              {/* Habitaciones CON Layout */}
              <Route
                path="/rooms"
                element={
                  <ProtectedRoute requireReception>
                    <Layout>
                      <Rooms />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* Huéspedes CON Layout */}
              <Route
                path="/guests"
                element={
                  <ProtectedRoute requireReception>
                    <Layout>
                      <GuestsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* Suministros CON Layout */}
              <Route
                path="/supplies"
                element={
                  <ProtectedRoute requireReception>
                    <Layout>
                      <Supplies />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* Reportes CON Layout - NUEVA VERSIÓN */}
              <Route
                path="/reports"
                element={
                  <ProtectedRoute requireReception>
                    <Layout>
                      <ReportsPageNew />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Reportes Antigua (temporal) */}
              <Route
                path="/reports-old"
                element={
                  <ProtectedRoute requireReception>
                    <Layout>
                      <ReportsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* =====================================================
                  CONFIGURACIÓN GENERAL (ALIAS PARA ADMIN/SETTINGS)
                  ===================================================== */}
              <Route
                path="/settings"
                element={<Navigate to="/admin/settings" replace />}
              />
              
              {/* Cambiar sucursal */}
              <Route
                path="/branch-switcher"
                element={
                  <ProtectedRoute requireReception>
                    <Layout>
                      <BranchSwitcher />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* =====================================================
                  DEBUG (TEMPORAL)
                  ===================================================== */}
              <Route
                path="/debug/reports"
                element={
                  <ProtectedRoute requireReception>
                    <Layout>
                      <ReportsDebug />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* =====================================================
                  PÁGINAS DE ERROR
                  ===================================================== */}
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