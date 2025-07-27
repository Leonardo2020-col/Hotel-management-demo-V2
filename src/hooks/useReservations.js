import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/supabase';
import toast from 'react-hot-toast';

export const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
};

export const useReservations = (initialFilters = {}) => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    dateRange: '',
    search: '',
    source: '',
    ...initialFilters
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  // Cargar datos desde Supabase
  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Loading reservations...');
      
      // Obtener reservas con información completa usando la estructura corregida
      const { data, error } = await db.getReservations({
        limit: 100,
        offset: 0
      });

      if (error) {
        console.error('Error loading reservations:', error);
        toast.error('Error al cargar las reservas');
        return;
      }

      console.log('📋 Raw reservations data:', data);

      // Transformar datos para compatibilidad con el frontend
      const transformedReservations = (data || []).map(reservation => {
        // Asegurar que tenemos la estructura correcta
        const guest = reservation.guest || {};
        const room = reservation.room || {};
        
        return {
          id: reservation.id,
          confirmationCode: reservation.confirmation_code,
          status: reservation.status,
          checkIn: reservation.check_in,
          checkOut: reservation.check_out,
          nights: reservation.nights || Math.ceil((new Date(reservation.check_out) - new Date(reservation.check_in)) / (1000 * 60 * 60 * 24)),
          guests: (reservation.adults || 0) + (reservation.children || 0),
          adults: reservation.adults || 1,
          children: reservation.children || 0,
          totalAmount: parseFloat(reservation.total_amount || 0),
          paidAmount: parseFloat(reservation.paid_amount || 0),
          paymentStatus: reservation.payment_status || 'pending',
          paymentMethod: reservation.payment_method || 'cash',
          source: reservation.source || 'direct',
          specialRequests: reservation.special_requests || '',
          checkedInAt: reservation.checked_in_at,
          checkedOutAt: reservation.checked_out_at,
          createdAt: reservation.created_at,
          createdBy: reservation.created_by,
          
          // Guest info con estructura simplificada
          guest: {
            id: guest.id,
            name: guest.full_name || 'Huésped sin nombre',
            email: guest.email || '',
            phone: guest.phone || '',
            document: guest.document_number || '',
            // Eliminar vip_level ya que no existe en la nueva estructura
            status: guest.status || 'active'
          },
          
          // Room info con estructura corregida (sin room_types)
          room: {
            id: room.id,
            number: room.number || '',
            floor: room.floor || 1,
            //type: room.room_type || 'Habitación Estándar', // Campo directo ahora
            capacity: room.capacity || 2,
            rate: parseFloat(room.base_rate || 100) // Campo directo ahora
          }
        };
      });

      console.log('✅ Transformed reservations:', transformedReservations.length);
      setReservations(transformedReservations);
      
    } catch (error) {
      console.error('Error in loadReservations:', error);
      toast.error('Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  }, []);

  // 1. FUNCIÓN DE DEBUGGING - Agregar al inicio del hook
const debugReservationCreation = async (data) => {
  console.group('🐛 DEBUG: Reservation Creation Process');
  
  try {
    // Verificar estado de la base de datos
    console.log('1. Testing database connection...');
    const { data: testRooms, error: testError } = await db.getRooms({ limit: 1 });
    console.log('   Database test result:', { success: !testError, roomCount: testRooms?.length });
    
    // Verificar datos de entrada
    console.log('2. Input data validation:');
    console.log('   Guest data:', {
      hasName: !!data.guest?.name,
      hasDocument: !!data.guest?.document,
      hasEmail: !!data.guest?.email
    });
    console.log('   Room data:', {
      hasRoomId: !!data.room?.id,
      roomNumber: data.room?.number,
      roomRate: data.room?.rate
    });
    console.log('   Date data:', {
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      validDates: data.checkIn && data.checkOut && new Date(data.checkOut) > new Date(data.checkIn)
    });
    
    // Verificar disponibilidad de la habitación
    if (data.room?.id && data.checkIn && data.checkOut) {
      console.log('3. Checking room availability...');
      const availability = await db.checkSpecificRoomAvailability(
        data.room.id, 
        data.checkIn, 
        data.checkOut
      );
      console.log('   Availability result:', availability);
    }
    
    // Verificar si el huésped ya existe
    if (data.guest?.document) {
      console.log('4. Checking if guest exists...');
      const existingGuests = await db.searchGuests(data.guest.document);
      console.log('   Existing guests found:', existingGuests.data?.length || 0);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    console.groupEnd();
  }
};


  // Cargar habitaciones disponibles
  const loadAvailableRooms = useCallback(async () => {
    try {
      console.log('🏨 Loading available rooms...');
      
      const { data, error } = await db.getRooms();
      
      if (error) {
        console.error('Error loading rooms:', error);
        return;
      }

      // Transformar habitaciones con estructura corregida
      const transformedRooms = (data || []).map(room => ({
        id: room.id,
        number: room.number,
        floor: room.floor,
        //type: room.room_type || room.type || 'Habitación Estándar', // Campo directo
        capacity: room.capacity || 2,
        rate: parseFloat(room.base_rate || room.rate || 100), // Campo directo
        status: room.status,
        features: room.features || []
      }));

      console.log('✅ Available rooms loaded:', transformedRooms.length);
      setAvailableRooms(transformedRooms);
      
    } catch (error) {
      console.error('Error loading available rooms:', error);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    loadReservations();
    loadAvailableRooms();
  }, [loadReservations, loadAvailableRooms]);

  // Filtrar reservas
  useEffect(() => {
    let filtered = [...reservations];

    // Filtro por estado
    if (filters.status) {
      filtered = filtered.filter(reservation => reservation.status === filters.status);
    }

    // Filtro por búsqueda (nombre, código, email, habitación)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(reservation => 
        reservation.guest.name?.toLowerCase().includes(searchTerm) ||
        reservation.confirmationCode?.toLowerCase().includes(searchTerm) ||
        reservation.guest.email?.toLowerCase().includes(searchTerm) ||
        reservation.room.number?.toString().includes(searchTerm) ||
        reservation.guest.document?.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por fuente
    if (filters.source) {
      filtered = filtered.filter(reservation => reservation.source === filters.source);
    }

    // Filtro por rango de fechas
    if (filters.dateRange) {
      const today = new Date();
      let startDate, endDate;

      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(today);
          endDate = new Date(today);
          break;
        case 'tomorrow':
          startDate = new Date(today);
          startDate.setDate(today.getDate() + 1);
          endDate = new Date(startDate);
          break;
        case 'this_week':
          startDate = new Date(today);
          endDate = new Date(today);
          endDate.setDate(today.getDate() + 7);
          break;
        case 'next_week':
          startDate = new Date(today);
          startDate.setDate(today.getDate() + 7);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 7);
          break;
        default:
          startDate = null;
          endDate = null;
      }

      if (startDate && endDate) {
        filtered = filtered.filter(reservation => {
          const checkInDate = new Date(reservation.checkIn);
          return checkInDate >= startDate && checkInDate <= endDate;
        });
      }
    }

    setFilteredReservations(filtered);
    setPagination(prev => ({ ...prev, total: filtered.length, page: 1 }));
  }, [reservations, filters]);

  // CREAR RESERVA
  // 3. FUNCIÓN MEJORADA PARA CREAR RESERVA CON MEJOR MANEJO DE ERRORES
const createReservation = useCallback(async (reservationData) => {
  try {
    setLoading(true);
    
    // Debug opcional (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      await debugReservationCreation(reservationData);
    }
    
    console.log('➕ Creating reservation with improved error handling:', reservationData);

    // Validaciones previas
    if (!reservationData.guest || !reservationData.room) {
      throw new Error('Faltan datos del huésped o habitación');
    }
    
    if (!reservationData.checkIn || !reservationData.checkOut) {
      throw new Error('Faltan fechas de check-in o check-out');
    }
    
    const checkInDate = new Date(reservationData.checkIn);
    const checkOutDate = new Date(reservationData.checkOut);
    
    if (checkOutDate <= checkInDate) {
      throw new Error('La fecha de check-out debe ser posterior al check-in');
    }

    // Calcular noches
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) {
      throw new Error('El número de noches debe ser mayor a 0');
    }

    // Verificar disponibilidad de la habitación antes de crear
    const availability = await db.checkSpecificRoomAvailability(
      reservationData.room.id,
      reservationData.checkIn,
      reservationData.checkOut
    );
    
    if (!availability.available) {
      const conflictDetails = availability.conflicts.map(c => 
        `Reserva ${c.confirmation_code} (${c.check_in} a ${c.check_out})`
      ).join(', ');
      
      throw new Error(
        `La habitación ${reservationData.room.number} no está disponible para las fechas seleccionadas. ` +
        `Conflictos: ${conflictDetails}`
      );
    }

    let guestId = reservationData.guest.id;
    
    // Si no existe el huésped, crearlo primero
    if (!guestId) {
      console.log('👤 Creating new guest...');
      
      const guestData = {
        full_name: reservationData.guest.name?.trim() || 'Huésped sin nombre',
        email: reservationData.guest.email?.trim() || '',
        phone: reservationData.guest.phone?.trim() || '',
        document_type: 'DNI',
        document_number: reservationData.guest.document?.trim() || '',
        status: 'active'
      };
      
      // Validar datos mínimos del huésped
      if (!guestData.full_name || guestData.full_name === 'Huésped sin nombre') {
        throw new Error('El nombre del huésped es obligatorio');
      }
      
      if (!guestData.document_number) {
        throw new Error('El documento del huésped es obligatorio');
      }

      const { data: newGuest, error: guestError } = await db.createGuest(guestData);

      if (guestError) {
        console.error('Guest creation error:', guestError);
        throw new Error('Error al crear el huésped: ' + guestError.message);
      }

      if (!newGuest || !newGuest.id) {
        throw new Error('No se pudo crear el huésped correctamente');
      }

      guestId = newGuest.id;
      console.log('✅ Guest created with ID:', guestId);
    }

    // Preparar datos de la reserva
    const rate = reservationData.room.base_rate || reservationData.room.rate;
    if (!rate || rate <= 0) {
      throw new Error('La tarifa de la habitación no es válida');
    }
    
    const totalAmount = nights * rate;

    const reservationPayload = {
      guest_id: guestId,
      room_id: reservationData.room.id,
      branch_id: reservationData.branchId || 1,
      check_in: reservationData.checkIn,
      check_out: reservationData.checkOut,
      adults: reservationData.adults || reservationData.guests || 1,
      children: reservationData.children || 0,
      rate: rate,
      total_amount: totalAmount,
      paid_amount: reservationData.paidAmount || 0,
      payment_status: reservationData.paymentStatus || 'pending',
      payment_method: reservationData.paymentMethod || 'cash',
      status: reservationData.status || 'pending',
      source: reservationData.source || 'direct',
      special_requests: reservationData.specialRequests || ''
    };

    console.log('📋 Creating reservation with payload:', reservationPayload);

    // Crear la reserva
    const { data: reservation, error: reservationError } = await db.createReservation(reservationPayload);

    if (reservationError) {
      console.error('Reservation creation error:', reservationError);
      throw new Error('Error al crear la reserva: ' + reservationError.message);
    }

    if (!reservation || !reservation.id) {
      throw new Error('No se pudo crear la reserva correctamente');
    }

    console.log('✅ Reservation created successfully:', reservation);
    toast.success(`Reserva creada exitosamente (${reservation.confirmation_code || reservation.id})`);
    
    // Recargar reservas para actualizar la lista
    await loadReservations();
    
    return reservation;

  } catch (error) {
    console.error('Error in createReservation:', error);
    
    // Mensajes de error más específicos
    let errorMessage = 'Error al crear la reserva';
    
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      errorMessage = 'Ya existe una reserva con estos datos';
    } else if (error.message.includes('foreign key') || error.message.includes('not found')) {
      errorMessage = 'Error de datos relacionados (huésped o habitación no válidos)';
    } else if (error.message.includes('disponible')) {
      errorMessage = error.message; // Usar mensaje específico de disponibilidad
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    toast.error(errorMessage);
    throw new Error(errorMessage);
    
  } finally {
    setLoading(false);
  }
}, [loadReservations]);

