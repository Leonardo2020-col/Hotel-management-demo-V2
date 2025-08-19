// src/context/AuthContext.js - VERSIÓN ACTUALIZADA
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
        
        if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
          console.error('❌ Variables de entorno de Supabase no configuradas')
          if (isMounted) {
            toast.error('Error de configuración: Variables de entorno faltantes')
            setLoading(false)
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
          
          if (currentUserInfo?.first_name) {
            toast.success(`Bienvenido de vuelta, ${currentUserInfo.first_name}!`)
          }
        } else {
          console.log('👤 No hay usuario logueado')
          clearAuthState()
        }
        
      } catch (error) {
        console.error('❌ Error inicializando auth:', error)
        if (isMounted) {
          toast.error('Error al inicializar autenticación')
          clearAuthState()
        }
      } finally {
        if (isMounted) {
          setLoading(false)
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
            
            if (event === 'SIGNED_IN' && session?.user) {
              try {
                if (user?.id !== session.user.id) {
                  setLoading(true)
                  const userInfo = await authService.getUserInfo(session.user.id)
                  
                  if (isMounted) {
                    setUser(session.user)
                    setSession(session)
                    setUserInfo(userInfo)
                    setLoading(false)
                    console.log('✅ Usuario logueado via listener:', userInfo)
                  }
                }
              } catch (error) {
                console.error('❌ Error obteniendo info del usuario:', error)
                if (isMounted) {
                  toast.error('Error al obtener información del usuario')
                  clearAuthState()
                }
              }
            } else if (event === 'SIGNED_OUT') {
              console.log('👋 Usuario deslogueado via listener')
              if (isMounted) {
                clearAuthState()
              }
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
  }, [])

  // Login actualizado
  const login = async (email, password) => {
    try {
      setLoading(true)
      console.log('🔑 Intentando login con Supabase:', { email })
      
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

  // Logout corregido
  const logout = async () => {
    try {
      console.log('👋 Iniciando cierre de sesión...')
      
      clearAuthState()
      await authService.signOut()
      
      toast.success('Sesión cerrada exitosamente')
      console.log('✅ Logout exitoso - Estado limpiado')
      
      return { success: true }
    } catch (error) {
      console.error('❌ Error en logout:', error)
      clearAuthState()
      toast.error('Sesión cerrada (con advertencias)')
      return { success: false, error: error.message }
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

  // =============================================
  // FUNCIONES DE PERMISOS ACTUALIZADAS
  // =============================================

  // Verificar rol específico
  const hasRole = (roleName) => {
    return userInfo?.role?.name === roleName
  }

  // Verificar permiso específico (ACTUALIZADO)
  const hasPermission = (permission) => {
    if (!userInfo?.role?.permissions) return false
    
    // Si tiene permisos de administrador total
    if (userInfo.role.permissions.all) return true
    
    // Verificar permiso específico
    return userInfo.role.permissions[permission] === true
  }

  // Roles específicos
  const isAdmin = () => hasRole('administrador')
  const isReception = () => hasRole('recepcion')

  // =============================================
  // FUNCIONES DE SUCURSALES ACTUALIZADAS
  // =============================================

  const getPrimaryBranch = () => {
    const primaryBranch = userInfo?.user_branches?.find(ub => ub.is_primary)
    return primaryBranch?.branch || userInfo?.user_branches?.[0]?.branch
  }

  const getUserBranches = () => {
    return userInfo?.user_branches?.map(ub => ub.branch) || []
  }

  // =============================================
  // INFORMACIÓN COMPUTADA ACTUALIZADA
  // =============================================

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
    
    // Utilidades de roles ACTUALIZADAS
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
    authService
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
