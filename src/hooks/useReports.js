import { useState, useCallback, useRef } from 'react';
import { supabase, reportService } from '../lib/supabase';

export const useReports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [occupancyData, setOccupancyData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [expensesData, setExpensesData] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [savedReports, setSavedReports] = useState([]);

  // Cache para evitar llamadas innecesarias
  const cacheRef = useRef({
    dashboardStats: { data: null, timestamp: 0 },
    occupancy: { data: null, timestamp: 0 },
    revenue: { data: null, timestamp: 0 }
  });
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // Limpiar error automáticamente
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ===================================================
  // ESTADÍSTICAS DEL DASHBOARD
  // ===================================================
  const getDashboardStats = useCallback(async (branchId) => {
    try {
      const now = Date.now();
      const cache = cacheRef.current.dashboardStats;
      
      // Usar cache si es reciente
      if (cache.data && (now - cache.timestamp) < CACHE_DURATION) {
        console.log('📊 Using cached dashboard stats');
        setDashboardStats(cache.data);
        return cache.data;
      }

      setLoading(true);
      setError(null);

      console.log('📊 Fetching dashboard stats for branch:', branchId);

      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        branch_uuid: branchId
      });

      if (error) throw error;

      const stats = data?.[0] || {
        total_rooms: 0,
        occupied_rooms: 0,
        available_rooms: 0,
        maintenance_rooms: 0,
        occupancy_rate: 0,
        today_checkins: 0,
        today_checkouts: 0,
        today_revenue: 0,
        pending_reservations: 0,
        low_stock_items: 0
      };

      console.log('✅ Dashboard stats loaded:', stats);

      // Actualizar cache
      cacheRef.current.dashboardStats = {
        data: stats,
        timestamp: now
      };

      setDashboardStats(stats);
      return stats;
    } catch (err) {
      console.error('❌ Error fetching dashboard stats:', err);
      setError(err.message || 'Error al cargar estadísticas');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // REPORTES DE OCUPACIÓN
  // ===================================================
  const getOccupancyReport = useCallback(async (branchId, startDate, endDate) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🏨 Fetching occupancy report:', { branchId, startDate, endDate });

      const { data, error } = await supabase
        .from('occupancy_reports')
        .select('*')
        .eq('branch_id', branchId)
        .gte('report_date', startDate)
        .lte('report_date', endDate)
        .order('report_date', { ascending: true });

      if (error) throw error;

      console.log('✅ Occupancy data loaded:', data?.length || 0, 'records');
      setOccupancyData(data || []);
      return data || [];
    } catch (err) {
      console.error('❌ Error fetching occupancy report:', err);
      setError(err.message || 'Error al cargar reporte de ocupación');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // REPORTES DE INGRESOS
  // ===================================================
  const getRevenueReport = useCallback(async (branchId, startDate, endDate, period = 'daily') => {
    try {
      setLoading(true);
      setError(null);

      console.log('💰 Fetching revenue report:', { branchId, startDate, endDate, period });

      // Usar la función de la base de datos
      const { data, error } = await supabase.rpc('calculate_revenue_by_period', {
        branch_uuid: branchId,
        start_date: startDate,
        end_date: endDate
      });

      if (error) throw error;

      console.log('✅ Revenue data calculated:', data?.[0]);
      
      const revenueStats = data?.[0] || {
        room_revenue: 0,
        service_revenue: 0,
        total_revenue: 0,
        total_expenses: 0,
        net_profit: 0
      };

      setRevenueData([revenueStats]);
      return revenueStats;
    } catch (err) {
      console.error('❌ Error fetching revenue report:', err);
      setError(err.message || 'Error al cargar reporte de ingresos');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // REPORTES DE GASTOS
  // ===================================================
  const getExpensesReport = useCallback(async (branchId, startDate, endDate) => {
    try {
      setLoading(true);
      setError(null);

      console.log('💸 Fetching expenses report:', { branchId, startDate, endDate });

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id,
          description,
          amount,
          expense_date,
          created_at,
          expense_categories(name),
          payment_methods(name),
          created_by_user:created_by(first_name, last_name)
        `)
        .eq('branch_id', branchId)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .order('expense_date', { ascending: false });

      if (error) throw error;

      console.log('✅ Expenses data loaded:', data?.length || 0, 'records');
      setExpensesData(data || []);
      return data || [];
    } catch (err) {
      console.error('❌ Error fetching expenses report:', err);
      setError(err.message || 'Error al cargar reporte de gastos');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // REPORTES DIARIOS
  // ===================================================
  const getDailyReports = useCallback(async (branchId, startDate, endDate) => {
    try {
      setLoading(true);
      setError(null);

      console.log('📅 Fetching daily reports:', { branchId, startDate, endDate });

      const { data, error } = await supabase
        .from('daily_reports')
        .select(`
          *,
          branch:branch_id(name),
          generated_by_user:generated_by(first_name, last_name)
        `)
        .eq('branch_id', branchId)
        .gte('report_date', startDate)
        .lte('report_date', endDate)
        .order('report_date', { ascending: false });

      if (error) throw error;

      console.log('✅ Daily reports loaded:', data?.length || 0, 'records');
      setDailyReports(data || []);
      return data || [];
    } catch (err) {
      console.error('❌ Error fetching daily reports:', err);
      setError(err.message || 'Error al cargar reportes diarios');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // GENERAR REPORTE DIARIO
  // ===================================================
  const generateDailyReport = useCallback(async (branchId, reportDate = null) => {
    try {
      setLoading(true);
      setError(null);

      const targetDate = reportDate || new Date().toISOString().split('T')[0];
      console.log('🔄 Generating daily report for:', targetDate);

      // Usar la función de la base de datos
      const { error } = await supabase.rpc('generate_daily_report', {
        branch_uuid: branchId,
        report_date_param: targetDate
      });

      if (error) throw error;

      console.log('✅ Daily report generated successfully');
      
      // Refrescar los datos
      await getDailyReports(branchId, targetDate, targetDate);
      
      return true;
    } catch (err) {
      console.error('❌ Error generating daily report:', err);
      setError(err.message || 'Error al generar reporte diario');
      return false;
    } finally {
      setLoading(false);
    }
  }, [getDailyReports]);

  // ===================================================
  // REPORTES GUARDADOS
  // ===================================================
  const getSavedReports = useCallback(async (userId = null) => {
    try {
      setLoading(true);
      setError(null);

      console.log('💾 Fetching saved reports for user:', userId);

      let query = supabase
        .from('saved_reports')
        .select(`
          *,
          created_by_user:created_by(first_name, last_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('created_by', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('✅ Saved reports loaded:', data?.length || 0, 'reports');
      setSavedReports(data || []);
      return data || [];
    } catch (err) {
      console.error('❌ Error fetching saved reports:', err);
      setError(err.message || 'Error al cargar reportes guardados');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // GUARDAR REPORTE
  // ===================================================
  const saveReport = useCallback(async (reportData, userId) => {
    try {
      setLoading(true);
      setError(null);

      console.log('💾 Saving report:', reportData.name);

      const { data, error } = await supabase
        .from('saved_reports')
        .insert({
          name: reportData.name,
          description: reportData.description || null,
          report_type: reportData.type,
          parameters: reportData.parameters || {},
          schedule: reportData.schedule || {},
          created_by: userId,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Report saved successfully:', data.id);
      
      // Actualizar lista local
      setSavedReports(prev => [data, ...prev]);
      
      return data;
    } catch (err) {
      console.error('❌ Error saving report:', err);
      setError(err.message || 'Error al guardar reporte');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // ELIMINAR REPORTE GUARDADO
  // ===================================================
  const deleteSavedReport = useCallback(async (reportId) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🗑️ Deleting saved report:', reportId);

      const { error } = await supabase
        .from('saved_reports')
        .update({ is_active: false })
        .eq('id', reportId);

      if (error) throw error;

      console.log('✅ Report deleted successfully');
      
      // Actualizar lista local
      setSavedReports(prev => prev.filter(report => report.id !== reportId));
      
      return true;
    } catch (err) {
      console.error('❌ Error deleting report:', err);
      setError(err.message || 'Error al eliminar reporte');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // EXPORTAR REPORTE A CSV
  // ===================================================
  const exportToCSV = useCallback(async (reportType, data, filename) => {
    try {
      console.log('📤 Exporting to CSV:', reportType, filename);

      let csvContent = '';
      
      switch (reportType) {
        case 'occupancy':
          csvContent = [
            'Fecha,Total Habitaciones,Ocupadas,Disponibles,Mantenimiento,Tasa de Ocupación (%)',
            ...data.map(row => [
              row.report_date,
              row.total_rooms,
              row.occupied_rooms,
              row.available_rooms,
              row.maintenance_rooms,
              row.occupancy_percentage
            ].join(','))
          ].join('\n');
          break;

        case 'revenue':
          csvContent = [
            'Concepto,Monto',
            `Ingresos por Habitaciones,${data.room_revenue || 0}`,
            `Ingresos por Servicios,${data.service_revenue || 0}`,
            `Total Ingresos,${data.total_revenue || 0}`,
            `Total Gastos,${data.total_expenses || 0}`,
            `Ganancia Neta,${data.net_profit || 0}`
          ].join('\n');
          break;

        case 'expenses':
          csvContent = [
            'Fecha,Descripción,Monto,Categoría,Método de Pago,Creado Por',
            ...data.map(row => [
              row.expense_date,
              `"${row.description}"`,
              row.amount,
              row.expense_categories?.name || '',
              row.payment_methods?.name || '',
              row.created_by_user ? `${row.created_by_user.first_name} ${row.created_by_user.last_name}` : ''
            ].join(','))
          ].join('\n');
          break;

        case 'daily':
          csvContent = [
            'Fecha,Check-ins,Check-outs,Ingresos,Gastos,Tasa Ocupación (%),Habitaciones Disponibles,Ocupadas,Mantenimiento',
            ...data.map(row => [
              row.report_date,
              row.total_checkins,
              row.total_checkouts,
              row.total_revenue,
              row.total_expenses,
              row.occupancy_rate,
              row.available_rooms,
              row.occupied_rooms,
              row.maintenance_rooms
            ].join(','))
          ].join('\n');
          break;

        default:
          throw new Error('Tipo de reporte no soportado para exportación');
      }

      // Crear y descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('✅ CSV exported successfully:', filename);
      return true;
    } catch (err) {
      console.error('❌ Error exporting CSV:', err);
      setError(err.message || 'Error al exportar CSV');
      return false;
    }
  }, []);

  // ===================================================
  // UTILIDADES
  // ===================================================
  const refreshCache = useCallback(() => {
    console.log('🔄 Clearing reports cache');
    cacheRef.current = {
      dashboardStats: { data: null, timestamp: 0 },
      occupancy: { data: null, timestamp: 0 },
      revenue: { data: null, timestamp: 0 }
    };
  }, []);

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount || 0);
  }, []);

  const formatDate = useCallback((date) => {
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
    occupancyData,
    revenueData,
    expensesData,
    dailyReports,
    savedReports,

    // Acciones principales
    getDashboardStats,
    getOccupancyReport,
    getRevenueReport,
    getExpensesReport,
    getDailyReports,
    generateDailyReport,
    getSavedReports,
    saveReport,
    deleteSavedReport,
    exportToCSV,

    // Utilidades
    clearError,
    refreshCache,
    formatCurrency,
    formatDate,
    formatPercentage,

    // Estados auxiliares
    hasData: dashboardStats !== null,
    isEmpty: !loading && !dashboardStats && !error
  };
};