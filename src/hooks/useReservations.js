import { useState, useEffect, useCallback, useMemo } from 'react'
import { reservationService, extendedGuestService, roomService, paymentService } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export const RESERVATION_STATUS = {
  PENDING: 'pendiente',
  CONFIRMED: 'confirmada', 
  CHECKED_IN: 'en_uso',
  CHECKED_OUT: 'completada',
  CANCELLED: 'cancelada',
  NO_SHOW: 'no_show'
}

export const useReservations = (initialFilters = {}) => {
  const { user } = useAuth()
  const [reservations, setReservations] = useState([])
  const [allReservations, setAllReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [operationLoading, setOperationLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
    dateRange: '',
    search: '',
    source: '',
    ...initialFilters
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  })

  const branchId = user?.userInfo?.user_branches?.[0]?.branch_id

  // Cargar reservaciones
  const loadReservations = useCallback(async (customFilters = {}) => {
    if (!branchId) return

    try {
      setLoading(true)
      setError(null)
      
      const finalFilters = { ...filters, ...customFilters }
      console.log('🔍 Loading reservations with filters:', finalFilters)

      // Convertir filtros al formato de Supabase
      const supabaseFilters = {}
      
      if (finalFilters.status) {
        supabaseFilters.status = finalFilters.status
      }

      if (finalFilters.dateRange) {
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)
        const nextWeek = new Date(today)
        nextWeek.setDate(today.getDate() + 7)

        switch (finalFilters.dateRange) {
          case 'today':
            supabaseFilters.dateFrom = today.toISOString().split('T')[0]
            supabaseFilters.dateTo = today.toISOString().split('T')[0]
            break
          case 'tomorrow':
            supabaseFilters.dateFrom = tomorrow.toISOString().split('T')[0]
            supabaseFilters.dateTo = tomorrow.toISOString().split('T')[0]
            break
          case 'this_week':
            supabaseFilters.dateFrom = today.toISOString().split('T')[0]
            supabaseFilters.dateTo = nextWeek.toISOString().split('T')[0]
            break
          case 'next_week':
            const startNextWeek = new Date(nextWeek)
            const endNextWeek = new Date(nextWeek)
            endNextWeek.setDate(startNextWeek.getDate() + 7)
            supabaseFilters.dateFrom = startNextWeek.toISOString().split('T')[0]
            supabaseFilters.dateTo = endNextWeek.toISOString().split('T')[0]
            break
        }
      }

      if (finalFilters.search) {
        supabaseFilters.guestName = finalFilters.search
      }

      const { data, error: serviceError } = await reservationService.getReservationsByBranch(
        branchId, 
        supabaseFilters
      )

      if (serviceError) throw new Error(serviceError.message || 'Error al cargar reservaciones')

      // Transformar datos de Supabase a formato de tu UI
      const transformedReservations = (data || []).map(reservation => ({
        id: reservation.id,
        confirmationCode: reservation.reservation_code,
        guest: {
          name: reservation.guest?.full_name,
          email: reservation.guest?.email || '',
          phone: reservation.guest?.phone || '',
          document: reservation.guest?.document_number || ''
        },
        room: {
          id: reservation.room?.id,
          number: reservation.room?.room_number,
          type: 'Estándar', // Puedes agregar este campo a la BD si lo necesitas
          capacity: 2 // Puedes agregar este campo a la BD si lo necesitas
        },
        checkIn: reservation.check_in_date,
        checkOut: reservation.check_out_date,
        nights: reservation.nights || 1,
        adults: 1, // Puedes agregar este campo si lo necesitas
        children: 0, // Puedes agregar este campo si lo necesitas
        status: reservation.status?.status || 'pendiente',
        totalAmount: reservation.total_amount || 0,
        paidAmount: reservation.paid_amount || 0,
        rate: reservation.room?.base_price || 0,
        source: 'direct', // Puedes agregar este campo si lo necesitas
        specialRequests: '', // Puedes agregar este campo si lo necesitas
        createdAt: reservation.created_at,
        updatedAt: reservation.updated_at,
        checkedInAt: null, // Puedes obtener esto de checkin_orders
        checkedOutAt: null, // Puedes obtener esto de checkout_orders
        paymentMethod: null // Puedes obtener esto de los pagos
      }))

      setReservations(transformedReservations)
      setAllReservations(transformedReservations)
      setPagination(prev => ({
        ...prev,
        total: transformedReservations.length
      }))

      console.log(`✅ Loaded ${transformedReservations.length} reservations`)

    } catch (err) {
      console.error('❌ Error loading reservations:', err)
      setError(err.message)
      toast.error('Error al cargar reservaciones: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [branchId, filters])

  // Cargar al inicializar
  useEffect(() => {
    loadReservations()
  }, [loadReservations])

  // Crear reservación
  const createReservation = useCallback(async (reservationData) => {
    if (!branchId) throw new Error('No hay sucursal seleccionada')

    try {
      setOperationLoading(true)
      console.log('🏨 Creating reservation:', reservationData)

      // Buscar o crear habitación por número
      let roomId = reservationData.room?.id
      if (!roomId && reservationData.room?.number) {
        // Buscar habitación por número
        const { data: rooms } = await roomService.getRoomsWithStatus(branchId)
        const room = rooms?.find(r => r.room_number === reservationData.room.number)
        if (room) {
          roomId = room.id
        } else {
          throw new Error(`Habitación ${reservationData.room.number} no encontrada`)
        }
      }

      if (!roomId) {
        throw new Error('ID de habitación requerido')
      }

      // Preparar datos de reservación para Supabase
      const supabaseReservationData = {
        branchId: branchId,
        roomId: roomId,
        checkInDate: reservationData.checkIn,
        checkOutDate: reservationData.checkOut,
        totalAmount: reservationData.totalAmount || (reservationData.nights * reservationData.rate) || 0,
        createdBy: user.userInfo.id
      }

      // Preparar datos del huésped
      const guestData = {
        id: reservationData.guest?.id || null,
        fullName: reservationData.guest?.name,
        phone: reservationData.guest?.phone || '',
        documentType: 'dni', // Puedes hacer esto configurable
        documentNumber: reservationData.guest?.document || ''
      }

      const { data, error } = await reservationService.createReservation(
        supabaseReservationData,
        guestData
      )

      if (error) throw new Error(error.message || 'Error al crear reservación')

      console.log('✅ Reservation created:', data.reservation_code)
      toast.success(`Reservación ${data.reservation_code} creada exitosamente`)

      // Recargar reservaciones
      await loadReservations()

      return data
    } catch (err) {
      console.error('❌ Error creating reservation:', err)
      toast.error('Error al crear reservación: ' + err.message)
      throw err
    } finally {
      setOperationLoading(false)
    }
  }, [branchId, user, loadReservations])

  // Actualizar estado de reservación
  const changeReservationStatus = useCallback(async (reservationId, newStatus) => {
    try {
      setOperationLoading(true)
      console.log(`🔄 Changing reservation ${reservationId} status to ${newStatus}`)

      const { data, error } = await reservationService.updateReservationStatus(
        reservationId,
        newStatus,
        user.userInfo.id
      )

      if (error) throw new Error(error.message || 'Error al actualizar estado')

      console.log('✅ Status updated successfully')
      toast.success('Estado actualizado exitosamente')

      // Actualizar localmente
      setReservations(prev => prev.map(reservation => 
        reservation.id === reservationId 
          ? { ...reservation, status: newStatus }
          : reservation
      ))

      return data
    } catch (err) {
      console.error('❌ Error changing status:', err)
      toast.error('Error al cambiar estado: ' + err.message)
      throw err
    } finally {
      setOperationLoading(false)
    }
  }, [user])

  // Eliminar/cancelar reservación
  const deleteReservation = useCallback(async (reservationId) => {
    try {
      setOperationLoading(true)
      console.log(`🗑️ Cancelling reservation ${reservationId}`)

      const { data, error } = await reservationService.cancelReservation(
        reservationId,
        user.userInfo.id,
        'Cancelada por el usuario'
      )

      if (error) throw new Error(error.message || 'Error al cancelar reservación')

      console.log('✅ Reservation cancelled successfully')
      toast.success('Reservación cancelada exitosamente')

      // Actualizar localmente
      setReservations(prev => prev.map(reservation => 
        reservation.id === reservationId 
          ? { ...reservation, status: RESERVATION_STATUS.CANCELLED }
          : reservation
      ))

      return data
    } catch (err) {
      console.error('❌ Error cancelling reservation:', err)
      toast.error('Error al cancelar reservación: ' + err.message)
      throw err
    } finally {
      setOperationLoading(false)
    }
  }, [user])

  // Buscar huéspedes
  const searchGuests = useCallback(async (searchTerm) => {
    try {
      console.log('🔍 Searching guests:', searchTerm)
      const { data, error } = await extendedGuestService.searchGuests(searchTerm, 10)
      
      if (error) throw new Error(error.message)
      
      return data || []
    } catch (err) {
      console.error('❌ Error searching guests:', err)
      return []
    }
  }, [])

  // Obtener habitaciones disponibles
  const getAvailableRoomsForDates = useCallback(async (checkInDate, checkOutDate) => {
    if (!branchId) return []

    try {
      console.log('🏠 Getting available rooms for dates:', { checkInDate, checkOutDate })
      
      const { data, error } = await roomService.getAvailableRooms(
        branchId,
        checkInDate,
        checkOutDate
      )

      if (error) throw new Error(error.message)

      // Transformar datos para tu UI
      const transformedRooms = (data || []).map(room => ({
        id: room.room_id,
        number: room.room_number,
        type: 'Estándar',
        capacity: 2,
        base_rate: room.base_price || 0,
        rate: room.base_price || 0,
        features: []
      }))

      console.log(`✅ Found ${transformedRooms.length} available rooms`)
      return transformedRooms
    } catch (err) {
      console.error('❌ Error getting available rooms:', err)
      throw err
    }
  }, [branchId])

  // Verificar disponibilidad de habitación
  const checkRoomAvailability = useCallback(async (roomId, checkInDate, checkOutDate) => {
    try {
      // Esta función la puedes implementar usando syncService.verifyRoomAvailability
      // Por ahora retornamos true
      return { isAvailable: true, conflicts: [] }
    } catch (err) {
      console.error('❌ Error checking room availability:', err)
      return { isAvailable: false, conflicts: [] }
    }
  }, [])

  // Actualizar reservación (placeholder)
  const updateReservation = useCallback(async (reservationId, updateData) => {
    try {
      setOperationLoading(true)
      console.log('📝 Updating reservation:', reservationId, updateData)
      
      // TODO: Implementar actualización completa
      toast.info('Función de actualización en desarrollo')
      
      return { success: true }
    } catch (err) {
      console.error('❌ Error updating reservation:', err)
      toast.error('Error al actualizar reservación')
      throw err
    } finally {
      setOperationLoading(false)
    }
  }, [])

  // Refresh
  const refresh = useCallback(() => {
    return loadReservations()
  }, [loadReservations])

  // Estadísticas calculadas
  const getReservationStats = useCallback(() => {
    return {
      total: reservations.length,
      pending: reservations.filter(r => r.status === RESERVATION_STATUS.PENDING).length,
      confirmed: reservations.filter(r => r.status === RESERVATION_STATUS.CONFIRMED).length,
      checkedIn: reservations.filter(r => r.status === RESERVATION_STATUS.CHECKED_IN).length,
      checkedOut: reservations.filter(r => r.status === RESERVATION_STATUS.CHECKED_OUT).length,
      cancelled: reservations.filter(r => r.status === RESERVATION_STATUS.CANCELLED).length,
      totalRevenue: reservations
        .filter(r => [RESERVATION_STATUS.CHECKED_IN, RESERVATION_STATUS.CHECKED_OUT].includes(r.status))
        .reduce((sum, r) => sum + (r.totalAmount || 0), 0),
      paidRevenue: reservations.reduce((sum, r) => sum + (r.paidAmount || 0), 0),
      pendingRevenue: reservations.reduce((sum, r) => sum + ((r.totalAmount || 0) - (r.paidAmount || 0)), 0)
    }
  }, [reservations])

  return {
    // Data
    reservations,
    allReservations,
    
    // State
    loading,
    operationLoading,
    error,
    filters,
    pagination,
    
    // Actions
    setFilters,
    setPagination,
    createReservation,
    updateReservation,
    deleteReservation,
    changeReservationStatus,
    searchGuests,
    getAvailableRoomsForDates,
    checkRoomAvailability,
    refresh,
    getReservationStats,
    
    // Constants
    RESERVATION_STATUS
  }
}