// src/lib/supabase.js - SIN ROOM_TYPES NI DESCRIPTIONS
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
// FUNCIÓN getRoomsByFloor EXPORTADA
// ====================================
export const getRoomsByFloor = async (branchId = null) => {
  try {
    console.log('Loading rooms by floor...')
    
    // Obtener habitaciones con información de reservas usando db.getRooms
    const { data: enrichedRooms, error } = await db.getRooms({ branchId })
    
    if (error) {
      console.error('Error loading rooms:', error)
      throw error
    }

    // Agrupar habitaciones por piso
    const roomsByFloor = enrichedRooms.reduce((acc, room) => {
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
        // Información de reservas
        currentGuest: room.currentGuest,
        nextReservation: room.nextReservation,
        activeReservation: room.activeReservation
      })
      return acc
    }, {})

    console.log(`Loaded rooms by floor:`, roomsByFloor)
    return roomsByFloor

  } catch (error) {
    console.error('Error in getRoomsByFloor:', error)
    throw error
  }
}

// Database helpers - SIN ROOM_TYPES
export const db = {

  // 1. FUNCIÓN PRINCIPAL: Limpiar habitación con un click
async cleanRoomWithClick(roomId) {
  try {
    console.log(`🧹 Cleaning room with ID: ${roomId}`);
    
    const updateData = {
      status: 'available',
      cleaning_status: 'clean',
      last_cleaned: new Date().toISOString(),
      cleaned_by: 'Reception Staff',
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('rooms')
      .update(updateData)
      .eq('id', roomId)
      .select()
      .single();
    
    if (error) {
      console.error('Error cleaning room:', error);
      throw error;
    }
    
    console.log('✅ Room cleaned successfully:', data);
    return { data, error: null };
    
  } catch (error) {
    console.error('Error in cleanRoomWithClick:', error);
    return { data: null, error };
  }
},

// 2. FUNCIÓN: Limpiar múltiples habitaciones
async cleanMultipleRooms(roomIds) {
  try {
    console.log(`🧹 Cleaning multiple rooms:`, roomIds);
    
    const updateData = {
      status: 'available',
      cleaning_status: 'clean', 
      last_cleaned: new Date().toISOString(),
      cleaned_by: 'Reception Staff',
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('rooms')
      .update(updateData)
      .in('id', roomIds)
      .select();
    
    if (error) throw error;
    
    return { data, error: null };
    
  } catch (error) {
    console.error('Error in cleanMultipleRooms:', error);
    return { data: null, error };
  }
},

// 3. FUNCIÓN: Obtener habitaciones que necesitan limpieza
async getRoomsNeedingCleaning(branchId = null) {
  try {
    let query = supabase
      .from('rooms')
      .select('*')
      .or('cleaning_status.eq.dirty,status.eq.cleaning')
      .order('floor')
      .order('number');
    
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { data: data || [], error: null };
    
  } catch (error) {
    console.error('Error getting rooms needing cleaning:', error);
    return { data: [], error };
  }
},

// 4. FUNCIÓN: Determinar estado simplificado de habitación
getRoomSimplifiedStatus(room) {
  // Si está ocupada, siempre mostrar ocupada
  if (room.status === 'occupied') {
    return 'occupied';
  }
  
  // Si necesita limpieza (por cualquier motivo)
  if (room.cleaning_status === 'dirty' || 
      room.status === 'cleaning' || 
      room.status === 'maintenance') {
    return 'needs_cleaning';
  }
  
  // En cualquier otro caso, está disponible
  return 'available';
},

// 5. FUNCIÓN: Obtener estadísticas simplificadas
async getRoomStats(branchId = null) {
  try {
    let query = supabase
      .from('rooms')
      .select('*');
    
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }
    
    const { data: rooms, error } = await query;
    
    if (error) throw error;
    
    const stats = {
      total: rooms.length,
      available: 0,
      occupied: 0,
      needsCleaning: 0,
      occupancyRate: 0
    };
    
    rooms.forEach(room => {
      const status = this.getRoomSimplifiedStatus(room);
      switch (status) {
        case 'available':
          stats.available++;
          break;
        case 'occupied':
          stats.occupied++;
          break;
        case 'needs_cleaning':
          stats.needsCleaning++;
          break;
      }
    });
    
    stats.occupancyRate = stats.total > 0 
      ? Math.round((stats.occupied / stats.total) * 100) 
      : 0;
    
    return { data: stats, error: null };
    
  } catch (error) {
    console.error('Error getting room stats:', error);
    return { data: null, error };
  }
},

// 6. FUNCIÓN MEJORADA: getRooms con estados simplificados
async getRoomsWithSimplifiedStatus(filters = {}) {
  try {
    console.log('Loading rooms with simplified status...');
    
    // Obtener habitaciones básicas
    let roomQuery = supabase
      .from('rooms')
      .select('*')
      .order('floor')
      .order('number');

    // Aplicar filtros
    if (filters.branchId) {
      roomQuery = roomQuery.eq('branch_id', filters.branchId);
    }
    if (filters.floor && filters.floor !== 'all') {
      roomQuery = roomQuery.eq('floor', filters.floor);
    }
    if (filters.search) {
      roomQuery = roomQuery.or(`number.ilike.%${filters.search}%`);
    }

    const { data: rooms, error: roomsError } = await roomQuery;

    if (roomsError) {
      throw roomsError;
    }

    // Obtener reservas activas para enriquecer datos
    const { data: reservations } = await supabase
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
        )
      `)
      .in('status', ['checked_in', 'confirmed']);

    // Enriquecer habitaciones con información de reservas y estado simplificado
    const enrichedRooms = rooms.map(room => {
      // Buscar reserva activa
      const activeReservation = reservations?.find(
        res => res.room_id === room.id && res.status === 'checked_in'
      );
      
      // Determinar estado simplificado
      const simplifiedStatus = this.getRoomSimplifiedStatus(room);
      
      return {
        ...room,
        // Estado simplificado como propiedad principal
        displayStatus: simplifiedStatus,
        
        // Información del huésped actual
        currentGuest: activeReservation ? {
          id: activeReservation.guest?.id,
          name: activeReservation.guest?.full_name || 
                `${activeReservation.guest?.first_name || ''} ${activeReservation.guest?.last_name || ''}`.trim(),
          email: activeReservation.guest?.email,
          phone: activeReservation.guest?.phone,
          checkIn: activeReservation.check_in,
          checkOut: activeReservation.check_out,
          confirmationCode: activeReservation.confirmation_code
        } : null,
        
        // Reserva activa completa
        activeReservation: activeReservation || null,
        
        // Estados originales para compatibilidad
        original_status: room.status,
        original_cleaning_status: room.cleaning_status
      };
    });

    // Filtrar por estado simplificado si se solicita
    const filteredRooms = filters.displayStatus && filters.displayStatus !== 'all'
      ? enrichedRooms.filter(room => room.displayStatus === filters.displayStatus)
      : enrichedRooms;

    console.log(`✅ Loaded ${filteredRooms.length} rooms with simplified status`);
    return { data: filteredRooms, error: null };

  } catch (error) {
    console.error('Error in getRoomsWithSimplifiedStatus:', error);
    return { data: null, error };
  }
},

// 7. FUNCIÓN: Marcar habitación como sucia después del check-out
async markRoomAsDirtyAfterCheckout(roomId) {
  try {
    console.log(`🧽 Marking room ${roomId} as dirty after checkout`);
    
    const { data, error } = await supabase
      .from('rooms')
      .update({
        status: 'available',  // Disponible pero...
        cleaning_status: 'dirty',  // Necesita limpieza
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
    
  } catch (error) {
    console.error('Error marking room as dirty:', error);
    return { data: null, error };
  }
},
  
  // =============================================
  // ROOMS MANAGEMENT - SIN ROOM_TYPES
  // =============================================

  async getRooms(filters = {}) {
    try {
      console.log('Loading rooms...')
      
      // Obtener habitaciones sin room_type ni description
      let roomQuery = supabase
        .from('rooms')
        .select('*')
        .order('floor')
        .order('number')

      // Aplicar filtros a habitaciones
      if (filters.branchId) {
        roomQuery = roomQuery.eq('branch_id', filters.branchId)
      }
      if (filters.status && filters.status !== 'all') {
        roomQuery = roomQuery.eq('status', filters.status)
      }
      if (filters.floor && filters.floor !== 'all') {
        roomQuery = roomQuery.eq('floor', filters.floor)
      }
      if (filters.cleaningStatus && filters.cleaningStatus !== 'all') {
        roomQuery = roomQuery.eq('cleaning_status', filters.cleaningStatus)
      }
      if (filters.search) {
        roomQuery = roomQuery.or(`number.ilike.%${filters.search}%`)
      }

      const { data: rooms, error: roomsError } = await roomQuery

      if (roomsError) {
        console.error('Error loading rooms:', roomsError)
        throw roomsError
      }

      // Obtener reservas activas y próximas
      let reservations = []
      try {
        const { data: reservationsData, error: reservationsError } = await supabase
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
        } else {
          reservations = reservationsData || []
        }
      } catch (err) {
        console.warn('Table reservations might not exist:', err)
        reservations = []
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

      console.log(`Loaded ${enrichedRooms.length} rooms`)
      return { data: enrichedRooms, error: null }

    } catch (error) {
      console.error('Error in getRooms:', error)
      return { data: null, error }
    }
  },

  // MÉTODO getRoomsByFloor en el objeto db
  async getRoomsByFloor(branchId = null) {
    try {
      // Usar la función RPC si existe
      const { data, error } = await supabase.rpc('get_rooms_by_floor', {
        branch_id_param: branchId
      })
      
      if (error) {
        console.warn('RPC function failed, using fallback:', error)
        // Fallback: usar función exportada
        return await getRoomsByFloor(branchId)
      }
      
      return data || {}
    } catch (error) {
      console.warn('Using fallback getRoomsByFloor')
      return await getRoomsByFloor(branchId)
    }
  },

  // =============================================
  // SNACKS MANAGEMENT
  // =============================================

  async getSnackItems() {
    try {
      console.log('Loading snack items...')
      
      // Intentar usar la función RPC
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

  // Función de respaldo con datos mock
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
  // ROOM OPERATIONS - SIN ROOM_TYPES
  // =============================================

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

      // Preparar datos para inserción SIN room_type y description
      const insertData = {
        number: roomData.number.toString(),
        floor: parseInt(roomData.floor),
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

  async updateRoom(roomId, updates) {
    try {
      // Filtrar campos que ya no existen
      //const { room_type, description, ...validUpdates } = updates
      
      const { data, error } = await supabase
        .from('rooms')
        .update({
          ...validUpdates,
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

  // =============================================
  // GUEST MANAGEMENT  
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
  // RESERVATION MANAGEMENT
  // =============================================

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

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error in getReservations:', error)
      return { data: [], error }
    }
  },

  async createReservation(reservationData) {
    try {
      // Generar código de confirmación si no se proporciona
      const confirmationCode = reservationData.confirmation_code || 
        `HTP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

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

  // =============================================
  // CLEANING MANAGEMENT
  // =============================================

  async getCleaningStaff() {
    // Datos mock
    const mockStaff = [
      { id: 1, name: 'María García', is_active: true, shift: 'morning' },
      { id: 2, name: 'Ana López', is_active: true, shift: 'afternoon' },
      { id: 3, name: 'Pedro Martín', is_active: true, shift: 'morning' },
      { id: 4, name: 'Carmen Ruiz', is_active: true, shift: 'afternoon' }
    ]
    return { data: mockStaff, error: null }
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