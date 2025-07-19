// src/lib/supabase.js - VERSIÓN CORREGIDA CON MANEJO DE RESERVAS
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// Database helpers - CORREGIDO CON RESERVAS
export const db = {
  // =============================================
  // ROOMS MANAGEMENT - CON INFORMACIÓN DE RESERVAS
  // =============================================

  // Get rooms WITH reservation information - CORREGIDO
  async getRooms(filters = {}) {
    try {
      console.log('Loading rooms with reservation data...')
      
      // Primero obtener todas las habitaciones
      let roomQuery = supabase
        .from('rooms')
        .select('*')
        .order('floor')
        .order('number')

      // Aplicar filtros a habitaciones
      if (filters.status && filters.status !== 'all') {
        roomQuery = roomQuery.eq('status', filters.status)
      }
      if (filters.floor && filters.floor !== 'all') {
        roomQuery = roomQuery.eq('floor', filters.floor)
      }
      if (filters.type && filters.type !== 'all') {
        roomQuery = roomQuery.eq('room_type', filters.type)
      }
      if (filters.cleaningStatus && filters.cleaningStatus !== 'all') {
        roomQuery = roomQuery.eq('cleaning_status', filters.cleaningStatus)
      }
      if (filters.search) {
        roomQuery = roomQuery.or(`number.ilike.%${filters.search}%,description.ilike.%${filters.search}%,room_type.ilike.%${filters.search}%`)
      }

      const { data: rooms, error: roomsError } = await roomQuery

      if (roomsError) {
        console.error('Error loading rooms:', roomsError)
        throw roomsError
      }

      // Obtener reservas activas y próximas
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select(`
          *,
          guest:guests(
            id,
            first_name,
            last_name,
            full_name,
            email,
            phone,
            document_number,
            vip_level
          )
        `)
        .in('status', ['checked_in', 'confirmed'])
        .order('check_in')

      if (reservationsError) {
        console.warn('Error loading reservations:', reservationsError)
        // Continuar sin reservas en lugar de fallar
        return { data: rooms, error: null }
      }

      // Enriquecer habitaciones con información de reservas
      const enrichedRooms = rooms.map(room => {
        // Buscar reserva activa (checked_in)
        const activeReservation = reservations.find(
          res => res.room_id === room.id && res.status === 'checked_in'
        )
        
        // Buscar próxima reserva confirmada
        const nextReservation = reservations
          .filter(res => res.room_id === room.id && res.status === 'confirmed')
          .sort((a, b) => new Date(a.check_in) - new Date(b.check_in))[0]

        return {
          ...room,
          // Información del huésped actual
          currentGuest: activeReservation ? {
            id: activeReservation.guest?.id,
            name: activeReservation.guest?.full_name || 
                  `${activeReservation.guest?.first_name || ''} ${activeReservation.guest?.last_name || ''}`.trim(),
            email: activeReservation.guest?.email,
            phone: activeReservation.guest?.phone,
            checkIn: activeReservation.check_in,
            checkOut: activeReservation.check_out,
            confirmationCode: activeReservation.confirmation_code,
            reservationId: activeReservation.id
          } : null,

          // Información de la próxima reserva
          nextReservation: nextReservation ? {
            id: nextReservation.id,
            guest: nextReservation.guest?.full_name || 
                  `${nextReservation.guest?.first_name || ''} ${nextReservation.guest?.last_name || ''}`.trim(),
            checkIn: nextReservation.check_in,
            checkOut: nextReservation.check_out,
            confirmationCode: nextReservation.confirmation_code
          } : null,

          // Reserva activa completa
          activeReservation: activeReservation || null
        }
      })

      console.log(`Loaded ${enrichedRooms.length} rooms with reservation data`)
      return { data: enrichedRooms, error: null }

    } catch (error) {
      console.error('Error in getRooms:', error)
      return { data: null, error }
    }
  },

  // Create room function - MEJORADA
  async createRoom(roomData) {
    try {
      console.log('Creating room:', roomData)

      // Validar datos requeridos
      if (!roomData.number || !roomData.floor) {
        return { 
          data: null, 
          error: { message: 'Número de habitación y piso son obligatorios' }
        }
      }

      // Preparar datos para inserción
      const insertData = {
        number: roomData.number.toString(),
        floor: parseInt(roomData.floor),
        room_type: roomData.room_type || roomData.type || 'Habitación Estándar',
        base_rate: parseFloat(roomData.base_rate || roomData.rate || 100),
        capacity: parseInt(roomData.capacity || 2),
        branch_id: roomData.branch_id || 1,
        status: 'available',
        cleaning_status: 'clean',
        beds: roomData.beds || [{ type: 'Doble', count: 1 }],
        size: parseInt(roomData.size || 25),
        features: roomData.features || ['WiFi Gratis'],
        description: roomData.description || `${roomData.room_type || 'Habitación Estándar'} ${roomData.number}`,
        bed_options: roomData.bed_options || ['Doble']
      }

      // Verificar que el número no esté duplicado
      const { data: existingRoom } = await supabase
        .from('rooms')
        .select('id')
        .eq('number', insertData.number)
        .eq('branch_id', insertData.branch_id)
        .single()

      if (existingRoom) {
        return { 
          data: null, 
          error: { message: `Ya existe una habitación con el número ${roomData.number}` }
        }
      }

      // Insertar la habitación
      const { data, error } = await supabase
        .from('rooms')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('Error creating room:', error)
        throw error
      }

      console.log('Room created successfully:', data)
      return { data, error: null }

    } catch (error) {
      console.error('Error in createRoom:', error)
      return { 
        data: null, 
        error: { message: 'Error al crear la habitación: ' + error.message }
      }
    }
  },

  // Update room function
  async updateRoom(roomId, updates) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Delete room function
  async deleteRoom(roomId) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Update room status - MEJORADO
  async updateRoomStatus(roomId, newStatus, cleaningStatus = null) {
    try {
      const updateData = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      }
      
      if (cleaningStatus) {
        updateData.cleaning_status = cleaningStatus
      }

      // Si se marca como limpia, actualizar fecha de limpieza
      if (cleaningStatus === 'clean') {
        updateData.last_cleaned = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('rooms')
        .update(updateData)
        .eq('id', roomId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error updating room status:', error)
      return { data: null, error }
    }
  },

  // Get room types - GENERADOS DINÁMICAMENTE
  async getRoomTypes() {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('room_type, base_rate, capacity')
        .not('room_type', 'is', null)

      if (error) throw error

      // Crear lista única de tipos
      const uniqueTypes = {}
      data.forEach((room, index) => {
        if (!uniqueTypes[room.room_type]) {
          uniqueTypes[room.room_type] = {
            id: index + 1,
            name: room.room_type,
            base_rate: room.base_rate || 100,
            capacity: room.capacity || 2,
            active: true
          }
        }
      })

      // Si no hay tipos, crear uno por defecto
      if (Object.keys(uniqueTypes).length === 0) {
        uniqueTypes['Habitación Estándar'] = {
          id: 1,
          name: 'Habitación Estándar',
          base_rate: 100,
          capacity: 2,
          active: true
        }
      }

      return { data: Object.values(uniqueTypes), error: null }
    } catch (error) {
      return { data: [], error }
    }
  },

  // =============================================
  // RESERVATION MANAGEMENT - MEJORADO
  // =============================================

  // Get reservations with complete information
  async getReservations(options = {}) {
    try {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          guest:guests(
            id,
            first_name,
            last_name,
            full_name,
            email,
            phone,
            document_number,
            document_type,
            vip_level
          ),
          room:rooms(
            id,
            number,
            floor,
            room_type,
            capacity,
            base_rate
          )
        `)

      // Aplicar filtros
      if (options.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status', options.status)
        } else {
          query = query.eq('status', options.status)
        }
      }

      if (options.roomId) {
        query = query.eq('room_id', options.roomId)
      }

      if (options.guestId) {
        query = query.eq('guest_id', options.guestId)
      }

      if (options.dateFrom) {
        query = query.gte('check_in', options.dateFrom)
      }

      if (options.dateTo) {
        query = query.lte('check_out', options.dateTo)
      }

      // Paginación
      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error in getReservations:', error)
      return { data: null, error }
    }
  },

  // Create reservation
  async createReservation(reservationData) {
    try {
      // Generar código de confirmación si no se proporciona
      const confirmationCode = reservationData.confirmation_code || 
        `HTP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

      // Validar campos requeridos
      if (!reservationData.guest_id || !reservationData.room_id) {
        return { 
          data: null, 
          error: { message: 'guest_id y room_id son obligatorios' }
        }
      }

      // Verificar disponibilidad de la habitación
      const { data: conflicts } = await supabase
        .from('reservations')
        .select('id')
        .eq('room_id', reservationData.room_id)
        .lt('check_in', reservationData.check_out)
        .gt('check_out', reservationData.check_in)
        .not('status', 'in', '(cancelled,no_show)')

      if (conflicts && conflicts.length > 0) {
        return {
          data: null,
          error: { message: 'La habitación no está disponible para las fechas seleccionadas' }
        }
      }

      const { data, error } = await supabase
        .from('reservations')
        .insert({
          confirmation_code: confirmationCode,
          ...reservationData
        })
        .select(`
          *,
          guest:guests(*),
          room:rooms(*)
        `)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error in createReservation:', error)
      return { data: null, error }
    }
  },

  // Update reservation
  async updateReservation(reservationId, updates) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select(`
          *,
          guest:guests(*),
          room:rooms(*)
        `)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error in updateReservation:', error)
      return { data: null, error }
    }
  },

  // Process check-in - CORREGIDO
  async processCheckIn(reservationId, userId = null) {
    try {
      console.log(`Processing check-in for reservation ${reservationId}`)
      
      // Obtener información de la reserva
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .select(`
          *,
          room:rooms(*),
          guest:guests(*)
        `)
        .eq('id', reservationId)
        .single()

      if (reservationError) {
        throw new Error('Reserva no encontrada: ' + reservationError.message)
      }

      if (!['confirmed', 'pending'].includes(reservation.status)) {
        throw new Error('La reserva no está en estado válido para check-in')
      }

      // Actualizar reserva a checked_in
      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString(),
          ...(userId && { checked_in_by: userId })
        })
        .eq('id', reservationId)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // Actualizar estado de la habitación
      const { error: roomError } = await supabase
        .from('rooms')
        .update({
          status: 'occupied',
          cleaning_status: 'dirty',
          current_guest: reservation.guest?.full_name || 
                        `${reservation.guest?.first_name || ''} ${reservation.guest?.last_name || ''}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservation.room_id)

      if (roomError) {
        console.error('Error updating room status:', roomError)
        // No fallar completamente, solo advertir
      }

      console.log('Check-in processed successfully')
      return { data: updatedReservation, error: null }
    } catch (error) {
      console.error('Error in processCheckIn:', error)
      return { data: null, error }
    }
  },

  // Process check-out - CORREGIDO
  async processCheckOut(reservationId, paymentMethod = 'cash', userId = null) {
    try {
      console.log(`Processing check-out for reservation ${reservationId}`)
      
      // Obtener información de la reserva
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .select(`
          *,
          room:rooms(*),
          guest:guests(*)
        `)
        .eq('id', reservationId)
        .single()

      if (reservationError) {
        throw new Error('Reserva no encontrada: ' + reservationError.message)
      }

      if (reservation.status !== 'checked_in') {
        throw new Error('La reserva no está en estado de check-in')
      }

      // Calcular monto pendiente
      const pendingAmount = (reservation.total_amount || 0) - (reservation.paid_amount || 0)

      // Si hay monto pendiente, registrar pago
      if (pendingAmount > 0) {
        const { error: paymentError } = await supabase
          .from('reservation_payments')
          .insert([{
            reservation_id: reservationId,
            amount: pendingAmount,
            payment_method: paymentMethod,
            payment_date: new Date().toISOString(),
            notes: 'Pago al check-out',
            created_by: userId
          }])

        if (paymentError) {
          console.error('Error recording payment:', paymentError)
          // Continuar con check-out aunque falle el pago
        }

        // Actualizar estado de pago en la reserva
        await supabase
          .from('reservations')
          .update({
            paid_amount: reservation.total_amount,
            payment_status: 'paid'
          })
          .eq('id', reservationId)
      }

      // Actualizar reserva a checked_out
      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update({
          status: 'checked_out',
          checked_out_at: new Date().toISOString(),
          ...(userId && { checked_out_by: userId })
        })
        .eq('id', reservationId)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // Actualizar estado de la habitación
      const { error: roomError } = await supabase
        .from('rooms')
        .update({
          status: 'cleaning',
          cleaning_status: 'dirty',
          current_guest: null,
          last_guest: reservation.guest?.full_name || 
                     `${reservation.guest?.first_name || ''} ${reservation.guest?.last_name || ''}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservation.room_id)

      if (roomError) {
        console.error('Error updating room status:', roomError)
        // No fallar completamente, solo advertir
      }

      console.log('Check-out processed successfully')
      return { 
        data: {
          ...updatedReservation,
          amount_paid: pendingAmount,
          payment_method: paymentMethod
        }, 
        error: null 
      }
    } catch (error) {
      console.error('Error in processCheckOut:', error)
      return { data: null, error }
    }
  },

  // Get available rooms for dates
  async getAvailableRooms(checkIn, checkOut) {
    try {
      // Obtener todas las habitaciones disponibles
      const { data: allRooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('status', 'available')
        .order('number')

      if (roomsError) {
        throw roomsError
      }

      // Obtener reservas que conflicten con las fechas
      const { data: conflictingReservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('room_id')
        .not('status', 'in', '(cancelled,no_show)')
        .lt('check_in', checkOut)
        .gt('check_out', checkIn)

      if (reservationsError) {
        console.warn('Error checking conflicting reservations:', reservationsError)
        // Continuar con todas las habitaciones
        return { data: allRooms, error: null }
      }

      // Filtrar habitaciones que no tienen conflictos
      const conflictingRoomIds = new Set(conflictingReservations.map(res => res.room_id))
      const availableRooms = allRooms.filter(room => !conflictingRoomIds.has(room.id))

      return { data: availableRooms, error: null }
    } catch (error) {
      console.error('Error getting available rooms:', error)
      return { data: null, error }
    }
  },

  // =============================================
  // GUEST MANAGEMENT
  // =============================================

  // Search guests
  async searchGuests(searchTerm, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,document_number.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(limit)
        .order('full_name')

      return { data, error }
    } catch (error) {
      console.error('Error searching guests:', error)
      return { data: null, error }
    }
  },

  // Create guest
  async createGuest(guestData) {
    try {
      const { data, error } = await supabase
        .from('guests')
        .insert([guestData])
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error creating guest:', error)
      return { data: null, error }
    }
  },

  // =============================================
  // CLEANING MANAGEMENT
  // =============================================

  async getCleaningStaff() {
    // Devolver datos mock ya que la tabla puede no existir
    const mockStaff = [
      { id: 1, name: 'María García', is_active: true, shift: 'morning' },
      { id: 2, name: 'Ana López', is_active: true, shift: 'afternoon' },
      { id: 3, name: 'Pedro Martín', is_active: true, shift: 'morning' },
      { id: 4, name: 'Carmen Ruiz', is_active: true, shift: 'afternoon' }
    ]
    return { data: mockStaff, error: null }
  },

  async assignCleaning(roomIds, staffName, userId = null) {
    try {
      // Actualizar habitaciones con personal asignado
      const { data, error } = await supabase
        .from('rooms')
        .update({
          cleaning_status: 'in_progress',
          assigned_cleaner: staffName,
          status: 'cleaning',
          updated_at: new Date().toISOString()
        })
        .in('id', roomIds)
        .select()

      if (error) {
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error assigning cleaning:', error)
      return { data: null, error }
    }
  },

  // =============================================
  // DEBUG Y TESTING
  // =============================================

  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('count')
        .limit(1)

      if (error) {
        throw error
      }

      console.log('✅ Supabase connection successful')
      return { success: true, error: null }
    } catch (error) {
      console.error('❌ Supabase connection failed:', error)
      return { success: false, error }
    }
  },

  async debugRoomReservations(roomId) {
    try {
      console.log(`🔍 Debugging room ${roomId} reservations...`)
      
      // Obtener habitación
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (roomError) {
        console.error('Room not found:', roomError)
        return
      }

      console.log('Room data:', room)

      // Obtener reservas para esta habitación
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select(`
          *,
          guest:guests(*)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })

      if (reservationsError) {
        console.error('Error getting reservations:', reservationsError)
        return
      }

      console.log('Reservations for this room:', reservations)

      // Reserva activa
      const activeReservation = reservations.find(r => r.status === 'checked_in')
      console.log('Active reservation:', activeReservation)

      return { room, reservations, activeReservation }
    } catch (error) {
      console.error('Error in debugRoomReservations:', error)
      return null
    }
  },

  // Función específica para obtener información de una habitación ocupada
  async getRoomReservationInfo(roomId) {
    try {
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select(`
          *,
          current_reservation:reservations!inner(
            *,
            guest:guests(*)
          )
        `)
        .eq('id', roomId)
        .eq('reservations.status', 'checked_in')
        .single()

      if (roomError) {
        return { 
          success: false, 
          error: 'No se encontró información de reserva para esta habitación' 
        }
      }

      return {
        success: true,
        room: {
          id: room.id,
          number: room.number,
          floor: room.floor,
          type: room.room_type,
          status: room.status
        },
        guest: room.current_reservation?.guest || null,
        reservation: room.current_reservation || null
      }
    } catch (error) {
      console.error('Error getting room reservation info:', error)
      return { 
        success: false, 
        error: 'Error al obtener información de la reserva' 
      }
    }
  }
}

// =============================================
// SUBSCRIPTIONS PARA TIEMPO REAL
// =============================================

export const subscriptions = {
  rooms: (callback) => {
    return supabase
      .channel('rooms_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rooms' }, 
        callback
      )
      .subscribe()
  },

  reservations: (callback) => {
    return supabase
      .channel('reservations_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reservations' }, 
        callback
      )
      .subscribe()
  }
}

// =============================================
// AUTH HELPERS
// =============================================

export const auth = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Export default
export default {
  supabase,
  db,
  subscriptions,
  auth
}