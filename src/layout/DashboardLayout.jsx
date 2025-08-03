// src/layouts/DashboardLayout.jsx - LAYOUT CON INTEGRACIÓN DE SUCURSALES
import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  Building2, 
  BarChart3, 
  Users, 
  Bed, 
  Package, 
  FileText, 
  Settings,
  LogOut,
  Calendar,
  UserCheck
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../hooks/useBranch';
import BranchSwitcher from '../components/common/BranchSwitcher';
import Button from '../components/common/Button';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, hasPermission } = useAuth();
  const { branchDisplayName } = useBranch();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Configuración de navegación basada en permisos
  const getNavigationItems = () => {
    const items = [
      {
        name: 'Dashboard',
        href: '/',
        icon: BarChart3,
        show: true
      }
    ];

    // Solo para recepción
    if (hasPermission('reservations')) {
      items.push(
        {
          name: 'Reservas',
          href: '/reservations',
          icon: Calendar,
          show: true
        },
        {
          name: 'Check-in',
          href: '/checkin',
          icon: UserCheck,
          show: true
        }
      );
    }

    // Para todos los roles con permisos
    if (hasPermission('guests')) {
      items.push({
        name: 'Huéspedes',
        href: '/guests',
        icon: Users,
        show: true
      });
    }

    if (hasPermission('rooms')) {
      items.push({
        name: 'Habitaciones',
        href: '/rooms',
        icon: Bed,
        show: true
      });
    }

    if (hasPermission('supplies')) {
      items.push({
        name: 'Inventario',
        href: '/supplies',
        icon: Package,
        show: true
      });
    }

    if (hasPermission('reports')) {
      items.push({
        name: 'Reportes',
        href: '/reports',
        icon: FileText,
        show: true
      });
    }

    // Solo para administradores
    if (user?.role === 'admin') {
      items.push({
        name: 'Sucursales',
        href: '/branches',
        icon: Building2,
        show: true
      });
    }

    if (hasPermission('settings')) {
      items.push({
        name: 'Configuración',
        href: '/settings',
        icon: Settings,
        show: true
      });
    }

    return items.filter(item => item.show);
  };

  const navigationItems = getNavigationItems();

  const isActiveRoute = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Hotel Paraíso</h1>
                {branchDisplayName && (
                  <p className="text-xs text-gray-600">{branchDisplayName}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActiveRoute(item.href)
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              icon={LogOut}
              onClick={handleLogout}
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {getPageTitle(location.pathname)}
                  </h2>
                </div>
              </div>

              {/* Branch Switcher */}
              <BranchSwitcher />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

// Helper function to get page title
const getPageTitle = (pathname) => {
  const titles = {
    '/': 'Dashboard',
    '/reservations': 'Reservas',
    '/checkin': 'Check-in',
    '/guests': 'Huéspedes',
    '/rooms': 'Habitaciones',
    '/supplies': 'Inventario',
    '/reports': 'Reportes',
    '/branches': 'Gestión de Sucursales',
    '/settings': 'Configuración'
  };

  // Check for exact match first
  if (titles[pathname]) {
    return titles[pathname];
  }

  // Check for partial matches
  for (const [path, title] of Object.entries(titles)) {
    if (pathname.startsWith(path) && path !== '/') {
      return title;
    }
  }

  return 'Hotel Paraíso';
};

export default DashboardLayout;