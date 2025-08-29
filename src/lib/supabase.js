// src/lib/supabase.js - VERSIÓN COMPLETAMENTE CORREGIDA
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

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
        snack_categories!inner(
          id,
          name
        )
      `) // ✅ CORRECTO: snack_categories (plural) con !inner
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('❌ Error loading snack items:', error)
      throw error
    }

    console.log('🔍 Raw data from Supabase:', data?.slice(0, 2)) // Debug

    // Enriquecer datos con campos calculados
    const enrichedData = (data || []).map(item => ({
      ...item,
      category_name: item.snack_categories?.name || 'Sin categoría',
      category_slug: this.generateCategorySlug(item.snack_categories?.name),
      in_stock: item.stock > 0,
      low_stock: item.stock <= item.minimum_stock,
      stock_percentage: item.minimum_stock > 0 
        ? Math.round((item.stock / item.minimum_stock) * 100) 
        : 100,
      formatted_price: this.formatPrice(item.price),
      stock_status: this.getStockStatus(item.stock, item.minimum_stock)
    }))
    
    console.log('✅ Snack items loaded and enriched:', enrichedData.length)
    console.log('🔍 Sample enriched item:', enrichedData[0])
    
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

      // ✅ ESTRUCTURAR DATOS PARA EL FRONTEND
      const structuredData = {}
      
      if (data && Array.isArray(data)) {
        data.forEach(checkin => {
          const roomNumber = checkin.room?.room_number
          if (roomNumber) {
            // Parsear documento
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
              snacks_consumed: checkin.snacks_consumed || [], // ✅ AHORA DESDE LA BD
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
          room:room_id(room_number)
        `)
        .eq('id', quickCheckinId)
        .single()

      if (fetchError || !quickCheckin) {
        throw new Error('Quick check-in no encontrado')
      }

      // Marcar como completado (actualizar fecha de checkout)
      const { error: updateError } = await supabase
        .from('quick_checkins')
        .update({
          check_out_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', quickCheckinId)

      if (updateError) {
        console.warn('⚠️ Warning updating checkout:', updateError)
      }

      // Liberar habitación
      const { data: availableStatus } = await supabase
        .from('room_status')
        .select('id')
        .eq('status', 'limpieza')
        .single()

      if (availableStatus) {
        await supabase
          .from('rooms')
          .update({ status_id: availableStatus.id })
          .eq('id', quickCheckin.room_id)
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

  async updateRoomStatus(roomId, status, cleaningStatus = null) {
    try {
      const { data: statusData, error: statusError } = await supabase
        .from('room_status')
        .select('id')
        .eq('status', status)
        .single()

      if (statusError) return { data: null, error: statusError }

      const { data, error } = await supabase
        .from('rooms')
        .update({ status_id: statusData.id })
        .eq('id', roomId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
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
// 🔄 EXPORT PRINCIPAL ACTUALIZADO
// =====================================================
export default {
  supabase,
  authService,
  roomService,
  reservationService,
  guestService,
  paymentService,
  reportService,
  quickCheckinService,
  snackService, // ✅ Servicio de snacks corregido
  suppliesService, // ✅ Servicio de suministros agregado
  utilityService,
  realtimeService,
  branchService,
  db
}