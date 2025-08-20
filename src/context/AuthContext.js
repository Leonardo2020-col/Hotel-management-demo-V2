// src/context/AuthContext.js - VERSIÓN CORREGIDA
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
  const [loading, setLoading] = useState(false) // ✅ Inicializar en false
  const [initializing, setInitializing] = useState(true)

  console.log('🔍 AuthProvider inicializando con Supabase actualizado...')

  // Función para limpiar el estado completamente
  const clearAuthState = () => {
    console.log('🧹 Limpiando estado de autenticación...')
    setUser(null)
    setUserInfo(null)
    setSession(null)
    setLoading(false)
  }

  useEffect(() => {
    let isMounted = true
    let authSubscription = null

    const initializeAuth = async () => {
      try {
        console.log('🔍 Verificando variables de entorno...')
        
        // ✅ Mejorar validación de variables de entorno
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
        const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY
        
        if (!supabaseUrl || !supabaseKey) {
          console.error('❌ Variables de entorno de Supabase no configuradas')
          console.error('REACT_APP_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante')
          console.error('REACT_APP_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Configurada' : '❌ Faltante')
          
          if (isMounted) {
            toast.error('Error de configuración: Variables de entorno faltantes')
            setInitializing(false)
          }
          return
        }

        console.log('✅ Variables de entorno configuradas')
        console.log('🔄 Obteniendo sesión actual...')

        // Obtener sesión actual
        const { session: currentSession, userInfo: currentUserInfo } = await authService.getCurrentSession()
        
        if (!isMounted) return

        if (currentSession?.user) {
          console.log('✅ Usuario ya logueado:', currentSession.user.email)
          setUser(currentSession.user)
          setSession(currentSession)
          setUserInfo(currentUserInfo)
          
          // ✅ Solo mostrar toast de bienvenida si es necesario
          if (currentUserInfo?.first_name && !sessionStorage.getItem('welcome_shown')) {
            toast.success(`Bienvenido de vuelta, ${currentUserInfo.first_name}!`)
            sessionStorage.setItem('welcome_shown', 'true')
          }
        } else {
          console.log('👤 No hay usuario logueado')
          clearAuthState()
        }
        
      } catch (error) {
        console.error('❌ Error inicializando auth:', error)
        if (isMounted) {
          // ✅ Solo mostrar error si es crítico
          if (error.message.includes('network') || error.message.includes('connection')) {
            toast.error('Error de conexión. Verificando...')
          }
          clearAuthState()
        }
      } finally {
        if (isMounted) {
          setInitializing(false)
          console.log('✅ Auth inicializado')
        }
      }
    }

    // Configurar listener de cambios de autenticación
    const setupAuthListener = () => {
      try {
        authSubscription = authService.supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔄 Auth state change:', event, session?.user?.email)
            
            if (!isMounted) return
            
            // ✅ Mejorar manejo de eventos
            switch (event) {
              case 'SIGNED_IN':
                if (session?.user && user?.id !== session.user.id) {
                  try {
                    setLoading(true)
                    const userInfo = await authService.getUserInfo(session.user.id)
                    
                    if (isMounted) {
                      setUser(session.user)
                      setSession(session)
                      setUserInfo(userInfo)
                      console.log('✅ Usuario logueado via listener:', userInfo)
                    }
                  } catch (error) {
                    console.error('❌ Error obteniendo info del usuario:', error)
                    if (isMounted) {
                      toast.error('Error al obtener información del usuario')
                      clearAuthState()
                    }
                  } finally {
                    if (isMounted) setLoading(false)
                  }
                }
                break
                
              case 'SIGNED_OUT':
                console.log('👋 Usuario deslogueado via listener')
                if (isMounted) {
                  clearAuthState()
                  sessionStorage.removeItem('welcome_shown')
                }
                break
                
              case 'TOKEN_REFRESHED':
                console.log('🔄 Token renovado')
                if (session && isMounted) {
                  setSession(session)
                }
                break
                
              default:
                console.log('ℹ️ Evento de auth no manejado:', event)
            }
          }
        )
        console.log('👂 Auth listener configurado')
      } catch (error) {
        console.error('❌ Error configurando auth listener:', error)
      }
    }

    initializeAuth().then(() => {
      if (isMounted) {
        setupAuthListener()
      }
    })

    return () => {
      console.log('🧹 Limpiando AuthProvider...')
      isMounted = false
      if (authSubscription) {
        authSubscription.unsubscribe()
        authSubscription = null
      }
    }
  }, []) // ✅ Dependencias vacías están correctas

  // Login mejorado
  const login = async (email, password) => {
    try {
      setLoading(true)
      console.log('🔑 Intentando login con Supabase:', { email })
      
      // ✅ Validación básica antes de enviar
      if (!email?.trim() || !password?.trim()) {
        throw new Error('Email y contraseña son requeridos')
      }
      
      const { user: authUser, session: authSession, userInfo: authUserInfo } = await authService.signIn(email.trim(), password)
      
      setUser(authUser)
      setSession(authSession)
      setUserInfo(authUserInfo)
      
      toast.success(`¡Bienvenido, ${authUserInfo.first_name}!`)
      sessionStorage.setItem('welcome_shown', 'true')
      
      console.log('✅ Login exitoso:', {
        email: authUser.email,
        role: authUserInfo.role?.name,
        branch: authUserInfo.user_branches?.[0]?.branch?.name
      })
      
      return { success: true, user: authUser, userInfo: authUserInfo }
      
    } catch (error) {
      console.error('❌ Error en login:', error)
      
      // ✅ Mejorar mensajes de error
      let errorMessage = 'Error al iniciar sesión'
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email o contraseña incorrectos'
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Debes verificar tu email antes de iniciar sesión'
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Demasiados intentos. Intenta más tarde'
      } else if (error.message?.includes('network') || error.message?.includes('connection')) {
        errorMessage = 'Error de conexión. Verifica tu internet'
      } else if (error.message?.includes('requeridos')) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Logout mejorado
  const logout = async () => {
    try {
      console.log('👋 Iniciando cierre de sesión...')
      setLoading(true)
      
      // ✅ Limpiar estado primero para UX más rápida
      clearAuthState()
      sessionStorage.removeItem('welcome_shown')
      
      await authService.signOut()
      
      toast.success('Sesión cerrada exitosamente')
      console.log('✅ Logout exitoso - Estado limpiado')
      
      return { success: true }
    } catch (error) {
      console.error('❌ Error en logout:', error)
      // ✅ Asegurar que el estado se limpie incluso si hay error
      clearAuthState()
      sessionStorage.removeItem('welcome_shown')
      toast.success('Sesión cerrada') // No mostrar como error si se limpió el estado
      return { success: true, warning: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Refresh información del usuario mejorado
  const refreshUserInfo = async () => {
    try {
      if (!user?.id) {
        console.warn('⚠️ No hay usuario para actualizar')
        return null
      }
      
      console.log('🔄 Actualizando información del usuario...')
      setLoading(true)
      
      const updatedUserInfo = await authService.getUserInfo(user.id)
      setUserInfo(updatedUserInfo)
      
      console.log('✅ Información actualizada')
      return updatedUserInfo
    } catch (error) {
      console.error('❌ Error actualizando info del usuario:', error)
      toast.error('Error al actualizar información del usuario')
      return userInfo // Devolver info actual si hay error
    } finally {
      setLoading(false)
    }
  }

  // =============================================
  // FUNCIONES DE PERMISOS (SIN CAMBIOS - ESTÁN BIEN)
  // =============================================

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

  // =============================================
  // FUNCIONES DE SUCURSALES (SIN CAMBIOS - ESTÁN BIEN)
  // =============================================

  const getPrimaryBranch = () => {
    const primaryBranch = userInfo?.user_branches?.find(ub => ub.is_primary)
    return primaryBranch?.branch || userInfo?.user_branches?.[0]?.branch
  }

  const getUserBranches = () => {
    return userInfo?.user_branches?.map(ub => ub.branch) || []
  }

  // =============================================
  // INFORMACIÓN COMPUTADA
  // =============================================

  const userName = userInfo ? `${userInfo.first_name} ${userInfo.last_name}` : ''
  const userRole = userInfo?.role?.name || ''
  const userEmail = user?.email || ''
  const primaryBranch = getPrimaryBranch()

  // ✅ Mejorar el objeto value con memoización implícita
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
    
    // Para debugging (solo en desarrollo)
    ...(process.env.NODE_ENV === 'development' && { authService })
  }

  console.log('🎯 AuthProvider state actualizado:', {
    isAuthenticated: !!user,
    loading,
    initializing,
    userRole: userInfo?.role?.name,
    userEmail: user?.email,
    primaryBranch: primaryBranch?.name,
    branchId: primaryBranch?.id
  })

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}