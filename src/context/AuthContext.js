// src/context/AuthContext.js - VERSIÓN OPTIMIZADA PARA EVITAR BUCLES
import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { db, supabase } from '../lib/supabase';

const AuthContext = createContext();

// =============================================
// VERSION MANAGEMENT PARA CACHE BUSTING
// =============================================
const APP_VERSION = process.env.REACT_APP_VERSION || '1.0.0';
const BUILD_TIME = process.env.REACT_APP_BUILD_TIME || Date.now();

const clearObsoleteCache = () => {
  try {
    const storedVersion = localStorage.getItem('hotel_app_version');
    const storedBuildTime = localStorage.getItem('hotel_build_time');
    
    if (storedVersion !== APP_VERSION || storedBuildTime !== BUILD_TIME.toString()) {
      console.log('🔄 New version detected, clearing cache...');
      
      // Limpiar solo datos de la app, mantener datos críticos
      const keysToKeep = ['hotel_selected_branch'];
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key) && key.startsWith('hotel_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Limpiar todo sessionStorage
      sessionStorage.clear();
      
      // Guardar nueva versión
      localStorage.setItem('hotel_app_version', APP_VERSION);
      localStorage.setItem('hotel_build_time', BUILD_TIME.toString());
      
      console.log('✅ Cache cleared for new version:', APP_VERSION);
    }
  } catch (error) {
    console.warn('Error managing cache version:', error);
  }
};

