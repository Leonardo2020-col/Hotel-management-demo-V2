// src/hooks/useReservations.js - VERSIÓN MEJORADA Y COMPLETA
import { useState, useEffect, useCallback, useMemo } from 'react';
import { db, subscriptions } from '../lib/supabase';
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
  // Estados principales
  const [reservations, setReservations] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [operationLoading, setOperationLoading] = useState(false);

  // Filtros y paginación
  const [filters, setFilters] = useState({
    status: '',
    dateRange: '',
    search: '',
    source: '',
    ...initialFilters
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  // =============================================
  // TRANSFORMACIÓN DE DATOS
  // =============================================
  const transformReservationForFrontend = useCallback((reservation) => {
    if (!reservation) return null;

    const guest = reservation.guest || {};
    const room = reservation.room || {};
    
    // Calcular noches
    const checkIn = new Date(reservation.check_in);
    const checkOut = new Date(reservation.check_out);
    const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
    
    return {
      id: reservation.id,
      confirmationCode: reservation.confirmation_code,
      status: reservation.status,
      checkIn: reservation.check_in,
      checkOut: reservation.check_out,
      nights: nights,
      adults: reservation.adults || 1,
      children: reservation.children || 0,
      guests: (reservation.adults || 1) + (reservation.children || 0),
      rate: parseFloat(reservation.rate || 0),
      totalAmount: parseFloat(reservation.total_amount || 0),
      paidAmount: parseFloat(reservation.paid_amount || 0),
      paymentStatus: reservation.payment_status || 'pending',
      paymentMethod: reservation.payment_method || null,
      source: reservation.source || 'direct',
      specialRequests: reservation.special_requests || '',
      checkedInAt: reservation.checked_in_at,
      checkedOutAt: reservation.checked_out_at,
      createdAt: reservation.created_at,
      updatedAt: reservation.updated_at,
      
      // Guest info
      guest: {
        id: guest.id,
        name: guest.full_name || guest.name || 'Huésped sin nombre',
        email: guest.email || '',
        phone: guest.phone || '',
        document: guest.document_number || guest.document || '',
        documentType: guest.document_type || 'DNI',
        status: guest.status || 'active'
      },
      
      // Room info
      room: {
        id: room.id,
        number: room.number || '',
        floor: room.floor || 1,
        capacity: room.capacity || 2,
        baseRate: parseFloat(room.base_rate || 100),
        rate: parseFloat(room.base_rate || 100),
        type: room.room_type || 'Estándar',
        features: room.features || []
      }
    };
  }, []);

  const transformRoomForFrontend = useCallback((room) => {
    if (!room) return null;

    return {
      id: room.id,
      number: room.number,
      floor: room.floor,
      capacity: room.capacity || 2,
      baseRate: parseFloat(room.base_rate || 100),
      rate: parseFloat(room.base_rate || 100),
      status: room.status,
      cleaningStatus: room.cleaning_status,
      features: room.features || [],
      size: room.size,
      beds: room.beds || [],
      room_type: room.room_type || 'Estándar'
    };
  }, []);

  // =============================================
  // CARGAR DATOS
  // =============================================
  const loadReservations = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      console.log('🔄 Loading reservations...');
      
      const { data, error: dbError } = await db.getReservations({
        limit: pagination.limit * pagination.page,
        orderBy: 'created_at:desc'
      });

      if (dbError) {
        throw new Error(dbError.message);
      }

      console.log(`✅ Loaded ${data?.length || 0} reservations`);

      const transformedReservations = (data || []).map(transformReservationForFrontend).filter(Boolean);
      setReservations(transformedReservations);
      
      setPagination(prev => ({
        ...prev,
        total: transformedReservations.length
      }));
      
    } catch (err) {
      console.error('❌ Error loading reservations:', err);
      setError(err.message || 'Error al cargar las reservas');
      toast.error('Error al cargar las reservas');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [pagination.limit, pagination.page, transformReservationForFrontend]);

  const loadAvailableRooms = useCallback(async () => {
    try {
      console.log('🏨 Loading available rooms...');
      
      const { data, error } = await db.getRooms();
      
      if (error) {
        console.error('Error loading rooms:', error);
        return;
      }

      const transformedRooms = (data || []).map(transformRoomForFrontend).filter(Boolean);
      setAvailableRooms(transformedRooms);
      
      console.log('✅ Available rooms loaded:', transformedRooms.length);
      
    } catch (error) {
      console.error('Error loading available rooms:', error);
    }
  }, [transformRoomForFrontend]);

  // =============================================
  // OPERACIONES CRUD
  // =============================================
  const createReservation = useCallback(async (reservationData) => {
    setOperationLoading(true);
    try {
      console.log('➕ Creating reservation:', reservationData);

      // Validaciones
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

      // Calcular valores
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      const rate = reservationData.room.baseRate || reservationData.room.rate || 100;
      const totalAmount = nights * rate;

      // Verificar disponibilidad de la habitación específica
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
          `La habitación ${reservationData.room.number} no está disponible. Conflictos: ${conflictDetails}`
        );
      }

      let guestId = reservationData.guest.id;
      
      // Crear huésped si no existe
      if (!guestId) {
        console.log('👤 Creating new guest...');
        
        const guestData = {
          full_name: reservationData.guest.name?.trim() || '',
          email: reservationData.guest.email?.trim() || '',
          phone: reservationData.guest.phone?.trim() || '',
          document_type: 'DNI',
          document_number: reservationData.guest.document?.trim() || '',
          status: 'active'
        };
        
        if (!guestData.full_name) {
          throw new Error('El nombre del huésped es obligatorio');
        }
        
        if (!guestData.document_number) {
          throw new Error('El documento del huésped es obligatorio');
        }

        const { data: newGuest, error: guestError } = await db.createGuest(guestData);

        if (guestError) {
          throw new Error('Error al crear el huésped: ' + guestError.message);
        }

        guestId = newGuest.id;
        console.log('✅ Guest created with ID:', guestId);
      }

      // Crear la reserva
      const reservationPayload = {
        guest_id: guestId,
        room_id: reservationData.room.id,
        branch_id: reservationData.branchId || 1,
        check_in: reservationData.checkIn,
        check_out: reservationData.checkOut,
        adults: reservationData.adults || 1,
        children: reservationData.children || 0,
        rate: rate,
        total_amount: totalAmount,
        paid_amount: reservationData.paidAmount || 0,
        payment_status: reservationData.paymentStatus || 'pending',
        payment_method: reservationData.paymentMethod || null,
        status: reservationData.status || 'pending',
        source: reservationData.source || 'direct',
        special_requests: reservationData.specialRequests || ''
      };

      console.log('📋 Creating reservation with payload:', reservationPayload);

      const { data: reservation, error: reservationError } = await db.createReservation(reservationPayload);

      if (reservationError) {
        throw new Error('Error al crear la reserva: ' + reservationError.message);
      }

      console.log('✅ Reservation created successfully:', reservation);
      toast.success(`Reserva creada exitosamente (${reservation.confirmation_code || reservation.id})`);
      
      // Recargar reservas
      await loadReservations(false);
      
      return reservation;

    } catch (error) {
      console.error('Error in createReservation:', error);
      toast.error(error.message || 'Error al crear la reserva');
      throw error;
    } finally {
      setOperationLoading(false);
    }
  }, [loadReservations]);

  const updateReservation = useCallback(async (id, updates) => {
    setOperationLoading(true);
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
          updatedAt: new Date().toISOString()
        } : reservation
      ));
      
      return data;
    } catch (error) {
      console.error('Error updating reservation:', error);
      toast.error(error.message || 'Error al actualizar la reserva');
      throw error;
    } finally {
      setOperationLoading(false);
    }
  }, []);

  const changeReservationStatus = useCallback(async (id, newStatus) => {
    setOperationLoading(true);
    try {
      console.log(`🔄 Changing reservation ${id} status to ${newStatus}`);
      
      const updates = { status: newStatus };
      
      // Agregar campos específicos según el estado
      if (newStatus === RESERVATION_STATUS.CHECKED_IN) {
        updates.checked_in_at = new Date().toISOString();
      } else if (newStatus === RESERVATION_STATUS.CHECKED_OUT) {
        updates.checked_out_at = new Date().toISOString();
        updates.payment_status = 'paid';
        const reservation = reservations.find(r => r.id === id);
        if (reservation) {
          updates.paid_amount = reservation.totalAmount || 0;
        }
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
    } finally {
      setOperationLoading(false);
    }
  }, [updateReservation, reservations]);

  const deleteReservation = useCallback(async (id) => {
    try {
      await changeReservationStatus(id, RESERVATION_STATUS.CANCELLED);
      toast.success('Reserva cancelada exitosamente');
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast.error('Error al cancelar la reserva');
      throw error;
    }
  }, [changeReservationStatus]);

  // =============================================
  // OPERACIONES ESPECÍFICAS
  // =============================================
  const processCheckIn = useCallback(async (reservationId) => {
    setOperationLoading(true);
    try {
      console.log(`🏨 Processing check-in for reservation ${reservationId}`);
      
      const { data, error } = await db.processCheckIn(reservationId);

      if (error) {
        throw new Error(error.message || 'Error en el check-in');
      }

      await changeReservationStatus(reservationId, RESERVATION_STATUS.CHECKED_IN);
      toast.success('Check-in realizado exitosamente');
      return data;
    } catch (error) {
      console.error('Error in check-in:', error);
      toast.error(error.message || 'Error en el check-in');
      throw error;
    } finally {
      setOperationLoading(false);
    }
  }, [changeReservationStatus]);

  const processCheckOut = useCallback(async (reservationId, paymentMethod = 'cash') => {
    setOperationLoading(true);
    try {
      console.log(`🏨 Processing check-out for reservation ${reservationId}`);
      
      const { data, error } = await db.processCheckOut(reservationId, paymentMethod);

      if (error) {
        throw new Error(error.message || 'Error en el check-out');
      }

      await changeReservationStatus(reservationId, RESERVATION_STATUS.CHECKED_OUT);
      toast.success('Check-out realizado exitosamente');
      return data;
    } catch (error) {
      console.error('Error in check-out:', error);
      toast.error(error.message || 'Error en el check-out');
      throw error;
    } finally {
      setOperationLoading(false);
    }
  }, [changeReservationStatus]);

  // =============================================
  // FUNCIONES DE BÚSQUEDA Y UTILIDADES
  // =============================================
  const getAvailableRoomsForDates = useCallback(async (checkIn, checkOut) => {
    try {
      console.log(`🔍 Getting available rooms for dates: ${checkIn} to ${checkOut}`);
      
      if (!checkIn || !checkOut) {
        console.warn('Missing dates for room search');
        return [];
      }
      
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

      return (data || []).map(guest => ({
        id: guest.id,
        name: guest.full_name,
        full_name: guest.full_name,
        email: guest.email || '',
        phone: guest.phone || '',
        document: guest.document_number || '',
        document_number: guest.document_number || '',
        status: guest.status || 'active'
      }));
    } catch (error) {
      console.error('Error in searchGuests:', error);
      return [];
    }
  }, []);

  const checkRoomAvailability = useCallback(async (roomId, checkIn, checkOut) => {
    try {
      const { available, conflicts } = await db.checkSpecificRoomAvailability(roomId, checkIn, checkOut);
      return { available, conflicts };
    } catch (error) {
      console.error('Error checking room availability:', error);
      return { available: false, conflicts: [] };
    }
  }, []);

  // =============================================
  // FILTRAR RESERVAS
  // =============================================
  const filteredReservations = useMemo(() => {
    let filtered = [...reservations];

    // Filtro por estado
    if (filters.status) {
      filtered = filtered.filter(reservation => reservation.status === filters.status);
    }

    // Filtro por búsqueda
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

    return filtered;
  }, [reservations, filters]);

  // =============================================
  // ESTADÍSTICAS
  // =============================================
  const getReservationStats = useCallback(() => {
    const total = filteredReservations.length;
    const pending = filteredReservations.filter(r => r.status === RESERVATION_STATUS.PENDING).length;
    const confirmed = filteredReservations.filter(r => r.status === RESERVATION_STATUS.CONFIRMED).length;
    const checkedIn = filteredReservations.filter(r => r.status === RESERVATION_STATUS.CHECKED_IN).length;
    const checkedOut = filteredReservations.filter(r => r.status === RESERVATION_STATUS.CHECKED_OUT).length;
    const cancelled = filteredReservations.filter(r => r.status === RESERVATION_STATUS.CANCELLED).length;
    const totalRevenue = filteredReservations
      .filter(r => [RESERVATION_STATUS.CHECKED_IN, RESERVATION_STATUS.CHECKED_OUT].includes(r.status))
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

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

  // =============================================
  // FUNCIONES AUXILIARES
  // =============================================
  const getReservationById = useCallback((id) => {
    return reservations.find(reservation => reservation.id === parseInt(id));
  }, [reservations]);

  const refresh = useCallback(async () => {
    await Promise.all([
      loadReservations(),
      loadAvailableRooms()
    ]);
  }, [loadReservations, loadAvailableRooms]);

  // =============================================
  // EFECTOS
  // =============================================
  
  // Cargar datos iniciales
  useEffect(() => {
    loadReservations();
    loadAvailableRooms();
  }, [loadReservations, loadAvailableRooms]);

  // Suscripciones en tiempo real
  useEffect(() => {
    console.log('🔔 Setting up real-time subscription for reservations');
    
    const subscription = subscriptions.reservations((payload) => {
      console.log('📡 Reservation change detected:', payload.eventType, payload.new);
      
      const { eventType, new: newReservation, old: oldReservation } = payload;
      
      setReservations(prevReservations => {
        switch (eventType) {
          case 'INSERT':
            const insertedReservation = transformReservationForFrontend(newReservation);
            return insertedReservation ? [...prevReservations, insertedReservation] : prevReservations;
            
          case 'UPDATE':
            const updatedReservation = transformReservationForFrontend(newReservation);
            if (!updatedReservation) return prevReservations;
            
            return prevReservations.map(reservation => 
              reservation.id === updatedReservation.id ? updatedReservation : reservation
            );
            
          case 'DELETE':
            return prevReservations.filter(reservation => reservation.id !== oldReservation.id);
            
          default:
            return prevReservations;
        }
      });
    });

    return () => {
      console.log('🔇 Cleaning up reservation subscription');
      subscription?.unsubscribe();
    };
  }, [transformReservationForFrontend]);

  return {
    // Datos principales
    reservations: filteredReservations,
    allReservations: reservations,
    availableRooms,
    loading,
    error,
    operationLoading,
    
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
    checkRoomAvailability,
    
    // Constantes
    RESERVATION_STATUS,
    
    // Función para recargar datos
    refresh
  };
};