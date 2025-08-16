// src/lib/supabase.js - CORREGIDO SIN ERRORES
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// =====================================================
// 🔐 SERVICIOS DE AUTENTICACIÓN - CORREGIDO
// =====================================================
export const authService = {
  // Exponer el cliente de Supabase para el AuthContext
  supabase, // ✅ CORREGIDO: era "Supabase" (mayúscula)

  async signIn(email, password) {
    try {
      console.log('🔑 Iniciando login en Supabase...', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Error de Supabase Auth:', error)
        throw error
      }

      console.log('✅ Login exitoso en Supabase Auth')
      
      // Obtener información adicional del usuario desde nuestra tabla
      const userInfo = await this.getUserInfo(data.user.id)
      
      return { 
        user: data.user, 
        session: data.session,
        userInfo 
      }
    } catch (error) {
      console.error('❌ Error en signIn:', error)
      throw error
    }
  },

  async signOut() {
    try {
      console.log('👋 Cerrando sesión en Supabase...')
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      console.log('✅ Logout exitoso')
      return true
    } catch (error) {
      console.error('❌ Error en signOut:', error)
      throw error
    }
  },

  async getUserInfo(userId) {
    try {
      console.log('📋 Obteniendo info del usuario desde DB:', userId)
      
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
        .eq('auth_id', userId)  // ⚠️ CAMBIO IMPORTANTE: usar auth_id en lugar de id
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('❌ Error obteniendo usuario de DB:', error)
        throw error
      }

      if (!data) {
        throw new Error('Usuario no encontrado en la base de datos')
      }

      console.log('✅ Info del usuario obtenida:', {
        name: `${data.first_name} ${data.last_name}`,
        role: data.role?.name,
        branches: data.user_branches?.length
      })

      return data
    } catch (error) {
      console.error('❌ Error en getUserInfo:', error)
      throw error
    }
  },

  async getCurrentSession() {
    try {
      console.log('🔍 Obteniendo sesión actual...')
      
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      
      if (session?.user) {
        console.log('✅ Sesión encontrada para:', session.user.email)
        const userInfo = await this.getUserInfo(session.user.id)
        return { session, userInfo }
      }
      
      console.log('ℹ️ No hay sesión activa')
      return { session: null, userInfo: null }
    } catch (error) {
      console.error('❌ Error obteniendo sesión:', error)
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

  async updateRoomStatus(roomId, statusName) {
    try {
      const { data: statusData, error: statusError } = await supabase
        .from('room_status')
        .select('id')
        .eq('status', statusName)
        .single()

      if (statusError) throw statusError

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
  async createQuickCheckin(quickCheckinData, guestData, snacksData = []) {
    try {
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

  async processQuickCheckout(quickCheckinId, checkoutData) {
    try {
      const { data: checkinOrder, error: checkinOrderError } = await supabase
        .from('checkin_orders')
        .select('id, room_id')
        .eq('quick_checkin_id', quickCheckinId)
        .is('actual_checkout', null)
        .single()

      if (checkinOrderError) throw checkinOrderError

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
  formatPrice(amount) {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  },

  formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...options
    }
    return new Intl.DateTimeFormat('es-PE', defaultOptions).format(new Date(date))
  },

  generateConfirmationCode(prefix = 'QC') {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `${prefix}-${timestamp}-${random}`.toUpperCase()
  },

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
  async getCheckinDashboardData(branchId) {
    try {
      console.log('🔄 Getting dashboard data for branch:', branchId)
      
      if (!branchId || typeof branchId !== 'string') {
        throw new Error('Branch ID inválido')
      }

      const [
        roomsResult,
        quickCheckinsResult,
        snackCategoriesResult,
        snackItemsResult,
        paymentMethodsResult
      ] = await Promise.all([
        roomService.getRoomsWithStatus(branchId),
        quickCheckinService.getActiveQuickCheckins(branchId),
        snackService.getSnackCategories(),
        snackService.getSnackItems(),
        paymentService.getPaymentMethods()
      ])

      console.log('📊 Results received:', {
        rooms: roomsResult.data?.length || 0,
        quickCheckins: quickCheckinsResult.data?.length || 0,
        snackCategories: snackCategoriesResult.data?.length || 0,
        snackItems: snackItemsResult.data?.length || 0,
        paymentMethods: paymentMethodsResult.data?.length || 0
      })

      let reservationCheckins = []
      if (roomsResult.data?.length > 0) {
        const roomIds = roomsResult.data.map(r => r.id)
        const reservationResult = await quickCheckinService.getActiveReservationCheckins(roomIds)
        reservationCheckins = reservationResult.data || []
      }

      if (roomsResult.error) {
        console.error('❌ Error fetching rooms:', roomsResult.error)
        throw new Error(`Error al cargar habitaciones: ${roomsResult.error.message}`)
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
      console.error('❌ Error fetching checkin dashboard data:', error)
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