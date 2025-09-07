import React, { useState, useEffect } from 'react';
import { adminService } from '../../lib/supabase-admin';
import { reportService } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  BarChart3,
  Download,
  Calendar,
  RefreshCw,
  DollarSign,
  Building,
  FileText
} from 'lucide-react';

// Importar componentes separados
import OverviewReport from '../../components/admin/report/OverviewReport';
import OccupancyReport from '../../components/admin/report/OccupancyReport';
import RevenueReport from '../../components/admin/report/RevenueReport';
import ExpensesReport from '../../components/admin/report/ExpensesReport';
import DailyReport from '../../components/admin/report/DailyReport';

const AdminReportsPage = () => {
  const { getPrimaryBranch, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días atrás
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    overview: null,
    occupancy: [],
    revenue: null,
    expenses: [],
    daily: []
  });

  const primaryBranch = getPrimaryBranch();

  useEffect(() => {
    if (isAdmin()) {
      loadInitialData();
    }
  }, []);

  useEffect(() => {
    if (branches.length > 0) {
      loadReportData();
    }
  }, [dateRange, selectedBranch, branches]);

  const loadInitialData = async () => {
    try {
      const branchesResult = await adminService.getAllBranches();
      setBranches(branchesResult.data?.filter(b => b.is_active) || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error al cargar datos iniciales');
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      const branchId = selectedBranch === 'all' ? primaryBranch?.id : selectedBranch;
      
      if (!branchId) {
        console.warn('No branch selected for reports');
        return;
      }

      const [
        occupancyResult,
        revenueResult,
        expensesResult,
        dailyResult
      ] = await Promise.all([
        reportService.getOccupancyReport(branchId, dateRange.startDate, dateRange.endDate),
        reportService.getRevenueReport(branchId, dateRange.startDate, dateRange.endDate),
        reportService.getExpensesReport(branchId, dateRange.startDate, dateRange.endDate),
        reportService.getDailyReports(branchId, dateRange.startDate, dateRange.endDate)
      ]);

      setReportData({
        overview: {
          totalRevenue: revenueResult.data?.total_revenue || 0,
          totalExpenses: revenueResult.data?.total_expenses || 0,
          netProfit: revenueResult.data?.net_profit || 0,
          averageOccupancy: occupancyResult.data?.length > 0 
            ? (occupancyResult.data.reduce((sum, day) => sum + parseFloat(day.occupancy_percentage || 0), 0) / occupancyResult.data.length).toFixed(1)
            : 0
        },
        occupancy: occupancyResult.data || [],
        revenue: revenueResult.data,
        expenses: expensesResult.data || [],
        daily: dailyResult.data || []
      });

    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('Error al cargar datos de reportes');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (reportType) => {
    try {
      let data;
      let filename;

      switch (reportType) {
        case 'occupancy':
          data = reportData.occupancy;
          filename = `ocupacion_${dateRange.startDate}_${dateRange.endDate}`;
          break;
        case 'revenue':
          data = reportData.revenue;
          filename = `ingresos_${dateRange.startDate}_${dateRange.endDate}`;
          break;
        case 'expenses':
          data = reportData.expenses;
          filename = `gastos_${dateRange.startDate}_${dateRange.endDate}`;
          break;
        case 'daily':
          data = reportData.daily;
          filename = `diario_${dateRange.startDate}_${dateRange.endDate}`;
          break;
        default:
          throw new Error('Tipo de reporte no válido');
      }

      const result = await reportService.exportToCSV(reportType, data, { filename });
      
      if (result.success) {
        toast.success('Reporte exportado exitosamente');
      } else {
        throw result.error;
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Error al exportar reporte');
    }
  };

  const reportTabs = [
    { id: 'overview', label: 'Resumen General', icon: BarChart3 },
    { id: 'occupancy', label: 'Ocupación', icon: Building },
    { id: 'revenue', label: 'Ingresos', icon: DollarSign },
    { id: 'expenses', label: 'Gastos', icon: FileText },
    { id: 'daily', label: 'Reportes Diarios', icon: Calendar }
  ];

  if (!isAdmin()) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600">Solo los administradores pueden acceder a los reportes avanzados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes Avanzados</h1>
          <p className="text-gray-600">
            Análisis detallado y reportes del sistema
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadReportData}
            disabled={loading}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las sucursales</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </input>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => exportReport(activeTab)}
              disabled={loading || !reportData[activeTab]}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {reportTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido de los reportes */}
      <div className="min-h-96">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Cargando reportes...</span>
          </div>
        ) : (
          <div>
            {activeTab === 'overview' && <OverviewReport data={reportData.overview} />}
            {activeTab === 'occupancy' && <OccupancyReport data={reportData.occupancy} />}
            {activeTab === 'revenue' && <RevenueReport data={reportData.revenue} />}
            {activeTab === 'expenses' && <ExpensesReport data={reportData.expenses} />}
            {activeTab === 'daily' && <DailyReport data={reportData.daily} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReportsPage;