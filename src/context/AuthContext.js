// src/context/AuthContext.js - VERSIÓN SIMPLIFICADA Y FUNCIONAL
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Mock users para demo
const DEMO_USERS = {
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

// Permisos por rol
const ROLE_PERMISSIONS = {
  admin: {
    dashboard: true,
    guests: true,
    rooms: true,
    supplies: true,
    reports: true,
    settings: true,
    checkin: false,
    reservations: false
  },
  reception: {
    dashboard: true,
    guests: true,
    rooms: true,
    supplies: false,
    reports: false,
    settings: false,
    checkin: true,
    reservations: true
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar sesión guardada al cargar
  useEffect(() => {
    const savedUser = localStorage.getItem('hotel_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('hotel_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 800));

      const user = DEMO_USERS[email];
      if (!user || user.password !== password) {
        throw new Error('Credenciales incorrectas');
      }

      const { password: _, ...userWithoutPassword } = user;
      setUser(userWithoutPassword);
      localStorage.setItem('hotel_user', JSON.stringify(userWithoutPassword));

      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hotel_user');
  };

  const hasPermission = (permission) => {
    if (!user?.role) return false;
    return ROLE_PERMISSIONS[user.role]?.[permission] || false;
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    hasPermission,
    clearError: () => setError(null)
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
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};