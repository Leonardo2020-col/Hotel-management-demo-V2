// src/context/AuthContext.js - VERSIÓN CORREGIDA CON MEJORES PRÁCTICAS
import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { db, supabase } from '../lib/supabase';

const AuthContext = createContext();

// Action types for better maintainability
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  SET_BRANCH: 'SET_BRANCH',
  REQUIRE_BRANCH_SELECTION: 'REQUIRE_BRANCH_SELECTION',
  BRANCH_SWITCHING_START: 'BRANCH_SWITCHING_START',
  BRANCH_SWITCHING_SUCCESS: 'BRANCH_SWITCHING_SUCCESS',
  BRANCH_SWITCHING_ERROR: 'BRANCH_SWITCHING_ERROR',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING'
};

// Auth reducer with better error handling
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return { 
        ...state, 
        loading: true, 
        error: null 
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
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
    
    case AUTH_ACTIONS.SET_BRANCH:
      return {
        ...state,
        selectedBranch: action.payload,
        needsBranchSelection: false,
        loading: false
      };
    
    case AUTH_ACTIONS.REQUIRE_BRANCH_SELECTION:
      return {
        ...state,
        needsBranchSelection: true,
        loading: false
      };
    
    case AUTH_ACTIONS.BRANCH_SWITCHING_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case AUTH_ACTIONS.BRANCH_SWITCHING_SUCCESS:
      return {
        ...state,
        loading: false,
        selectedBranch: action.payload,
        needsBranchSelection: false,
        error: null
      };
    
    case AUTH_ACTIONS.BRANCH_SWITCHING_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
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
    
    case AUTH_ACTIONS.LOGOUT:
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
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    default:
      console.warn(`Unhandled action type: ${action.type}`);
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

// Role permissions configuration - moved outside component for better performance
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

// Custom hook for localStorage operations
const useSecureStorage = () => {
  const setItem = useCallback((key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }, []);

  const getItem = useCallback((key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  }, []);

  const removeItem = useCallback((key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }, []);

  return { setItem, getItem, removeItem };
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { setItem, getItem, removeItem } = useSecureStorage();
  
  // Refs to prevent duplicate operations
  const branchSelectionRef = useRef(false);
  const initializingRef = useRef(false);
  const authStateChangeRef = useRef(null);

  // Check Supabase session on mount
  useEffect(() => {
    if (initializingRef.current) return;
    checkSupabaseSession();
  }, []);

  // Auth state change listener
  useEffect(() => {
    if (authStateChangeRef.current) {
      authStateChangeRef.current.unsubscribe();
    }

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

    authStateChangeRef.current = subscription;

    return () => {
      if (authStateChangeRef.current) {
        authStateChangeRef.current.unsubscribe();
      }
    };
  }, []);

  const checkSupabaseSession = useCallback(async () => {
    if (initializingRef.current) return;
    
    try {
      initializingRef.current = true;
      console.log('🔍 Checking Supabase session...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        throw error;
      }
      
      if (session?.user) {
        console.log('👤 Found active session for:', session.user.email);
        await handleAuthUser(session.user);
      } else {
        console.log('📭 No active session found');
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    } catch (error) {
      console.error('Error checking session:', error);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    } finally {
      initializingRef.current = false;
    }
  }, []);

  const handleAuthUser = useCallback(async (authUser) => {
    try {
      console.log('🔄 Processing authenticated user:', authUser.email);
      
      // Fetch user profile
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
      
      // Get permissions based on role
      const permissions = ROLE_PERMISSIONS[userProfile.role] || {};
      
      // Check for saved branch
      let selectedBranch = null;
      const savedBranch = getItem('hotel_selected_branch');
      
      if (savedBranch) {
        try {
          // Verify branch still exists
          const { data: validBranch } = await db.getBranchById(savedBranch.id);
          if (validBranch) {
            selectedBranch = validBranch;
            console.log('✅ Restored saved branch:', selectedBranch.name);
          } else {
            removeItem('hotel_selected_branch');
          }
        } catch (error) {
          console.warn('Error restoring saved branch:', error);
          removeItem('hotel_selected_branch');
        }
      }
      
      // For admins, load default branch if none saved
      if (userProfile.role === 'admin' && !selectedBranch) {
        try {
          const { data: userBranches } = await db.getUserBranches(authUser.id);
          const defaultBranch = userBranches?.find(b => b.isDefault) || userBranches?.[0];
          if (defaultBranch) {
            selectedBranch = defaultBranch;
            setItem('hotel_selected_branch', defaultBranch);
            console.log('🏢 Set default branch for admin:', defaultBranch.name);
          }
        } catch (error) {
          console.warn('Error loading admin branches:', error);
        }
      }
      
      // For reception, load assigned branch
      if (userProfile.role === 'reception' && !selectedBranch) {
        try {
          const { data: userBranches } = await db.getUserBranches(authUser.id);
          const assignedBranch = userBranches?.[0];
          if (assignedBranch) {
            selectedBranch = assignedBranch;
            setItem('hotel_selected_branch', assignedBranch);
            console.log('🏢 Set assigned branch for reception:', assignedBranch.name);
          }
        } catch (error) {
          console.warn('Error loading reception branch:', error);
        }
      }
      
      const needsBranchSelection = userProfile.role === 'admin' && !selectedBranch;
      
      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authUser.id);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
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
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message
      });
    }
  }, [getItem, setItem, removeItem]);

  const login = useCallback(async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      console.log('🔐 Attempting Supabase login for:', email);
      
      // Validate input
      if (!email || !password) {
        throw new Error('Email y contraseña son requeridos');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }
      
      if (!data.user) {
        throw new Error('No se recibieron datos del usuario');
      }

      console.log('✅ Supabase login successful for:', data.user.email);
      
      // handleAuthUser will be called automatically by the listener
      return { success: true };
      
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message
      });
      return { success: false, error: error.message };
    }
  }, []);

  const selectBranch = useCallback(async (branch) => {
    console.log('🏢 AuthContext.selectBranch called for:', branch.name);
    
    // Validation
    if (!branch || !branch.id) {
      console.error('❌ Invalid branch data');
      return { success: false, error: 'Datos de sucursal inválidos' };
    }

    // If same branch already selected, skip
    if (state.selectedBranch?.id === branch.id) {
      console.log('✅ Branch already selected, skipping...');
      return { success: true };
    }

    console.log(`🔄 Switching from ${state.selectedBranch?.name || 'none'} to ${branch.name}`);
    
    try {
      dispatch({ type: AUTH_ACTIONS.BRANCH_SWITCHING_START });
      
      // Validate branch exists
      const { data: validBranch, error } = await db.getBranchById(branch.id);
      if (error || !validBranch) {
        throw new Error('Sucursal no válida o no encontrada');
      }

      console.log('✅ Branch validated:', validBranch.name);
      
      // Prepare branch data
      const branchToSave = {
        ...validBranch,
        selectedAt: new Date().toISOString()
      };
      
      // Save to localStorage
      setItem('hotel_selected_branch', branchToSave);
      console.log('💾 Branch saved to localStorage');
      
      // Update context state
      dispatch({
        type: AUTH_ACTIONS.BRANCH_SWITCHING_SUCCESS,
        payload: branchToSave
      });

      console.log('🎉 Branch selection completed successfully:', branchToSave.name);
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Branch selection failed:', error.message);
      dispatch({ 
        type: AUTH_ACTIONS.BRANCH_SWITCHING_ERROR, 
        payload: error.message 
      });
      return { success: false, error: error.message };
    }
  }, [state.selectedBranch, setItem]);

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
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Error during Supabase logout:', error);
    }
    
    handleLogout();
  }, []);

  const handleLogout = useCallback(() => {
    // Clear localStorage
    removeItem('hotel_selected_branch');
    
    // Reset refs
    branchSelectionRef.current = false;
    initializingRef.current = false;
    
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  }, [removeItem]);

  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
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

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
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
  }), [
    state,
    login,
    logout,
    clearError,
    selectBranch,
    changeBranch,
    getAvailableBranches,
    canChangeBranch,
    hasPermission,
    hasRole,
    getAllowedRoutes,
    isReady
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
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