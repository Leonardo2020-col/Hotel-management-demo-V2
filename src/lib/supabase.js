// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Funciones de autenticación (igual que antes, pero adaptado para React)
export const authService = {
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      const userInfo = await this.getUserInfo(data.user.id)
      
      return { 
        user: data.user, 
        session: data.session,
        userInfo 
      }
    } catch (error) {
      console.error('Error en login:', error)
      throw error
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return true
    } catch (error) {
      console.error('Error en logout:', error)
      throw error
    }
  },

  async getUserInfo(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(id, name, permissions),
          user_branches!inner(
            branch_id,
            is_primary,
            branch:branches(id, name, is_active)
          )
        `)
        .eq('id', userId)
        .eq('is_active', true)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error obteniendo info del usuario:', error)
      throw error
    }
  },

  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      
      if (session?.user) {
        const userInfo = await this.getUserInfo(session.user.id)
        return { session, userInfo }
      }
      
      return { session: null, userInfo: null }
    } catch (error) {
      console.error('Error obteniendo sesión:', error)
      return { session: null, userInfo: null }
    }
  },

  hasRole(userInfo, roleName) {
    return userInfo?.role?.name === roleName
  },

  hasPermission(userInfo, permission) {
    if (!userInfo?.role?.permissions) return false
    if (userInfo.role.permissions.all) return true
    return userInfo.role.permissions[permission] === true
  },

  getPrimaryBranch(userInfo) {
    const primaryBranch = userInfo?.user_branches?.find(ub => ub.is_primary)
    return primaryBranch?.branch || userInfo?.user_branches?.[0]?.branch
  },

  getUserBranches(userInfo) {
    return userInfo?.user_branches?.map(ub => ub.branch) || []
  }
}

// src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService, supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { session: currentSession, userInfo: currentUserInfo } = await authService.getCurrentSession()
        
        if (currentSession) {
          setSession(currentSession)
          setUser(currentSession.user)
          setUserInfo(currentUserInfo)
        }
      } catch (error) {
        console.error('Error inicializando autenticación:', error)
        toast.error('Error al cargar la sesión')
      } finally {
        setLoading(false)
        setInitializing(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session)
        
        if (session) {
          setSession(session)
          setUser(session.user)
          
          try {
            const userInfo = await authService.getUserInfo(session.user.id)
            setUserInfo(userInfo)
          } catch (error) {
            console.error('Error obteniendo info del usuario:', error)
            setUserInfo(null)
          }
        } else {
          setSession(null)
          setUser(null)
          setUserInfo(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    try {
      setLoading(true)
      const { user: authUser, session: authSession, userInfo: authUserInfo } = await authService.signIn(email, password)
      
      setUser(authUser)
      setSession(authSession)
      setUserInfo(authUserInfo)
      
      toast.success(`Bienvenido, ${authUserInfo.first_name}!`)
      return { success: true, user: authUser, userInfo: authUserInfo }
    } catch (error) {
      console.error('Error en login:', error)
      const errorMessage = error.message || 'Error al iniciar sesión'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await authService.signOut()
      setUser(null)
      setSession(null)
      setUserInfo(null)
      toast.success('Sesión cerrada exitosamente')
      return { success: true }
    } catch (error) {
      console.error('Error en logout:', error)
      toast.error('Error al cerrar sesión')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const hasRole = (roleName) => authService.hasRole(userInfo, roleName)
  const hasPermission = (permission) => authService.hasPermission(userInfo, permission)
  const isAdmin = () => hasRole('administrador')
  const isReception = () => hasRole('recepcion')
  const getPrimaryBranch = () => authService.getPrimaryBranch(userInfo)
  const getUserBranches = () => authService.getUserBranches(userInfo)

  const refreshUserInfo = async () => {
    if (user) {
      try {
        const updatedUserInfo = await authService.getUserInfo(user.id)
        setUserInfo(updatedUserInfo)
        return updatedUserInfo
      } catch (error) {
        console.error('Error refrescando info del usuario:', error)
        throw error
      }
    }
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}