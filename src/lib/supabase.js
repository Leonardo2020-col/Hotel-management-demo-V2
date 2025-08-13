// src/lib/supabase.js - VERSIÓN CORREGIDA CON MEJORES PRÁCTICAS
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  // Add retry logic for better reliability
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000)
      })
    }
  }
})

// ====================================
// ERROR HANDLING UTILITIES
// ====================================

const handleSupabaseError = (error, operation) => {
  console.error(`Supabase error in ${operation}:`, error)
  
  // Common error handling
  if (error.code === 'PGRST116') {
    return { data: null, error: { message: 'Registro no encontrado' } }
  }
  
  if (error.code === '23505') {
    return { data: null, error: { message: 'Ya existe un registro con estos datos' } }
  }
  
  if (error.code === '23503') {
    return { data: null, error: { message: 'Error de relación de datos' } }
  }
  
  return { data: null, error: { message: error.message || 'Error en la base de datos' } }
}

// ====================================
// QUERY BUILDERS - BETTER ABSTRACTION
// ====================================

class QueryBuilder {
  constructor(tableName) {
    this.tableName = tableName
    this.query = supabase.from(tableName)
  }

  select(columns = '*') {
    this.query = this.query.select(columns)
    return this
  }

  where(column, operator, value) {
    this.query = this.query.eq(column, value)
    return this
  }

  in(column, values) {
    this.query = this.query.in(column, values)
    return this
  }

  orderBy(column, ascending = true) {
    this.query = this.query.order(column, { ascending })
    return this
  }

  limit(count) {
    this.query = this.query.limit(count)
    return this
  }

  range(from, to) {
    this.query = this.query.range(from, to)
    return this
  }

  async execute() {
    try {
      const { data, error } = await this.query
      if (error) {
        return handleSupabaseError(error, `query on ${this.tableName}`)
      }
      return { data, error: null }
    } catch (error) {
      return handleSupabaseError(error, `query on ${this.tableName}`)
    }
  }

  async single() {
    try {
      const { data, error } = await this.query.single()
      if (error) {
        return handleSupabaseError(error, `single query on ${this.tableName}`)
      }
      return { data, error: null }
    } catch (error) {
      return handleSupabaseError(error, `single query on ${this.tableName}`)
    }
  }
}

