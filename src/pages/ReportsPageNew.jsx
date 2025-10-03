// =====================================================
// PÁGINA DE REPORTES V2 - SIMPLIFICADA Y FUNCIONAL
// =====================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useReportsNew } from '../hooks/useReportsNew';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3, TrendingUp, Calendar, Download,
  Users, DollarSign, Home, AlertCircle, RefreshCw
} from 'lucide-react';

const ReportsPageNew = () => {
  const { userInfo } = useAuth();
  const {
    loading,
    error,
    dashboardStats,
    revenueData,
    expensesData,
    dailyReports,
    getDashboardStats,
    getRevenueReport,
    getExpensesReport,
    getDailyReports,
    generateDailyReport,
    exportToCSV,
    clearError,
    formatCurrency,
    formatDate,
    formatPercentage
  } = useReportsNew();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const branchId = userInfo?.user_branches?.[0]?.branch_id;
  const branchName = userInfo?.user_branches?.[0]?.branch?.name;

  // Cargar dashboard al montar
  useEffect(() => {
    if (branchId) {
      console.log('🔄 Loading dashboard stats for branch:', branchId);
      getDashboardStats(branchId);
    }
  }, [branchId, getDashboardStats]);

  // Cargar datos según tab activo
  useEffect(() => {
    if (!branchId) return;

    switch (activeTab) {
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
  }, [activeTab, branchId, dateRange, getRevenueReport, getExpensesReport, getDailyReports]);

  const handleRefresh = useCallback(() => {
    if (branchId) {
      getDashboardStats(branchId);
    }
  }, [branchId, getDashboardStats]);

  const handleGenerateDaily = useCallback(async () => {
    if (!branchId) return;
    await generateDailyReport(branchId, null, userInfo?.id);
  }, [branchId, userInfo?.id, generateDailyReport]);

  const handleExport = useCallback(() => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `reporte_${activeTab}_${branchName?.replace(/\s+/g, '_')}_${timestamp}`;

    let dataToExport = null;
    switch (activeTab) {
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
        return;
    }

    if (dataToExport) {
      exportToCSV(activeTab, dataToExport, filename);
    }
  }, [activeTab, branchName, revenueData, expensesData, dailyReports, exportToCSV]);

  if (!branchId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">No hay sucursal asignada</h2>
          <p className="text-slate-600">Contacta al administrador para configurar tu cuenta.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'revenue', name: 'Ingresos', icon: TrendingUp },
    { id: 'expenses', name: 'Gastos', icon: DollarSign },
    { id: 'daily', name: 'Reportes Diarios', icon: Calendar }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
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
                <p className="text-slate-600 mt-1">{branchName || 'Sistema de reportes'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors disabled:opacity-50"
                title="Refrescar"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {activeTab !== 'dashboard' && (
                <button
                  onClick={handleExport}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  <Download className="w-5 h-5" />
                  Exportar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
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

        {/* Tabs */}
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

        {/* Date Range Filter */}
        {activeTab !== 'dashboard' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-500" />
                <span className="text-slate-700 font-medium">Período:</span>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Desde:</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-600 mb-1">Hasta:</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {activeTab === 'daily' && (
                  <div className="pt-6">
                    <button
                      onClick={handleGenerateDaily}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      Generar Hoy
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-slate-600">Cargando...</span>
              </div>
            </div>
          )}

          {!loading && activeTab === 'dashboard' && (
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Tasa de Ocupación"
                  value={formatPercentage(dashboardStats?.occupancy_rate)}
                  subtitle={`${dashboardStats?.occupied_rooms || 0} de ${dashboardStats?.total_rooms || 0} habitaciones`}
                  icon={Home}
                  color="blue"
                />

                <StatCard
                  title="Habitaciones Disponibles"
                  value={dashboardStats?.available_rooms || 0}
                  subtitle="Para reservar"
                  icon={Home}
                  color="green"
                />

                <StatCard
                  title="Check-ins Hoy"
                  value={dashboardStats?.today_checkins || 0}
                  subtitle="Entradas"
                  icon={Users}
                  color="purple"
                />

                <StatCard
                  title="Reservas Pendientes"
                  value={dashboardStats?.pending_reservations || 0}
                  subtitle="Por confirmar"
                  icon={AlertCircle}
                  color="orange"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={() => setActiveTab('revenue')}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 hover:shadow-lg transition-all"
                >
                  <TrendingUp className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold text-slate-800 mb-1">Reporte de Ingresos</h3>
                  <p className="text-sm text-slate-600">Ver análisis financiero</p>
                </button>

                <button
                  onClick={() => setActiveTab('expenses')}
                  className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200 hover:shadow-lg transition-all"
                >
                  <DollarSign className="w-8 h-8 text-red-600 mb-3" />
                  <h3 className="font-semibold text-slate-800 mb-1">Reporte de Gastos</h3>
                  <p className="text-sm text-slate-600">Ver gastos detallados</p>
                </button>

                <button
                  onClick={() => setActiveTab('daily')}
                  className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 hover:shadow-lg transition-all"
                >
                  <Calendar className="w-8 h-8 text-purple-600 mb-3" />
                  <h3 className="font-semibold text-slate-800 mb-1">Reportes Diarios</h3>
                  <p className="text-sm text-slate-600">Resumen por día</p>
                </button>
              </div>
            </div>
          )}

          {!loading && activeTab === 'revenue' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Reporte de Ingresos</h2>

              {!revenueData ? (
                <EmptyState message="No hay datos de ingresos" />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <MetricCard
                      title="Ingresos por Habitaciones"
                      value={formatCurrency(revenueData.room_revenue)}
                      color="green"
                    />
                    <MetricCard
                      title="Ingresos por Servicios"
                      value={formatCurrency(revenueData.service_revenue)}
                      color="blue"
                    />
                    <MetricCard
                      title="Total de Gastos"
                      value={formatCurrency(revenueData.total_expenses)}
                      color="red"
                    />
                  </div>

                  <div className="space-y-4">
                    <MetricCard
                      title="Ingresos Totales"
                      value={formatCurrency(revenueData.total_revenue)}
                      color="indigo"
                      large
                    />
                    <MetricCard
                      title="Ganancia Neta"
                      value={formatCurrency(revenueData.net_profit)}
                      color={(revenueData.net_profit || 0) >= 0 ? 'green' : 'red'}
                      large
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === 'expenses' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Reporte de Gastos</h2>

              {expensesData.length === 0 ? (
                <EmptyState message="No hay gastos registrados" />
              ) : (
                <>
                  <div className="bg-red-50 rounded-xl p-6 border border-red-200 mb-6">
                    <h3 className="font-semibold text-red-800 mb-2">Total de Gastos</h3>
                    <p className="text-3xl font-bold text-red-600">
                      {formatCurrency(expensesData.reduce((sum, e) => sum + e.amount, 0))}
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      {expensesData.length} transacciones
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-4 px-4 font-semibold text-slate-700">Fecha</th>
                          <th className="text-left py-4 px-4 font-semibold text-slate-700">Descripción</th>
                          <th className="text-left py-4 px-4 font-semibold text-slate-700">Monto</th>
                          <th className="text-left py-4 px-4 font-semibold text-slate-700">Categoría</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expensesData.map((expense) => (
                          <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4">{formatDate(expense.expense_date)}</td>
                            <td className="py-3 px-4">{expense.description}</td>
                            <td className="py-3 px-4 font-semibold text-red-600">
                              {formatCurrency(expense.amount)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm">
                                {expense.expense_categories?.name || 'N/A'}
                              </span>
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

          {!loading && activeTab === 'daily' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Reportes Diarios</h2>

              {dailyReports.length === 0 ? (
                <EmptyState
                  message="No hay reportes diarios"
                  action={
                    <button
                      onClick={handleGenerateDaily}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Generar Reporte de Hoy
                    </button>
                  }
                />
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600 bg-blue-100 text-blue-600',
    green: 'from-green-500 to-green-600 bg-green-100 text-green-600',
    purple: 'from-purple-500 to-purple-600 bg-purple-100 text-purple-600',
    orange: 'from-orange-500 to-orange-600 bg-orange-100 text-orange-600'
  };

  const [gradient, bg, text] = colors[color].split(' ');

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 font-medium mb-2">{title}</p>
          <p className={`text-3xl font-bold ${text}`}>{value}</p>
          {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-4 ${bg} rounded-2xl`}>
          <Icon className={`w-8 h-8 ${text}`} />
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, color, large }) => {
  const colors = {
    green: 'bg-green-50 border-green-200 text-green-600',
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600'
  };

  return (
    <div className={`${colors[color]} border rounded-xl p-6`}>
      <h3 className="font-semibold text-slate-700 mb-2">{title}</h3>
      <p className={`font-bold ${colors[color].split(' ')[2]} ${large ? 'text-4xl' : 'text-3xl'}`}>
        {value}
      </p>
    </div>
  );
};

const EmptyState = ({ message, action }) => (
  <div className="text-center py-12">
    <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
    <p className="text-slate-600">{message}</p>
    {action}
  </div>
);

export default ReportsPageNew;
