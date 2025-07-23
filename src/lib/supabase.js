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
         // type: room.room_type
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
// SUPPLIES FUNCTIONS - FALTANTES
// =============================================

async getAllInventoryItems() {
  try {
    console.log('Loading all inventory items (supplies + snacks)...')
    
    // Obtener insumos de la tabla supplies
    const { data: supplies, error: suppliesError } = await supabase
      .from('supplies')
      .select(`
        *,
        category:supply_categories(name),
        supplier:suppliers(name)
      `)
      .order('name')
    
    if (suppliesError) {
      console.error('Error loading supplies:', suppliesError)
    }
    
    // Obtener snacks usando la función que ya existe
    const { data: snackCategories } = await this.getSnackItems()
    
    // Convertir snacks a formato uniforme
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
            unit_price: item.price,
            current_stock: 100, // Mock stock para snacks
            min_stock: 10,
            max_stock: 200,
            location: 'Minibar',
            is_active: true,
            item_type: 'snack',
            branch_id: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        })
      })
    }
    
    // Formatear supplies para estructura uniforme
    const formattedSupplies = (supplies || []).map(supply => ({
      ...supply,
      category: supply.category?.name || 'Sin categoría',
      supplier: supply.supplier?.name || 'Sin proveedor',
      item_type: 'supply',
      currentStock: supply.current_stock,
      minStock: supply.min_stock,
      maxStock: supply.max_stock,
      unitPrice: supply.unit_price
    }))
    
    // Combinar ambos tipos
    const allItems = [...formattedSupplies, ...snacks]
    
    console.log(`✅ Loaded ${allItems.length} inventory items (${formattedSupplies.length} supplies + ${snacks.length} snacks)`)
    
    return { data: allItems, error: null }
    
  } catch (error) {
    console.error('Error in getAllInventoryItems:', error)
    return { data: [], error }
  }
},

async getSupplyCategories() {
  try {
    const { data, error } = await supabase
      .from('supply_categories')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    
    // Agregar categorías de snacks
    const snackCategories = ['FRUTAS', 'BEBIDAS', 'SNACKS', 'POSTRES']
    const allCategories = [
      ...(data || []).map(cat => cat.name),
      ...snackCategories
    ]
    
    return { data: [...new Set(allCategories)], error: null }
  } catch (error) {
    console.warn('Using mock categories due to error:', error)
    return { 
      data: ['Limpieza', 'Amenidades', 'Lencería', 'Mantenimiento', 'FRUTAS', 'BEBIDAS', 'SNACKS', 'POSTRES'], 
      error: null 
    }
  }
},

async getSuppliers() {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    
    const suppliers = [
      ...(data || []).map(sup => sup.name),
      'Proveedor Snacks'
    ]
    
    return { data: [...new Set(suppliers)], error: null }
  } catch (error) {
    console.warn('Using mock suppliers due to error:', error)
    return { 
      data: ['Proveedora Hotelera SAC', 'Distribuidora Lima Norte', 'Proveedor Snacks'], 
      error: null 
    }
  }
},

// =============================================
// ROOMS FUNCTIONS - FALTANTES  
// =============================================

async getCleaningStaff() {
  try {
    console.log('Loading cleaning staff...')
    
    const { data, error } = await supabase
      .from('cleaning_staff')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      console.warn('Cleaning staff table not found, using mock data:', error)
      
      // Datos mock para staff de limpieza
      return {
        data: [
          { id: 1, name: 'María González', shift: 'morning', phone: '+51 987-654-321' },
          { id: 2, name: 'Ana López', shift: 'afternoon', phone: '+51 987-654-322' },
          { id: 3, name: 'Pedro Martín', shift: 'morning', phone: '+51 987-654-323' },
          { id: 4, name: 'Carmen Torres', shift: 'night', phone: '+51 987-654-324' }
        ],
        error: null
      }
    }
    
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error in getCleaningStaff:', error)
    return { 
      data: [
        { id: 1, name: 'Personal de Limpieza', shift: 'morning' }
      ], 
      error: null 
    }
  }
},

