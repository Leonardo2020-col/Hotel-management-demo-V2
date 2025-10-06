// src/pages/Admin/AdminReports.jsx - VERSIÓN FINAL CON MODAL FUNCIONAL
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../lib/supabase';
import toast from 'react-hot-toast';
import {
  BarChart3,
  Calendar,
  Download,
  FileText,
  DollarSign,
  RefreshCw,
  Plus
} from 'lucide-react';

// Importar componentes existentes
import OverviewReport from '../../components/admin/report/OverviewReport';
import DailyReport from '../../components/admin/report/DailyReport';
import RevenueReport from '../../components/admin/report/RevenueReport';
import ExpensesReport from '../../components/admin/report/ExpensesReport';
import ScheduleReportModal from '../../components/admin/report/ScheduleReportModal';

const AdminReports = () => {
  const { userInfo, isAdmin, getUserBranches } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    if (isAdmin()) {
      const userBranches = getUserBranches();
      setBranches(userBranches);
      if (userBranches.length > 0) {
        setSelectedBranch(userBranches[0].id);
      }
    }
  }, [isAdmin, getUserBranches]);

  useEffect(() => {
    if (selectedBranch && isAdmin()) {
      loadReportData();
    }
  }, [activeTab, selectedBranch, dateRange]);

  const loadReportData = async () => {
    if (!selectedBranch) {
      toast.error('Selecciona una sucursal');
      return;
    }
    
    setLoading(true);
    try {
      let result;
      
      switch (activeTab) {
        case 'overview':
          result = await generateOverviewData();
          break;
        case 'daily':
          result = await reportService.getDailyReports(selectedBranch, dateRange.startDate, dateRange.endDate);
          break;
        case 'revenue':
          result = await reportService.getRevenueReport(selectedBranch, dateRange.startDate, dateRange.endDate);
          break;
        case 'expenses':
          result = await reportService.getExpensesReport(selectedBranch, dateRange.startDate, dateRange.endDate);
          break;
        default:
          result = { data: null };
      }
      
      if (result.error) {
        console.error('Error loading report:', result.error);
        throw new Error(result.error.message || 'Error al cargar reporte');
      }
      
      setReportData(result.data || result);
      
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error(`Error: ${error.message || 'No se pudo cargar el reporte'}`);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const generateOverviewData = async () => {
  try {
    console.log('📊 Generating overview data...');
    
    const [revenueResult, expensesResult, statsResult] = await Promise.all([
      reportService.getRevenueReport(selectedBranch, dateRange.startDate, dateRange.endDate),
      reportService.getExpensesReport(selectedBranch, dateRange.startDate, dateRange.endDate),
      reportService.getDashboardStats(selectedBranch)
    ]);

    // Procesar revenue (puede ser JSON o objeto directo)
    let revenue = revenueResult.data || {};
    if (typeof revenue === 'string') {
      revenue = JSON.parse(revenue);
    }
    
    // Procesar expenses (siempre es array)
    const expenses = Array.isArray(expensesResult.data) ? expensesResult.data : [];
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    // Procesar stats (puede ser JSON o objeto directo)
    let stats = statsResult.data || {};
    if (typeof stats === 'string') {
      stats = JSON.parse(stats);
    }

    const totalRevenue = Number(revenue.total_revenue) || 0;
    const netProfit = totalRevenue - totalExpenses;
    const averageOccupancy = Number(stats.occupancy_rate) || 0;

    const overviewData = {
      totalRevenue: totalRevenue,
      totalExpenses: totalExpenses,
      netProfit: netProfit,
      averageOccupancy: averageOccupancy.toFixed(1)
    };

    console.log('✅ Overview data generated:', overviewData);
    return { data: overviewData };
    
  } catch (error) {
    console.error('❌ Error generating overview:', error);
    return {
      data: {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        averageOccupancy: '0.0'
      }
    };
  }
};

  const handleExportReport = async () => {
    if (!reportData) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      const result = await reportService.exportToCSV(activeTab, reportData, {
        filename: `reporte_${activeTab}_${selectedBranch}_${new Date().toISOString().split('T')[0]}`
      });

      if (result.success) {
        toast.success('Reporte exportado exitosamente');
      } else {
        toast.error('Error al exportar el reporte');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Función de exportación no disponible');
    }
  };

  const tabs = [
    { id: 'overview', name: 'Resumen General', icon: BarChart3 },
    { id: 'daily', name: 'Reportes Diarios', icon: Calendar },
    { id: 'revenue', name: 'Ingresos', icon: DollarSign },
    { id: 'expenses', name: 'Gastos', icon: FileText }
  ];

  if (!isAdmin()) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">
            No tienes permisos para acceder a los reportes avanzados.
          </p>
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
            Análisis detallado de operaciones y rendimiento
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExportReport}
            disabled={!reportData || loading}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </button>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sucursal
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar sucursal</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenido del reporte */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Cargando reporte...</span>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && <OverviewReport data={reportData} />}
              {activeTab === 'daily' && <DailyReport data={reportData} />}
              {activeTab === 'revenue' && <RevenueReport data={reportData} />}
              {activeTab === 'expenses' && <ExpensesReport data={reportData} />}
            </>
          )}
        </div>
      </div>

      {/* Reportes programados */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Reportes Programados</h3>
            <button 
              className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => setShowScheduleModal(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Programar Reporte
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reportes programados</h3>
            <p className="text-gray-500">
              Programa reportes automáticos para recibir análisis periódicos
            </p>
          </div>
        </div>
      </div>

      {/* Modal de programación */}
      <ScheduleReportModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        branches={branches}
      />
    </div>
  );
};

export default AdminReports;