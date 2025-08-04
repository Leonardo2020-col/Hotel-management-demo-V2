// src/context/AuthContext.js - VERSIÓN OPTIMIZADA ANTI-REFRESH
import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { db } from '../lib/supabase';

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

// Datos de usuarios mock
const MOCK_USERS = [
  {
    id: 1,
    email: 'admin@hotelparaiso.com',
    password: 'admin123',
    name: 'Administrador',
    role: 'admin',
    avatar: null,
    requiresBranchSelection: true,
    permissions: {
      dashboard: { read: true, write: true },
      checkin: { read: false, write: false },
      reservations: { read: false, write: false },
      guests: { read: true, write: true },
      rooms: { read: true, write: true },
      supplies: { read: true, write: true },
      reports: { read: true, write: true },
      settings: { read: true, write: true }
    }
  },
  {
    id: 2,
    email: 'recepcion@hotelparaiso.com',
    password: 'recepcion123',
    name: 'Personal de Recepción',
    role: 'reception',
    avatar: null,
    requiresBranchSelection: false,
    permissions: {
      dashboard: { read: true, write: false },
      checkin: { read: true, write: true },
      reservations: { read: true, write: true },
      guests: { read: true, write: true },
      rooms: { read: true, write: true },
      supplies: { read: true, write: false },
      reports: { read: true, write: false },
      settings: { read: false, write: false }
    }
  }
];

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Referencias para evitar operaciones duplicadas
  const branchSelectionRef = useRef(false);
  const initializingRef = useRef(false);

  // Verificar si hay sesión guardada al cargar la app
  useEffect(() => {
    if (initializingRef.current) return;
    checkSavedSession();
  }, []);

  const checkSavedSession = useCallback(async () => {
    if (initializingRef.current) return;
    
    try {
      initializingRef.current = true;
      console.log('🔍 Checking saved session...');
      
      const savedUser = localStorage.getItem('hotel_user');
      const savedPermissions = localStorage.getItem('hotel_permissions');
      const savedBranch = localStorage.getItem('hotel_selected_branch');
      
      if (savedUser && savedPermissions) {
        const user = JSON.parse(savedUser);
        const permissions = JSON.parse(savedPermissions);
        let selectedBranch = savedBranch ? JSON.parse(savedBranch) : null;
        
        console.log('👤 Found saved user:', user.name, user.role);
        
        // Verificar que la sucursal guardada aún existe en Supabase
        if (selectedBranch) {
          try {
            const { data: branchExists } = await db.getBranchById(selectedBranch.id);
            if (!branchExists) {
              console.log('⚠️ Saved branch no longer exists, clearing...');
              selectedBranch = null;
              localStorage.removeItem('hotel_selected_branch');
            } else {
              console.log('✅ Saved branch verified:', selectedBranch.name);
            }
          } catch (error) {
            console.warn('Error verifying saved branch:', error);
            selectedBranch = null;
            localStorage.removeItem('hotel_selected_branch');
          }
        }
        
        // Para usuarios de recepción, obtener su sucursal por defecto
        if (user.role === 'reception' && !selectedBranch) {
          try {
            const { data: userBranches } = await db.getUserBranches(user.id);
            const defaultBranch = userBranches?.find(b => b.isDefault) || userBranches?.[0];
            if (defaultBranch) {
              selectedBranch = defaultBranch;
              localStorage.setItem('hotel_selected_branch', JSON.stringify(defaultBranch));
              console.log('🏢 Set default branch for reception user:', defaultBranch.name);
            }
          } catch (error) {
            console.warn('Error loading user branches:', error);
          }
        }
        
        // Verificar si el administrador necesita seleccionar sucursal
        const needsBranchSelection = user.role === 'admin' && !selectedBranch;
        
        console.log('🏗️ Restoring session:', {
          user: user.name,
          role: user.role,
          selectedBranch: selectedBranch?.name || 'none',
          needsBranchSelection
        });
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { 
            user, 
            permissions,
            selectedBranch,
            needsBranchSelection
          }
        });
      } else {
        console.log('📭 No saved session found');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Error checking saved session:', error);
      localStorage.removeItem('hotel_user');
      localStorage.removeItem('hotel_permissions');
      localStorage.removeItem('hotel_selected_branch');
      dispatch({ type: 'SET_LOADING', payload: false });
    } finally {
      initializingRef.current = false;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      console.log('🔐 Attempting login for:', email);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));

      const user = MOCK_USERS.find(u => u.email === email && u.password === password);

      if (!user) {
        throw new Error('Credenciales incorrectas');
      }

      const { password: _, ...userWithoutPassword } = user;
      const { permissions } = user;

      console.log('✅ User authenticated:', userWithoutPassword.name, userWithoutPassword.role);

      // Guardar datos básicos
      localStorage.setItem('hotel_user', JSON.stringify(userWithoutPassword));
      localStorage.setItem('hotel_permissions', JSON.stringify(permissions));

      // Manejar selección de sucursal basada en Supabase
      if (user.requiresBranchSelection) {
        console.log('🏢 Admin user - requires branch selection');
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: userWithoutPassword,
            permissions,
            needsBranchSelection: true
          }
        });
      } else {
        console.log('👥 Reception user - loading assigned branch');
        try {
          const { data: userBranches } = await db.getUserBranches(user.id);
          const defaultBranch = userBranches?.find(b => b.isDefault) || userBranches?.[0];
          
          if (defaultBranch) {
            localStorage.setItem('hotel_selected_branch', JSON.stringify(defaultBranch));
            console.log('🏢 Set default branch:', defaultBranch.name);
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: userWithoutPassword,
                permissions,
                selectedBranch: defaultBranch,
                needsBranchSelection: false
              }
            });
          } else {
            console.log('⚠️ No branches assigned to reception user');
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: userWithoutPassword,
                permissions,
                needsBranchSelection: true
              }
            });
          }
        } catch (error) {
          console.error('Error loading user branches:', error);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: userWithoutPassword,
              permissions,
              needsBranchSelection: true
            }
          });
        }
      }

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

  // 🔧 FUNCIÓN SELECTBRANCH OPTIMIZADA ANTI-REFRESH
  const selectBranch = useCallback(async (branch) => {
    if (branchSelectionRef.current) {
      console.log('❌ Branch selection already in progress');
      return { success: false, error: 'Selección de sucursal ya en progreso' };
    }

    console.log('🏢 AuthContext.selectBranch called for:', branch.name);
    
    dispatch({ type: 'BRANCH_SWITCHING_START' });
    branchSelectionRef.current = true;
    
    try {
      // Validar que la sucursal existe en Supabase
      const { data: validBranch, error } = await db.getBranchById(branch.id);
      if (error || !validBranch) {
        throw new Error('Sucursal no válida o no encontrada');
      }

      console.log('✅ Branch validated:', validBranch.name);
      
      // Simular delay para configuración de sucursal (pero menor para evitar timeouts)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Guardar sucursal seleccionada con información completa de Supabase
      const branchToSave = {
        ...validBranch,
        selectedAt: new Date().toISOString()
      };
      
      // Guardar de forma síncrona
      try {
        localStorage.setItem('hotel_selected_branch', JSON.stringify(branchToSave));
        console.log('💾 Branch saved to localStorage');
      } catch (storageError) {
        console.warn('Warning: Could not save to localStorage:', storageError);
        // Continuar aunque falle el localStorage
      }
      
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
      // Liberar el lock después de un breve delay
      setTimeout(() => {
        branchSelectionRef.current = false;
        console.log('🔓 Branch selection lock released');
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

  const logout = useCallback(() => {
    console.log('👋 Logging out user');
    
    // Limpiar localStorage
    try {
      localStorage.removeItem('hotel_user');
      localStorage.removeItem('hotel_permissions');
      localStorage.removeItem('hotel_selected_branch');
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
    }
    
    // Limpiar referencias
    branchSelectionRef.current = false;
    initializingRef.current = false;
    
    dispatch({ type: 'LOGOUT' });
  }, []);

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

  const getBranchInfo = useCallback(async () => {
    if (!state.selectedBranch) return null;
    
    try {
      const { data: branch, error } = await db.getBranchById(state.selectedBranch.id);
      if (error) throw error;
      return branch;
    } catch (error) {
      console.error('Error getting branch info:', error);
      return state.selectedBranch; // Fallback
    }
  }, [state.selectedBranch]);

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
    getBranchInfo,
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