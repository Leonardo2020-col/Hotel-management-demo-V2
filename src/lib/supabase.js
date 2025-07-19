// src/lib/supabase.js - SIN ROOM_TYPES
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

// Database helpers
export const db = {
  // =============================================
  // ROOMS MANAGEMENT FUNCTIONS - SIN ROOM_TYPES
  // =============================================

  // Create room function - SIMPLIFICADA
  async createRoom(roomData) {
    try {
      console.log('Creating room without room_types:', roomData)

      // Preparar datos para inserción
      const insertData = {
        number: roomData.number,
        floor: roomData.floor,
        room_type: roomData.type || roomData.room_type || 'Habitación Estándar',
        base_rate: roomData.rate || roomData.base_rate || 100.00,
        capacity: roomData.capacity || 2,
        branch_id: roomData.branch_id || 1,
        status: roomData.status || 'available',
        cleaning_status: roomData.cleaningStatus || 'clean',
        beds: JSON.stringify(roomData.beds || [{ type: 'Doble', count: 1 }]),
        size: roomData.size || 25,
        features: roomData.features || ['WiFi Gratis'],
        description: roomData.description || `${roomData.type || 'Habitación Estándar'} ${roomData.number}`,
        bed_options: roomData.bed_options || ['Doble']
      }

      console.log('Insert data prepared:', insertData)

      // Verificar que el número no esté duplicado
      const { data: existingRoom } = await supabase
        .from('rooms')
        .select('id')
        .eq('number', roomData.number)
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
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Error inserting room:', error)
        return { data: null, error }
      }

      console.log('Room created successfully:', data)

      // Crear registros de disponibilidad para los próximos 90 días
      await this.createRoomAvailability(data.id, insertData)

      return { data, error: null }

    } catch (error) {
      console.error('Error in createRoom:', error)
      return { 
        data: null, 
        error: { message: 'Error interno al crear la habitación: ' + error.message }
      }
    }
  },

  // Función auxiliar para crear disponibilidad de habitación - SIMPLIFICADA
  async createRoomAvailability(roomId, roomData) {
    try {
      console.log('Creating availability for room:', roomId)

      // Crear registros de disponibilidad para los próximos 90 días
      const availabilityRecords = []
      const today = new Date()
      
      for (let i = 0; i < 90; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() + i)
        
        availabilityRecords.push({
          room_id: roomId,
          date: date.toISOString().split('T')[0],
          is_available: roomData.status === 'available',
          rate: roomData.base_rate || 100,
          number: roomData.number,
          floor: roomData.floor,
          room_type: roomData.room_type,
          status: roomData.status,
          cleaning_status: roomData.cleaning_status,
          capacity: roomData.capacity,
          branch_id: roomData.branch_id
        })
      }

      // Insertar en lotes de 50 para evitar límites
      const batchSize = 50
      for (let i = 0; i < availabilityRecords.length; i += batchSize) {
        const batch = availabilityRecords.slice(i, i + batchSize)
        await supabase
          .from('room_availability')
          .insert(batch)
      }

      console.log('Room availability created successfully')

    } catch (error) {
      console.error('Error creating room availability:', error)
    }
  },

  // Update room function - SIMPLIFICADA
  async updateRoom(roomId, updates) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('id', roomId)
        .select()
        .single()

      // Actualizar room_availability si es necesario
      if (updates.status || updates.cleaning_status || updates.base_rate) {
        await supabase
          .from('room_availability')
          .update({
            status: updates.status,
            cleaning_status: updates.cleaning_status,
            rate: updates.base_rate,
            is_available: updates.status === 'available'
          })
          .eq('room_id', roomId)
      }

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Delete room function
  async deleteRoom(roomId) {
    try {
      // Primero eliminar registros de disponibilidad
      await supabase
        .from('room_availability')
        .delete()
        .eq('room_id', roomId)

      // Luego eliminar la habitación
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

  // =============================================
  // ROOMS QUERY FUNCTIONS - SIN ROOM_TYPES
  // =============================================

  // Get rooms with proper filtering - SIMPLIFICADA
  async getRooms(filters = {}) {
    try {
      let query = supabase
        .from('rooms')
        .select('*')
        .order('floor')
        .order('number')

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters.floor && filters.floor !== 'all') {
        query = query.eq('floor', filters.floor)
      }
      if (filters.type && filters.type !== 'all') {
        query = query.eq('room_type', filters.type)
      }
      if (filters.cleaningStatus && filters.cleaningStatus !== 'all') {
        query = query.eq('cleaning_status', filters.cleaningStatus)
      }
      if (filters.search) {
        query = query.or(`number.ilike.%${filters.search}%,description.ilike.%${filters.search}%,room_type.ilike.%${filters.search}%`)
      }

      const { data, error } = await query
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get room availability - SIMPLIFICADA
  async getRoomAvailability(startDate, endDate, filters = {}) {
    try {
      let query = supabase
        .from('room_availability')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('floor')
        .order('number')
        .order('date')

      if (filters.available_only) {
        query = query.eq('is_available', true)
      }
      if (filters.room_type) {
        query = query.eq('room_type', filters.room_type)
      }
      if (filters.floor) {
        query = query.eq('floor', filters.floor)
      }

      const { data, error } = await query
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get available rooms for dates - SIMPLIFICADA
  async getAvailableRooms(checkIn, checkOut, roomType = null) {
    try {
      let query = supabase
        .from('room_availability')
        .select('*')
        .eq('is_available', true)
        .gte('date', checkIn)
        .lt('date', checkOut)

      if (roomType) {
        query = query.eq('room_type', roomType)
      }

      const { data, error } = await query
      
      if (error) return { data: null, error }

      // Agrupar por habitación y verificar que esté disponible todos los días
      const roomAvailability = {}
      data.forEach(record => {
        if (!roomAvailability[record.room_id]) {
          roomAvailability[record.room_id] = {
            room_id: record.room_id,
            number: record.number,
            room_type: record.room_type,
            floor: record.floor,
            rate: record.rate,
            capacity: record.capacity,
            available_days: 0,
            total_days_needed: 0
          }
        }
        roomAvailability[record.room_id].available_days++
      })

      // Calcular días necesarios
      const start = new Date(checkIn)
      const end = new Date(checkOut)
      const daysNeeded = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

      // Filtrar habitaciones que están disponibles todos los días necesarios
      const availableRooms = Object.values(roomAvailability)
        .filter(room => room.available_days >= daysNeeded)
        .map(room => ({
          ...room,
          total_days_needed: daysNeeded
        }))

      return { data: availableRooms, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // =============================================
  // ROOM STATISTICS - SIMPLIFICADAS
  // =============================================

  async getRoomStats() {
    try {
      const { data: rooms, error } = await supabase
        .from('rooms')
        .select('status, cleaning_status, room_type, base_rate')

      if (error) return { data: null, error }

      const stats = {
        total: rooms.length,
        available: rooms.filter(r => r.status === 'available').length,
        occupied: rooms.filter(r => r.status === 'occupied').length,
        cleaning: rooms.filter(r => r.status === 'cleaning').length,
        maintenance: rooms.filter(r => r.status === 'maintenance').length,
        outOfOrder: rooms.filter(r => r.status === 'out_of_order').length,
        needsCleaning: rooms.filter(r => r.cleaning_status === 'dirty').length,
        occupancyRate: rooms.length > 0 ? 
          Math.round((rooms.filter(r => r.status === 'occupied').length / rooms.length) * 100) : 0
      }

      // Estadísticas por tipo - SIMPLIFICADAS
      const roomsByType = {}
      rooms.forEach(room => {
        const typeName = room.room_type || 'Sin tipo'
        if (!roomsByType[typeName]) {
          roomsByType[typeName] = {
            name: typeName,
            total: 0,
            available: 0,
            occupied: 0,
            baseRate: room.base_rate || 0
          }
        }
        roomsByType[typeName].total++
        if (room.status === 'available') roomsByType[typeName].available++
        if (room.status === 'occupied') roomsByType[typeName].occupied++
      })

      return { 
        data: {
          ...stats,
          roomsByType: Object.values(roomsByType)
        }, 
        error: null 
      }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get unique room types - NUEVA FUNCIÓN
  async getRoomTypes() {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('room_type, base_rate')
        .not('room_type', 'is', null)

      if (error) return { data: null, error }

      // Crear lista única de tipos
      const uniqueTypes = {}
      data.forEach((room, index) => {
        if (!uniqueTypes[room.room_type]) {
          uniqueTypes[room.room_type] = {
            id: index + 1,
            name: room.room_type,
            base_rate: room.base_rate || 100,
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
          active: true
        }
      }

      return { data: Object.values(uniqueTypes), error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // =============================================
  // CLEANING MANAGEMENT - SIMPLIFICADAS
  // =============================================

  async getCleaningStaff() {
    // Devolver datos mock ya que eliminamos la tabla
    const mockStaff = [
      { id: 1, name: 'María García', is_active: true, shift: 'morning' },
      { id: 2, name: 'Ana López', is_active: true, shift: 'afternoon' },
      { id: 3, name: 'Pedro Martín', is_active: true, shift: 'morning' },
      { id: 4, name: 'Carmen Ruiz', is_active: true, shift: 'afternoon' }
    ]
    return { data: mockStaff, error: null }
  },

  async getRoomsNeedingCleaning() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .in('cleaning_status', ['dirty', 'in_progress'])
      .order('floor')
      .order('number')
    return { data, error }
  },

  async assignCleaning(roomIds, staffName) {
    const { data, error } = await supabase
      .from('rooms')
      .update({
        cleaning_status: 'in_progress',
        assigned_cleaner: staffName,
        cleaning_start_time: new Date().toISOString()
      })
      .in('id', roomIds)
      .select()

    // También actualizar room_availability
    if (!error) {
      await supabase
        .from('room_availability')
        .update({ cleaning_status: 'in_progress' })
        .in('room_id', roomIds)
    }

    return { data, error }
  },

  // =============================================
  // RESTO DE FUNCIONES ORIGINALES (sin cambios)
  // =============================================

  // Profiles
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  },

  async updateRoomStatus(roomId, status, cleaningStatus = null) {
    const updates = { status }
    if (cleaningStatus) {
      updates.cleaning_status = cleaningStatus
      if (cleaningStatus === 'clean') {
        updates.last_cleaned = new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', roomId)
      .select()
      .single()

    // Actualizar también room_availability
    if (!error) {
      await supabase
        .from('room_availability')
        .update({
          status: status,
          cleaning_status: cleaningStatus,
          is_available: status === 'available'
        })
        .eq('room_id', roomId)
    }

    return { data, error }
  },

  async getRoomsByFloor() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('floor')
      .order('number')
    
    if (error) return { data: null, error }
    
    // Group by floor
    const roomsByFloor = data.reduce((acc, room) => {
      if (!acc[room.floor]) acc[room.floor] = []
      acc[room.floor].push(room)
      return acc
    }, {})
    
    return { data: roomsByFloor, error: null }
  },

  // Guests
  async getGuests(filters = {}) {
    let query = supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,document_number.ilike.%${filters.search}%`)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.vipLevel && filters.vipLevel !== 'all') {
      query = query.eq('vip_level', filters.vipLevel)
    }

    const { data, error } = await query
    return { data, error }
  },

  async createGuest(guestData) {
    const { data, error } = await supabase
      .from('guests')
      .insert(guestData)
      .select()
      .single()
    return { data, error }
  },

  async updateGuest(guestId, updates) {
    const { data, error } = await supabase
      .from('guests')
      .update(updates)
      .eq('id', guestId)
      .select()
      .single()
    return { data, error }
  },

  async getGuestStats() {
    const { data, error } = await supabase
      .rpc('get_guest_stats')
    return { data, error }
  },

  async getGuestReservations(guestId) {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        room:rooms(number, room_type)
      `)
      .eq('guest_id', guestId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Reservations
  async getReservations(filters = {}) {
    let query = supabase
      .from('reservations')
      .select(`
        *,
        guest:guests(*),
        room:rooms(*)
      `)
      .order('created_at', { ascending: false })

    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.checkIn) {
      query = query.gte('check_in', filters.checkIn)
    }
    if (filters.checkOut) {
      query = query.lte('check_out', filters.checkOut)
    }
    if (filters.guestId) {
      query = query.eq('guest_id', filters.guestId)
    }
    if (filters.search) {
      query = query.or(`confirmation_code.ilike.%${filters.search}%`)
    }

    const { data, error } = await query
    return { data, error }
  },

  async getTodaysReservations() {
    const { data, error } = await supabase
      .from('todays_reservations')
      .select('*')
      .order('check_in')
    return { data, error }
  },

  async createReservation(reservationData) {
    // Check availability first
    const { data: isAvailable } = await supabase
      .rpc('check_room_availability', {
        p_room_id: reservationData.room_id,
        p_check_in: reservationData.check_in,
        p_check_out: reservationData.check_out
      })

    if (!isAvailable) {
      return { 
        data: null, 
        error: { 
          message: 'Room not available for selected dates',
          code: 'ROOM_NOT_AVAILABLE'
        } 
      }
    }

    // Generate confirmation code
    const confirmationCode = `HTP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
    
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        ...reservationData,
        confirmation_code: confirmationCode
      })
      .select(`
        *,
        guest:guests(*),
        room:rooms(*)
      `)
      .single()
    return { data, error }
  },

  async updateReservation(reservationId, updates) {
    const { data, error } = await supabase
      .from('reservations')
      .update(updates)
      .eq('id', reservationId)
      .select(`
        *,
        guest:guests(*),
        room:rooms(*)
      `)
      .single()
    return { data, error }
  },

  // Supplies
  async getSupplies(filters = {}) {
    let query = supabase
      .from('supplies')
      .select(`
        *,
        category:supply_categories(*),
        supplier:suppliers(*)
      `)
      .order('name')

    if (filters.category) {
      query = query.eq('category_id', filters.category)
    }
    if (filters.lowStock) {
      query = query.or('current_stock.lte.min_stock,current_stock.eq.0')
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
    }

    const { data, error } = await query
    return { data, error }
  },

  async getSupplyAlerts() {
    const { data, error } = await supabase
      .from('supply_alerts')
      .select('*')
      .order('priority')
    return { data, error }
  },

  async updateSupplyStock(supplyId, newStock) {
    const { data, error } = await supabase
      .from('supplies')
      .update({ current_stock: newStock })
      .eq('id', supplyId)
      .select()
      .single()
    return { data, error }
  },

  async addSupplyConsumption(consumptionData) {
    const { data, error } = await supabase
      .from('supply_consumption')
      .insert(consumptionData)
      .select()
      .single()
    return { data, error }
  },

  async getSupplyConsumption(filters = {}) {
    let query = supabase
      .from('supply_consumption')
      .select(`
        *,
        supply:supplies(name, unit)
      `)
      .order('created_at', { ascending: false })

    if (filters.supplyId) {
      query = query.eq('supply_id', filters.supplyId)
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    const { data, error } = await query
    return { data, error }
  },

  // Dashboard stats
  async getDashboardStats() {
    const { data, error } = await supabase
      .from('dashboard_overview')
      .select('*')
      .single()
    return { data, error }
  },

  async getOccupancyReport(startDate, endDate) {
    const { data, error } = await supabase
      .rpc('get_occupancy_report', {
        p_start_date: startDate,
        p_end_date: endDate
      })
    return { data, error }
  },

  async getRevenueByCategory(startDate, endDate) {
    const { data, error } = await supabase
      .rpc('get_revenue_by_category', {
        p_start_date: startDate,
        p_end_date: endDate
      })
    return { data, error }
  },

  // Helper functions
  async getSupplyCategories() {
    const { data, error } = await supabase
      .from('supply_categories')
      .select('*')
      .order('name')
    return { data, error }
  },

  async getSuppliers() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('active', true)
      .order('name')
    return { data, error }
  },

  // Activity logs
  async getActivityLogs(filters = {}) {
    let query = supabase
      .from('activity_logs')
      .select(`
        *,
        user:profiles(name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (filters.table_name) {
      query = query.eq('table_name', filters.table_name)
    }
    if (filters.action) {
      query = query.eq('action', filters.action)
    }
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id)
    }

    const { data, error } = await query
    return { data, error }
  },

  // Reports and analytics
  async getMonthlyStats() {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const [occupancyReport, revenueData, guestStats] = await Promise.all([
      this.getOccupancyReport(startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0]),
      this.getRevenueByCategory(startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0]),
      this.getGuestStats()
    ])

    return {
      occupancy: occupancyReport.data,
      revenue: revenueData.data,
      guests: guestStats.data,
      error: occupancyReport.error || revenueData.error || guestStats.error
    }
  },

  // Snack selection (for check-in functionality)
  async getSnackItems() {
    const { data, error } = await supabase
      .from('snack_items')
      .select(`
        *,
        category:snack_categories(name, display_order)
      `)
      .eq('is_available', true)
      .order('category.display_order')
      .order('name')

    if (error) {
      // Fallback a datos mock si no existe la tabla
      return {
        data: {
          FRUTAS: [
            { id: 1, name: 'Manzana', price: 2.50 },
            { id: 2, name: 'Plátano', price: 1.50 },
            { id: 3, name: 'Naranja', price: 2.00 }
          ],
          BEBIDAS: [
            { id: 6, name: 'Agua', price: 1.00 },
            { id: 7, name: 'Coca Cola', price: 2.50 },
            { id: 8, name: 'Jugo de naranja', price: 3.00 }
          ],
          SNACKS: [
            { id: 11, name: 'Papas fritas', price: 3.50 },
            { id: 12, name: 'Galletas', price: 2.00 },
            { id: 13, name: 'Nueces', price: 4.50 }
          ],
          POSTRES: [
            { id: 16, name: 'Helado', price: 4.00 },
            { id: 17, name: 'Torta', price: 5.50 },
            { id: 18, name: 'Flan', price: 3.50 }
          ]
        },
        error: null
      }
    }

    // Agrupar por categoría
    const groupedData = {}
    data.forEach(item => {
      const categoryName = item.category?.name || 'OTROS'
      if (!groupedData[categoryName]) {
        groupedData[categoryName] = []
      }
      groupedData[categoryName].push({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price
      })
    })

    return { data: groupedData, error: null }
  },

  // =============================================
  // CHECK-IN MANAGEMENT FUNCTIONS
  // =============================================

  // Get active reservations (checked-in)
  async getActiveReservations() {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        guest:guests(
          id,
          first_name,
          last_name,
          full_name,
          email,
          phone
        ),
        room:rooms(
          id,
          number,
          floor,
          status,
          cleaning_status,
          room_type,
          base_rate
        )
      `)
      .eq('status', 'checked_in')
      .order('check_in', { ascending: false })
    
    return { data, error }
  },

  // Create immediate reservation for check-in
  async createImmediateReservation(reservationData) {
    // First check availability
    const { data: isAvailable } = await supabase
      .rpc('check_room_availability', {
        p_room_id: reservationData.room_id,
        p_check_in: reservationData.check_in,
        p_check_out: reservationData.check_out
      })

    if (!isAvailable) {
      return { 
        data: null, 
        error: { message: 'Room not available for selected dates' } 
      }
    }

    const { data, error } = await supabase
      .from('reservations')
      .insert(reservationData)
      .select(`
        *,
        guest:guests(*),
        room:rooms(*)
      `)
      .single()
    
    return { data, error }
  },

  // =============================================
  // CHECK-IN UTILITY FUNCTIONS
  // =============================================

  // Get or create anonymous guest for quick check-ins
  async getOrCreateGuestForQuickCheckin(roomNumber) {
    // Search for existing temporary guest for this room
    let { data: existingGuest, error } = await supabase
      .from('guests')
      .select('*')
      .eq('email', `temp-${roomNumber}@hotel.local`)
      .single()

    if (error && error.code === 'PGRST116') { // Doesn't exist
      // Create temporary guest
      const { data: newGuest, error: createError } = await supabase
        .from('guests')
        .insert({
          first_name: 'Guest',
          last_name: `Room ${roomNumber}`,
          email: `temp-${roomNumber}@hotel.local`,
          phone: '000000000',
          document_type: 'DNI',
          document_number: `TEMP${roomNumber}`,
          status: 'active',
          vip_level: 'none'
        })
        .select()
        .single()

      if (createError) return { data: null, error: createError }
      return { data: newGuest, error: null }
    }

    if (error) return { data: null, error }
    return { data: existingGuest, error: null }
  },

  // Process complete check-in
  async processCompleteCheckIn(roomId, snacks = [], specialRequests = '') {
    try {
      // 1. Get room information
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (roomError) throw roomError

      // 2. Create or get temporary guest
      const { data: guest, error: guestError } = await this.getOrCreateGuestForQuickCheckin(room.number)
      if (guestError) throw guestError

      // 3. Calculate totals
      const roomPrice = room.base_rate || 100
      const snacksTotal = snacks.reduce((sum, snack) => sum + (snack.price * snack.quantity), 0)
      const totalAmount = roomPrice + snacksTotal

      // 4. Create reservation
      const reservationData = {
        guest_id: guest.id,
        room_id: roomId,
        check_in: new Date().toISOString().split('T')[0],
        check_out: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        adults: 1,
        children: 0,
        status: 'checked_in',
        total_amount: totalAmount,
        rate: roomPrice,
        special_requests: snacks.length > 0 ? 
          `Snacks: ${snacks.map(s => `${s.name} x${s.quantity}`).join(', ')}. ${specialRequests}`.trim() : 
          specialRequests,
        payment_status: 'paid',
        source: 'Reception'
      }

      const { data: reservation, error: reservationError } = await this.createImmediateReservation(reservationData)
      if (reservationError) throw reservationError

      // 5. Update room status
      const { error: updateRoomError } = await this.updateRoomStatus(roomId, 'occupied', 'dirty')
      if (updateRoomError) throw updateRoomError

      return {
        data: {
          reservation,
          guest,
          room,
          snacks,
          totalAmount
        },
        error: null
      }

    } catch (error) {
      return { data: null, error }
    }
  },

  // Process complete check-out
  async processCompleteCheckOut(reservationId, paymentMethod = 'cash') {
    try {
      // 1. Get reservation information
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .select(`
          *,
          room:rooms(*),
          guest:guests(*)
        `)
        .eq('id', reservationId)
        .single()

      if (reservationError) throw reservationError

      // 2. Update reservation to checked_out
      const { error: updateReservationError } = await this.updateReservation(reservationId, {
        status: 'checked_out',
        payment_status: 'paid'
      })
      if (updateReservationError) throw updateReservationError

      // 3. Update room to cleaning status
      const { error: updateRoomError } = await this.updateRoomStatus(
        reservation.room_id, 
        'cleaning', 
        'dirty'
      )
      if (updateRoomError) throw updateRoomError

      // 4. Update guest totals
      await supabase.rpc('update_guest_totals', { p_guest_id: reservation.guest_id })

      return { 
        data: { 
          reservation, 
          paymentMethod,
          checkoutDate: new Date().toISOString()
        }, 
        error: null 
      }

    } catch (error) {
      return { data: null, error }
    }
  },

  // =============================================
  // REAL-TIME STATISTICS FUNCTIONS
  // =============================================

  // Get current occupancy statistics
  async getCurrentOccupancyStats() {
    const { data, error } = await supabase
      .rpc('calculate_occupancy')
      .single()
    
    if (error) return { data: null, error }
    
    return { 
      data: {
        occupied_rooms: data.occupied_rooms || 0,
        total_rooms: data.total_rooms || 0,
        occupancy_percentage: data.occupancy_percentage || 0
      }, 
      error: null 
    }
  },

  // Get today's check-in/check-out summary
  async getTodayCheckInOutSummary() {
    const today = new Date().toISOString().split('T')[0]
    
    const [checkInsResult, checkOutsResult] = await Promise.all([
      supabase
        .from('reservations')
        .select('count')
        .eq('check_in', today)
        .eq('status', 'checked_in'),
      supabase
        .from('reservations')
        .select('count')
        .eq('check_out', today)
        .eq('status', 'checked_out')
    ])

    return {
      data: {
        checkInsToday: checkInsResult.data?.[0]?.count || 0,
        checkOutsToday: checkOutsResult.data?.[0]?.count || 0
      },
      error: checkInsResult.error || checkOutsResult.error
    }
  },

  // =============================================
  // VALIDATION FUNCTIONS
  // =============================================

  // Validate room for check-in
  async validateRoomForCheckIn(roomId) {
    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (error) return { isValid: false, error: error.message }

    // Validations
    if (room.status !== 'available') {
      return { isValid: false, error: 'Room is not available' }
    }

    if (room.cleaning_status !== 'clean') {
      return { isValid: false, error: 'Room is not clean' }
    }

    // Check for active reservations
    const { data: activeReservations } = await supabase
      .from('reservations')
      .select('id')
      .eq('room_id', roomId)
      .in('status', ['confirmed', 'checked_in'])

    if (activeReservations && activeReservations.length > 0) {
      return { isValid: false, error: 'Room has active reservations' }
    }

    return { isValid: true, room }
  },

  // Validate room for check-out
  async validateRoomForCheckOut(roomNumber) {
    const { data: room, error } = await supabase
      .from('rooms')
      .select(`
        *,
        reservations!inner(
          *,
          guest:guests(*)
        )
      `)
      .eq('number', roomNumber)
      .eq('status', 'occupied')
      .eq('reservations.status', 'checked_in')
      .single()

    if (error) return { isValid: false, error: 'No check-in information found for this room' }

    return { isValid: true, room, reservation: room.reservations[0] }
  }
}

// Real-time subscriptions helpers
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

  supplies: (callback) => {
    return supabase
      .channel('supplies_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'supplies' }, 
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

// Auth helpers
export const auth = {
  async signUp(email, password, userData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },

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