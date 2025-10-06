// src/services/reportsService.js - CON EXPORTACIÓN CSV
import { supabase } from '../lib/supabase';

export const reportsService = {
  // Dashboard Stats
  async getDashboardStats(branchId) {
    try {
      console.log('📊 Calling get_dashboard_stats...', branchId);
      
      const { data, error } = await supabase
        .rpc('get_dashboard_stats', { p_branch_id: branchId });

      if (error) throw error;

      let statsData = data;
      if (Array.isArray(data) && data.length > 0) statsData = data[0];
      if (typeof statsData === 'string') statsData = JSON.parse(statsData);

      return { data: statsData || {}, error: null };
    } catch (error) {
      console.error('❌ Error:', error);
      return { data: {}, error };
    }
  },

  // Revenue Report
  async getRevenueReport(branchId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .rpc('calculate_revenue_by_period', {
          branch_uuid: branchId,
          start_date: startDate,
          end_date: endDate
        });

      if (error) throw error;

      let revenueData = data;
      if (Array.isArray(data) && data.length > 0) revenueData = data[0];
      if (typeof revenueData === 'string') revenueData = JSON.parse(revenueData);

      return { 
        data: {
          room_revenue: revenueData?.room_revenue || 0,
          service_revenue: revenueData?.service_revenue || 0,
          total_revenue: revenueData?.total_revenue || 0,
          total_expenses: revenueData?.total_expenses || 0,
          net_profit: revenueData?.net_profit || 0
        }, 
        error: null 
      };
    } catch (error) {
      console.error('❌ Error:', error);
      return { data: {}, error };
    }
  },

  // Expenses Report
  async getExpensesReport(branchId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id,
          description,
          amount,
          expense_date,
          expense_categories(name),
          payment_methods(name)
        `)
        .eq('branch_id', branchId)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .order('expense_date', { ascending: false });

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error:', error);
      return { data: [], error };
    }
  },

  // Daily Reports
  async getDailyReports(branchId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('branch_id', branchId)
        .gte('report_date', startDate)
        .lte('report_date', endDate)
        .order('report_date', { ascending: false });

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error:', error);
      return { data: [], error };
    }
  },

  // ✅ NUEVA FUNCIÓN: Exportar a CSV
  async exportToCSV(reportType, data, options = {}) {
    try {
      if (!data) {
        throw new Error('No hay datos para exportar');
      }

      let csvContent = '';
      let filename = options.filename || `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;

      // Agregar BOM para soporte de caracteres especiales en Excel
      const BOM = '\uFEFF';

      switch (reportType) {
        case 'overview':
          csvContent = this.generateOverviewCSV(data);
          break;
        case 'daily':
          csvContent = this.generateDailyCSV(data);
          break;
        case 'revenue':
          csvContent = this.generateRevenueCSV(data);
          break;
        case 'expenses':
          csvContent = this.generateExpensesCSV(data);
          break;
        default:
          throw new Error(`Tipo de reporte no soportado: ${reportType}`);
      }

      // Crear y descargar archivo
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true };
    } catch (error) {
      console.error('❌ Error exporting CSV:', error);
      return { success: false, error: error.message };
    }
  },

  // Generar CSV para Overview
  generateOverviewCSV(data) {
    const headers = ['Métrica', 'Valor'];
    const rows = [
      ['Ingresos Totales', `S/. ${data.totalRevenue?.toFixed(2) || 0}`],
      ['Gastos Totales', `S/. ${data.totalExpenses?.toFixed(2) || 0}`],
      ['Ganancia Neta', `S/. ${data.netProfit?.toFixed(2) || 0}`],
      ['Ocupación Promedio', `${data.averageOccupancy || 0}%`],
      ['Margen de Ganancia', `${data.totalRevenue > 0 ? ((data.netProfit / data.totalRevenue) * 100).toFixed(2) : 0}%`]
    ];

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  },

  // Generar CSV para Reportes Diarios
  generateDailyCSV(data) {
    const headers = ['Fecha', 'Check-ins', 'Check-outs', 'Ingresos', 'Gastos', 'Ocupación'];
    
    const rows = (Array.isArray(data) ? data : []).map(report => [
      new Date(report.report_date).toLocaleDateString('es-PE'),
      report.total_checkins || 0,
      report.total_checkouts || 0,
      `S/. ${(report.total_revenue || 0).toFixed(2)}`,
      `S/. ${(report.total_expenses || 0).toFixed(2)}`,
      `${(report.occupancy_rate || 0).toFixed(1)}%`
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  },

  // Generar CSV para Reporte de Ingresos
  generateRevenueCSV(data) {
    const headers = ['Concepto', 'Monto'];
    const rows = [
      ['Ingresos por Habitaciones', `S/. ${(data.room_revenue || 0).toFixed(2)}`],
      ['Ingresos por Servicios', `S/. ${(data.service_revenue || 0).toFixed(2)}`],
      ['Total Ingresos', `S/. ${(data.total_revenue || 0).toFixed(2)}`],
      ['Total Gastos', `S/. ${(data.total_expenses || 0).toFixed(2)}`],
      ['Ganancia Neta', `S/. ${(data.net_profit || 0).toFixed(2)}`],
      ['Margen de Ganancia', `${data.total_revenue > 0 ? ((data.net_profit / data.total_revenue) * 100).toFixed(2) : 0}%`]
    ];

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  },

  // Generar CSV para Reporte de Gastos
  generateExpensesCSV(data) {
    const headers = ['Fecha', 'Descripción', 'Categoría', 'Método de Pago', 'Monto'];
    
    const rows = (Array.isArray(data) ? data : []).map(expense => [
      new Date(expense.expense_date).toLocaleDateString('es-PE'),
      `"${expense.description || ''}"`, // Comillas para textos con comas
      expense.expense_categories?.name || 'Sin categoría',
      expense.payment_methods?.name || 'N/A',
      `S/. ${(expense.amount || 0).toFixed(2)}`
    ]);

    // Agregar fila de total
    const total = rows.reduce((sum, row) => {
      const amount = parseFloat(row[4].replace('S/. ', ''));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    rows.push(['', '', '', 'TOTAL', `S/. ${total.toFixed(2)}`]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
};

export default reportsService;