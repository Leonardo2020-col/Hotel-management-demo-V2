import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  Bed, 
  ClipboardCheck, 
  Calendar, 
  Package, 
  BarChart3, 
  Settings,
  LogOut,
  Hotel
} from 'lucide-react'

const Dashboard = () => {
  const { userInfo, userName, userRole, getPrimaryBranch, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    todayCheckins: 0,
    todayCheckouts: 0,
    pendingReservations: 0
  })

  const handleLogout = async () => {
    const result = await logout()
    if (result.success) {
      navigate('/login', { replace: true })
    }
  }

  const primaryBranch = getPrimaryBranch()

  // Cards del dashboard
  const dashboardCards = [
    {
      title: 'Check-in Rápido',
      description: 'Registro rápido de huéspedes',
      icon: ClipboardCheck,
      color: 'bg-green-500',
      route: '/checkin',
      permission: true
    },
    {
      title: 'Reservaciones',
      description: 'Gestión de reservas',
      icon: Calendar,
      color: 'bg-blue-500',
      route: '/reservations',
      permission: true
    },
    {
      title: 'Huéspedes',
      description: 'Gestión de huéspedes',
      icon: Users,
      color: 'bg-purple-500',
      route: '/guests',
      permission: true
    },
    {
      title: 'Habitaciones',
      description: 'Estado de habitaciones',
      icon: Bed,
      color: 'bg-orange-500',
      route: '/rooms',
      permission: true
    },
    {
      title: 'Suministros',
      description: 'Control de inventario',
      icon: Package,
      color: 'bg-yellow-500',
      route: '/supplies',
      permission: true
    },
    {
      title: 'Reportes',
      description: 'Análisis y estadísticas',
      icon: BarChart3,
      color: 'bg-indigo-500',
      route: '/reports',
      permission: true
    },
    {
      title: 'Configuración',
      description: 'Configuración del sistema',
      icon: Settings,
      color: 'bg-gray-500',
      route: '/settings',
      permission: isAdmin()
    }
  ]

  const handleCardClick = (route) => {
    navigate(route)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Hotel className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-600">
                  Bienvenido, {userName} 
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {userRole}
                  </span>
                </p>
                {primaryBranch && (
                  <p className="text-xs text-gray-500">
                    Sucursal: {primaryBranch.name}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Estadísticas rápidas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Bed className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Habitaciones Ocupadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.occupiedRooms}/{stats.totalRooms}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardCheck className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Check-ins Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayCheckins}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Check-outs Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayCheckouts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reservas Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReservations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de navegación */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dashboardCards
            .filter(card => card.permission)
            .map((card, index) => {
              const Icon = card.icon
              return (
                <div
                  key={index}
                  onClick={() => handleCardClick(card.route)}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group border border-gray-100 hover:border-gray-200"
                >
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 p-3 rounded-lg ${card.color} group-hover:scale-110 transition-transform duration-200`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {card.title}
                        </h3>
                        <p className="text-sm text-gray-600">{card.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>

        {/* Información adicional */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-700">Tu Rol</h4>
              <p className="text-gray-600">{userRole}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700">Sucursal Principal</h4>
              <p className="text-gray-600">{primaryBranch?.name || 'No asignada'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard