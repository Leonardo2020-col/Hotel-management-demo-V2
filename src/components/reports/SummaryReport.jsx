import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Bed, 
  DollarSign, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Package,
  Download
} from 'lucide-react';
import Button from '../common/Button';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';
import { db } from '../../lib/supabase';

const SummaryReport = ({ dateRange = {}, selectedPeriod = 'thisMonth' }) => {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    revenue: {
      total: 0,
      growth: 0,
      trend: 'up'
    },
    occupancy: {
      rate: 0,
      totalRooms: 0,
      occupiedRooms: 0,
      availableRooms: 0
    },
    guests: {
      total: 0,
      new: 0,
      returning: 0,
      avgStay: 0
    },
    operations: {
      maintenanceIssues: 0,
      lowStockItems: 0,
      staffEfficiency: 0
    },
    financialMetrics: {
      adr: 0,
      revpar: 0,
      expenses: 0,
      profit: 0
    },
    alerts: []
  });

  useEffect(() => {
    fetchSummaryData();
  }, [dateRange?.startDate, dateRange?.endDate, selectedPeriod]);

  const fetchSummaryData = async () => {
    setLoading(true);
    try {
      console.log('📊 Loading summary data from Supabase...');
      
      // Cargar datos en paralelo
      const [
        roomsResult,
        reservationsResult,
        guestsResult,
        suppliesResult,
        dashboardResult
      ] = await Promise.all([
        db.getRooms(),
        db.getReservations({ limit: 1000 }),
        db.getGuests({ limit: 1000 }),
        db.getAllInventoryItems(),
        db.getAdvancedDashboardStats()
      ]);

      const rooms = roomsResult.data || [];
      const reservations = reservationsResult.data || [];
      const guests = guestsResult.data || [];
      const supplies = suppliesResult.data || [];
      const dashboardStats = dashboardResult.data || {};

      // Filtrar reservas por período
      const filteredReservations = filterReservationsByPeriod(reservations, dateRange);
      const completedReservations = filteredReservations.filter(r => r.status === 'checked_out');
      
      // Calcular estadísticas de habitaciones
      const totalRooms = rooms.length;
      const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
      const availableRooms = rooms.filter(r => r.status === 'available').length;
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
      
      // Calcular ingresos
      const totalRevenue = completedReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
      const previousPeriodRevenue = await calculatePreviousPeriodRevenue(reservations, dateRange);
      const revenueGrowth = previousPeriodRevenue > 0 
        ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
        : 0;
      
      // Calcular estadísticas de huéspedes
      const uniqueGuestIds = new Set(filteredReservations.map(r => r.guest_id));
      const totalGuests = uniqueGuestIds.size;
      
      // Calcular huéspedes nuevos vs recurrentes
      const guestStats = Array.from(uniqueGuestIds).map(guestId => {
        const guestReservations = reservations.filter(r => r.guest_id === guestId && r.status === 'checked_out');
        return {
          guestId,
          totalVisits: guestReservations.length,
          isNew: guestReservations.length <= 1
        };
      });
      
      const newGuests = guestStats.filter(g => g.isNew).length;
      const returningGuests = guestStats.filter(g => !g.isNew).length;
      
      // Estadía promedio
      const avgStay = completedReservations.length > 0 
        ? completedReservations.reduce((sum, r) => sum + (r.nights || calculateNights(r.check_in, r.check_out)), 0) / completedReservations.length
        : 0;
      
      // Issues de mantenimiento
      const maintenanceIssues = rooms.filter(r => 
        r.status === 'maintenance' || r.status === 'out_of_order'
      ).length;
      
      // Suministros con stock bajo
      const actualSupplies = supplies.filter(s => s.item_type !== 'snack');
      const lowStockItems = actualSupplies.filter(supply => {
        const current = supply.currentStock || supply.current_stock || 0;
        const min = supply.minStock || supply.min_stock || 0;
        return current <= min;
      }).length;
      
      // Métricas financieras
      const adr = completedReservations.length > 0
        ? completedReservations.reduce((sum, r) => sum + (r.rate || 0), 0) / completedReservations.length
        : 0;
      
      const revpar = adr * (occupancyRate / 100);
      const estimatedExpenses = totalRevenue * 0.65; // 65% de gastos operativos estimados
      const profit = totalRevenue - estimatedExpenses;
      
      // Generar alertas basadas en datos reales
      const alerts = generateAlerts({
        lowStockItems,
        maintenanceIssues,
        occupancyRate,
        revenueGrowth,
        totalRooms,
        occupiedRooms
      });

      setSummaryData({
        revenue: {
          total: totalRevenue,
          growth: Math.round(revenueGrowth * 10) / 10,
          trend: revenueGrowth >= 0 ? 'up' : 'down'
        },
        occupancy: {
          rate: Math.round(occupancyRate * 10) / 10,
          totalRooms,
          occupiedRooms,
          availableRooms
        },
        guests: {
          total: totalGuests,
          new: newGuests,
          returning: returningGuests,
          avgStay: Math.round(avgStay * 10) / 10
        },
        operations: {
          maintenanceIssues,
          lowStockItems,
          staffEfficiency: 94.2 // Valor estimado - se puede calcular con datos reales
        },
        financialMetrics: {
          adr: Math.round(adr * 100) / 100,
          revpar: Math.round(revpar * 100) / 100,
          expenses: estimatedExpenses,
          profit: profit
        },
        alerts
      });

      console.log('✅ Summary data loaded successfully');
      
    } catch (error) {
      console.error('❌ Error fetching summary data:', error);
      
      // Fallback con datos mock
      setSummaryData({
        revenue: { total: 0, growth: 0, trend: 'up' },
        occupancy: { rate: 0, totalRooms: 0, occupiedRooms: 0, availableRooms: 0 },
        guests: { total: 0, new: 0, returning: 0, avgStay: 0 },
        operations: { maintenanceIssues: 0, lowStockItems: 0, staffEfficiency: 0 },
        financialMetrics: { adr: 0, revpar: 0, expenses: 0, profit: 0 },
        alerts: [{ type: 'warning', message: 'Error al cargar datos', category: 'Sistema' }]
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      console.log('📄 Exporting summary report...');
      
      // Importar generador de PDF dinámicamente
      const { generateReportPDF } = await import('../../utils/pdfGenerator');
      
      const reportData = {
        title: 'Resumen General del Hotel',
        period: formatPeriod(dateRange),
        generatedAt: new Date().toLocaleString('es-PE'),
        summaryData,
        overviewStats: {
          avgOccupancy: summaryData.occupancy.rate,
          totalRevenue: summaryData.revenue.total,
          totalGuests: summaryData.guests.total,
          avgRate: summaryData.financialMetrics.adr
        }
      };
      
      await generateReportPDF('summary', reportData);
      
    } catch (error) {
      console.error('❌ Error exporting report:', error);
      alert('Error al exportar el reporte: ' + error.message);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'info': return <AlertCircle className="w-4 h-4 text-blue-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-lg">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-lg h-64">
                <div className="h-full bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Resumen General</h2>
            <p className="text-gray-600">
              Período: {formatPeriod(dateRange)}
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={Download}
          onClick={exportReport}
        >
          Exportar
        </Button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ingresos */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-green-100 text-sm font-medium mb-1">Ingresos Totales</p>
              <p className="text-2xl font-bold truncate">{formatCurrency(summaryData.revenue.total)}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="text-sm">
                  {summaryData.revenue.growth >= 0 ? '+' : ''}{summaryData.revenue.growth}% vs anterior
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Ocupación */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-blue-100 text-sm font-medium mb-1">Ocupación</p>
              <p className="text-2xl font-bold">{formatPercentage(summaryData.occupancy.rate)}</p>
              <p className="text-sm text-blue-100 mt-2">
                {summaryData.occupancy.occupiedRooms}/{summaryData.occupancy.totalRooms} habitaciones
              </p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <Bed className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Huéspedes */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl text-white p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-purple-100 text-sm font-medium mb-1">Total Huéspedes</p>
              <p className="text-2xl font-bold">{formatNumber(summaryData.guests.total)}</p>
              <p className="text-sm text-purple-100 mt-2">
                {formatNumber(summaryData.guests.new)} nuevos
              </p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Rentabilidad */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl text-white p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-orange-100 text-sm font-medium mb-1">Ganancia Neta</p>
              <p className="text-2xl font-bold truncate">{formatCurrency(summaryData.financialMetrics.profit)}</p>
              <p className="text-sm text-orange-100 mt-2">
                {summaryData.revenue.total > 0 ? formatPercentage((summaryData.financialMetrics.profit / summaryData.revenue.total) * 100) : '0%'} margen
              </p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Métricas financieras detalladas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">ADR (Tarifa Promedio)</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(summaryData.financialMetrics.adr)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">RevPAR</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(summaryData.financialMetrics.revpar)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Estadía Promedio</p>
              <p className="text-xl font-bold text-gray-900">{summaryData.guests.avgStay} días</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Eficiencia Personal</p>
              <p className="text-xl font-bold text-gray-900">{formatPercentage(summaryData.operations.staffEfficiency)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estado operacional y alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado operacional */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado Operacional</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bed className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Habitaciones Disponibles</p>
                  <p className="text-sm text-gray-600">Para check-in inmediato</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-600">{summaryData.occupancy.availableRooms}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Issues de Mantenimiento</p>
                  <p className="text-sm text-gray-600">Requieren atención</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-orange-600">{summaryData.operations.maintenanceIssues}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Package className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Stock Bajo</p>
                  <p className="text-sm text-gray-600">Items críticos</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-red-600">{summaryData.operations.lowStockItems}</span>
            </div>
          </div>
        </div>

        {/* Alertas y notificaciones */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas Importantes</h3>
          <div className="space-y-3">
            {summaryData.alerts.length > 0 ? (
              summaryData.alerts.map((alert, index) => (
                <div key={index} className={`border rounded-lg p-4 ${getAlertColor(alert.type)}`}>
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wide">
                          {alert.category}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No hay alertas importantes</p>
                <p className="text-sm">Todo funciona correctamente</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button variant="outline" size="sm" className="w-full">
              Ver Todas las Alertas
            </Button>
          </div>
        </div>
      </div>

      {/* Análisis comparativo */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Análisis Comparativo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <div className="w-full h-full rounded-full bg-gray-200">
                <div 
                  className="w-full h-full rounded-full bg-green-500 flex items-center justify-center text-white font-bold"
                  style={{ 
                    background: `conic-gradient(#10b981 0deg ${summaryData.occupancy.rate * 3.6}deg, #e5e7eb ${summaryData.occupancy.rate * 3.6}deg 360deg)` 
                  }}
                >
                  {formatPercentage(summaryData.occupancy.rate)}
                </div>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900">Ocupación Actual</p>
            <p className="text-xs text-gray-600">vs 75% objetivo</p>
          </div>

          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <div className="w-full h-full rounded-full bg-gray-200">
                <div 
                  className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center text-white font-bold"
                  style={{ 
                    background: `conic-gradient(#3b82f6 0deg ${summaryData.guests.total > 0 ? (summaryData.guests.new / summaryData.guests.total) * 360 : 0}deg, #e5e7eb ${summaryData.guests.total > 0 ? (summaryData.guests.new / summaryData.guests.total) * 360 : 0}deg 360deg)` 
                  }}
                >
                  {summaryData.guests.total > 0 ? formatPercentage((summaryData.guests.new / summaryData.guests.total) * 100) : '0%'}
                </div>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900">Huéspedes Nuevos</p>
            <p className="text-xs text-gray-600">del total de huéspedes</p>
          </div>

          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <div className="w-full h-full rounded-full bg-gray-200">
                <div 
                  className="w-full h-full rounded-full bg-purple-500 flex items-center justify-center text-white font-bold"
                  style={{ 
                    background: `conic-gradient(#8b5cf6 0deg ${summaryData.operations.staffEfficiency * 3.6}deg, #e5e7eb ${summaryData.operations.staffEfficiency * 3.6}deg 360deg)` 
                  }}
                >
                  {formatPercentage(summaryData.operations.staffEfficiency)}
                </div>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900">Eficiencia Personal</p>
            <p className="text-xs text-gray-600">vs 90% objetivo</p>
          </div>
        </div>
      </div>

      {/* Información del período */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Información del Período</h3>
            <p className="text-gray-600">
              Reporte generado el {new Date().toLocaleDateString('es-PE')} a las {new Date().toLocaleTimeString('es-PE')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Días analizados</p>
            <p className="text-2xl font-bold text-gray-900">
              {dateRange?.startDate && dateRange?.endDate 
                ? Math.ceil((dateRange.endDate - dateRange.startDate) / (1000 * 60 * 60 * 24)) 
                : 30}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================
// FUNCIONES AUXILIARES
// =============================================

function filterReservationsByPeriod(reservations, dateRange) {
  if (!dateRange?.startDate || !dateRange?.endDate) {
    // Si no hay rango, usar último mes
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    
    return reservations.filter(reservation => {
      const checkOut = new Date(reservation.checked_out_at || reservation.check_out);
      return checkOut >= start && checkOut <= end;
    });
  }
  
  const start = new Date(dateRange.startDate);
  const end = new Date(dateRange.endDate);
  
  return reservations.filter(reservation => {
    const checkIn = new Date(reservation.check_in);
    const checkOut = new Date(reservation.check_out);
    
    // Incluir si la reserva se solapa con el período
    return checkIn <= end && checkOut >= start;
  });
}

function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1;
  
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(1, diffDays);
}

async function calculatePreviousPeriodRevenue(reservations, dateRange) {
  if (!dateRange?.startDate || !dateRange?.endDate) {
    return 0;
  }
  
  const start = new Date(dateRange.startDate);
  const end = new Date(dateRange.endDate);
  const periodLength = end - start;
  
  const previousStart = new Date(start.getTime() - periodLength);
  const previousEnd = new Date(start.getTime());
  
  return reservations
    .filter(reservation => {
      if (reservation.status !== 'checked_out') return false;
      const checkOut = new Date(reservation.checked_out_at || reservation.check_out);
      return checkOut >= previousStart && checkOut < previousEnd;
    })
    .reduce((sum, r) => sum + (r.total_amount || 0), 0);
}

function generateAlerts({ lowStockItems, maintenanceIssues, occupancyRate, revenueGrowth, totalRooms, occupiedRooms }) {
  const alerts = [];
  
  if (lowStockItems > 0) {
    alerts.push({
      type: 'warning',
      message: `${lowStockItems} items con stock bajo requieren atención`,
      category: 'Suministros'
    });
  }
  
  if (maintenanceIssues > 0) {
    alerts.push({
      type: 'info',
      message: `${maintenanceIssues} habitaciones en mantenimiento`,
      category: 'Operaciones'
    });
  }
  
  if (occupancyRate >= 85) {
    alerts.push({
      type: 'success',
      message: `Ocupación excelente: ${occupancyRate.toFixed(1)}%`,
      category: 'Rendimiento'
    });
  } else if (occupancyRate < 50) {
    alerts.push({
      type: 'warning',
      message: `Ocupación baja: ${occupancyRate.toFixed(1)}% - revisar estrategia`,
      category: 'Rendimiento'
    });
  }
  
  if (revenueGrowth > 0) {
    alerts.push({
      type: 'success',
      message: `Crecimiento de ingresos: +${revenueGrowth.toFixed(1)}%`,
      category: 'Financiero'
    });
  } else if (revenueGrowth < -5) {
    alerts.push({
      type: 'warning',
      message: `Disminución de ingresos: ${revenueGrowth.toFixed(1)}%`,
      category: 'Financiero'
    });
  }
  
  // Alerta si hay muy pocas habitaciones disponibles
  const availableRooms = totalRooms - occupiedRooms;
  if (availableRooms <= 2 && totalRooms > 10) {
    alerts.push({
      type: 'info',
      message: `Solo ${availableRooms} habitaciones disponibles - considerar overbooking`,
      category: 'Operaciones'
    });
  }
  
  return alerts;
}

function formatPeriod(dateRange) {
  if (!dateRange?.startDate || !dateRange?.endDate) {
    return 'Último mes';
  }
  
  const start = new Date(dateRange.startDate).toLocaleDateString('es-PE');
  const end = new Date(dateRange.endDate).toLocaleDateString('es-PE');
  
  return `${start} - ${end}`;
}

export default SummaryReport;