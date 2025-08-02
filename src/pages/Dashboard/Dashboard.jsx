// src/pages/Dashboard/Dashboard.jsx - ACTUALIZADO CON SEPARACIÓN DE SISTEMAS
import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/supabase';
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
  
  // ✅ Estado separado para ambos sistemas
  const [dashboardData, setDashboardData] = useState({
    quickCheckins: {
      today: 0,
      active: 0,
      revenue: 0,
      monthlyRevenue: 0
    },
    reservations: {
      today: 0,
      active: 0,
      revenue: 0,
      monthlyRevenue: 0
    },
    rooms: {
      total: 0,
      available: 0,
      occupied: 0,
      cleaning: 0,
      occupancyRate: 0
    },
    combined: {
      totalRevenue: 0,
      totalGuests: 0,
      revenueComparison: {
        quickCheckinPercentage: 0,
        reservationPercentage: 0
      }
    }
  });

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

  const [separatedLoading, setSeparatedLoading] = useState(true);
  const [lastSeparatedUpdate, setLastSeparatedUpdate] = useState(new Date());

  // ✅ Cargar datos separados
  useEffect(() => {
    loadSeparatedDashboardData();
    
    // Auto-refresh cada 5 minutos
    const interval = setInterval(loadSeparatedDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadSeparatedDashboardData = async () => {
    try {
      setSeparatedLoading(true);
      
      console.log('📊 Loading separated dashboard data...');
      
      // ✅ Cargar estadísticas de quick check-ins (separadas)
      const [
        quickCheckinStatsResult,
        reservationStatsResult,
        roomStatsResult,
        revenueComparisonResult
      ] = await Promise.all([
        db.getQuickCheckinStats?.() || Promise.resolve({ data: null }),
        db.getDashboardStats?.() || Promise.resolve({ data: null }),
        db.getRooms?.() || Promise.resolve({ data: [] }),
        db.getRevenueComparison?.(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        ) || Promise.resolve({ data: null })
      ]);

      // Procesar estadísticas de quick check-ins
      const quickCheckinStats = quickCheckinStatsResult.data || {
        todayCheckins: 0,
        activeCheckins: 0,
        todayRevenue: 0,
        monthlyRevenue: 0
      };

      // Procesar estadísticas de reservaciones
      const reservationStats = reservationStatsResult.data || {
        totalGuests: 0,
        checkInsToday: 0,
        revenue: { today: 0, thisMonth: 0 }
      };

      // Procesar estadísticas de habitaciones
      const roomData = roomStatsResult.data || [];
      const roomStats = {
        total: roomData.length,
        available: roomData.filter(r => r.status === 'available' && r.cleaning_status === 'clean').length,
        occupied: roomData.filter(r => r.status === 'occupied').length,
        cleaning: roomData.filter(r => r.cleaning_status === 'dirty' || r.status === 'cleaning').length
      };
      roomStats.occupancyRate = roomStats.total > 0 ? Math.round((roomStats.occupied / roomStats.total) * 100) : 0;

      // Procesar comparación de ingresos
      const revenueComparison = revenueComparisonResult.data || {
        comparison: {
          quickCheckinPercentage: 0,
          reservationPercentage: 0
        }
      };

      // Consolidar datos
      const newDashboardData = {
        quickCheckins: {
          today: quickCheckinStats.todayCheckins,
          active: quickCheckinStats.activeCheckins,
          revenue: quickCheckinStats.todayRevenue,
          monthlyRevenue: quickCheckinStats.monthlyRevenue
        },
        reservations: {
          today: reservationStats.checkInsToday,
          active: reservationStats.totalGuests,
          revenue: reservationStats.revenue.today,
          monthlyRevenue: reservationStats.revenue.thisMonth
        },
        rooms: roomStats,
        combined: {
          totalRevenue: quickCheckinStats.todayRevenue + reservationStats.revenue.today,
          totalGuests: quickCheckinStats.activeCheckins + reservationStats.totalGuests,
          revenueComparison: revenueComparison.comparison
        }
      };

      setDashboardData(newDashboardData);
      setLastSeparatedUpdate(new Date());
      
      console.log('✅ Separated dashboard data loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading separated dashboard data:', error);
      // Mantener datos anteriores en caso de error
    } finally {
      setSeparatedLoading(false);
    }
  };

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
      loadSeparatedDashboardData();
      
    } catch (error) {
      console.error('Error in quick check-in:', error);
      alert('Error al procesar el check-in. Intenta nuevamente.');
    }
  };

  const handleRefresh = () => {
    refreshDashboard();
    loadSeparatedDashboardData();
  };

  // =============================================
  // NAVIGATION HELPERS
  // =============================================
  const navigateToReservations = () => {
    window.location.href = '/reservations';
  };

  const navigateToCheckin = () => {
    window.location.href = '/checkin';
  };

  const navigateToRooms = () => {
    window.location.href = '/rooms';
  };

  const navigateToReports = () => {
    window.location.href = '/reports';
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

  const isLoading = loading || separatedLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard del Hotel</h1>
          <p className="text-gray-600 mt-1">
            Bienvenido, {user?.name || 'Usuario'} - Vista consolidada de ambos sistemas
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
            Actualizado: {formatTime(lastSeparatedUpdate)}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={handleRefresh}
            disabled={isLoading}
            className={isLoading ? 'animate-spin' : ''}
          >
            {isLoading ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* ✅ Alerta del sistema dual */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-800">Sistema Dual Activo</h3>
            <p className="text-sm text-blue-700 mt-1">
              Este dashboard muestra estadísticas separadas para <strong>Quick Check-ins</strong> (walk-ins) y <strong>Reservaciones</strong> (planificadas).
              Cada sistema opera independientemente.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Check-in Rápido Walk-in */}
        {hasPermission('checkin', 'write') && (
          <Button
            variant="primary"
            className="h-12 bg-blue-600 hover:bg-blue-700"
            icon={UserCheck}
            onClick={navigateToCheckin}
          >
            Panel Recepción
          </Button>
        )}
        
        {/* Nueva Reserva */}
        {hasPermission('reservations', 'write') && (
          <Button
            variant="success"
            className="h-12 bg-green-600 hover:bg-green-700"
            icon={Calendar}
            onClick={navigateToReservations}
          >
            Nueva Reserva
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

      {/* ✅ Estadísticas de Quick Check-ins */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <UserCheck className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Quick Check-ins (Walk-in)</h2>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            Sin Reserva
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Check-ins Hoy"
            value={dashboardData.quickCheckins.today}
            subtitle="Huéspedes walk-in"
            icon={UserCheck}
            trend={occupancyTrend}
            color="blue"
            loading={separatedLoading}
          />
          
          <StatCard
            title="Check-ins Activos"
            value={dashboardData.quickCheckins.active}
            subtitle="Actualmente en hotel"
            icon={Bed}
            color="green"
            loading={separatedLoading}
          />
          
          <StatCard
            title="Ingresos Hoy"
            value={formatCurrency(dashboardData.quickCheckins.revenue)}
            subtitle="Walk-in solamente"
            icon={DollarSign}
            color="purple"
            loading={separatedLoading}
          />
          
          <StatCard
            title="Ingresos del Mes"
            value={formatCurrency(dashboardData.quickCheckins.monthlyRevenue)}
            subtitle="Quick check-ins"
            icon={TrendingUp}
            color="yellow"
            loading={separatedLoading}
          />
        </div>
      </div>

      {/* ✅ Estadísticas de Reservaciones */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Reservaciones (Planificadas)</h2>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Con Reserva
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Check-ins Hoy"
            value={dashboardData.reservations.today}
            subtitle="Reservas confirmadas"
            icon={Calendar}
            color="green"
            loading={separatedLoading}
          />
          
          <StatCard
            title="Huéspedes Activos"
            value={dashboardData.reservations.active}
            subtitle="Con reservación"
            icon={Users}
            color="purple"
            loading={separatedLoading}
          />
          
          <StatCard
            title="Ingresos Hoy"
            value={formatCurrency(dashboardData.reservations.revenue)}
            subtitle="Reservaciones solamente"
            icon={DollarSign}
            color="indigo"
            loading={separatedLoading}
          />
          
          <StatCard
            title="Ingresos del Mes"
            value={formatCurrency(dashboardData.reservations.monthlyRevenue)}
            subtitle="Reservaciones"
            icon={TrendingUp}
            color="violet"
            loading={separatedLoading}
          />
        </div>
      </div>

      {/* ✅ Estadísticas de Habitaciones Consolidadas */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Bed className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Estado de Habitaciones</h2>
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            Ambos Sistemas
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Total Habitaciones"
            value={dashboardData.rooms.total}
            icon={Bed}
            color="gray"
            loading={separatedLoading}
          />
          
          <StatCard
            title="Disponibles"
            value={dashboardData.rooms.available}
            subtitle="Listas para uso"
            icon={BarChart3}
            color="green"
            loading={separatedLoading}
          />
          
          <StatCard
            title="Ocupadas"
            value={dashboardData.rooms.occupied}
            subtitle="Ambos sistemas"
            icon={Users}
            color="red"
            loading={separatedLoading}
          />
          
          <StatCard
            title="Limpieza"
            value={dashboardData.rooms.cleaning}
            subtitle="Necesitan limpieza"
            icon={Clock}
            color="yellow"
            loading={separatedLoading}
          />
          
          <StatCard
            title="Ocupación"
            value={`${dashboardData.rooms.occupancyRate}%`}
            subtitle="Tasa general"
            icon={TrendingUp}
            color="blue"
            loading={separatedLoading}
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OccupancyChart data={occupancyData} loading={loading} />
        </div>
        <div>
          {/* ✅ Gráfico de comparación de ingresos por sistema */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Ingresos</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Quick Check-ins</span>
                  <span className="font-semibold text-blue-600">
                    {dashboardData.combined.revenueComparison.quickCheckinPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${dashboardData.combined.revenueComparison.quickCheckinPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Reservaciones</span>
                  <span className="font-semibold text-green-600">
                    {dashboardData.combined.revenueComparison.reservationPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${dashboardData.combined.revenueComparison.reservationPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(dashboardData.combined.totalRevenue)}
                  </div>
                  <div className="text-sm text-gray-500">Total Hoy</div>
                </div>
              </div>
            </div>
          </div>
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

      {/* ✅ Resumen Consolidado */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Resumen Consolidado</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ingresos Total */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Ingresos Total Hoy</p>
                <p className="text-3xl font-bold">{formatCurrency(dashboardData.combined.totalRevenue)}</p>
                <p className="text-purple-100 text-sm mt-1">Walk-in + Reservaciones</p>
              </div>
              <DollarSign className="w-12 h-12 text-purple-200" />
            </div>
          </div>

          {/* Huéspedes Totales */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Huéspedes Totales</p>
                <p className="text-3xl font-bold">{dashboardData.combined.totalGuests}</p>
                <p className="text-orange-100 text-sm mt-1">Activos en hotel</p>
              </div>
              <Users className="w-12 h-12 text-orange-200" />
            </div>
          </div>

          {/* Tasa de Ocupación */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Tasa de Ocupación</p>
                <p className="text-3xl font-bold">{dashboardData.rooms.occupancyRate}%</p>
                <p className="text-blue-100 text-sm mt-1">{dashboardData.rooms.occupied}/{dashboardData.rooms.total} habitaciones</p>
              </div>
              <BarChart3 className="w-12 h-12 text-blue-200" />
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

      {/* Footer del Dashboard */}
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Quick Check-ins: Sistema para walk-ins</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Reservaciones: Sistema para reservas planificadas</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Los sistemas operan independientemente para evitar conflictos entre walk-ins y reservas
        </p>
      </div>

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