// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  Bed, 
  ClipboardCheck, 
  Calendar, 
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Package,
  BarChart3
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
  Line,
  Area,
  AreaChart
} from 'recharts'
import { format } from 'date-fns'

const Dashboard = () => {
  const { userInfo, userName, userRole, isAdmin } = useAuth()
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
      occupancyRate: 72,
      avgDailyRate: 185.50,
      totalGuests: 24
    },
    alerts: [
      { 
        id: 1, 
        type: 'warning', 
        message: 'Stock bajo: Toallas (5 unidades restantes)', 
        priority: 'medium',
        timestamp: '10:30 AM' 
      },
      { 
        id: 2, 
        type: 'info', 
        message: '3 reservas pendientes de confirmación', 
        priority: 'low',
        timestamp: '09:15 AM' 
      },
      { 
        id: 3, 
        type: 'error', 
        message: 'Habitación 205 requiere mantenimiento urgente', 
        priority: 'high',
        timestamp: '08:45 AM' 
      }
    ],
    recentActivity: [
      { 
        id: 1, 
        type: 'checkin', 
        guest: 'Juan Pérez', 
        room: '301', 
        time: '14:30', 
        status: 'completed',
        amount: 180 
      },
      { 
        id: 2, 
        type: 'checkout', 
        guest: 'María García', 
        room: '105', 
        time: '11:15', 
        status: 'completed',
        amount: 350 
      },
      { 
        id: 3, 
        type: 'reservation', 
        guest: 'Carlos López', 
        room: '202', 
        time: '10:45', 
        status: 'confirmed',
        nights: 3 
      },
      { 
        id: 4, 
        type: 'payment', 
        guest: 'Ana Martín', 
        amount: 450, 
        time: '09:30', 
        status: 'completed',
        method: 'Tarjeta'
      },
      { 
        id: 5, 
        type: 'maintenance', 
        room: '205', 
        time: '08:45', 
        status: 'pending',
        issue: 'Aire acondicionado'
      }
    ]
  })

  // Datos para gráficos con más detalle
  const [chartData, setChartData] = useState({
    occupancy: [
      { day: 'Lun', ocupadas: 20, disponibles: 5, mantenimiento: 0 },
      { day: 'Mar', ocupadas: 18, disponibles: 7, mantenimiento: 0 },
      { day: 'Mié', ocupadas: 22, disponibles: 3, mantenimiento: 0 },
      { day: 'Jue', ocupadas: 19, disponibles: 6, mantenimiento: 0 },
      { day: 'Vie', ocupadas: 24, disponibles: 1, mantenimiento: 0 },
      { day: 'Sáb', ocupadas: 25, disponibles: 0, mantenimiento: 0 },
      { day: 'Dom', ocupadas: 21, disponibles: 4, mantenimiento: 0 }
    ],
    revenue: [
      { fecha: '1', ingresos: 2100, gastos: 800 },
      { fecha: '2', ingresos: 2400, gastos: 750 },
      { fecha: '3', ingresos: 2800, gastos: 900 },
      { fecha: '4', ingresos: 2200, gastos: 650 },
      { fecha: '5', ingresos: 3100, gastos: 1100 },
      { fecha: '6', ingresos: 2900, gastos: 850 },
      { fecha: '7', ingresos: 2750, gastos: 700 }
    ],
    roomStatus: [
      { name: 'Ocupadas', value: 18, color: '#ef4444' },
      { name: 'Disponibles', value: 7, color: '#22c55e' },
      { name: 'Limpieza', value: 0, color: '#f59e0b' },
      { name: 'Mantenimiento', value: 0, color: '#8b5cf6' }
    ],
    monthlyTrends: [
      { mes: 'Ene', ocupacion: 65, ingresos: 38000 },
      { mes: 'Feb', ocupacion: 70, ingresos: 42000 },
      { mes: 'Mar', ocupacion: 75, ingresos: 45000 },
      { mes: 'Abr', ocupacion: 68, ingresos: 41000 },
      { mes: 'May', ocupacion: 80, ingresos: 48000 },
      { mes: 'Jun', ocupacion: 72, ingresos: 45600 }
    ]
  })

  const [loading, setLoading] = useState(true)

  // Simular carga de datos
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const getActivityIcon = (type) => {
    switch (type) {
      case 'checkin': 
        return <ClipboardCheck className="h-4 w-4 text-green-600" />
      case 'checkout': 
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'reservation': 
        return <Calendar className="h-4 w-4 text-purple-600" />
      case 'payment': 
        return <DollarSign className="h-4 w-4 text-green-600" />
      case 'maintenance': 
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      default: 
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case 'error': 
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'warning': 
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info': 
        return <AlertTriangle className="h-5 w-5 text-blue-500" />
      default: 
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const getActivityDescription = (activity) => {
    switch (activity.type) {
      case 'checkin':
        return `Check-in en habitación ${activity.room} - $${activity.amount}`
      case 'checkout':
        return `Check-out de habitación ${activity.room} - $${activity.amount}`
      case 'reservation':
        return `Reserva confirmada - ${activity.nights} noches`
      case 'payment':
        return `Pago de $${activity.amount} - ${activity.method}`
      case 'maintenance':
        return `${activity.issue} - Habitación ${activity.room}`
      default:
        return 'Actividad'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 h-80 rounded-lg"></div>
            <div className="bg-gray-200 h-80 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header de bienvenida */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido de vuelta, {userName}
        </h1>
        <p className="text-gray-600">
          Resumen de actividades para hoy, {format(new Date(), 'dd/MM/yyyy')}
        </p>
      </div>

      {/* Alertas importantes */}
      {dashboardData.alerts.length > 0 && (
        <div className="space-y-3">
          {dashboardData.alerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-l-4 transition-all hover:shadow-md ${
                alert.type === 'error' ? 'bg-red-50 border-red-400' :
                alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                'bg-blue-50 border-blue-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getAlertIcon(alert.type)}
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      alert.type === 'error' ? 'text-red-800' :
                      alert.type === 'warning' ? 'text-yellow-800' :
                      'text-blue-800'
                    }`}>
                      {alert.message}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{alert.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ocupación */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
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

        {/* Check-ins */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
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

        {/* Ingresos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
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
                ADR: ${dashboardData.stats.avgDailyRate}
              </p>
            </div>
          </div>
        </div>

        {/* Reservas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
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

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de ocupación semanal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ocupación Semanal</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                <span className="text-gray-600">Ocupadas</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                <span className="text-gray-600">Disponibles</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.occupancy}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value, name === 'ocupadas' ? 'Ocupadas' : 'Disponibles']}
                labelStyle={{ color: '#374151' }}
              />
              <Bar dataKey="ocupadas" fill="#ef4444" name="ocupadas" radius={[4, 4, 0, 0]} />
              <Bar dataKey="disponibles" fill="#22c55e" name="disponibles" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de ingresos vs gastos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ingresos vs Gastos (7 días)</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                <span className="text-gray-600">Ingresos</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                <span className="text-gray-600">Gastos</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [`$${value}`, name === 'ingresos' ? 'Ingresos' : 'Gastos']}
                labelFormatter={(label) => `Día ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="ingresos" 
                stackId="1"
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="gastos" 
                stackId="2"
                stroke="#ef4444" 
                fill="#ef4444" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Segunda fila de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estado de habitaciones (pie chart) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Habitaciones</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData.roomStatus}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
                fontSize={12}
              >
                {chartData.roomStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Actividad reciente */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    {getActivityIcon(activity.type)}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.guest || `Habitación ${activity.room}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getActivityDescription(activity)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{activity.time}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/checkin')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all hover:shadow-md"
            >
              <ClipboardCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4 text-left">
                <p className="font-medium text-gray-900">Nuevo Check-in</p>
                <p className="text-sm text-gray-500">Registrar huésped</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/reservations')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all hover:shadow-md"
            >
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4 text-left">
                <p className="font-medium text-gray-900">Gestionar Reservas</p>
                <p className="text-sm text-gray-500">
                  {dashboardData.stats.pendingReservations} pendientes
                </p>
              </div>
            </button>

            <button
              onClick={() => navigate('/rooms')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all hover:shadow-md"
            >
              <Bed className="h-8 w-8 text-orange-600" />
              <div className="ml-4 text-left">
                <p className="font-medium text-gray-900">Estado Habitaciones</p>
                <p className="text-sm text-gray-500">
                  {dashboardData.stats.availableRooms} disponibles
                </p>
              </div>
            </button>

            {isAdmin() && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all hover:shadow-md"
              >
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div className="ml-4 text-left">
                  <p className="font-medium text-gray-900">Panel Admin</p>
                  <p className="text-sm text-gray-500">Configuración</p>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard