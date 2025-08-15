// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// =====================================================
// 🔐 SERVICIOS DE AUTENTICACIÓN
// =====================================================
export const authService = {
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      const userInfo = await this.getUserInfo(data.user.id)
      
      return { 
        user: data.user, 
        session: data.session,
        userInfo 
      }
    } catch (error) {
      console.error('Error en login:', error)
      throw error
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return true
    } catch (error) {
      console.error('Error en logout:', error)
      throw error
    }
  },

  async getUserInfo(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(id, name, permissions),
          user_branches!inner(
            branch_id,
            is_primary,
            branch:branches(id, name, is_active)
          )
        `)
        .eq('id', userId)
        .eq('is_active', true)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error obteniendo info del usuario:', error)
      throw error
    }
  },

  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      
      if (session?.user) {
        const userInfo = await this.getUserInfo(session.user.id)
        return { session, userInfo }
      }
      
      return { session: null, userInfo: null }
    } catch (error) {
      console.error('Error obteniendo sesión:', error)
      return { session: null, userInfo: null }
    }
  },

  hasRole(userInfo, roleName) {
    return userInfo?.role?.name === roleName
  },

  hasPermission(userInfo, permission) {
    if (!userInfo?.role?.permissions) return false
    if (userInfo.role.permissions.all) return true
    return userInfo.role.permissions[permission] === true
  },

  getPrimaryBranch(userInfo) {
    const primaryBranch = userInfo?.user_branches?.find(ub => ub.is_primary)
    return primaryBranch?.branch || userInfo?.user_branches?.[0]?.branch
  },

  getUserBranches(userInfo) {
    return userInfo?.user_branches?.map(ub => ub.branch) || []
  }
}

// =====================================================
// 🏨 SERVICIOS DE HABITACIONES
// =====================================================
export const roomService = {
  // ✅ Obtener habitaciones con estado detallado
  async getRoomsWithStatus(branchId) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id,
          room_number,
          floor,
          base_price,
          description,
          is_active,
          room_status:status_id(
            id,
            status,
            color,
            is_available
          )
        `)
        .eq('branch_id', branchId)
        .eq('is_active', true)
        .order('room_number')

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching rooms:', error)
      return { data: null, error }
    }
  },

  // ✅ Actualizar estado de habitación
  async updateRoomStatus(roomId, statusName) {
    try {
      // Primero obtener el ID del status
      const { data: statusData, error: statusError } = await supabase
        .from('room_status')
        .select('id')
        .eq('status', statusName)
        .single()

      if (statusError) throw statusError

      // Actualizar la habitación
      const { data, error } = await supabase
        .from('rooms')
        .update({ status_id: statusData.id })
        .eq('id', roomId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating room status:', error)
      return { data: null, error }
    }
  },

  // ✅ Obtener habitaciones disponibles en un rango de fechas
  async getAvailableRooms(branchId, startDate, endDate) {
    try {
      const { data, error } = await supabase.rpc('get_available_rooms', {
        branch_uuid: branchId,
        start_date: startDate,
        end_date: endDate
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching available rooms:', error)
      return { data: null, error }
    }
  }
}

// =====================================================
// 🚀 SERVICIOS DE QUICK CHECK-INS
// =====================================================
export const quickCheckinService = {
  // ✅ Crear quick check-in completo
  async createQuickCheckin(quickCheckinData, guestData, snacksData = []) {
    try {
      // Iniciar transacción manual
      const { data: quickCheckin, error: quickCheckinError } = await supabase
        .from('quick_checkins')
        .insert({
          branch_id: quickCheckinData.branchId,
          room_id: quickCheckinData.roomId,
          guest_name: guestData.fullName,
          guest_document: `${guestData.documentType}:${guestData.documentNumber}`,
          guest_phone: guestData.phone,
          check_in_date: quickCheckinData.checkInDate,
          check_out_date: quickCheckinData.checkOutDate,
          amount: quickCheckinData.totalAmount,
          payment_method_id: quickCheckinData.paymentMethodId,
          created_by: quickCheckinData.createdBy
        })
        .select()
        .single()

      if (quickCheckinError) throw quickCheckinError

      // Crear checkin order
      const { data: checkinOrder, error: checkinOrderError } = await supabase
        .from('checkin_orders')
        .insert({
          quick_checkin_id: quickCheckin.id,
          room_id: quickCheckinData.roomId,
          check_in_time: new Date().toISOString(),
          expected_checkout: quickCheckinData.checkOutDate,
          processed_by: quickCheckinData.createdBy
        })
        .select()
        .single()

      if (checkinOrderError) throw checkinOrderError

      return { data: { quickCheckin, checkinOrder }, error: null }
    } catch (error) {
      console.error('Error creating quick checkin:', error)
      return { data: null, error }
    }
  },

  // ✅ Obtener quick check-ins activos
  async getActiveQuickCheckins(branchId) {
    try {
      const { data, error } = await supabase
        .from('quick_checkins')
        .select(`
          id,
          room_id,
          guest_name,
          guest_document,
          guest_phone,
          check_in_date,
          check_out_date,
          amount,
          created_at,
          room:room_id(room_number),
          payment_method:payment_method_id(name)
        `)
        .eq('branch_id', branchId)
        .gte('check_out_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching active quick checkins:', error)
      return { data: null, error }
    }
  },

  // ✅ Procesar check-out de quick checkin
  async processQuickCheckout(quickCheckinId, checkoutData) {
    try {
      // Buscar checkin order activo
      const { data: checkinOrder, error: checkinOrderError } = await supabase
        .from('checkin_orders')
        .select('id, room_id')
        .eq('quick_checkin_id', quickCheckinId)
        .is('actual_checkout', null)
        .single()

      if (checkinOrderError) throw checkinOrderError

      // Crear checkout order
      const { data: checkoutOrder, error: checkoutOrderError } = await supabase
        .from('checkout_orders')
        .insert({
          checkin_order_id: checkinOrder.id,
          checkout_time: new Date().toISOString(),
          total_charges: checkoutData.totalCharges,
          additional_charges: checkoutData.additionalCharges || [],
          processed_by: checkoutData.processedBy
        })
        .select()
        .single()

      if (checkoutOrderError) throw checkoutOrderError

      // Actualizar checkin order
      const { error: updateError } = await supabase
        .from('checkin_orders')
        .update({ actual_checkout: new Date().toISOString() })
        .eq('id', checkinOrder.id)

      if (updateError) throw updateError

      return { data: { checkoutOrder, checkinOrder }, error: null }
    } catch (error) {
      console.error('Error processing quick checkout:', error)
      return { data: null, error }
    }
  },

  // ✅ Obtener check-ins de reservaciones activos
  async getActiveReservationCheckins(roomIds) {
    try {
      const { data, error } = await supabase
        .from('checkin_orders')
        .select(`
          id,
          room_id,
          check_in_time,
          expected_checkout,
          reservation:reservation_id(
            id,
            reservation_code,
            total_amount,
            guest:guest_id(
              full_name,
              phone,
              document_type,
              document_number
            )
          )
        `)
        .is('actual_checkout', null)
        .in('room_id', roomIds)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching active reservation checkins:', error)
      return { data: null, error }
    }
  }
}

// =====================================================
// 🍿 SERVICIOS DE SNACKS
// =====================================================
export const snackService = {
  // ✅ Obtener categorías de snacks
  async getSnackCategories() {
    try {
      const { data, error } = await supabase
        .from('snack_categories')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching snack categories:', error)
      return { data: null, error }
    }
  },

  // ✅ Obtener items de snacks
  async getSnackItems() {
    try {
      const { data, error } = await supabase
        .from('snack_items')
        .select(`
          id,
          name,
          price,
          cost,
          stock,
          minimum_stock,
          category_id,
          is_active,
          snack_category:category_id(name)
        `)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching snack items:', error)
      return { data: null, error }
    }
  },

  // ✅ Actualizar stock de snack
  async updateSnackStock(snackId, newStock) {
    try {
      const { data, error } = await supabase
        .from('snack_items')
        .update({ stock: newStock })
        .eq('id', snackId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating snack stock:', error)
      return { data: null, error }
    }
  },

  // ✅ Procesar consumo de snacks (reducir stock)
  async processSnackConsumption(snacksConsumed) {
    try {
      const updates = []
      
      for (const snack of snacksConsumed) {
        const { data, error } = await supabase
          .from('snack_items')
          .update({ 
            stock: Math.max(0, snack.currentStock - snack.quantity) 
          })
          .eq('id', snack.id)
          .select()
          .single()

        if (error) throw error
        updates.push(data)
      }

      return { data: updates, error: null }
    } catch (error) {
      console.error('Error processing snack consumption:', error)
      return { data: null, error }
    }
  }
}

// =====================================================
// 💳 SERVICIOS DE PAGOS
// =====================================================
export const paymentService = {
  // ✅ Obtener métodos de pago
  async getPaymentMethods() {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      return { data: null, error }
    }
  },

  // ✅ Obtener método de pago por nombre
  async getPaymentMethodByName(name) {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('name', name)
        .eq('is_active', true)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching payment method by name:', error)
      return { data: null, error }
    }
  }
}

// =====================================================
// 👥 SERVICIOS DE HUÉSPEDES
// =====================================================
export const guestService = {
  // ✅ Buscar huéspedes
  async searchGuests(searchTerm, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,document_number.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error searching guests:', error)
      return { data: null, error }
    }
  },

  // ✅ Crear huésped
  async createGuest(guestData) {
    try {
      const { data, error } = await supabase
        .from('guests')
        .insert({
          full_name: guestData.fullName,
          phone: guestData.phone,
          document_type: guestData.documentType,
          document_number: guestData.documentNumber
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating guest:', error)
      return { data: null, error }
    }
  }
}

// =====================================================
// 📊 SERVICIOS DE REPORTES Y ESTADÍSTICAS
// =====================================================
export const reportService = {
  // ✅ Obtener estadísticas del dashboard
  async getDashboardStats(branchId) {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        branch_uuid: branchId
      })

      if (error) throw error
      return { data: data[0] || {}, error: null }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return { data: null, error }
    }
  },

  // ✅ Calcular ingresos por período
  async calculateRevenueByPeriod(branchId, startDate, endDate) {
    try {
      const { data, error } = await supabase.rpc('calculate_revenue_by_period', {
        branch_uuid: branchId,
        start_date: startDate,
        end_date: endDate
      })

      if (error) throw error
      return { data: data[0] || {}, error: null }
    } catch (error) {
      console.error('Error calculating revenue by period:', error)
      return { data: null, error }
    }
  },

  // ✅ Generar reporte diario
  async generateDailyReport(branchId, reportDate = null) {
    try {
      const { data, error } = await supabase.rpc('generate_daily_report', {
        branch_uuid: branchId,
        report_date_param: reportDate || new Date().toISOString().split('T')[0]
      })

      if (error) throw error
      return { data: true, error: null }
    } catch (error) {
      console.error('Error generating daily report:', error)
      return { data: null, error }
    }
  }
}

