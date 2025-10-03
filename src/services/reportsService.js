// =====================================================
// SERVICIO DE REPORTES V2 - SIMPLIFICADO
// =====================================================
import { supabase } from '../lib/supabase';

export const reportsService = {
  // ===================================================
  // ESTADÍSTICAS DEL DASHBOARD
  // ===================================================
  async getDashboardStats(branchId) {
    try {
      console.log('📊 [Reports Service] Fetching dashboard stats for branch:', branchId);

      const { data, error } = await supabase
        .rpc('get_dashboard_stats_simple', { p_branch_id: branchId });

      if (error) {
        console.error('❌ [Reports Service] Error in RPC:', error);
        throw error;
      }

      const stats = data?.[0] || {
        total_rooms: 0,
        occupied_rooms: 0,
        available_rooms: 0,
        maintenance_rooms: 0,
        occupancy_rate: 0,
        today_checkins: 0,
        today_checkouts: 0,
        pending_reservations: 0
      };

      console.log('✅ [Reports Service] Dashboard stats loaded:', stats);
      return { data: stats, error: null };
    } catch (error) {
      console.error('❌ [Reports Service] getDashboardStats failed:', error);
      return { data: null, error };
    }
  },

  // ===================================================
  // REPORTE DE INGRESOS
  // ===================================================
  async getRevenueReport(branchId, startDate, endDate) {
    try {
      console.log('💰 [Reports Service] Calculating revenue:', {
        branchId,
        startDate,
        endDate
      });

      const { data, error } = await supabase
        .rpc('calculate_revenue_simple', {
          p_branch_id: branchId,
          p_start_date: startDate,
          p_end_date: endDate
        });

      if (error) {
        console.error('❌ [Reports Service] Revenue RPC error:', error);
        throw error;
      }

      const revenue = data?.[0] || {
        room_revenue: 0,
        service_revenue: 0,
        total_revenue: 0,
        total_expenses: 0,
        net_profit: 0
      };

      console.log('✅ [Reports Service] Revenue calculated:', revenue);
      return { data: revenue, error: null };
    } catch (error) {
      console.error('❌ [Reports Service] getRevenueReport failed:', error);
      return { data: null, error };
    }
  },

  // ===================================================
  // REPORTES DIARIOS
  // ===================================================
  async getDailyReports(branchId, startDate, endDate) {
    try {
      console.log('📅 [Reports Service] Fetching daily reports:', {
        branchId,
        startDate,
        endDate
      });

      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('branch_id', branchId)
        .gte('report_date', startDate)
        .lte('report_date', endDate)
        .order('report_date', { ascending: false });

      if (error) {
        console.error('❌ [Reports Service] Daily reports error:', error);
        throw error;
      }

      console.log('✅ [Reports Service] Daily reports loaded:', data?.length || 0, 'records');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ [Reports Service] getDailyReports failed:', error);
      return { data: [], error };
    }
  },

  // ===================================================
  // GENERAR REPORTE DIARIO
  // ===================================================
  async generateDailyReport(branchId, reportDate = null, userId = null) {
    try {
      const targetDate = reportDate || new Date().toISOString().split('T')[0];
      console.log('🔄 [Reports Service] Generating daily report:', {
        branchId,
        targetDate,
        userId
      });

      const { data, error } = await supabase
        .rpc('generate_daily_report_simple', {
          p_branch_id: branchId,
          p_report_date: targetDate,
          p_user_id: userId
        });

      if (error) {
        console.error('❌ [Reports Service] Generate report error:', error);
        throw error;
      }

      console.log('✅ [Reports Service] Daily report generated successfully');
      return { data: true, error: null };
    } catch (error) {
      console.error('❌ [Reports Service] generateDailyReport failed:', error);
      return { data: false, error };
    }
  },

  // ===================================================
  // REPORTE DE GASTOS
  // ===================================================
  async getExpensesReport(branchId, startDate, endDate) {
    try {
      console.log('💸 [Reports Service] Fetching expenses:', {
        branchId,
        startDate,
        endDate
      });

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

      if (error) {
        console.error('❌ [Reports Service] Expenses error:', error);
        throw error;
      }

      console.log('✅ [Reports Service] Expenses loaded:', data?.length || 0, 'records');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ [Reports Service] getExpensesReport failed:', error);
      return { data: [], error };
    }
  },

  // ===================================================
  // EXPORTAR A CSV
  // ===================================================
  exportToCSV(reportType, data, filename = null) {
    try {
      const defaultFilename = filename || `reporte_${reportType}_${new Date().toISOString().split('T')[0]}`;
      console.log('📤 [Reports Service] Exporting to CSV:', reportType);

      let csvContent = '';

      switch (reportType) {
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
            'Fecha,Descripción,Monto,Categoría,Método de Pago',
            ...data.map(row => [
              row.expense_date,
              `"${row.description}"`,
              row.amount,
              row.expense_categories?.name || '',
              row.payment_methods?.name || ''
            ].join(','))
          ].join('\n');
          break;

        case 'daily':
          csvContent = [
            'Fecha,Check-ins,Check-outs,Ingresos,Gastos,Ocupación %,Disponibles,Ocupadas',
            ...data.map(row => [
              row.report_date,
              row.total_checkins,
              row.total_checkouts,
              row.total_revenue,
              row.total_expenses,
              row.occupancy_rate,
              row.available_rooms,
              row.occupied_rooms
            ].join(','))
          ].join('\n');
          break;

        default:
          throw new Error('Tipo de reporte no soportado');
      }

      // Crear y descargar
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `${defaultFilename}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('✅ [Reports Service] CSV exported:', defaultFilename);
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ [Reports Service] Export failed:', error);
      return { success: false, error };
    }
  }
};

export default reportsService;
