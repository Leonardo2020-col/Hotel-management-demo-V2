// src/hooks/useReservations.js
import { useState, useEffect, useCallback } from 'react'
import { reservationService, paymentService, roomService, guestService } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export const useReservations = () => {
  const { userInfo, primaryBranch } = useAuth()
  
  // Estados principales
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Estados para datos auxiliares
  const [paymentMethods, setPaymentMethods] = useState([])
  const [availableRooms, setAvailableRooms] = useState([])
  const [searchResults, setSearchResults] = useState([])

  // Estados para filtros
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    guestName: '',
    roomNumber: ''
  })

  // Estado para paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  })

  // Cargar métodos de pago al inicializar
  useEffect(() => {
    loadPaymentMethods()
  }, [])

  // Cargar reservaciones cuando cambie la sucursal o filtros
  useEffect(() => {
    if (primaryBranch?.id) {
      loadReservations()
    }
  }, [primaryBranch?.id, filters, pagination.page])

  // =====================================================
  // 📊 FUNCIONES DE CARGA DE DATOS
  // =====================================================

  const loadReservations = useCallback(async () => {
    if (!primaryBranch?.id) {
      console.warn('⚠️ No hay sucursal primaria disponible')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Cargando reservaciones para sucursal:', primaryBranch.name)

      const { data, error: reservationError } = await reservationService.getReservationsByBranch(
        primaryBranch.id,
        {
          ...filters,
          limit: pagination.limit,
          offset: (pagination.page - 1) * pagination.limit
        }
      )

      if (reservationError) {
        throw reservationError
      }

      console.log('✅ Reservaciones cargadas:', data?.length || 0)
      setReservations(data || [])

      // Actualizar total para paginación (simulado por ahora)
      setPagination(prev => ({
        ...prev,
        total: data?.length || 0
      }))

    } catch (err) {
      console.error('❌ Error cargando reservaciones:', err)
      setError(err.message || 'Error al cargar reservaciones')
      toast.error('Error al cargar reservaciones')
      setReservations([])
    } finally {
      setLoading(false)
    }
  }, [primaryBranch?.id, filters, pagination.page, pagination.limit])

  const loadPaymentMethods = async () => {
    try {
      const { data, error } = await paymentService.getPaymentMethods()
      if (error) throw error
      setPaymentMethods(data || [])
    } catch (err) {
      console.error('❌ Error cargando métodos de pago:', err)
      toast.error('Error al cargar métodos de pago')
    }
  }

  const loadAvailableRooms = async (checkInDate, checkOutDate) => {
    if (!primaryBranch?.id || !checkInDate || !checkOutDate) {
      setAvailableRooms([])
      return
    }

    try {
      const { data, error } = await roomService.getAvailableRooms(
        primaryBranch.id,
        checkInDate,
        checkOutDate
      )

      if (error) throw error
      setAvailableRooms(data || [])
      return data || []
    } catch (err) {
      console.error('❌ Error cargando habitaciones disponibles:', err)
      toast.error('Error al cargar habitaciones disponibles')
      setAvailableRooms([])
      return []
    }
  }

  // =====================================================
  // 🎫 FUNCIONES DE GESTIÓN DE RESERVACIONES
  // =====================================================

  const createReservation = async (reservationData, guestData) => {
    if (!userInfo?.id || !primaryBranch?.id) {
      toast.error('Error de autenticación')
      return { success: false, error: 'Usuario no autenticado' }
    }

    try {
      setCreating(true)

      console.log('🎫 Creando nueva reservación...', { reservationData, guestData })

      const { data, error } = await reservationService.createReservation(
        {
          ...reservationData,
          branchId: primaryBranch.id,
          createdBy: userInfo.id
        },
        guestData
      )

      if (error) throw error

      console.log('✅ Reservación creada exitosamente:', data)
      
      // Recargar reservaciones
      await loadReservations()
      
      toast.success(`Reservación ${data.reservation_code} creada exitosamente`)
      
      return { 
        success: true, 
        data: data,
        reservationCode: data.reservation_code 
      }

    } catch (err) {
      console.error('❌ Error creando reservación:', err)
      
      let errorMessage = 'Error al crear la reservación'
      if (err.message?.includes('duplicate key')) {
        errorMessage = 'Ya existe una reservación para estas fechas'
      } else if (err.message?.includes('foreign key')) {
        errorMessage = 'Datos de reservación inválidos'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setCreating(false)
    }
  }

  const updateReservationStatus = async (reservationId, newStatus, reason = '') => {
    if (!userInfo?.id) {
      toast.error('Error de autenticación')
      return { success: false }
    }

    try {
      setUpdating(true)

      console.log('🔄 Actualizando estado de reservación:', { reservationId, newStatus, reason })

      const { data, error } = await reservationService.updateReservationStatus(
        reservationId,
        newStatus,
        userInfo.id
      )

      if (error) throw error

      // Actualizar la reservación en el estado local
      setReservations(prev => prev.map(reservation => 
        reservation.id === reservationId 
          ? { ...reservation, status: data.status }
          : reservation
      ))

      const statusMessages = {
        'confirmada': 'Reservación confirmada',
        'cancelada': 'Reservación cancelada',
        'en_uso': 'Check-in realizado',
        'completada': 'Check-out completado'
      }

      toast.success(statusMessages[newStatus] || 'Estado actualizado')
      
      return { success: true, data }

    } catch (err) {
      console.error('❌ Error actualizando estado:', err)
      toast.error('Error al actualizar el estado de la reservación')
      return { success: false, error: err.message }
    } finally {
      setUpdating(false)
    }
  }

  const confirmReservation = async (reservationId) => {
    return updateReservationStatus(reservationId, 'confirmada')
  }

  const cancelReservation = async (reservationId, reason = '') => {
    return updateReservationStatus(reservationId, 'cancelada', reason)
  }

  // =====================================================
  // 💳 FUNCIONES DE PAGOS
  // =====================================================

  const addPayment = async (reservationId, paymentData) => {
    if (!userInfo?.id) {
      toast.error('Error de autenticación')
      return { success: false }
    }

    try {
      console.log('💳 Agregando pago a reservación:', { reservationId, paymentData })

      const { data, error } = await reservationService.addPayment(reservationId, {
        ...paymentData,
        processedBy: userInfo.id
      })

      if (error) throw error

      // Recargar reservaciones para actualizar balances
      await loadReservations()

      toast.success(`Pago de S/ ${paymentData.amount} registrado exitosamente`)
      
      return { success: true, data }

    } catch (err) {
      console.error('❌ Error agregando pago:', err)
      toast.error('Error al registrar el pago')
      return { success: false, error: err.message }
    }
  }

  const getReservationPayments = async (reservationId) => {
    try {
      const { data, error } = await reservationService.getReservationPayments(reservationId)
      if (error) throw error
      return { success: true, data: data || [] }
    } catch (err) {
      console.error('❌ Error obteniendo pagos:', err)
      return { success: false, data: [], error: err.message }
    }
  }

  // =====================================================
  // 🔍 FUNCIONES DE BÚSQUEDA
  // =====================================================

  const searchGuests = async (searchTerm) => {
    if (!searchTerm?.trim()) {
      setSearchResults([])
      return []
    }

    try {
      const { data, error } = await guestService.searchGuests(searchTerm, 10)
      if (error) throw error
      
      setSearchResults(data || [])
      return data || []
    } catch (err) {
      console.error('❌ Error buscando huéspedes:', err)
      setSearchResults([])
      return []
    }
  }

  const searchReservations = async (searchTerm) => {
    if (!primaryBranch?.id || !searchTerm?.trim()) {
      return []
    }

    try {
      const { data, error } = await reservationService.searchReservations(
        primaryBranch.id,
        searchTerm
      )
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('❌ Error buscando reservaciones:', err)
      return []
    }
  }

  // =====================================================
  // 📊 FUNCIONES DE FILTROS Y PAGINACIÓN
  // =====================================================

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset a primera página
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      dateFrom: '',
      dateTo: '',
      guestName: '',
      roomNumber: ''
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const changePage = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  // =====================================================
  // 📈 FUNCIONES DE ESTADÍSTICAS
  // =====================================================

  const getReservationStats = () => {
    const stats = {
      total: reservations.length,
      pendientes: reservations.filter(r => r.status?.status === 'pendiente').length,
      confirmadas: reservations.filter(r => r.status?.status === 'confirmada').length,
      enUso: reservations.filter(r => r.status?.status === 'en_uso').length,
      completadas: reservations.filter(r => r.status?.status === 'completada').length,
      canceladas: reservations.filter(r => r.status?.status === 'cancelada').length,
      totalRevenue: reservations.reduce((sum, r) => sum + (r.total_amount || 0), 0),
      totalPaid: reservations.reduce((sum, r) => sum + (r.paid_amount || 0), 0),
      pendingPayments: reservations.reduce((sum, r) => sum + (r.balance || 0), 0)
    }

    return stats
  }

  const getTodayReservations = () => {
    const today = new Date().toDateString()
    return reservations.filter(r => {
      const checkIn = new Date(r.check_in_date).toDateString()
      const checkOut = new Date(r.check_out_date).toDateString()
      return checkIn === today || checkOut === today
    })
  }

  // =====================================================
  // 🔄 FUNCIONES DE REFRESCADO
  // =====================================================

  const refreshReservations = async () => {
    await loadReservations()
  }

  const refreshData = async () => {
    await Promise.all([
      loadReservations(),
      loadPaymentMethods()
    ])
  }

  // =====================================================
  // 📱 UTILIDADES
  // =====================================================

  const formatReservationForDisplay = (reservation) => {
    return {
      ...reservation,
      guestName: reservation.guest?.full_name || 'Sin nombre',
      roomNumber: reservation.room?.room_number || 'Sin habitación',
      statusColor: reservation.status?.color || '#6b7280',
      statusText: reservation.status?.status || 'Sin estado',
      formattedTotal: new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
      }).format(reservation.total_amount || 0),
      formattedBalance: new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
      }).format(reservation.balance || 0),
      checkInFormatted: new Intl.DateTimeFormat('es-PE').format(
        new Date(reservation.check_in_date)
      ),
      checkOutFormatted: new Intl.DateTimeFormat('es-PE').format(
        new Date(reservation.check_out_date)
      )
    }
  }

  // =====================================================
  // 🎯 RETORNO DEL HOOK
  // =====================================================

  return {
    // Estados principales
    reservations: reservations.map(formatReservationForDisplay),
    loading,
    error,
    creating,
    updating,

    // Datos auxiliares
    paymentMethods,
    availableRooms,
    searchResults,

    // Filtros y paginación
    filters,
    pagination,

    // Funciones principales
    createReservation,
    updateReservationStatus,
    confirmReservation,
    cancelReservation,

    // Funciones de pagos
    addPayment,
    getReservationPayments,

    // Funciones de búsqueda
    searchGuests,
    searchReservations,
    loadAvailableRooms,

    // Funciones de filtros
    updateFilters,
    clearFilters,
    changePage,

    // Funciones de estadísticas
    getReservationStats,
    getTodayReservations,

    // Funciones de refrescado
    refreshReservations,
    refreshData,

    // Información de contexto
    currentBranch: primaryBranch,
    currentUser: userInfo
  }
}