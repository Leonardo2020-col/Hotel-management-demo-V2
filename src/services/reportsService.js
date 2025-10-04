import { supabase } from '../lib/supabase';

export const reportsService = {
  async getDashboardStats(branchId) {
    try {
      const { data, error } = await supabase
        .rpc('get_dashboard_stats', { p_branch_id: branchId });

      if (error) throw error;

      return { data: data || {}, error: null };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { data: null, error };
    }
  },

  async getRevenueReport(branchId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .rpc('calculate_revenue', {
          p_branch_id: branchId,
          p_start_date: startDate,
          p_end_date: endDate
        });

      if (error) throw error;

      return { data: data || {}, error: null };
    } catch (error) {
      console.error('Error fetching revenue report:', error);
      return { data: null, error };
    }
  },

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
      console.error('Error fetching expenses report:', error);
      return { data: [], error };
    }
  },

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
      console.error('Error fetching daily reports:', error);
      return { data: [], error };
    }
  }
};

export default reportsService;
