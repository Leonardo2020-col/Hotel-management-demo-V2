import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner.jsx'

const ProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requireReception = false,
  requiredPermission = null 
}) => {
  const { 
    isAuthenticated, 
    loading, 
    initializing, 
    isAdmin, 
    isReception, 
    hasPermission 
  } = useAuth()
  
  const location = useLocation()

  // Mostrar loading mientras inicializa
  if (initializing || loading) {
    return <LoadingSpinner />
  }

  // Redireccionar al login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Verificar permisos específicos
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/unauthorized" replace />
  }

  if (requireReception && !isReception() && !isAdmin()) {
    return <Navigate to="/unauthorized" replace />
  }

  if (requiredPermission && !hasPermission(requiredPermission) && !isAdmin()) {
    return <Navigate to="/unauthorized" replace />
  }

  // Renderizar contenido protegido
  return children
}

export default ProtectedRoute