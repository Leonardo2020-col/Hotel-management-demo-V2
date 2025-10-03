// =====================================================
// HOOK useReports V2 - SIMPLIFICADO Y FUNCIONAL
// =====================================================
import { useState, useCallback } from 'react';
import { reportsService } from '../services/reportsService';
import toast from 'react-hot-toast';

export const useReportsNew = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [expensesData, setExpensesData] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);

  // ===================================================
  // DASHBOARD STATS
  // ===================================================
  const getDashboardStats = useCallback(async (branchId) => {
    if (!branchId) {
      console.warn('⚠️ getDashboardStats: No branch ID provided');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await reportsService.getDashboardStats(branchId);

      if (err) throw err;

      setDashboardStats(data);
      return data;
    } catch (err) {
      const errorMsg = err?.message || 'Error al cargar estadísticas';
      console.error('❌ getDashboardStats error:', errorMsg);
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // REVENUE REPORT
  // ===================================================
  const getRevenueReport = useCallback(async (branchId, startDate, endDate) => {
    if (!branchId || !startDate || !endDate) {
      console.warn('⚠️ getRevenueReport: Missing parameters');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await reportsService.getRevenueReport(
        branchId,
        startDate,
        endDate
      );

      if (err) throw err;

      setRevenueData(data);
      return data;
    } catch (err) {
      const errorMsg = err?.message || 'Error al cargar reporte de ingresos';
      console.error('❌ getRevenueReport error:', errorMsg);
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // EXPENSES REPORT
  // ===================================================
  const getExpensesReport = useCallback(async (branchId, startDate, endDate) => {
    if (!branchId || !startDate || !endDate) {
      console.warn('⚠️ getExpensesReport: Missing parameters');
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await reportsService.getExpensesReport(
        branchId,
        startDate,
        endDate
      );

      if (err) throw err;

      setExpensesData(data);
      return data;
    } catch (err) {
      const errorMsg = err?.message || 'Error al cargar gastos';
      console.error('❌ getExpensesReport error:', errorMsg);
      setError(errorMsg);
      toast.error(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // DAILY REPORTS
  // ===================================================
  const getDailyReports = useCallback(async (branchId, startDate, endDate) => {
    if (!branchId || !startDate || !endDate) {
      console.warn('⚠️ getDailyReports: Missing parameters');
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await reportsService.getDailyReports(
        branchId,
        startDate,
        endDate
      );

      if (err) throw err;

      setDailyReports(data);
      return data;
    } catch (err) {
      const errorMsg = err?.message || 'Error al cargar reportes diarios';
      console.error('❌ getDailyReports error:', errorMsg);
      setError(errorMsg);
      toast.error(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // GENERATE DAILY REPORT
  // ===================================================
  const generateDailyReport = useCallback(async (branchId, reportDate = null, userId = null) => {
    if (!branchId) {
      console.warn('⚠️ generateDailyReport: No branch ID');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await reportsService.generateDailyReport(
        branchId,
        reportDate,
        userId
      );

      if (err) throw err;

      toast.success('Reporte diario generado exitosamente');

      // Refrescar la lista de reportes
      const targetDate = reportDate || new Date().toISOString().split('T')[0];
      await getDailyReports(branchId, targetDate, targetDate);

      return true;
    } catch (err) {
      const errorMsg = err?.message || 'Error al generar reporte diario';
      console.error('❌ generateDailyReport error:', errorMsg);
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [getDailyReports]);

  // ===================================================
  // EXPORT TO CSV
  // ===================================================
  const exportToCSV = useCallback((reportType, data, filename = null) => {
    const { success, error: err } = reportsService.exportToCSV(reportType, data, filename);

    if (success) {
      toast.success('Reporte exportado exitosamente');
    } else {
      toast.error(err?.message || 'Error al exportar reporte');
    }

    return success;
  }, []);

  // ===================================================
  // UTILIDADES
  // ===================================================
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount || 0);
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE');
  }, []);

  const formatPercentage = useCallback((value) => {
    return `${(value || 0).toFixed(1)}%`;
  }, []);

  return {
    // Estados
    loading,
    error,
    dashboardStats,
    revenueData,
    expensesData,
    dailyReports,

    // Acciones
    getDashboardStats,
    getRevenueReport,
    getExpensesReport,
    getDailyReports,
    generateDailyReport,
    exportToCSV,

    // Utilidades
    clearError,
    formatCurrency,
    formatDate,
    formatPercentage,

    // Estados auxiliares
    hasData: dashboardStats !== null,
    isEmpty: !loading && !dashboardStats && !error
  };
};

export default useReportsNew;
