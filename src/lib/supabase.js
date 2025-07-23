// src/lib/supabase.js - VERSIÓN CORREGIDA PARA LA NUEVA ESTRUCTURA
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

// ====================================
// FUNCIÓN getRoomsByFloor CORREGIDA
// ====================================
export const getRoomsByFloor = async (branchId = null) => {
  try {
    console.log('Loading rooms by floor...')
    
    // Usar función RPC si existe, sino usar método directo
    try {
      const { data, error } = await supabase.rpc('get_rooms_by_floor', {
        branch_id_param: branchId
      })
      
      if (error) throw error
      return data || {}
    } catch (rpcError) {
      console.warn('RPC failed, using direct query:', rpcError)
      
      // Fallback: consulta directa
      const { data: rooms, error } = await supabase
        .from('rooms')
        .select('*')
        .eq(branchId ? 'branch_id' : 'id', branchId ? branchId : 'id')
        .order('floor')
        .order('number')
      
      if (error) throw error
      
      // Agrupar por piso
      const roomsByFloor = rooms.reduce((acc, room) => {
        const floor = room.floor
        if (!acc[floor]) {
          acc[floor] = []
        }
        acc[floor].push({
          id: room.id,
          number: room.number,
          status: room.status,
          cleaning_status: room.cleaning_status,
          capacity: room.capacity,
          rate: room.base_rate,
          beds: room.beds,
          features: room.features,
          room_id: room.id,
          floor: room.floor,
          type: room.room_type
        })
        return acc
      }, {})
      
      return roomsByFloor
    }
  } catch (error) {
    console.error('Error in getRoomsByFloor:', error)
    throw error
  }
}

