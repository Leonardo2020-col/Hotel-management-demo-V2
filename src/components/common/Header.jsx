// src/components/common/Header.jsx - CREAR ESTE ARCHIVO
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 17H9a4 4 0 01-4-4V9a4 4 0 014-4h2.586A1 1 0 0012 4.586l2.707 2.707A1 1 0 0115.293 8H15v9z" />
  </svg>
);

const Header = ({ onMenuClick }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Obtener el título de la página actual
  const getPageTitle = () => {
    const path = location.pathname;
    const titles = {
      '/': 'Dashboard',
      '/checkin': 'Check-in',
      '/reservations': 'Reservaciones',
      '/guests': 'Huéspedes',
      '/rooms': 'Habitaciones',
      '/supplies': 'Suministros',
      '/reports': 'Reportes',
      '/settings': 'Configuración'
    };

    return titles[path] || 'Hotel Paraíso';
  };

  // Obtener descripción de la página
  const getPageDescription = () => {
    const path = location.pathname;
    const descriptions = {
      '/': 'Vista general del sistema',
      '/checkin': 'Gestión de llegadas y salidas',
      '/reservations': 'Sistema de reservas',
      '/guests': 'Base de datos de huéspedes',
      '/rooms': 'Gestión de habitaciones',
      '/supplies': 'Inventario y suministros',
      '/reports': 'Informes y estadísticas',
      '/settings': 'Configuración del sistema'
    };

    return descriptions[path] || 'Sistema de gestión hotelera';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <MenuIcon />
            </button>
            
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {getPageTitle()}
              </h1>
              <p className="text-sm text-gray-600">
                {getPageDescription()}
              </p>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Quick stats for dashboard */}
            {location.pathname === '/' && (
              <div className="hidden md:flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <p className="text-gray-500">Ocupación</p>
                  <p className="font-semibold text-blue-600">78%</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Huéspedes</p>
                  <p className="font-semibold text-green-600">24</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Ingresos</p>
                  <p className="font-semibold text-purple-600">S/ 3,450</p>
                </div>
              </div>
            )}

            {/* User role badge */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                user?.role === 'admin' ? 'bg-blue-500' : 'bg-green-500'
              }`}></div>
              <span className="text-sm font-medium text-gray-700">
                {user?.role === 'admin' ? 'Administrador' : 'Recepción'}
              </span>
            </div>

            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg relative">
              <BellIcon />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </button>

            {/* User avatar */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;