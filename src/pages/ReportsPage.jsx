import React, { useState, useEffect, useCallback } from 'react';
import { useReports } from '../hooks/useReports';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3, TrendingUp, Calendar, Download, 
  Users, DollarSign, Home, AlertCircle,
  RefreshCw, Save, Eye, Trash2, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

const ReportsPage = () => {
  const { user, userInfo } = useAuth();
  const {
    loading,
    error,
    dashboardStats,
    occupancyData,
    revenueData,
    expensesData,
    dailyReports,
    savedReports,
    getDashboardStats,
    getOccupancyReport,
    getRevenueReport,
    getExpensesReport,
    getDailyReports,
    generateDailyReport,
    getSavedReports,
    saveReport,
    deleteSavedReport, // ✅ Nombre corregido
    exportToCSV,
    clearError,
    refreshCache,
    formatCurrency,
    formatDate,
    formatPercentage
  } = useReports();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [showSaveModal, setShowSaveModal] = useState(false);

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'occupancy', name: 'Ocupación', icon: Home },
    { id: 'revenue', name: 'Ingresos', icon: TrendingUp },
    { id: 'expenses', name: 'Gastos', icon: DollarSign },
    { id: 'daily', name: 'Reportes Diarios', icon: Calendar },
    { id: 'saved', name: 'Guardados', icon: Save }
  ];

  const branchId = userInfo?.user_branches?.[0]?.branch_id;
  const branchName = userInfo?.user_branches?.[0]?.branch?.name;

  useEffect(() => {
    if (branchId) {
      getDashboardStats(branchId);
      getSavedReports(userInfo?.id);
    }
  }, [branchId, userInfo?.id, getDashboardStats, getSavedReports]);

  useEffect(() => {
    if (!branchId) return;

    switch (activeTab) {
      case 'occupancy':
        getOccupancyReport(branchId, dateRange.startDate, dateRange.endDate);
        break;
      case 'revenue':
        getRevenueReport(branchId, dateRange.startDate, dateRange.endDate);
        break;
      case 'expenses':
        getExpensesReport(branchId, dateRange.startDate, dateRange.endDate);
        break;
      case 'daily':
        getDailyReports(branchId, dateRange.startDate, dateRange.endDate);
        break;
      default:
        break;
    }
  }, [activeTab, branchId, dateRange, getOccupancyReport, getRevenueReport, getExpensesReport, getDailyReports]);

  const handleDateChange = useCallback((field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleGenerateDailyReport = useCallback(async () => {
    if (!branchId) return;

    const result = await generateDailyReport(branchId);
    if (result) {
      toast.success('Reporte diario generado exitosamente');
    } else {
      toast.error('Error al generar reporte diario');
    }
  }, [branchId, generateDailyReport]);

  const handleExport = useCallback(async () => {
    if (!branchId) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `reporte_${activeTab}_${branchName?.replace(/\s+/g, '_')}_${timestamp}`;

    let success = false;
    let dataToExport = null;

    switch (activeTab) {
      case 'occupancy':
        dataToExport = occupancyData;
        break;
      case 'revenue':
        dataToExport = revenueData;
        break;
      case 'expenses':
        dataToExport = expensesData;
        break;
      case 'daily':
        dataToExport = dailyReports;
        break;
      default:
        toast.error('Tipo de reporte no soportado para exportación');
        return;
    }

    if (dataToExport) {
      success = await exportToCSV(activeTab, dataToExport, { filename });
    }

    if (success) {
      toast.success('Reporte exportado exitosamente');
    } else {
      toast.error('Error al exportar el reporte');
    }
  }, [activeTab, branchName, occupancyData, revenueData, expensesData, dailyReports, exportToCSV, branchId]);

  const handleSaveReport = useCallback(async (reportData) => {
    try {
      await saveReport({
        name: reportData.name,
        description: reportData.description,
        type: activeTab,
        parameters: {
          dateRange,
          branchId,
          branchName
        }
      }, userInfo.id);

      setShowSaveModal(false);
      toast.success('Reporte guardado exitosamente');
    } catch (err) {
      toast.error('Error al guardar reporte');
    }
  }, [activeTab, dateRange, branchId, branchName, userInfo?.id, saveReport]);

  const handleDeleteSavedReport = useCallback(async (reportId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
      return;
    }

    try {
      const result = await deleteSavedReport(reportId); // ✅ Nombre corregido
      if (result) {
        toast.success('Reporte eliminado exitosamente');
      } else {
        toast.error('Error al eliminar reporte');
      }
    } catch (err) {
      toast.error('Error al eliminar reporte');
    }
  }, [deleteSavedReport]);

  const handleRefresh = useCallback(() => {
    refreshCache();
    if (branchId) {
      getDashboardStats(branchId);
    }
  }, [branchId, getDashboardStats, refreshCache]);

  const DashboardStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-medium mb-2">Tasa de Ocupación</p>
            <p className="text-3xl font-bold text-blue-600">
              {formatPercentage(dashboardStats?.occupancy_rate)}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              {dashboardStats?.occupied_rooms} de {dashboardStats?.total_rooms} habitaciones
            </p>
          </div>
          <div className="p-4 bg-blue-100 rounded-2xl">
            <Home className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-medium mb-2">Ingresos Hoy</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(dashboardStats?.today_revenue)}
            </p>
            <p className="text-sm text-slate-600 mt-1">Últimas 24 horas</p>
          </div>
          <div className="p-4 bg-green-100 rounded-2xl">
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-medium mb-2">Check-ins/Outs Hoy</p>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold text-blue-600">{dashboardStats?.today_checkins}</p>
                <p className="text-xs text-slate-500">Entradas</p>
              </div>
              <div className="w-px h-8 bg-slate-300"></div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{dashboardStats?.today_checkouts}</p>
                <p className="text-xs text-slate-500">Salidas</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-purple-100 rounded-2xl">
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-medium mb-2">Reservas Pendientes</p>
            <p className="text-3xl font-bold text-orange-600">
              {dashboardStats?.pending_reservations}
            </p>
            <p className="text-sm text-slate-600 mt-1">Por confirmar</p>
          </div>
          <div className="p-4 bg-orange-100 rounded-2xl">
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!branchId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">No hay sucursal asignada</h2>
          <p className="text-slate-600">Contacta al administrador para asignar una sucursal a tu cuenta.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Reportes
                </h1>
                <p className="text-slate-600 mt-1">
                  {branchName || 'Sistema de reportes y estadísticas'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors disabled:opacity-50"
                title="Refrescar datos"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {activeTab !== 'dashboard' && activeTab !== 'saved' && (
                <>
                  <button
                    onClick={handleExport}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Download className="w-5 h-5" />
                    Exportar
                  </button>

                  <button
                    onClick={() => setShowSaveModal(true)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    Guardar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                <span className="text-red-800 font-medium">{error}</span>
              </div>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800 transition-colors text-xl"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 mb-8 overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {activeTab !== 'dashboard' && activeTab !== 'saved' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-500" />
                <span className="text-slate-700 font-medium">Rango de fechas:</span>
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Desde:</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Hasta:</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {activeTab === 'daily' && (
                  <div className="pt-6">
                    <button
                      onClick={handleGenerateDailyReport}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      Generar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-slate-600">Cargando reportes...</span>
              </div>
            </div>
          )}

          {!loading && (
            <>
              {activeTab === 'dashboard' && (
                <div className="p-8">
                  <DashboardStats />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-600 rounded-lg">
                          <Home className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">Estado de Habitaciones</h3>
                          <p className="text-sm text-slate-600">Disponibles: {dashboardStats?.available_rooms}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('occupancy')}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Ver Reporte de Ocupación
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-600 rounded-lg">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">Ingresos del Día</h3>
                          <p className="text-sm text-slate-600">{formatCurrency(dashboardStats?.today_revenue)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('revenue')}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        Ver Reporte de Ingresos
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-600 rounded-lg">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">Reportes Automáticos</h3>
                          <p className="text-sm text-slate-600">Generación diaria</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('daily')}
                        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                      >
                        Ver Reportes Diarios
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'occupancy' && (
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6">Reporte de Ocupación</h2>
                  
                  {occupancyData.length === 0 ? (
                    <div className="text-center py-12">
                      <Home className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">No hay datos de ocupación para el rango seleccionado</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-4 px-4 font-semibold text-slate-700">Fecha</th>
                            <th className="text-left py-4 px-4 font-semibold text-slate-700">Total</th>
                            <th className="text-left py-4 px-4 font-semibold text-slate-700">Ocupadas</th>
                            <th className="text-left py-4 px-4 font-semibold text-slate-700">Disponibles</th>
                            <th className="text-left py-4 px-4 font-semibold text-slate-700">Mantenimiento</th>
                            <th className="text-left py-4 px-4 font-semibold text-slate-700">Ocupación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {occupancyData.map((row, index) => (
                            <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4">{formatDate(row.report_date)}</td>
                              <td className="py-3 px-4">{row.total_rooms}</td>
                              <td className="py-3 px-4 text-red-600 font-semibold">{row.occupied_rooms}</td>
                              <td className="py-3 px-4 text-green-600 font-semibold">{row.available_rooms}</td>
                              <td className="py-3 px-4 text-orange-600">{row.maintenance_rooms}</td>
                              <td className="py-3 px-4 font-semibold">{formatPercentage(row.occupancy_percentage)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'revenue' && (
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6">Reporte de Ingresos</h2>
                  
                  {!revenueData ? (
                    <div className="text-center py-12">
                      <DollarSign className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">No hay datos de ingresos para el rango seleccionado</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                          <h3 className="font-semibold text-green-800 mb-4">Ingresos por Habitaciones</h3>
                          <p className="text-3xl font-bold text-green-600">
                            {formatCurrency(revenueData.room_revenue || 0)}
                          </p>
                        </div>

                        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                          <h3 className="font-semibold text-blue-800 mb-4">Ingresos por Servicios</h3>
                          <p className="text-3xl font-bold text-blue-600">
                            {formatCurrency(revenueData.service_revenue || 0)}
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                          <h3 className="font-semibold text-slate-800 mb-4">Total de Gastos</h3>
                          <p className="text-3xl font-bold text-red-600">
                            {formatCurrency(revenueData.total_expenses || 0)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
                          <h3 className="font-semibold text-indigo-800 mb-4">Ingresos Totales</h3>
                          <p className="text-4xl font-bold text-indigo-600">
                            {formatCurrency(revenueData.total_revenue || 0)}
                          </p>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
                          <h3 className="font-semibold text-slate-800 mb-4">Ganancia Neta</h3>
                          <p className={`text-4xl font-bold ${
                            (revenueData.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(revenueData.net_profit || 0)}
                          </p>
                          <p className="text-sm text-slate-600 mt-2">
                            Ingresos - Gastos del período
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'expenses' && (
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6">Reporte de Gastos</h2>
                  
                  {expensesData.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSign className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">No hay gastos registrados para el rango seleccionado</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-red-50 rounded-xl p-6 border border-red-200 mb-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-red-800 mb-2">Total de Gastos</h3>
                            <p className="text-3xl font-bold text-red-600">
                              {formatCurrency(expensesData.reduce((sum, expense) => sum + expense.amount, 0))}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-red-800 font-medium">{expensesData.length} transacciones</p>
                            <p className="text-sm text-red-600">
                              Promedio: {formatCurrency(expensesData.reduce((sum, expense) => sum + expense.amount, 0) / expensesData.length)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="text-left py-4 px-4 font-semibold text-slate-700">Fecha</th>
                              <th className="text-left py-4 px-4 font-semibold text-slate-700">Descripción</th>
                              <th className="text-left py-4 px-4 font-semibold text-slate-700">Monto</th>
                              <th className="text-left py-4 px-4 font-semibold text-slate-700">Categoría</th>
                              <th className="text-left py-4 px-4 font-semibold text-slate-700">Método</th>
                              <th className="text-left py-4 px-4 font-semibold text-slate-700">Creado por</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expensesData.map((expense) => (
                              <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4">{formatDate(expense.expense_date)}</td>
                                <td className="py-3 px-4">
                                  <div className="max-w-xs truncate" title={expense.description}>
                                    {expense.description}
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-semibold text-red-600">
                                  {formatCurrency(expense.amount)}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm">
                                    {expense.expense_categories?.name || 'Sin categoría'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-600">
                                  {expense.payment_methods?.name || 'N/A'}
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-600">
                                  {expense.created_by_user 
                                    ? `${expense.created_by_user.first_name} ${expense.created_by_user.last_name}`
                                    : 'N/A'
                                  }
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'daily' && (
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6">Reportes Diarios</h2>
                  
                  {dailyReports.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">No hay reportes diarios para el rango seleccionado</p>
                      <button
                        onClick={handleGenerateDailyReport}
                        disabled={loading}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        Generar Reporte de Hoy
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-4 px-4 font-semibold text-slate-700">Fecha</th>
                            <th className="text-left py-4 px-4 font-semibold text-slate-700">Check-ins</th>
                            <th className="text-left py-4 px-4 font-semibold text-slate-700">Check-outs</th>
                            <th className="text-left py-4 px-4 font-semibold text-slate-700">Ingresos</th>
                            <th className="text-left py-4 px-4 font-semibold text-slate-700">Gastos</th>
                            <th className="text-left py-4 px-4 font-semibold text-slate-700">Ocupación</th>
                            <th className="text-left py-4 px-4 font-semibold text-slate-700">Hab. Disp.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyReports.map((report) => (
                            <tr key={report.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4 font-medium">{formatDate(report.report_date)}</td>
                              <td className="py-3 px-4 text-blue-600 font-semibold">{report.total_checkins}</td>
                              <td className="py-3 px-4 text-purple-600 font-semibold">{report.total_checkouts}</td>
                              <td className="py-3 px-4 text-green-600 font-semibold">
                                {formatCurrency(report.total_revenue)}
                              </td>
                              <td className="py-3 px-4 text-red-600 font-semibold">
                                {formatCurrency(report.total_expenses)}
                              </td>
                              <td className="py-3 px-4 font-semibold">{formatPercentage(report.occupancy_rate)}</td>
                              <td className="py-3 px-4">{report.available_rooms}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'saved' && (
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6">Reportes Guardados</h2>
                  
                  {savedReports.length === 0 ? (
                    <div className="text-center py-12">
                      <Save className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">No tienes reportes guardados</p>
                      <p className="text-sm text-slate-500 mt-2">
                        Guarda reportes desde las otras pestañas para acceso rápido
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {savedReports.map((report) => (
                        <div key={report.id} className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-200">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-800">{report.name}</h3>
                                <p className="text-sm text-slate-500 capitalize">{report.report_type}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteSavedReport(report.id)}
                              className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                              title="Eliminar reporte"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {report.description && (
                            <p className="text-sm text-slate-600 mb-4">{report.description}</p>
                          )}

                          <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                            <span>Creado: {formatDate(report.created_at)}</span>
                            <span>
                              {report.created_by_user 
                                ? `${report.created_by_user.first_name} ${report.created_by_user.last_name}`
                                : 'N/A'
                              }
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              if (report.parameters?.dateRange) {
                                setDateRange(report.parameters.dateRange);
                              }
                              setActiveTab(report.report_type);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Reporte
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {showSaveModal && (
          <SaveReportModal
            onSave={handleSaveReport}
            onClose={() => setShowSaveModal(false)}
            reportType={activeTab}
          />
        )}

      </div>
    </div>
  );
};

const SaveReportModal = ({ onSave, onClose, reportType }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Guardar Reporte</h2>
            <p className="text-sm text-slate-600 capitalize">Tipo: {reportType}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre del reporte *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Reporte Semanal Ocupación"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe el propósito de este reporte..."
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportsPage;