// src/context/AuthContext.js - VERSIÓN COMPLETAMENTE CORREGIDA SIN BUCLES
import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react'
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
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  // ✅ CORRECCIÓN: Refs para evitar loops infinitos y controlar estado
  const initializingRef = useRef(false)
  const authSubscriptionRef = useRef(null)
  const currentUserIdRef = useRef(null)
  const mountedRef = useRef(true)

  console.log('🔍 AuthProvider inicializando...')

  // ✅ CORRECCIÓN: Función para limpiar el estado completamente - estabilizada
  const clearAuthState = useCallback(() => {
    console.log('🧹 Limpiando estado de autenticación...')
    setUser(null)
    setUserInfo(null)
    setSession(null)
    setLoading(false)
    currentUserIdRef.current = null
  }, [])

  // ✅ CORRECCIÓN: Función para mostrar toast de bienvenida - estabilizada
  const showWelcomeToast = useCallback((userInfo) => {
    if (userInfo?.first_name && !sessionStorage.getItem('welcome_shown')) {
      toast.success(`Bienvenido de vuelta, ${userInfo.first_name}!`)
      sessionStorage.setItem('welcome_shown', 'true')
    }
  }, [])

  // ✅ CORRECCIÓN: Función para actualizar estado del usuario - estabilizada
  const updateUserState = useCallback((authUser, authSession, authUserInfo) => {
    if (!mountedRef.current) return

    // Solo actualizar si es un usuario diferente
    if (currentUserIdRef.current !== authUser.id) {
      console.log('🔄 Actualizando estado del usuario:', authUser.email)
      
      setUser(authUser)
      setSession(authSession)
      setUserInfo(authUserInfo)
      currentUserIdRef.current = authUser.id
      
      showWelcomeToast(authUserInfo)
    }
  }, [showWelcomeToast])

  // ✅ CORRECCIÓN: Función de inicialización estabilizada
  const initializeAuth = useCallback(async () => {
    // Evitar múltiples inicializaciones
    if (initializingRef.current) {
      console.log('⚠️ AuthProvider ya inicializando, saltando...')
      return
    }

    initializingRef.current = true

    try {
      console.log('🔍 Verificando variables de entorno...')
      
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
      const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Variables de entorno de Supabase no configuradas')
        toast.error('Error de configuración: Variables de entorno faltantes')
        return
      }

      console.log('✅ Variables de entorno configuradas')
      console.log('🔄 Obteniendo sesión actual...')

      // Obtener sesión actual
      const { session: currentSession, userInfo: currentUserInfo } = await authService.getCurrentSession()
      
      if (!mountedRef.current) return

      if (currentSession?.user) {
        console.log('✅ Usuario ya logueado:', currentSession.user.email)
        updateUserState(currentSession.user, currentSession, currentUserInfo)
      } else {
        console.log('👤 No hay usuario logueado')
        clearAuthState()
      }
      
    } catch (error) {
      console.error('❌ Error inicializando auth:', error)
      if (mountedRef.current) {
        if (error.message?.includes('network') || error.message?.includes('connection')) {
          toast.error('Error de conexión. Verificando...')
        }
        clearAuthState()
      }
    } finally {
      if (mountedRef.current) {
        setInitializing(false)
        initializingRef.current = false
        console.log('✅ Auth inicializado')
      }
    }
  }, [clearAuthState, updateUserState])

  // ✅ CORRECCIÓN: Configurar listener de autenticación - estabilizada
  const setupAuthListener = useCallback(() => {
    try {
      // Limpiar subscription anterior si existe
      if (authSubscriptionRef.current) {
        console.log('🧹 Limpiando subscription anterior')
        authSubscriptionRef.current.unsubscribe()
        authSubscriptionRef.current = null
      }

      console.log('👂 Configurando auth listener...')
      
      authSubscriptionRef.current = authService.supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔄 Auth state change:', event, session?.user?.email)
          
          if (!mountedRef.current) return
          
          // Manejar solo eventos específicos
          switch (event) {
            case 'SIGNED_IN':
              if (session?.user && currentUserIdRef.current !== session.user.id) {
                try {
                  console.log('🔑 Nuevo usuario logueado via listener')
                  setLoading(true)
                  const userInfo = await authService.getUserInfo(session.user.id)
                  
                  if (mountedRef.current) {
                    updateUserState(session.user, session, userInfo)
                    console.log('✅ Usuario logueado via listener:', userInfo.first_name)
                  }
                } catch (error) {
                  console.error('❌ Error obteniendo info del usuario:', error)
                  if (mountedRef.current) {
                    toast.error('Error al obtener información del usuario')
                    clearAuthState()
                  }
                } finally {
                  if (mountedRef.current) setLoading(false)
                }
              }
              break
              
            case 'SIGNED_OUT':
              console.log('👋 Usuario deslogueado via listener')
              if (mountedRef.current) {
                clearAuthState()
                sessionStorage.removeItem('welcome_shown')
              }
              break
              
            case 'TOKEN_REFRESHED':
              console.log('🔄 Token renovado')
              if (session && mountedRef.current && session.user.id === currentUserIdRef.current) {
                setSession(session)
              }
              break
              
            default:
              console.log('ℹ️ Evento de auth no manejado:', event)
          }
        }
      )
      console.log('✅ Auth listener configurado')
    } catch (error) {
      console.error('❌ Error configurando auth listener:', error)
    }
  }, [updateUserState, clearAuthState])

  // ✅ CORRECCIÓN: useEffect principal - SOLO UNA VEZ
  useEffect(() => {
    console.log('🚀 AuthProvider mount - iniciando configuración')
    mountedRef.current = true

    // Secuencia de inicialización
    const initialize = async () => {
      await initializeAuth()
      if (mountedRef.current) {
        setupAuthListener()
      }
    }

    initialize()

    // Cleanup al desmontar
    return () => {
      console.log('🧹 Limpiando AuthProvider...')
      mountedRef.current = false
      initializingRef.current = false
      
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe()
        authSubscriptionRef.current = null
      }
    }
  }, []) // ✅ CRÍTICO: Dependencias vacías - SOLO ejecutar una vez

  // ✅ CORRECCIÓN: Login estabilizado
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true)
      console.log('🔑 Intentando login con Supabase:', { email })
      
      if (!email?.trim() || !password?.trim()) {
        throw new Error('Email y contraseña son requeridos')
      }
      
      const { user: authUser, session: authSession, userInfo: authUserInfo } = await authService.signIn(email.trim(), password)
      
      if (mountedRef.current) {
        updateUserState(authUser, authSession, authUserInfo)
        
        toast.success(`¡Bienvenido, ${authUserInfo.first_name}!`)
        sessionStorage.setItem('welcome_shown', 'true')
        
        console.log('✅ Login exitoso:', {
          email: authUser.email,
          role: authUserInfo.role?.name,
          branch: authUserInfo.user_branches?.[0]?.branch?.name
        })
      }
      
      return { success: true, user: authUser, userInfo: authUserInfo }
      
    } catch (error) {
      console.error('❌ Error en login:', error)
      
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
      if (mountedRef.current) setLoading(false)
    }
  }, [updateUserState])

  // ✅ CORRECCIÓN: Logout estabilizado
  const logout = useCallback(async () => {
    try {
      console.log('👋 Iniciando cierre de sesión...')
      setLoading(true)
      
      // Limpiar estado primero
      clearAuthState()
      sessionStorage.removeItem('welcome_shown')
      
      // Luego hacer logout en Supabase
      await authService.signOut()
      
      toast.success('Sesión cerrada exitosamente')
      console.log('✅ Logout exitoso - Estado limpiado')
      
      return { success: true }
    } catch (error) {
      console.error('❌ Error en logout:', error)
      // Aún así limpiar el estado local
      clearAuthState()
      sessionStorage.removeItem('welcome_shown')
      toast.success('Sesión cerrada')
      return { success: true, warning: error.message }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [clearAuthState])

  // ✅ CORRECCIÓN: RefreshUserInfo estabilizado
  const refreshUserInfo = useCallback(async () => {
    try {
      if (!user?.id) {
        console.warn('⚠️ No hay usuario para actualizar')
        return null
      }
      
      console.log('🔄 Actualizando información del usuario...')
      setLoading(true)
      
      const updatedUserInfo = await authService.getUserInfo(user.id)
      
      if (mountedRef.current) {
        setUserInfo(updatedUserInfo)
        console.log('✅ Información actualizada')
      }
      
      return updatedUserInfo
    } catch (error) {
      console.error('❌ Error actualizando info del usuario:', error)
      toast.error('Error al actualizar información del usuario')
      return userInfo
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [user?.id, userInfo])

  // =============================================
  // FUNCIONES DE PERMISOS (ESTABLES)
  // =============================================

  const hasRole = useCallback((roleName) => {
    return userInfo?.role?.name === roleName
  }, [userInfo?.role?.name])

  const hasPermission = useCallback((permission) => {
    if (!userInfo?.role?.permissions) return false
    if (userInfo.role.permissions.all) return true
    return userInfo.role.permissions[permission] === true
  }, [userInfo?.role?.permissions])

  const isAdmin = useCallback(() => hasRole('administrador'), [hasRole])
  const isReception = useCallback(() => hasRole('recepcion'), [hasRole])

  const getPrimaryBranch = useCallback(() => {
    const primaryBranch = userInfo?.user_branches?.find(ub => ub.is_primary)
    return primaryBranch?.branch || userInfo?.user_branches?.[0]?.branch
  }, [userInfo?.user_branches])

  const getUserBranches = useCallback(() => {
    return userInfo?.user_branches?.map(ub => ub.branch) || []
  }, [userInfo?.user_branches])

  // =============================================
  // INFORMACIÓN COMPUTADA - MEMOIZADA
  // =============================================

  const computedValues = useMemo(() => {
    const userName = userInfo ? `${userInfo.first_name} ${userInfo.last_name}` : ''
    const userRole = userInfo?.role?.name || ''
    const userEmail = user?.email || ''
    const primaryBranch = getPrimaryBranch()

    return {
      userName,
      userRole,
      userEmail,
      primaryBranch
    }
  }, [user?.email, userInfo, getPrimaryBranch])

  // ✅ CORRECCIÓN: Memoizar el value para evitar re-renders innecesarios
  const contextValue = useMemo(() => ({
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
    ...computedValues,
    
    // Para debugging (solo en desarrollo)
    ...(process.env.NODE_ENV === 'development' && { 
      authService,
      _debugInfo: {
        currentUserId: currentUserIdRef.current,
        mounted: mountedRef.current,
        initializing: initializingRef.current
      }
    })
  }), [
    user,
    userInfo,
    session,
    loading,
    initializing,
    login,
    logout,
    refreshUserInfo,
    hasRole,
    hasPermission,
    isAdmin,
    isReception,
    getPrimaryBranch,
    getUserBranches,
    computedValues
  ])

  // ✅ LOG DE ESTADO (solo cuando cambia algo importante)
  useEffect(() => {
    console.log('🎯 AuthProvider state actualizado:', {
      isAuthenticated: !!user,
      loading,
      initializing,
      userRole: userInfo?.role?.name,
      userEmail: user?.email,
      primaryBranch: computedValues.primaryBranch?.name,
      branchId: computedValues.primaryBranch?.id
    })
  }, [user, loading, initializing, userInfo?.role?.name, computedValues.primaryBranch])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}