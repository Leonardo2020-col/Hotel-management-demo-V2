// src/components/dashboard/DashboardComponents.jsx - COMPONENTES MODULARES
import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import { 
  Users, Bed, ClipboardCheck, Calendar, DollarSign, AlertTriangle,
  TrendingUp, TrendingDown, Clock, CheckCircle, Package, BarChart3,
  RefreshCw, Bell, ExternalLink, Activity, Minus
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

// ✅ Componente de estadística individual
export const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconColor = 'text-blue-600',
  trend = null,
  loading = false,
  onClick = null 
}) => {
  const CardWrapper = onClick ? 'button' : 'div'
  
  return (
    <CardWrapper
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all ${
        onClick ? 'hover:shadow-md hover:border-blue-300 cursor-pointer' : ''
      } ${loading ? 'animate-pulse' : ''}`}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {loading ? (
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          ) : (
            <Icon className={`h-8 w-8 ${iconColor}`} />
          )}
        </div>
        <div className="ml-4 flex-1">
          {loading ? (
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {subtitle && (
                <div className="flex items-center mt-1">
                  {trend && (
                    <>
                      {trend.direction === 'up' ? (
                        <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                      ) : trend.direction === 'down' ? (
                        <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                      ) : (
                        <Minus className="h-3 w-3 text-gray-400 mr-1" />
                      )}
                    </>
                  )}
                  <p className={`text-xs ${
                    trend?.direction === 'up' ? 'text-green-600' :
                    trend?.direction === 'down' ? 'text-red-600' :
                    'text-gray-500'
                  }`}>
                    {subtitle}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </CardWrapper>
  )
}

// ✅ Componente de alerta
export const AlertCard = ({ alert, onDismiss, onAction }) => {
  const getAlertIcon = (type) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
      default: return <AlertTriangle className="h-5 w-5 text-blue-500" />
    }
  }

  const getAlertStyles = (type) => {
    switch (type) {
      case 'error': return 'bg-red-50 border-red-200 text-red-800'
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      default: return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  return (
    <div className={`p-4 rounded-lg border transition-all hover:shadow-sm ${getAlertStyles(alert.type)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          {getAlertIcon(alert.type)}
          <div className="ml-3 flex-1">
            <h4 className="text-sm font-medium">{alert.title}</h4>
            <p className="text-sm mt-1">{alert.message}</p>
            {alert.timestamp && (
              <p className="text-xs mt-2 opacity-75">
                {formatDistanceToNow(new Date(alert.timestamp), { 
                  addSuffix: true, 
                  locale: es 
                })}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {alert.action && (
            <button
              onClick={() => onAction?.(alert)}
              className="text-xs hover:underline flex items-center"
            >
              Ver <ExternalLink className="h-3 w-3 ml-1" />
            </button>
          )}
          {onDismiss && (
            <button
              onClick={() => onDismiss(alert.id)}
              className="text-xs hover:underline"
            >
              Descartar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ✅ Componente de actividad reciente
export const ActivityItem = ({ activity, onClick }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'checkin': return <ClipboardCheck className="h-4 w-4 text-green-600" />
      case 'checkout': return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'reservation': return <Calendar className="h-4 w-4 text-purple-600" />
      case 'payment': return <DollarSign className="h-4 w-4 text-green-600" />
      case 'maintenance': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div 
      className={`flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 transition-colors ${
        onClick ? 'hover:bg-gray-50 cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center flex-1">
        {getActivityIcon(activity.type)}
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
          <p className="text-xs text-gray-500">{activity.description}</p>
        </div>
      </div>
      <div className="text-right ml-4">
        <p className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(activity.timestamp), { 
            addSuffix: true, 
            locale: es 
          })}
        </p>
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${getStatusColor(activity.status)}`}>
          {activity.status === 'completed' ? 'Completado' :
           activity.status === 'confirmed' ? 'Confirmado' :
           activity.status === 'pending' ? 'Pendiente' :
           activity.status === 'cancelled' ? 'Cancelado' : activity.status}
        </span>
      </div>
    </div>
  )
}

// ✅ Componente de gráfico de ocupación
export const OccupancyChart = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="h-80 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-gray-500">Cargando gráfico...</div>
      </div>
    )
  }

  return (
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
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="day" 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#e0e0e0' }}
          />
          <Tooltip 
            formatter={(value, name) => [value, name === 'ocupadas' ? 'Ocupadas' : 'Disponibles']}
            labelStyle={{ color: '#374151' }}
            contentStyle={{ 
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Bar 
            dataKey="ocupadas" 
            fill="#ef4444" 
            name="ocupadas" 
            radius={[4, 4, 0, 0]}
            strokeWidth={0}
          />
          <Bar 
            dataKey="disponibles" 
            fill="#22c55e" 
            name="disponibles" 
            radius={[4, 4, 0, 0]}
            strokeWidth={0}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ✅ Componente de gráfico de ingresos
export const RevenueChart = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="h-80 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-gray-500">Cargando gráfico...</div>
      </div>
    )
  }

  return (
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
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="fecha" 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#e0e0e0' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
          />
          <Tooltip 
            formatter={(value, name) => [
              `$${value.toLocaleString()}`, 
              name === 'ingresos' ? 'Ingresos' : 'Gastos'
            ]}
            labelFormatter={(label) => `Día ${label}`}
            contentStyle={{ 
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="ingresos" 
            stackId="1"
            stroke="#3b82f6" 
            fill="#3b82f6" 
            fillOpacity={0.6}
            strokeWidth={2}
          />
          <Area 
            type="monotone" 
            dataKey="gastos" 
            stackId="2"
            stroke="#ef4444" 
            fill="#ef4444" 
            fillOpacity={0.6}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ✅ Componente de gráfico de pie para estado de habitaciones
export const RoomStatusChart = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  const renderCustomLabel = ({ name, value, percent }) => 
    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Habitaciones</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={renderCustomLabel}
            labelLine={false}
            fontSize={11}
          >
            {data?.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name) => [value, name]}
            contentStyle={{ 
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// ✅ Componente de acciones rápidas
export const QuickActions = ({ isAdmin, loading = false }) => {
  const navigate = useNavigate()

  const actions = [
    {
      title: 'Nuevo Check-in',
      description: 'Registrar huésped',
      icon: ClipboardCheck,
      iconColor: 'text-green-600',
      path: '/checkin',
      color: 'hover:border-green-300 hover:bg-green-50'
    },
    {
      title: 'Gestionar Reservas',
      description: 'Ver pendientes',
      icon: Calendar,
      iconColor: 'text-blue-600',
      path: '/reservations',
      color: 'hover:border-blue-300 hover:bg-blue-50'
    },
    {
      title: 'Estado Habitaciones',
      description: 'Ver disponibilidad',
      icon: Bed,
      iconColor: 'text-orange-600',
      path: '/rooms',
      color: 'hover:border-orange-300 hover:bg-orange-50'
    },
    {
      title: 'Huéspedes',
      description: 'Base de datos',
      icon: Users,
      iconColor: 'text-purple-600',
      path: '/guests',
      color: 'hover:border-purple-300 hover:bg-purple-50'
    }
  ]

  if (isAdmin) {
    actions.push({
      title: 'Panel Admin',
      description: 'Configuración',
      icon: BarChart3,
      iconColor: 'text-indigo-600',
      path: '/admin',
      color: 'hover:border-indigo-300 hover:bg-indigo-50'
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className={`flex items-center p-4 border border-gray-200 rounded-lg transition-all hover:shadow-md ${action.color}`}
              >
                <Icon className={`h-8 w-8 ${action.iconColor}`} />
                <div className="ml-4 text-left">
                  <p className="font-medium text-gray-900 text-sm">{action.title}</p>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ✅ Componente de header del dashboard
export const DashboardHeader = ({ userName, lastUpdate, onRefresh, refreshing }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido de vuelta, {userName}
        </h1>
        <p className="text-gray-600">
          Resumen de actividades para hoy, {format(new Date(), 'dd/MM/yyyy', { locale: es })}
        </p>
        {lastUpdate && (
          <p className="text-xs text-gray-500 mt-1">
            Última actualización: {format(new Date(lastUpdate), 'HH:mm:ss')}
          </p>
        )}
      </div>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className={`flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${
          refreshing ? 'cursor-not-allowed opacity-50' : ''
        }`}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Actualizando...' : 'Actualizar'}
      </button>
    </div>
  )
}

// ✅ Componente de lista de actividades
export const ActivityList = ({ activities, loading = false, onActivityClick }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="ml-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
        <Bell className="h-5 w-5 text-gray-400" />
      </div>
      <div className="p-6">
        {activities.length === 0 ? (
          <div className="text-center py-6">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay actividad reciente</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activities.map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                onClick={() => onActivityClick?.(activity)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ✅ Componente de lista de alertas
export const AlertsList = ({ alerts, onDismissAlert, onAlertAction }) => {
  if (!alerts || alerts.length === 0) return null

  return (
    <div className="space-y-3 mb-6">
      {alerts.slice(0, 3).map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onDismiss={onDismissAlert}
          onAction={onAlertAction}
        />
      ))}
    </div>
  )
}

// ✅ Componente de skeleton loading para el dashboard completo
export const DashboardSkeleton = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 h-32 rounded-lg animate-pulse"></div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-200 h-80 rounded-lg animate-pulse"></div>
        <div className="bg-gray-200 h-80 rounded-lg animate-pulse"></div>
      </div>

      {/* Bottom section skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-200 h-64 rounded-lg animate-pulse"></div>
        <div className="lg:col-span-2 bg-gray-200 h-64 rounded-lg animate-pulse"></div>
      </div>
    </div>
  )
}