// ====================================
// DATABASE HELPERS - VERSIÓN CORREGIDA
// ====================================
export const db = {

  // =============================================
  // ROOMS MANAGEMENT - ESTRUCTURA CORREGIDA
  // =============================================

  async getRooms(filters = {}) {
    try {
      console.log('Loading rooms with corrected structure...')
      
      let roomQuery = supabase
        .from('rooms')
        .select('*')
        .order('floor')
        .order('number')

      // Aplicar filtros
      if (filters.branchId) {
        roomQuery = roomQuery.eq('branch_id', filters.branchId)
      }
      if (filters.status && filters.status !== 'all') {
        roomQuery = roomQuery.eq('status', filters.status)
      }
      if (filters.floor && filters.floor !== 'all') {
        roomQuery = roomQuery.eq('floor', filters.floor)
      }
      if (filters.search) {
        roomQuery = roomQuery.ilike('number', `%${filters.search}%`)
      }

      const { data: rooms, error: roomsError } = await roomQuery

      if (roomsError) {
        console.error('Error loading rooms:', roomsError)
        throw roomsError
      }

      // Obtener reservas activas
      const { data: reservations } = await supabase
        .from('reservations')
        .select(`
          *,
          guest:guests(
            id,
            full_name,
            email,
            phone,
            document_number
          )
        `)
        .in('status', ['checked_in', 'confirmed'])

      // Enriquecer habitaciones con información de reservas
      const enrichedRooms = rooms.map(room => {
        const activeReservation = reservations?.find(
          res => res.room_id === room.id && res.status === 'checked_in'
        )
        
        const nextReservation = reservations?.find(
          res => res.room_id === room.id && res.status === 'confirmed'
        )

        return {
          ...room,
          // Usar campos directos (ya no room_type.name)
          type: room.room_type,
          rate: room.base_rate,
          
          // Información del huésped actual
          currentGuest: activeReservation ? {
            id: activeReservation.guest?.id,
            name: activeReservation.guest?.full_name,
            email: activeReservation.guest?.email,
            phone: activeReservation.guest?.phone,
            checkIn: activeReservation.check_in,
            checkOut: activeReservation.check_out,
            confirmationCode: activeReservation.confirmation_code
          } : null,

          // Próxima reserva
          nextReservation: nextReservation ? {
            id: nextReservation.id,
            guest: nextReservation.guest?.full_name,
            checkIn: nextReservation.check_in,
            confirmationCode: nextReservation.confirmation_code
          } : null,

          activeReservation: activeReservation || null
        }
      })

      console.log(`✅ Loaded ${enrichedRooms.length} rooms`)
      return { data: enrichedRooms, error: null }

    } catch (error) {
      console.error('Error in getRooms:', error)
      return { data: null, error }
    }
  },

  async getRoomsByFloor(branchId = null) {
    return await getRoomsByFloor(branchId)
  },

  async createRoom(roomData) {
    try {
      console.log('Creating room with corrected structure:', roomData)

      if (!roomData.number || !roomData.floor) {
        return { 
          data: null, 
          error: { message: 'Número de habitación y piso son obligatorios' }
        }
      }

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
        bed_options: roomData.bed_options || ['Doble']
      }

      // Verificar duplicados
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

      const { data, error } = await supabase
        .from('rooms')
        .insert([insertData])
        .select()
        .single()

      if (error) throw error

      console.log('✅ Room created successfully:', data)
      return { data, error: null }

    } catch (error) {
      console.error('Error in createRoom:', error)
      return { 
        data: null, 
        error: { message: 'Error al crear la habitación: ' + error.message }
      }
    }
  },

  async updateRoom(roomId, updates) {
    try {
      const validUpdates = {}
      
      // Solo incluir campos válidos
      if (updates.number !== undefined) validUpdates.number = updates.number
      if (updates.floor !== undefined) validUpdates.floor = updates.floor
      if (updates.room_type !== undefined) validUpdates.room_type = updates.room_type
      if (updates.base_rate !== undefined) validUpdates.base_rate = updates.base_rate
      if (updates.capacity !== undefined) validUpdates.capacity = updates.capacity
      if (updates.size !== undefined) validUpdates.size = updates.size
      if (updates.features !== undefined) validUpdates.features = updates.features
      if (updates.beds !== undefined) validUpdates.beds = updates.beds
      if (updates.status !== undefined) validUpdates.status = updates.status
      if (updates.cleaning_status !== undefined) validUpdates.cleaning_status = updates.cleaning_status
      
      validUpdates.updated_at = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('rooms')
        .update(validUpdates)
        .eq('id', roomId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

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

  async updateRoomStatus(roomId, newStatus, cleaningStatus = null) {
    try {
      const updateData = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      }
      
      if (cleaningStatus) {
        updateData.cleaning_status = cleaningStatus
      }

      if (cleaningStatus === 'clean') {
        updateData.last_cleaned = new Date().toISOString()
        updateData.cleaned_by = 'Reception Staff'
      }

      const { data, error } = await supabase
        .from('rooms')
        .update(updateData)
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

  // =============================================
  // GUEST MANAGEMENT - ESTRUCTURA SIMPLIFICADA
  // =============================================

  async getGuests(options = {}) {
    try {
      let query = supabase
        .from('guests')
        .select('*')
        .order('full_name')

      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query
      return { data, error }
    } catch (error) {
      console.error('Error getting guests:', error)
      return { data: [], error }
    }
  },

  async searchGuests(searchTerm, limit = 10) {
    try {
      if (!searchTerm || searchTerm.trim() === '') {
        return { data: [], error: null }
      }

      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,document_number.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(limit)
        .order('full_name')

      return { data: data || [], error }
    } catch (error) {
      console.error('Error searching guests:', error)
      return { data: [], error }
    }
  },

  async createGuest(guestData) {
    try {
      // Validar datos mínimos
      if (!guestData.full_name && !guestData.first_name) {
        return { 
          data: null, 
          error: { message: 'El nombre del huésped es obligatorio' }
        }
      }

      const insertData = {
        full_name: guestData.full_name || `${guestData.first_name || ''} ${guestData.last_name || ''}`.trim(),
        email: guestData.email || '',
        phone: guestData.phone || '',
        document_type: guestData.document_type || 'DNI',
        document_number: guestData.document_number || '',
        status: 'active',
        total_visits: 0,
        total_spent: 0
      }

      const { data, error } = await supabase
        .from('guests')
        .insert([insertData])
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error creating guest:', error)
      return { data: null, error }
    }
  },

  async updateGuest(guestId, updates) {
    try {
      const { data, error } = await supabase
        .from('guests')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', guestId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // =============================================
  // RESERVATION MANAGEMENT - ESTRUCTURA CORREGIDA
  // =============================================

  async getReservations(options = {}) {
    try {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          guest:guests(
            id,
            full_name,
            email,
            phone,
            document_number,
            document_type,
            status
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

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error in getReservations:', error)
      return { data: [], error }
    }
  },

  async createReservation(reservationData) {
    try {
      // Generar código de confirmación
      const confirmationCode = reservationData.confirmation_code || 
        `HTP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

      // Calcular noches
      const checkIn = new Date(reservationData.check_in)
      const checkOut = new Date(reservationData.check_out)
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))

      const insertData = {
        confirmation_code: confirmationCode,
        guest_id: reservationData.guest_id,
        room_id: reservationData.room_id,
        branch_id: reservationData.branch_id || 1,
        check_in: reservationData.check_in,
        check_out: reservationData.check_out,
        adults: reservationData.adults || 1,
        children: reservationData.children || 0,
        rate: reservationData.rate,
        total_amount: reservationData.total_amount || (nights * reservationData.rate),
        paid_amount: reservationData.paid_amount || 0,
        payment_status: reservationData.payment_status || 'pending',
        payment_method: reservationData.payment_method || 'cash',
        status: reservationData.status || 'pending',
        source: reservationData.source || 'direct',
        special_requests: reservationData.special_requests || ''
      }

      const { data, error } = await supabase
        .from('reservations')
        .insert([insertData])
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

  async updateReservation(reservationId, updates) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error in updateReservation:', error)
      return { data: null, error }
    }
  },

  async processCheckIn(reservationId) {
    try {
      const { data: reservation, error: getError } = await supabase
        .from('reservations')
        .select('*, room:rooms(*)')
        .eq('id', reservationId)
        .single()

      if (getError) throw getError

      // Actualizar reserva
      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select()
        .single()

      if (updateError) throw updateError

      // Actualizar habitación
      await this.updateRoomStatus(reservation.room_id, 'occupied', 'dirty')

      return { data: updatedReservation, error: null }
    } catch (error) {
      console.error('Error in processCheckIn:', error)
      return { data: null, error }
    }
  },

  async processCheckOut(reservationId, paymentMethod = 'cash') {
    try {
      const { data: reservation, error: getError } = await supabase
        .from('reservations')
        .select('*, room:rooms(*)')
        .eq('id', reservationId)
        .single()

      if (getError) throw getError

      // Actualizar reserva
      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update({
          status: 'checked_out',
          checked_out_at: new Date().toISOString(),
          payment_status: 'paid',
          paid_amount: reservation.total_amount,
          payment_method: paymentMethod,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select()
        .single()

      if (updateError) throw updateError

      // Actualizar habitación
      await this.updateRoomStatus(reservation.room_id, 'cleaning', 'dirty')

      return { data: updatedReservation, error: null }
    } catch (error) {
      console.error('Error in processCheckOut:', error)
      return { data: null, error }
    }
  },

  // =============================================
  // ROOM AVAILABILITY
  // =============================================

  async getAvailableRooms(checkIn, checkOut) {
    try {
      const { data, error } = await supabase
        .from('room_availability')
        .select('*')
        .eq('is_available', true)
        .gte('date', checkIn)
        .lt('date', checkOut)

      if (error) throw error

      // Agrupar por habitación y verificar que todos los días estén disponibles
      const roomAvailability = {}
      data.forEach(availability => {
        if (!roomAvailability[availability.room_id]) {
          roomAvailability[availability.room_id] = []
        }
        roomAvailability[availability.room_id].push(availability.date)
      })

      // Calcular días necesarios
      const startDate = new Date(checkIn)
      const endDate = new Date(checkOut)
      const daysNeeded = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))

      // Filtrar habitaciones con disponibilidad completa
      const availableRoomIds = Object.keys(roomAvailability).filter(roomId => 
        roomAvailability[roomId].length >= daysNeeded
      )

      if (availableRoomIds.length === 0) {
        return { data: [], error: null }
      }

      // Obtener detalles de las habitaciones disponibles
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .in('id', availableRoomIds)
        .eq('status', 'available')

      return { data: rooms || [], error: roomsError }
    } catch (error) {
      console.error('Error getting available rooms:', error)
      return { data: [], error }
    }
  },

  // =============================================
  // SNACKS MANAGEMENT
  // =============================================

  async getSnackItems() {
    try {
      console.log('Loading snack items...')
      
      try {
        const { data, error } = await supabase.rpc('get_snack_items')
        
        if (error) {
          console.warn('RPC get_snack_items failed:', error)
          return this.getMockSnackItems()
        }
        
        return { data, error: null }
      } catch (rpcError) {
        console.warn('RPC function not available, using mock data')
        return this.getMockSnackItems()
      }
    } catch (error) {
      console.error('Error in getSnackItems:', error)
      return this.getMockSnackItems()
    }
  },

  getMockSnackItems() {
    const mockData = {
      'FRUTAS': [
        { id: 1, name: 'Manzana Roja', description: 'Manzana fresca importada', price: 3.50 },
        { id: 2, name: 'Plátano', description: 'Plátano orgánico nacional', price: 2.00 },
        { id: 3, name: 'Naranja', description: 'Naranja dulce de temporada', price: 3.00 }
      ],
      'BEBIDAS': [
        { id: 4, name: 'Agua Mineral', description: 'Agua mineral 500ml', price: 4.00 },
        { id: 5, name: 'Coca Cola', description: 'Coca Cola 355ml', price: 5.50 },
        { id: 6, name: 'Café Express', description: 'Café americano caliente', price: 8.00 }
      ],
      'SNACKS': [
        { id: 7, name: 'Papas Lays', description: 'Papas fritas clásicas', price: 6.50 },
        { id: 8, name: 'Galletas Oreo', description: 'Galletas con crema', price: 7.00 },
        { id: 9, name: 'Maní Salado', description: 'Maní tostado con sal', price: 5.00 }
      ],
      'POSTRES': [
        { id: 10, name: 'Chocolate Sublime', description: 'Chocolate con maní', price: 4.50 },
        { id: 11, name: 'Alfajor Donofrio', description: 'Alfajor triple', price: 6.00 },
        { id: 12, name: 'Helado Piccolo', description: 'Helado de vainilla', price: 8.50 }
      ]
    }
    
    return { data: mockData, error: null }
  },

  // =============================================
  // CLEANING MANAGEMENT
  // =============================================

  async cleanRoomWithClick(roomId) {
    try {
      console.log(`🧹 Cleaning room with ID: ${roomId}`)
      
      const { data, error } = await supabase
        .from('rooms')
        .update({
          status: 'available',
          cleaning_status: 'clean',
          last_cleaned: new Date().toISOString(),
          cleaned_by: 'Reception Staff',
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId)
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Room cleaned successfully:', data)
      return { data, error: null }
      
    } catch (error) {
      console.error('Error in cleanRoomWithClick:', error)
      return { data: null, error }
    }
  },

  async getRoomsNeedingCleaning(branchId = null) {
    try {
      let query = supabase
        .from('rooms')
        .select('*')
        .or('cleaning_status.eq.dirty,status.eq.cleaning')
        .order('floor')
        .order('number')
      
      if (branchId) {
        query = query.eq('branch_id', branchId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      return { data: data || [], error: null }
      
    } catch (error) {
      console.error('Error getting rooms needing cleaning:', error)
      return { data: [], error }
    }
  },

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('count')
        .limit(1)

      if (error) throw error

      console.log('✅ Supabase connection successful')
      return { success: true, error: null }
    } catch (error) {
      console.error('❌ Supabase connection failed:', error)
      return { success: false, error }
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

// =============================================
// UTILITY FUNCTIONS
// =============================================

export const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export const formatCurrency = (amount) => {
  if (!amount) return 'S/ 0.00'
  return `S/ ${parseFloat(amount).toFixed(2)}`
}

// Export default
export default {
  supabase,
  db,
  subscriptions,
  auth,
  formatDate,
  formatCurrency
}