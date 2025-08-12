// src/routes/AppRoutes.jsx - RUTA DE IMPORTACIÓN CORREGIDA
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts - RUTA CORREGIDA: layout (singular) no layouts (plural)
import DashboardLayout from '../layouts/DashboardLayout';

// Pages - RUTAS CORREGIDAS
import Dashboard from '../pages/Dashboard/Dashboard';
import CheckIn from '../pages/CheckIn/CheckIn';
import Reservations from '../pages/Reservations/Reservations';
import Guests from '../pages/Guests/Guests';
import Rooms from '../pages/Rooms/Rooms';
import Supplies from '../pages/Supplies/Supplies';
import Reports from '../pages/Reports/Reports';
import Settings from '../pages/Settings/Settings';

// Auth Pages
import LoginPage from '../pages/Auth/LoginPage';
import BranchSelectionPage from '../pages/Auth/BranchSelectionPage';

// Admin Pages
import BranchManagementPage from '../pages/Admin/BranchManagementPage';

// Components
import ProtectedRoute from '../components/auth/ProtectedRoute';

const AppRoutes = () => {
  const { isAuthenticated, needsBranchSelection } = useAuth();

  // Redirección automática para usuarios no autenticados
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Redirección para selección de sucursal (solo admin)
  if (needsBranchSelection) {
    return (
      <Routes>
        <Route path="/select-branch" element={<BranchSelectionPage />} />
        <Route path="*" element={<Navigate to="/select-branch" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route 
        path="/*" 
        element={
          <DashboardLayout>
            <Routes>
              {/* Dashboard */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Recepción */}
              <Route 
                path="/checkin" 
                element={
                  <ProtectedRoute requirePermission="checkin">
                    <CheckIn />
                  </ProtectedRoute>
                } 
              />

              {/* Reservaciones */}
              <Route 
                path="/reservations" 
                element={
                  <ProtectedRoute requirePermission="reservations">
                    <Reservations />
                  </ProtectedRoute>
                } 
              />

              {/* Huéspedes */}
              <Route 
                path="/guests" 
                element={
                  <ProtectedRoute requirePermission="guests">
                    <Guests />
                  </ProtectedRoute>
                } 
              />

              {/* Habitaciones */}
              <Route 
                path="/rooms" 
                element={
                  <ProtectedRoute requirePermission="rooms">
                    <Rooms />
                  </ProtectedRoute>
                } 
              />

              {/* Suministros */}
              <Route 
                path="/supplies" 
                element={
                  <ProtectedRoute requirePermission="supplies">
                    <Supplies />
                  </ProtectedRoute>
                } 
              />

              {/* Reportes */}
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute requirePermission="reports">
                    <Reports />
                  </ProtectedRoute>
                } 
              />

              {/* Administración */}
              <Route 
                path="/branches" 
                element={
                  <ProtectedRoute requireRole="admin">
                    <BranchManagementPage />
                  </ProtectedRoute>
                } 
              />

              {/* Configuración */}
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute requirePermission="settings">
                    <Settings />
                  </ProtectedRoute>
                } 
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DashboardLayout>
        } 
      />
    </Routes>
  );
};

export default AppRoutes;