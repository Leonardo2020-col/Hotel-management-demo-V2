// src/components/auth/ProtectedRoute.jsx - VERSIÓN MEJORADA
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner.jsx'

const ProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requireReception = false,
  requiredPermission = null,
  redirectTo = null // ✅ Nuevo: permite personalizar el redirect
}) => {
  const { 
    isAuthenticated, 
    loading, 
    initializing, 
    isAdmin, 
    isReception, 
    hasPermission,
    userInfo
  } = useAuth()
  
  const location = useLocation()

  // ✅ Mostrar loading con mejor UX
  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  // ✅ Redireccionar al login si no está autenticado
  if (!isAuthenticated) {
    console.log('🚫 Usuario no autenticado, redirigiendo a login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // ✅ Mejor manejo de verificación de permisos
  const checkPermissions = () => {
    // Si es admin, tiene acceso a todo
    if (isAdmin()) {
      return { allowed: true, reason: 'admin' }
    }

    // Verificar permisos específicos
    if (requireAdmin) {
      return { 
        allowed: false, 
        reason: 'Necesitas permisos de administrador para acceder a esta página' 
      }
    }

    if (requireReception && !isReception()) {
      return { 
        allowed: false, 
        reason: 'Necesitas permisos de recepción para acceder a esta página' 
      }
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      return { 
        allowed: false, 
        reason: `Necesitas el permiso "${requiredPermission}" para acceder a esta página` 
      }
    }

    return { allowed: true, reason: 'authorized' }
  }

  const permissionCheck = checkPermissions()

  // ✅ Redireccionar con información detallada si no tiene permisos
  if (!permissionCheck.allowed) {
    console.log('🚫 Acceso denegado:', {
      reason: permissionCheck.reason,
      userRole: userInfo?.role?.name,
      requiredAdmin: requireAdmin,
      requiredReception: requireReception,
      requiredPermission: requiredPermission
    })

    const unauthorizedState = {
      from: location,
      reason: permissionCheck.reason,
      userRole: userInfo?.role?.name
    }

    return <Navigate 
      to={redirectTo || "/unauthorized"} 
      state={unauthorizedState} 
      replace 
    />
  }

  // ✅ Log de acceso exitoso (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Acceso autorizado:', {
      path: location.pathname,
      userRole: userInfo?.role?.name,
      reason: permissionCheck.reason
    })
  }

  // ✅ Renderizar contenido protegido
  return children
}

export default ProtectedRoute