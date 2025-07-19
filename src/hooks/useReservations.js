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
      
      // Obtener reservas con información completa
      const { data, error } = await db.getReservations({
        limit: 100, // Cargar más datos para filtros locales
        offset: 0
      });

      if (error) {
        console.error('Error loading reservations:', error);
        toast.error('Error al cargar las reservas');
        return;
      }

      // Transformar datos para compatibilidad con el frontend
      const transformedReservations = data.map(reservation => ({
        id: reservation.id,
        confirmationCode: reservation.confirmation_code,
        status: reservation.status,
        checkIn: reservation.check_in,
        checkOut: reservation.check_out,
        nights: reservation.nights,
        guests: reservation.adults + reservation.children,
        adults: reservation.adults,
        children: reservation.children,
        totalAmount: parseFloat(reservation.total_amount),
        paidAmount: parseFloat(reservation.paid_amount || 0),
        paymentStatus: reservation.payment_status,
        source: reservation.source || 'direct',
        specialRequests: reservation.special_requests,
        checkedInAt: reservation.checked_in_at,
        checkedOutAt: reservation.checked_out_at,
        createdAt: reservation.created_at,
        createdBy: reservation.created_by,
        guest: {
          id: reservation.guest?.id,
          name: reservation.guest?.full_name || reservation.guest?.first_name + ' ' + reservation.guest?.last_name,
          email: reservation.guest?.email,
          phone: reservation.guest?.phone,
          document: reservation.guest?.document_number,
          vipLevel: reservation.guest?.vip_level
        },
        room: {
          id: reservation.room?.id,
          number: reservation.room?.number,
          floor: reservation.room?.floor,
          type: reservation.room?.room_type || 'Habitación Estándar',
          capacity: reservation.room?.capacity || 2,
          rate: parseFloat(reservation.room?.base_rate || 100)
        }
      }));

      setReservations(transformedReservations);
      
    } catch (error) {
      console.error('Error in loadReservations:', error);
      toast.error('Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar habitaciones disponibles
  const loadAvailableRooms = useCallback(async () => {
    try {
      const { data, error } = await db.getRooms();
      
      if (error) {
        console.error('Error loading rooms:', error);
        return;
      }

      const transformedRooms = data.map(room => ({
        id: room.id,
        number: room.number,
        floor: room.floor,
        type: room.room_type || 'Habitación Estándar',
        capacity: room.capacity || 2,
        rate: parseFloat(room.base_rate || 100),
        status: room.status,
        features: room.features || []
      }));

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

  // Crear nueva reserva
  const createReservation = useCallback(async (reservationData) => {
    try {
      setLoading(true);

      // Preparar datos para Supabase
      const supabaseData = {
        guest_id: reservationData.guest.id,
        room_id: reservationData.room.id,
        branch_id: 1, // Por defecto, ajustar según necesidad
        check_in: reservationData.checkIn,
        check_out: reservationData.checkOut,
        adults: reservationData.guests || 1,
        children: 0,
        rate: reservationData.room.rate,
        total_amount: reservationData.nights * reservationData.room.rate,
        source: 'direct',
        special_requests: reservationData.specialRequests || '',
        status: RESERVATION_STATUS.PENDING
      };

      // Si no existe el huésped, crearlo primero
      let guestId = reservationData.guest.id;
      if (!guestId) {
        const { data: newGuest, error: guestError } = await db.createGuest({
          first_name: reservationData.guest.name.split(' ')[0] || '',
          last_name: reservationData.guest.name.split(' ').slice(1).join(' ') || '',
          email: reservationData.guest.email || '',
          phone: reservationData.guest.phone || '',
          document_type: 'DNI',
          document_number: reservationData.guest.document || '',
          status: 'active'
        });

        if (guestError) {
          throw new Error('Error al crear el huésped: ' + guestError.message);
        }

        guestId = newGuest.id;
        supabaseData.guest_id = guestId;
      }

      const { data, error } = await db.createReservation(supabaseData);

      if (error) {
        throw new Error(error.message || 'Error al crear la reserva');
      }

      toast.success('Reserva creada exitosamente');
      
      // Recargar reservas
      await loadReservations();
      
      return data;
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error(error.message || 'Error al crear la reserva');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadReservations]);

  // Actualizar reserva
  const updateReservation = useCallback(async (id, updates) => {
    try {
      const { data, error } = await db.updateReservation(id, updates);

      if (error) {
        throw new Error(error.message || 'Error al actualizar la reserva');
      }

      toast.success('Reserva actualizada exitosamente');
      
      // Actualizar estado local
      setReservations(prev => prev.map(reservation => 
        reservation.id === id ? { 
          ...reservation, 
          ...updates,
          // Transformar campos de Supabase a formato frontend
          checkIn: updates.check_in || reservation.checkIn,
          checkOut: updates.check_out || reservation.checkOut,
          totalAmount: updates.total_amount || reservation.totalAmount,
          confirmationCode: updates.confirmation_code || reservation.confirmationCode
        } : reservation
      ));
      
      return data;
    } catch (error) {
      console.error('Error updating reservation:', error);
      toast.error(error.message || 'Error al actualizar la reserva');
      throw error;
    }
  }, []);

  // Eliminar reserva
  const deleteReservation = useCallback(async (id) => {
    try {
      // En lugar de eliminar, cambiar estado a cancelado
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
      const updates = { status: newStatus };
      
      // Agregar campos específicos según el estado
      if (newStatus === RESERVATION_STATUS.CHECKED_IN) {
        updates.checked_in_at = new Date().toISOString();
      } else if (newStatus === RESERVATION_STATUS.CHECKED_OUT) {
        updates.checked_out_at = new Date().toISOString();
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
  }, [updateReservation]);

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
      const reservation = getReservationById(reservationId);
      if (!reservation) {
        throw new Error('Reserva no encontrada');
      }

      // Usar función de Supabase para check-in
      const { data, error } = await db.processCheckIn(reservationId);

      if (error) {
        throw new Error(error.message || 'Error en el check-in');
      }

      // Actualizar estado de la habitación
      await db.updateRoomStatus(reservation.room.id, 'occupied', 'dirty');

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
      const reservation = getReservationById(reservationId);
      if (!reservation) {
        throw new Error('Reserva no encontrada');
      }

      // Usar función de Supabase para check-out
      const { data, error } = await db.processCheckOut(reservationId, paymentMethod);

      if (error) {
        throw new Error(error.message || 'Error en el check-out');
      }

      // Actualizar estado de la habitación
      await db.updateRoomStatus(reservation.room.id, 'cleaning', 'dirty');

      await changeReservationStatus(reservationId, RESERVATION_STATUS.CHECKED_OUT);
      
      toast.success('Check-out realizado exitosamente');
      return data;
    } catch (error) {
      console.error('Error in check-out:', error);
      toast.error(error.message || 'Error en el check-out');
      throw error;
    }
  }, [getReservationById, changeReservationStatus]);

  // Obtener habitaciones disponibles para fechas específicas
  const getAvailableRoomsForDates = useCallback(async (checkIn, checkOut) => {
    try {
      const { data, error } = await db.getAvailableRooms(checkIn, checkOut);
      
      if (error) {
        console.error('Error getting available rooms:', error);
        return [];
      }

      return data.map(room => ({
        id: room.id,
        number: room.number,
        floor: room.floor,
        type: room.room_type || 'Habitación Estándar',
        capacity: room.capacity || 2,
        rate: parseFloat(room.base_rate || 100)
      }));
    } catch (error) {
      console.error('Error in getAvailableRoomsForDates:', error);
      return [];
    }
  }, []);

  // Buscar huéspedes
  const searchGuests = useCallback(async (searchTerm) => {
    try {
      const { data, error } = await db.searchGuests(searchTerm);
      
      if (error) {
        console.error('Error searching guests:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error in searchGuests:', error);
      return [];
    }
  }, []);

  return {
    reservations: getPaginatedReservations(),
    allReservations: filteredReservations,
    loading,
    filters,
    setFilters,
    pagination,
    setPagination,
    createReservation,
    updateReservation,
    deleteReservation,
    changeReservationStatus,
    getReservationById,
    getReservationStats,
    availableRooms,
    processCheckIn,
    processCheckOut,
    getAvailableRoomsForDates,
    searchGuests,
    // Función para recargar datos
    refresh: loadReservations
  };
};