// src/pages/CheckIn.jsx - GUARDADO CORREGIDO DE SNACKS
import React, { useState, useEffect } from 'react'
import { RefreshCw, AlertTriangle, Users, Bed, Clock } from 'lucide-react'
import Button from '../components/common/Button'
import RoomGrid from '../components/checkin/RoomGrid'
import SnackSelection from '../components/checkin/SnackSelection'
import QuickCheckoutModal from '../components/checkin/QuickCheckoutModal'
import { useQuickCheckins } from '../hooks/useQuickCheckins'
import { quickCheckinService, snackService } from '../lib/supabase'
import toast from 'react-hot-toast'

const CheckIn = () => {
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [orderStep, setOrderStep] = useState(0)
  const [selectedSnackType, setSelectedSnackType] = useState(null)
  const [selectedSnacks, setSelectedSnacks] = useState([])
  const [currentOrder, setCurrentOrder] = useState(null)
  const [processingRoom, setProcessingRoom] = useState(null)
  const [showQuickCheckout, setShowQuickCheckout] = useState(false)
  const [quickCheckoutData, setQuickCheckoutData] = useState(null)
  
  const [guestData, setGuestData] = useState({
    fullName: '',
    documentType: 'DNI',
    documentNumber: '',
    phone: '',
    email: ''
  })

  const {
    roomsByFloor,
    activeCheckins,
    snackTypes,
    snackItems,
    roomPrices,
    loading,
    error,
    processQuickCheckIn,
    processQuickCheckOut,
    cleanRoom,
    refreshData,
    totalRooms,
    availableRooms,
    occupiedRooms,
    cleaningRooms,
    activeCheckinsCount,
    debugData
  } = useQuickCheckins()

  // Debug info en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🐛 CheckIn Page Debug:', {
        currentOrder,
        orderStep,
        isCheckout: currentOrder?.isCheckout,
        isWalkIn: currentOrder?.isWalkIn,
        selectedSnacks: selectedSnacks?.length
      })
    }
  }, [currentOrder, orderStep, selectedSnacks])

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (orderStep === 0 && !loading) {
        refreshData()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [orderStep, loading, refreshData])

  // Seleccionar piso automáticamente
  useEffect(() => {
    if (roomsByFloor && typeof roomsByFloor === 'object') {
      const availableFloors = Object.keys(roomsByFloor)
        .map(f => parseInt(f))
        .filter(f => !isNaN(f))
        .sort()
      
      if (availableFloors.length > 0 && !availableFloors.includes(selectedFloor)) {
        const firstFloor = availableFloors[0]
        setSelectedFloor(firstFloor)
      }
    }
  }, [roomsByFloor, selectedFloor])

  const handleFloorChange = (floor) => {
    setSelectedFloor(floor)
    setSelectedRoom(null)
  }

  // ✅ FUNCIÓN PRINCIPAL: Manejo inteligente de clicks
  const handleRoomClick = async (room) => {
    if (loading || processingRoom === (room.number || room.room_number)) {
      return
    }

    const roomNumber = room.number || room.room_number
    setProcessingRoom(roomNumber)

    try {
      const roomStatus = room.room_status?.status || room.status || 'disponible'
      const roomAvailable = room.room_status?.is_available !== false && 
                          (roomStatus === 'disponible' || roomStatus === 'available')
      const isOccupied = roomStatus === 'ocupada' || roomStatus === 'occupied'
      const needsCleaning = roomStatus === 'limpieza' || roomStatus === 'cleaning' || 
                           room.cleaning_status === 'dirty'
      const inMaintenance = roomStatus === 'mantenimiento' || roomStatus === 'maintenance'

      if (roomAvailable && !needsCleaning && !inMaintenance) {
        // ✅ HABITACIÓN DISPONIBLE - INICIAR WALK-IN CHECK-IN
        await handleWalkInCheckIn(room)
        
      } else if ((isOccupied || room.quickCheckin || activeCheckins[roomNumber])) {
        // 🚪 HABITACIÓN OCUPADA - AGREGAR SERVICIOS
        await handleAddServicesFlow(room)
        
      } else if (needsCleaning) {
        // 🧹 HABITACIÓN NECESITA LIMPIEZA
        await handleQuickClean(room.id || room.room_id, roomNumber)
        
      } else if (inMaintenance) {
        toast.warning(`Habitación ${roomNumber} está en mantenimiento`)
      } else {
        toast.warning(`Habitación ${roomNumber} no disponible (${roomStatus})`)
      }
      
    } catch (error) {
      console.error('❌ Error processing room click:', error)
      toast.error('Error al procesar la habitación: ' + error.message)
    } finally {
      setProcessingRoom(null)
    }
  }

  // ✅ WALK-IN CHECK-IN (UN SOLO BOTÓN PARA CONFIRMAR)
  const handleWalkInCheckIn = async (room) => {
    const roomNumber = room.room_number || room.number
    console.log('🚶‍♂️ Starting walk-in check-in for room:', roomNumber)
    
    try {
      const floor = room.floor || Math.floor(parseInt(roomNumber) / 100) || 1
      const roomPrice = room.base_price || room.rate || roomPrices?.[floor] || 100
      
      // Resetear datos del huésped
      setGuestData({
        fullName: '',
        documentType: 'DNI',
        documentNumber: '',
        phone: '',
        email: ''
      })
      
      setSelectedRoom(room)
      setCurrentOrder({
        room: {
          id: room.id || room.room_id,
          number: roomNumber,
          room_number: roomNumber,
          description: room.description || 'Habitación Estándar',
          floor: floor
        },
        roomPrice: roomPrice,
        snacks: [],
        total: roomPrice,
        isWalkIn: true,
        isCheckout: false,
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // ✅ 3 días para evitar filtrado prematuro
      })
      setSelectedSnacks([])
      setSelectedSnackType(null)
      setOrderStep(1)
      
      toast.success(`Iniciando registro directo para habitación ${roomNumber}`, {
        icon: '🚶‍♂️',
        duration: 2000
      })
      
    } catch (error) {
      console.error('❌ Error in handleWalkInCheckIn:', error)
      toast.error('Error al iniciar check-in: ' + error.message)
    }
  }

  // ✅ AGREGAR SERVICIOS A HABITACIÓN OCUPADA (RENOMBRADO)
  const handleAddServicesFlow = async (room) => {
  const roomNumber = room.room_number || room.number
  console.log('🛒 Starting add services flow for room:', roomNumber)
  
  try {
    const activeCheckin = room.quickCheckin || activeCheckins[roomNumber]
    
    if (!activeCheckin) {
      toast.error(`No se encontró check-in activo para la habitación ${roomNumber}`)
      return
    }

    // Extraer documento
    const documentParts = activeCheckin.guest_document?.split(':') || ['DNI', '']
    
    setGuestData({
      fullName: activeCheckin.guest_name || 'Huésped',
      documentType: documentParts[0] || 'DNI',
      documentNumber: documentParts[1] || '',
      phone: activeCheckin.guest_phone || activeCheckin.phone || '',
      email: activeCheckin.email || ''
    })
    
    // ✅ CORRECCIÓN IMPORTANTE: NO resetear selectedSnacks aquí
    // Solo resetear si no hay snacks ya seleccionados (primera vez)
    if (selectedSnacks.length === 0) {
      setSelectedSnacks(activeCheckin.snacks_consumed || [])
      console.log('🔄 Loading existing snacks for first time:', activeCheckin.snacks_consumed?.length || 0)
    } else {
      console.log('🔄 Keeping current selected snacks:', selectedSnacks.length)
    }
    
    setSelectedSnackType(null)
    
    setSelectedRoom(room)
    setCurrentOrder({
      id: activeCheckin.id,
      room: {
        id: room.id || room.room_id,
        number: roomNumber,
        room_number: roomNumber,
        description: room.description || 'Habitación Estándar'
      },
      roomPrice: activeCheckin.room_rate || room.base_price || 0,
      snacks: activeCheckin.snacks_consumed || [],
      total: activeCheckin.total_amount || 0,
      originalTotal: activeCheckin.total_amount || 0,
      guestName: activeCheckin.guest_name,
      checkInDate: activeCheckin.check_in_date,
      confirmationCode: activeCheckin.confirmation_code,
      isCheckout: true, // ✅ IMPORTANTE: Es para agregar servicios
      isWalkIn: false,
      isQuickCheckin: true
    })
    setOrderStep(1)
    
    toast.success(`Agregando servicios para habitación ${roomNumber}`, {
      icon: '🛒',
      duration: 2000
    })
    
  } catch (error) {
    console.error('❌ Error in add services flow:', error)
    toast.error('Error al preparar agregado de servicios: ' + error.message)
  }
}

  // ✅ LIMPIEZA RÁPIDA
  const handleQuickClean = async (roomId, roomNumber) => {
  try {
    console.log('🧹 Iniciando limpieza de habitación:', { roomId, roomNumber })
    
    // Validar que tenemos los datos necesarios
    if (!roomId) {
      throw new Error('ID de habitación no válido')
    }

    const { data, error } = await cleanRoom(roomId)
    
    if (error) {
      console.error('❌ Error al limpiar habitación:', error)
      toast.error(`Error al limpiar habitación: ${error.message}`)
      return
    }
    
    const finalRoomNumber = roomNumber || data?.roomNumber || 'desconocida'
    
    toast.success(`Habitación ${finalRoomNumber} limpia y disponible`, {
      icon: '✨',
      duration: 3000
    })

    // Opcional: Refrescar datos para sincronizar con la base de datos
    setTimeout(() => {
      refreshData()
    }, 1000)
    
  } catch (error) {
    console.error('❌ Error en handleQuickClean:', error)
    toast.error('Error al limpiar habitación: ' + error.message)
  }
}

  // ✅ HANDLERS PARA SNACKS
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

  // ✅ FUNCIÓN PRINCIPAL: CONFIRMAR ORDEN
  const handleConfirmOrder = async () => {
    if (!currentOrder) {
      toast.error('No hay orden actual')
      return
    }

    console.log('✅ Confirming order:', {
      isCheckout: currentOrder.isCheckout,
      isWalkIn: currentOrder.isWalkIn,
      selectedSnacksCount: selectedSnacks.length,
      guestName: guestData.fullName
    })

    if (currentOrder.isCheckout) {
      // CASO 1: ES AGREGAR SERVICIOS Y HACER CHECK-OUT
      if (!guestData.fullName?.trim()) {
        toast.error('Información del huésped incompleta')
        return
      }

      const snacksTotal = selectedSnacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0)
      const updatedOrder = {
        ...currentOrder,
        snacks: selectedSnacks,
        total: (currentOrder.originalTotal || currentOrder.roomPrice || 0) + snacksTotal
      }

      showCheckOutConfirmation(updatedOrder)
      return
    }

    // CASO 2: ES UN WALK-IN CHECK-IN
    return await processWalkInCheckIn()
  }

  // ✅ NUEVA FUNCIÓN: CONTINUAR EN LA HABITACIÓN (GUARDAR SNACKS SIN CHECK-OUT)
  const handleConfirmRoomOnly = async () => {
  if (!currentOrder || !currentOrder.isCheckout) {
    // Si no es checkout, usar la función normal
    return await handleConfirmOrder()
  }

  console.log('🔄 Continuing in room with additional services:', {
    roomNumber: currentOrder?.room?.number,
    currentSnacks: currentOrder.snacks?.length || 0,
    newSnacks: selectedSnacks.length,
    guestName: guestData.fullName,
    quickCheckinId: currentOrder.id
  })

  try {
    const roomNumber = currentOrder.room.number
    const snacksTotal = selectedSnacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0)
    const newTotal = (currentOrder.originalTotal || currentOrder.roomPrice || 0) + snacksTotal

    // ✅ LLAMAR AL SERVICIO REAL PARA ACTUALIZAR EN LA BASE DE DATOS
    console.log('🔄 Updating quick checkin with new snacks in database...')
    
    const updateResult = await quickCheckinService.updateQuickCheckinSnacks(
      currentOrder.id, // ID del quick checkin
      selectedSnacks    // Nuevos snacks
    )

    if (updateResult.error) {
      throw new Error(updateResult.error.message || 'Error actualizando snacks en la base de datos')
    }

    console.log('✅ Snacks updated in database successfully:', updateResult.data)

    // ✅ PROCESAR CONSUMO EN INVENTARIO
    if (selectedSnacks.length > 0) {
      console.log('🍿 Processing additional snack consumption...')
      
      // Solo procesar snacks nuevos (no los que ya estaban)
      const existingSnackIds = (currentOrder.snacks || []).map(s => s.id)
      const newSnacksOnly = selectedSnacks.filter(snack => !existingSnackIds.includes(snack.id))
      
      if (newSnacksOnly.length > 0) {
        const inventoryResult = await snackService.processSnackConsumption(newSnacksOnly)
        console.log('📊 Inventory update result:', inventoryResult.error ? 'Failed' : 'Success')
      }
    }

    // ✅ ACTUALIZAR EL HOOK PARA REFRESCAR LOS DATOS
    await refreshData()

    toast.success(
      `Servicios agregados a habitación ${roomNumber}
👤 ${guestData.fullName}
🛒 ${selectedSnacks.length} servicios adicionales
💰 Total: S/ ${newTotal.toFixed(2)}`,
      { duration: 4000, icon: '✅' }
    )

    // ✅ VOLVER AL GRID
    setOrderStep(0)
    setSelectedSnackType(null)
    setCurrentOrder(null)
    setSelectedRoom(null)

  } catch (error) {
    console.error('❌ Error adding services to room:', error)
    toast.error('Error al agregar servicios: ' + error.message)
  }
}

  // ✅ PROCESAR WALK-IN CHECK-IN
  const processWalkInCheckIn = async () => {
    // Validación para check-in
    if (!guestData.fullName?.trim()) {
      toast.error('El nombre completo es obligatorio')
      return
    }

    if (!guestData.documentNumber?.trim()) {
      toast.error('El documento de identidad es obligatorio')
      return
    }

    if (guestData.documentNumber.length < 6) {
      toast.error('El documento debe tener al menos 6 caracteres')
      return
    }

    try {
      const { data, error } = await processQuickCheckIn(currentOrder, guestData, selectedSnacks)
      
      if (error) {
        console.error('❌ ProcessQuickCheckIn error:', error)
        toast.error(error.message || 'Error al procesar check-in')
        return
      }

      const snacksTotal = selectedSnacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0)
      const totalAmount = currentOrder.roomPrice + snacksTotal
      
      toast.success(
        `¡Check-in completado!\n👤 ${guestData.fullName}\n🏨 Habitación ${currentOrder.room.number}\n💰 S/ ${totalAmount.toFixed(2)}\n${selectedSnacks.length > 0 ? `🍿 Con ${selectedSnacks.length} servicios adicionales` : ''}`,
        { duration: 5000, icon: '✅' }
      )
      
      resetOrder()
    } catch (error) {
      console.error('❌ Error in processWalkInCheckIn:', error)
      toast.error('Error inesperado al procesar: ' + error.message)
    }
  }

  // ✅ MOSTRAR CONFIRMACIÓN DE CHECK-OUT
  const showCheckOutConfirmation = (order) => {
    console.log('📝 Showing checkout confirmation:', order)
    
    if (!order.room || !order.room.number) {
      toast.error('Error: Información de habitación faltante')
      return
    }
    
    if (!order.id) {
      toast.error('Error: ID de check-in faltante')
      return
    }
    
    setQuickCheckoutData(order)
    setShowQuickCheckout(true)
  }

  const handleQuickCheckoutConfirm = async (paymentMethod) => {
    if (!quickCheckoutData) {
      toast.error('No hay datos de check-out')
      return
    }
    
    try {
      setProcessingRoom(quickCheckoutData.room.number)
      
      const { data, error } = await processQuickCheckOut(quickCheckoutData.room.number, paymentMethod)
      
      if (error) {
        throw error
      }
      
      setShowQuickCheckout(false)
      setQuickCheckoutData(null)
      resetOrder()
      
      toast.success(
        `¡Check-out completado!\n🏨 Habitación: ${quickCheckoutData.room.number}\n👤 ${quickCheckoutData.guestName}\n💰 S/ ${quickCheckoutData.total.toFixed(2)}\n💳 ${getPaymentMethodName(paymentMethod)}`,
        { duration: 4000, icon: '✅' }
      )
      
    } catch (error) {
      console.error('❌ Error in quick checkout:', error)
      toast.error('Error al procesar check-out: ' + error.message)
    } finally {
      setProcessingRoom(null)
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
      email: ''
    })
  }

  const getPaymentMethodName = (method) => {
    const methods = {
      'cash': 'Efectivo',
      'card': 'Tarjeta',
      'digital': 'Digital (Yape/Plin)'
    }
    return methods[method] || method
  }

  const handleCloseQuickCheckout = () => {
    setShowQuickCheckout(false)
    setQuickCheckoutData(null)
  }

  // ✅ MANEJO DE ERRORES Y LOADING (MISMO CÓDIGO)
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
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

  if (loading && orderStep === 0) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Panel de Recepción</h1>
            <p className="text-gray-600">Sistema de check-in rápido para huéspedes walk-in</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando panel de recepción...</p>
          </div>
        </div>
      </div>
    )
  }

  const hasRooms = totalRooms > 0
  if (!hasRooms && !loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Bed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-4">No hay habitaciones configuradas</h2>
            <Button
              variant="primary"
              onClick={refreshData}
              icon={RefreshCw}
              disabled={loading}
            >
              {loading ? 'Verificando...' : 'Verificar de nuevo'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* ✅ HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Panel de Recepción</h1>
          <div className="flex items-center justify-center space-x-3 mb-2">
            <p className="text-gray-600">
              {orderStep === 1 && currentOrder?.isCheckout 
                ? `Agregando servicios adicionales - Habitación ${currentOrder.room.number}`
                : orderStep === 1 
                  ? `Registro directo de huésped walk-in - Habitación ${currentOrder.room.number}`
                  : 'Check-in rápido para huéspedes sin reserva'
              }
            </p>
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-lg">
              <AlertTriangle size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Quick Check-ins</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            ⚠️ Sistema separado de reservaciones - Solo para huéspedes que llegan sin reserva
          </p>
        </div>

        {/* ✅ ADVERTENCIA SISTEMA SEPARADO */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-800">Panel de Check-in Rápido</h3>
              <p className="text-sm text-blue-700 mt-1">
                Este panel es exclusivo para <strong>huéspedes walk-in</strong> (sin reserva previa). 
                Para gestionar reservaciones, usa el módulo de "Reservaciones" en el menú principal.
              </p>
              {orderStep === 1 && (
                <div className="mt-2 p-2 bg-blue-100 rounded text-xs">
                  <strong>Modo actual:</strong> {currentOrder?.isCheckout ? 'Agregando servicios a habitación ocupada' : 'Registro directo de nuevo huésped'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ✅ BOTÓN DE REFRESH FLOTANTE */}
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

        {/* ✅ CONTENIDO PRINCIPAL */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {orderStep === 0 && (
            <RoomGrid
              floorRooms={roomsByFloor}
              selectedFloor={selectedFloor}
              selectedRoom={selectedRoom}
              savedOrders={activeCheckins || {}}
              onFloorChange={handleFloorChange}
              onRoomClick={handleRoomClick}
              processingRoom={processingRoom}
              onCleanRoom={handleQuickClean}
            />
          )}

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
              onConfirmRoomOnly={handleConfirmRoomOnly} // ✅ FUNCIÓN CORREGIDA
              onCancelOrder={resetOrder}
              loading={loading}
              isCheckout={currentOrder?.isCheckout || false}
            />
          )}
        </div>

        {/* ✅ MODAL DE QUICK CHECKOUT */}
        <QuickCheckoutModal
          isOpen={showQuickCheckout}
          onClose={handleCloseQuickCheckout}
          orderData={quickCheckoutData}
          onConfirm={handleQuickCheckoutConfirm}
        />

        {/* ✅ ESTADÍSTICAS RESUMIDAS */}
        {orderStep === 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center">
                <div className="font-bold text-lg text-blue-600">{activeCheckinsCount}</div>
                <div className="text-blue-700 font-medium">Check-ins Activos</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center">
                <div className="font-bold text-lg text-green-600">{availableRooms}</div>
                <div className="text-green-700 font-medium">Disponibles</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3 text-center">
                <div className="font-bold text-lg text-yellow-600">{cleaningRooms}</div>
                <div className="text-yellow-700 font-medium">Por Limpiar</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center">
                <div className="font-bold text-lg text-purple-600">
                  S/ {Object.values(activeCheckins || {})
                    .reduce((sum, checkin) => sum + (checkin.total_amount || 0), 0)
                    .toFixed(0)}
                </div>
                <div className="text-purple-700 font-medium">Ingresos Pendientes</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckIn