// src/components/common/Sidebar.jsx - ACTUALIZADO CON SEPARACIÓN CLARA - COMPLETO
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Users, 
  Bed, 
  Package,
  BarChart3, 
  Settings,
  Hotel,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Lock,
  AlertTriangle,
  BookOpen,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ open, onToggle, isMobile }) => {
  const location = useLocation();
  const { hasPermission, user } = useAuth();

  const menuItems = [
    { 
      path: '/checkin',
      icon: UserCheck, 
      label: 'Recepción', // ✅ Actualizado
      description: 'Check-in rápido walk-in',
      permission: 'checkin',
      badge: 'Walk-in',
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    { 
      path: '/dashboard', 
      icon: Home, 
      label: 'Dashboard',
      description: 'Vista general',
      permission: 'dashboard'
    },
    { 
      path: '/reservations', 
      icon: Calendar, 
      label: 'Reservaciones', // ✅ Actualizado
      description: 'Reservas planificadas',
      permission: 'reservations',
      badge: 'Reservas',
      badgeColor: 'bg-green-100 text-green-800'
    },
    { 
      path: '/guests', 
      icon: Users, 
      label: 'Huéspedes',
      description: 'Base de datos',
      permission: 'guests'
    },
    { 
      path: '/rooms', 
      icon: Bed, 
      label: 'Habitaciones',
      description: 'Gestión de inventario',
      permission: 'rooms'
    },
    { 
      path: '/supplies', 
      icon: Package, 
      label: 'Insumos',
      description: 'Inventario y consumo',
      permission: 'supplies'
    },
    { 
      path: '/reports', 
      icon: BarChart3, 
      label: 'Informes',
      description: 'Análisis y reportes',
      permission: 'reports'
    }
  ];

  const secondaryItems = [
    { 
      path: '/settings', 
      icon: Settings, 
      label: 'Configuración',
      description: 'Ajustes del sistema',
      permission: 'settings'
    }
  ];

  // ✅ Función para determinar si un item está activo
  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // ✅ Filtrar elementos según permisos
  const visibleItems = menuItems.filter(item => 
    !item.permission || hasPermission(item.permission, 'read')
  );

  const visibleSecondaryItems = secondaryItems.filter(item => 
    !item.permission || hasPermission(item.permission, 'read')
  );

  // ✅ Componente MenuItem actualizado
  const MenuItem = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    const hasAccess = hasPermission(item.permission);
    
    // Si no tiene acceso, mostrar como deshabilitado
    if (!hasAccess) {
      return (
        <div className="flex items-center px-3 py-2 mx-2 rounded-lg text-gray-400 cursor-not-allowed opacity-50">
          <Icon className="w-5 h-5 flex-shrink-0" />
          <div className="ml-3 flex-1 flex items-center justify-between">
            <div>
              <span className="font-medium text-sm">{item.label}</span>
              <p className="text-xs opacity-75 mt-0.5">Sin acceso</p>
            </div>
            <Lock size={12} className="text-gray-400" />
          </div>
        </div>
      );
    }

    return (
      <NavLink
        to={item.path}
        className={`
          flex items-center px-3 py-2 mx-2 rounded-lg text-sm font-medium transition-colors
          ${active
            ? 'bg-blue-100 text-blue-700 border border-blue-200'
            : 'text-gray-700 hover:bg-gray-100'
          }
        `}
        onClick={() => {
          // Cerrar sidebar en móvil al hacer clic en un enlace
          if (isMobile) {
            onToggle();
          }
        }}
      >
        <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
        <div className="ml-3 flex-1 flex items-center justify-between">
          <div>
            <span className="font-medium">{item.label}</span>
            {!active && (
              <p className="text-xs opacity-75 mt-0.5">{item.description}</p>
            )}
          </div>
          
          {/* ✅ Badges para diferenciar sistemas */}
          {item.badge && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              active ? 'bg-white bg-opacity-20 text-blue-700' : item.badgeColor
            }`}>
              {item.badge}
            </span>
          )}
        </div>
      </NavLink>
    );
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`
        bg-gray-900 shadow-xl transition-all duration-300 flex flex-col
        ${isMobile 
          ? `fixed inset-y-0 left-0 z-50 w-64 transform ${open ? 'translate-x-0' : '-translate-x-full'}`
          : `${open ? 'w-64' : 'w-16'} relative`
        }
      `}>
        {/* Header del Sidebar */}
        <div className={`p-3 sm:p-4 border-b border-gray-700 ${isMobile ? 'pt-2' : ''}`}>
          <div className="flex items-center justify-between">
            {(open || isMobile) && (
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Hotel className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6'} text-white`} />
                </div>
                <div>
                  <h1 className={`text-white font-bold ${isMobile ? 'text-xl' : 'text-lg'}`}>
                    Hotel Paraíso
                  </h1>
                  <p className={`text-gray-400 ${isMobile ? 'text-sm' : 'text-xs'}`}>
                    Sistema de Gestión
                  </p>
                </div>
              </div>
            )}
            {!open && !isMobile && (
              <div className="p-2 bg-blue-600 rounded-lg mx-auto">
                <Hotel className="w-6 h-6 text-white" />
              </div>
            )}
            
            {/* Botón de cerrar para móvil */}
            {isMobile && (
              <button
                onClick={onToggle}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* User Info */}
        {(open || isMobile) && user && (
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{user.name || 'Usuario'}</p>
                <p className="text-gray-400 text-xs capitalize">
                  {user.role === 'admin' ? 'Administrador' : 'Recepción'}
                </p>
              </div>
            </div>

            {/* ✅ Información del sistema dual */}
            <div className="mt-3 p-2 bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle size={12} className="text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-400">Sistema Dual</span>
              </div>
              <div className="space-y-1 text-xs text-gray-300">
                <div className="flex items-center space-x-2">
                  <UserCheck size={10} />
                  <span><strong>Recepción:</strong> Walk-ins</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar size={10} />
                  <span><strong>Reservaciones:</strong> Planificadas</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navegación */}
        <nav className="flex-1 py-2 sm:py-4 overflow-y-auto">
          <div className="space-y-1">
            {visibleItems.map((item) => (
              <MenuItem key={item.path} item={item} />
            ))}
          </div>

          {/* Divider */}
          <div className="mx-4 my-4 border-t border-gray-700"></div>

          {/* Secondary Items */}
          <div className="space-y-1">
            {visibleSecondaryItems.map((item) => (
              <MenuItem key={item.path} item={item} />
            ))}
          </div>
        </nav>

        {/* Toggle Button - Solo en desktop */}
        {!isMobile && (
          <div className="p-4 border-t border-gray-700">
            {/* ✅ Ayuda rápida cuando está expandido */}
            {open && (
              <div className="mb-3 p-2 bg-gray-800 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-300 mb-2 flex items-center">
                  <BookOpen size={12} className="mr-2" />
                  Ayuda Rápida
                </h4>
                <div className="space-y-1 text-xs text-gray-400">
                  <div>• <strong>Sin reserva:</strong> "Recepción"</div>
                  <div>• <strong>Nueva reserva:</strong> "Reservaciones"</div>
                  <div>• <strong>Con reserva:</strong> "Reservaciones"</div>
                </div>
              </div>
            )}
            
            <button
              onClick={onToggle}
              className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              {open ? (
                <ChevronLeft size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;