// 4. FUNCIÓN PARA VALIDAR FORMULARIO ANTES DE ENVÍO
const validateReservationForm = (formData) => {
  const errors = [];
  
  // Validar huésped
  if (!formData.guestName?.trim()) {
    errors.push('El nombre del huésped es obligatorio');
  }
  
  if (!formData.guestDocument?.trim()) {
    errors.push('El documento del huésped es obligatorio');
  }
  
  if (formData.guestEmail && !/\S+@\S+\.\S+/.test(formData.guestEmail)) {
    errors.push('El email del huésped no es válido');
  }
  
  // Validar fechas
  if (!formData.checkIn) {
    errors.push('La fecha de entrada es obligatoria');
  }
  
  if (!formData.checkOut) {
    errors.push('La fecha de salida es obligatoria');
  }
  
  if (formData.checkIn && formData.checkOut) {
    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkIn < today) {
      errors.push('La fecha de entrada no puede ser anterior a hoy');
    }
    
    if (checkOut <= checkIn) {
      errors.push('La fecha de salida debe ser posterior a la entrada');
    }
    
    const maxAdvanceDays = 365; // Máximo 1 año de anticipación
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + maxAdvanceDays);
    
    if (checkIn > maxDate) {
      errors.push('La fecha de entrada no puede ser más de un año en el futuro');
    }
  }
  
  // Validar habitación
  if (!formData.roomId) {
    errors.push('Debe seleccionar una habitación');
  }
  
  // Validar huéspedes
  if (!formData.adults || formData.adults < 1) {
    errors.push('Debe haber al menos 1 adulto');
  }
  
  if (formData.adults > 10) {
    errors.push('Número de adultos excesivo');
  }
  
  if (formData.children && formData.children < 0) {
    errors.push('El número de niños no puede ser negativo');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 5. FUNCIÓN AUXILIAR PARA LOGGING DETALLADO
const logReservationOperation = (operation, data, result) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`📊 Reservation ${operation}`);
    console.log('Input data:', data);
    console.log('Result:', result);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
};

  // Actualizar reserva
  const updateReservation = useCallback(async (id, updates) => {
    try {
      console.log('🔄 Updating reservation:', id, updates);

      // Convertir campos del frontend a formato Supabase
      const supabaseUpdates = {};
      
      if (updates.checkIn !== undefined) supabaseUpdates.check_in = updates.checkIn;
      if (updates.checkOut !== undefined) supabaseUpdates.check_out = updates.checkOut;
      if (updates.status !== undefined) supabaseUpdates.status = updates.status;
      if (updates.totalAmount !== undefined) supabaseUpdates.total_amount = updates.totalAmount;
      if (updates.paidAmount !== undefined) supabaseUpdates.paid_amount = updates.paidAmount;
      if (updates.paymentStatus !== undefined) supabaseUpdates.payment_status = updates.paymentStatus;
      if (updates.paymentMethod !== undefined) supabaseUpdates.payment_method = updates.paymentMethod;
      if (updates.specialRequests !== undefined) supabaseUpdates.special_requests = updates.specialRequests;
      if (updates.adults !== undefined) supabaseUpdates.adults = updates.adults;
      if (updates.children !== undefined) supabaseUpdates.children = updates.children;

      const { data, error } = await db.updateReservation(id, supabaseUpdates);

      if (error) {
        throw new Error(error.message || 'Error al actualizar la reserva');
      }

      toast.success('Reserva actualizada exitosamente');
      
      // Actualizar estado local
      setReservations(prev => prev.map(reservation => 
        reservation.id === id ? { 
          ...reservation, 
          ...updates,
          // Asegurar que los campos se actualicen correctamente
          checkIn: updates.checkIn || reservation.checkIn,
          checkOut: updates.checkOut || reservation.checkOut,
          totalAmount: updates.totalAmount || reservation.totalAmount,
          confirmationCode: updates.confirmationCode || reservation.confirmationCode
        } : reservation
      ));
      
      return data;
    } catch (error) {
      console.error('Error updating reservation:', error);
      toast.error(error.message || 'Error al actualizar la reserva');
      throw error;
    }
  }, []);

  // Eliminar reserva (cancelar)
  const deleteReservation = useCallback(async (id) => {
    try {
      await updateReservation(id, { 
        status: RESERVATION_STATUS.CANCELLED,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'Eliminado por usuario'
      });
      
      toast.success('Reserva cancelada exitosamente');
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast.error('Error al cancelar la reserva');
      throw error;
    }
  }, [updateReservation]);

  // Cambiar estado de reserva
  const changeReservationStatus = useCallback(async (id, newStatus) => {
    try {
      console.log(`🔄 Changing reservation ${id} status to ${newStatus}`);
      
      const updates = { status: newStatus };
      
      // Agregar campos específicos según el estado
      if (newStatus === RESERVATION_STATUS.CHECKED_IN) {
        updates.checked_in_at = new Date().toISOString();
      } else if (newStatus === RESERVATION_STATUS.CHECKED_OUT) {
        updates.checked_out_at = new Date().toISOString();
        updates.payment_status = 'paid';
        updates.paid_amount = reservations.find(r => r.id === id)?.totalAmount || 0;
      } else if (newStatus === RESERVATION_STATUS.CANCELLED) {
        updates.cancelled_at = new Date().toISOString();
      }

      await updateReservation(id, updates);

      const statusMessages = {
        [RESERVATION_STATUS.CONFIRMED]: 'confirmada',
        [RESERVATION_STATUS.CHECKED_IN]: 'check-in realizado',
        [RESERVATION_STATUS.CHECKED_OUT]: 'check-out realizado',
        [RESERVATION_STATUS.CANCELLED]: 'cancelada'
      };

      toast.success(`Reserva ${statusMessages[newStatus] || 'actualizada'}`);
    } catch (error) {
      console.error('Error changing reservation status:', error);
      toast.error('Error al cambiar el estado de la reserva');
      throw error;
    }
  }, [updateReservation, reservations]);

  // Obtener reserva por ID
  const getReservationById = useCallback((id) => {
    return reservations.find(reservation => reservation.id === parseInt(id));
  }, [reservations]);

  // Estadísticas de reservas
  const getReservationStats = useCallback(() => {
    const total = filteredReservations.length;
    const pending = filteredReservations.filter(r => r.status === RESERVATION_STATUS.PENDING).length;
    const confirmed = filteredReservations.filter(r => r.status === RESERVATION_STATUS.CONFIRMED).length;
    const checkedIn = filteredReservations.filter(r => r.status === RESERVATION_STATUS.CHECKED_IN).length;
    const checkedOut = filteredReservations.filter(r => r.status === RESERVATION_STATUS.CHECKED_OUT).length;
    const cancelled = filteredReservations.filter(r => r.status === RESERVATION_STATUS.CANCELLED).length;
    const totalRevenue = filteredReservations
      .filter(r => [RESERVATION_STATUS.CHECKED_IN, RESERVATION_STATUS.CHECKED_OUT].includes(r.status))
      .reduce((sum, r) => sum + r.totalAmount, 0);

    return { 
      total, 
      pending, 
      confirmed, 
      checkedIn, 
      checkedOut, 
      cancelled, 
      totalRevenue 
    };
  }, [filteredReservations]);

  // Paginación
  const getPaginatedReservations = useCallback(() => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredReservations.slice(startIndex, endIndex);
  }, [filteredReservations, pagination]);

  // Procesar check-in
  const processCheckIn = useCallback(async (reservationId) => {
    try {
      console.log(`🏨 Processing check-in for reservation ${reservationId}`);
      
      const reservation = getReservationById(reservationId);
      if (!reservation) {
        throw new Error('Reserva no encontrada');
      }

      // Usar función de Supabase para check-in
      const { data, error } = await db.processCheckIn(reservationId);

      if (error) {
        throw new Error(error.message || 'Error en el check-in');
      }

      // Actualizar estado local
      await changeReservationStatus(reservationId, RESERVATION_STATUS.CHECKED_IN);
      
      toast.success('Check-in realizado exitosamente');
      return data;
    } catch (error) {
      console.error('Error in check-in:', error);
      toast.error(error.message || 'Error en el check-in');
      throw error;
    }
  }, [getReservationById, changeReservationStatus]);

  // Procesar check-out
  const processCheckOut = useCallback(async (reservationId, paymentMethod = 'cash') => {
    try {
      console.log(`🏨 Processing check-out for reservation ${reservationId}`);
      
      const reservation = getReservationById(reservationId);
      if (!reservation) {
        throw new Error('Reserva no encontrada');
      }

      // Usar función de Supabase para check-out
      const { data, error } = await db.processCheckOut(reservationId, paymentMethod);

      if (error) {
        throw new Error(error.message || 'Error en el check-out');
      }

      // Actualizar estado local
      await changeReservationStatus(reservationId, RESERVATION_STATUS.CHECKED_OUT);
      
      toast.success('Check-out realizado exitosamente');
      return data;
    } catch (error) {
      console.error('Error in check-out:', error);
      toast.error(error.message || 'Error en el check-out');
      throw error;
    }
  }, [getReservationById, changeReservationStatus]);

  // 2. FUNCIÓN MEJORADA PARA OBTENER HABITACIONES DISPONIBLES
