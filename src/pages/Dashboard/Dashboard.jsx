// src/pages/Dashboard/Dashboard.jsx - MEJORADO CON DATOS REALES
import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  DollarSign,
  Bed,
  TrendingUp,
  Clock,
  RefreshCw,
  Plus,
  Settings,
  AlertCircle
} from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/dashboard/StatCard';
import OccupancyChart from '../../components/dashboard/OccupancyChart';
import RevenueChart from '../../components/dashboard/RevenueChart';
import RecentActivity from '../../components/dashboard/RecentActivity';
import UpcomingCheckIns from '../../components/dashboard/UpcomingCheckIns';
import RoomsToClean from '../../components/dashboard/RoomsToClean';
import QuickCheckInModal from '../../components/dashboard/QuickCheckInModal';
import Button from '../../components/common/Button';

const Dashboard = () => {
  const { hasPermission, user } = useAuth();
  const [showQuickCheckIn, setShowQuickCheckIn] = useState(false);

  const {
    stats,
    occupancyData,
    revenueByCategory,
    recentActivity,
    upcomingCheckIns,
    roomsToClean,
    loading,
    lastUpdated,
    getOccupancyTrend,
    getRevenueTrend,
    refreshDashboard
  } = useDashboard();

  const occupancyTrend = getOccupancyTrend();
  const revenueTrend = getRevenueTrend();

  // =============================================
  // FORMATTERS
  // =============================================
  const formatCurrency = (amount) => {
    if (!amount) return 'S/ 0.00';
    return `S/ ${parseFloat(amount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // =============================================
  // HANDLERS
  // =============================================
  const handleQuickCheckIn = async (checkInData) => {
    try {
      console.log('Processing quick check-in:', checkInData);
      
      // Aquí implementarías la lógica real de check-in
      // Por ejemplo, crear guest, crear reserva, actualizar habitación
      
      // Simulación por ahora
      alert(`Check-in exitoso!\nHuésped: ${checkInData.guest.fullName}\nHabitación: ${checkInData.room}`);
      
      // Refrescar datos después del check-in
      refreshDashboard();
      
    } catch (error) {
      console.error('Error in quick check-in:', error);
      alert('Error al procesar el check-in. Intenta nuevamente.');
    }
  };

  const handleRefresh = () => {
    refreshDashboard();
  };

  // =============================================
  // NAVIGATION HELPERS
  // =============================================
  const navigateToReservations = () => {
    // Implementar navegación a reservas
    console.log('Navigate to reservations');
  };

  const navigateToRooms = () => {
    // Implementar navegación a habitaciones
    console.log('Navigate to rooms');
  };

  const navigateToReports = () => {
    // Implementar navegación a reportes
    console.log('Navigate to reports');
  };

  // =============================================
  // ALERTAS Y NOTIFICACIONES
  // =============================================
  const hasAlerts = () => {
    return (
      stats.checkOutsToday > 0 || 
      roomsToClean.length > 0 || 
      upcomingCheckIns.length > 0
    );
  };

  const getAlertCount = () => {
    return stats.checkOutsToday + roomsToClean.length + upcomingCheckIns.length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Bienvenido, {user?.name || 'Usuario'} - Vista general del Hotel Paraíso
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          {/* Indicador de alertas */}
          {hasAlerts() && (
            <div className="flex items-center space-x-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm">
              <AlertCircle size={16} />
              <span>{getAlertCount()} pendientes</span>
            </div>
          )}
          
          <div className="text-sm text-gray-500">
            Actualizado: {formatTime(lastUpdated)}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={handleRefresh}
            disabled={loading}
            className={loading ? 'animate-spin' : ''}
          >
            {loading ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Nueva Reserva */}
        {hasPermission('reservations', 'write') && (
          <Button
            variant="primary"
            className="h-12 bg-blue-600 hover:bg-blue-700"
            icon={Plus}
            onClick={navigateToReservations}
          >
            Nueva Reserva
          </Button>
        )}
        
        {/* Check-in Rápido */}
        {hasPermission('reservations', 'write') && (
          <Button
            variant="success"
            className="h-12 bg-green-600 hover:bg-green-700"
            icon={Users}
            onClick={() => setShowQuickCheckIn(true)}
          >
            Check-in Rápido
          </Button>
        )}
        
        {/* Gestionar Habitaciones */}
        <Button
          variant="warning"
          className="h-12 bg-orange-600 hover:bg-orange-700 text-white"
          icon={Bed}
          onClick={navigateToRooms}
        >
          Gestionar Habitaciones
        </Button>
        
        {/* Ver Reportes */}
        <Button
          variant="purple"
          className="h-12 bg-purple-600 hover:bg-purple-700 text-white"
          icon={BarChart3}
          onClick={navigateToReports}
        >
          Ver Reportes
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tasa de Ocupación"
          value={`${stats.occupancy}%`}
          subtitle={`${stats.occupiedRooms}/${stats.totalRooms} habitaciones`}
          icon={BarChart3}
          trend={occupancyTrend}
          color="blue"
          loading={loading}
        />
        
        <StatCard
          title="Huéspedes Actuales"
          value={stats.totalGuests}
          subtitle={`+${stats.checkInsToday} check-ins hoy`}
          icon={Users}
          color="green"
          loading={loading}
        />
        
        <StatCard
          title="Ingresos del Mes"
          value={formatCurrency(stats.revenue.thisMonth)}
          subtitle={`${formatCurrency(stats.revenue.today)} hoy`}
          icon={DollarSign}
          trend={revenueTrend}
          color="purple"
          loading={loading}
        />
        
        <StatCard
          title="Tarifa Promedio"
          value={formatCurrency(stats.averageRate)}
          subtitle={`Satisfacción: ${stats.guestSatisfaction}/5.0`}
          icon={TrendingUp}
          color="yellow"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OccupancyChart data={occupancyData} loading={loading} />
        </div>
        <div>
          <RevenueChart data={revenueByCategory} loading={loading} />
        </div>
      </div>

      {/* Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <RecentActivity activities={recentActivity} loading={loading} />
        </div>
        <div>
          <UpcomingCheckIns checkIns={upcomingCheckIns} loading={loading} />
        </div>
        <div>
          <RoomsToClean rooms={roomsToClean} loading={loading} />
        </div>
      </div>

      {/* Summary Cards - Información Adicional */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Check-outs Pendientes */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Check-outs Pendientes</p>
              <p className="text-3xl font-bold">{stats.checkOutsToday}</p>
              <p className="text-blue-100 text-sm mt-1">Para hoy</p>
            </div>
            <Clock className="w-12 h-12 text-blue-200" />
          </div>
          {stats.checkOutsToday > 0 && (
            <div className="mt-4 pt-4 border-t border-blue-400">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-blue-400"
                fullWidth
              >
                Gestionar Check-outs
              </Button>
            </div>
          )}
        </div>

        {/* Habitaciones Disponibles */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Habitaciones Disponibles</p>
              <p className="text-3xl font-bold">{stats.availableRooms}</p>
              <p className="text-green-100 text-sm mt-1">Listas para ocupar</p>
            </div>
            <Bed className="w-12 h-12 text-green-200" />
          </div>
          <div className="mt-4 pt-4 border-t border-green-400">
            <div className="flex justify-between text-green-100 text-sm">
              <span>Ocupación:</span>
              <span>{stats.occupancy}%</span>
            </div>
          </div>
        </div>

        {/* Ingresos Semanales */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Ingresos Semanales</p>
              <p className="text-3xl font-bold">{formatCurrency(stats.revenue.thisWeek)}</p>
              <p className="text-purple-100 text-sm mt-1">Esta semana</p>
            </div>
            <DollarSign className="w-12 h-12 text-purple-200" />
          </div>
          <div className="mt-4 pt-4 border-t border-purple-400">
            <div className="flex justify-between text-purple-100 text-sm">
              <span>Promedio diario:</span>
              <span>{formatCurrency(stats.revenue.thisWeek / 7)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen de Estado del Hotel */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Estado Actual del Hotel
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Distribución de Habitaciones */}
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.occupiedRooms}</div>
            <div className="text-sm text-gray-600">Ocupadas</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${(stats.occupiedRooms / stats.totalRooms) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.availableRooms}</div>
            <div className="text-sm text-gray-600">Disponibles</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${(stats.availableRooms / stats.totalRooms) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{roomsToClean.length}</div>
            <div className="text-sm text-gray-600">Por Limpiar</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-orange-600 h-2 rounded-full" 
                style={{ width: `${(roomsToClean.length / stats.totalRooms) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{upcomingCheckIns.length}</div>
            <div className="text-sm text-gray-600">Check-ins Hoy</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-purple-600 h-2 rounded-full" 
                style={{ width: `${Math.min((upcomingCheckIns.length / 10) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas y Notificaciones */}
      {hasAlerts() && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-900">
              Tareas Pendientes
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.checkOutsToday > 0 && (
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-orange-700 font-medium">Check-outs Pendientes</div>
                    <div className="text-2xl font-bold text-orange-900">{stats.checkOutsToday}</div>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            )}
            
            {roomsToClean.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-orange-700 font-medium">Habitaciones por Limpiar</div>
                    <div className="text-2xl font-bold text-orange-900">{roomsToClean.length}</div>
                  </div>
                  <Bed className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            )}
            
            {upcomingCheckIns.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-orange-700 font-medium">Check-ins de Hoy</div>
                    <div className="text-2xl font-bold text-orange-900">{upcomingCheckIns.length}</div>
                  </div>
                  <Users className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Check-in Rápido */}
      <QuickCheckInModal
        isOpen={showQuickCheckIn}
        onClose={() => setShowQuickCheckIn(false)}
        onSubmit={handleQuickCheckIn}
      />
    </div>
  );
};

export default Dashboard;