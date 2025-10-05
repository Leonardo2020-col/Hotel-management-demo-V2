// src/hooks/useReports.js - VERSIÓN CORREGIDA
import { useState, useEffect, useCallback } from 'react';
import { reportService } from '../lib/supabase'; // ✅ Importar correctamente
import { useAuth } from '../context/AuthContext';

export const useReports = () => {
  const { userInfo, getPrimaryBranch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [expensesData, setExpensesData] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);

  // ✅ CORRECCIÓN: Obtener branch_id correctamente
  const primaryBranch = getPrimaryBranch();
  const branchId = primaryBranch?.id;

  // ✅ Cargar estadísticas del dashboard
  const loadDashboardStats = useCallback(async () => {
    if (!branchId) {
      console.warn('⚠️ No branch ID available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📊 Loading dashboard stats for reports...');
      
      const { data, error } = await reportService.getDashboardStats(branchId);

      if (error) throw error;

      console.log('✅ Dashboard stats loaded:', data);
      setDashboardStats(data);
    } catch (err) {
      const errorMessage = err.message || 'Error al cargar estadísticas';
      setError(errorMessage);
      console.error('❌ Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  // ✅ Cargar reporte de ingresos
  const loadRevenueReport = useCallback(async (startDate, endDate) => {
    if (!branchId) {
      console.warn('⚠️ No branch ID available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('💰 Loading revenue report...', { startDate, endDate });
      
      const { data, error } = await reportService.getRevenueReport(
        branchId,
        startDate,
        endDate
      );

      if (error) throw error;

      console.log('✅ Revenue report loaded:', data);
      setRevenueData(data);
    } catch (err) {
      const errorMessage = err.message || 'Error al cargar reporte de ingresos';
      setError(errorMessage);
      console.error('❌ Error loading revenue report:', err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  // ✅ Cargar reporte de gastos
  const loadExpensesReport = useCallback(async (startDate, endDate) => {
    if (!branchId) {
      console.warn('⚠️ No branch ID available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('💸 Loading expenses report...', { startDate, endDate });
      
      const { data, error } = await reportService.getExpensesReport(
        branchId,
        startDate,
        endDate
      );

      if (error) throw error;

      console.log('✅ Expenses report loaded:', data?.length || 0, 'items');
      setExpensesData(data || []);
    } catch (err) {
      const errorMessage = err.message || 'Error al cargar reporte de gastos';
      setError(errorMessage);
      console.error('❌ Error loading expenses report:', err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  // ✅ Cargar reportes diarios
  const loadDailyReports = useCallback(async (startDate, endDate) => {
    if (!branchId) {
      console.warn('⚠️ No branch ID available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📅 Loading daily reports...', { startDate, endDate });
      
      const { data, error } = await reportService.getDailyReports(
        branchId,
        startDate,
        endDate
      );

      if (error) throw error;

      console.log('✅ Daily reports loaded:', data?.length || 0, 'reports');
      setDailyReports(data || []);
    } catch (err) {
      const errorMessage = err.message || 'Error al cargar reportes diarios';
      setError(errorMessage);
      console.error('❌ Error loading daily reports:', err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  // ✅ CORRECCIÓN: Formatear moneda en PEN (soles peruanos)
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount || 0);
  }, []);

  // ✅ Formatear porcentaje
  const formatPercentage = useCallback((value) => {
    return `${(value || 0).toFixed(2)}%`;
  }, []);

  // ✅ Formatear fecha
  const formatDate = useCallback((date) => {
    if (!date) return '-';
    
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  return {
    loading,
    error,
    dashboardStats,
    revenueData,
    expensesData,
    dailyReports,
    branchId, // ✅ Exportar para verificación
    loadDashboardStats,
    loadRevenueReport,
    loadExpensesReport,
    loadDailyReports,
    formatCurrency,
    formatPercentage,
    formatDate
  };
};

export default useReports;