// src/pages/CheckIn/CheckIn.jsx - VERSIÓN SIMPLIFICADA CON CLICK DIRECTO
import React, { useState, useEffect } from 'react'
import { RefreshCw, Sparkles, User, CreditCard } from 'lucide-react'
import Button from '../../components/common/Button'
import RoomGrid from '../../components/checkin/RoomGrid'
import SnackSelection from '../../components/checkin/SnackSelection'
import CheckoutSummary from '../../components/checkin/CheckoutSummary'
import QuickCheckoutModal from '../../components/checkin/QuickCheckoutModal'
import { useCheckInData } from '../../hooks/useCheckInData'
import { db } from '../../lib/supabase'
import toast from 'react-hot-toast'

const CheckIn = () => {
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [orderStep, setOrderStep] = useState(0)
  const [selectedSnackType, setSelectedSnackType] = useState(null)
  const [selectedSnacks, setSelectedSnacks] = useState([])
  const [currentOrder, setCurrentOrder] = useState(null)
  const [processingRoom, setProcessingRoom] = useState(null) // Para mostrar loading
  const [showQuickCheckout, setShowQuickCheckout] = useState(false) // Para modal de check-out
  const [quickCheckoutData, setQuickCheckoutData] = useState(null) // Datos para el modal
  
  // Estado para datos del huésped
  const [guestData, setGuestData] = useState({
    fullName: '',
    documentType: 'DNI',
    documentNumber: '',
    phone: '',
    email: '',
    nationality: 'Peruana',
    gender: '',
    adults: 1,
    children: 0,
    specialRequests: ''
  })

  const {
    floorRooms,
    roomsByFloor,
    snackTypes,
    snackItems,
    roomPrices,
    savedOrders,
    loading,
    error,
    processCheckIn,
    processCheckOut,
    cleanRoom,
    refreshData,
    debugData,
    setSavedOrders,
    hasQuickCleanCapability
  } = useCheckInData()

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (orderStep === 0) { // Solo refrescar si estamos en la vista principal
        refreshData()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [orderStep, refreshData])

  // Seleccionar piso automáticamente
  useEffect(() => {
    const rooms = floorRooms || roomsByFloor
    if (rooms && typeof rooms === 'object') {
      const availableFloors = Object.keys(rooms).map(f => parseInt(f)).filter(f => !isNaN(f))
      if (availableFloors.length > 0 && !availableFloors.includes(selectedFloor)) {
        const firstFloor = Math.min(...availableFloors)
        setSelectedFloor(firstFloor)
      }
    }
  }, [floorRooms, roomsByFloor, selectedFloor])

  const getRoomsData = () => {
    const rooms = floorRooms || roomsByFloor
    return rooms || {}
  }

  const handleFloorChange = (floor) => {
    setSelectedFloor(floor)
    setSelectedRoom(null)
  }

  // FUNCIÓN PRINCIPAL: Manejo inteligente de clicks en habitaciones
  const handleRoomClick = async (room) => {
    if (loading || processingRoom === room.number) {
      return
    }

    setProcessingRoom(room.number)
    console.log('🔘 Room clicked:', room)

    try {
      // LÓGICA BASADA EN EL ESTADO DE LA HABITACIÓN
      
      if (room.status === 'available' && room.cleaning_status === 'clean') {
        // ✅ HABITACIÓN DISPONIBLE - INICIAR CHECK-IN DIRECTO
        await handleDirectCheckIn(room)
        
      } else if (room.status === 'occupied') {
        // 🚪 HABITACIÓN OCUPADA - PROCESAR CHECK-OUT DIRECTO
        await handleDirectCheckOut(room)
        
      } else if (room.cleaning_status === 'dirty' || room.status === 'cleaning') {
        // 🧹 HABITACIÓN SUCIA - LIMPIAR AUTOMÁTICAMENTE
        await handleQuickClean(room.id || room.room_id)
        
      } else {
        // ⚠️ OTROS ESTADOS
        toast.warning(`Habitación ${room.number} no disponible (Estado: ${room.status})`)
      }
      
    } catch (error) {
      console.error('❌ Error processing room click:', error)
      toast.error('Error inesperado al procesar la habitación')
    } finally {
      setProcessingRoom(null)
    }
  }

  // CHECK-IN DIRECTO - Ir directamente al formulario de huésped
  const handleDirectCheckIn = async (room) => {
    console.log('🏨 Starting direct check-in for room:', room.number)
    
    const floor = Math.floor(parseInt(room.number) / 100)
    const roomPrice = roomPrices && roomPrices[floor] ? roomPrices[floor] : 100
    
    // Resetear datos del huésped
    setGuestData({
      fullName: '',
      documentType: 'DNI',
      documentNumber: '',
      phone: '',
      email: '',
      nationality: 'Peruana',
      gender: '',
      adults: 1,
      children: 0,
      specialRequests: ''
    })
    
    setSelectedRoom(room)
    setCurrentOrder({
      room: room,
      roomPrice: roomPrice,
      snacks: [],
      total: roomPrice
    })
    setOrderStep(1) // Ir directamente al formulario de huésped
    
    toast.success(`Iniciando check-in para habitación ${room.number}`, {
      icon: '🏨',
      duration: 2000
    })
  }

  // CHECK-OUT DIRECTO - Ir primero a selección de snacks
  const handleDirectCheckOut = async (room) => {
    console.log('🚪 Starting direct check-out for room:', room.number)
    
    // Buscar información de la reserva
    let orderFound = null
    
    // 1. Buscar en savedOrders
    if (savedOrders && savedOrders[room.number]) {
      orderFound = savedOrders[room.number]
    }
    
    // 2. Buscar por reservationId
    if (!orderFound && room.reservationId) {
      const orderByReservationId = Object.values(savedOrders || {}).find(
        order => order.reservationId === room.reservationId
      )
      if (orderByReservationId) {
        orderFound = orderByReservationId
      }
    }
    
    // 3. Buscar en base de datos
    if (!orderFound) {
      const reservation = await searchReservationForRoom(room)
      if (reservation) {
        orderFound = createTemporaryOrderFromReservation(room, reservation)
      }
    }
    
    // 4. Crear orden temporal si no se encuentra
    if (!orderFound) {
      if (room.currentGuest || room.guestName || room.activeReservation) {
        orderFound = createTemporaryOrderFromRoomData(room)
      } else {
        // Mostrar opción de check-out manual
        await handleManualCheckOut(room)
        return
      }
    }
    
    // Ir a selección de snacks para agregar servicios adicionales
    if (orderFound) {
      console.log('📋 Order found for checkout, setting up guest data:', orderFound)
      
      // Configurar datos del huésped desde la orden existente
      setGuestData({
        fullName: orderFound.guestName || orderFound.guest?.full_name || 'Huésped',
        documentType: orderFound.guestDocumentType || orderFound.guest?.document_type || 'DNI',
        documentNumber: orderFound.guestDocument || orderFound.guest?.document_number || '',
        phone: orderFound.guestPhone || orderFound.guest?.phone || '',
        email: orderFound.guestEmail || orderFound.guest?.email || '',
        nationality: orderFound.nationality || 'Peruana',
        gender: '',
        adults: orderFound.adults || 1,
        children: orderFound.children || 0,
        specialRequests: orderFound.specialRequests || ''
      })
      
      // Resetear snacks para nueva selección
      setSelectedSnacks(orderFound.snacks || [])
      setSelectedSnackType(null)
      
      setSelectedRoom(room)
      setCurrentOrder({
        ...orderFound,
        isCheckout: true, // Flag para indicar que es check-out
        originalTotal: orderFound.total || orderFound.roomPrice // Guardar total original
      })
      setOrderStep(1) // Ir a selección de snacks
      
      toast.success(`Agregando servicios adicionales para habitación ${room.number}`, {
        icon: '🛒',
        duration: 2000
      })
    } else {
      console.error('❌ No order found for checkout')
      toast.error('No se encontró información de reserva para esta habitación')
    }
  }

  // Confirmación rápida de check-out con modal
  const showCheckOutConfirmation = (order) => {
    setQuickCheckoutData(order)
    setShowQuickCheckout(true)
  }

  // Manejar confirmación desde el modal
  const handleQuickCheckoutConfirm = async (paymentMethod) => {
    if (!quickCheckoutData) {
      toast.error('No hay datos de check-out')
      return
    }
    
    try {
      setProcessingRoom(quickCheckoutData.room.number)
      await processCheckOutDirectly(quickCheckoutData, paymentMethod)
      setShowQuickCheckout(false)
      setQuickCheckoutData(null)
      resetOrder()
    } catch (error) {
      console.error('Error in quick checkout:', error)
      toast.error('Error al procesar check-out')
    } finally {
      setProcessingRoom(null)
    }
  }

  // Manejar "ver detalle" desde el modal
  const handleViewCheckoutDetails = () => {
    if (!quickCheckoutData) return
    
    setCurrentOrder(quickCheckoutData)
    setOrderStep(2) // Ir a CheckoutSummary
    setShowQuickCheckout(false)
    setQuickCheckoutData(null)
  }

  // Cerrar modal de check-out
  const handleCloseQuickCheckout = () => {
    setShowQuickCheckout(false)
    setQuickCheckoutData(null)
  }

  // Procesar check-out directamente
  const processCheckOutDirectly = async (order, paymentMethod) => {
    try {
      console.log('🚪 Processing check-out:', { order, paymentMethod })
      
      if (!order || !order.room || !order.room.number) {
        throw new Error('Información de habitación incompleta')
      }

      const { data, error } = await processCheckOut(order.room.number, paymentMethod)
      
      if (error) {
        console.error('ProcessCheckOut error:', error)
        toast.error(error.message || 'Error al procesar check-out')
        return
      }

      // Actualizar estado local - remover de savedOrders
      setSavedOrders(prev => {
        const newOrders = { ...prev }
        delete newOrders[order.room.number]
        return newOrders
      })

      toast.success(
        `Check-out completado!\n🏨 Habitación: ${order.room.number}\n👤 ${order.guestName || 'Huésped'}\n💰 S/ ${order.total.toFixed(2)}\n💳 ${getPaymentMethodName(paymentMethod)}`,
        { 
          duration: 4000,
          icon: '✅'
        }
      )
      
      console.log('✅ Check-out completed successfully')
      
    } catch (error) {
      console.error('❌ Error in processCheckOut:', error)
      toast.error('Error inesperado: ' + (error.message || 'Error desconocido'))
    }
  }

  // Check-out manual para habitaciones sin información
  const handleManualCheckOut = async (room) => {
    const confirmed = window.confirm(
      `La habitación ${room.number} está ocupada pero no tiene información de reserva.\n¿Deseas crear un check-out manual?`
    )
    
    if (!confirmed) return
    
    try {
      // Crear huésped temporal
      const { data: guest, error: guestError } = await db.createGuest({
        first_name: 'Huésped',
        last_name: 'Manual',
        email: `manual-${room.number}@hotel.com`,
        phone: '+51999999999',
        document_type: 'DNI',
        document_number: `MANUAL-${room.number}`
      })
      
      if (guestError) throw new Error('Error creando huésped temporal')
      
      // Crear reserva temporal
      const floor = Math.floor(parseInt(room.number) / 100)
      const roomPrice = roomPrices[floor] || 100
      
      const { data: reservation, error: reservationError } = await db.createReservation({
        guest_id: guest.id,
        room_id: room.id,
        branch_id: 1,
        check_in: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        check_out: new Date().toISOString().split('T')[0],
        adults: 1,
        children: 0,
        status: 'checked_in',
        total_amount: roomPrice,
        rate: roomPrice,
        source: 'manual_checkout',
        payment_status: 'pending'
      })
      
      if (reservationError) throw new Error('Error creando reserva temporal')
      
      // Procesar check-out
      const tempOrder = {
        id: reservation.id,
        room: room,
        roomPrice: roomPrice,
        total: roomPrice,
        guestName: `${guest.first_name} ${guest.last_name}`,
        reservationId: reservation.id
      }
      
      showCheckOutConfirmation({
        ...tempOrder,
        isCheckout: true,
        originalTotal: roomPrice
      })
      
    } catch (error) {
      console.error('Error in manual checkout:', error)
      toast.error('Error al crear check-out manual: ' + error.message)
    }
  }

  // Limpieza rápida mejorada
  const handleQuickClean = async (roomId) => {
    try {
      const roomData = Object.values(getRoomsData())
        .flat()
        .find(room => room.id === roomId || room.room_id === roomId)
      
      const roomNumber = roomData?.number || 'desconocida'
      
      // Limpiar sin confirmación para mayor rapidez
      const { data, error } = await cleanRoom(roomId)
      
      if (error) {
        toast.error(`Error al limpiar habitación: ${error.message}`)
        return
      }
      
      toast.success(`Habitación ${roomNumber} limpia y disponible`, {
        icon: '✨',
        duration: 3000,
        style: {
          background: '#10B981',
          color: 'white',
        }
      })
      
    } catch (error) {
      console.error('❌ Error in handleQuickClean:', error)
      toast.error('Error inesperado al limpiar habitación')
    }
  }

  // Funciones auxiliares (mantener las existentes)
  const searchReservationForRoom = async (room) => {
    try {
      const { data: reservations, error } = await db.getReservations({
        roomId: room.id
      })
      
      if (error) return null
      
      return reservations?.find(r => r.status === 'checked_in') ||
             reservations?.find(r => r.status === 'confirmed') || null
      
    } catch (error) {
      console.error('Error searching reservations:', error)
      return null
    }
  }

  const createTemporaryOrderFromReservation = (room, reservation) => {
    const floor = Math.floor(parseInt(room.number) / 100)
    const roomPrice = parseFloat(reservation.rate) || roomPrices[floor] || 100
    
    const order = {
      id: reservation.id,
      room: {
        id: room.id,
        number: room.number,
        status: room.status,
        floor: room.floor || floor,
        room_type: room.room_type || 'Habitación Estándar'
      },
      roomPrice: roomPrice,
      snacks: [],
      total: parseFloat(reservation.total_amount) || roomPrice,
      checkInDate: reservation.check_in,
      checkOutDate: reservation.check_out,
      guestName: reservation.guest?.full_name || 'Huésped',
      guestId: reservation.guest_id,
      reservationId: reservation.id,
      confirmationCode: reservation.confirmation_code
    }
    
    setSavedOrders(prev => ({
      ...prev,
      [room.number]: order
    }))
    
    return order
  }

  const createTemporaryOrderFromRoomData = (room) => {
    const floor = Math.floor(parseInt(room.number) / 100)
    const roomPrice = roomPrices[floor] || 100
    
    return {
      id: `temp-${room.number}`,
      room: room,
      roomPrice: roomPrice,
      snacks: [],
      total: roomPrice,
      checkInDate: room.checkInDate || new Date().toISOString().split('T')[0],
      checkOutDate: room.checkOutDate || new Date().toISOString().split('T')[0],
      guestName: room.guestName || room.currentGuest?.name || 'Huésped',
      reservationId: room.reservationId || null,
      isTemporary: true
    }
  }

  const getPaymentMethodName = (method) => {
    const methods = {
      'cash': 'Efectivo',
      'card': 'Tarjeta',
      'digital': 'Digital (Yape/Plin)'
    }
    return methods[method] || method
  }

  // Handlers para SnackSelection (mantener existentes)
  const handleGuestDataChange = (newGuestData) => {
    setGuestData(newGuestData)
  }

  const handleSnackTypeSelect = (typeId) => {
    setSelectedSnackType(typeId)
  }

  const handleSnackSelect = (snack) => {
    const existingSnack = selectedSnacks.find(s => s.id === snack.id)
    if (existingSnack) {
      setSelectedSnacks(selectedSnacks.map(s => 
        s.id === snack.id 
          ? { ...s, quantity: s.quantity + 1 }
          : s
      ))
    } else {
      setSelectedSnacks([...selectedSnacks, { ...snack, quantity: 1 }])
    }
  }

  const handleSnackRemove = (snackId) => {
    setSelectedSnacks(selectedSnacks.filter(s => s.id !== snackId))
  }

  const handleQuantityUpdate = (snackId, newQuantity) => {
    if (newQuantity <= 0) {
      handleSnackRemove(snackId)
    } else {
      setSelectedSnacks(selectedSnacks.map(s => 
        s.id === snackId 
          ? { ...s, quantity: newQuantity }
          : s
      ))
    }
  }

  const handleConfirmOrder = async () => {
    if (!currentOrder) {
      toast.error('No hay orden actual')
      return
    }

    console.log('🔄 Processing confirm order:', { currentOrder, isCheckout: currentOrder.isCheckout })

    // Verificar si es check-out o check-in
    if (currentOrder.isCheckout) {
      // Es un check-out con servicios adicionales
      if (!guestData.fullName?.trim()) {
        toast.error('Información del huésped incompleta')
        return
      }

      // Actualizar la orden con los nuevos snacks
      const snacksTotal = selectedSnacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0)
      const updatedOrder = {
        ...currentOrder,
        snacks: selectedSnacks,
        total: (currentOrder.originalTotal || currentOrder.roomPrice) + snacksTotal
      }

      console.log('🛒 Updated order for checkout:', updatedOrder)

      // Ir directamente al modal de confirmación de check-out
      showCheckOutConfirmation(updatedOrder)
      return
    }

    // Es un check-in normal
    if (!guestData.fullName?.trim() || !guestData.documentNumber?.trim() || !guestData.phone?.trim()) {
      toast.error('Complete los datos obligatorios del huésped')
      return
    }

    try {
      const { data, error } = await processCheckIn(currentOrder, selectedSnacks, guestData)
      
      if (error) {
        toast.error(error.message || 'Error al procesar check-in')
        return
      }

      const snacksTotal = selectedSnacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0)
      
      toast.success(
        `Check-in completado!\n👤 ${guestData.fullName}\n🏨 Habitación ${currentOrder.room.number}\n💰 S/ ${(currentOrder.roomPrice + snacksTotal).toFixed(2)}`,
        { duration: 5000, icon: '✅' }
      )
      
      resetOrder()
    } catch (error) {
      console.error('Error in handleConfirmOrder:', error)
      toast.error('Error inesperado al procesar check-in')
    }
  }

  const handleConfirmRoomOnly = async () => {
    if (!currentOrder) {
      toast.error('No hay orden actual')
      return
    }

    // Solo para check-in (no debería llamarse en check-out)
    if (currentOrder.isCheckout) {
      console.warn('handleConfirmRoomOnly called in checkout mode - redirecting to handleConfirmOrder')
      return handleConfirmOrder()
    }

    // Es un check-in normal sin snacks
    if (!guestData.fullName?.trim() || !guestData.documentNumber?.trim() || !guestData.phone?.trim()) {
      toast.error('Complete los datos obligatorios del huésped')
      return
    }

    try {
      const { data, error } = await processCheckIn(currentOrder, [], guestData)
      
      if (error) {
        toast.error(error.message || 'Error al procesar check-in')
        return
      }

      toast.success(
        `Check-in completado!\n👤 ${guestData.fullName}\n🏨 Habitación ${currentOrder.room.number}\n💰 S/ ${currentOrder.roomPrice.toFixed(2)}`,
        { duration: 5000, icon: '✅' }
      )
      
      resetOrder()
    } catch (error) {
      console.error('Error in handleConfirmRoomOnly:', error)
      toast.error('Error inesperado al procesar check-in')
    }
  }

  const handleProcessPayment = async (paymentMethod) => {
    if (!currentOrder) {
      toast.error('No hay orden actual')
      return
    }

    try {
      const { data, error } = await processCheckOut(currentOrder.room.number, paymentMethod)
      
      if (error) {
        toast.error(error.message || 'Error al procesar check-out')
        return
      }

      toast.success(
        `Check-out completado!\n🏨 Habitación ${currentOrder.room.number}\n👤 ${currentOrder.guestName}\n💰 S/ ${currentOrder.total.toFixed(2)}\n💳 ${getPaymentMethodName(paymentMethod)}`,
        { duration: 4000, icon: '✅' }
      )
      
      resetOrder()
    } catch (error) {
      console.error('Error in handleProcessPayment:', error)
      toast.error('Error inesperado al procesar check-out')
    }
  }

  const resetOrder = () => {
    setOrderStep(0)
    setSelectedSnackType(null)
    setSelectedSnacks([])
    setCurrentOrder(null)
    setSelectedRoom(null)
    setGuestData({
      fullName: '',
      documentType: 'DNI',
      documentNumber: '',
      phone: '',
      email: '',
      nationality: 'Peruana',
      gender: '',
      adults: 1,
      children: 0,
      specialRequests: ''
    })
  }

  // Manejo de errores
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error al cargar datos</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              variant="primary"
              onClick={refreshData}
              icon={RefreshCw}
              disabled={loading}
            >
              {loading ? 'Recargando...' : 'Reintentar'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Loading inicial
  if (loading && orderStep === 0) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Reception Panel</h1>
            <p className="text-gray-600">Sistema inteligente de gestión hotelera</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando panel de recepción...</p>
          </div>
        </div>
      </div>
    )
  }

  const roomsData = getRoomsData()
  const needsCleaningCount = Object.values(roomsData).flat()
    .filter(r => r.cleaning_status === 'dirty' || r.status === 'cleaning').length

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header simplificado */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Reception Panel</h1>
          <p className="text-gray-600">
            {orderStep === 1 && currentOrder?.isCheckout 
              ? `Agregando servicios para Check-out - Habitación ${currentOrder.room.number}`
              : orderStep === 1 
                ? 'Check-in sin reservación - Complete los datos del huésped'
                : 'Click inteligente: Verde = Check-in | Rojo = Check-out | Amarillo = Limpiar'
            }
          </p>
          
          {/* Indicadores de estado */}
          <div className="mt-4 flex justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Disponible - Click para Check-in</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Ocupada - Click para Check-out</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Sucia - Click para Limpiar</span>
            </div>
          </div>

          {needsCleaningCount > 0 && (
            <div className="mt-3 inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm">
              ✨ {needsCleaningCount} habitación{needsCleaningCount > 1 ? 'es' : ''} necesita{needsCleaningCount === 1 ? '' : 'n'} limpieza
            </div>
          )}

          {orderStep === 1 && currentOrder?.isCheckout && (
            <div className="mt-3 inline-block bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm">
              🛒 Agregando servicios adicionales antes del check-out
            </div>
          )}

          {orderStep === 1 && !currentOrder?.isCheckout && (
            <div className="mt-3 inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm">
              📝 Completando check-in para habitación {currentOrder?.room?.number}
            </div>
          )}
        </div>

        {/* Botón de refresh flotante */}
        <div className="fixed top-4 right-4 z-50">
          <Button
            variant="outline"
            onClick={refreshData}
            icon={RefreshCw}
            disabled={loading}
            className="shadow-lg bg-white"
          >
            {loading ? 'Actualizando...' : 'Refresh'}
          </Button>
        </div>

        {/* Contenido Principal */}
        <div className="bg-white rounded-lg shadow-lg p-6">

          {/* Paso 0: Grid de Habitaciones */}
          {orderStep === 0 && (
            <RoomGrid
              floorRooms={roomsData}
              selectedFloor={selectedFloor}
              selectedRoom={selectedRoom}
              checkoutMode={false} // Ya no se usa
              savedOrders={savedOrders || {}}
              onFloorChange={handleFloorChange}
              onRoomClick={handleRoomClick}
              processingRoom={processingRoom} // Nueva prop para mostrar loading
              onNext={() => {}}
              onCleanRoom={handleQuickClean}
            />
          )}

          {/* Paso 1: Registro de Huésped y Selección de Snacks */}
          {orderStep === 1 && (
            <SnackSelection
              currentOrder={currentOrder}
              guestData={guestData}
              selectedSnackType={selectedSnackType}
              selectedSnacks={selectedSnacks}
              snackTypes={snackTypes}
              snackItems={snackItems}
              onBack={() => setOrderStep(0)}
              onGuestDataChange={handleGuestDataChange}
              onSnackTypeSelect={handleSnackTypeSelect}
              onSnackSelect={handleSnackSelect}
              onSnackRemove={handleSnackRemove}
              onQuantityUpdate={handleQuantityUpdate}
              onConfirmOrder={handleConfirmOrder}
              onConfirmRoomOnly={handleConfirmRoomOnly}
              onCancelOrder={resetOrder}
              loading={loading}
              isCheckout={currentOrder?.isCheckout || false} // Nueva prop
            />
          )}

          {/* Paso 2: Resumen de Check Out */}
          {orderStep === 2 && (
            <CheckoutSummary
              currentOrder={currentOrder}
              onBack={() => setOrderStep(0)}
              onProcessPayment={handleProcessPayment}
              onCancel={resetOrder}
            />
          )}

        </div>

        {/* Información de estado en la parte inferior */}
        {orderStep === 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <div className="flex space-x-6">
                <span>📊 Total: {Object.values(roomsData).flat().length} habitaciones</span>
                <span>🟢 Disponibles: {Object.values(roomsData).flat().filter(r => r.status === 'available' && r.cleaning_status === 'clean').length}</span>
                <span>🔴 Ocupadas: {Object.values(roomsData).flat().filter(r => r.status === 'occupied').length}</span>
                <span>🟡 Por limpiar: {needsCleaningCount}</span>
              </div>
              <div className="text-xs text-gray-400">
                Actualización automática cada 30s
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
              <div className="flex justify-between items-center">
                <div>
                  💡 <strong>Funcionamiento automático:</strong> 
                  Click en habitaciones para ejecutar acciones directamente
                </div>
                <div className="text-right">
                  {processingRoom && (
                    <span className="text-blue-600 font-medium">
                      Procesando habitación {processingRoom}...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckIn