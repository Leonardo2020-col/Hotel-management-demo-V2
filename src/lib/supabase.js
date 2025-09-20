import { createClient } from '@supabase/supabase-js'
import { branchService } from '../lib/branchService'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY')
  throw new Error('Supabase configuration missing')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


// =====================================================
// 🔐 SERVICIOS DE AUTENTICACIÓN
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
        .eq('auth_id', authUserId)
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
      console.log('🔄 Updating room status:', { roomId, statusName })

      // Obtener el ID del estado por nombre
      const { data: statusData, error: statusError } = await supabase
        .from('room_status')
        .select('id, status, color, is_available')
        .eq('status', statusName)
        .single()

      if (statusError) {
        console.error('❌ Error getting room status:', statusError)
        throw new Error(`Estado de habitación "${statusName}" no encontrado`)
      }

      // Actualizar la habitación
      const { data, error } = await supabase
        .from('rooms')
        .update({ 
          status_id: statusData.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId)
        .select(`
          id,
          room_number,
          floor,
          base_price,
          room_status:status_id(
            id,
            status,
            color,
            is_available
          )
        `)
        .single()

      if (error) {
        console.error('❌ Error updating room:', error)
        throw error
      }

      console.log('✅ Room status updated successfully:', data.room_number, '→', statusName)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error in updateRoomStatus:', error)
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
// 📅 SERVICIOS DE RESERVACIONES
// =====================================================
export const reservationService = {
  async createReservation(reservationData, guestData) {
    try {
      console.log('🎫 Creando nueva reservación...', reservationData)
      
      // 1. Crear o encontrar huésped
      let guest = null
      if (guestData.id) {
        guest = { id: guestData.id }
      } else {
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

      // 3. Crear reservación
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

  async updateReservationStatus(reservationId, newStatus, userId) {
    try {
      console.log('🔄 Updating reservation status:', { reservationId, newStatus, userId })

      // Obtener el ID del estado por nombre
      const { data: statusData, error: statusError } = await supabase
        .from('reservation_status')
        .select('id, status, color')
        .eq('status', newStatus)
        .single()

      if (statusError) {
        console.error('❌ Error getting status:', statusError)
        throw new Error(`Estado "${newStatus}" no encontrado`)
      }

      // Actualizar la reservación
      const { data, error } = await supabase
        .from('reservations')
        .update({ 
          status_id: statusData.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select(`
          *,
          status:status_id(id, status, color, description)
        `)
        .single()

      if (error) {
        console.error('❌ Error updating reservation:', error)
        throw error
      }

      // Si el estado cambia a 'en_uso', actualizar habitación a 'ocupada'
      if (newStatus === 'en_uso') {
        await this.updateRoomStatusForReservation(reservationId, 'ocupada')
      }
      
      // Si el estado cambia a 'completada', actualizar habitación a 'limpieza'
      if (newStatus === 'completada') {
        await this.updateRoomStatusForReservation(reservationId, 'limpieza')
      }

      console.log('✅ Reservation status updated successfully:', data.status.status)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error in updateReservationStatus:', error)
      return { data: null, error }
    }
  },

  async updateRoomStatusForReservation(reservationId, roomStatus) {
    try {
      console.log('🏨 Updating room status for reservation:', { reservationId, roomStatus })

      // Obtener la habitación de la reservación
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .select('room_id')
        .eq('id', reservationId)
        .single()

      if (reservationError || !reservation.room_id) {
        console.warn('⚠️ Could not find room for reservation:', reservationError)
        return
      }

      // Obtener el ID del estado de habitación
      const { data: roomStatusData, error: roomStatusError } = await supabase
        .from('room_status')
        .select('id')
        .eq('status', roomStatus)
        .single()

      if (roomStatusError) {
        console.warn('⚠️ Room status not found:', roomStatus)
        return
      }

      // Actualizar la habitación
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ 
          status_id: roomStatusData.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservation.room_id)

      if (updateError) {
        console.warn('⚠️ Error updating room status:', updateError)
      } else {
        console.log('✅ Room status updated successfully:', roomStatus)
      }
    } catch (error) {
      console.warn('⚠️ Error in updateRoomStatusForReservation:', error)
    }
  },

  async addPayment(reservationId, paymentData) {
    try {
      console.log('💳 Adding payment to reservation:', { reservationId, paymentData })
      
      // Obtener o crear método de pago simplificado
      let paymentMethodId = await this.getOrCreatePaymentMethod(paymentData.paymentMethodId)
      
      const { data, error } = await supabase
        .from('reservation_payments')
        .insert({
          reservation_id: reservationId,
          payment_method_id: paymentMethodId,
          amount: paymentData.amount,
          payment_reference: paymentData.reference || null,
          payment_date: paymentData.paymentDate || new Date().toISOString(),
          processed_by: paymentData.processedBy
        })
        .select(`
          *,
          payment_method:payment_method_id(id, name),
          processed_by_user:processed_by(first_name, last_name)
        `)
        .single()

      if (error) {
        console.error('❌ Error adding payment:', error)
        throw error
      }

      console.log('✅ Payment added successfully:', data.id)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error in addPayment:', error)
      return { data: null, error }
    }
  },

  async getOrCreatePaymentMethod(methodId) {
    try {
      // Mapeo de métodos simplificados
      const methodMap = {
        'efectivo': 'efectivo',
        'transferencia': 'transferencia',
        'billetera_digital': 'pago_movil'
      }

      const mappedMethod = methodMap[methodId] || 'efectivo'

      // Buscar método existente
      const { data: existingMethod, error: searchError } = await supabase
        .from('payment_methods')
        .select('id')
        .eq('name', mappedMethod)
        .single()

      if (!searchError && existingMethod) {
        return existingMethod.id
      }

      // Crear método si no existe
      const { data: newMethod, error: createError } = await supabase
        .from('payment_methods')
        .insert({
          name: mappedMethod,
          description: `Método de pago: ${mappedMethod}`,
          is_active: true,
          requires_reference: methodId !== 'efectivo'
        })
        .select('id')
        .single()

      if (createError) {
        console.warn('⚠️ Could not create payment method, using default')
        return null
      }

      return newMethod.id
    } catch (error) {
      console.warn('⚠️ Error handling payment method:', error)
      return null
    }
  },

   async getReservationPayments(reservationId) {
    try {
      console.log('💰 Fetching payments for reservation:', reservationId)
      
      const { data, error } = await supabase
        .from('reservation_payments')
        .select(`
          *,
          payment_method:payment_method_id(id, name),
          processed_by_user:processed_by(first_name, last_name)
        `)
        .eq('reservation_id', reservationId)
        .order('payment_date', { ascending: false })

      if (error) {
        console.error('❌ Error fetching payments:', error)
        throw error
      }

      console.log('✅ Payments fetched successfully:', data?.length || 0)
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Error in getReservationPayments:', error)
      return { data: [], error }
    }
  },

  async createCheckinOrder(checkinData) {
    try {
      console.log('🎯 Creating checkin order:', checkinData)
      
      const { data, error } = await supabase
        .from('checkin_orders')
        .insert({
          reservation_id: checkinData.reservationId,
          quick_checkin_id: null, // Solo para reservaciones normales
          room_id: checkinData.roomId,
          guest_id: checkinData.guestId,
          check_in_time: checkinData.checkInTime || new Date().toISOString(),
          expected_checkout: checkinData.expectedCheckout,
          key_cards_issued: checkinData.keyCardsIssued || 1,
          deposit_amount: checkinData.depositAmount || 0,
          processed_by: checkinData.processedBy
        })
        .select(`
          *,
          reservation:reservation_id(reservation_code),
          room:room_id(room_number),
          guest:guest_id(full_name),
          processed_by_user:processed_by(first_name, last_name)
        `)
        .single()

      if (error) throw error

      console.log('✅ Checkin order created successfully:', data.id)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error creating checkin order:', error)
      return { data: null, error }
    }
  },

  async createCheckoutOrder(checkoutData) {
    try {
      console.log('🚪 Creating checkout order:', checkoutData)
      
      // Primero necesitamos encontrar la orden de checkin
      const { data: checkinOrder, error: checkinError } = await supabase
        .from('checkin_orders')
        .select('id')
        .eq('reservation_id', checkoutData.reservationId)
        .single()

      if (checkinError || !checkinOrder) {
        throw new Error('No se encontró la orden de check-in asociada')
      }

      const { data, error } = await supabase
        .from('checkout_orders')
        .insert({
          checkin_order_id: checkinOrder.id,
          checkout_time: checkoutData.checkoutTime || new Date().toISOString(),
          total_charges: checkoutData.totalCharges || 0,
          deposit_returned: checkoutData.depositReturned || 0,
          additional_charges: checkoutData.additionalCharges || [],
          room_condition: checkoutData.roomCondition || 'good',
          key_cards_returned: checkoutData.keyCardsReturned || 1,
          processed_by: checkoutData.processedBy
        })
        .select(`
          *,
          checkin_order:checkin_order_id(
            reservation:reservation_id(reservation_code),
            room:room_id(room_number),
            guest:guest_id(full_name)
          ),
          processed_by_user:processed_by(first_name, last_name)
        `)
        .single()

      if (error) throw error

      console.log('✅ Checkout order created successfully:', data.id)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error creating checkout order:', error)
      return { data: null, error }
    }
  },

  async getCheckinOrders(branchId, filters = {}) {
    try {
      console.log('🎯 Fetching checkin orders:', { branchId, filters })
      
      let query = supabase
        .from('checkin_orders')
        .select(`
          *,
          reservation:reservation_id(
            reservation_code,
            check_in_date,
            check_out_date,
            total_amount,
            branch_id
          ),
          quick_checkin:quick_checkin_id(
            guest_name,
            amount,
            branch_id
          ),
          room:room_id(room_number, floor),
          guest:guest_id(full_name, phone),
          processed_by_user:processed_by(first_name, last_name)
        `)

      // Filtrar por sucursal a través de la reservación o quick_checkin
      if (branchId) {
        query = query.or(`reservation.branch_id.eq.${branchId},quick_checkin.branch_id.eq.${branchId}`)
      }

      // Filtros adicionales
      if (filters.dateFrom) {
        query = query.gte('check_in_time', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('check_in_time', filters.dateTo)
      }

      if (filters.activeOnly) {
        query = query.is('actual_checkout', null)
      }

      const { data, error } = await query
        .order('check_in_time', { ascending: false })
        .limit(filters.limit || 50)

      if (error) throw error

      console.log('✅ Checkin orders fetched successfully:', data?.length || 0)
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Error fetching checkin orders:', error)
      return { data: [], error }
    }
  },

  async getCheckoutOrders(branchId, filters = {}) {
    try {
      console.log('🚪 Fetching checkout orders:', { branchId, filters })
      
      let query = supabase
        .from('checkout_orders')
        .select(`
          *,
          checkin_order:checkin_order_id(
            reservation:reservation_id(
              reservation_code,
              branch_id
            ),
            quick_checkin:quick_checkin_id(
              guest_name,
              branch_id
            ),
            room:room_id(room_number, floor),
            guest:guest_id(full_name, phone)
          ),
          processed_by_user:processed_by(first_name, last_name)
        `)

      // Filtrar por sucursal
      if (branchId) {
        query = query.or(
          `checkin_order.reservation.branch_id.eq.${branchId},checkin_order.quick_checkin.branch_id.eq.${branchId}`
        )
      }

      // Filtros adicionales
      if (filters.dateFrom) {
        query = query.gte('checkout_time', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('checkout_time', filters.dateTo)
      }

      const { data, error } = await query
        .order('checkout_time', { ascending: false })
        .limit(filters.limit || 50)

      if (error) throw error

      console.log('✅ Checkout orders fetched successfully:', data?.length || 0)
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Error fetching checkout orders:', error)
      return { data: [], error }
    }
  },

  // Función para buscar reservaciones
  async searchReservations(branchId, searchTerm) {
    try {
      console.log('🔍 Searching reservations:', { branchId, searchTerm })
      
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          reservation_code,
          check_in_date,
          check_out_date,
          total_amount,
          guest:guest_id(full_name, phone, document_number),
          room:room_id(room_number),
          status:status_id(status)
        `)
        .eq('branch_id', branchId)
        .or(`reservation_code.ilike.%${searchTerm}%,guest.full_name.ilike.%${searchTerm}%,guest.document_number.ilike.%${searchTerm}%,room.room_number.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      console.log('✅ Search completed:', data?.length || 0, 'results')
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Error searching reservations:', error)
      return { data: [], error }
    }
  },

  // Función para obtener estadísticas de check-in/check-out
  async getCheckinCheckoutStats(branchId, date = null) {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0]
    console.log('📊 Fetching checkin/checkout stats for:', targetDate)
    
    // Check-ins del día
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkin_orders')
      .select(`
        id,
        reservation:reservation_id(branch_id),
        quick_checkin:quick_checkin_id(branch_id)
      `)
      .gte('check_in_time', `${targetDate}T00:00:00.000Z`)
      .lt('check_in_time', `${targetDate}T23:59:59.999Z`)

    if (checkinsError) throw checkinsError

    // Filtrar por sucursal
    const branchCheckins = checkins?.filter(c => 
      c.reservation?.branch_id === branchId || 
      c.quick_checkin?.branch_id === branchId
    ) || []

    // Check-outs del día
    const { data: checkouts, error: checkoutsError } = await supabase
      .from('checkout_orders')
      .select(`
        id,
        checkin_order:checkin_order_id(
          reservation:reservation_id(branch_id),
          quick_checkin:quick_checkin_id(branch_id)
        )
      `)
      .gte('checkout_time', `${targetDate}T00:00:00.000Z`)
      .lt('checkout_time', `${targetDate}T23:59:59.999Z`)

    if (checkoutsError) throw checkoutsError

    // Filtrar por sucursal
    const branchCheckouts = checkouts?.filter(c => 
      c.checkin_order?.reservation?.branch_id === branchId || 
      c.checkin_order?.quick_checkin?.branch_id === branchId
    ) || []

    const stats = {
      date: targetDate,
      checkins: branchCheckins.length,
      checkouts: branchCheckouts.length,
      netOccupancy: branchCheckins.length - branchCheckouts.length
    }

    console.log('✅ Stats calculated:', stats)
    return { data: stats, error: null }
  } catch (error) {
    console.error('❌ Error fetching stats:', error)
    const fallbackDate = date || new Date().toISOString().split('T')[0]
    return { 
      data: { date: fallbackDate, checkins: 0, checkouts: 0, netOccupancy: 0 }, 
      error 
    }
  }
},

  // Función para verificar si una reservación puede hacer check-in
  async canPerformCheckin(reservationId) {
    try {
      const { data: reservation, error } = await supabase
        .from('reservations')
        .select(`
          check_in_date,
          status:status_id(status)
        `)
        .eq('id', reservationId)
        .single()

      if (error) throw error

      const today = new Date()
      const checkInDate = new Date(reservation.check_in_date)
      const status = reservation.status?.status

      const canCheckin = status === 'confirmada' && checkInDate <= today

      return { 
        data: { 
          canCheckin,
          reason: !canCheckin ? (
            status !== 'confirmada' ? 'Reservación no confirmada' :
            checkInDate > today ? 'Fecha de check-in no alcanzada' : 'Motivo desconocido'
          ) : null
        }, 
        error: null 
      }
    } catch (error) {
      console.error('❌ Error checking checkin eligibility:', error)
      return { data: { canCheckin: false, reason: 'Error verificando elegibilidad' }, error }
    }
  },

  // Función para verificar si una reservación puede hacer check-out
  async canPerformCheckout(reservationId) {
    try {
      const { data: reservation, error } = await supabase
        .from('reservations')
        .select(`
          check_out_date,
          status:status_id(status)
        `)
        .eq('id', reservationId)
        .single()

      if (error) throw error

      const today = new Date()
      const checkOutDate = new Date(reservation.check_out_date)
      const status = reservation.status?.status

      const canCheckout = status === 'en_uso'
      const isOverdue = checkOutDate < today

      return { 
        data: { 
          canCheckout,
          isOverdue,
          reason: !canCheckout ? (
            status !== 'en_uso' ? 'Reservación no está en uso' : 'Motivo desconocido'
          ) : null
        }, 
        error: null 
      }
    } catch (error) {
      console.error('❌ Error checking checkout eligibility:', error)
      return { data: { canCheckout: false, isOverdue: false, reason: 'Error verificando elegibilidad' }, error }
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
  },

  async getAllGuests(filters = {}) {
    try {
      console.log('👥 Fetching guests with filters:', filters);
      
      let query = supabase
        .from('guests')
        .select('*');

      // Filtros de búsqueda
      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,document_number.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      // Filtro por tipo de documento
      if (filters.documentType) {
        query = query.eq('document_type', filters.documentType);
      }

      // Filtro por fecha de registro
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Ordenamiento
      const orderBy = filters.orderBy || 'created_at';
      const order = filters.order || 'desc';
      query = query.order(orderBy, { ascending: order === 'asc' });

      // Paginación
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching guests:', error);
        throw error;
      }

      console.log('✅ Guests fetched successfully:', data?.length || 0);
      return { 
        data: data || [], 
        error: null,
        totalCount: count 
      };
    } catch (error) {
      console.error('❌ Error in getAllGuests:', error);
      return { data: [], error, totalCount: 0 };
    }
  },

  // Actualizar huésped existente
  async updateGuest(guestId, updateData) {
    try {
      console.log('🔄 Updating guest:', guestId, updateData);

      // Validaciones básicas
      if (!updateData.full_name?.trim()) {
        throw new Error('El nombre completo es requerido');
      }

      const { data, error } = await supabase
        .from('guests')
        .update({
          full_name: updateData.full_name.trim(),
          phone: updateData.phone?.trim() || null,
          document_type: updateData.document_type?.trim() || null,
          document_number: updateData.document_number?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', guestId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating guest:', error);
        throw error;
      }

      console.log('✅ Guest updated successfully:', data.full_name);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error in updateGuest:', error);
      return { data: null, error };
    }
  },

  // Eliminar huésped
  async deleteGuest(guestId) {
    try {
      console.log('🗑️ Deleting guest:', guestId);

      // Verificar si tiene reservaciones asociadas
      const { data: reservations, error: checkError } = await supabase
        .from('reservations')
        .select('id, reservation_code, check_in_date')
        .eq('guest_id', guestId)
        .limit(5);

      if (checkError) {
        console.warn('⚠️ Warning checking reservations:', checkError);
      }

      if (reservations && reservations.length > 0) {
        const reservationCodes = reservations.map(r => r.reservation_code).join(', ');
        throw new Error(`No se puede eliminar el huésped porque tiene ${reservations.length} reservación(es) asociada(s): ${reservationCodes}`);
      }

      // Eliminar huésped
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', guestId);

      if (error) {
        console.error('❌ Error deleting guest:', error);
        throw error;
      }

      console.log('✅ Guest deleted successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ Error in deleteGuest:', error);
      return { error };
    }
  },

  // Buscar huésped por número de documento
  async findGuestByDocument(documentNumber, documentType = null) {
    try {
      if (!documentNumber?.trim()) {
        return { data: null, error: null };
      }

      console.log('🔍 Searching guest by document:', documentNumber, documentType);

      let query = supabase
        .from('guests')
        .select('*')
        .eq('document_number', documentNumber.trim());

      if (documentType) {
        query = query.eq('document_type', documentType);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('❌ Error finding guest by document:', error);
        throw error;
      }

      console.log('✅ Guest search completed:', data ? 'Found' : 'Not found');
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error in findGuestByDocument:', error);
      return { data: null, error };
    }
  },

  // Obtener huésped por ID con historial
  async getGuestWithHistory(guestId) {
    try {
      console.log('📋 Fetching guest with history:', guestId);

      // Obtener datos del huésped
      const { data: guest, error: guestError } = await supabase
        .from('guests')
        .select('*')
        .eq('id', guestId)
        .single();

      if (guestError) {
        console.error('❌ Error fetching guest:', guestError);
        throw guestError;
      }

      // Obtener historial de reservaciones
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select(`
          id,
          reservation_code,
          check_in_date,
          check_out_date,
          total_amount,
          paid_amount,
          created_at,
          status:status_id(status, color),
          room:room_id(room_number, floor),
          branch:branch_id(name)
        `)
        .eq('guest_id', guestId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reservationsError) {
        console.warn('⚠️ Warning fetching reservations:', reservationsError);
      }

      const guestWithHistory = {
        ...guest,
        reservations: reservations || [],
        totalReservations: reservations?.length || 0,
        totalSpent: reservations?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0
      };

      console.log('✅ Guest with history fetched successfully');
      return { data: guestWithHistory, error: null };
    } catch (error) {
      console.error('❌ Error in getGuestWithHistory:', error);
      return { data: null, error };
    }
  },

  // Obtener estadísticas de huéspedes
  async getGuestsStatistics() {
    try {
      console.log('📊 Fetching guest statistics...');

      // Total de huéspedes
      const { count: totalGuests, error: totalError } = await supabase
        .from('guests')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Huéspedes registrados este mes
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: monthlyGuests, error: monthlyError } = await supabase
        .from('guests')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      if (monthlyError) throw monthlyError;

      // Huéspedes con información completa
      const { count: completeGuests, error: completeError } = await supabase
        .from('guests')
        .select('*', { count: 'exact', head: true })
        .not('document_number', 'is', null)
        .not('phone', 'is', null);

      if (completeError) throw completeError;

      // Top tipos de documento
      const { data: documentTypes, error: docTypesError } = await supabase
        .from('guests')
        .select('document_type')
        .not('document_type', 'is', null);

      let documentTypeCounts = {};
      if (!docTypesError && documentTypes) {
        documentTypeCounts = documentTypes.reduce((acc, guest) => {
          acc[guest.document_type] = (acc[guest.document_type] || 0) + 1;
          return acc;
        }, {});
      }

      const statistics = {
        total: totalGuests || 0,
        monthly: monthlyGuests || 0,
        complete: completeGuests || 0,
        withDocument: Object.values(documentTypeCounts).reduce((a, b) => a + b, 0),
        withPhone: 0, // Se calculará después
        documentTypes: documentTypeCounts,
        completionRate: totalGuests > 0 ? ((completeGuests / totalGuests) * 100).toFixed(1) : 0
      };

      // Calcular huéspedes con teléfono
      const { count: phoneCount } = await supabase
        .from('guests')
        .select('*', { count: 'exact', head: true })
        .not('phone', 'is', null);

      statistics.withPhone = phoneCount || 0;

      console.log('✅ Guest statistics calculated:', statistics);
      return { data: statistics, error: null };
    } catch (error) {
      console.error('❌ Error fetching guest statistics:', error);
      return { 
        data: {
          total: 0,
          monthly: 0,
          complete: 0,
          withDocument: 0,
          withPhone: 0,
          documentTypes: {},
          completionRate: 0
        }, 
        error 
      };
    }
  },

  // Validar duplicados antes de crear
  async checkForDuplicates(guestData) {
    try {
      console.log('🔍 Checking for duplicate guests...', guestData);

      const checks = [];

      // Buscar por número de documento
      if (guestData.document_number?.trim()) {
        checks.push(
          supabase
            .from('guests')
            .select('id, full_name, document_number')
            .eq('document_number', guestData.document_number.trim())
            .limit(1)
            .single()
        );
      }

      // Buscar por nombre completo exacto
      if (guestData.full_name?.trim()) {
        checks.push(
          supabase
            .from('guests')
            .select('id, full_name, phone')
            .ilike('full_name', guestData.full_name.trim())
            .limit(3)
        );
      }

      const results = await Promise.allSettled(checks);
      const duplicates = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.data) {
          if (Array.isArray(result.value.data)) {
            duplicates.push(...result.value.data);
          } else {
            duplicates.push(result.value.data);
          }
        }
      });

      console.log('✅ Duplicate check completed:', duplicates.length, 'potential matches');
      return { data: duplicates, error: null };
    } catch (error) {
      console.error('❌ Error checking duplicates:', error);
      return { data: [], error };
    }
  },

  // Exportar huéspedes a CSV
  async exportGuests(filters = {}) {
    try {
      console.log('📤 Exporting guests to CSV...', filters);

      const result = await this.getAllGuests({ ...filters, limit: 10000 });
      if (result.error) throw result.error;

      const guests = result.data;
      
      // Crear headers CSV
      const headers = [
        'ID',
        'Nombre Completo',
        'Tipo Documento',
        'Número Documento',
        'Teléfono',
        'Fecha Registro',
        'Última Actualización'
      ];

      // Convertir datos a CSV
      const csvRows = [
        headers.join(','),
        ...guests.map(guest => [
          guest.id,
          `"${guest.full_name}"`,
          guest.document_type || '',
          guest.document_number || '',
          guest.phone || '',
          new Date(guest.created_at).toLocaleDateString('es-PE'),
          new Date(guest.updated_at).toLocaleDateString('es-PE')
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');
      const filename = `huespedes_${new Date().toISOString().split('T')[0]}.csv`;

      console.log('✅ CSV export prepared:', guests.length, 'guests');
      return { 
        data: {
          content: csvContent,
          filename: filename,
          count: guests.length
        }, 
        error: null 
      };
    } catch (error) {
      console.error('❌ Error exporting guests:', error);
      return { data: null, error };
    }
  },

  // Importar huéspedes desde CSV
  async importGuestsFromCSV(csvData) {
    try {
      console.log('📥 Importing guests from CSV...');

      // Parsear CSV (implementación básica)
      const lines = csvData.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const guestsToImport = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim());
          
          const guestData = {
            full_name: values[1],
            document_type: values[2] || null,
            document_number: values[3] || null,
            phone: values[4] || null
          };

          // Validación básica
          if (!guestData.full_name) {
            errors.push(`Línea ${i + 1}: Nombre requerido`);
            continue;
          }

          guestsToImport.push(guestData);
        } catch (err) {
          errors.push(`Línea ${i + 1}: Error de formato - ${err.message}`);
        }
      }

      // Insertar en lotes
      if (guestsToImport.length > 0) {
        const { data, error } = await supabase
          .from('guests')
          .insert(guestsToImport)
          .select();

        if (error) throw error;

        console.log('✅ Guests imported successfully:', data.length);
        return { 
          data: {
            imported: data.length,
            errors: errors,
            guests: data
          }, 
          error: null 
        };
      } else {
        throw new Error('No hay datos válidos para importar');
      }
    } catch (error) {
      console.error('❌ Error importing guests:', error);
      return { data: null, error };
    }
  },

  // Buscar huéspedes similares (fuzzy search)
  async findSimilarGuests(searchTerm) {
    try {
      console.log('🔍 Finding similar guests:', searchTerm);

      if (!searchTerm?.trim()) {
        return { data: [], error: null };
      }

      // Búsqueda fuzzy usando trigram similarity (si está disponible)
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,document_number.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(10)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Ordenar por relevancia (implementación simple)
      const scoredResults = (data || []).map(guest => {
        let score = 0;
        const term = searchTerm.toLowerCase();
        
        if (guest.full_name?.toLowerCase().includes(term)) score += 3;
        if (guest.document_number?.includes(searchTerm)) score += 2;
        if (guest.phone?.includes(searchTerm)) score += 2;
        
        return { ...guest, relevanceScore: score };
      }).sort((a, b) => b.relevanceScore - a.relevanceScore);

      console.log('✅ Similar guests found:', scoredResults.length);
      return { data: scoredResults, error: null };
    } catch (error) {
      console.error('❌ Error finding similar guests:', error);
      return { data: [], error };
    }
  },

  // Utilidades de validación
  validateGuestData(guestData) {
    const errors = {};

    // Validar nombre completo
    if (!guestData.full_name?.trim()) {
      errors.full_name = 'El nombre completo es requerido';
    } else if (guestData.full_name.trim().length < 2) {
      errors.full_name = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar documento si se proporciona
    if (guestData.document_type && !guestData.document_number) {
      errors.document_number = 'El número de documento es requerido cuando se especifica el tipo';
    }

    if (guestData.document_number && !guestData.document_type) {
      errors.document_type = 'El tipo de documento es requerido cuando se especifica el número';
    }

    // Validar DNI peruano
    if (guestData.document_type === 'DNI' && guestData.document_number) {
      if (!/^\d{8}$/.test(guestData.document_number.replace(/\s/g, ''))) {
        errors.document_number = 'El DNI debe tener exactamente 8 dígitos';
      }
    }

    // Validar RUC peruano
    if (guestData.document_type === 'RUC' && guestData.document_number) {
      if (!/^\d{11}$/.test(guestData.document_number.replace(/\s/g, ''))) {
        errors.document_number = 'El RUC debe tener exactamente 11 dígitos';
      }
    }

    // Validar teléfono básico
    if (guestData.phone && !/^[\d\s\+\-\(\)]{7,15}$/.test(guestData.phone)) {
      errors.phone = 'El formato del teléfono no es válido';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Formatear datos de huésped
  formatGuestData(guest) {
    if (!guest) return null;

    return {
      ...guest,
      displayName: guest.full_name,
      hasDocument: !!(guest.document_type && guest.document_number),
      hasPhone: !!guest.phone,
      documentInfo: guest.document_type && guest.document_number 
        ? `${guest.document_type}: ${guest.document_number}`
        : null,
      formattedPhone: this.formatPhone(guest.phone),
      registeredDate: new Date(guest.created_at).toLocaleDateString('es-PE'),
      initials: this.getInitials(guest.full_name)
    };
  },

  // Formatear teléfono peruano
  formatPhone(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 9 && cleaned.startsWith('9')) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    
    if (cleaned.length === 11 && cleaned.startsWith('51')) {
      return `+51 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    }
    
    return phone;
  },

  // Obtener iniciales del nombre
  getInitials(name) {
    if (!name) return '';
    
    return name
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

}

// =====================================================
// 💳 SERVICIOS DE PAGOS
// =====================================================
export const paymentService = {
  async getPaymentMethods() {
    try {
      // Retornar métodos simplificados por defecto
      const simplifiedMethods = [
        { 
          id: 'efectivo', 
          name: 'efectivo', 
          description: 'Pago en efectivo',
          is_active: true, 
          requires_reference: false 
        },
        { 
          id: 'transferencia', 
          name: 'transferencia', 
          description: 'Transferencia bancaria',
          is_active: true, 
          requires_reference: true 
        },
        { 
          id: 'billetera_digital', 
          name: 'pago_movil', 
          description: 'Yape/Plin/Billetera Digital',
          is_active: true, 
          requires_reference: true 
        }
      ]

      // Intentar obtener métodos de la base de datos
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.warn('⚠️ Could not fetch payment methods from DB, using simplified methods:', error)
        return { data: simplifiedMethods, error: null }
      }

      // Si hay métodos en DB, usarlos; si no, usar los simplificados
      const methods = data && data.length > 0 ? data : simplifiedMethods

      console.log('✅ Payment methods loaded:', methods.length)
      return { data: methods, error: null }
    } catch (error) {
      console.error('❌ Error in getPaymentMethods:', error)
      // Fallback a métodos simplificados
      return { 
        data: [
          { id: 'efectivo', name: 'efectivo', requires_reference: false },
          { id: 'transferencia', name: 'transferencia', requires_reference: true },
          { id: 'billetera_digital', name: 'pago_movil', requires_reference: true }
        ], 
        error: null 
      }
    }
  }
}

// =====================================================
// 🍿 SERVICIOS DE SNACKS (CORREGIDO)
// =====================================================
export const snackService = {
  // Obtener categorías de snacks
  async getSnackCategories() {
    try {
      console.log('🏷️ Loading snack categories from database...')
      
      const { data, error } = await supabase
        .from('snack_categories')
        .select('id, name, is_active, created_at') // ✅ Solo campos que existen
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('❌ Error loading snack categories:', error)
        throw error
      }
      
      console.log('✅ Snack categories loaded:', data?.length || 0)
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Error fetching snack categories:', error)
      return { data: [], error }
    }
  },

  
  async getSnackItems() {
  try {
    console.log('🍿 Loading snack items from database...')
    
    // ✅ Helper function para generar slug
    const generateCategorySlug = (categoryName) => {
      if (!categoryName) return 'sin-categoria'
      
      return categoryName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[áéíóúñ]/g, match => {
          const accents = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'n' }
          return accents[match] || match
        })
        .replace(/[^a-z0-9-]/g, '')
    }
    
    const { data, error } = await supabase
      .from('snack_items')
      .select(`
        id,
        name,
        price,
        cost,
        stock,
        minimum_stock,
        is_active,
        category_id,
        created_at,
        updated_at,
        snack_category:category_id(
          id,
          name
        )
      `)
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('❌ Error loading snack items:', error)
      throw error
    }

    console.log('🔍 Raw data from Supabase:', data?.slice(0, 2))

    // ✅ Enriquecer datos con campos calculados
    const enrichedData = (data || []).map(item => ({
      ...item,
      category_name: item.snack_category?.name || 'Sin categoría',
      category_slug: generateCategorySlug(item.snack_category?.name),
      in_stock: item.stock > 0,
      low_stock: item.stock <= item.minimum_stock,
      stock_percentage: item.minimum_stock > 0 
        ? Math.round((item.stock / item.minimum_stock) * 100) 
        : 100,
      formatted_price: new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
      }).format(item.price),
      stock_status: this.getStockStatus(item.stock, item.minimum_stock)
    }))
    
    console.log('✅ Snack items loaded and enriched:', enrichedData.length)
    
    return { data: enrichedData, error: null }
  } catch (error) {
    console.error('❌ Error fetching snack items:', error)
    return { data: [], error }
  }
},
  // Obtener items de snacks agrupados por categoría
  async getSnackItemsGrouped() {
    try {
      const { data: items, error } = await this.getSnackItems()
      
      if (error) return { data: {}, error }

      // Agrupar por category_slug para compatibilidad con el frontend
      const grouped = {}
      
      items.forEach(item => {
        const categorySlug = item.category_slug
        if (!grouped[categorySlug]) {
          grouped[categorySlug] = []
        }
        grouped[categorySlug].push(item)
      })

      console.log('✅ Snack items grouped by category:', Object.keys(grouped).length)
      return { data: grouped, error: null }
    } catch (error) {
      console.error('❌ Error grouping snack items:', error)
      return { data: {}, error }
    }
  },

  // Crear nuevo item de snack
  async createSnackItem(itemData) {
    try {
      const { data, error } = await supabase
        .from('snack_items')
        .insert({
          name: itemData.name,
          category_id: itemData.categoryId,
          price: itemData.price,
          cost: itemData.cost || 0,
          stock: itemData.stock || 0,
          minimum_stock: itemData.minimumStock || 0,
          description: itemData.description || null,
          is_active: true
        })
        .select(`
          *,
          snack_category:category_id(name)
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error creating snack item:', error)
      return { data: null, error }
    }
  },

  // Actualizar stock de snack
  async updateSnackStock(snackId, newStock) {
    try {
      const { data, error } = await supabase
        .from('snack_items')
        .update({ 
          stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', snackId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error updating snack stock:', error)
      return { data: null, error }
    }
  },

  // Procesar consumo de snacks (reducir stock)
  async processSnackConsumption(snacksConsumed) {
    try {
      console.log('🔄 Processing snack consumption for', snacksConsumed.length, 'items')
      
      const updates = []
      
      for (const snack of snacksConsumed) {
        // Obtener stock actual
        const { data: currentItem, error: fetchError } = await supabase
          .from('snack_items')
          .select('stock')
          .eq('id', snack.id)
          .single()

        if (fetchError) {
          console.warn(`⚠️ Error fetching stock for snack ${snack.id}:`, fetchError)
          continue
        }

        // Calcular nuevo stock
        const newStock = Math.max(0, (currentItem.stock || 0) - snack.quantity)
        
        // Actualizar stock
        const { data, error } = await supabase
          .from('snack_items')
          .update({ 
            stock: newStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', snack.id)
          .select()
          .single()

        if (error) {
          console.warn(`⚠️ Error updating stock for snack ${snack.id}:`, error)
          continue
        }

        updates.push(data)
      }

      console.log('✅ Snack consumption processed:', updates.length, 'items updated')
      return { data: updates, error: null }
    } catch (error) {
      console.error('❌ Error processing snack consumption:', error)
      return { data: null, error }
    }
  },

  // Buscar snacks
  async searchSnacks(searchTerm, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('snack_items')
        .select(`
          id,
          name,
          price,
          stock,
          snack_category:category_id(name)
        `)
        .eq('is_active', true)
        .ilike('name', `%${searchTerm}%`)
        .order('name')
        .limit(limit)

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Error searching snacks:', error)
      return { data: [], error }
    }
  },

  // Obtener snacks con stock bajo
  async getLowStockSnacks() {
    try {
      const { data, error } = await supabase
        .from('snack_items')
        .select(`
          id,
          name,
          stock,
          minimum_stock,
          snack_category:category_id(name)
        `)
        .eq('is_active', true)
        .filter('stock', 'lte', 'minimum_stock')
        .order('stock')

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Error fetching low stock snacks:', error)
      return { data: [], error }
    }
  },

  // ✅ Utilidades corregidas
  generateCategorySlug(categoryName) {
    if (!categoryName) return 'sin-categoria'
    
    return categoryName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[áéíóúñ]/g, match => {
        const accents = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'n' }
        return accents[match] || match
      })
      .replace(/[^a-z0-9-]/g, '')
  },

  formatPrice(price) {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(price)
  },

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

  async updateSnackItem(snackId, updateData) {
  try {
    console.log('🔄 Updating snack item:', { snackId, updateData })
    
    const { data, error } = await supabase
      .from('snack_items')
      .update({
        name: updateData.name,
        category_id: updateData.categoryId,
        price: updateData.price,
        cost: updateData.cost || 0,
        stock: updateData.stock,
        minimum_stock: updateData.minimumStock || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', snackId)
      .select(`
        *,
        snack_category:category_id(name)
      `)
      .single()

    if (error) {
      console.error('❌ Error updating snack item:', error)
      throw error
    }

    console.log('✅ Snack item updated successfully:', data.name)
    return { data, error: null }
  } catch (error) {
    console.error('❌ Error in updateSnackItem:', error)
    return { data: null, error }
  }
},

// Crear categoría de snack
async createSnackCategory(categoryData) {
  try {
    console.log('🏷️ Creating snack category:', categoryData)
    
    const { data, error } = await supabase
      .from('snack_categories')
      .insert({
        name: categoryData.name,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating snack category:', error)
      throw error
    }

    console.log('✅ Snack category created successfully:', data.name)
    return { data, error: null }
  } catch (error) {
    console.error('❌ Error in createSnackCategory:', error)
    return { data: null, error }
  }
}
}

// =====================================================
// 🚀 SERVICIOS DE QUICK CHECK-INS (ACTUALIZADO)
// =====================================================
export const quickCheckinService = {
  // Obtener todos los datos necesarios para el dashboard de check-in
  async getQuickCheckinDashboardData() {
    try {
      console.log('🔄 Loading quick checkin dashboard data...')
      
      const [
        roomsResult,
        quickCheckinsResult,
        snackCategoriesResult,
        snackItemsResult,
        paymentMethodsResult
      ] = await Promise.all([
        this.getRoomsWithStatus(),
        this.getActiveQuickCheckins(),
        snackService.getSnackCategories(),
        snackService.getSnackItems(),
        paymentService.getPaymentMethods()
      ])

      console.log('📊 Dashboard data loaded:', {
        rooms: roomsResult.data?.length || 0,
        quickCheckins: quickCheckinsResult.data?.length || 0,
        snackCategories: snackCategoriesResult.data?.length || 0,
        snackItems: snackItemsResult.data?.length || 0,
        paymentMethods: paymentMethodsResult.data?.length || 0
      })

      return {
        rooms: roomsResult.data || [],
        quickCheckins: quickCheckinsResult.data || [],
        snackCategories: snackCategoriesResult.data || [],
        snackItems: snackItemsResult.data || [],
        paymentMethods: paymentMethodsResult.data || [],
        error: null
      }
    } catch (error) {
      console.error('❌ Error loading quick checkin dashboard data:', error)
      return {
        rooms: [],
        quickCheckins: [],
        snackCategories: [],
        snackItems: [],
        paymentMethods: [],
        error
      }
    }
  },

  // Obtener habitaciones con estado
  async getRoomsWithStatus() {
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
        .eq('is_active', true)
        .order('room_number')

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Error fetching rooms:', error)
      return { data: [], error }
    }
  },

  // Obtener quick checkins activos
  async getActiveQuickCheckins(branchId = null) {
  try {
    console.log('📋 Loading active quick checkins...', { branchId })
    
    let query = supabase
      .from('quick_checkins')
      .select(`
        id,
        branch_id,
        room_id,
        guest_name,
        guest_document,
        guest_phone,
        check_in_date,
        check_out_date,
        amount,
        snacks_consumed,
        created_at,
        created_by,
        room:room_id(
          id,
          room_number,
          floor,
          base_price
        ),
        payment_method:payment_method_id(
          id,
          name
        ),
        branch:branch_id(
          id,
          name
        )
      `)
      // ✅ CAMBIO CLAVE: Solo traer los que tienen check_out_date >= hoy
      .gte('check_out_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })

    // Filtrar por sucursal si se especifica
    if (branchId) {
      query = query.eq('branch_id', branchId)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Error loading quick checkins:', error)
      throw error
    }

    console.log('✅ Quick checkins loaded:', data?.length || 0)

    const structuredData = {}
    
    if (data && Array.isArray(data)) {
      data.forEach(checkin => {
        const roomNumber = checkin.room?.room_number
        if (roomNumber) {
          const docParts = checkin.guest_document?.split(':') || ['DNI', '']
          
          structuredData[roomNumber] = {
            id: checkin.id,
            room: {
              id: checkin.room.id,
              number: roomNumber,
              floor: checkin.room.floor,
              base_price: checkin.room.base_price
            },
            guest_name: checkin.guest_name,
            guest_document: checkin.guest_document,
            guest_phone: checkin.guest_phone,
            documentType: docParts[0],
            documentNumber: docParts[1],
            check_in_date: checkin.check_in_date,
            check_out_date: checkin.check_out_date,
            total_amount: checkin.amount,
            room_rate: checkin.room?.base_price || 0,
            confirmation_code: `QC-${checkin.id}-${checkin.created_at.slice(-4)}`,
            payment_method: checkin.payment_method?.name,
            branch_name: checkin.branch?.name,
            created_at: checkin.created_at,
            snacks_consumed: checkin.snacks_consumed || [],
            isQuickCheckin: true
          }
        }
      })
    }

    return { data: structuredData, error: null }

  } catch (error) {
    console.error('❌ Error in getActiveQuickCheckins:', error)
    return { data: {}, error }
  }
},


  // ✅ CREAR QUICK CHECKIN - VERSIÓN CORREGIDA CON SNACKS_CONSUMED
async createQuickCheckin(roomData, guestData, snacksData = []) {
  try {
    console.log('🎯 Creating quick checkin...', {
      room: roomData.room?.number || roomData.roomId,
      guest: guestData.fullName,
      snacks: snacksData.length,
      snacksDetails: snacksData
    })

    // ✅ VALIDACIONES
    if (!guestData.fullName?.trim()) {
      throw new Error('El nombre del huésped es obligatorio')
    }

    if (!roomData.roomId && !roomData.room?.id) {
      throw new Error('ID de habitación es requerido')
    }

    const roomId = roomData.roomId || roomData.room?.id
    const roomNumber = roomData.room?.number || roomData.room?.room_number || 'N/A'

    // ✅ OBTENER USUARIO ACTUAL Y BRANCH_ID
    const { data: { user } } = await supabase.auth.getUser()
    let createdByUserId = null
    let branchId = roomData.branchId

    if (user) {
      console.log('🔍 Auth user found:', user.id, user.email)
      
      const { data: internalUser, error: userError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, auth_id, user_branches!inner(branch_id, is_primary)')
        .eq('auth_id', user.id)
        .single()
      
      if (!userError && internalUser) {
        createdByUserId = internalUser.id
        
        if (!branchId && internalUser.user_branches?.length > 0) {
          const primaryBranch = internalUser.user_branches.find(ub => ub.is_primary)
          branchId = primaryBranch?.branch_id || internalUser.user_branches[0]?.branch_id
        }
        
        console.log('✅ Internal user found:', internalUser.email, 'ID:', createdByUserId, 'Branch:', branchId)
      } else {
        console.warn('⚠️ No internal user found for auth user:', user.email)
      }
    }
    
    // Si no se encuentra branch, usar el primero disponible
    if (!branchId) {
      const { data: firstBranch } = await supabase
        .from('branches')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single()
      
      branchId = firstBranch?.id
    }

    if (!branchId) {
      throw new Error('No se pudo determinar la sucursal')
    }

    // ✅ PREPARAR SNACKS PARA LA BASE DE DATOS
    console.log('🍿 Preparing snacks for database...', snacksData)
    const snacksForDB = snacksData.map(snack => {
      const snackData = {
        id: snack.id,
        name: snack.name,
        quantity: snack.quantity || 1,
        price: snack.price || 0,
        total: (snack.price || 0) * (snack.quantity || 1)
      }
      console.log('📦 Snack prepared:', snackData)
      return snackData
    })

    console.log('✅ All snacks prepared for DB:', snacksForDB)

    // ✅ Obtener método de pago
    let paymentMethodId = null
    if (roomData.paymentMethod) {
      const { data: paymentMethod } = await supabase
        .from('payment_methods')
        .select('id')
        .eq('name', roomData.paymentMethod === 'cash' ? 'efectivo' : roomData.paymentMethod)
        .single()
      
      paymentMethodId = paymentMethod?.id
    }

    // ✅ Calcular totales
    const roomPrice = roomData.roomPrice || roomData.room?.base_price || 100
    const snacksTotal = snacksForDB.reduce((total, snack) => total + (snack.total || 0), 0)
    const totalAmount = roomPrice + snacksTotal

    console.log('💰 Pricing breakdown:', {
      roomPrice,
      snacksTotal,
      totalAmount,
      snacksCount: snacksForDB.length
    })

    // ✅ Preparar datos del documento
    const documentInfo = guestData.documentNumber 
      ? `${guestData.documentType || 'DNI'}:${guestData.documentNumber}`
      : null
    
    // ✅ CORRECTO: Validar branchId obligatorio
if (!branchId) {
  throw new Error('Branch ID es requerido para crear quick checkin')
}

    // ✅ PREPARAR DATOS PARA INSERCIÓN
    const insertData = {
  branch_id: branchId,
  room_id: roomId,
  guest_name: guestData.fullName.trim(),
      guest_document: documentInfo,
      guest_phone: guestData.phone?.trim() || '',
      check_in_date: roomData.checkInDate || new Date().toISOString().split('T')[0],
      check_out_date: roomData.checkOutDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: totalAmount,
      payment_method_id: paymentMethodId,
      snacks_consumed: snacksForDB // 🔥 CLAVE: INCLUIR SNACKS AQUÍ
    }

    if (createdByUserId) {
      insertData.created_by = createdByUserId
    }

    console.log('📤 Final insert data with snacks:', {
      ...insertData,
      snacks_consumed_count: insertData.snacks_consumed?.length || 0
    })

    // ✅ INSERTAR EN QUICK_CHECKINS
    const { data: quickCheckin, error: quickCheckinError } = await supabase
      .from('quick_checkins')
      .insert(insertData)
      .select(`
        id,
        guest_name,
        guest_document,
        guest_phone,
        check_in_date,
        check_out_date,
        amount,
        snacks_consumed,
        created_at,
        room:room_id(id, room_number, floor),
        payment_method:payment_method_id(name)
      `)
      .single()

    if (quickCheckinError) {
      console.error('❌ Error inserting quick checkin:', quickCheckinError)
      throw new Error(`Error creando quick checkin: ${quickCheckinError.message}`)
    }

    console.log('✅ Quick checkin created in database with snacks:', {
      id: quickCheckin.id,
      snacks_count: quickCheckin.snacks_consumed?.length || 0,
      snacks_data: quickCheckin.snacks_consumed
    })

    // ✅ ACTUALIZAR ESTADO DE LA HABITACIÓN
    const { data: occupiedStatus } = await supabase
      .from('room_status')
      .select('id')
      .eq('status', 'ocupada')
      .single()

    if (occupiedStatus) {
      const { error: roomUpdateError } = await supabase
        .from('rooms')
        .update({ status_id: occupiedStatus.id })
        .eq('id', roomId)

      if (roomUpdateError) {
        console.warn('⚠️ Warning updating room status:', roomUpdateError)
      } else {
        console.log('✅ Room status updated to occupied')
      }
    }

    // ✅ PROCESAR CONSUMO DE SNACKS EN INVENTARIO
    if (snacksForDB.length > 0) {
      console.log('🍿 Processing snack consumption in inventory...', snacksForDB.length, 'items')
      const inventoryResult = await snackService.processSnackConsumption(snacksData)
      console.log('📊 Inventory update result:', inventoryResult.error ? 'Failed' : 'Success')
    }

    // ✅ RETORNAR DATOS ESTRUCTURADOS
    const result = {
      id: quickCheckin.id,
      room: {
        id: roomId,
        number: quickCheckin.room?.room_number || roomNumber,
        floor: quickCheckin.room?.floor || Math.floor(parseInt(roomNumber) / 100)
      },
      roomPrice: roomPrice,
      snacks: quickCheckin.snacks_consumed || [], // 🔥 DESDE LA BD
      total: totalAmount,
      checkInDate: quickCheckin.check_in_date,
      checkOutDate: quickCheckin.check_out_date,
      guestName: quickCheckin.guest_name,
      guestDocument: quickCheckin.guest_document,
      guestPhone: quickCheckin.guest_phone,
      confirmationCode: `QC-${quickCheckin.id}-${Date.now().toString(36).slice(-4).toUpperCase()}`,
      paymentMethod: quickCheckin.payment_method?.name,
      createdAt: quickCheckin.created_at,
      isQuickCheckin: true
    }

    console.log('🎉 Quick checkin created successfully with snacks!', {
      id: result.id,
      snacks_saved: result.snacks.length,
      total_amount: result.total
    })
    
    return { data: result, error: null }

  } catch (error) {
    console.error('❌ Error in createQuickCheckin:', error)
    return { data: null, error: error }
  }
},

  // ✅ FUNCIÓN PARA PROCESAR CHECK-OUT
  async processQuickCheckOut(quickCheckinId, paymentMethod = 'efectivo') {
  try {
    console.log('🚪 Processing quick checkout...', { quickCheckinId, paymentMethod })

    // Obtener el quick checkin
    const { data: quickCheckin, error: fetchError } = await supabase
      .from('quick_checkins')
      .select(`
        id,
        room_id,
        guest_name,
        amount,
        snacks_consumed,
        check_out_date,
        room:room_id(room_number)
      `)
      .eq('id', quickCheckinId)
      .single()

    if (fetchError || !quickCheckin) {
      throw new Error('Quick check-in no encontrado')
    }

    // ✅ MARCAR COMO PROCESADO: Cambiar check_out_date al pasado
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const { error: updateError } = await supabase
      .from('quick_checkins')
      .update({
        check_out_date: yesterdayStr, // Marcarlo como procesado
        updated_at: new Date().toISOString()
      })
      .eq('id', quickCheckinId)

    if (updateError) {
      console.error('❌ Error updating checkout:', updateError)
      throw new Error(`Error marcando checkout: ${updateError.message}`)
    }

    // Actualizar estado de habitación a limpieza
    try {
      const { data: cleaningStatus } = await supabase
        .from('room_status')
        .select('id')
        .eq('status', 'limpieza')
        .single()

      if (cleaningStatus && quickCheckin.room_id) {
        await supabase
          .from('rooms')
          .update({ status_id: cleaningStatus.id })
          .eq('id', quickCheckin.room_id)
      }
    } catch (roomError) {
      console.warn('⚠️ Warning updating room status:', roomError)
    }

    console.log('✅ Quick checkout processed successfully')
    return { 
      data: {
        id: quickCheckinId,
        roomNumber: quickCheckin.room?.room_number,
        guestName: quickCheckin.guest_name,
        amount: quickCheckin.amount,
        snacksConsumed: quickCheckin.snacks_consumed || [],
        paymentMethod
      }, 
      error: null 
    }

  } catch (error) {
    console.error('❌ Error in processQuickCheckOut:', error)
    return { data: null, error }
  }
},

  // ✅ NUEVA FUNCIÓN: Obtener snacks consumidos de un quick checkin específico
  async getQuickCheckinSnacks(quickCheckinId) {
    try {
      const { data, error } = await supabase
        .from('quick_checkins')
        .select('snacks_consumed')
        .eq('id', quickCheckinId)
        .single()

      if (error) throw error

      return { data: data.snacks_consumed || [], error: null }
    } catch (error) {
      console.error('❌ Error fetching quick checkin snacks:', error)
      return { data: [], error }
    }
  },

  // ✅ NUEVA FUNCIÓN: Actualizar snacks consumidos
  async updateQuickCheckinSnacks(quickCheckinId, newSnacks) {
  try {
    console.log('🔄 Updating quick checkin snacks in database:', {
      quickCheckinId,
      newSnacksCount: newSnacks.length,
      newSnacks
    })

    // Preparar snacks para la base de datos
    const snacksForDB = newSnacks.map(snack => ({
      id: snack.id,
      name: snack.name,
      quantity: snack.quantity,
      price: snack.price,
      total: snack.price * snack.quantity
    }))

    // Calcular nuevo monto total
    const newAmount = await this.calculateUpdatedAmount(quickCheckinId, snacksForDB)

    const { data, error } = await supabase
      .from('quick_checkins')
      .update({ 
        snacks_consumed: snacksForDB,
        amount: newAmount, // Actualizar el monto total
        updated_at: new Date().toISOString()
      })
      .eq('id', quickCheckinId)
      .select(`
        id,
        snacks_consumed,
        amount,
        room:room_id(room_number),
        guest_name
      `)
      .single()

    if (error) {
      console.error('❌ Error updating quick checkin snacks:', error)
      throw error
    }

    console.log('✅ Quick checkin snacks updated successfully:', {
      id: data.id,
      roomNumber: data.room?.room_number,
      snacksCount: data.snacks_consumed?.length || 0,
      newAmount: data.amount
    })

    return { data, error: null }
  } catch (error) {
    console.error('❌ Error in updateQuickCheckinSnacks:', error)
    return { data: null, error }
  }
},

// ✅ FUNCIÓN AUXILIAR: Calcular monto total actualizado
async calculateUpdatedAmount(quickCheckinId, snacks) {
  try {
    console.log('💰 Calculating updated amount for quick checkin:', quickCheckinId)
    
    // Obtener precio base de la habitación
    const { data: checkin, error } = await supabase
      .from('quick_checkins')
      .select(`
        room:room_id(base_price)
      `)
      .eq('id', quickCheckinId)
      .single()

    if (error) {
      console.warn('⚠️ Error getting room price, using snacks total only:', error)
      return snacks.reduce((total, snack) => total + (snack.total || 0), 0)
    }

    const roomPrice = checkin?.room?.base_price || 100
    const snacksTotal = snacks.reduce((total, snack) => total + (snack.total || 0), 0)
    const totalAmount = roomPrice + snacksTotal
    
    console.log('💰 Amount calculation:', {
      roomPrice,
      snacksTotal,
      totalAmount,
      snacksCount: snacks.length
    })
    
    return totalAmount
  } catch (error) {
    console.warn('⚠️ Error calculating updated amount:', error)
    // Fallback: solo el total de snacks
    return snacks.reduce((total, snack) => total + (snack.total || 0), 0)
  }
}
}

// =====================================================
// 📊 SERVICIOS DE REPORTES
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

  // ===================================================
  // 🏨 REPORTES DE OCUPACIÓN
  // ===================================================
  async getOccupancyReport(branchId, startDate, endDate) {
    try {
      console.log('📊 Fetching occupancy report:', { branchId, startDate, endDate });

      const { data, error } = await supabase
        .from('occupancy_reports')
        .select('*')
        .eq('branch_id', branchId)
        .gte('report_date', startDate)
        .lte('report_date', endDate)
        .order('report_date', { ascending: true });

      if (error) throw error;

      // Si no hay datos en occupancy_reports, generar desde datos actuales
      if (!data || data.length === 0) {
        console.log('📊 No occupancy reports found, generating from current data...');
        return await this.generateOccupancyFromCurrentData(branchId, startDate, endDate);
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error fetching occupancy report:', error);
      return { data: [], error };
    }
  },

  async generateOccupancyFromCurrentData(branchId, startDate, endDate) {
    try {
      // Obtener estado actual de habitaciones para generar datos
      const { data: currentStats } = await this.getDashboardStats(branchId);
      
      if (!currentStats) {
        return { data: [], error: null };
      }

      // Generar datos simulados para el rango de fechas (solo para demostración)
      const dates = this.generateDateRange(startDate, endDate);
      const occupancyData = dates.map(date => ({
        report_date: date,
        total_rooms: currentStats.total_rooms || 0,
        occupied_rooms: Math.floor(Math.random() * (currentStats.total_rooms || 10)),
        available_rooms: 0, // Se calculará después
        maintenance_rooms: Math.floor(Math.random() * 3),
        out_of_order_rooms: 0,
        occupancy_percentage: 0 // Se calculará después
      }));

      // Calcular campos derivados
      occupancyData.forEach(day => {
        day.available_rooms = day.total_rooms - day.occupied_rooms - day.maintenance_rooms;
        day.occupancy_percentage = day.total_rooms > 0 
          ? ((day.occupied_rooms / day.total_rooms) * 100).toFixed(2)
          : 0;
      });

      return { data: occupancyData, error: null };
    } catch (error) {
      console.error('❌ Error generating occupancy data:', error);
      return { data: [], error };
    }
  },

  // ===================================================
  // 💰 REPORTES DE INGRESOS
  // ===================================================
  async getRevenueReport(branchId, startDate, endDate) {
    try {
      console.log('💰 Calculating revenue report:', { branchId, startDate, endDate });

      const { data, error } = await supabase.rpc('calculate_revenue_by_period', {
        branch_uuid: branchId,
        start_date: startDate,
        end_date: endDate
      });

      if (error) throw error;

      const revenueData = data?.[0] || {
        room_revenue: 0,
        service_revenue: 0,
        total_revenue: 0,
        total_expenses: 0,
        net_profit: 0
      };

      console.log('✅ Revenue calculated:', revenueData);
      return { data: revenueData, error: null };
    } catch (error) {
      console.error('❌ Error calculating revenue:', error);
      return { data: null, error };
    }
  },

  // ===================================================
  // 💸 REPORTES DE GASTOS
  // ===================================================
  async getExpensesReport(branchId, startDate, endDate) {
    try {
      console.log('💸 Fetching expenses report:', { branchId, startDate, endDate });

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

      if (error) throw error;

      console.log('✅ Expenses loaded:', data?.length || 0, 'records');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error fetching expenses:', error);
      return { data: [], error };
    }
  },

  async getExpensesByCategory(branchId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          amount,
          expense_categories(name)
        `)
        .eq('branch_id', branchId)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate);

      if (error) throw error;

      // Agrupar por categoría
      const categoryTotals = {};
      data.forEach(expense => {
        const category = expense.expense_categories?.name || 'Sin categoría';
        categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
      });

      // Convertir a array para gráficos
      const chartData = Object.entries(categoryTotals).map(([name, amount]) => ({
        label: name,
        value: amount
      }));

      return { data: chartData, error: null };
    } catch (error) {
      console.error('❌ Error fetching expenses by category:', error);
      return { data: [], error };
    }
  },

  // ===================================================
  // 📅 REPORTES DIARIOS
  // ===================================================
  async getDailyReports(branchId, startDate, endDate) {
    try {
      console.log('📅 Fetching daily reports:', { branchId, startDate, endDate });

      const { data, error } = await supabase
        .from('daily_reports')
        .select(`
          *,
          branch:branch_id(name),
          generated_by_user:generated_by(first_name, last_name)
        `)
        .eq('branch_id', branchId)
        .gte('report_date', startDate)
        .lte('report_date', endDate)
        .order('report_date', { ascending: false });

      if (error) throw error;

      console.log('✅ Daily reports loaded:', data?.length || 0, 'reports');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error fetching daily reports:', error);
      return { data: [], error };
    }
  },

  async generateDailyReport(branchId, reportDate = null) {
    try {
      const targetDate = reportDate || new Date().toISOString().split('T')[0];
      console.log('🔄 Generating daily report for:', targetDate);

      const { error } = await supabase.rpc('generate_daily_report', {
        branch_uuid: branchId,
        report_date_param: targetDate
      });

      if (error) throw error;

      console.log('✅ Daily report generated successfully');
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ Error generating daily report:', error);
      return { success: false, error };
    }
  },

  // ===================================================
  // 💾 REPORTES GUARDADOS
  // ===================================================
  async getSavedReports(userId = null) {
    try {
      console.log('💾 Fetching saved reports for user:', userId);

      let query = supabase
        .from('saved_reports')
        .select(`
          *,
          created_by_user:created_by(first_name, last_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('created_by', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('✅ Saved reports loaded:', data?.length || 0, 'reports');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error fetching saved reports:', error);
      return { data: [], error };
    }
  },

  async saveReport(reportData, userId) {
    try {
      console.log('💾 Saving report:', reportData.name);

      const { data, error } = await supabase
        .from('saved_reports')
        .insert({
          name: reportData.name,
          description: reportData.description || null,
          report_type: reportData.type,
          parameters: reportData.parameters || {},
          schedule: reportData.schedule || {},
          created_by: userId,
          is_active: true
        })
        .select(`
          *,
          created_by_user:created_by(first_name, last_name)
        `)
        .single();

      if (error) throw error;

      console.log('✅ Report saved successfully:', data.id);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error saving report:', error);
      return { data: null, error };
    }
  },

  async deleteSavedReport(reportId) {
    try {
      console.log('🗑️ Deleting saved report:', reportId);

      const { error } = await supabase
        .from('saved_reports')
        .update({ is_active: false })
        .eq('id', reportId);

      if (error) throw error;

      console.log('✅ Report deleted successfully');
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ Error deleting report:', error);
      return { success: false, error };
    }
  },

  // ===================================================
  // 📈 REPORTES AVANZADOS
  // ===================================================
  async getRevenueByPeriod(branchId, period = 'daily', limit = 30) {
    try {
      console.log('📈 Fetching revenue by period:', { branchId, period, limit });

      // Construir query basado en el período
      let dateFormat, groupBy;
      switch (period) {
        case 'hourly':
          dateFormat = 'YYYY-MM-DD HH24:00:00';
          groupBy = 'DATE_TRUNC(\'hour\', created_at)';
          break;
        case 'weekly':
          dateFormat = 'YYYY-"W"WW';
          groupBy = 'DATE_TRUNC(\'week\', created_at)';
          break;
        case 'monthly':
          dateFormat = 'YYYY-MM';
          groupBy = 'DATE_TRUNC(\'month\', created_at)';
          break;
        default: // daily
          dateFormat = 'YYYY-MM-DD';
          groupBy = 'DATE_TRUNC(\'day\', created_at)';
      }

      // Query para pagos de reservaciones
      const reservationPaymentsQuery = supabase
        .from('reservation_payments')
        .select(`
          amount,
          payment_date,
          reservations!inner(branch_id)
        `)
        .eq('reservations.branch_id', branchId)
        .gte('payment_date', new Date(Date.now() - limit * 24 * 60 * 60 * 1000).toISOString())
        .order('payment_date', { ascending: true });

      // Query para quick checkins
      const quickCheckinsQuery = supabase
        .from('quick_checkins')
        .select('amount, created_at')
        .eq('branch_id', branchId)
        .gte('created_at', new Date(Date.now() - limit * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      const [reservationPayments, quickCheckins] = await Promise.all([
        reservationPaymentsQuery,
        quickCheckinsQuery
      ]);

      if (reservationPayments.error) throw reservationPayments.error;
      if (quickCheckins.error) throw quickCheckins.error;

      // Procesar y agrupar datos
      const revenueData = this.groupRevenueByPeriod(
        reservationPayments.data || [],
        quickCheckins.data || [],
        period
      );

      console.log('✅ Revenue by period loaded:', revenueData.length, 'periods');
      return { data: revenueData, error: null };
    } catch (error) {
      console.error('❌ Error fetching revenue by period:', error);
      return { data: [], error };
    }
  },

  async getTopPerformingRooms(branchId, startDate, endDate, limit = 10) {
    try {
      console.log('🏆 Fetching top performing rooms:', { branchId, startDate, endDate });

      const { data, error } = await supabase
        .from('reservation_payments')
        .select(`
          amount,
          reservations!inner(
            room_id,
            rooms!inner(room_number, floor)
          )
        `)
        .eq('reservations.branch_id', branchId)
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);

      if (error) throw error;

      // Agrupar por habitación
      const roomRevenue = {};
      data.forEach(payment => {
        const room = payment.reservations.rooms;
        const roomKey = `${room.room_number} (Piso ${room.floor})`;
        roomRevenue[roomKey] = (roomRevenue[roomKey] || 0) + payment.amount;
      });

      // Convertir a array y ordenar
      const sortedRooms = Object.entries(roomRevenue)
        .map(([room, revenue]) => ({ room, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);

      console.log('✅ Top rooms loaded:', sortedRooms.length, 'rooms');
      return { data: sortedRooms, error: null };
    } catch (error) {
      console.error('❌ Error fetching top rooms:', error);
      return { data: [], error };
    }
  },

  // ===================================================
  // 🛠️ UTILIDADES
  // ===================================================
  generateDateRange(startDate, endDate) {
    const dates = [];
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  },

  groupRevenueByPeriod(reservationPayments, quickCheckins, period) {
    const groupedData = {};

    // Procesar pagos de reservaciones
    reservationPayments.forEach(payment => {
      const date = new Date(payment.payment_date);
      const key = this.formatDateByPeriod(date, period);
      groupedData[key] = (groupedData[key] || 0) + payment.amount;
    });

    // Procesar quick checkins
    quickCheckins.forEach(checkin => {
      const date = new Date(checkin.created_at);
      const key = this.formatDateByPeriod(date, period);
      groupedData[key] = (groupedData[key] || 0) + checkin.amount;
    });

    // Convertir a array y ordenar
    return Object.entries(groupedData)
      .map(([period, revenue]) => ({ period, revenue }))
      .sort((a, b) => a.period.localeCompare(b.period));
  },

  formatDateByPeriod(date, period) {
    switch (period) {
      case 'hourly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
      case 'weekly':
        const weekNumber = this.getWeekNumber(date);
        return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
      case 'monthly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default: // daily
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
  },

  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  },

  formatCurrency(amount, currency = 'PEN') {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  },

  formatDate(date, format = 'short') {
    const options = {
      short: { year: 'numeric', month: '2-digit', day: '2-digit' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      time: { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit' 
      }
    };

    return new Date(date).toLocaleDateString('es-PE', options[format] || options.short);
  },

  formatPercentage(value, decimals = 1) {
    return `${(value || 0).toFixed(decimals)}%`;
  },

  // ===================================================
  // 📤 EXPORTACIÓN DE DATOS
  // ===================================================
  async exportToCSV(reportType, data, options = {}) {
    try {
      console.log('📤 Exporting to CSV:', reportType);

      let csvContent = '';
      const { filename = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}` } = options;

      switch (reportType) {
        case 'occupancy':
          csvContent = this.generateOccupancyCSV(data);
          break;
        case 'revenue':
          csvContent = this.generateRevenueCSV(data);
          break;
        case 'expenses':
          csvContent = this.generateExpensesCSV(data);
          break;
        case 'daily':
          csvContent = this.generateDailyReportsCSV(data);
          break;
        default:
          throw new Error('Tipo de reporte no soportado para exportación');
      }

      // Descargar archivo
      this.downloadCSV(csvContent, `${filename}.csv`);
      
      console.log('✅ CSV exported successfully:', filename);
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ Error exporting CSV:', error);
      return { success: false, error };
    }
  },

  generateOccupancyCSV(data) {
    const headers = ['Fecha', 'Total Habitaciones', 'Ocupadas', 'Disponibles', 'Mantenimiento', 'Tasa Ocupación (%)'];
    const rows = data.map(row => [
      this.formatDate(row.report_date),
      row.total_rooms,
      row.occupied_rooms,
      row.available_rooms,
      row.maintenance_rooms,
      row.occupancy_percentage
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  },

  generateRevenueCSV(data) {
    const headers = ['Concepto', 'Monto'];
    const rows = [
      ['Ingresos por Habitaciones', data.room_revenue || 0],
      ['Ingresos por Servicios', data.service_revenue || 0],
      ['Total Ingresos', data.total_revenue || 0],
      ['Total Gastos', data.total_expenses || 0],
      ['Ganancia Neta', data.net_profit || 0]
    ];
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  },

  generateExpensesCSV(data) {
    const headers = ['Fecha', 'Descripción', 'Monto', 'Categoría', 'Método de Pago', 'Creado Por'];
    const rows = data.map(row => [
      this.formatDate(row.expense_date),
      `"${row.description}"`,
      row.amount,
      row.expense_categories?.name || '',
      row.payment_methods?.name || '',
      row.created_by_user ? `${row.created_by_user.first_name} ${row.created_by_user.last_name}` : ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  },

  generateDailyReportsCSV(data) {
    const headers = ['Fecha', 'Check-ins', 'Check-outs', 'Ingresos', 'Gastos', 'Tasa Ocupación (%)', 'Hab. Disponibles', 'Ocupadas', 'Mantenimiento'];
    const rows = data.map(row => [
      this.formatDate(row.report_date),
      row.total_checkins,
      row.total_checkouts,
      row.total_revenue,
      row.total_expenses,
      row.occupancy_rate,
      row.available_rooms,
      row.occupied_rooms,
      row.maintenance_rooms
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  },

  downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
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
// 🏢 SERVICIOS DE SUCURSALES
// =====================================================
export const branchService = {
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

  async getBranchStats(branchId) {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        branch_uuid: branchId
      })

      if (error) throw error

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
  }
}

// =====================================================
// 📦 SERVICIOS DE SUMINISTROS (COMPLETO)
// =====================================================
export const suppliesService = {
  // ✅ Obtener todos los suministros con filtros
  async getSupplies(filters = {}) {
    try {
      console.log('📦 Fetching supplies with filters:', filters)
      
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
          supply_categories!inner(
            id,
            name
          ),
          suppliers(
            id,
            name,
            contact_person,
            phone
          )
        `)
        .eq('is_active', true)

      // ✅ FILTROS CORREGIDOS
      if (filters.category) {
        query = query.eq('category_id', filters.category)
      }

      if (filters.supplier) {
        query = query.eq('supplier_id', filters.supplier)
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
      }

      // ✅ CORRECCIÓN PRINCIPAL: Filtro de stock bajo
      // Primero obtenemos todos los datos, luego filtramos en JavaScript
      const { data: rawData, error } = await query.order('name')

      if (error) {
        console.error('❌ Error fetching supplies:', error)
        throw error
      }

      console.log('✅ Supplies fetched successfully:', rawData?.length || 0)

      // ✅ Aplicar filtro de stock bajo en JavaScript (más confiable)
      let filteredData = rawData || []
      
      if (filters.lowStock) {
        filteredData = filteredData.filter(supply => 
          supply.current_stock <= supply.minimum_stock
        )
        console.log('🔍 Low stock filter applied:', filteredData.length, 'items')
      }

      // Enriquecer datos con campos calculados
      const enrichedData = filteredData.map(supply => ({
        ...supply,
        category: supply.supply_categories,
        supplier: supply.suppliers,
        stockStatus: this.getStockStatus(supply.current_stock, supply.minimum_stock),
        totalValue: supply.current_stock * supply.unit_cost,
        needsRestock: supply.current_stock <= supply.minimum_stock,
        isOutOfStock: supply.current_stock === 0,
        stockPercentage: supply.minimum_stock > 0 
          ? Math.round((supply.current_stock / supply.minimum_stock) * 100)
          : 100
      }))

      return { data: enrichedData, error: null }
    } catch (error) {
      console.error('❌ Error in getSupplies:', error)
      return { data: [], error }
    }
  },

  // ✅ Obtener categorías de suministros
  async getCategories() {
    try {
      console.log('🏷️ Fetching supply categories...')
      
      const { data, error } = await supabase
        .from('supply_categories')
        .select(`
          id,
          name,
          parent_category_id,
          is_active,
          created_at
        `)
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('❌ Error fetching categories:', error)
        throw error
      }

      console.log('✅ Categories fetched successfully:', data?.length || 0)
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Error in getCategories:', error)
      return { data: [], error }
    }
  },

  // ✅ Obtener proveedores
  async getSuppliers() {
    try {
      console.log('🏢 Fetching suppliers...')
      
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

      if (error) {
        console.error('❌ Error fetching suppliers:', error)
        throw error
      }

      console.log('✅ Suppliers fetched successfully:', data?.length || 0)
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Error in getSuppliers:', error)
      return { data: [], error }
    }
  },

  // ✅ Obtener alertas de inventario - FUNCIÓN FALTANTE AGREGADA
  async getAlerts() {
    try {
      console.log('🚨 Fetching inventory alerts...')
      
      const { data, error } = await supabase
        .from('inventory_alerts')
        .select(`
          id,
          alert_type,
          message,
          is_resolved,
          resolved_by,
          resolved_at,
          created_at,
          supply_id,
          supplies!inner(
            id,
            name,
            current_stock,
            minimum_stock,
            supply_categories(name)
          )
        `)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('❌ Error fetching alerts:', error)
        throw error
      }

      console.log('✅ Alerts fetched successfully:', data?.length || 0)
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Error in getAlerts:', error)
      return { data: [], error }
    }
  },

  // ✅ Obtener movimientos de stock
  async getMovements(supplyId = null, limit = 20) {
    try {
      console.log('📈 Fetching supply movements...', { supplyId, limit })
      
      let query = supabase
        .from('supply_movements')
        .select(`
          id,
          movement_type,
          quantity,
          unit_cost,
          total_cost,
          reference_document,
          created_at,
          supplies!inner(
            id,
            name,
            supply_categories(name)
          ),
          users(
            first_name,
            last_name
          )
        `)

      if (supplyId) {
        query = query.eq('supply_id', supplyId)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Error fetching movements:', error)
        throw error
      }

      console.log('✅ Movements fetched successfully:', data?.length || 0)
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Error in getMovements:', error)
      return { data: [], error }
    }
  },

  // ✅ Crear nuevo suministro
  async createSupply(supplyData) {
    try {
      console.log('➕ Creating new supply:', supplyData)
      
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
          supply_categories!inner(name),
          suppliers(name)
        `)
        .single()

      if (error) {
        console.error('❌ Error creating supply:', error)
        throw error
      }

      console.log('✅ Supply created successfully:', data.name)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error in createSupply:', error)
      return { data: null, error }
    }
  },

  // ✅ Actualizar suministro
  async updateSupply(supplyId, updateData) {
    try {
      console.log('🔄 Updating supply:', { supplyId, updateData })
      
      const { data, error } = await supabase
        .from('supplies')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', supplyId)
        .select(`
          *,
          supply_categories!inner(name),
          suppliers(name)
        `)
        .single()

      if (error) {
        console.error('❌ Error updating supply:', error)
        throw error
      }

      console.log('✅ Supply updated successfully:', data.name)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error in updateSupply:', error)
      return { data: null, error }
    }
  },

  // ✅ Eliminar suministro
  async deleteSupply(supplyId) {
    try {
      console.log('🗑️ Deleting supply:', supplyId)
      
      const { error } = await supabase
        .from('supplies')
        .update({ is_active: false })
        .eq('id', supplyId)

      if (error) {
        console.error('❌ Error deleting supply:', error)
        throw error
      }

      console.log('✅ Supply deleted successfully')
      return { error: null }
    } catch (error) {
      console.error('❌ Error in deleteSupply:', error)
      return { error }
    }
  },

  // ✅ Agregar movimiento de stock
  async addMovement(movementData) {
    try {
      console.log('📊 Adding stock movement:', movementData)
      
      const { data, error } = await supabase
        .from('supply_movements')
        .insert({
          supply_id: movementData.supplyId,
          branch_id: movementData.branchId,
          movement_type: movementData.movementType, // 'in', 'out', 'adjustment'
          quantity: movementData.quantity,
          unit_cost: movementData.unitCost || 0,
          total_cost: movementData.totalCost || (movementData.quantity * (movementData.unitCost || 0)),
          reference_document: movementData.referenceDocument || null,
          processed_by: movementData.processedBy
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error adding movement:', error)
        throw error
      }

      console.log('✅ Movement added successfully:', data.id)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error in addMovement:', error)
      return { data: null, error }
    }
  },

  // ✅ Resolver alerta
  async resolveAlert(alertId, userId) {
    try {
      console.log('✅ Resolving alert:', { alertId, userId })
      
      const { data, error } = await supabase
        .from('inventory_alerts')
        .update({
          is_resolved: true,
          resolved_by: userId,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error resolving alert:', error)
        throw error
      }

      console.log('✅ Alert resolved successfully')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error in resolveAlert:', error)
      return { data: null, error }
    }
  },

  // ✅ Crear categoría
  async createCategory(categoryData) {
    try {
      console.log('➕ Creating category:', categoryData)
      
      const { data, error } = await supabase
        .from('supply_categories')
        .insert({
          name: categoryData.name,
          parent_category_id: categoryData.parentCategoryId || null,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating category:', error)
        throw error
      }

      console.log('✅ Category created successfully:', data.name)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error in createCategory:', error)
      return { data: null, error }
    }
  },

  // ✅ Crear proveedor
  async createSupplier(supplierData) {
    try {
      console.log('➕ Creating supplier:', supplierData)
      
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

      if (error) {
        console.error('❌ Error creating supplier:', error)
        throw error
      }

      console.log('✅ Supplier created successfully:', data.name)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error in createSupplier:', error)
      return { data: null, error }
    }
  },

  // ✅ Buscar suministros
  async searchSupplies(searchTerm) {
    try {
      console.log('🔍 Searching supplies:', searchTerm)
      
      const { data, error } = await supabase
        .from('supplies')
        .select(`
          id,
          name,
          sku,
          current_stock,
          minimum_stock,
          unit_cost,
          supply_categories!inner(name)
        `)
        .eq('is_active', true)
        .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
        .order('name')
        .limit(20)

      if (error) {
        console.error('❌ Error searching supplies:', error)
        throw error
      }

      console.log('✅ Search completed:', data?.length || 0, 'results')
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Error in searchSupplies:', error)
      return { data: [], error }
    }
  },

  // ✅ Utilidades
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
  },

  formatPrice(amount) {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }
}

// =====================================================
// 🔧 UTILIDADES DE VALIDACIÓN
// =====================================================
export const validationService = {
  validateReservationStatus(currentStatus, targetStatus) {
    const validTransitions = {
      'pendiente': ['confirmada', 'cancelada'],
      'confirmada': ['en_uso', 'cancelada', 'no_show'],
      'en_uso': ['completada'],
      'completada': [], // Estado final
      'cancelada': [], // Estado final
      'no_show': []    // Estado final
    }

    const allowed = validTransitions[currentStatus] || []
    return {
      isValid: allowed.includes(targetStatus),
      allowedTransitions: allowed
    }
  },

  validateCheckInData(reservation) {
    const errors = []
    
    if (!reservation) {
      errors.push('Reservación no encontrada')
      return { isValid: false, errors }
    }

    const status = reservation.status?.status
    if (status !== 'confirmada') {
      errors.push('La reservación debe estar confirmada para hacer check-in')
    }

    const checkInDate = new Date(reservation.check_in_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (checkInDate > today) {
      errors.push('No se puede hacer check-in antes de la fecha programada')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  validateCheckOutData(reservation) {
    const errors = []
    
    if (!reservation) {
      errors.push('Reservación no encontrada')
      return { isValid: false, errors }
    }

    const status = reservation.status?.status
    if (status !== 'en_uso') {
      errors.push('La reservación debe estar en uso para hacer check-out')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: (reservation.balance || 0) > 0 ? ['Hay saldo pendiente'] : []
    }
  },

  validatePaymentData(paymentData, reservation) {
    const errors = []
    
    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.push('El monto debe ser mayor a 0')
    }

    if (!paymentData.paymentMethodId) {
      errors.push('Debe seleccionar un método de pago')
    }

    if (paymentData.amount > (reservation?.balance || 0)) {
      errors.push('El monto no puede ser mayor al saldo pendiente')
    }

    // Validar referencia para métodos que la requieren
    if (paymentData.paymentMethodId !== 'efectivo' && !paymentData.reference?.trim()) {
      errors.push('La referencia es obligatoria para este método de pago')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// =====================================================
// 📊 SERVICIOS DE ESTADÍSTICAS BÁSICAS
// =====================================================
export const statsService = {
  calculateReservationStats(reservations) {
    return {
      total: reservations.length,
      byStatus: {
        pendiente: reservations.filter(r => r.status?.status === 'pendiente').length,
        confirmada: reservations.filter(r => r.status?.status === 'confirmada').length,
        en_uso: reservations.filter(r => r.status?.status === 'en_uso').length,
        completada: reservations.filter(r => r.status?.status === 'completada').length,
        cancelada: reservations.filter(r => r.status?.status === 'cancelada').length
      },
      financial: {
        totalRevenue: reservations.reduce((sum, r) => sum + (r.total_amount || 0), 0),
        totalPaid: reservations.reduce((sum, r) => sum + (r.paid_amount || 0), 0),
        pendingBalance: reservations.reduce((sum, r) => sum + (r.balance || 0), 0)
      },
      today: {
        checkIns: reservations.filter(r => {
          const checkIn = new Date(r.check_in_date).toDateString()
          return checkIn === new Date().toDateString()
        }).length,
        checkOuts: reservations.filter(r => {
          const checkOut = new Date(r.check_out_date).toDateString()
          return checkOut === new Date().toDateString()
        }).length
      }
    }
  }
}

// =====================================================
// 📦 OBJETO DB PRINCIPAL PARA COMPATIBILIDAD
// =====================================================

// ✅ Objeto db mejorado con todas las funciones necesarias
export const db = {
  // Importar todas las funciones existentes
  ...roomService,
  ...reservationService,
  ...guestService,
  ...paymentService,
  ...reportService,
  ...quickCheckinService,
  ...snackService,
  ...suppliesService, // ✅ AGREGADO
  ...utilityService,
  ...realtimeService,
  ...branchService,
  
  // ✅ Funciones específicas para el hook useCheckInData/useQuickCheckins
  async getRooms() {
    return await quickCheckinService.getRoomsWithStatus()
  },

  async getReservations(filters = {}) {
    return await reservationService.getReservationsByBranch('default-branch', filters)
  },

  async getSnackItems() {
    const result = await snackService.getSnackItems()
    return { data: result.data, error: result.error }
  },

  async getSnackCategories() {
    return await snackService.getSnackCategories()
  },

  async createGuest(guestData) {
    return await guestService.createGuest(guestData)
  },

  async createReservation(reservationData) {
    return await quickCheckinService.createQuickCheckin(reservationData, reservationData.guest, reservationData.snacks)
  },

  async updateReservation(reservationId, updateData) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', reservationId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },


  // ✅ Nueva función para limpiar habitación específicamente
  async cleanRoom(roomId) {
    try {
      console.log('🧹 Cleaning room:', roomId)
      
      const result = await this.updateRoomStatus(roomId, 'disponible')
      
      if (result.error) {
        throw result.error
      }

      console.log('✅ Room cleaned successfully:', result.data.room_number)
      return result
    } catch (error) {
      console.error('❌ Error cleaning room:', error)
      return { data: null, error }
    }
  },

  // ✅ Nueva función para limpiar por número de habitación
  async cleanRoomByNumber(roomNumber, branchId) {
    try {
      console.log('🧹 Cleaning room by number:', { roomNumber, branchId })

      // Buscar la habitación por número
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('id, room_number, branch_id')
        .eq('room_number', roomNumber)
        .eq('branch_id', branchId)
        .single()

      if (roomError || !room) {
        throw new Error(`Habitación ${roomNumber} no encontrada en la sucursal`)
      }

      // Limpiar usando el ID
      return await this.cleanRoom(room.id)
    } catch (error) {
      console.error('❌ Error cleaning room by number:', error)
      return { data: null, error }
    }
  },

  async cleanRoomWithClick(roomId) {
    return await this.updateRoomStatus(roomId, 'disponible')
  },

  async deleteGuest(guestId) {
    try {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', guestId)

      return { error }
    } catch (error) {
      return { error }
    }
  }
}

// =====================================================
// 🏢 IMPORTAR Y EXPORTAR BRANCH SERVICE
// =====================================================
import { branchService as externalBranchService } from './branchService'


// =====================================================
// 🔄 EXPORT PRINCIPAL ACTUALIZADO
// =====================================================
export default {
  supabase,
  authService,
  roomService,
  reservationService,
  guestService,
  paymentService,
  validationService,
  statsService,
  reportService,
  quickCheckinService,
  snackService, 
  suppliesService, 
  utilityService,
  realtimeService,
  branchService,
  branchService: externalBranchService, 
  db
}