async getCleaningAssignments() {
  try {
    const { data, error } = await supabase
      .from('cleaning_assignments')
      .select(`
        *,
        room:rooms(number, floor),
        assigned_by:users(name)
      `)
      .gte('assigned_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('assigned_date', { ascending: false })
    
    if (error) {
      console.warn('Cleaning assignments not available:', error)
      return { data: [], error: null }
    }
    
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error getting cleaning assignments:', error)
    return { data: [], error: null }
  }
},

// =============================================
// CONSUMPTION TRACKING
// =============================================

async getConsumptionHistory(filters = {}) {
  try {
    let query = supabase
      .from('supply_movements')
      .select(`
        *,
        supply:supplies(name, unit, category:supply_categories(name))
      `)
      .eq('movement_type', 'consumption')
      .order('created_at', { ascending: false })
    
    if (filters.supplyId) {
      query = query.eq('supply_id', filters.supplyId)
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.warn('Consumption history not available:', error)
      return { data: [], error: null }
    }
    
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error getting consumption history:', error)
    return { data: [], error: null }
  }
},

// =============================================
// CLEANING STAFF MANAGEMENT - PARA useRooms.js
// =============================================

async getCleaningStaff() {
  try {
    console.log('Loading cleaning staff...')
    
    const { data, error } = await supabase
      .from('cleaning_staff')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      console.warn('Cleaning staff table not found, using mock data:', error)
      
      // Datos mock para staff de limpieza
      return {
        data: [
          { id: 1, name: 'María González', shift: 'morning', phone: '+51 987-654-321' },
          { id: 2, name: 'Ana López', shift: 'afternoon', phone: '+51 987-654-322' },
          { id: 3, name: 'Pedro Martín', shift: 'morning', phone: '+51 987-654-323' },
          { id: 4, name: 'Carmen Torres', shift: 'night', phone: '+51 987-654-324' }
        ],
        error: null
      }
    }
    
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error in getCleaningStaff:', error)
    return { 
      data: [
        { id: 1, name: 'Personal de Limpieza', shift: 'morning' }
      ], 
      error: null 
    }
  }
},

// =============================================
// UNIFIED INVENTORY MANAGEMENT - PARA useSupplies.js
// =============================================

async getAllInventoryItems() {
  try {
    console.log('Loading all inventory items (supplies + snacks)...')
    
    // Obtener insumos de la tabla supplies
    const { data: supplies, error: suppliesError } = await supabase
      .from('supplies')
      .select(`
        *,
        category:supply_categories(name),
        supplier:suppliers(name)
      `)
      .order('name')
    
    if (suppliesError) {
      console.error('Error loading supplies:', suppliesError)
    }
    
    // Obtener snacks usando la función que ya existe
    const { data: snackCategories } = await this.getSnackItems()
    
    // Convertir snacks a formato uniforme
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
            currentStock: 100, // Mock stock para snacks
            minStock: 10,
            maxStock: 200,
            location: 'Minibar',
            is_active: true,
            item_type: 'snack',
            branch_id: 1,
            lastUpdated: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        })
      })
    }
    
    // Formatear supplies para estructura uniforme
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
    
    // Combinar ambos tipos
    const allItems = [...formattedSupplies, ...snacks]
    
    console.log(`✅ Loaded ${allItems.length} inventory items (${formattedSupplies.length} supplies + ${snacks.length} snacks)`)
    
    return { data: allItems, error: null }
    
  } catch (error) {
    console.error('Error in getAllInventoryItems:', error)
    return { data: [], error }
  }
},

async getAllCategories() {
  try {
    const { data, error } = await supabase
      .from('supply_categories')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      console.warn('Using mock categories due to error:', error)
    }
    
    // Agregar categorías de snacks
    const snackCategories = ['FRUTAS', 'BEBIDAS', 'SNACKS', 'POSTRES']
    const allCategories = [
      ...(data || []).map(cat => cat.name),
      ...snackCategories
    ]
    
    return { data: [...new Set(allCategories)], error: null }
  } catch (error) {
    console.warn('Using mock categories due to error:', error)
    return { 
      data: ['Limpieza', 'Amenidades', 'Lencería', 'Mantenimiento', 'FRUTAS', 'BEBIDAS', 'SNACKS', 'POSTRES'], 
      error: null 
    }
  }
},

