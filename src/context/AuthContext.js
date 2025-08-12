// src/context/AuthContext.js - VERSIÓN CORREGIDA CON useMemo IMPORTADO
import React, { 
  createContext, 
  useContext, 
  useReducer, 
  useEffect, 
  useCallback, 
  useRef,
  useMemo // ← AGREGAR ESTA IMPORTACIÓN
} from 'react';
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

  // Check for existing auth session on mount
  useEffect(() => {
    if (initializingRef.current) return;
    checkAuthSession();
  }, []);

  const checkAuthSession = useCallback(async () => {
    if (initializingRef.current) return;
    
    try {
      initializingRef.current = true;
      console.log('🔍 Checking auth session...');
      
      // Simple session check without Supabase for now
      const savedUser = getItem('hotel_user_data');
      const savedBranch = getItem('hotel_selected_branch');
      
      if (savedUser) {
        console.log('👤 Found saved user session:', savedUser.email);
        
        const permissions = ROLE_PERMISSIONS[savedUser.role] || {};
        const needsBranchSelection = savedUser.role === 'admin' && !savedBranch;
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: savedUser,
            permissions,
            selectedBranch: savedBranch,
            needsBranchSelection
          }
        });
      } else {
        console.log('📭 No saved session found');
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    } catch (error) {
      console.error('Error checking session:', error);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    } finally {
      initializingRef.current = false;
    }
  }, [getItem]);

  // Mock login function for demo
  const login = useCallback(async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      console.log('🔐 Attempting login for:', email);
      
      // Validate input
      if (!email || !password) {
        throw new Error('Email y contraseña son requeridos');
      }

      // Mock user data for demo
      const mockUsers = {
        'admin@hotelparaiso.com': {
          id: 1,
          email: 'admin@hotelparaiso.com',
          name: 'Administrador del Sistema',
          role: 'admin',
          password: 'admin123'
        },
        'recepcion@hotelparaiso.com': {
          id: 2,
          email: 'recepcion@hotelparaiso.com',
          name: 'Personal de Recepción',
          role: 'reception',
          password: 'recepcion123'
        }
      };

      const user = mockUsers[email];
      if (!user || user.password !== password) {
        throw new Error('Credenciales incorrectas');
      }

      const { password: _, ...userWithoutPassword } = user;
      const permissions = ROLE_PERMISSIONS[user.role] || {};
      
      // For reception, auto-assign branch
      let selectedBranch = null;
      let needsBranchSelection = false;
      
      if (user.role === 'reception') {
        selectedBranch = { 
          id: 1, 
          name: 'Sucursal Principal', 
          location: 'Lima Centro',
          code: 'MAIN' 
        };
        setItem('hotel_selected_branch', selectedBranch);
      } else if (user.role === 'admin') {
        needsBranchSelection = true;
      }

      // Save user data
      setItem('hotel_user_data', userWithoutPassword);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: userWithoutPassword,
          permissions,
          selectedBranch,
          needsBranchSelection
        }
      });

      console.log('✅ Login successful for:', user.email);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message
      });
      return { success: false, error: error.message };
    }
  }, [setItem]);

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
      
      // Prepare branch data
      const branchToSave = {
        ...branch,
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

  const logout = useCallback(async () => {
    console.log('👋 Logging out user');
    
    // Clear localStorage
    removeItem('hotel_user_data');
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

  const isReady = useCallback(() => {
    if (!state.isAuthenticated) return false;
    if (state.user?.role === 'admin') {
      return !state.needsBranchSelection && state.selectedBranch;
    }
    return true;
  }, [state.isAuthenticated, state.user?.role, state.needsBranchSelection, state.selectedBranch]);

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
    hasPermission,
    hasRole,
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