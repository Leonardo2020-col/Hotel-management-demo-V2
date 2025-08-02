// src/pages/CheckIn/CheckIn.jsx - VERSIÓN SEPARADA PARA QUICK CHECK-INS
import React, { useState, useEffect } from 'react'
import { RefreshCw, Sparkles, User, CreditCard, AlertTriangle } from 'lucide-react'
import Button from '../../components/common/Button'
import RoomGrid from '../../components/checkin/RoomGrid'
import SnackSelection from '../../components/checkin/SnackSelection'
import QuickCheckoutModal from '../../components/checkin/QuickCheckoutModal'
import { useQuickCheckins } from '../../hooks/useQuickCheckins' // ✅ Nuevo hook separado
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
  
  // ✅ Estado simplificado para huésped (solo campos esenciales)
  const [guestData, setGuestData] = useState({
    fullName: '',
    documentType: 'DNI',
    documentNumber: '',
    phone: '',
    email: ''
  })

  // ✅ Usar hook de quick check-ins (NO reservaciones)
  const {
    roomsByFloor,
    activeCheckins,
    snackTypes,
    snackItems,
    roomPrices,
    loading,
    error,
    processQuickCheckIn,    // ✅ Función separada
    processQuickCheckOut,   // ✅ Función separada
    cleanRoom,
    refreshData
  } = useQuickCheckins()

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (orderStep === 0) {
        refreshData()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [orderStep, refreshData])

  // Seleccionar piso automáticamente
  useEffect(() => {
    if (roomsByFloor && typeof roomsByFloor === 'object') {
      const availableFloors = Object.keys(roomsByFloor).map(f => parseInt(f)).filter(f => !isNaN(f))
      if (availableFloors.length > 0 && !availableFloors.includes(selectedFloor)) {
        const firstFloor = Math.min(...availableFloors)
        setSelectedFloor(firstFloor)
      }
    }
  }, [roomsByFloor, selectedFloor])

  const handleFloorChange = (floor) => {
    setSelectedFloor(floor)
    setSelectedRoom(null)
  }

  // ✅ FUNCIÓN PRINCIPAL: Manejo inteligente de clicks (SOLO quick check-ins)
  const handleRoomClick = async (room) => {
    if (loading || processingRoom === room.number) {
      return
    }

    setProcessingRoom(room.number)
    console.log('🔘 Quick Check-in Room clicked:', room)

    try {
      // ✅ LÓGICA BASADA EN QUICK CHECK-INS (NO reservaciones)
      
      if (room.status === 'available' && room.cleaning_status === 'clean') {
        // ✅ HABITACIÓN DISPONIBLE - INICIAR WALK-IN CHECK-IN
        await handleWalkInCheckIn(room)
        
      } else if (room.status === 'occupied' && room.quickCheckin) {
        // 🚪 HABITACIÓN OCUPADA POR QUICK CHECK-IN - PROCESAR CHECK-OUT
        await handleQuickCheckOutFlow(room)
        
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

  // ✅ WALK-IN CHECK-IN (huésped sin reserva)
  const handleWalkInCheckIn = async (room) => {
    console.log('🚶‍♂️ Starting walk-in check-in for room:', room.number)
    
    const floor = Math.floor(parseInt(room.number) / 100)
    const roomPrice = roomPrices && roomPrices[floor] ? roomPrices[floor] : 100
    
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
      room: room,
      roomPrice: roomPrice,
      snacks: [],
      total: roomPrice,
      isWalkIn: true // ✅ Flag para distinguir de reservaciones
    })
    setOrderStep(1)
    
    toast.success(`Iniciando registro directo para habitación ${room.number}`, {
      icon: '🚶‍♂️',
      duration: 2000
    })
  }

  // ✅ QUICK CHECK-OUT FLOW
  const handleQuickCheckOutFlow = async (room) => {
    console.log('🚪 Starting quick check-out for room:', room.number)
    
    try {
      const activeCheckin = room.quickCheckin || activeCheckins[room.number]
      
      if (!activeCheckin) {
        toast.error(`No se encontró check-in activo para la habitación ${room.number}`)
        return
      }

      // Configurar datos para check-out con servicios adicionales
      setGuestData({
        fullName: activeCheckin.guest_name || 'Huésped',
        documentType: activeCheckin.document_type || 'DNI',
        documentNumber: activeCheckin.document_number || '',
        phone: activeCheckin.phone || '',
        email: activeCheckin.email || ''
      })
      
      setSelectedSnacks(activeCheckin.snacks_consumed || [])
      setSelectedSnackType(null)
      
      setSelectedRoom(room)
      setCurrentOrder({
        id: activeCheckin.id,
        room: room,
        roomPrice: activeCheckin.room_rate || 0,
        snacks: activeCheckin.snacks_consumed || [],
        total: activeCheckin.total_amount || 0,
        originalTotal: activeCheckin.total_amount || 0,
        guestName: activeCheckin.guest_name,
        checkInDate: activeCheckin.check_in_date,
        confirmationCode: activeCheckin.confirmation_code,
        isCheckout: true,
        isQuickCheckin: true // ✅ Flag para distinguir de reservaciones
      })
      setOrderStep(1) // Ir a selección de snacks adicionales
      
      toast.success(`Preparando check-out para habitación ${room.number}`, {
        icon: '🛒',
        duration: 2000
      })
      
    } catch (error) {
      console.error('❌ Error in quick check-out flow:', error)
      toast.error('Error al preparar check-out: ' + error.message)
    }
  }

  // ✅ CONFIRMACIÓN DE CHECK-OUT RÁPIDO
  const showCheckOutConfirmation = (order) => {
    console.log('📝 Showing quick checkout confirmation:', order)
    
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

  // ✅ PROCESAR CONFIRMACIÓN DE CHECK-OUT
  const handleQuickCheckoutConfirm = async (paymentMethod) => {
    if (!quickCheckoutData) {
      toast.error('No hay datos de check-out')
      return
    }
    
    try {
      setProcessingRoom(quickCheckoutData.room.number)
      
      // ✅ Usar función de quick check-out (NO reservaciones)
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

  // ✅ LIMPIEZA RÁPIDA
  const handleQuickClean = async (roomId) => {
    try {
      const roomData = Object.values(roomsByFloor)
        .flat()
        .find(room => room.id === roomId || room.room_id === roomId)
      
      const roomNumber = roomData?.number || 'desconocida'
      
      const { data, error } = await cleanRoom(roomId)
      
      if (error) {
        toast.error(`Error al limpiar habitación: ${error.message}`)
        return
      }
      
      toast.success(`Habitación ${roomNumber} limpia y disponible`, {
        icon: '✨',
        duration: 3000
      })
      
    } catch (error) {
      console.error('❌ Error in handleQuickClean:', error)
      toast.error('Error inesperado al limpiar habitación')
    }
  }

  // ✅ HANDLERS PARA SNACK SELECTION
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

  // ✅ CONFIRMAR ORDEN (check-in o check-out con servicios)
  const handleConfirmOrder = async () => {
    if (!currentOrder) {
      toast.error('No hay orden actual')
      return
    }

    // Verificar si es check-out o check-in
    if (currentOrder.isCheckout) {
      // ✅ Es un check-out con servicios adicionales
      if (!guestData.fullName?.trim()) {
        toast.error('Información del huésped incompleta')
        return
      }

      // Actualizar la orden con los nuevos snacks
      const snacksTotal = selectedSnacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0)
      const updatedOrder = {
        ...currentOrder,
        snacks: selectedSnacks,
        total: (currentOrder.originalTotal || currentOrder.roomPrice || 0) + snacksTotal
      }

      // Ir al modal de confirmación de check-out
      showCheckOutConfirmation(updatedOrder)
      return
    }

    // ✅ Es un walk-in check-in - VALIDACIÓN SIMPLIFICADA
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
      console.log('✅ Processing walk-in check-in')
      
      // ✅ Usar función de quick check-in (NO crear reservación)
      const { data, error } = await processQuickCheckIn(currentOrder, guestData, selectedSnacks)
      
      if (error) {
        toast.error(error.message || 'Error al procesar check-in')
        return
      }

      const snacksTotal = selectedSnacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0)
      
      toast.success(
        `¡Check-in walk-in completado!\n👤 ${guestData.fullName}\n🏨 Habitación ${currentOrder.room.number}\n💰 S/ ${(currentOrder.roomPrice + snacksTotal).toFixed(2)}`,
        { duration: 5000, icon: '✅' }
      )
      
      resetOrder()
    } catch (error) {
      console.error('Error in handleConfirmOrder:', error)
      toast.error('Error inesperado al procesar check-in')
    }
  }

  // ✅ CONFIRMAR SOLO HABITACIÓN (sin snacks)
  const handleConfirmRoomOnly = async () => {
    if (!currentOrder || currentOrder.isCheckout) {
      return handleConfirmOrder()
    }

    // Validación mínima
    if (!guestData.fullName?.trim()) {
      toast.error('El nombre completo es obligatorio')
      return
    }

    if (!guestData.documentNumber?.trim()) {
      toast.error('El documento de identidad es obligatorio')
      return
    }

    try {
      // ✅ Usar función de quick check-in sin snacks
      const { data, error } = await processQuickCheckIn(currentOrder, guestData, [])
      
      if (error) {
        toast.error(error.message || 'Error al procesar check-in')
        return
      }

      toast.success(
        `¡Check-in walk-in completado!\n👤 ${guestData.fullName}\n🏨 Habitación ${currentOrder.room.number}\n💰 S/ ${currentOrder.roomPrice.toFixed(2)}`,
        { duration: 5000, icon: '✅' }
      )
      
      resetOrder()
    } catch (error) {
      console.error('Error in handleConfirmRoomOnly:', error)
      toast.error('Error inesperado al procesar check-in')
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

  const needsCleaningCount = Object.values(roomsByFloor).flat()
    .filter(r => r.cleaning_status === 'dirty' || r.status === 'cleaning').length

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* ✅ Header actualizado para quick check-ins */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Panel de Recepción</h1>
          <div className="flex items-center justify-center space-x-3 mb-2">
            <p className="text-gray-600">
              {orderStep === 1 && currentOrder?.isCheckout 
                ? `Agregando servicios para Check-out - Habitación ${currentOrder.room.number}`
                : orderStep === 1 
                  ? 'Registro directo de huésped walk-in'
                  : 'Check-in rápido para huéspedes sin reserva'
              }
            </p>
            {/* ✅ Indicador de separación */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-lg">
              <AlertTriangle size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Quick Check-ins</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            ⚠️ Sistema separado de reservaciones - Solo para huéspedes que llegan sin reserva
          </p>
        </div>

        {/* Información de diferenciación */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-800">Panel de Check-in Rápido</h3>
              <p className="text-sm text-blue-700 mt-1">
                Este panel es exclusivo para <strong>huéspedes walk-in</strong> (sin reserva previa). 
                Para gestionar reservaciones, usa el módulo de "Reservaciones" en el menú principal.
              </p>
            </div>
          </div>
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
              floorRooms={roomsByFloor}
              selectedFloor={selectedFloor}
              selectedRoom={selectedRoom}
              savedOrders={activeCheckins || {}} // ✅ Usar activeCheckins en lugar de savedOrders
              onFloorChange={handleFloorChange}
              onRoomClick={handleRoomClick}
              processingRoom={processingRoom}
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
              isCheckout={currentOrder?.isCheckout || false}
            />
          )}

        </div>

        {/* Modal de Check-out Rápido */}
        <QuickCheckoutModal
          isOpen={showQuickCheckout}
          onClose={handleCloseQuickCheckout}
          orderData={quickCheckoutData}
          onConfirm={handleQuickCheckoutConfirm}
          onViewDetails={() => {
            if (quickCheckoutData) {
              setCurrentOrder(quickCheckoutData)
              setOrderStep(2)
              setShowQuickCheckout(false)
              setQuickCheckoutData(null)
            }
          }}
        />

        {/* ✅ Información de estado actualizada para quick check-ins */}
        {orderStep === 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <div className="flex space-x-6">
                <span>📊 Total: {Object.values(roomsByFloor).flat().length} habitaciones</span>
                <span>🟢 Disponibles: {Object.values(roomsByFloor).flat().filter(r => r.status === 'available' && r.cleaning_status === 'clean').length}</span>
                <span>🔴 Ocupadas (Walk-in): {Object.values(roomsByFloor).flat().filter(r => r.status === 'occupied' && r.quickCheckin).length}</span>
                <span>🟡 Por limpiar: {needsCleaningCount}</span>
              </div>
              <div className="text-xs text-gray-400">
                Quick Check-ins • Actualización automática cada 30s
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
              <div className="flex justify-between items-center">
                <div>
                  💡 <strong>Sistema Walk-in:</strong> 
                  Para huéspedes sin reserva • Separado del módulo de Reservaciones
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

            {/* ✅ Estadísticas de quick check-ins */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-blue-50 rounded p-2 text-center">
                  <div className="font-bold text-blue-600">{Object.keys(activeCheckins || {}).length}</div>
                  <div className="text-blue-700">Check-ins Activos</div>
                </div>
                <div className="bg-green-50 rounded p-2 text-center">
                  <div className="font-bold text-green-600">
                    {Object.values(roomsByFloor).flat().filter(r => r.status === 'available').length}
                  </div>
                  <div className="text-green-700">Disponibles para Walk-in</div>
                </div>
                <div className="bg-yellow-50 rounded p-2 text-center">
                  <div className="font-bold text-yellow-600">{needsCleaningCount}</div>
                  <div className="text-yellow-700">Necesitan Limpieza</div>
                </div>
                <div className="bg-purple-50 rounded p-2 text-center">
                  <div className="font-bold text-purple-600">
                    S/ {Object.values(activeCheckins || {})
                      .reduce((sum, checkin) => sum + (checkin.total_amount || 0), 0)
                      .toFixed(0)}
                  </div>
                  <div className="text-purple-700">Ingresos Pendientes</div>
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