const getAvailableRoomsForDates = useCallback(async (checkIn, checkOut) => {
  try {
    console.log(`🔍 Getting available rooms for dates: ${checkIn} to ${checkOut}`);
    
    if (!checkIn || !checkOut) {
      console.warn('Missing dates for room search');
      return [];
    }
    
    // Validar fechas
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (checkOutDate <= checkInDate) {
      console.warn('Invalid date range');
      return [];
    }
    
    // Usar la función corregida de Supabase
    const { data, error } = await db.getAvailableRooms(checkIn, checkOut);
    
    if (error) {
      console.error('Error getting available rooms:', error);
      return [];
    }
    
    console.log(`✅ Found ${data?.length || 0} available rooms`);
    return data || [];
    
  } catch (error) {
    console.error('Error in getAvailableRoomsForDates:', error);
    return [];
  }
}, []);


  // Buscar huéspedes
  const searchGuests = useCallback(async (searchTerm) => {
    try {
      if (!searchTerm || searchTerm.trim() === '') {
        return [];
      }

      console.log(`👤 Searching guests: ${searchTerm}`);
      
      const { data, error } = await db.searchGuests(searchTerm);
      
      if (error) {
        console.error('Error searching guests:', error);
        return [];
      }

      // Transformar datos con estructura simplificada
      return (data || []).map(guest => ({
        id: guest.id,
        name: guest.full_name,
        email: guest.email || '',
        phone: guest.phone || '',
        document: guest.document_number || '',
        status: guest.status || 'active'
      }));
    } catch (error) {
      console.error('Error in searchGuests:', error);
      return [];
    }
  }, []);

  // Crear huésped rápido durante reserva
  const createQuickGuest = useCallback(async (guestData) => {
    try {
      console.log('👤 Creating quick guest:', guestData);
      
      const { data, error } = await db.createGuest({
        full_name: guestData.name || 'Huésped sin nombre',
        email: guestData.email || '',
        phone: guestData.phone || '',
        document_type: 'DNI',
        document_number: guestData.document || '',
        status: 'active'
      });

      if (error) {
        throw new Error(error.message || 'Error al crear el huésped');
      }

      return {
        id: data.id,
        name: data.full_name,
        email: data.email,
        phone: data.phone,
        document: data.document_number
      };
    } catch (error) {
      console.error('Error creating quick guest:', error);
      toast.error(error.message || 'Error al crear el huésped');
      throw error;
    }
  }, []);

  // Verificar disponibilidad de habitación
  const checkRoomAvailability = useCallback(async (roomId, checkIn, checkOut) => {
    try {
      // Verificar si hay conflictos con reservas existentes
      const conflictingReservations = reservations.filter(reservation => 
        reservation.room.id === roomId &&
        reservation.status !== RESERVATION_STATUS.CANCELLED &&
        reservation.status !== RESERVATION_STATUS.NO_SHOW &&
        (
          (new Date(checkIn) < new Date(reservation.checkOut) && 
           new Date(checkOut) > new Date(reservation.checkIn))
        )
      );

      return {
        available: conflictingReservations.length === 0,
        conflicts: conflictingReservations
      };
    } catch (error) {
      console.error('Error checking room availability:', error);
      return { available: false, conflicts: [] };
    }
  }, [reservations]);

  return {
    // Datos
    reservations: getPaginatedReservations(),
    allReservations: filteredReservations,
    availableRooms,
    loading,
    
    // Filtros y paginación
    filters,
    setFilters,
    pagination,
    setPagination,
    
    // Operaciones CRUD
    createReservation,
    updateReservation,
    deleteReservation,
    changeReservationStatus,
    
    // Operaciones específicas
    processCheckIn,
    processCheckOut,
    
    // Búsqueda y utilidades
    getReservationById,
    getReservationStats,
    getAvailableRoomsForDates,
    searchGuests,
    createQuickGuest,
    checkRoomAvailability,

    // Nuevas funciones
    getAvailableRoomsForDates,
    validateReservationForm,
    debugReservationCreation,
    
    // Función para recargar datos
    refresh: loadReservations
  };
};