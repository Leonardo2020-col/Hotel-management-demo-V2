// src/components/layout/Layout.jsx
import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Hotel,
  Home,
  ClipboardCheck,
  Calendar,
  Users,
  Bed,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Bell,
  Search
} from 'lucide-react'
import classNames from 'classnames'

const Layout = ({ children }) => {
  const { userName, userRole, logout, isAdmin, getPrimaryBranch } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  const primaryBranch = getPrimaryBranch()

  // Menú de navegación
  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Check-in Rápido',
      href: '/checkin',
      icon: ClipboardCheck,
      current: location.pathname === '/checkin',
      badge: 3 // Ejemplo de badge
    },
    {
      name: 'Reservaciones',
      href: '/reservations',
      icon: Calendar,
      current: location.pathname === '/reservations',
      badge: 8
    },
    {
      name: 'Huéspedes',
      href: '/guests',
      icon: Users,
      current: location.pathname === '/guests'
    },
    {
      name: 'Habitaciones',
      href: '/rooms',
      icon: Bed,
      current: location.pathname === '/rooms'
    },
    {
      name: 'Suministros',
      href: '/supplies',
      icon: Package,
      current: location.pathname === '/supplies',
      alert: true // Indicador de alerta
    },
    {
      name: 'Reportes',
      href: '/reports',
      icon: BarChart3,
      current: location.pathname === '/reports'
    }
  ]

  // Menú de administrador (solo visible para admins)
  const adminNavigation = [
    {
      name: 'Panel de Admin',
      href: '/admin',
      icon: Settings,
      current: location.pathname === '/admin'
    },
    {
      name: 'Configuración',
      href: '/settings',
      icon: Settings,
      current: location.pathname === '/settings'
    }
  ]

  const handleLogout = async () => {
    const result = await logout()
    if (result.success) {
      navigate('/login', { replace: true })
    }
  }

  const handleNavigation = (href) => {
    navigate(href)
    setSidebarOpen(false) // Cerrar sidebar en móvil
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar para móvil */}
      <div className={classNames(
        "fixed inset-0 flex z-40 md:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent 
            navigation={navigation}
            adminNavigation={adminNavigation}
            isAdmin={isAdmin}
            onNavigate={handleNavigation}
            primaryBranch={primaryBranch}
          />
        </div>
      </div>

      {/* Sidebar para desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent 
            navigation={navigation}
            adminNavigation={adminNavigation}
            isAdmin={isAdmin}
            onNavigate={handleNavigation}
            primaryBranch={primaryBranch}
          />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header superior */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          {/* Botón menú móvil */}
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 px-4 flex justify-between">
            {/* Barra de búsqueda (opcional) */}
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm"
                    placeholder="Buscar..."
                    type="search"
                  />
                </div>
              </div>
            </div>

            {/* Perfil de usuario */}
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notificaciones */}
              <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <Bell className="h-6 w-6" />
              </button>

              {/* Dropdown de perfil */}
              <div className="ml-3 relative">
                <div>
                  <button
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  >
                    <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <span className="ml-3 text-gray-700 text-sm font-medium">{userName}</span>
                    <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {profileDropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <p className="font-medium">{userName}</p>
                      <p className="text-gray-500">{userRole}</p>
                      {primaryBranch && (
                        <p className="text-xs text-gray-400">{primaryBranch.name}</p>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2 inline" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido de la página */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}

// Componente del contenido del sidebar
const SidebarContent = ({ navigation, adminNavigation, isAdmin, onNavigate, primaryBranch }) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo y título */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-indigo-600">
        <Hotel className="h-8 w-8 text-white" />
        <span className="ml-2 text-xl font-semibold text-white">Hotel System</span>
      </div>

      {/* Información de la sucursal */}
      {primaryBranch && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-900">{primaryBranch.name}</p>
          <p className="text-xs text-gray-500">Sucursal actual</p>
        </div>
      )}

      {/* Navegación principal */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.name}
                onClick={() => onNavigate(item.href)}
                className={classNames(
                  item.current
                    ? 'bg-indigo-100 text-indigo-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center justify-between w-full px-2 py-2 text-sm font-medium rounded-md transition-colors'
                )}
              >
                <div className="flex items-center">
                  <Icon
                    className={classNames(
                      item.current ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 h-5 w-5'
                    )}
                  />
                  {item.name}
                </div>
                
                {/* Badge o alerta */}
                <div className="flex items-center">
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                  {item.alert && (
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Sección de administrador */}
        {isAdmin() && (
          <div className="mt-8">
            <div className="px-2 py-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administración
              </h3>
            </div>
            <div className="space-y-1">
              {adminNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.name}
                    onClick={() => onNavigate(item.href)}
                    className={classNames(
                      item.current
                        ? 'bg-indigo-100 text-indigo-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors'
                    )}
                  >
                    <Icon
                      className={classNames(
                        item.current ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 h-5 w-5'
                      )}
                    />
                    {item.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer del sidebar */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>Sistema de Hotel v1.0</p>
          <p>© 2024 Hotel System</p>
        </div>
      </div>
    </div>
  )
}

export default Layout