// =============================================
// REDUCER
// =============================================
const authReducer = (state, action) => {
  switch (action.type) {
    case 'INIT_START':
      return { ...state, loading: true, error: null };
    
    case 'INIT_SUCCESS':
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
    
    case 'INIT_FAILURE':
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
    
    case 'LOGOUT':
      return {
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

// =============================================
// ROLE PERMISSIONS
// =============================================
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

// =============================================
// PROVIDER COMPONENT
// =============================================
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Referencias para prevenir operaciones duplicadas
  const initializingRef = useRef(false);
  const authListenerRef = useRef(null);
  const mountedRef = useRef(true);

  // ✅ CLEANUP CUANDO EL COMPONENTE SE DESMONTA
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ✅ INICIALIZACIÓN ÚNICA
  useEffect(() => {
    // Limpiar caché obsoleto inmediatamente
    clearObsoleteCache();
    
    // Solo inicializar una vez
    if (!initializingRef.current) {
      initializingRef.current = true;
      initializeAuth();
    }

    // Cleanup al desmontar
    return () => {
      if (authListenerRef.current) {
        authListenerRef.current.subscription?.unsubscribe();
        authListenerRef.current = null;
      }
    };
  }, []);

  // ✅ FUNCIÓN DE INICIALIZACIÓN OPTIMIZADA
  const initializeAuth = async () => {
    try {
      console.log('🔄 Initializing auth system...');
      
      if (!mountedRef.current) return;
      
      dispatch({ type: 'INIT_START' });

      // Configurar listener de auth una sola vez
      if (!authListenerRef.current) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mountedRef.current) return;
            
            console.log('🔔 Auth state change:', event, session?.user?.email);
            
            if (event === 'SIGNED_IN' && session?.user) {
              await handleAuthenticatedUser(session.user);
            } else if (event === 'SIGNED_OUT') {
              handleLogout();
            }
          }
        );
        
        authListenerRef.current = { subscription };
      }

      // Verificar sesión actual
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!mountedRef.current) return;
      
      if (error) {
        console.error('Error getting session:', error);
        dispatch({ type: 'INIT_FAILURE', payload: error.message });
        return;
      }
      
      if (session?.user) {
        console.log('👤 Found existing session for:', session.user.email);
        await handleAuthenticatedUser(session.user);
      } else {
        console.log('📭 No active session found');
        dispatch({ type: 'INIT_FAILURE', payload: null });
      }
      
    } catch (error) {
      console.error('Error initializing auth:', error);
      if (mountedRef.current) {
        dispatch({ type: 'INIT_FAILURE', payload: error.message });
      }
    }
  };

  // ✅ FUNCIÓN PARA MANEJAR USUARIO AUTENTICADO
  const handleAuthenticatedUser = async (authUser) => {
    try {
      if (!mountedRef.current) return;
      
      console.log('🔄 Processing authenticated user:', authUser.email);
      
      // Obtener perfil de usuario
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (profileError || !userProfile) {
        throw new Error('Usuario no encontrado en el sistema');
      }
      
      if (!mountedRef.current) return;
      
      console.log('👤 User profile loaded:', userProfile.name, userProfile.role);
      
      // Obtener permisos basados en el rol
      const permissions = ROLE_PERMISSIONS[userProfile.role] || {};
      
      // Verificar sucursal guardada
      let selectedBranch = null;
      let needsBranchSelection = false;
      
      // Para administradores, verificar sucursal
      if (userProfile.role === 'admin') {
        const savedBranch = getBranchFromStorage();
        
        if (savedBranch) {
          // Verificar que la sucursal aún existe
          try {
            const { data: validBranch } = await db.getBranchById(savedBranch.id);
            if (validBranch) {
              selectedBranch = validBranch;
              console.log('✅ Restored saved branch:', selectedBranch.name);
            } else {
              clearBranchFromStorage();
              needsBranchSelection = true;
            }
          } catch (error) {
            console.warn('Error validating saved branch:', error);
            clearBranchFromStorage();
            needsBranchSelection = true;
          }
        } else {
          needsBranchSelection = true;
        }
      } else if (userProfile.role === 'reception') {
        // Para recepción, cargar sucursal asignada
        try {
          const { data: userBranches } = await db.getUserBranches(authUser.id);
          const assignedBranch = userBranches?.[0];
          if (assignedBranch) {
            selectedBranch = assignedBranch;
            saveBranchToStorage(assignedBranch);
            console.log('🏢 Set assigned branch for reception:', assignedBranch.name);
          }
        } catch (error) {
          console.warn('Error loading reception branch:', error);
        }
      }
      
      if (!mountedRef.current) return;
      
      // Actualizar last_login
      supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authUser.id)
        .then(() => console.log('✅ Last login updated'));
      
      dispatch({
        type: 'INIT_SUCCESS',
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
      console.error('Error handling authenticated user:', error);
      if (mountedRef.current) {
        dispatch({ type: 'INIT_FAILURE', payload: error.message });
      }
    }
  };

  // ✅ FUNCIONES DE STORAGE OPTIMIZADAS
  const getBranchFromStorage = () => {
    try {
      const savedBranch = localStorage.getItem('hotel_selected_branch');
      return savedBranch ? JSON.parse(savedBranch) : null;
    } catch (error) {
      console.warn('Error reading branch from storage:', error);
      return null;
    }
  };

  const saveBranchToStorage = (branch) => {
    try {
      const branchData = {
        ...branch,
        selectedAt: new Date().toISOString()
      };
      localStorage.setItem('hotel_selected_branch', JSON.stringify(branchData));
    } catch (error) {
      console.warn('Error saving branch to storage:', error);
    }
  };

  const clearBranchFromStorage = () => {
    try {
      localStorage.removeItem('hotel_selected_branch');
    } catch (error) {
      console.warn('Error clearing branch from storage:', error);
    }
  };

  // ✅ FUNCIÓN DE LOGIN OPTIMIZADA
  const login = useCallback(async (email, password) => {
    if (!mountedRef.current) return { success: false, error: 'Component unmounted' };
    
    dispatch({ type: 'LOGIN_START' });

    try {
      console.log('🔐 Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      if (!data.user) {
        throw new Error('No se recibieron datos del usuario');
      }

      console.log('✅ Login successful for:', data.user.email);
      
      // handleAuthenticatedUser se llamará automáticamente por el listener
      return { success: true };
      
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      if (mountedRef.current) {
        dispatch({ type: 'INIT_FAILURE', payload: error.message });
      }
      return { success: false, error: error.message };
    }
  }, []);

  // ✅ FUNCIÓN DE SELECCIÓN DE SUCURSAL OPTIMIZADA
  const selectBranch = useCallback(async (branch) => {
    if (!mountedRef.current) return { success: false, error: 'Component unmounted' };
    
    console.log('🏢 Selecting branch:', branch.name);
    
    if (!branch || !branch.id) {
      return { success: false, error: 'Datos de sucursal inválidos' };
    }

    try {
      // Validar sucursal
      const { data: validBranch, error } = await db.getBranchById(branch.id);
      if (error || !validBranch) {
        throw new Error('Sucursal no válida');
      }

      if (!mountedRef.current) return { success: false, error: 'Component unmounted' };

      // Guardar en storage
      saveBranchToStorage(validBranch);
      
      // Actualizar estado
      dispatch({ type: 'SET_BRANCH', payload: validBranch });

      console.log('✅ Branch selected successfully:', validBranch.name);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Branch selection failed:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // ✅ FUNCIÓN DE LOGOUT OPTIMIZADA
  const logout = useCallback(async () => {
    console.log('👋 Logging out user');
    
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Error during Supabase logout:', error);
    }
    
    handleLogout();
  }, []);

  const handleLogout = () => {
    // Limpiar storage
    clearBranchFromStorage();
    
    // Limpiar referencias
    initializingRef.current = false;
    
    if (mountedRef.current) {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // ✅ FUNCIONES DE UTILIDAD
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

  const isReady = useCallback(() => {
    if (!state.isAuthenticated) return false;
    if (state.user?.role === 'admin') {
      return !state.needsBranchSelection && state.selectedBranch;
    }
    return true;
  }, [state.isAuthenticated, state.user?.role, state.needsBranchSelection, state.selectedBranch]);

  const canChangeBranch = useCallback(() => {
    return state.user?.role === 'admin';
  }, [state.user?.role]);

  // ✅ VALUE OBJECT ESTABLE
  const value = React.useMemo(() => ({
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
    canChangeBranch,
    
    // Funciones de permisos
    hasPermission,
    hasRole,
    isReady
  }), [
    state,
    login,
    logout,
    clearError,
    selectBranch,
    canChangeBranch,
    hasPermission,
    hasRole,
    isReady
  ]);

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