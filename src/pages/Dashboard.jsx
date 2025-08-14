// src/pages/Dashboard.jsx - VERSIÓN MEJORADA
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
  Hotel,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { format, subDays, startOfDay } from 'date-fns'

const Dashboard = () => {
  const { userInfo, userName, userRole, getPrimaryBranch, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  
  // Estados para datos del dashboard
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalRooms: 25,
      occupiedRooms: 18,
      availableRooms: 7,
      maintenanceRooms: 0,
      todayCheckins: 5,
      todayCheckouts: 3,
      pendingReservations: 8,
      todayRevenue: 2750.00,
      monthlyRevenue: 45600.00,
      occupancyRate: 72
    },
    alerts: [
      { id: 1, type: 'warning', message: 'Stock bajo: Toallas (5 unidades restantes)', priority: 'medium' },
      { id: 2, type: 'info', message: '3 reservas pendientes de confirmación', priority: 'low' },
      { id: 3, type: 'error', message: 'Habitación 205 requiere mantenimiento', priority: 'high' }
    ],
    recentActivity: [
      { id: 1, type: 'checkin', guest: 'Juan Pérez', room: '301', time: '14:30', status: 'completed' },
      { id: 2, type: 'checkout', guest: 'María García', room: '105', time: '11:15', status: 'completed' },
      { id: 3, type: 'reservation', guest: 'Carlos López', room: '202', time: '10:45', status: 'confirmed' },
      { id: 4, type: 'payment', guest: 'Ana Martín', amount: 350, time: '09:30', status: 'completed' }
    ]
  })

  // Datos simulados para gráficos
  const [chartData, setChartData] = useState({
    occupancy: [
      { day: 'Lun', ocupadas: 20, disponibles: 5 },
      { day: 'Mar', ocupadas: 18, disponibles: 7 },
      { day: 'Mie', ocupadas: 22, disponibles: 3 },
      { day: 'Jue', ocupadas: 19, disponibles: 6 },
      { day: 'Vie', ocupadas: 24, disponibles: 1 },
      { day: 'Sab', ocupadas: 25, disponibles: 0 },
      { day: 'Dom', ocupadas: 21, disponibles: 4 }
    ],
    revenue: [
      { date: 'Ene', ingresos: 42000 },
      { date: 'Feb', ingresos: 38000 },
      { date: 'Mar', ingresos: 45000 },
      { date: 'Abr', ingresos: 41000 },
      { date: 'May', ingresos: 48000 },
      { date: 'Jun', ingresos: 52000 }
    ],
    roomStatus: [
      { name: 'Ocupadas', value: 18, color: '#ef4444' },
      { name: 'Disponibles', value: 7, color: '#22c55e' },
      { name: 'Mantenimiento', value: 0, color: '#f59e0b' }
    ]
  })

  const handleLogout = async () => {
    const result = await logout()
    if (result.success) {
      navigate('/login', { replace: true })
    }
  }

  const primaryBranch = getPrimaryBranch()

  // Cards de navegación
  const dashboardCards = [
    {
      title: 'Check-in Rápido',
      description: 'Registro rápido de huéspedes',
      icon: ClipboardCheck,
      color: 'bg-green-500',
      route: '/checkin',
      permission: true,
      highlight: dashboardData.stats.todayCheckins > 0
    },
    {
      title: 'Reservaciones',
      description: 'Gestión de reservas',
      icon: Calendar,
      color: 'bg-blue-500',
      route: '/reservations',
      permission: true,
      badge: dashboardData.stats.pendingReservations
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
      permission: true,
      badge: dashboardData.stats.maintenanceRooms > 0 ? dashboardData.stats.maintenanceRooms : null
    },
    {
      title: 'Suministros',
      description: 'Control de inventario',
      icon: Package,
      color: 'bg-yellow-500',
      route: '/supplies',
      permission: true,
      alert: dashboardData.alerts.some(alert => alert.message.includes('Stock bajo'))
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

  const getActivityIcon = (type) => {
    switch (type) {
      case 'checkin': return <ClipboardCheck className="h-4 w-4 text-green-600" />
      case 'checkout': return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'reservation': return <Calendar className="h-4 w-4 text-purple-600" />
      case 'payment': return <DollarSign className="h-4 w-4 text-green-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info': return <AlertTriangle className="h-5 w-5 text-blue-500" />
      default: return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Alertas importantes */}
        {dashboardData.alerts.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-1 gap-3">
              {dashboardData.alerts.slice(0, 2).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.type === 'error' ? 'bg-red-50 border-red-400' :
                    alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                    'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex items-center">
                    {getAlertIcon(alert.type)}
                    <p className={`ml-3 text-sm font-medium ${
                      alert.type === 'error' ? 'text-red-800' :
                      alert.type === 'warning' ? 'text-yellow-800' :
                      'text-blue-800'
                    }`}>
                      {alert.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Bed className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ocupación</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.stats.occupiedRooms}/{dashboardData.stats.totalRooms}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {dashboardData.stats.occupancyRate}% ocupado
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
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.todayCheckins}</p>
                <p className="text-xs text-gray-500">Check-outs: {dashboardData.stats.todayCheckouts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ingresos Hoy</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${dashboardData.stats.todayRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Mes: ${dashboardData.stats.monthlyRevenue.toLocaleString()}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.pendingReservations}</p>
                <p className="text-xs text-orange-600">Requieren atención</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de ocupación semanal */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ocupación Semanal</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.occupancy}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="ocupadas" fill="#ef4444" name="Ocupadas" />
                <Bar dataKey="disponibles" fill="#22c55e" name="Disponibles" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de estado de habitaciones */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Estado Actual de Habitaciones</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.roomStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {chartData.roomStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grid combinado: Cards de navegación y actividad reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cards de navegación */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {dashboardCards
                .filter(card => card.permission)
                .map((card, index) => {
                  const Icon = card.icon
                  return (
                    <div
                      key={index}
                      onClick={() => handleCardClick(card.route)}
                      className="relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group border border-gray-100 hover:border-gray-200"
                    >
                      {/* Badge de notificaciones */}
                      {card.badge && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                          {card.badge}
                        </span>
                      )}
                      
                      {/* Indicador de alerta */}
                      {card.alert && (
                        <div className="absolute top-2 right-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        </div>
                      )}

                      <div className="p-4">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 p-2 rounded-lg ${card.color} group-hover:scale-110 transition-transform duration-200`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              {card.title}
                            </h4>
                            <p className="text-xs text-gray-600">{card.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actividad Reciente</h3>
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 space-y-3">
                {dashboardData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      {getActivityIcon(activity.type)}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.guest || `$${activity.amount}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.room && `Habitación ${activity.room}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{activity.time}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                        activity.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard