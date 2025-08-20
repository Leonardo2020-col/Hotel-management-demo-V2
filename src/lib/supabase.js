// src/lib/supabase.js - VERSIÓN FINAL CORREGIDA PARA TU ESQUEMA COMPLETO
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