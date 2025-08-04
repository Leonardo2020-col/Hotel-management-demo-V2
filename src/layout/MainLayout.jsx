// src/layout/MainLayout.jsx - CORREGIDO SIN window.location
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { isAuthenticated, loading, isReady, selectedBranch, user } = useAuth();
  const navigate = useNavigate();

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // En móvil, cerrar sidebar por defecto
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, el ProtectedRoute se encargará de redirigir
  if (!isAuthenticated) {
    return null;
  }

  // Si no está listo (necesita selección de sucursal), el ProtectedRoute manejará esto
  if (!isReady()) {
    return null;
  }

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // 🔧 FUNCIÓN CORREGIDA SIN window.location
  const handleBranchSelectorClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔄 Navigating to branch selection via React Router');
    navigate('/select-branch');
  };

  return (
    <div className="flex bg-gray-100 min-h-screen relative">
      {/* Overlay para móvil cuando el sidebar está abierto */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleSidebarToggle}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen} 
        onToggle={handleSidebarToggle}
        isMobile={isMobile}
      />
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        !isMobile && sidebarOpen ? 'ml-0' : 'ml-0'
      }`}>
        {/* Header */}
        <Header 
          onMenuClick={handleSidebarToggle}
          sidebarOpen={sidebarOpen}
        />
        
        {/* Branch Info Bar (solo para administradores) */}
        {user?.role === 'admin' && selectedBranch && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 sm:px-6 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">
                  Administrando:
                </span>
                <span className="text-sm text-blue-700">
                  {selectedBranch.name}
                </span>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  {selectedBranch.location}
                </span>
              </div>
              
              {/* 🔧 BOTÓN CORREGIDO SIN window.location */}
              <button
                type="button"
                onClick={handleBranchSelectorClick}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                Cambiar sucursal
              </button>
            </div>
          </div>
        )}
        
        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-4 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <span>© 2024 Hotel Paraíso - Sistema de Gestión</span>
                {selectedBranch && (
                  <>
                    <span>•</span>
                    <span>{selectedBranch.name}</span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                <span>Versión Demo</span>
                <span>•</span>
                <span>Desarrollado para demostración</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;