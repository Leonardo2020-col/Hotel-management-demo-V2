// src/services/reportsService.js - VERSIÓN CORREGIDA
import { supabase } from '../lib/supabase';

export const reportsService = {
  // ✅ CORREGIDO: Maneja respuesta JSON correctamente
  async getDashboardStats(branchId) {
    try {
      console.log('📊 Calling get_dashboard_stats...', branchId);
      
      const { data, error } = await supabase
        .rpc('get_dashboard_stats', { p_branch_id: branchId });

      if (error) {
        console.error('❌ RPC Error:', error);
        throw error;
      }

      console.log('📦 Raw response:', data);

      // Manejar diferentes formatos de respuesta
      let statsData = data;

      if (Array.isArray(data) && data.length > 0) {
        statsData = data[0];
      }

      if (typeof statsData === 'string') {
        try {
          statsData = JSON.parse(statsData);
        } catch (parseError) {
          console.error('❌ Parse error:', parseError);
          statsData = {};
        }
      }

      console.log('✅ Stats data processed:', statsData);

      return { data: statsData || {}, error: null };
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      return { 
        data: {
          total_rooms: 0,
          occupied_rooms: 0,
          available_rooms: 0,
          maintenance_rooms: 0,
          occupancy_rate: 0,
          today_checkins: 0,
          today_checkouts: 0,
          today_revenue: 0,
          pending_reservations: 0
        }, 
        error 
      };
    }
  },

  // ✅ CORREGIDO: Nombre de función y parámetros
  async getRevenueReport(branchId, startDate, endDate) {
    try {
      console.log('💰 Calling calculate_revenue_by_period...', { branchId, startDate, endDate });
      
      const { data, error } = await supabase
        .rpc('calculate_revenue_by_period', {
          branch_uuid: branchId,
          start_date: startDate,
          end_date: endDate
        });

      if (error) {
        console.error('❌ RPC Error:', error);
        throw error;
      }

      console.log('📦 Raw revenue response:', data);

      // Manejar respuesta - puede ser array o objeto
      let revenueData = data;

      if (Array.isArray(data) && data.length > 0) {
        revenueData = data[0];
      }

      if (typeof revenueData === 'string') {
        try {
          revenueData = JSON.parse(revenueData);
        } catch (parseError) {
          console.error('❌ Parse error:', parseError);
          revenueData = {};
        }
      }

      // Asegurar estructura mínima
      const processedData = {
        room_revenue: revenueData?.room_revenue || 0,
        service_revenue: revenueData?.service_revenue || 0,
        total_revenue: revenueData?.total_revenue || 0,
        total_expenses: revenueData?.total_expenses || 0,
        net_profit: revenueData?.net_profit || 0
      };

      console.log('✅ Revenue data processed:', processedData);

      return { data: processedData, error: null };
    } catch (error) {
      console.error('❌ Error fetching revenue report:', error);
      return { 
        data: {
          room_revenue: 0,
          service_revenue: 0,
          total_revenue: 0,
          total_expenses: 0,
          net_profit: 0
        }, 
        error 
      };
    }
  },

  // ✅ Query directo - OK
  async getExpensesReport(branchId, startDate, endDate) {
    try {
      console.log('💸 Fetching expenses...', { branchId, startDate, endDate });
      
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

      if (error) {
        console.error('❌ Query Error:', error);
        throw error;
      }

      console.log('✅ Expenses fetched:', data?.length || 0, 'items');

      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error fetching expenses report:', error);
      return { data: [], error };
    }
  },

  // ✅ Query directo - OK
  async getDailyReports(branchId, startDate, endDate) {
    try {
      console.log('📅 Fetching daily reports...', { branchId, startDate, endDate });
      
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('branch_id', branchId)
        .gte('report_date', startDate)
        .lte('report_date', endDate)
        .order('report_date', { ascending: false });

      if (error) {
        console.error('❌ Query Error:', error);
        throw error;
      }

      console.log('✅ Daily reports fetched:', data?.length || 0, 'reports');

      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error fetching daily reports:', error);
      return { data: [], error };
    }
  }
};

export default reportsService;