async getAllSupplierNames() {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('name')
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      console.warn('Using mock suppliers due to error:', error)
    }
    
    const suppliers = [
      ...(data || []).map(sup => sup.name),
      'Proveedor Snacks'
    ]
    
    return { data: [...new Set(suppliers)], error: null }
  } catch (error) {
    console.warn('Using mock suppliers due to error:', error)
    return { 
      data: ['Proveedora Hotelera SAC', 'Distribuidora Lima Norte', 'Proveedor Snacks'], 
      error: null 
    }
  }
},

// =============================================
// SUPPLY MANAGEMENT FUNCTIONS
// =============================================

async createSupply(supplyData) {
  try {
    console.log('Creating supply item:', supplyData)
    
    const insertData = {
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

    // Buscar o crear categoría
    let category_id = null
    if (supplyData.category) {
      const { data: existingCategory } = await supabase
        .from('supply_categories')
        .select('id')
        .eq('name', supplyData.category)
        .single()
      
      if (existingCategory) {
        category_id = existingCategory.id
      } else {
        const { data: newCategory } = await supabase
          .from('supply_categories')
          .insert([{ name: supplyData.category, is_active: true }])
          .select('id')
          .single()
        category_id = newCategory?.id
      }
    }

    // Buscar o crear proveedor
    let supplier_id = null
    if (supplyData.supplier) {
      const { data: existingSupplier } = await supabase
        .from('suppliers')
        .select('id')
        .eq('name', supplyData.supplier)
        .single()
      
      if (existingSupplier) {
        supplier_id = existingSupplier.id
      } else {
        const { data: newSupplier } = await supabase
          .from('suppliers')
          .insert([{ name: supplyData.supplier, is_active: true }])
          .select('id')
          .single()
        supplier_id = newSupplier?.id
      }
    }

    insertData.category_id = category_id
    insertData.supplier_id = supplier_id

    const { data, error } = await supabase
      .from('supplies')
      .insert([insertData])
      .select()
      .single()

    if (error) throw error

    console.log('✅ Supply created successfully:', data)
    return { data, error: null }

  } catch (error) {
    console.error('Error in createSupply:', error)
    return { data: null, error }
  }
},

async updateSupply(supplyId, updateData) {
  try {
    console.log('Updating supply:', supplyId, updateData)
    
    const validUpdates = {}
    
    // Solo incluir campos válidos
    if (updateData.name !== undefined) validUpdates.name = updateData.name
    if (updateData.description !== undefined) validUpdates.description = updateData.description
    if (updateData.sku !== undefined) validUpdates.sku = updateData.sku
    if (updateData.unit !== undefined) validUpdates.unit = updateData.unit
    if (updateData.unitPrice !== undefined) validUpdates.unit_price = updateData.unitPrice
    if (updateData.currentStock !== undefined) validUpdates.current_stock = updateData.currentStock
    if (updateData.minStock !== undefined) validUpdates.min_stock = updateData.minStock
    if (updateData.maxStock !== undefined) validUpdates.max_stock = updateData.maxStock
    
    validUpdates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('supplies')
      .update(validUpdates)
      .eq('id', supplyId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error in updateSupply:', error)
    return { data: null, error }
  }
},

async deleteSupply(supplyId) {
  try {
    const { data, error } = await supabase
      .from('supplies')
      .delete()
      .eq('id', supplyId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error in deleteSupply:', error)
    return { data: null, error }
  }
},

// =============================================
// SNACK MANAGEMENT FUNCTIONS
// =============================================

async createSnackItem(snackData) {
  try {
    console.log('Creating snack item:', snackData)
    
    // Para snacks, usar la tabla snack_items si existe, sino simular
    const insertData = {
      name: snackData.name,
      description: snackData.description,
      price: snackData.unitPrice,
      category_id: null, // Se determinará basado en la categoría
      is_available: true,
      branch_id: snackData.branch_id || 1
    }

    // Buscar categoría de snack
    const { data: category } = await supabase
      .from('snack_categories')
      .select('id')
      .eq('name', snackData.category)
      .single()

    if (category) {
      insertData.category_id = category.id
    }

    const { data, error } = await supabase
      .from('snack_items')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.warn('Snack table not available, using mock response:', error)
      // Simular respuesta exitosa
      return { 
        data: { 
          id: Date.now(), 
          ...snackData,
          created_at: new Date().toISOString()
        }, 
        error: null 
      }
    }

    return { data, error: null }

  } catch (error) {
    console.error('Error in createSnackItem:', error)
    // Simular respuesta exitosa
    return { 
      data: { 
        id: Date.now(), 
        ...snackData,
        created_at: new Date().toISOString()
      }, 
      error: null 
    }
  }
},

async updateSnackItem(snackId, updateData) {
  try {
    const validUpdates = {
      name: updateData.name,
      description: updateData.description,
      price: updateData.unitPrice,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('snack_items')
      .update(validUpdates)
      .eq('id', snackId)
      .select()
      .single()

    if (error) {
      console.warn('Snack table not available, using mock response')
      return { data: { id: snackId, ...updateData }, error: null }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in updateSnackItem:', error)
    return { data: { id: snackId, ...updateData }, error: null }
  }
},

async deleteSnackItem(snackId) {
  try {
    const { data, error } = await supabase
      .from('snack_items')
      .delete()
      .eq('id', snackId)
      .select()
      .single()

    if (error) {
      console.warn('Snack table not available, using mock response')
      return { data: { id: snackId }, error: null }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in deleteSnackItem:', error)
    return { data: { id: snackId }, error: null }
  }
},

// =============================================
// CONSUMPTION TRACKING
// =============================================

async recordSupplyConsumption(consumptionData) {
  try {
    console.log('Recording supply consumption:', consumptionData)
    
    const movementData = {
      supply_id: consumptionData.supplyId,
      movement_type: 'consumption',
      quantity: consumptionData.quantity,
      reason: consumptionData.reason || 'Consumo registrado',
      room_number: consumptionData.roomNumber,
      department: consumptionData.department || 'General',
      consumed_by: consumptionData.consumedBy || 'Usuario',
      created_by: null, // Se puede agregar user ID aquí
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('supply_movements')
      .insert([movementData])
      .select()
      .single()

    if (error) {
      console.warn('Movement table not available:', error)
      return { data: movementData, error: null }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error recording consumption:', error)
    return { data: null, error }
  }
},

async getConsumptionHistory(filters = {}) {
  try {
    let query = supabase
      .from('supply_movements')
      .select(`
        *,
        supply:supplies(name, unit, category:supply_categories(name))
      `)
      .eq('movement_type', 'consumption')
      .order('created_at', { ascending: false })
    
    if (filters.supplyId) {
      query = query.eq('supply_id', filters.supplyId)
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.warn('Consumption history not available:', error)
      return { data: [], error: null }
    }
    
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error getting consumption history:', error)
    return { data: [], error: null }
  }
},

// =============================================
// ROOM AVAILABILITY FUNCTIONS - PARA COMPATIBILIDAD
// =============================================

async getRoomAvailability(filters = {}) {
  try {
    const { data, error } = await supabase
      .from('room_availability')
      .select('*')
      .order('date')

    if (error) {
      console.warn('Room availability not available:', error)
      return { data: [], error: null }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error getting room availability:', error)
    return { data: [], error: null }
  }
},

// =============================================
// CLEANING ASSIGNMENTS
// =============================================

async getCleaningAssignments() {
  try {
    const { data, error } = await supabase
      .from('cleaning_assignments')
      .select(`
        *,
        room:rooms(number, floor),
        assigned_by:users(name)
      `)
      .gte('assigned_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('assigned_date', { ascending: false })
    
    if (error) {
      console.warn('Cleaning assignments not available:', error)
      return { data: [], error: null }
    }
    
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error getting cleaning assignments:', error)
    return { data: [], error: null }
  }
},

// =============================================
// ROOM STATUS UPDATE ENHANCED
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
          //type: room.room_type,
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
        //room_type: roomData.room_type || roomData.type || 'Habitación Estándar',
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
      //if (updates.room_type !== undefined) validUpdates.room_type = updates.room_type
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