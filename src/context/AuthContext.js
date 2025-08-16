// src/context/AuthContext.js - VERSIÓN REAL CON SUPABASE
import React, { createContext, useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { authService } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)

  console.log('🔐 AuthProvider inicializando con Supabase...')

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔍 Verificando variables de entorno...')
        
        if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
          console.error('❌ Variables de entorno de Supabase no configuradas')
          toast.error('Error de configuración: Variables de entorno faltantes')
          setLoading(false)
          setInitializing(false)
          return
        }

        console.log('✅ Variables de entorno configuradas')
        console.log('🔄 Obteniendo sesión actual...')

        // Obtener sesión actual
        const { session: currentSession, userInfo: currentUserInfo } = await authService.getCurrentSession()
        
        if (currentSession?.user) {
          console.log('✅ Usuario ya logueado:', currentSession.user.email)
          setUser(currentSession.user)
          setSession(currentSession)
          setUserInfo(currentUserInfo)
          toast.success(`Bienvenido de vuelta, ${currentUserInfo?.first_name || 'Usuario'}!`)
        } else {
          console.log('👤 No hay usuario logueado')
        }
        
      } catch (error) {
        console.error('❌ Error inicializando auth:', error)
        toast.error('Error al inicializar autenticación')
      } finally {
        setLoading(false)
        setInitializing(false)
        console.log('✅ Auth inicializado')
      }
    }

    initializeAuth()

    // Escuchar cambios de autenticación en tiempo real
    const { data: { subscription } } = authService.supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const userInfo = await authService.getUserInfo(session.user.id)
            setUser(session.user)
            setSession(session)
            setUserInfo(userInfo)
            console.log('✅ Usuario logueado via listener:', userInfo)
          } catch (error) {
            console.error('❌ Error obteniendo info del usuario:', error)
            toast.error('Error al obtener información del usuario')
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
          setUserInfo(null)
          console.log('👋 Usuario deslogueado via listener')
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Login real con Supabase
  const login = async (email, password) => {
    try {
      setLoading(true)
      console.log('🔑 Intentando login con Supabase:', { email, password: '***' })
      
      const { user: authUser, session: authSession, userInfo: authUserInfo } = await authService.signIn(email, password)
      
      setUser(authUser)
      setSession(authSession)
      setUserInfo(authUserInfo)
      
      toast.success(`¡Bienvenido, ${authUserInfo.first_name}!`)
      console.log('✅ Login exitoso:', {
        email: authUser.email,
        role: authUserInfo.role?.name,
        branch: authUserInfo.user_branches?.[0]?.branch?.name
      })
      
      return { success: true, user: authUser, userInfo: authUserInfo }
      
    } catch (error) {
      console.error('❌ Error en login:', error)
      
      let errorMessage = 'Error al iniciar sesión'
      
      // Personalizar mensajes de error
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email o contraseña incorrectos'
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Debes verificar tu email antes de iniciar sesión'
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Demasiados intentos. Intenta más tarde'
      }
      
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Logout real con Supabase
  const logout = async () => {
    try {
      setLoading(true)
      console.log('👋 Cerrando sesión...')
      
      await authService.signOut()
      
      setUser(null)
      setSession(null)
      setUserInfo(null)
      
      toast.success('Sesión cerrada exitosamente')
      console.log('✅ Logout exitoso')
      
      return { success: true }
    } catch (error) {
      console.error('❌ Error en logout:', error)
      toast.error('Error al cerrar sesión')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Refresh información del usuario
  const refreshUserInfo = async () => {
    try {
      if (!user?.id) return null
      
      console.log('🔄 Actualizando información del usuario...')
      const updatedUserInfo = await authService.getUserInfo(user.id)
      setUserInfo(updatedUserInfo)
      console.log('✅ Información actualizada')
      return updatedUserInfo
    } catch (error) {
      console.error('❌ Error actualizando info del usuario:', error)
      return userInfo
    }
  }

  // Funciones de utilidad para roles y permisos
  const hasRole = (roleName) => {
    return userInfo?.role?.name === roleName
  }

  const hasPermission = (permission) => {
    if (!userInfo?.role?.permissions) return false
    if (userInfo.role.permissions.all) return true
    return userInfo.role.permissions[permission] === true
  }

  const isAdmin = () => hasRole('administrador')
  const isReception = () => hasRole('recepcion')

  const getPrimaryBranch = () => {
    const primaryBranch = userInfo?.user_branches?.find(ub => ub.is_primary)
    return primaryBranch?.branch || userInfo?.user_branches?.[0]?.branch
  }

  const getUserBranches = () => {
    return userInfo?.user_branches?.map(ub => ub.branch) || []
  }

  // Información computada
  const userName = userInfo ? `${userInfo.first_name} ${userInfo.last_name}` : ''
  const userRole = userInfo?.role?.name || ''
  const userEmail = user?.email || ''
  const primaryBranch = getPrimaryBranch()

  const value = {
    // Estado principal
    user,
    userInfo,
    session,
    loading,
    initializing,
    isAuthenticated: !!user,
    
    // Acciones
    login,
    logout,
    refreshUserInfo,
    
    // Utilidades de roles
    hasRole,
    hasPermission,
    isAdmin,
    isReception,
    
    // Información de sucursales
    getPrimaryBranch,
    getUserBranches,
    
    // Información computada
    userName,
    userRole,
    userEmail,
    primaryBranch,
    
    // Para debugging
    authService // Exponer el servicio para casos específicos
  }

  console.log('🎯 AuthProvider state:', {
    isAuthenticated: !!user,
    loading,
    initializing,
    userRole: userInfo?.role?.name,
    userEmail: user?.email,
    primaryBranch: primaryBranch?.name
  })

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}