import React, { useState, useEffect } from 'react';
import useReports from '../hooks/useReports';
import DashboardStats from '../components/reports/DashboardStats';
import RevenueReport from '../components/reports/RevenueReport';
import ExpensesTable from '../components/reports/ExpensesTable';
import DailyReportsTable from '../components/reports/DailyReportsTable';

const ReportsPage = () => {
  const {
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
  } = useReports();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'revenue') {
      loadRevenueReport(startDate, endDate);
    } else if (activeTab === 'expenses') {
      loadExpensesReport(startDate, endDate);
    } else if (activeTab === 'daily') {
      loadDailyReports(startDate, endDate);
    }
  }, [activeTab, startDate, endDate]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'revenue', label: 'Ingresos', icon: '💰' },
    { id: 'expenses', label: 'Gastos', icon: '💸' },
    { id: 'daily', label: 'Reportes Diarios', icon: '📅' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600 mt-2">Análisis y estadísticas del hotel</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">Error al cargar los datos</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeTab !== 'dashboard' && (
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div>
          {activeTab === 'dashboard' && (
            <DashboardStats
              stats={dashboardStats}
              formatPercentage={formatPercentage}
            />
          )}

          {activeTab === 'revenue' && (
            <RevenueReport
              revenue={revenueData}
              formatCurrency={formatCurrency}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesTable
              expenses={expensesData}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          )}

          {activeTab === 'daily' && (
            <DailyReportsTable
              reports={dailyReports}
              formatCurrency={formatCurrency}
              formatPercentage={formatPercentage}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
