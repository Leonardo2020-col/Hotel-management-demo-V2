// src/lib/branchService.js - SERVICIOS PARA GESTIÓN DE SUCURSALES
import { supabase } from './supabase'

export const branchService = {
  // ✅ Obtener todas las sucursales disponibles
  async getAllBranches() {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching branches:', error)
      return { data: [], error }
    }
  },

  // ✅ Obtener estadísticas básicas de una sucursal
  async getBranchStats(branchId) {
    try {
      // Usar la función SQL existente get_dashboard_stats
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        p_branch_id: branchId
      })

      if (error) throw error

      // Si no hay datos, devolver estructura básica
      const stats = data || {
        total_rooms: 0,
        occupied_rooms: 0,
        available_rooms: 0,
        maintenance_rooms: 0,
        occupancy_rate: 0,
        today_checkins: 0,
        today_checkouts: 0,
        today_revenue: 0,
        pending_reservations: 0
      }

      return { 
        data: {
          totalRooms: stats.total_rooms || 0,
          occupiedRooms: stats.occupied_rooms || 0,
          availableRooms: stats.available_rooms || 0,
          maintenanceRooms: stats.maintenance_rooms || 0,
          occupancyRate: stats.occupancy_rate || 0,
          todayCheckins: stats.today_checkins || 0,
          todayCheckouts: stats.today_checkouts || 0,
          todayRevenue: stats.today_revenue || 0,
          pendingReservations: stats.pending_reservations || 0
        }, 
        error: null 
      }
    } catch (error) {
      console.error(`Error fetching stats for branch ${branchId}:`, error)
      return { data: null, error }
    }
  },

  // ✅ Cambiar sucursal primaria del usuario
  async setPrimaryBranch(userId, newBranchId) {
    try {
      console.log('🔄 Cambiando sucursal primaria:', { userId, newBranchId })

      // Primero verificar que el usuario tenga acceso a esa sucursal
      const { data: userBranch, error: checkError } = await supabase
        .from('user_branches')
        .select('id')
        .eq('user_id', userId)
        .eq('branch_id', newBranchId)
        .single()

      if (checkError || !userBranch) {
        throw new Error('Usuario no tiene acceso a esa sucursal')
      }

      // Remover flag primary de todas las sucursales del usuario
      const { error: resetError } = await supabase
        .from('user_branches')
        .update({ is_primary: false })
        .eq('user_id', userId)

      if (resetError) throw resetError

      // Establecer la nueva sucursal como primaria
      const { data, error: setPrimaryError } = await supabase
        .from('user_branches')
        .update({ is_primary: true })
        .eq('user_id', userId)
        .eq('branch_id', newBranchId)
        .select(`
          *,
          branch:branch_id(id, name, address, is_active)
        `)
        .single()

      if (setPrimaryError) throw setPrimaryError

      console.log('✅ Sucursal primaria actualizada:', data)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error setting primary branch:', error)
      return { data: null, error }
    }
  },

  // ✅ Obtener información detallada de una sucursal
  async getBranchDetails(branchId) {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select(`
          *,
          rooms(count),
          users:user_branches!inner(
            user:user_id(id, first_name, last_name, email)
          )
        `)
        .eq('id', branchId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching branch details:', error)
      return { data: null, error }
    }
  },

  // ✅ Obtener usuarios asignados a una sucursal
  async getBranchUsers(branchId) {
    try {
      const { data, error } = await supabase
        .from('user_branches')
        .select(`
          is_primary,
          user:user_id(
            id,
            first_name,
            last_name,
            email,
            phone,
            is_active,
            role:role_id(name, permissions)
          )
        `)
        .eq('branch_id', branchId)
        .order('is_primary', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching branch users:', error)
      return { data: [], error }
    }
  },

  // ✅ Obtener resumen de actividad reciente de una sucursal
  async getBranchActivity(branchId, limit = 10) {
    try {
      // Obtener reservaciones recientes
      const { data: reservations, error: resError } = await supabase
        .from('reservations')
        .select(`
          id,
          reservation_code,
          created_at,
          guest:guest_id(full_name),
          status:status_id(status)
        `)
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (resError) throw resError

      // Obtener check-ins rápidos recientes
      const { data: quickCheckins, error: qcError } = await supabase
        .from('quick_checkins')
        .select(`
          id,
          guest_name,
          amount,
          created_at
        `)
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (qcError) throw qcError

      // Combinar y formatear actividades
      const activities = []

      reservations?.forEach(res => {
        activities.push({
          id: `res-${res.id}`,
          type: 'reservation',
          title: 'Nueva reserva',
          description: `${res.guest?.full_name} - ${res.reservation_code}`,
          timestamp: res.created_at,
          status: res.status?.status
        })
      })

      quickCheckins?.forEach(qc => {
        activities.push({
          id: `qc-${qc.id}`,
          type: 'quick_checkin',
          title: 'Check-in rápido',
          description: `${qc.guest_name} - S/${qc.amount}`,
          timestamp: qc.created_at,
          status: 'completed'
        })
      })

      // Ordenar por fecha más reciente
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      return { data: activities.slice(0, limit), error: null }
    } catch (error) {
      console.error('Error fetching branch activity:', error)
      return { data: [], error }
    }
  },

  // ✅ Obtener comparación entre sucursales (para admin)
  async getBranchComparison(branchIds) {
    try {
      const comparisons = []

      await Promise.all(
        branchIds.map(async (branchId) => {
          const [branchData, statsData] = await Promise.all([
            this.getBranchDetails(branchId),
            this.getBranchStats(branchId)
          ])

          if (!branchData.error && !statsData.error) {
            comparisons.push({
              branch: branchData.data,
              stats: statsData.data,
              performance: {
                occupancyGrade: this.calculateOccupancyGrade(statsData.data.occupancyRate),
                revenueGrade: this.calculateRevenueGrade(statsData.data.todayRevenue),
                overallGrade: this.calculateOverallGrade(statsData.data)
              }
            })
          }
        })
      )

      // Ordenar por rendimiento general
      comparisons.sort((a, b) => 
        this.gradeToNumber(b.performance.overallGrade) - 
        this.gradeToNumber(a.performance.overallGrade)
      )

      return { data: comparisons, error: null }
    } catch (error) {
      console.error('Error fetching branch comparison:', error)
      return { data: [], error }
    }
  },

  // ✅ Utilidades para calificaciones
  calculateOccupancyGrade(rate) {
    if (rate >= 90) return 'A+'
    if (rate >= 80) return 'A'
    if (rate >= 70) return 'B+'
    if (rate >= 60) return 'B'
    if (rate >= 50) return 'C+'
    if (rate >= 40) return 'C'
    return 'D'
  },

  calculateRevenueGrade(revenue) {
    if (revenue >= 3000) return 'A+'
    if (revenue >= 2500) return 'A'
    if (revenue >= 2000) return 'B+'
    if (revenue >= 1500) return 'B'
    if (revenue >= 1000) return 'C+'
    if (revenue >= 500) return 'C'
    return 'D'
  },

  calculateOverallGrade(stats) {
    const occupancyScore = this.gradeToNumber(this.calculateOccupancyGrade(stats.occupancyRate))
    const revenueScore = this.gradeToNumber(this.calculateRevenueGrade(stats.todayRevenue))
    const avgScore = (occupancyScore + revenueScore) / 2
    
    if (avgScore >= 9) return 'A+'
    if (avgScore >= 8) return 'A'
    if (avgScore >= 7) return 'B+'
    if (avgScore >= 6) return 'B'
    if (avgScore >= 5) return 'C+'
    if (avgScore >= 4) return 'C'
    return 'D'
  },

  gradeToNumber(grade) {
    const gradeMap = {
      'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 
      'C+': 6, 'C': 5, 'D': 4
    }
    return gradeMap[grade] || 0
  },

  // ✅ Validar acceso a sucursal
  async validateBranchAccess(userId, branchId) {
    try {
      const { data, error } = await supabase
        .from('user_branches')
        .select('id, is_primary')
        .eq('user_id', userId)
        .eq('branch_id', branchId)
        .single()

      if (error) return { hasAccess: false, isPrimary: false }
      
      return { 
        hasAccess: true, 
        isPrimary: data.is_primary,
        userBranchId: data.id 
      }
    } catch (error) {
      console.error('Error validating branch access:', error)
      return { hasAccess: false, isPrimary: false }
    }
  }
}