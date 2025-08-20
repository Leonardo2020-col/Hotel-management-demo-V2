// src/pages/Dashboard.jsx - VERSIÓN OPTIMIZADA
import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDashboard } from '../hooks/useDashboard'
import { 
  Users, Bed, ClipboardCheck, Calendar, DollarSign,
  AlertTriangle, Package, BarChart3, TrendingUp, Clock
} from 'lucide-react'

// Importar componentes modulares
import {
  StatCard,
  AlertsList,
  OccupancyChart,
  RevenueChart,
  RoomStatusChart,
  QuickActions,
  DashboardHeader,
  ActivityList,
  DashboardSkeleton
} from '../components/dashboard/DashboardComponents'

const Dashboard = () => {
  const { userName, isAdmin } = useAuth()
  const navigate = useNavigate()
  
  // Hook personalizado para manejar datos del dashboard
  const {
    loading,
    refreshing,
    lastUpdate,
    stats,
    alerts,
    recentActivity,
    chartData,
    occupancyPercentage,
    revenueFormatted,
    hasAlerts,
    totalMovement,
    refreshDashboard,
    primaryBranch
  } = useDashboard()

  // ✅ Handlers para acciones del usuario
  const handleStatCardClick = useCallback((path) => {
    navigate(path)
  }, [navigate])

  const handleDismissAlert = useCallback((alertId) => {
    console.log('Descartar alerta:', alertId)
    // Aquí implementarías la lógica para descartar alertas
  }, [])

  const handleAlertAction = useCallback((alert) => {
    if (alert.action?.path) {
      navigate(alert.action.path)
    }
  }, [navigate])

  const handleActivityClick = useCallback((activity) => {
    console.log('Click en actividad:', activity)
    // Aquí podrías navegar a detalles de la actividad
    switch (activity.type) {
      case 'reservation':
        navigate('/reservations')
        break
      case 'checkin':
      case 'checkout':
        navigate('/checkin')
        break
      case 'payment':
        navigate('/reservations')
        break
      default:
        break
    }
  }, [navigate])

  // ✅ Mostrar skeleton loading mientras cargan los datos
  if (loading && !stats.totalRooms) {
    return <DashboardSkeleton />
  }

  // ✅ Verificar que hay una sucursal configurada
  if (!primaryBranch) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            Sucursal no configurada
          </h2>
          <p className="text-yellow-700">
            Tu usuario no tiene una sucursal asignada. Contacta al administrador.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* ✅ Header con información de actualización */}
      <DashboardHeader
        userName={userName}
        lastUpdate={lastUpdate}
        onRefresh={refreshDashboard}
        refreshing={refreshing}
      />

      {/* ✅ Alertas importantes */}
      {hasAlerts && (
        <AlertsList
          alerts={alerts}
          onDismissAlert={handleDismissAlert}
          onAlertAction={handleAlertAction}
        />
      )}

      {/* ✅ Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ocupación */}
        <StatCard
          title="Ocupación"
          value={`${stats.occupiedRooms}/${stats.totalRooms}`}
          subtitle={`${occupancyPercentage}% ocupado`}
          icon={Bed}
          iconColor="text-blue-600"
          trend={{ 
            direction: occupancyPercentage > 70 ? 'up' : occupancyPercentage < 50 ? 'down' : 'stable'
          }}
          onClick={() => handleStatCardClick('/rooms')}
          loading={refreshing}
        />

        {/* Check-ins */}
        <StatCard
          title="Movimiento Hoy"
          value={totalMovement}
          subtitle={`${stats.todayCheckins} entradas • ${stats.todayCheckouts} salidas`}
          icon={ClipboardCheck}
          iconColor="text-green-600"
          onClick={() => handleStatCardClick('/checkin')}
          loading={refreshing}
        />

        {/* Ingresos */}
        <StatCard
          title="Ingresos Hoy"
          value={revenueFormatted}
          subtitle={`ADR: ${stats.avgDailyRate ? `S/${stats.avgDailyRate}` : 'N/A'}`}
          icon={DollarSign}
          iconColor="text-green-600"
          trend={{ direction: 'up' }}
          onClick={() => handleStatCardClick('/reports')}
          loading={refreshing}
        />

        {/* Reservas */}
        <StatCard
          title="Reservas Pendientes"
          value={stats.pendingReservations}
          subtitle={stats.pendingReservations > 0 ? 'Requieren atención' : 'Todo al día'}
          icon={Calendar}
          iconColor={stats.pendingReservations > 0 ? 'text-orange-600' : 'text-gray-600'}
          onClick={() => handleStatCardClick('/reservations')}
          loading={refreshing}
        />
      </div>

      {/* ✅ Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de ocupación semanal */}
        <OccupancyChart 
          data={chartData.occupancyTrend} 
          loading={refreshing}
        />

        {/* Gráfico de ingresos vs gastos */}
        <RevenueChart 
          data={chartData.revenueTrend} 
          loading={refreshing}
        />
      </div>

      {/* ✅ Segunda fila con estado de habitaciones y actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estado de habitaciones (pie chart) */}
        <RoomStatusChart 
          data={chartData.roomStatus} 
          loading={refreshing}
        />

        {/* Actividad reciente */}
        <div className="lg:col-span-2">
          <ActivityList
            activities={recentActivity}
            loading={refreshing}
            onActivityClick={handleActivityClick}
          />
        </div>
      </div>

      {/* ✅ Estadísticas adicionales */}
      {stats.lowStockItems > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Suministros"
            value={stats.lowStockItems}
            subtitle="Productos con stock bajo"
            icon={Package}
            iconColor="text-yellow-600"
            onClick={() => handleStatCardClick('/supplies')}
          />
          
          <StatCard
            title="Tasa de Ocupación"
            value={`${occupancyPercentage}%`}
            subtitle="Promedio semanal"
            icon={TrendingUp}
            iconColor="text-purple-600"
          />

          <StatCard
            title="Tiempo Promedio"
            value="2.3 días"
            subtitle="Estadía promedio"
            icon={Clock}
            iconColor="text-indigo-600"
          />
        </div>
      )}

      {/* ✅ Acciones rápidas */}
      <QuickActions 
        isAdmin={isAdmin()} 
        loading={refreshing}
      />

      {/* ✅ Información de la sucursal en el footer */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            <span>Sucursal: {primaryBranch.name}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Total habitaciones: {stats.totalRooms}</span>
            <span>Sistema activo</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard