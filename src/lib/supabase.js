
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// =====================================================
// 🔐 SERVICIOS DE AUTENTICACIÓN (CORREGIDO)
// =====================================================
export const authService = {
  supabase,

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

  // ⚠️ CORREGIDO: Usar auth_id en lugar de id para buscar el usuario
  async getUserInfo(authUserId) {
    try {
      console.log('📋 Obteniendo info del usuario desde DB:', authUserId)
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          role:role_id(id, name, permissions),
          user_branches!inner(
            branch_id,
            is_primary,
            branch:branch_id(id, name, is_active)
          )
        `)
        .eq('auth_id', authUserId) // ✅ CORREGIDO: Usar auth_id
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
// 🏨 SERVICIOS DE HABITACIONES (CORREGIDO)
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

  // ✅ Usar la función SQL que creaste
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
// 📅 SERVICIOS DE RESERVACIONES (CORREGIDO)
// =====================================================
export const reservationService = {
  // Crear nueva reservación
  async createReservation(reservationData, guestData) {
    try {
      console.log('🎫 Creando nueva reservación...', reservationData)
      
      // 1. Crear o encontrar huésped
      let guest = null
      if (guestData.id) {
        // Huésped existente
        guest = { id: guestData.id }
      } else {
        // Crear nuevo huésped
        const { data: newGuest, error: guestError } = await supabase
          .from('guests')
          .insert({
            full_name: guestData.fullName,
            phone: guestData.phone || '',
            document_type: guestData.documentType || 'dni',
            document_number: guestData.documentNumber
          })
          .select()
          .single()

        if (guestError) throw guestError
        guest = newGuest
      }

      // 2. Obtener estado "pendiente"
      const { data: statusData, error: statusError } = await supabase
        .from('reservation_status')
        .select('id')
        .eq('status', 'pendiente')
        .single()

      if (statusError) throw statusError

      // 3. Crear reservación (el código se genera automáticamente por trigger)
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          branch_id: reservationData.branchId,
          guest_id: guest.id,
          room_id: reservationData.roomId,
          check_in_date: reservationData.checkInDate,
          check_out_date: reservationData.checkOutDate,
          total_amount: reservationData.totalAmount,
          status_id: statusData.id,
          created_by: reservationData.createdBy
        })
        .select(`
          *,
          guest:guest_id(full_name, phone, document_type, document_number),
          room:room_id(room_number, base_price),
          status:status_id(status, color),
          branch:branch_id(name)
        `)
        .single()

      if (reservationError) throw reservationError

      console.log('✅ Reservación creada exitosamente:', reservation.reservation_code)
      return { data: reservation, error: null }
    } catch (error) {
      console.error('❌ Error creando reservación:', error)
      return { data: null, error }
    }
  },

  // Obtener reservaciones por sucursal
  async getReservationsByBranch(branchId, filters = {}) {
    try {
      let query = supabase
        .from('reservations')
        .select(`
          id,
          reservation_code,
          check_in_date,
          check_out_date,
          total_amount,
          paid_amount,
          created_at,
          guest:guest_id(
            id,
            full_name,
            phone,
            document_type,
            document_number
          ),
          room:room_id(
            id,
            room_number,
            floor,
            base_price
          ),
          status:status_id(
            id,
            status,
            color,
            description
          ),
          created_by_user:created_by(
            first_name,
            last_name
          )
        `)
        .eq('branch_id', branchId)

      // Aplicar filtros
      if (filters.status) {
        const { data: statusData } = await supabase
          .from('reservation_status')
          .select('id')
          .eq('status', filters.status)
          .single()
        
        if (statusData) {
          query = query.eq('status_id', statusData.id)
        }
      }

      if (filters.dateFrom) {
        query = query.gte('check_in_date', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('check_out_date', filters.dateTo)
      }

      if (filters.guestName) {
        // Buscar por nombre de huésped
        const { data: guests } = await supabase
          .from('guests')
          .select('id')
          .ilike('full_name', `%${filters.guestName}%`)
        
        if (guests?.length > 0) {
          const guestIds = guests.map(g => g.id)
          query = query.in('guest_id', guestIds)
        } else {
          return { data: [], error: null }
        }
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(filters.limit || 50)

      if (error) throw error

      // Agregar campos calculados
      const enrichedData = data?.map(reservation => {
        const checkIn = new Date(reservation.check_in_date);
        const checkOut = new Date(reservation.check_out_date);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        
        return {
          ...reservation,
          balance: reservation.total_amount - (reservation.paid_amount || 0),
          nights: nights,
          isToday: checkIn.toDateString() === new Date().toDateString(),
          isPending: reservation.status?.status === 'pendiente',
          isConfirmed: reservation.status?.status === 'confirmada',
          canCheckIn: reservation.status?.status === 'confirmada' && 
                     checkIn <= new Date()
        }
      }) || []

      return { data: enrichedData, error: null }
    } catch (error) {
      console.error('❌ Error obteniendo reservaciones:', error)
      return { data: [], error }
    }
  },

  // Buscar reservaciones
  async searchReservations(branchId, searchTerm) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          reservation_code,
          check_in_date,
          check_out_date,
          total_amount,
          guest:guest_id(full_name, phone),
          room:room_id(room_number),
          status:status_id(status, color)
        `)
        .eq('branch_id', branchId)
        .or(`reservation_code.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error buscando reservaciones:', error)
      return { data: [], error }
    }
  },

  // Actualizar estado de reservación
  async updateReservationStatus(reservationId, newStatus, userId) {
    try {
      // Obtener ID del nuevo estado
      const { data: statusData, error: statusError } = await supabase
        .from('reservation_status')
        .select('id')
        .eq('status', newStatus)
        .single()

      if (statusError) throw statusError

      const { data, error } = await supabase
        .from('reservations')
        .update({ 
          status_id: statusData.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select(`
          *,
          status:status_id(status, color)
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error actualizando estado de reservación:', error)
      return { data: null, error }
    }
  },

  // Confirmar reservación
  async confirmReservation(reservationId, userId) {
    return this.updateReservationStatus(reservationId, 'confirmada', userId)
  },

  // Cancelar reservación
  async cancelReservation(reservationId, userId, reason = '') {
    try {
      const result = await this.updateReservationStatus(reservationId, 'cancelada', userId)
      
      if (result.data && reason) {
        console.log(`Reservación ${reservationId} cancelada. Razón: ${reason}`)
      }
      
      return result
    } catch (error) {
      console.error('❌ Error cancelando reservación:', error)
      return { data: null, error }
    }
  },

  // Agregar pago a reservación
  async addPayment(reservationId, paymentData) {
    try {
      const { data: payment, error: paymentError } = await supabase
        .from('reservation_payments')
        .insert({
          reservation_id: reservationId,
          payment_method_id: paymentData.paymentMethodId,
          amount: paymentData.amount,
          payment_reference: paymentData.reference || null,
          payment_date: paymentData.paymentDate || new Date().toISOString(),
          processed_by: paymentData.processedBy
        })
        .select(`
          *,
          payment_method:payment_method_id(name, requires_reference)
        `)
        .single()

      if (paymentError) throw paymentError

      console.log('✅ Pago agregado exitosamente:', payment.amount)
      return { data: payment, error: null }
    } catch (error) {
      console.error('❌ Error agregando pago:', error)
      return { data: null, error }
    }
  },

  // Obtener pagos de una reservación
  async getReservationPayments(reservationId) {
    try {
      const { data, error } = await supabase
        .from('reservation_payments')
        .select(`
          id,
          amount,
          payment_reference,
          payment_date,
          created_at,
          payment_method:payment_method_id(name),
          processed_by_user:processed_by(first_name, last_name)
        `)
        .eq('reservation_id', reservationId)
        .order('payment_date', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error obteniendo pagos:', error)
      return { data: [], error }
    }
  }
}

// =====================================================
// 👥 SERVICIOS DE HUÉSPEDES (CORREGIDO)
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

// Servicios extendidos de huéspedes
export const extendedGuestService = {
  ...guestService,

  // Obtener huésped por ID con reservaciones
  async getGuestById(guestId) {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select(`
          *,
          reservations:reservations(
            id,
            reservation_code,
            check_in_date,
            check_out_date,
            total_amount,
            paid_amount,
            status:status_id(status, color),
            room:room_id(room_number)
          )
        `)
        .eq('id', guestId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error obteniendo huésped:', error)
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
        paymentMethodsResult
      ] = await Promise.all([
        roomService.getRoomsWithStatus(branchId),
        quickCheckinService.getActiveQuickCheckins(branchId),
        paymentService.getPaymentMethods()
      ])

      console.log('📊 Results received:', {
        rooms: roomsResult.data?.length || 0,
        quickCheckins: quickCheckinsResult.data?.length || 0,
        paymentMethods: paymentMethodsResult.data?.length || 0
      })

      if (roomsResult.error) {
        console.error('❌ Error fetching rooms:', roomsResult.error)
        throw new Error(`Error al cargar habitaciones: ${roomsResult.error.message}`)
      }

      return {
        rooms: roomsResult.data || [],
        quickCheckins: quickCheckinsResult.data || [],
        snackCategories: [], // Para compatibilidad
        snackItems: [], // Para compatibilidad
        paymentMethods: paymentMethodsResult.data || [],
        error: null
      }
    } catch (error) {
      console.error('❌ Error fetching checkin dashboard data:', error)
      return {
        rooms: [],
        quickCheckins: [],
        snackCategories: [],
        snackItems: [],
        paymentMethods: [],
        error
      }
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
  },

  subscribeToReservationChanges(branchId, callback) {
    return supabase
      .channel('reservation-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `branch_id=eq.${branchId}`
        },
        callback
      )
      .subscribe()
  }
}

// =====================================================
// 🔄 SERVICIOS DE SINCRONIZACIÓN
// =====================================================
export const syncService = {
  // Sincronizar datos después de operaciones importantes
  async syncReservationData(reservationId) {
    try {
      // Recargar datos completos de la reservación
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          guest:guest_id(*),
          room:room_id(*),
          status:status_id(*),
          payments:reservation_payments(*),
          checkin_orders(*)
        `)
        .eq('id', reservationId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error sincronizando datos de reservación:', error)
      return { data: null, error }
    }
  },

  // Verificar disponibilidad en tiempo real
  async verifyRoomAvailability(roomId, checkInDate, checkOutDate, excludeReservationId = null) {
    try {
      let query = supabase
        .from('reservations')
        .select('id, reservation_code, check_in_date, check_out_date')
        .eq('room_id', roomId)
        .not('check_out_date', 'lte', checkInDate)
        .not('check_in_date', 'gte', checkOutDate)

      if (excludeReservationId) {
        query = query.neq('id', excludeReservationId)
      }

      const { data, error } = await query

      if (error) throw error

      const isAvailable = data.length === 0
      return { 
        data: { 
          isAvailable, 
          conflictingReservations: data 
        }, 
        error: null 
      }
    } catch (error) {
      console.error('❌ Error verificando disponibilidad:', error)
      return { data: { isAvailable: false, conflictingReservations: [] }, error }
    }
  }
}

// =====================================================
// 📊 SERVICIOS DE ANÁLISIS ADICIONALES
// =====================================================
export const analyticsService = {
  // Análisis de ocupación por período
  async getOccupancyAnalysis(branchId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select(`
          report_date,
          occupancy_rate,
          total_revenue,
          occupied_rooms,
          available_rooms
        `)
        .eq('branch_id', branchId)
        .gte('report_date', startDate)
        .lte('report_date', endDate)
        .order('report_date')

      if (error) throw error

      const analysis = {
        averageOccupancy: data.length > 0 ? 
          data.reduce((sum, day) => sum + day.occupancy_rate, 0) / data.length : 0,
        totalRevenue: data.reduce((sum, day) => sum + day.total_revenue, 0),
        peakOccupancy: Math.max(...data.map(day => day.occupancy_rate), 0),
        dailyData: data
      }

      return { data: analysis, error: null }
    } catch (error) {
      console.error('❌ Error en análisis de ocupación:', error)
      return { data: null, error }
    }
  },

  // Análisis de huéspedes frecuentes
  async getFrequentGuests(branchId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select(`
          id,
          full_name,
          phone,
          reservations!inner(
            branch_id,
            total_amount,
            status:status_id(status)
          )
        `)
        .eq('reservations.branch_id', branchId)

      if (error) throw error

      // Procesar datos para obtener estadísticas por huésped
      const guestStats = data.reduce((acc, guest) => {
        const completedReservations = guest.reservations.filter(r => 
          ['completada', 'en_uso'].includes(r.status.status)
        )
        
        if (completedReservations.length > 0) {
          acc.push({
            id: guest.id,
            name: guest.full_name,
            phone: guest.phone,
            totalVisits: completedReservations.length,
            totalSpent: completedReservations.reduce((sum, r) => sum + r.total_amount, 0),
            averageSpending: completedReservations.reduce((sum, r) => sum + r.total_amount, 0) / completedReservations.length
          })
        }
        
        return acc
      }, [])

      // Ordenar por número de visitas
      const sortedGuests = guestStats
        .sort((a, b) => b.totalVisits - a.totalVisits)
        .slice(0, limit)

      return { data: sortedGuests, error: null }
    } catch (error) {
      console.error('❌ Error obteniendo huéspedes frecuentes:', error)
      return { data: [], error }
    }
  }
}

// =====================================================
// 🍿 SERVICIOS DE SNACKS (COMPATIBILIDAD)
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
      return { data: [], error }
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
      return { data: [], error }
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
// 🏢 SERVICIOS DE SUCURSALES (NUEVO)
// =====================================================
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
        branch_uuid: branchId
      })

      if (error) throw error

      // Si no hay datos, devolver estructura básica
      const stats = data?.[0] || {
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

// =====================================================
// 📦 SERVICIOS DE SUMINISTROS (AGREGAR AL FINAL)
// =====================================================
export const suppliesService = {
  // Obtener todos los suministros con filtros
  async getSupplies(filters = {}) {
    try {
      let query = supabase
        .from('supplies')
        .select(`
          id,
          name,
          unit_of_measure,
          minimum_stock,
          current_stock,
          unit_cost,
          sku,
          is_active,
          created_at,
          updated_at,
          category:category_id(
            id,
            name
          ),
          supplier:supplier_id(
            id,
            name,
            contact_person,
            phone
          )
        `)
        .eq('is_active', true)

      // Aplicar filtros
      if (filters.category) {
        query = query.eq('category_id', filters.category)
      }

      if (filters.supplier) {
        query = query.eq('supplier_id', filters.supplier)
      }

      if (filters.lowStock) {
        query = query.filter('current_stock', 'lte', 'minimum_stock')
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
      }

      const { data, error } = await query.order('name')

      if (error) throw error

      // Enriquecer datos con campos calculados
      const enrichedData = data?.map(supply => ({
        ...supply,
        stockStatus: this.getStockStatus(supply.current_stock, supply.minimum_stock),
        totalValue: supply.current_stock * supply.unit_cost,
        needsRestock: supply.current_stock <= supply.minimum_stock,
        isOutOfStock: supply.current_stock === 0,
        stockPercentage: supply.minimum_stock > 0 
          ? Math.round((supply.current_stock / supply.minimum_stock) * 100)
          : 100
      })) || []

      return { data: enrichedData, error: null }
    } catch (error) {
      console.error('Error fetching supplies:', error)
      return { data: [], error }
    }
  },

  // Obtener categorías de suministros
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('supply_categories')
        .select(`
          id,
          name,
          parent_category_id,
          is_active,
          created_at,
          parent_category:parent_category_id(name)
        `)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching categories:', error)
      return { data: [], error }
    }
  },

  // Obtener proveedores
  async getSuppliers() {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select(`
          id,
          name,
          contact_person,
          email,
          phone,
          tax_id,
          payment_terms,
          is_active,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      return { data: [], error }
    }
  },

  // Obtener alertas de inventario
  async getAlerts() {
    try {
      const { data, error } = await supabase
        .from('inventory_alerts')
        .select(`
          id,
          alert_type,
          message,
          is_resolved,
          resolved_at,
          created_at,
          supply:supply_id(
            id,
            name,
            current_stock,
            minimum_stock
          ),
          resolved_by_user:resolved_by(
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching alerts:', error)
      return { data: [], error }
    }
  },

  // Crear nuevo suministro
  async createSupply(supplyData) {
    try {
      const { data, error } = await supabase
        .from('supplies')
        .insert({
          name: supplyData.name,
          category_id: supplyData.categoryId,
          unit_of_measure: supplyData.unitOfMeasure,
          minimum_stock: supplyData.minimumStock || 0,
          current_stock: supplyData.currentStock || 0,
          unit_cost: supplyData.unitCost || 0,
          supplier_id: supplyData.supplierId || null,
          sku: supplyData.sku || null,
          is_active: true
        })
        .select(`
          *,
          category:category_id(name),
          supplier:supplier_id(name)
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating supply:', error)
      return { data: null, error }
    }
  },

  // Actualizar suministro
  async updateSupply(supplyId, updateData) {
    try {
      const { data, error } = await supabase
        .from('supplies')
        .update({
          name: updateData.name,
          category_id: updateData.categoryId,
          unit_of_measure: updateData.unitOfMeasure,
          minimum_stock: updateData.minimumStock,
          unit_cost: updateData.unitCost,
          supplier_id: updateData.supplierId,
          sku: updateData.sku,
          updated_at: new Date().toISOString()
        })
        .eq('id', supplyId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating supply:', error)
      return { data: null, error }
    }
  },

  // Eliminar suministro (soft delete)
  async deleteSupply(supplyId) {
    try {
      const { error } = await supabase
        .from('supplies')
        .update({ is_active: false })
        .eq('id', supplyId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error deleting supply:', error)
      return { error }
    }
  },

  // Agregar movimiento de stock
  async addMovement(movementData) {
    try {
      const { data, error } = await supabase
        .from('supply_movements')
        .insert({
          supply_id: movementData.supplyId,
          branch_id: movementData.branchId,
          movement_type: movementData.movementType, // 'in', 'out', 'adjustment'
          quantity: movementData.quantity,
          unit_cost: movementData.unitCost || 0,
          total_cost: (movementData.quantity || 0) * (movementData.unitCost || 0),
          reference_document: movementData.referenceDocument || null,
          processed_by: movementData.processedBy
        })
        .select(`
          *,
          supply:supply_id(name),
          processed_by_user:processed_by(first_name, last_name)
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error adding movement:', error)
      return { data: null, error }
    }
  },

  // Obtener movimientos de un suministro
  async getMovements(supplyId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('supply_movements')
        .select(`
          id,
          movement_type,
          quantity,
          unit_cost,
          total_cost,
          reference_document,
          created_at,
          supply:supply_id(name),
          processed_by_user:processed_by(first_name, last_name)
        `)
        .eq('supply_id', supplyId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching movements:', error)
      return { data: [], error }
    }
  },

  // Resolver alerta
  async resolveAlert(alertId, userId) {
    try {
      const { error } = await supabase
        .from('inventory_alerts')
        .update({
          is_resolved: true,
          resolved_by: userId,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error resolving alert:', error)
      return { error }
    }
  },

  // Crear categoría
  async createCategory(categoryData) {
    try {
      const { data, error } = await supabase
        .from('supply_categories')
        .insert({
          name: categoryData.name,
          parent_category_id: categoryData.parentCategoryId || null,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating category:', error)
      return { data: null, error }
    }
  },

  // Crear proveedor
  async createSupplier(supplierData) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          name: supplierData.name,
          contact_person: supplierData.contactPerson || null,
          email: supplierData.email || null,
          phone: supplierData.phone || null,
          tax_id: supplierData.taxId || null,
          payment_terms: supplierData.paymentTerms || null,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating supplier:', error)
      return { data: null, error }
    }
  },

  // Buscar suministros
  async searchSupplies(searchTerm, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('supplies')
        .select(`
          id,
          name,
          sku,
          current_stock,
          minimum_stock,
          category:category_id(name)
        `)
        .eq('is_active', true)
        .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
        .order('name')
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error searching supplies:', error)
      return { data: [], error }
    }
  },

  // Utilidades
  getStockStatus(currentStock, minimumStock) {
    if (currentStock === 0) return 'out_of_stock'
    if (currentStock <= minimumStock) return 'low_stock'
    if (currentStock <= minimumStock * 1.5) return 'medium_stock'
    return 'good_stock'
  },

  getStockStatusColor(status) {
    const colors = {
      'out_of_stock': 'text-red-800 bg-red-100 border-red-200',
      'low_stock': 'text-orange-800 bg-orange-100 border-orange-200',
      'medium_stock': 'text-yellow-800 bg-yellow-100 border-yellow-200',
      'good_stock': 'text-green-800 bg-green-100 border-green-200'
    }
    return colors[status] || colors.good_stock
  },

  getStockStatusText(status) {
    const texts = {
      'out_of_stock': 'Agotado',
      'low_stock': 'Stock Bajo',
      'medium_stock': 'Stock Medio',
      'good_stock': 'Stock Bueno'
    }
    return texts[status] || 'Desconocido'
  },

  formatMovementType(type) {
    const types = {
      'in': 'Entrada',
      'out': 'Salida',
      'adjustment': 'Ajuste'
    }
    return types[type] || type
  }
}