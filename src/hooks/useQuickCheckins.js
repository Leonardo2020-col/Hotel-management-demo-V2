// src/hooks/useQuickCheckins.js
import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  hotelService, 
  roomService, 
  quickCheckinService, 
  snackService, 
  paymentService,
  guestService,
  utilityService,
  realtimeService
} from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export const useQuickCheckins = () => {
  const { userInfo, getPrimaryBranch } = useAuth()
  const [roomsByFloor, setRoomsByFloor] = useState({})
  const [activeCheckins, setActiveCheckins] = useState({})
  const [snackTypes, setSnackTypes] = useState([])
  const [snackItems, setSnackItems] = useState([])
  const [roomPrices, setRoomPrices] = useState({})
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const currentBranch = getPrimaryBranch()
  const currentBranchId = currentBranch?.id
  const realtimeChannelRef = useRef(null)

  // ✅ FUNCIÓN PRINCIPAL PARA OBTENER DATOS DEL DASHBOARD
  const fetchDashboardData = useCallback(async () => {
    if (!currentBranchId) {
      setError('No se encontró sucursal activa')
      setLoading(false)
      return
    }

    try {
      setError(null)
      console.log('🔄 Fetching dashboard data for branch:', currentBranchId)
      
      // 🎯 Usar servicio optimizado para obtener todos los datos
      const dashboardData = await hotelService.getCheckinDashboardData(currentBranchId)
      
      if (dashboardData.error) {
        throw dashboardData.error
      }

      // 📊 Procesar datos de habitaciones por piso
      const roomsGrouped = {}
      const prices = {}
      const activeCheckinsMap = {}

      dashboardData.rooms?.forEach(room => {
        const floor = room.floor || Math.floor(parseInt(room.room_number) / 100)
        
        if (!roomsGrouped[floor]) {
          roomsGrouped[floor] = []
        }

        // 🎯 Determinar estado real de la habitación
        let roomStatus = room.room_status?.status || 'disponible'
        let cleaning_status = 'clean'
        let quickCheckin = null

        // Buscar quick check-in activo para esta habitación
        const activeQuickCheckin = dashboardData.quickCheckins?.find(qc => qc.room_id === room.id)
        if (activeQuickCheckin) {
          roomStatus = 'occupied'
          quickCheckin = {
            id: activeQuickCheckin.id,
            guest_name: activeQuickCheckin.guest_name,
            guest_document: activeQuickCheckin.guest_document,
            guest_phone: activeQuickCheckin.guest_phone,
            check_in_date: activeQuickCheckin.check_in_date,
            check_out_date: activeQuickCheckin.check_out_date,
            total_amount: activeQuickCheckin.amount,
            room_rate: room.base_price,
            payment_method: activeQuickCheckin.payment_method?.name,
            confirmation_code: utilityService.generateConfirmationCode('QC'),
            snacks_consumed: [],
            document_type: activeQuickCheckin.guest_document?.split(':')[0] || 'DNI',
            document_number: activeQuickCheckin.guest_document?.split(':')[1] || '',
            phone: activeQuickCheckin.guest_phone
          }
        }

        // Buscar check-in de reservación activo
        const activeReservationCheckin = dashboardData.reservationCheckins?.find(rc => rc.room_id === room.id)
        if (activeReservationCheckin && !quickCheckin) {
          roomStatus = 'occupied'
          quickCheckin = {
            id: activeReservationCheckin.id,
            guest_name: activeReservationCheckin.reservation?.guest?.full_name,
            guest_document: activeReservationCheckin.reservation?.guest?.document_number,
            guest_phone: activeReservationCheckin.reservation?.guest?.phone,
            check_in_date: activeReservationCheckin.check_in_time?.split('T')[0],
            check_out_date: activeReservationCheckin.expected_checkout,
            total_amount: activeReservationCheckin.reservation?.total_amount,
            room_rate: room.base_price,
            confirmation_code: activeReservationCheckin.reservation?.reservation_code,
            snacks_consumed: [],
            isFromReservation: true,
            document_type: activeReservationCheckin.reservation?.guest?.document_type || 'DNI',
            document_number: activeReservationCheckin.reservation?.guest?.document_number || '',
            phone: activeReservationCheckin.reservation?.guest?.phone
          }
        }

        // Determinar si necesita limpieza
        if (roomStatus !== 'occupied' && roomStatus !== 'disponible') {
          cleaning_status = 'dirty'
        }

        const processedRoom = {
          id: room.id,
          room_id: room.id,
          number: room.room_number,
          floor: floor,
          base_price: room.base_price,
          description: room.description,
          status: roomStatus,
          cleaning_status: cleaning_status,
          quickCheckin: quickCheckin,
          available: roomStatus === 'disponible' && cleaning_status === 'clean',
          status_color: room.room_status?.color || '#22c55e'
        }

        roomsGrouped[floor].push(processedRoom)
        prices[floor] = room.base_price

        // Agregar a active checkins si existe
        if (quickCheckin) {
          activeCheckinsMap[room.room_number] = quickCheckin
        }
      })

      // Actualizar estados
      setRoomsByFloor(roomsGrouped)
      setRoomPrices(prices)
      setActiveCheckins(activeCheckinsMap)
      setSnackTypes(dashboardData.snackCategories)
      setSnackItems(dashboardData.snackItems)
      setPaymentMethods(dashboardData.paymentMethods)

      console.log('✅ Dashboard data loaded successfully')

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error)
      setError(error.message)
      toast.error('Error al cargar datos del dashboard')
    }
  }, [currentBranchId])

  // ✅ FUNCIÓN DE REFRESH OPTIMIZADA
  const refreshData = useCallback(async () => {
    setLoading(true)
    await fetchDashboardData()
    setLoading(false)
  }, [fetchDashboardData])

  // ✅ CONFIGURAR ACTUALIZACIONES EN TIEMPO REAL
  useEffect(() => {
    if (!currentBranchId) return

    // Cleanup anterior
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.unsubscribe()
    }

    // Configurar nueva suscripción
    realtimeChannelRef.current = realtimeService.subscribeToRoomChanges(
      currentBranchId,
      (payload) => {
        console.log('🔄 Real-time update received:', payload)
        // Refrescar datos cuando hay cambios
        fetchDashboardData()
      }
    )

    return () => {
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.unsubscribe()
      }
    }
  }, [currentBranchId, fetchDashboardData])

  // ✅ EFECTO INICIAL
  useEffect(() => {
    if (currentBranchId) {
      refreshData()
    }
  }, [currentBranchId, refreshData])

  // =====================================================
  // 🚀 FUNCIONES DE QUICK CHECK-IN OPTIMIZADAS
  // =====================================================

  // ✅ PROCESAR QUICK CHECK-IN (WALK-IN)
  const processQuickCheckIn = useCallback(async (orderData, guestData, selectedSnacks = []) => {
    if (!currentBranchId || !userInfo?.id) {
      throw new Error('Información de usuario o sucursal faltante')
    }

    try {
      console.log('🔄 Processing quick check-in:', { orderData, guestData, selectedSnacks })

      // 1️⃣ Validar datos del huésped
      const validation = utilityService.validateGuestData(guestData)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      // 2️⃣ Obtener método de pago
      const { data: paymentMethod } = await paymentService.getPaymentMethodByName('efectivo')
      const paymentMethodId = paymentMethod?.id || paymentMethods[0]?.id

      // 3️⃣ Calcular total con snacks
      const snacksTotal = selectedSnacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0)
      const totalAmount = (orderData.roomPrice || 0) + snacksTotal

      // 4️⃣ Preparar datos para el servicio
      const quickCheckinData = {
        branchId: currentBranchId,
        roomId: orderData.room.id,
        checkInDate: orderData.checkInDate || new Date().toISOString().split('T')[0],
        checkOutDate: orderData.checkOutDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalAmount: totalAmount,
        paymentMethodId: paymentMethodId,
        createdBy: userInfo.id
      }

      // 5️⃣ Crear quick check-in usando el servicio optimizado
      const result = await quickCheckinService.createQuickCheckin(
        quickCheckinData, 
        guestData, 
        selectedSnacks
      )

      if (result.error) {
        throw result.error
      }

      // 6️⃣ Actualizar estado de habitación a ocupada
      await roomService.updateRoomStatus(orderData.room.id, 'ocupada')

      // 7️⃣ Procesar consumo de snacks si existen
      if (selectedSnacks.length > 0) {
        const snacksWithStock = selectedSnacks.map(snack => ({
          ...snack,
          currentStock: snackItems.find(item => item.id === snack.id)?.stock || 0
        }))

        await snackService.processSnackConsumption(snacksWithStock)
      }

      // 8️⃣ Refrescar datos
      await fetchDashboardData()

      return { 
        data: { 
          ...result.data,
          totalAmount,
          confirmationCode: utilityService.generateConfirmationCode('QC'),
          snacksIncluded: selectedSnacks.length > 0
        }, 
        error: null 
      }

    } catch (error) {
      console.error('❌ Error in processQuickCheckIn:', error)
      return { data: null, error }
    }
  }, [currentBranchId, userInfo, paymentMethods, snackItems, fetchDashboardData])

  // ✅ PROCESAR QUICK CHECK-OUT
  const processQuickCheckOut = useCallback(async (roomNumber, paymentMethod = 'efectivo') => {
    if (!currentBranchId || !userInfo?.id) {
      throw new Error('Información de usuario o sucursal faltante')
    }

    try {
      console.log('🚪 Processing quick check-out for room:', roomNumber)

      // 1️⃣ Buscar el check-in activo en el estado local
      const activeCheckin = activeCheckins[roomNumber]
      if (!activeCheckin) {
        throw new Error(`No se encontró check-in activo para la habitación ${roomNumber}`)
      }

      // 2️⃣ Procesar check-out usando el servicio optimizado
      const checkoutData = {
        totalCharges: activeCheckin.total_amount,
        additionalCharges: [], // Se puede expandir para servicios adicionales
        processedBy: userInfo.id
      }

      const result = await quickCheckinService.processQuickCheckout(
        activeCheckin.id, 
        checkoutData
      )

      if (result.error) {
        throw result.error
      }

      // 3️⃣ Encontrar la habitación y cambiar estado a limpieza
      const room = Object.values(roomsByFloor)
        .flat()
        .find(r => r.number === roomNumber)

      if (room) {
        await roomService.updateRoomStatus(room.id, 'limpieza')
      }

      // 4️⃣ Refrescar datos
      await fetchDashboardData()

      return { 
        data: { 
          ...result.data,
          totalAmount: activeCheckin.total_amount,
          roomNumber: roomNumber,
          guestName: activeCheckin.guest_name
        }, 
        error: null 
      }

    } catch (error) {
      console.error('❌ Error in processQuickCheckOut:', error)
      return { data: null, error }
    }
  }, [currentBranchId, userInfo, activeCheckins, roomsByFloor, fetchDashboardData])

  // ✅ LIMPIAR HABITACIÓN
  const cleanRoom = useCallback(async (roomId) => {
    if (!userInfo?.id) {
      throw new Error('Información de usuario faltante')
    }

    try {
      console.log('🧹 Cleaning room:', roomId)

      // Usar servicio optimizado para cambiar estado
      const result = await roomService.updateRoomStatus(roomId, 'disponible')

      if (result.error) {
        throw result.error
      }

      // Refrescar datos
      await fetchDashboardData()

      return { 
        data: { room: result.data }, 
        error: null 
      }

    } catch (error) {
      console.error('❌ Error in cleanRoom:', error)
      return { data: null, error }
    }
  }, [userInfo, fetchDashboardData])

  // =====================================================
  // 👥 FUNCIONES DE BÚSQUEDA DE HUÉSPEDES
  // =====================================================

  // ✅ BUSCAR HUÉSPEDES EXISTENTES
  const searchGuests = useCallback(async (searchTerm) => {
    if (!searchTerm?.trim()) {
      return { data: [], error: null }
    }

    try {
      const result = await guestService.searchGuests(searchTerm, 10)
      return result
    } catch (error) {
      console.error('❌ Error searching guests:', error)
      return { data: [], error }
    }
  }, [])

  // ✅ CREAR NUEVO HUÉSPED
  const createGuest = useCallback(async (guestData) => {
    try {
      // Validar datos
      const validation = utilityService.validateGuestData(guestData)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      const result = await guestService.createGuest(guestData)
      return result
    } catch (error) {
      console.error('❌ Error creating guest:', error)
      return { data: null, error }
    }
  }, [])

  // =====================================================
  // 📊 FUNCIONES DE ESTADÍSTICAS
  // =====================================================

  // ✅ OBTENER ESTADÍSTICAS
  const getStats = useCallback(() => {
    const allRooms = Object.values(roomsByFloor).flat()
    const total = allRooms.length
    const occupied = allRooms.filter(r => r.status === 'occupied').length
    const available = allRooms.filter(r => r.status === 'disponible' && r.cleaning_status === 'clean').length
    const needsCleaning = allRooms.filter(r => r.cleaning_status === 'dirty' || r.status === 'limpieza').length
    const maintenance = allRooms.filter(r => r.status === 'mantenimiento').length

    return {
      total,
      occupied,
      available,
      needsCleaning,
      maintenance,
      occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0
    }
  }, [roomsByFloor])

  // ✅ OBTENER INGRESOS PENDIENTES
  const getPendingRevenue = useCallback(() => {
    return Object.values(activeCheckins).reduce((total, checkin) => {
      return total + (checkin.total_amount || 0)
    }, 0)
  }, [activeCheckins])

  // ✅ OBTENER HABITACIONES DISPONIBLES
  const getAvailableRooms = useCallback((floor = null) => {
    const allRooms = Object.values(roomsByFloor).flat()
    const available = allRooms.filter(r => r.available)
    
    if (floor !== null) {
      return available.filter(r => r.floor === floor)
    }
    
    return available
  }, [roomsByFloor])

  // =====================================================
  // 🔧 FUNCIONES AUXILIARES
  // =====================================================

  // ✅ FORMATEAR PRECIO
  const formatPrice = useCallback((amount) => {
    return utilityService.formatPrice(amount)
  }, [])

  // ✅ VALIDAR DATOS DE HUÉSPED
  const validateGuestData = useCallback((guestData) => {
    return utilityService.validateGuestData(guestData)
  }, [])

  // ✅ OBTENER MÉTODO DE PAGO POR NOMBRE
  const getPaymentMethodByName = useCallback((name) => {
    return paymentMethods.find(pm => pm.name === name)
  }, [paymentMethods])

  return {
    // 📊 Estado principal
    roomsByFloor,
    activeCheckins,
    snackTypes,
    snackItems,
    roomPrices,
    paymentMethods,
    loading,
    error,
    
    // 🔄 Funciones principales de check-in
    processQuickCheckIn,
    processQuickCheckOut,
    cleanRoom,
    refreshData,
    
    // 👥 Funciones de huéspedes
    searchGuests,
    createGuest,
    
    // 📈 Estadísticas y consultas
    getStats,
    getPendingRevenue,
    getAvailableRooms,
    
    // 🔧 Funciones auxiliares
    formatPrice,
    validateGuestData,
    getPaymentMethodByName,
    
    // 🏪 Información de contexto
    currentBranch,
    currentBranchId,
    
    // 🛠️ Servicios expuestos para uso avanzado
    services: {
      hotel: hotelService,
      room: roomService,
      quickCheckin: quickCheckinService,
      snack: snackService,
      payment: paymentService,
      guest: guestService,
      utility: utilityService
    }
  }
}