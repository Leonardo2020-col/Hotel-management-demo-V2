// src/layout/Layout.jsx - VERSIÓN OPTIMIZADA
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
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

const Layout = ({ children }) => {
  const { userName, userRole, logout, isAdmin, getPrimaryBranch } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  
  // ✅ Refs para manejar clicks fuera del dropdown
  const profileDropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  const primaryBranch = getPrimaryBranch()

  // ✅ Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ✅ Cerrar sidebar cuando cambia la ruta
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Función para determinar si una ruta está activa
  const isCurrentPath = useCallback((path) => location.pathname === path, [location.pathname])

  // ✅ Configuración de navegación con mejor estructura
  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: isCurrentPath('/dashboard'),
      description: 'Vista general del hotel'
    },
    {
      name: 'Check-in Rápido',
      href: '/checkin',
      icon: ClipboardCheck,
      current: isCurrentPath('/checkin'),
      badge: 3,
      description: 'Registro rápido de huéspedes'
    },
    {
      name: 'Reservaciones',
      href: '/reservations',
      icon: Calendar,
      current: isCurrentPath('/reservations'),
      badge: 8,
      description: 'Gestión de reservas'
    },
    {
      name: 'Huéspedes',
      href: '/guests',
      icon: Users,
      current: isCurrentPath('/guests'),
      description: 'Base de datos de clientes'
    },
    {
      name: 'Habitaciones',
      href: '/rooms',
      icon: Bed,
      current: isCurrentPath('/rooms'),
      description: 'Estado y gestión de habitaciones'
    },
    {
      name: 'Suministros',
      href: '/supplies',
      icon: Package,
      current: isCurrentPath('/supplies'),
      alert: true,
      description: 'Inventario y stock'
    },
    {
      name: 'Reportes',
      href: '/reports',
      icon: BarChart3,
      current: isCurrentPath('/reports'),
      description: 'Análisis y estadísticas'
    }
  ]

  // Menú de administrador
  const adminNavigation = [
    {
      name: 'Panel de Admin',
      href: '/admin',
      icon: Settings,
      current: isCurrentPath('/admin'),
      description: 'Configuración del sistema'
    },
    {
      name: 'Configuración',
      href: '/settings',
      icon: Settings,
      current: isCurrentPath('/settings'),
      description: 'Ajustes generales'
    }
  ]

  // ✅ Mejorar manejo de logout con confirmación
  const handleLogout = useCallback(async () => {
    try {
      // ✅ Agregar confirmación para logout
      if (!window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        return
      }

      const result = await logout()
      if (result.success) {
        navigate('/login', { replace: true })
      }
    } catch (error) {
      console.error('Error al hacer logout:', error)
    }
  }, [logout, navigate])

  // ✅ Mejorar navegación
  const handleNavigation = useCallback((href) => {
    navigate(href)
    setSidebarOpen(false)
    setProfileDropdownOpen(false)
  }, [navigate])

  // ✅ Manejar búsqueda
  const handleSearch = useCallback((event) => {
    if (event.key === 'Enter') {
      const searchTerm = event.target.value.trim()
      if (searchTerm) {
        console.log('🔍 Búsqueda:', searchTerm)
        // TODO: Implementar funcionalidad de búsqueda
      }
    }
  }, [])

  // Función para combinar clases CSS
  const classNames = (...classes) => {
    return classes.filter(Boolean).join(' ')
  }

  // ✅ Componente optimizado para notificaciones
  const NotificationBell = React.memo(() => (
    <button 
      className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
      aria-label="Notificaciones"
    >
      <Bell className="h-6 w-6" />
    </button>
  ))

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* ✅ Overlay mejorado para móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar para móvil */}
      <div className={classNames(
        "fixed inset-0 flex z-50 md:hidden transition-transform transform",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
          {/* ✅ Botón de cerrar mejorado */}
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors"
              onClick={() => setSidebarOpen(false)}
              aria-label="Cerrar menú"
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
            classNames={classNames}
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
            classNames={classNames}
          />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header superior */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
          {/* Botón menú móvil */}
          <button
            className="px-4 border-r border-gray-200 text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 px-4 flex justify-between items-center">
            {/* ✅ Barra de búsqueda mejorada */}
            <div className="flex-1 flex max-w-lg">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-3">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    ref={searchInputRef}
                    className="block w-full h-full pl-10 pr-3 py-2 border border-transparent rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm bg-gray-50 hover:bg-white transition-colors"
                    placeholder="Buscar reservaciones, huéspedes..."
                    type="search"
                    onKeyPress={handleSearch}
                  />
                </div>
              </div>
            </div>

            {/* Perfil de usuario */}
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Notificaciones */}
              <NotificationBell />

              {/* ✅ Dropdown de perfil mejorado */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  className="max-w-xs bg-white flex items-center text-sm rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 p-2 transition-colors"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3 text-left hidden sm:block">
                    <span className="text-gray-700 text-sm font-medium block">{userName}</span>
                    <span className="text-gray-500 text-xs">{userRole}</span>
                  </div>
                  <ChevronDown className={classNames(
                    "ml-2 h-4 w-4 text-gray-400 transition-transform",
                    profileDropdownOpen ? "rotate-180" : ""
                  )} />
                </button>

                {/* ✅ Dropdown mejorado */}
                {profileDropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      {/* Info del usuario */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{userName}</p>
                        <p className="text-sm text-gray-500">{userRole}</p>
                        {primaryBranch && (
                          <p className="text-xs text-gray-400 mt-1">
                            📍 {primaryBranch.name}
                          </p>
                        )}
                      </div>
                      
                      {/* Opciones */}
                      <button
                        onClick={handleLogout}
                        className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-900 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3 text-gray-400 group-hover:text-red-500" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Contenido de la página con mejor manejo de scroll */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

// ✅ Componente del sidebar optimizado con React.memo
const SidebarContent = React.memo(({ navigation, adminNavigation, isAdmin, onNavigate, primaryBranch, classNames }) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo y título */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gradient-to-r from-indigo-600 to-purple-600">
        <Hotel className="h-8 w-8 text-white" />
        <span className="ml-2 text-xl font-semibold text-white">Hotel System</span>
      </div>

      {/* ✅ Información de la sucursal mejorada */}
      {primaryBranch && (
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-indigo-50 border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">{primaryBranch.name}</p>
              <p className="text-xs text-gray-500">Sucursal actual</p>
            </div>
          </div>
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
                    ? 'bg-indigo-100 text-indigo-900 border-r-2 border-indigo-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-l-md transition-all duration-150'
                )}
                title={item.description}
              >
                <div className="flex items-center">
                  <Icon
                    className={classNames(
                      item.current ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 h-5 w-5 transition-colors'
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                
                {/* ✅ Badges y alertas mejoradas */}
                <div className="flex items-center space-x-1">
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {item.badge}
                    </span>
                  )}
                  {item.alert && (
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="Requiere atención"></div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Sección de administrador */}
        {isAdmin() && (
          <div className="mt-8">
            <div className="px-3 py-2">
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
                        ? 'bg-indigo-100 text-indigo-900 border-r-2 border-indigo-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center w-full px-3 py-2 text-sm font-medium rounded-l-md transition-all duration-150'
                    )}
                    title={item.description}
                  >
                    <Icon
                      className={classNames(
                        item.current ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 h-5 w-5 transition-colors'
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

      {/* ✅ Footer del sidebar mejorado */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          <p className="font-medium">Sistema de Hotel</p>
          <p className="text-gray-400">v1.0.0 • © 2024</p>
          <div className="mt-2 flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-600">Sistema activo</span>
          </div>
        </div>
      </div>
    </div>
  )
})

SidebarContent.displayName = 'SidebarContent'

export default Layout