// =====================================================
// 🔧 SERVICIOS AUXILIARES
// =====================================================
export const utilityService = {
  // ✅ Formatear precio en soles peruanos
  formatPrice(amount) {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  },

  // ✅ Formatear fecha
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...options
    }
    return new Intl.DateTimeFormat('es-PE', defaultOptions).format(new Date(date))
  },

  // ✅ Generar código de confirmación
  generateConfirmationCode(prefix = 'QC') {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `${prefix}-${timestamp}-${random}`.toUpperCase()
  },

  // ✅ Validar datos de huésped
  validateGuestData(guestData) {
    const errors = []
    
    if (!guestData.fullName?.trim()) {
      errors.push('El nombre completo es obligatorio')
    }
    
    if (!guestData.documentNumber?.trim()) {
      errors.push('El número de documento es obligatorio')
    }
    
    if (guestData.documentNumber?.length < 6) {
      errors.push('El número de documento debe tener al menos 6 caracteres')
    }
    
    if (guestData.phone && guestData.phone.length < 7) {
      errors.push('El teléfono debe tener al menos 7 dígitos')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// =====================================================
// 📡 SERVICIOS DE TIEMPO REAL (SUBSCRIPCIONES)
// =====================================================
export const realtimeService = {
  // ✅ Suscribirse a cambios en habitaciones
  subscribeToRoomChanges(branchId, callback) {
    return supabase
      .channel('room-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `branch_id=eq.${branchId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quick_checkins',
          filter: `branch_id=eq.${branchId}`
        },
        callback
      )
      .subscribe()
  },

  // ✅ Suscribirse a cambios en check-ins
  subscribeToCheckinChanges(callback) {
    return supabase
      .channel('checkin-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkin_orders'
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkout_orders'
        },
        callback
      )
      .subscribe()
  }
}

