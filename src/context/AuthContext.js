// src/context/AuthContext.js - VERSIÓN CON SUPABASE AUTH REAL
import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { db, supabase } from '../lib/supabase';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        permissions: action.payload.permissions,
        selectedBranch: action.payload.selectedBranch || null,
        needsBranchSelection: action.payload.needsBranchSelection || false,
        error: null
      };
    
    case 'SET_BRANCH':
      return {
        ...state,
        selectedBranch: action.payload,
        needsBranchSelection: false,
        loading: false
      };
    
    case 'REQUIRE_BRANCH_SELECTION':
      return {
        ...state,
        needsBranchSelection: true,
        loading: false
      };
    
    case 'BRANCH_SWITCHING_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'BRANCH_SWITCHING_SUCCESS':
      return {
        ...state,
        loading: false,
        selectedBranch: action.payload,
        needsBranchSelection: false,
        error: null
      };
    
    case 'BRANCH_SWITCHING_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        permissions: null,
        selectedBranch: null,
        needsBranchSelection: false,
        error: action.payload
      };
    
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        permissions: null,
        selectedBranch: null,
        needsBranchSelection: false,
        error: null,
        loading: false
      };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  permissions: null,
  selectedBranch: null,
  needsBranchSelection: false,
  loading: true,
  error: null
};

