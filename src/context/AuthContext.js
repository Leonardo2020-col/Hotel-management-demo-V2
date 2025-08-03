// src/context/AuthContext.js - COMPLETAMENTE CONECTADO A SUPABASE
import React, { createContext, useContext, useReducer, useEffect } from 'react';
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

// Datos de usuarios mock (mantenemos para demo, pero podrías cambiar a Supabase Auth)
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

  // Verificar si hay sesión guardada al cargar la app
  useEffect(() => {
    const checkSavedSession = async () => {
      try {
        const savedUser = localStorage.getItem('hotel_user');
        const savedPermissions = localStorage.getItem('hotel_permissions');
        const savedBranch = localStorage.getItem('hotel_selected_branch');
        
        if (savedUser && savedPermissions) {
          const user = JSON.parse(savedUser);
          const permissions = JSON.parse(savedPermissions);
          let selectedBranch = savedBranch ? JSON.parse(savedBranch) : null;
          
          // Verificar que la sucursal guardada aún existe en Supabase
          if (selectedBranch) {
            const { data: branchExists } = await db.getBranchById(selectedBranch.id);
            if (!branchExists) {
              selectedBranch = null;
              localStorage.removeItem('hotel_selected_branch');
            }
          }
          
          // Para usuarios de recepción, obtener su sucursal por defecto
          if (user.role === 'reception' && !selectedBranch) {
            const { data: userBranches } = await db.getUserBranches(user.id);
            const defaultBranch = userBranches?.find(b => b.isDefault) || userBranches?.[0];
            if (defaultBranch) {
              selectedBranch = defaultBranch;
              localStorage.setItem('hotel_selected_branch', JSON.stringify(defaultBranch));
            }
          }
          
          // Verificar si el administrador necesita seleccionar sucursal
          const needsBranchSelection = user.role === 'admin' && !selectedBranch;
          
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
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Error checking saved session:', error);
        localStorage.removeItem('hotel_user');
        localStorage.removeItem('hotel_permissions');
        localStorage.removeItem('hotel_selected_branch');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    const timer = setTimeout(checkSavedSession, 100);
    return () => clearTimeout(timer);
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const user = MOCK_USERS.find(u => u.email === email && u.password === password);

      if (!user) {
        throw new Error('Credenciales incorrectas');
      }

      const { password: _, ...userWithoutPassword } = user;
      const { permissions } = user;

      // Guardar datos básicos
      localStorage.setItem('hotel_user', JSON.stringify(userWithoutPassword));
      localStorage.setItem('hotel_permissions', JSON.stringify(permissions));

      // Manejar selección de sucursal basada en Supabase
      if (user.requiresBranchSelection) {
        // Administradores necesitan seleccionar sucursal
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: userWithoutPassword,
            permissions,
            needsBranchSelection: true
          }
        });
      } else {
        // Personal de recepción - obtener sucursal asignada desde Supabase
        try {
          const { data: userBranches } = await db.getUserBranches(user.id);
          const defaultBranch = userBranches?.find(b => b.isDefault) || userBranches?.[0];
          
          if (defaultBranch) {
            localStorage.setItem('hotel_selected_branch', JSON.stringify(defaultBranch));
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
            // Si no tiene sucursales asignadas, requerir asignación
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
          // Fallback: requerir selección de sucursal
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
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message
      });
      return { success: false, error: error.message };
    }
  };

  const selectBranch = async (branch) => {
    dispatch({ type: 'BRANCH_SWITCHING_START' });
    
    try {
      // Validar que la sucursal existe en Supabase
      const { data: validBranch, error } = await db.getBranchById(branch.id);
      if (error || !validBranch) {
        throw new Error('Sucursal no válida o no encontrada');
      }

      // Simular delay para configuración de sucursal
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Guardar sucursal seleccionada con información completa de Supabase
      const branchToSave = {
        ...validBranch,
        selectedAt: new Date().toISOString()
      };
      
      localStorage.setItem('hotel_selected_branch', JSON.stringify(branchToSave));
      
      dispatch({
        type: 'BRANCH_SWITCHING_SUCCESS',
        payload: branchToSave
      });

      return { success: true };
    } catch (error) {
      dispatch({ 
        type: 'BRANCH_SWITCHING_ERROR', 
        payload: error.message 
      });
      return { success: false, error: error.message };
    }
  };

  const changeBranch = async (branchId) => {
    try {
      const { data: branch, error } = await db.getBranchById(branchId);
      if (error || !branch) {
        return { success: false, error: 'Sucursal no encontrada' };
      }

      return await selectBranch(branch);
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('hotel_user');
    localStorage.removeItem('hotel_permissions');
    localStorage.removeItem('hotel_selected_branch');
    
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const hasPermission = (module, action = 'read') => {
    if (!state.permissions || !state.permissions[module]) {
      return false;
    }
    return state.permissions[module][action] === true;
  };

  const hasRole = (role) => {
    return state.user?.role === role;
  };

  const getAllowedRoutes = () => {
    if (!state.permissions) return [];

    const routes = [];
    
    Object.keys(state.permissions).forEach(module => {
      if (state.permissions[module].read) {
        routes.push(module);
      }
    });

    return routes;
  };

  const isReady = () => {
    if (!state.isAuthenticated) return false;
    if (state.user?.role === 'admin') {
      return !state.needsBranchSelection && state.selectedBranch;
    }
    return true;
  };

  const getBranchInfo = async () => {
    if (!state.selectedBranch) return null;
    
    try {
      const { data: branch, error } = await db.getBranchById(state.selectedBranch.id);
      if (error) throw error;
      return branch;
    } catch (error) {
      console.error('Error getting branch info:', error);
      return state.selectedBranch; // Fallback
    }
  };

  const getAvailableBranches = async () => {
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
  };

  const canChangeBranch = () => {
    return state.user?.role === 'admin';
  };

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