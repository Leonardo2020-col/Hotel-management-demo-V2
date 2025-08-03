 // src/routes/AppRoutes.jsx - INTEGRACIÓN CON SISTEMA DE SUCURSALES
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Auth Pages
import LoginPage from '../pages/Auth/LoginPage';
import BranchSelectionPage from '../pages/Auth/BranchSelectionPage';

// Protected Layout
import DashboardLayout from '../layouts/DashboardLayout';

// Dashboard Pages
import DashboardPage from '../pages/Dashboard/DashboardPage';

// Admin Pages
import BranchManagementPage from '../pages/Admin/BranchManagementPage';

// Reception Pages (solo accesibles para recepción)
import ReservationsPage from '../pages/Reception/ReservationsPage';
import CheckInPage from '../pages/Reception/CheckInPage';

// Shared Pages
import GuestsPage from '../pages/Guests/GuestsPage';
import RoomsPage from '../pages/Rooms/RoomsPage';
import SuppliesPage from '../pages/Supplies/SuppliesPage';
import ReportsPage from '../pages/Reports/ReportsPage';
import SettingsPage from '../pages/Settings/SettingsPage';

// Components
import ProtectedRoute from '../components/auth/ProtectedRoute';

const AppRoutes = () => {
  const { isAuthenticated, needsBranchSelection, user, isReady } = useAuth();

  return (
    <Routes>
      {/* Auth Routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        } 
      />
      
      <Route 
        path="/select-branch" 
        element={
          <ProtectedRoute>
            <BranchSelectionPage />
          </ProtectedRoute>
        } 
      />

      {/* Protected App Routes */}
      <Route 
        path="/*" 
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Routes>
                {/* Dashboard - Accesible para todos */}
                <Route path="/" element={<DashboardPage />} />

                {/* Rutas específicas para ADMINISTRADORES */}
                <Route 
                  path="/branches" 
                  element={
                    <ProtectedRoute requireRole="admin">
                      <BranchManagementPage />
                    </ProtectedRoute>
                  } 
                />

                {/* Rutas específicas para RECEPCIÓN */}
                <Route 
                  path="/reservations/*" 
                  element={
                    <ProtectedRoute requirePermission="reservations">
                      <Routes>
                        <Route path="/" element={<ReservationsPage />} />
                        <Route path="/new" element={<ReservationsPage />} />
                        <Route path="/:id" element={<ReservationsPage />} />
                      </Routes>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/checkin/*" 
                  element={
                    <ProtectedRoute requirePermission="checkin">
                      <Routes>
                        <Route path="/" element={<CheckInPage />} />
                        <Route path="/quick" element={<CheckInPage />} />
                      </Routes>
                    </ProtectedRoute>
                  } 
                />

                {/* Rutas compartidas (con permisos específicos) */}
                <Route 
                  path="/guests/*" 
                  element={
                    <ProtectedRoute requirePermission="guests">
                      <Routes>
                        <Route path="/" element={<GuestsPage />} />
                        <Route path="/:id" element={<GuestsPage />} />
                      </Routes>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/rooms/*" 
                  element={
                    <ProtectedRoute requirePermission="rooms">
                      <Routes>
                        <Route path="/" element={<RoomsPage />} />
                        <Route path="/floor/:floor" element={<RoomsPage />} />
                      </Routes>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/supplies/*" 
                  element={
                    <ProtectedRoute requirePermission="supplies">
                      <Routes>
                        <Route path="/" element={<SuppliesPage />} />
                        <Route path="/category/:category" element={<SuppliesPage />} />
                      </Routes>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/reports/*" 
                  element={
                    <ProtectedRoute requirePermission="reports">
                      <Routes>
                        <Route path="/" element={<ReportsPage />} />
                        <Route path="/:type" element={<ReportsPage />} />
                      </Routes>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/settings/*" 
                  element={
                    <ProtectedRoute requirePermission="settings">
                      <Routes>
                        <Route path="/" element={<SettingsPage />} />
                        <Route path="/:section" element={<SettingsPage />} />
                      </Routes>
                    </ProtectedRoute>
                  } 
                />

                {/* Catch all - redirect to dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

export default AppRoutes;