// Permisos por rol
const ROLE_PERMISSIONS = {
  admin: {
    dashboard: { read: true, write: true },
    checkin: { read: false, write: false },
    reservations: { read: false, write: false },
    guests: { read: true, write: true },
    rooms: { read: true, write: true },
    supplies: { read: true, write: true },
    reports: { read: true, write: true },
    settings: { read: true, write: true }
  },
  reception: {
    dashboard: { read: true, write: false },
    checkin: { read: true, write: true },
    reservations: { read: true, write: true },
    guests: { read: true, write: true },
    rooms: { read: true, write: true },
    supplies: { read: true, write: false },
    reports: { read: true, write: false },
    settings: { read: false, write: false }
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Referencias para evitar operaciones duplicadas
  const branchSelectionRef = useRef(false);
  const initializingRef = useRef(false);

  // Verificar sesión de Supabase al cargar
  useEffect(() => {
    if (initializingRef.current) return;
    checkSupabaseSession();
  }, []);

  // Listener para cambios de auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session) {
          await handleAuthUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          handleLogout();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkSupabaseSession = useCallback(async () => {
    if (initializingRef.current) return;
    
    try {
      initializingRef.current = true;
      console.log('🔍 Checking Supabase session...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session?.user) {
        console.log('👤 Found active session for:', session.user.email);
        await handleAuthUser(session.user);
      } else {
        console.log('📭 No active session found');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Error checking session:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    } finally {
      initializingRef.current = false;
    }
  }, []);

  const handleAuthUser = async (authUser) => {
    try {
      console.log('🔄 Processing authenticated user:', authUser.email);
      
      // Obtener perfil de usuario de la tabla users
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw new Error('Usuario no encontrado en el sistema');
      }
      
      console.log('👤 User profile loaded:', userProfile.name, userProfile.role);
      
      // Obtener permisos basados en el rol
      const permissions = ROLE_PERMISSIONS[userProfile.role] || {};
      
      // Verificar sucursal guardada
      let selectedBranch = null;
      const savedBranch = localStorage.getItem('hotel_selected_branch');
      
      if (savedBranch) {
        try {
          const branchData = JSON.parse(savedBranch);
          // Verificar que la sucursal aún existe
          const { data: validBranch } = await db.getBranchById(branchData.id);
          if (validBranch) {
            selectedBranch = validBranch;
            console.log('✅ Restored saved branch:', selectedBranch.name);
          } else {
            localStorage.removeItem('hotel_selected_branch');
          }
        } catch (error) {
          console.warn('Error restoring saved branch:', error);
          localStorage.removeItem('hotel_selected_branch');
        }
      }
      
      // Para administradores, cargar sucursal por defecto si no hay una guardada
      if (userProfile.role === 'admin' && !selectedBranch) {
        try {
          const { data: userBranches } = await db.getUserBranches(authUser.id);
          const defaultBranch = userBranches?.find(b => b.isDefault) || userBranches?.[0];
          if (defaultBranch) {
            selectedBranch = defaultBranch;
            localStorage.setItem('hotel_selected_branch', JSON.stringify(defaultBranch));
            console.log('🏢 Set default branch for admin:', defaultBranch.name);
          }
        } catch (error) {
          console.warn('Error loading admin branches:', error);
        }
      }
      
      // Para recepción, cargar sucursal asignada
      if (userProfile.role === 'reception' && !selectedBranch) {
        try {
          const { data: userBranches } = await db.getUserBranches(authUser.id);
          const assignedBranch = userBranches?.[0];
          if (assignedBranch) {
            selectedBranch = assignedBranch;
            localStorage.setItem('hotel_selected_branch', JSON.stringify(assignedBranch));
            console.log('🏢 Set assigned branch for reception:', assignedBranch.name);
          }
        } catch (error) {
          console.warn('Error loading reception branch:', error);
        }
      }
      
      const needsBranchSelection = userProfile.role === 'admin' && !selectedBranch;
      
      // Actualizar last_login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authUser.id);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: {
            id: authUser.id,
            email: authUser.email,
            name: userProfile.name,
            role: userProfile.role,
            avatar: userProfile.avatar_url
          },
          permissions,
          selectedBranch,
          needsBranchSelection
        }
      });
      
    } catch (error) {
      console.error('Error handling auth user:', error);
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message
      });
    }
  };

  const login = useCallback(async (email, password) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      console.log('🔐 Attempting Supabase login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      if (!data.user) {
        throw new Error('No se recibieron datos del usuario');
      }

      console.log('✅ Supabase login successful for:', data.user.email);
      
      // handleAuthUser se llamará automáticamente por el listener
      return { success: true };
      
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message
      });
      return { success: false, error: error.message };
    }
  }, []);

  const selectBranch = useCallback(async (branch) => {
    if (branchSelectionRef.current) {
      console.log('❌ Branch selection already in progress');
      return { success: false, error: 'Selección de sucursal ya en progreso' };
    }

    console.log('🏢 AuthContext.selectBranch called for:', branch.name);
    
    dispatch({ type: 'BRANCH_SWITCHING_START' });
    branchSelectionRef.current = true;
    
    try {
      // Validar que la sucursal existe
      const { data: validBranch, error } = await db.getBranchById(branch.id);
      if (error || !validBranch) {
        throw new Error('Sucursal no válida o no encontrada');
      }

      console.log('✅ Branch validated:', validBranch.name);
      
      // Guardar sucursal seleccionada
      const branchToSave = {
        ...validBranch,
        selectedAt: new Date().toISOString()
      };
      
      localStorage.setItem('hotel_selected_branch', JSON.stringify(branchToSave));
      
      // Actualizar estado
      dispatch({
        type: 'BRANCH_SWITCHING_SUCCESS',
        payload: branchToSave
      });

      console.log('🎉 Branch selection completed successfully:', branchToSave.name);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Branch selection failed:', error.message);
      dispatch({ 
        type: 'BRANCH_SWITCHING_ERROR', 
        payload: error.message 
      });
      return { success: false, error: error.message };
    } finally {
      setTimeout(() => {
        branchSelectionRef.current = false;
      }, 500);
    }
  }, []);

  const changeBranch = useCallback(async (branchId) => {
    try {
      console.log('🔄 AuthContext.changeBranch called with ID:', branchId);
      const { data: branch, error } = await db.getBranchById(branchId);
      if (error || !branch) {
        return { success: false, error: 'Sucursal no encontrada' };
      }

      return await selectBranch(branch);
    } catch (error) {
      console.error('❌ changeBranch error:', error.message);
      return { success: false, error: error.message };
    }
  }, [selectBranch]);

  const logout = useCallback(async () => {
    console.log('👋 Logging out user');
    
    try {
      // Logout de Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Error during Supabase logout:', error);
    }
    
    handleLogout();
  }, []);

  const handleLogout = () => {
    // Limpiar localStorage
    try {
      localStorage.removeItem('hotel_selected_branch');
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
    }
    
    // Limpiar referencias
    branchSelectionRef.current = false;
    initializingRef.current = false;
    
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const hasPermission = useCallback((module, action = 'read') => {
    if (!state.permissions || !state.permissions[module]) {
      return false;
    }
    return state.permissions[module][action] === true;
  }, [state.permissions]);

  const hasRole = useCallback((role) => {
    return state.user?.role === role;
  }, [state.user?.role]);

  const getAllowedRoutes = useCallback(() => {
    if (!state.permissions) return [];

    const routes = [];
    
    Object.keys(state.permissions).forEach(module => {
      if (state.permissions[module].read) {
        routes.push(module);
      }
    });

    return routes;
  }, [state.permissions]);

  const isReady = useCallback(() => {
    if (!state.isAuthenticated) return false;
    if (state.user?.role === 'admin') {
      return !state.needsBranchSelection && state.selectedBranch;
    }
    return true;
  }, [state.isAuthenticated, state.user?.role, state.needsBranchSelection, state.selectedBranch]);

  const getAvailableBranches = useCallback(async () => {
    try {
      if (state.user?.role === 'admin') {
        const { data: branches, error } = await db.getBranches();
        if (error) throw error;
        return branches || [];
      } else if (state.user?.id) {
        const { data: userBranches, error } = await db.getUserBranches(state.user.id);
        if (error) throw error;
        return userBranches || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting available branches:', error);
      return [];
    }
  }, [state.user]);

  const canChangeBranch = useCallback(() => {
    return state.user?.role === 'admin';
  }, [state.user?.role]);

  const value = {
    // Estado principal
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    permissions: state.permissions,
    selectedBranch: state.selectedBranch,
    needsBranchSelection: state.needsBranchSelection,
    loading: state.loading,
    error: state.error,
    
    // Funciones de autenticación
    login,
    logout,
    clearError,
    
    // Funciones de sucursales
    selectBranch,
    changeBranch,
    getAvailableBranches,
    canChangeBranch,
    
    // Funciones de permisos
    hasPermission,
    hasRole,
    getAllowedRoutes,
    isReady
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};