// =====================================================
// 🛠️ SERVICIOS COMBINADOS PARA EL HOOK
// =====================================================
export const hotelService = {
  // ✅ Obtener todos los datos necesarios para el dashboard de check-in
  async getCheckinDashboardData(branchId) {
    try {
      const [
        roomsResult,
        quickCheckinsResult,
        reservationCheckinsResult,
        snackCategoriesResult,
        snackItemsResult,
        paymentMethodsResult
      ] = await Promise.all([
        roomService.getRoomsWithStatus(branchId),
        quickCheckinService.getActiveQuickCheckins(branchId),
        quickCheckinService.getActiveReservationCheckins([]), // Se filtrarán después
        snackService.getSnackCategories(),
        snackService.getSnackItems(),
        paymentService.getPaymentMethods()
      ])

      // Si hay habitaciones, obtener check-ins de reservaciones
      let reservationCheckins = []
      if (roomsResult.data?.length > 0) {
        const roomIds = roomsResult.data.map(r => r.id)
        const reservationResult = await quickCheckinService.getActiveReservationCheckins(roomIds)
        reservationCheckins = reservationResult.data || []
      }

      return {
        rooms: roomsResult.data || [],
        quickCheckins: quickCheckinsResult.data || [],
        reservationCheckins,
        snackCategories: snackCategoriesResult.data || [],
        snackItems: snackItemsResult.data || [],
        paymentMethods: paymentMethodsResult.data || [],
        error: null
      }
    } catch (error) {
      console.error('Error fetching checkin dashboard data:', error)
      return {
        rooms: [],
        quickCheckins: [],
        reservationCheckins: [],
        snackCategories: [],
        snackItems: [],
        paymentMethods: [],
        error
      }
    }
  }
}