import { useState, useEffect } from 'react';
import { reportsService } from '../services/reportsService';
import { useAuth } from '../context/AuthContext';

export const useReports = () => {
  const { userInfo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [expensesData, setExpensesData] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);

  const branchId = userInfo?.branch_id;

  const loadDashboardStats = async () => {
    if (!branchId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await reportsService.getDashboardStats(branchId);

      if (error) throw error;

      setDashboardStats(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRevenueReport = async (startDate, endDate) => {
    if (!branchId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await reportsService.getRevenueReport(
        branchId,
        startDate,
        endDate
      );

      if (error) throw error;

      setRevenueData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading revenue report:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExpensesReport = async (startDate, endDate) => {
    if (!branchId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await reportsService.getExpensesReport(
        branchId,
        startDate,
        endDate
      );

      if (error) throw error;

      setExpensesData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading expenses report:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyReports = async (startDate, endDate) => {
    if (!branchId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await reportsService.getDailyReports(
        branchId,
        startDate,
        endDate
      );

      if (error) throw error;

      setDailyReports(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading daily reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return {
    loading,
    error,
    dashboardStats,
    revenueData,
    expensesData,
    dailyReports,
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
