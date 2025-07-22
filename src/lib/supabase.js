// src/lib/supabase.js - COMPLETAMENTE SIN ROOM_TYPES Y ERROR CORREGIDO
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

  // =============================================
  // SNACKS MANAGEMENT - ENHANCED
  // =============================================

  async getSnackCategories() {
    try {
      const { data, error } = await supabase
        .from('snack_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error getting snack categories:', error);
      return { data: [], error };
    }
  },

  async createSnackCategory(categoryData) {
    try {
      const { data, error } = await supabase
        .from('snack_categories')
        .insert([{
          name: categoryData.name,
          description: categoryData.description,
          display_order: categoryData.display_order || 0,
          is_active: true
        }])
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating snack category:', error);
      return { data: null, error };
    }
  },

  async getAllSnackItems() {
    try {
      const { data, error } = await supabase
        .from('snack_items')
        .select(`
          *,
          category:snack_categories(
            id,
            name,
            description
          )
        `)
        .eq('is_available', true)
        .order('name');
      
      if (error) throw error;
      
      // Transform to match supplies format
      const formattedItems = data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        sku: `SNACK-${item.id}`,
        category: item.category?.name || 'Sin categoría',
        supplier: 'Proveedor de Snacks',
        unit: 'unidad',
        unitPrice: parseFloat(item.price || 0),
        currentStock: 100, // Mock stock - you can add this field to snack_items table
        minStock: 10,
        maxStock: 500,
        location: 'Área de Snacks',
        notes: '',
        is_active: item.is_available,
        branch_id: item.branch_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        lastUpdated: item.updated_at,
        // Additional fields to identify as snack
        item_type: 'snack',
        original_table: 'snack_items'
      }));
      
      return { data: formattedItems, error: null };
    } catch (error) {
      console.error('Error getting snack items:', error);
      return { data: [], error };
    }
  },

  async createSnackItem(itemData) {
    try {
      // First get or create category
      let categoryId = null;
      
      if (itemData.category && itemData.category !== 'Sin categoría') {
        const { data: categories } = await this.getSnackCategories();
        const existingCategory = categories.find(cat => cat.name === itemData.category);
        
        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          const { data: newCategory } = await this.createSnackCategory({
            name: itemData.category,
            description: `Categoría: ${itemData.category}`
          });
          categoryId = newCategory?.id;
        }
      }

      const { data, error } = await supabase
        .from('snack_items')
        .insert([{
          category_id: categoryId,
          name: itemData.name,
          description: itemData.description,
          price: parseFloat(itemData.unitPrice),
          is_available: itemData.is_active !== false,
          branch_id: itemData.branch_id || 1
        }])
        .select(`
          *,
          category:snack_categories(
            id,
            name,
            description
          )
        `)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating snack item:', error);
      return { data: null, error };
    }
  },

  async updateSnackItem(itemId, updateData) {
    try {
      // Handle category
      let categoryId = null;
      
      if (updateData.category && updateData.category !== 'Sin categoría') {
        const { data: categories } = await this.getSnackCategories();
        const existingCategory = categories.find(cat => cat.name === updateData.category);
        
        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          const { data: newCategory } = await this.createSnackCategory({
            name: updateData.category,
            description: `Categoría: ${updateData.category}`
          });
          categoryId = newCategory?.id;
        }
      }

      const { data, error } = await supabase
        .from('snack_items')
        .update({
          category_id: categoryId,
          name: updateData.name,
          description: updateData.description,
          price: parseFloat(updateData.unitPrice),
          is_available: updateData.is_active !== false,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select(`
          *,
          category:snack_categories(
            id,
            name,
            description
          )
        `)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating snack item:', error);
      return { data: null, error };
    }
  },

  async deleteSnackItem(itemId) {
    try {
      const { data, error } = await supabase
        .from('snack_items')
        .delete()
        .eq('id', itemId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error deleting snack item:', error);
      return { data: null, error };
    }
  },

  // =============================================
  // SUPPLIES MANAGEMENT - ENHANCED
  // =============================================

  async getSupplyCategories() {
    try {
      const { data, error } = await supabase
        .from('supply_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error getting supply categories:', error);
      return { data: [], error };
    }
  },

  async createSupplyCategory(categoryData) {
    try {
      const { data, error } = await supabase
        .from('supply_categories')
        .insert([{
          name: categoryData.name,
          description: categoryData.description,
          color: categoryData.color || '#6B7280',
          is_active: true
        }])
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating supply category:', error);
      return { data: null, error };
    }
  },

  async getSuppliers() {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error getting suppliers:', error);
      return { data: [], error };
    }
  },

  async createSupplier(supplierData) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{
          name: supplierData.name,
          contact_person: supplierData.contact_person,
          email: supplierData.email,
          phone: supplierData.phone,
          address: supplierData.address,
          tax_id: supplierData.tax_id,
          payment_terms: supplierData.payment_terms,
          is_active: true
        }])
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating supplier:', error);
      return { data: null, error };
    }
  },

  async getAllSupplies() {
    try {
      const { data, error } = await supabase
        .from('supplies')
        .select(`
          *,
          category:supply_categories(
            id,
            name,
            description,
            color
          ),
          supplier:suppliers(
            id,
            name,
            contact_person,
            email,
            phone
          )
        `)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      
      // Transform to consistent format
      const formattedSupplies = data.map(supply => ({
        id: supply.id,
        name: supply.name,
        description: supply.description || '',
        sku: supply.sku || `SUP-${supply.id}`,
        category: supply.category?.name || 'Sin categoría',
        supplier: supply.supplier?.name || 'Sin proveedor',
        unit: supply.unit,
        unitPrice: parseFloat(supply.unit_price || 0),
        currentStock: parseFloat(supply.current_stock || 0),
        minStock: parseFloat(supply.min_stock || 0),
        maxStock: parseFloat(supply.max_stock || 0),
        location: supply.location || '',
        notes: supply.notes || '',
        is_active: supply.is_active,
        branch_id: supply.branch_id,
        created_at: supply.created_at,
        updated_at: supply.updated_at,
        lastUpdated: supply.updated_at,
        // Additional fields to identify as supply
        item_type: 'supply',
        original_table: 'supplies'
      }));
      
      return { data: formattedSupplies, error: null };
    } catch (error) {
      console.error('Error getting supplies:', error);
      return { data: [], error };
    }
  },

  async createSupply(supplyData) {
    try {
      // Handle category
      let categoryId = null;
      
      if (supplyData.category && supplyData.category !== 'Sin categoría') {
        const { data: categories } = await this.getSupplyCategories();
        const existingCategory = categories.find(cat => cat.name === supplyData.category);
        
        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          const { data: newCategory } = await this.createSupplyCategory({
            name: supplyData.category,
            description: `Categoría: ${supplyData.category}`
          });
          categoryId = newCategory?.id;
        }
      }

      // Handle supplier
      let supplierId = null;
      
      if (supplyData.supplier && supplyData.supplier !== 'Sin proveedor') {
        const { data: suppliers } = await this.getSuppliers();
        const existingSupplier = suppliers.find(sup => sup.name === supplyData.supplier);
        
        if (existingSupplier) {
          supplierId = existingSupplier.id;
        } else {
          const { data: newSupplier } = await this.createSupplier({
            name: supplyData.supplier,
            contact_person: 'Por definir',
            email: '',
            phone: ''
          });
          supplierId = newSupplier?.id;
        }
      }

      const { data, error } = await supabase
        .from('supplies')
        .insert([{
          name: supplyData.name,
          description: supplyData.description,
          sku: supplyData.sku || `SUP-${Date.now()}`,
          category_id: categoryId,
          supplier_id: supplierId,
          unit: supplyData.unit,
          unit_price: parseFloat(supplyData.unitPrice),
          current_stock: parseFloat(supplyData.currentStock),
          min_stock: parseFloat(supplyData.minStock),
          max_stock: parseFloat(supplyData.maxStock),
          location: supplyData.location || '',
          notes: supplyData.notes || '',
          is_active: supplyData.is_active !== false,
          branch_id: supplyData.branch_id || 1
        }])
        .select(`
          *,
          category:supply_categories(
            id,
            name,
            description,
            color
          ),
          supplier:suppliers(
            id,
            name,
            contact_person,
            email,
            phone
          )
        `)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating supply:', error);
      return { data: null, error };
    }
  },

  async updateSupply(supplyId, updateData) {
    try {
      // Handle category
      let categoryId = null;
      
      if (updateData.category && updateData.category !== 'Sin categoría') {
        const { data: categories } = await this.getSupplyCategories();
        const existingCategory = categories.find(cat => cat.name === updateData.category);
        
        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          const { data: newCategory } = await this.createSupplyCategory({
            name: updateData.category,
            description: `Categoría: ${updateData.category}`
          });
          categoryId = newCategory?.id;
        }
      }

      // Handle supplier
      let supplierId = null;
      
      if (updateData.supplier && updateData.supplier !== 'Sin proveedor') {
        const { data: suppliers } = await this.getSuppliers();
        const existingSupplier = suppliers.find(sup => sup.name === updateData.supplier);
        
        if (existingSupplier) {
          supplierId = existingSupplier.id;
        } else {
          const { data: newSupplier } = await this.createSupplier({
            name: updateData.supplier,
            contact_person: 'Por definir',
            email: '',
            phone: ''
          });
          supplierId = newSupplier?.id;
        }
      }

      const { data, error } = await supabase
        .from('supplies')
        .update({
          name: updateData.name,
          description: updateData.description,
          sku: updateData.sku,
          category_id: categoryId,
          supplier_id: supplierId,
          unit: updateData.unit,
          unit_price: parseFloat(updateData.unitPrice),
          current_stock: parseFloat(updateData.currentStock),
          min_stock: parseFloat(updateData.minStock),
          max_stock: parseFloat(updateData.maxStock),
          location: updateData.location || '',
          notes: updateData.notes || '',
          is_active: updateData.is_active !== false,
          updated_at: new Date().toISOString()
        })
        .eq('id', supplyId)
        .select(`
          *,
          category:supply_categories(
            id,
            name,
            description,
            color
          ),
          supplier:suppliers(
            id,
            name,
            contact_person,
            email,
            phone
          )
        `)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating supply:', error);
      return { data: null, error };
    }
  },

  async deleteSupply(supplyId) {
    try {
      const { data, error } = await supabase
        .from('supplies')
        .delete()
        .eq('id', supplyId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error deleting supply:', error);
      return { data: null, error };
    }
  },

  // =============================================
  // UNIFIED INVENTORY MANAGEMENT
  // =============================================

  async getAllInventoryItems() {
    try {
      console.log('Loading unified inventory (supplies + snacks)...');
      
      // Get both supplies and snacks in parallel
      const [suppliesResult, snacksResult] = await Promise.all([
        this.getAllSupplies(),
        this.getAllSnackItems()
      ]);

      if (suppliesResult.error) {
        console.warn('Error loading supplies:', suppliesResult.error);
      }
      
      if (snacksResult.error) {
        console.warn('Error loading snacks:', snacksResult.error);
      }

      // Combine both arrays
      const allItems = [
        ...(suppliesResult.data || []),
        ...(snacksResult.data || [])
      ];

      console.log(`Loaded ${allItems.length} total items (${suppliesResult.data?.length || 0} supplies + ${snacksResult.data?.length || 0} snacks)`);
      
      return { data: allItems, error: null };
    } catch (error) {
      console.error('Error getting unified inventory:', error);
      return { data: [], error };
    }
  },

  async getAllCategories() {
    try {
      const [supplyCategoriesResult, snackCategoriesResult] = await Promise.all([
        this.getSupplyCategories(),
        this.getSnackCategories()
      ]);

      const allCategories = [
        ...(supplyCategoriesResult.data || []).map(cat => cat.name),
        ...(snackCategoriesResult.data || []).map(cat => cat.name)
      ];

      // Remove duplicates and sort
      const uniqueCategories = [...new Set(allCategories)].sort();
      
      return { data: uniqueCategories, error: null };
    } catch (error) {
      console.error('Error getting all categories:', error);
      return { data: [], error };
    }
  },

  async getAllSupplierNames() {
    try {
      const { data: suppliers, error } = await this.getSuppliers();
      
      if (error) {
        return { data: ['Proveedor de Snacks'], error: null };
      }

      const supplierNames = [
        'Proveedor de Snacks', // Default for snacks
        ...(suppliers || []).map(sup => sup.name)
      ];

      return { data: [...new Set(supplierNames)].sort(), error: null };
    } catch (error) {
      console.error('Error getting supplier names:', error);
      return { data: ['Proveedor de Snacks'], error };
    }
  },

  // =============================================
  // CONSUMPTION TRACKING
  // =============================================

  async recordSupplyConsumption(consumptionData) {
    try {
      // Record in supply_movements table
      const { data, error } = await supabase
        .from('supply_movements')
        .insert([{
          supply_id: consumptionData.supplyId,
          movement_type: 'consumption',
          quantity: parseFloat(consumptionData.quantity),
          unit_price: parseFloat(consumptionData.unitPrice || 0),
          reason: consumptionData.reason || 'Consumo registrado',
          room_number: consumptionData.room_number,
          department: consumptionData.department,
          consumed_by: consumptionData.consumed_by,
          notes: consumptionData.notes,
          created_by: null // You can add user context here
        }])
        .select()
        .single();

      if (error) throw error;

      // Update supply stock
      const { error: updateError } = await supabase
        .from('supplies')
        .update({
          current_stock: supabase.raw(`current_stock - ${parseFloat(consumptionData.quantity)}`),
          updated_at: new Date().toISOString()
        })
        .eq('id', consumptionData.supplyId);

      if (updateError) {
        console.warn('Error updating supply stock:', updateError);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error recording supply consumption:', error);
      return { data: null, error };
    }
  },

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
      // CORREGIDO: Definir validUpdates correctamente
      const validUpdates = {
        number: updates.number,
        floor: updates.floor,
        base_rate: updates.base_rate,
        capacity: updates.capacity,
        size: updates.size,
        features: updates.features,
        beds: updates.beds,
        updated_at: new Date().toISOString()
      }
      
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