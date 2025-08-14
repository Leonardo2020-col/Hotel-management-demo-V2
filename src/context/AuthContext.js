// src/context/AuthContext.js - VERSIÓN SIMPLIFICADA PARA DEBUG
import React, { createContext, useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

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

  console.log('🔐 AuthProvider inicializando...')

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔍 Verificando variables de entorno...')
        
        if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
          console.error('❌ Variables de entorno de Supabase no configuradas')
          toast.error('Error de configuración: Variables de entorno faltantes')
          return
        }

        console.log('✅ Variables de entorno configuradas')

        // Por ahora, solo simulamos que no hay usuario logueado
        console.log('👤 No hay usuario logueado (simulado)')
        
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
  }, [])

  // Login simulado por ahora
  const login = async (email, password) => {
    try {
      setLoading(true)
      console.log('🔑 Intentando login con:', { email, password: '***' })
      
      // Simulación de login exitoso para ADMINISTRADOR
      if (email === 'admin@hotel.com' && password === '123456') {
        const mockUser = { id: '1', email }
        const mockUserInfo = {
          id: '1',
          first_name: 'Admin',
          last_name: 'Sistema',
          role: { name: 'administrador', permissions: { all: true } },
          user_branches: [{
            branch: { id: '1', name: 'Hotel Principal' },
            is_primary: true
          }]
        }
        
        setUser(mockUser)
        setUserInfo(mockUserInfo)
        setSession({ user: mockUser })
        
        toast.success(`Bienvenido, ${mockUserInfo.first_name}!`)
        console.log('✅ Login exitoso - Administrador')
        return { success: true, user: mockUser, userInfo: mockUserInfo }
      }
      
      // Simulación de login exitoso para RECEPCIÓN
      if (email === 'recepcion@hotel.com' && password === '123456') {
        const mockUser = { id: '2', email }
        const mockUserInfo = {
          id: '2',
          first_name: 'Recepción',
          last_name: 'Hotel',
          role: { 
            name: 'recepcion', 
            permissions: { 
              checkin: true, 
              checkout: true, 
              reservations: true, 
              guests: true, 
              reports_view: true 
            } 
          },
          user_branches: [{
            branch: { id: '1', name: 'Hotel Principal' },
            is_primary: true
          }]
        }
        
        setUser(mockUser)
        setUserInfo(mockUserInfo)
        setSession({ user: mockUser })
        
        toast.success(`Bienvenido, ${mockUserInfo.first_name}!`)
        console.log('✅ Login exitoso - Recepción')
        return { success: true, user: mockUser, userInfo: mockUserInfo }
      }
      
      // Si no coincide ningún usuario
      throw new Error('Credenciales incorrectas')
      
    } catch (error) {
      console.error('❌ Error en login:', error)
      toast.error(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      setUser(null)
      setSession(null)
      setUserInfo(null)
      toast.success('Sesión cerrada')
      console.log('👋 Logout exitoso')
      return { success: true }
    } catch (error) {
      console.error('❌ Error en logout:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Funciones de utilidad
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

  const refreshUserInfo = async () => {
    console.log('🔄 Refresh user info (simulado)')
    return userInfo
  }

  const value = {
    user,
    userInfo,
    session,
    loading,
    initializing,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUserInfo,
    hasRole,
    hasPermission,
    isAdmin,
    isReception,
    getPrimaryBranch,
    getUserBranches,
    userName: userInfo ? `${userInfo.first_name} ${userInfo.last_name}` : '',
    userRole: userInfo?.role?.name || '',
    userEmail: user?.email || ''
  }

  console.log('🎯 AuthProvider state:', {
    isAuthenticated: !!user,
    loading,
    initializing,
    userRole: userInfo?.role?.name
  })

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}