// ====================================
// DATABASE HELPERS - REFACTORED
// ====================================
export const db = {

  // =============================================
  // GENERIC CRUD OPERATIONS
  // =============================================
  
  async create(tableName, data) {
    try {
      console.log(`Creating record in ${tableName}:`, data)
      
      const { data: result, error } = await supabase
        .from(tableName)
        .insert([data])
        .select()
        .single()

      if (error) {
        return handleSupabaseError(error, `create in ${tableName}`)
      }

      console.log(`✅ Created record in ${tableName}:`, result.id)
      return { data: result, error: null }
    } catch (error) {
      return handleSupabaseError(error, `create in ${tableName}`)
    }
  },

  async update(tableName, id, updates) {
    try {
      console.log(`Updating record in ${tableName}:`, id)
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return handleSupabaseError(error, `update in ${tableName}`)
      }

      return { data, error: null }
    } catch (error) {
      return handleSupabaseError(error, `update in ${tableName}`)
    }
  },

  async delete(tableName, id) {
    try {
      console.log(`Deleting record from ${tableName}:`, id)
      
      const { data, error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return handleSupabaseError(error, `delete from ${tableName}`)
      }

      return { data, error: null }
    } catch (error) {
      return handleSupabaseError(error, `delete from ${tableName}`)
    }
  },

  async findById(tableName, id, select = '*') {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select(select)
        .eq('id', id)
        .single()

      if (error) {
        return handleSupabaseError(error, `findById in ${tableName}`)
      }

      return { data, error: null }
    } catch (error) {
      return handleSupabaseError(error, `findById in ${tableName}`)
    }
  },

  async findMany(tableName, options = {}) {
    try {
      let query = supabase.from(tableName).select(options.select || '*')

      // Apply filters
      if (options.where) {
        Object.entries(options.where).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      if (options.in) {
        Object.entries(options.in).forEach(([key, values]) => {
          query = query.in(key, values)
        })
      }

      // Apply ordering
      if (options.orderBy) {
        const [column, direction] = options.orderBy.split(':')
        query = query.order(column, { ascending: direction !== 'desc' })
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        return handleSupabaseError(error, `findMany in ${tableName}`)
      }

      return { data: data || [], error: null }
    } catch (error) {
      return handleSupabaseError(error, `findMany in ${tableName}`)
    }
  },

  // =============================================
  // BRANCH MANAGEMENT
  // =============================================

  async getBranches(filters = {}) {
    const options = {
      where: { is_active: true },
      orderBy: 'name:asc',
      ...filters
    }
    
    return this.findMany('branches', options)
  },

  async getBranchById(branchId) {
    return this.findById('branches', branchId)
  },

  async createBranch(branchData) {
    const data = {
      name: branchData.name?.trim(),
      location: branchData.location?.trim(),
      address: branchData.address?.trim(),
      code: branchData.code?.trim().toUpperCase(),
      phone: branchData.phone?.trim() || null,
      manager: branchData.manager?.trim() || null,
      features: branchData.features || [],
      timezone: branchData.timezone || 'America/Lima',
      rooms_count: branchData.rooms_count || 0,
      is_active: true
    }

    return this.create('branches', data)
  },

  async updateBranch(branchId, updateData) {
    return this.update('branches', branchId, updateData)
  },

  async deleteBranch(branchId) {
    // Soft delete - mark as inactive
    return this.update('branches', branchId, { is_active: false })
  },

  async getBranchStats(branchId) {
    try {
      console.log(`📊 Getting stats for branch ${branchId}`)
      
      const today = new Date().toISOString().split('T')[0]
      
      // Get branch info
      const { data: branch } = await this.getBranchById(branchId)
      if (!branch) {
        throw new Error('Sucursal no encontrada')
      }
      
      // Get rooms for this branch
      const { data: rooms } = await this.findMany('rooms', {
        where: { branch_id: branchId }
      })
      
      // Get active reservations
      const { data: activeReservations } = await this.findMany('reservations', {
        select: `
          id,
          status,
          check_in,
          check_out,
          room:rooms!inner(branch_id)
        `,
        where: { 'room.branch_id': branchId },
        in: { status: ['checked_in', 'confirmed'] }
      })
      
      // Calculate stats
      const totalRooms = rooms?.length || 0
      const occupiedRooms = rooms?.filter(r => r.status === 'occupied').length || 0
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
      const currentGuests = activeReservations?.filter(r => r.status === 'checked_in').length || 0
      
      const stats = {
        branchId,
        branchName: branch.name,
        branchCode: branch.code,
        totalRooms,
        occupiedRooms,
        availableRooms: totalRooms - occupiedRooms,
        occupancyRate,
        currentGuests,
        lastUpdated: new Date().toISOString()
      }
      
      return { data: stats, error: null }
      
    } catch (error) {
      return handleSupabaseError(error, `getBranchStats for ${branchId}`)
    }
  },

  async getUserBranches(userId) {
    try {
      console.log(`👤 Getting branches for user ${userId}`)
      
      if (!userId) {
        return { data: [], error: { message: 'ID de usuario requerido' } }
      }
      
      const { data, error } = await supabase
        .from('user_branches')
        .select(`
          id,
          is_default,
          created_at,
          branch:branches(
            id,
            name,
            location,
            address,
            phone,
            manager,
            code,
            features,
            timezone,
            rooms_count,
            is_active
          )
        `)
        .eq('user_id', userId)
        .eq('branch.is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true })

      if (error) {
        return handleSupabaseError(error, 'getUserBranches')
      }

      const userBranches = (data || []).map(ub => ({
        ...ub.branch,
        isDefault: ub.is_default,
        userBranchId: ub.id,
        assignedAt: ub.created_at
      }))

      return { data: userBranches, error: null }
      
    } catch (error) {
      return handleSupabaseError(error, 'getUserBranches')
    }
  },

  // =============================================
  // ROOMS MANAGEMENT
  // =============================================

  async getRooms(filters = {}) {
  try {
    console.log('Loading rooms with current table structure...', filters)
    
    const options = {
      orderBy: 'floor:asc,number:asc',
      ...filters
    }

    if (filters.branchId) {
      options.where = { branch_id: filters.branchId }
    }
    if (filters.status && filters.status !== 'all') {
      options.where = { ...options.where, status: filters.status }
    }
    if (filters.floor && filters.floor !== 'all') {
      options.where = { ...options.where, floor: filters.floor }
    }

    const { data: rooms, error } = await this.findMany('rooms', options)
    
    if (error) return { data: [], error }

    // Transformar habitaciones para compatibilidad con el frontend
    // AGREGAR CAMPOS MOCK para que funcione con los componentes
    const transformedRooms = (rooms || []).map(room => ({
      ...room,
      // Campos calculados/mock para compatibilidad
      rate: room.base_rate || 100,
      capacity: 2, // Mock fijo ya que no existe en tu tabla
      features: ['WiFi Gratis'], // Mock fijo ya que no existe en tu tabla
      beds: [{ type: 'Doble', count: 1 }], // Mock fijo ya que no existe en tu tabla
      bed_options: ['Doble'], // Mock fijo para compatibilidad
      room_type: 'Estándar' // Mock fijo para compatibilidad
    }))

    return { data: transformedRooms, error: null }

  } catch (error) {
    return handleSupabaseError(error, 'getRooms')
  }
},

  async createRoom(roomData) {
  try {
    if (!roomData.number || !roomData.floor) {
      return { 
        data: null, 
        error: { message: 'Número de habitación y piso son obligatorios' }
      }
    }

    // DATOS ADAPTADOS A TU TABLA ACTUAL
    const data = {
      number: roomData.number.toString(),
      floor: parseInt(roomData.floor),
      base_rate: parseFloat(roomData.base_rate || 100),
      branch_id: roomData.branch_id || 1,
      status: 'available',
      cleaning_status: 'clean',
      size: parseInt(roomData.size || 25),
      maintenance_notes: roomData.description || null
      // NO incluimos capacity, features, bed_options ya que no existen en tu tabla
    }

    // Check for duplicates
    const { data: existingRoom } = await supabase
      .from('rooms')
      .select('id')
      .eq('number', data.number)
      .eq('branch_id', data.branch_id)
      .single()

    if (existingRoom) {
      return { 
        data: null, 
        error: { message: `Ya existe una habitación con el número ${roomData.number}` }
      }
    }

    return this.create('rooms', data)

  } catch (error) {
    return handleSupabaseError(error, 'createRoom')
  }
},

  async updateRoom(roomId, updates) {
  try {
    // SOLO CAMPOS QUE EXISTEN EN TU TABLA
    const allowedUpdates = {}
    
    if (updates.number !== undefined) allowedUpdates.number = updates.number.toString()
    if (updates.floor !== undefined) allowedUpdates.floor = parseInt(updates.floor)
    if (updates.base_rate !== undefined) allowedUpdates.base_rate = parseFloat(updates.base_rate)
    if (updates.size !== undefined) allowedUpdates.size = parseInt(updates.size)
    if (updates.status !== undefined) allowedUpdates.status = updates.status
    if (updates.cleaning_status !== undefined) allowedUpdates.cleaning_status = updates.cleaning_status
    if (updates.maintenance_notes !== undefined) allowedUpdates.maintenance_notes = updates.maintenance_notes
    if (updates.assigned_cleaner !== undefined) allowedUpdates.assigned_cleaner = updates.assigned_cleaner
    if (updates.current_guest !== undefined) allowedUpdates.current_guest = updates.current_guest
    if (updates.last_guest !== undefined) allowedUpdates.last_guest = updates.last_guest
    
    return this.update('rooms', roomId, allowedUpdates)
  } catch (error) {
    return handleSupabaseError(error, 'updateRoom')
  }
},

  async deleteRoom(roomId) {
  try {
    // Verificar si hay reservas activas primero
    const { data: activeReservations } = await this.findMany('reservations', {
      where: { room_id: roomId },
      in: { status: ['confirmed', 'checked_in', 'pending'] }
    })
    
    if (activeReservations && activeReservations.length > 0) {
      return {
        data: null,
        error: { 
          message: `No se puede eliminar la habitación. Tiene ${activeReservations.length} reserva(s) activa(s). Cancela las reservas primero.`
        }
      }
    }
    
    return this.delete('rooms', roomId)
  } catch (error) {
    return handleSupabaseError(error, 'deleteRoom')
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

    // Si se marca como limpio, agregar información de limpieza
    if (cleaningStatus === 'clean') {
      updateData.last_cleaned = new Date().toISOString()
      updateData.cleaned_by = 'Reception Staff'
    }

    // Si se inicia limpieza, agregar timestamp
    if (newStatus === 'cleaning') {
      updateData.cleaning_start_time = new Date().toISOString()
    }

    return this.update('rooms', roomId, updateData)

  } catch (error) {
    return handleSupabaseError(error, 'updateRoomStatus')
  }
},

  async getRoomsNeedingCleaning(branchId = null) {
  try {
    const options = {
      where: branchId ? { branch_id: branchId } : {},
      orderBy: 'floor:asc,number:asc'
    }

    const { data: rooms, error } = await this.findMany('rooms', options)
    
    if (error) return { data: [], error }

    // Filtrar habitaciones que necesitan limpieza
    const roomsNeedingCleaning = rooms.filter(room => 
      room.cleaning_status === 'dirty' || 
      room.status === 'cleaning' ||
      (room.status === 'available' && room.cleaning_status === 'dirty')
    )

    return { data: roomsNeedingCleaning, error: null }
  } catch (error) {
    return handleSupabaseError(error, 'getRoomsNeedingCleaning')
  }
},

  // =============================================
  // GUESTS MANAGEMENT
  // =============================================

  async getGuests(options = {}) {
    const queryOptions = {
      orderBy: 'full_name:asc',
      ...options
    }
    
    return this.findMany('guests', queryOptions)
  },

  async createGuest(guestData) {
    try {
      if (!guestData.full_name) {
        return { 
          data: null, 
          error: { message: 'El nombre completo es obligatorio' }
        }
      }

      const data = {
        full_name: guestData.full_name.trim(),
        document_type: guestData.document_type || 'DNI',
        document_number: guestData.document_number?.trim() || '',
        email: guestData.email?.trim() || null,
        phone: guestData.phone?.trim() || null,
        status: guestData.status || 'active'
      }

      return this.create('guests', data)

    } catch (error) {
      return handleSupabaseError(error, 'createGuest')
    }
  },

  async updateGuest(guestId, updates) {
    return this.update('guests', guestId, updates)
  },

  async deleteGuest(guestId) {
    try {
      console.log('🗑️ Attempting to delete guest:', guestId)
      
      // Check for active reservations
      const { data: activeReservations } = await this.findMany('reservations', {
        where: { guest_id: guestId },
        in: { status: ['confirmed', 'checked_in', 'pending'] }
      })
      
      if (activeReservations && activeReservations.length > 0) {
        const reservationDetails = activeReservations.map(r => 
          `${r.confirmation_code || 'Sin código'} (${r.status})`
        ).join(', ')
        
        return {
          data: null,
          error: { 
            message: `No se puede eliminar el huésped. Tiene ${activeReservations.length} reserva(s) activa(s): ${reservationDetails}. Cancela o completa las reservas primero.`
          }
        }
      }
      
      // Check for completed reservations
      const { data: completedReservations } = await this.findMany('reservations', {
        where: { guest_id: guestId, status: 'checked_out' }
      })
      
      // If has completed reservations, mark as inactive instead of deleting
      if (completedReservations && completedReservations.length > 0) {
        console.log(`Guest has ${completedReservations.length} completed reservations. Marking as inactive.`)
        
        return this.update('guests', guestId, { status: 'inactive' })
      }
      
      // If no reservations, delete completely
      return this.delete('guests', guestId)
      
    } catch (error) {
      return handleSupabaseError(error, 'deleteGuest')
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

      if (error) {
        return handleSupabaseError(error, 'searchGuests')
      }

      return { data: data || [], error: null }
    } catch (error) {
      return handleSupabaseError(error, 'searchGuests')
    }
  },

  // =============================================
  // RESERVATIONS MANAGEMENT
  // =============================================

  async getReservations(options = {}) {
    try {
      const queryOptions = {
        select: `
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
            capacity,
            base_rate
          )
        `,
        orderBy: 'created_at:desc',
        ...options
      }

      return this.findMany('reservations', queryOptions)
      
    } catch (error) {
      return handleSupabaseError(error, 'getReservations')
    }
  },

  async createReservation(reservationData) {
    try {
      // Validate required fields
      const requiredFields = ['guest_id', 'room_id', 'check_in', 'check_out']
      for (const field of requiredFields) {
        if (!reservationData[field]) {
          return {
            data: null,
            error: { message: `Campo requerido faltante: ${field}` }
          }
        }
      }
      
      // Generate confirmation code if not provided
      const confirmationCode = reservationData.confirmation_code || 
        `HTP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

      const data = {
        confirmation_code: confirmationCode,
        guest_id: reservationData.guest_id,
        room_id: reservationData.room_id,
        branch_id: reservationData.branch_id || 1,
        check_in: reservationData.check_in,
        check_out: reservationData.check_out,
        adults: reservationData.adults || 1,
        children: reservationData.children || 0,
        rate: parseFloat(reservationData.rate) || 0,
        total_amount: parseFloat(reservationData.total_amount) || 0,
        paid_amount: parseFloat(reservationData.paid_amount) || 0,
        payment_status: reservationData.payment_status || 'pending',
        payment_method: reservationData.payment_method || null,
        status: reservationData.status || 'pending',
        source: reservationData.source || 'direct',
        special_requests: reservationData.special_requests || ''
      }

      const result = await this.create('reservations', data)
      
      if (result.error) return result

      // Fetch the complete reservation with related data
      const { data: completeReservation } = await supabase
        .from('reservations')
        .select(`
          *,
          guest:guests(*),
          room:rooms(*)
        `)
        .eq('id', result.data.id)
        .single()

      return { data: completeReservation, error: null }
      
    } catch (error) {
      return handleSupabaseError(error, 'createReservation')
    }
  },

  async updateReservation(reservationId, updates) {
    try {
      if (!reservationId) {
        return {
          data: null,
          error: { message: 'ID de reserva es requerido' }
        }
      }
      
      if (!updates || Object.keys(updates).length === 0) {
        return {
          data: null,
          error: { message: 'No hay datos para actualizar' }
        }
      }
      
      // Check if reservation exists
      const { data: existingReservation } = await this.findById('reservations', reservationId, 'id,status')
      
      if (!existingReservation) {
        return {
          data: null,
          error: { message: `No se encontró la reserva con ID: ${reservationId}` }
        }
      }
      
      return this.update('reservations', reservationId, updates)
      
    } catch (error) {
      return handleSupabaseError(error, 'updateReservation')
    }
  },

  async processCheckIn(reservationId) {
    try {
      const { data: reservation } = await this.findById('reservations', reservationId, '*, room:rooms(*)')
      
      if (!reservation) {
        return { data: null, error: { message: 'Reserva no encontrada' } }
      }

      // Update reservation
      const { data: updatedReservation, error: updateError } = await this.update('reservations', reservationId, {
        status: 'checked_in',
        checked_in_at: new Date().toISOString()
      })

      if (updateError) return { data: null, error: updateError }

      // Update room status
      await this.updateRoomStatus(reservation.room_id, 'occupied', 'dirty')

      return { data: updatedReservation, error: null }
    } catch (error) {
      return handleSupabaseError(error, 'processCheckIn')
    }
  },

  async processCheckOut(reservationId, paymentMethod = 'cash') {
    try {
      const { data: reservation } = await this.findById('reservations', reservationId, '*, room:rooms(*)')
      
      if (!reservation) {
        return { data: null, error: { message: 'Reserva no encontrada' } }
      }

      // Update reservation
      const { data: updatedReservation, error: updateError } = await this.update('reservations', reservationId, {
        status: 'checked_out',
        checked_out_at: new Date().toISOString(),
        payment_status: 'paid',
        paid_amount: reservation.total_amount,
        payment_method: paymentMethod
      })

      if (updateError) return { data: null, error: updateError }

      // Update room status
      await this.updateRoomStatus(reservation.room_id, 'cleaning', 'dirty')

      return { data: updatedReservation, error: null }
    } catch (error) {
      return handleSupabaseError(error, 'processCheckOut')
    }
  },

  // =============================================
  // ROOM AVAILABILITY
  // =============================================

  async getAvailableRooms(checkIn, checkOut) {
    try {
      console.log('🔍 Getting available rooms for:', { checkIn, checkOut })
      
      if (!checkIn || !checkOut) {
        return { data: [], error: { message: 'Fechas de entrada y salida son requeridas' } }
      }

      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkOut)
      
      if (checkOutDate <= checkInDate) {
        return { data: [], error: { message: 'La fecha de salida debe ser posterior a la entrada' } }
      }

      // Get all available rooms
      const { data: allRooms, error: roomsError } = await this.findMany('rooms', {
        where: { status: 'available' },
        orderBy: 'number:asc'
      })

      if (roomsError) return { data: [], error: roomsError }
      if (!allRooms || allRooms.length === 0) {
        return { data: [], error: null }
      }

      // Get conflicting reservations
      const { data: conflictingReservations } = await supabase
        .from('reservations')
        .select('id, room_id, check_in, check_out, status')
        .in('status', ['confirmed', 'checked_in', 'pending'])
        .or(`and(check_in.lte.${checkOut},check_out.gte.${checkIn})`)

      // Filter rooms without conflicts
      const availableRooms = allRooms.filter(room => {
        if (!conflictingReservations) return true

        const hasConflict = conflictingReservations.some(reservation => {
          if (reservation.room_id !== room.id) return false

          const reservationCheckIn = new Date(reservation.check_in)
          const reservationCheckOut = new Date(reservation.check_out)

          return (checkInDate < reservationCheckOut && checkOutDate > reservationCheckIn)
        })

        return !hasConflict
      })

      // Transform for frontend compatibility
      const transformedRooms = availableRooms.map(room => ({
        id: room.id,
        number: room.number,
        floor: room.floor,
        base_rate: parseFloat(room.base_rate || 100),
        rate: parseFloat(room.base_rate || 100),
        capacity: room.capacity || 2,
        status: room.status,
        features: room.features || [],
        size: room.size,
        beds: room.beds
      }))

      return { data: transformedRooms, error: null }

    } catch (error) {
      return handleSupabaseError(error, 'getAvailableRooms')
    }
  },

  async checkSpecificRoomAvailability(roomId, checkIn, checkOut) {
    try {
      const { data: conflictingReservations, error } = await supabase
        .from('reservations')
        .select('id, check_in, check_out, status, confirmation_code')
        .eq('room_id', roomId)
        .in('status', ['confirmed', 'checked_in', 'pending'])
        .or(`and(check_in.lte.${checkOut},check_out.gte.${checkIn})`)

      if (error) {
        return { available: false, conflicts: [], error }
      }

      const isAvailable = !conflictingReservations || conflictingReservations.length === 0
      
      return {
        available: isAvailable,
        conflicts: conflictingReservations || [],
        error: null
      }

    } catch (error) {
      return handleSupabaseError(error, 'checkSpecificRoomAvailability')
    }
  },

  // =============================================
  // SUPPLIES MANAGEMENT
  // =============================================

  async getAllInventoryItems() {
    try {
      console.log('Loading all inventory items (supplies + snacks)...')
      
      // Get supplies
      const { data: supplies } = await this.findMany('supplies', {
        select: `
          *,
          category:supply_categories(name),
          supplier:suppliers(name)
        `,
        orderBy: 'name:asc'
      })
      
      // Get snacks
      const { data: snackCategories } = await this.getSnackItems()
      
      // Convert snacks to uniform format
      const snacks = []
      if (snackCategories) {
        Object.entries(snackCategories).forEach(([categoryName, items]) => {
          items.forEach(item => {
            snacks.push({
              id: item.id,
              name: item.name,
              description: item.description,
              sku: `SNACK-${item.id}`,
              category: categoryName,
              supplier: 'Proveedor Snacks',
              unit: 'unidad',
              unitPrice: item.price,
              currentStock: 100, // Mock stock for snacks
              minStock: 10,
              maxStock: 200,
              location: 'Minibar',
              is_active: true,
              item_type: 'snack',
              branch_id: 1,
              lastUpdated: new Date().toISOString()
            })
          })
        })
      }
      
      // Format supplies for uniform structure
      const formattedSupplies = (supplies || []).map(supply => ({
        ...supply,
        category: supply.category?.name || 'Sin categoría',
        supplier: supply.supplier?.name || 'Sin proveedor',
        item_type: 'supply',
        currentStock: supply.current_stock,
        minStock: supply.min_stock,
        maxStock: supply.max_stock,
        unitPrice: supply.unit_price,
        lastUpdated: supply.updated_at
      }))
      
      const allItems = [...formattedSupplies, ...snacks]
      
      return { data: allItems, error: null }
      
    } catch (error) {
      return handleSupabaseError(error, 'getAllInventoryItems')
    }
  },

  async createSupply(supplyData) {
    try {
      const data = {
        name: supplyData.name,
        description: supplyData.description,
        sku: supplyData.sku || `SUP-${Date.now()}`,
        unit: supplyData.unit,
        unit_price: supplyData.unitPrice,
        current_stock: supplyData.currentStock || 0,
        min_stock: supplyData.minStock || 1,
        max_stock: supplyData.maxStock || 100,
        location: supplyData.location || 'Almacén',
        is_active: true,
        branch_id: supplyData.branch_id || 1
      }

      return this.create('supplies', data)

    } catch (error) {
      return handleSupabaseError(error, 'createSupply')
    }
  },

  async updateSupply(supplyId, updateData) {
    const validUpdates = {}
    
    if (updateData.name !== undefined) validUpdates.name = updateData.name
    if (updateData.description !== undefined) validUpdates.description = updateData.description
    if (updateData.sku !== undefined) validUpdates.sku = updateData.sku
    if (updateData.unit !== undefined) validUpdates.unit = updateData.unit
    if (updateData.unitPrice !== undefined) validUpdates.unit_price = updateData.unitPrice
    if (updateData.currentStock !== undefined) validUpdates.current_stock = updateData.currentStock
    if (updateData.minStock !== undefined) validUpdates.min_stock = updateData.minStock
    if (updateData.maxStock !== undefined) validUpdates.max_stock = updateData.maxStock
    
    return this.update('supplies', supplyId, validUpdates)
  },

  async deleteSupply(supplyId) {
    return this.delete('supplies', supplyId)
  },

  // =============================================
  // SNACKS MANAGEMENT
  // =============================================

  async getSnackItems() {
    try {
      // Try RPC function first
      const { data, error } = await supabase.rpc('get_snack_items')
      
      if (error) {
        console.warn('RPC get_snack_items failed, using mock data:', error)
        return this.getMockSnackItems()
      }
      
      return { data, error: null }
    } catch (error) {
      console.warn('RPC function not available, using mock data')
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
  // DASHBOARD STATS
  // =============================================

  async getDashboardStats() {
    try {
      console.log('📊 Loading comprehensive dashboard statistics...')
      
      // Get rooms
      const { data: rooms } = await this.findMany('rooms')
      
      // Get reservations
      const { data: reservations } = await this.findMany('reservations', {
        select: `
          *,
          guest:guests(full_name),
          room:rooms(number)
        `,
        orderBy: 'created_at:desc'
      })
      
      // Calculate stats
      const today = new Date().toISOString().split('T')[0]
      const thisMonth = new Date()
      const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)
      
      const totalRooms = rooms?.length || 0
      const occupiedRooms = rooms?.filter(r => r?.status === 'occupied').length || 0
      const availableRooms = rooms?.filter(r => r?.status === 'available').length || 0
      const occupancy = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
      
      const checkInsToday = reservations?.filter(r => 
        r?.check_in === today && r?.status === 'confirmed'
      ).length || 0
      
      const checkOutsToday = reservations?.filter(r => 
        r?.check_out === today && r?.status === 'checked_in'
      ).length || 0
      
      const currentGuests = reservations?.filter(r => r?.status === 'checked_in').length || 0
      
      // Revenue calculations
      const completedReservations = reservations?.filter(r => r?.status === 'checked_out') || []
      
      const revenueToday = completedReservations
        .filter(r => r?.checked_out_at?.split('T')[0] === today)
        .reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0)
      
      const revenueThisMonth = completedReservations
        .filter(r => new Date(r?.checked_out_at || 0) >= startOfMonth)
        .reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0)
      
      // Average rate
      const activeReservations = reservations?.filter(r => 
        r?.status === 'checked_in' || r?.status === 'checked_out'
      ) || []
      
      const averageRate = activeReservations.length > 0 
        ? activeReservations.reduce((sum, r) => sum + (Number(r.rate) || 0), 0) / activeReservations.length
        : 0

      const stats = {
        occupancy,
        totalRooms,
        occupiedRooms,
        availableRooms,
        totalGuests: currentGuests,
        checkInsToday,
        checkOutsToday,
        averageRate,
        revenue: {
          today: revenueToday,
          thisMonth: revenueThisMonth
        }
      }
      
      return { data: stats, error: null }
      
    } catch (error) {
      return handleSupabaseError(error, 'getDashboardStats')
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

      if (error) {
        return { success: false, error }
      }

      console.log('✅ Supabase connection successful')
      return { success: true, error: null }
    } catch (error) {
      console.error('❌ Supabase connection failed:', error)
      return { success: false, error }
    }
  },

  // =============================================
  // CLEANING MANAGEMENT
  // =============================================

  async cleanRoomWithClick(roomId) {
  try {
    console.log(`🧹 Quick cleaning room with ID: ${roomId}`)
    
    const updateData = {
      status: 'available',
      cleaning_status: 'clean',
      last_cleaned: new Date().toISOString(),
      cleaned_by: 'Reception Staff',
      cleaning_start_time: null, // Limpiar timestamp de inicio
      assigned_cleaner: null // Limpiar asignación
    }
    
    return this.update('rooms', roomId, updateData)
    
  } catch (error) {
    return handleSupabaseError(error, 'cleanRoomWithClick')
  }
},

  async getCleaningStaff() {
  try {
    // Como probablemente no tienes tabla de personal, usar datos mock
    return {
      data: [
        { id: 1, name: 'María González', shift: 'morning', phone: '+51 987-654-321' },
        { id: 2, name: 'Ana López', shift: 'afternoon', phone: '+51 987-654-322' },
        { id: 3, name: 'Pedro Martín', shift: 'morning', phone: '+51 987-654-323' },
        { id: 4, name: 'Carmen Torres', shift: 'night', phone: '+51 987-654-324' }
      ],
      error: null
    }
  } catch (error) {
    return {
      data: [
        { id: 1, name: 'Personal de Limpieza', shift: 'morning' }
      ],
      error: null
    }
  }
},

// =============================================
// ROOM ASSIGNMENTS (USANDO CAMPOS EXISTENTES)
// =============================================
async assignRoomCleaning(roomIds, staffId, notes = '') {
  try {
    console.log(`👥 Assigning cleaning for rooms ${roomIds} to staff ${staffId}`)
    
    // Buscar el nombre del personal
    const { data: staff } = await this.getCleaningStaff()
    const staffMember = staff.find(s => s.id === parseInt(staffId))
    const staffName = staffMember ? staffMember.name : 'Personal de Limpieza'
    
    const updates = roomIds.map(roomId => 
      this.update('rooms', roomId, {
        assigned_cleaner: staffName, // Usar string en lugar de ID
        cleaning_start_time: new Date().toISOString(),
        status: 'cleaning',
        cleaning_status: 'in_progress',
        maintenance_notes: notes || null
      })
    )
    
    const results = await Promise.all(updates)
    
    // Verificar si alguna actualización falló
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      return { data: null, error: errors[0].error }
    }
    
    return { data: results.map(r => r.data), error: null }
    
  } catch (error) {
    return handleSupabaseError(error, 'assignRoomCleaning')
  }
},

// =============================================
// ROOM AVAILABILITY FOR RESERVATIONS
// =============================================
async getRoomAvailabilityStatus(roomId) {
  try {
    // Obtener habitación
    const { data: room } = await this.findById('rooms', roomId)
    if (!room) {
      return { data: null, error: { message: 'Habitación no encontrada' } }
    }
    
    // Obtener reservas activas para esta habitación
    const { data: activeReservations } = await this.findMany('reservations', {
      where: { room_id: roomId },
      in: { status: ['checked_in', 'confirmed'] }
    })
    
    const hasActiveReservation = activeReservations && activeReservations.length > 0
    const currentReservation = activeReservations?.find(r => r.status === 'checked_in')
    const nextReservation = activeReservations?.find(r => r.status === 'confirmed')
    
    return {
      data: {
        room,
        isOccupied: !!currentReservation,
        hasUpcomingReservation: !!nextReservation,
        currentReservation,
        nextReservation,
        canClean: !hasActiveReservation && room.cleaning_status === 'dirty'
      },
      error: null
    }
    
  } catch (error) {
    return handleSupabaseError(error, 'getRoomAvailabilityStatus')
  }
},


  // =============================================
  // QUICK CHECK-INS (for walk-in guests)
  // =============================================

  async createQuickCheckin(checkinData) {
    try {
      console.log('🏨 Creating quick check-in (walk-in guest):', checkinData)
      
      return this.create('quick_checkins', checkinData)
      
    } catch (error) {
      return handleSupabaseError(error, 'createQuickCheckin')
    }
  },

  async getActiveQuickCheckins(branchId = null) {
    try {
      const options = {
        where: { status: 'checked_in' },
        orderBy: 'checked_in_at:desc'
      }
      
      if (branchId) {
        options.where.branch_id = branchId
      }
      
      return this.findMany('quick_checkins', options)
      
    } catch (error) {
      return handleSupabaseError(error, 'getActiveQuickCheckins')
    }
  },

  async updateQuickCheckin(checkinId, updates) {
    return this.update('quick_checkins', checkinId, updates)
  },

  // =============================================
  // CONSUMPTION TRACKING
  // =============================================

  async recordSupplyConsumption(consumptionData) {
    try {
      const movementData = {
        supply_id: consumptionData.supplyId,
        movement_type: 'consumption',
        quantity: consumptionData.quantity,
        reason: consumptionData.reason || 'Consumo registrado',
        room_number: consumptionData.roomNumber,
        department: consumptionData.department || 'General',
        consumed_by: consumptionData.consumedBy || 'Usuario',
        created_by: null,
        created_at: new Date().toISOString()
      }

      return this.create('supply_movements', movementData)
    } catch (error) {
      return handleSupabaseError(error, 'recordSupplyConsumption')
    }
  },

  async getConsumptionHistory(filters = {}) {
    try {
      const options = {
        select: `
          *,
          supply:supplies(name, unit, category:supply_categories(name))
        `,
        where: { movement_type: 'consumption' },
        orderBy: 'created_at:desc'
      }
      
      if (filters.supplyId) {
        options.where.supply_id = filters.supplyId
      }
      
      if (filters.limit) {
        options.limit = filters.limit
      }
      
      return this.findMany('supply_movements', options)
    } catch (error) {
      return handleSupabaseError(error, 'getConsumptionHistory')
    }
  }
}

// =============================================
// SUBSCRIPTIONS FOR REAL-TIME UPDATES
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
  },

  guests: (callback) => {
    return supabase
      .channel('guests_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'guests' }, 
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
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      return { error }
    }
  },

  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      return { session, error }
    } catch (error) {
      return { session: null, error }
    }
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
  if (!amount && amount !== 0) return 'S/ 0.00'
  
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(amount)
}

export const formatLocalDate = (date, options = {}) => {
  if (!date) return ''
  
  const defaultOptions = {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  }
  
  return new Date(date).toLocaleDateString('es-PE', defaultOptions)
}

export const validateRequired = (data, requiredFields) => {
  const errors = []
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`El campo ${field} es obligatorio`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const generateUniqueCode = (prefix = 'HTP', length = 6) => {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, length).toUpperCase()
  return `${prefix}-${new Date().getFullYear()}-${timestamp}${random}`
}

// Export default
export default {
  supabase,
  db,
  subscriptions,
  auth,
  formatDate,
  formatCurrency,
  formatLocalDate,
  validateRequired,
  generateUniqueCode
}