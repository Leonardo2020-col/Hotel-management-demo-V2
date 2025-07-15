// src/lib/supabase.js
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

  // Rooms
  async getRooms(filters = {}) {
    let query = supabase
      .from('room_availability')
      .select('*')
      .order('number')

    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.floor) {
      query = query.eq('floor', filters.floor)
    }
    if (filters.roomType) {
      query = query.eq('room_type_id', filters.roomType)
    }

    const { data, error } = await query
    return { data, error }
  },

  async getAvailableRooms(checkIn, checkOut, roomTypeId = null) {
    const { data, error } = await supabase
      .rpc('get_available_rooms', {
        p_check_in: checkIn,
        p_check_out: checkOut,
        p_room_type_id: roomTypeId
      })
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
    return { data, error }
  },

  async getRoomsByFloor() {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        room_type:room_types(name, base_rate)
      `)
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

  async assignCleaning(roomIds, staffName) {
    const { data, error } = await supabase
      .from('rooms')
      .update({
        cleaning_status: 'in_progress',
        cleaned_by: staffName,
        last_cleaned: new Date().toISOString()
      })
      .in('id', roomIds)
      .select()
    return { data, error }
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
        room:rooms(number, room_type:room_types(name))
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
        room:rooms(
          *,
          room_type:room_types(*)
        )
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
        room:rooms(
          *,
          room_type:room_types(*)
        )
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
        room:rooms(
          *,
          room_type:room_types(*)
        )
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

  async getRoomTypes() {
    const { data, error } = await supabase
      .from('room_types')
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
    // This function could get data from a products/snacks table
    // For now we return structured mock data
    return {
      data: {
        frutas: [
          { id: 1, name: 'Manzana', price: 2.50 },
          { id: 2, name: 'Plátano', price: 1.50 },
          { id: 3, name: 'Naranja', price: 2.00 },
          { id: 4, name: 'Uvas', price: 4.00 },
          { id: 5, name: 'Ensalada de frutas', price: 6.00 }
        ],
        bebidas: [
          { id: 6, name: 'Agua', price: 1.00 },
          { id: 7, name: 'Coca Cola', price: 2.50 },
          { id: 8, name: 'Jugo de naranja', price: 3.00 },
          { id: 9, name: 'Café', price: 2.00 },
          { id: 10, name: 'Té', price: 1.50 }
        ],
        snacks: [
          { id: 11, name: 'Papas fritas', price: 3.50 },
          { id: 12, name: 'Galletas', price: 2.00 },
          { id: 13, name: 'Nueces', price: 4.50 },
          { id: 14, name: 'Chocolate', price: 3.00 },
          { id: 15, name: 'Chips', price: 2.50 }
        ],
        postres: [
          { id: 16, name: 'Helado', price: 4.00 },
          { id: 17, name: 'Torta', price: 5.50 },
          { id: 18, name: 'Flan', price: 3.50 },
          { id: 19, name: 'Brownie', price: 4.50 },
          { id: 20, name: 'Gelatina', price: 2.50 }
        ]
      },
      error: null
    }
  },

  // =============================================
  // ROOMS MANAGEMENT FUNCTIONS
  // =============================================

  // Create room function
  async createRoom(roomData) {
    const { data, error } = await supabase
      .from('rooms')
      .insert(roomData)
      .select(`
        *,
        room_type:room_types(*)
      `)
      .single()
    return { data, error }
  },

  // Update room function
  async updateRoom(roomId, updates) {
    const { data, error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', roomId)
      .select(`
        *,
        room_type:room_types(*)
      `)
      .single()
    return { data, error }
  },

  // Delete room function
  async deleteRoom(roomId) {
    const { data, error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId)
      .select()
      .single()
    return { data, error }
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
          room_type:room_types(name, base_rate)
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
        room:rooms(
          *,
          room_type:room_types(*)
        )
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
        .select(`
          *,
          room_type:room_types(base_rate, name)
        `)
        .eq('id', roomId)
        .single()

      if (roomError) throw roomError

      // 2. Create or get temporary guest
      const { data: guest, error: guestError } = await this.getOrCreateGuestForQuickCheckin(room.number)
      if (guestError) throw guestError

      // 3. Calculate totals
      const roomPrice = room.room_type.base_rate
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
      .select(`
        *,
        room_type:room_types(*)
      `)
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