// src/pages/CheckIn/CheckIn.jsx - CÓDIGO COMPLETO CORREGIDO
import React, { useState, useEffect } from 'react'
import { LogIn, LogOut, RefreshCw } from 'lucide-react'
import Button from '../../components/common/Button'
import RoomGrid from '../../components/checkin/RoomGrid'
import SnackSelection from '../../components/checkin/SnackSelection'
import CheckoutSummary from '../../components/checkin/CheckoutSummary'
import { useCheckInData } from '../../hooks/useCheckInData'
import toast from 'react-hot-toast'

const CheckIn = () => {
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [orderStep, setOrderStep] = useState(0) // 0: rooms, 1: snack selection, 2: checkout summary
  const [checkoutMode, setCheckoutMode] = useState(false)
  const [selectedSnackType, setSelectedSnackType] = useState(null)
  const [selectedSnacks, setSelectedSnacks] = useState([])
  const [currentOrder, setCurrentOrder] = useState(null)

  // Hook actualizado para Supabase
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
    refreshData,
    debugData,
    setSavedOrders
  } = useCheckInData()

  // Debug al cargar
  useEffect(() => {
    console.log('🔍 CheckIn Component Debug:')
    console.log('floorRooms:', floorRooms)
    console.log('roomsByFloor:', roomsByFloor)
    console.log('loading:', loading)
    console.log('error:', error)
    
    // Llamar debug del hook
    if (debugData) {
      debugData()
    }
  }, [floorRooms, roomsByFloor, loading, error, debugData])

  // Seleccionar piso automáticamente cuando cambien los datos
  useEffect(() => {
    const rooms = floorRooms || roomsByFloor
    if (rooms && typeof rooms === 'object') {
      const availableFloors = Object.keys(rooms).map(f => parseInt(f)).filter(f => !isNaN(f))
      if (availableFloors.length > 0 && !availableFloors.includes(selectedFloor)) {
        const firstFloor = Math.min(...availableFloors)
        console.log(`🏠 Auto-selecting floor ${firstFloor}`)
        setSelectedFloor(firstFloor)
      }
    }
  }, [floorRooms, roomsByFloor, selectedFloor])

  // Determinar qué datos de habitaciones usar
  const getRoomsData = () => {
    const rooms = floorRooms || roomsByFloor
    console.log('📊 Using rooms data:', rooms)
    return rooms || {}
  }

  // Handlers para RoomGrid
  const handleFloorChange = (floor) => {
    console.log(`🏠 Changing to floor ${floor}`)
    setSelectedFloor(floor)
    setSelectedRoom(null)
  }

  // FUNCIÓN HANDLEROOM CLICK CORREGIDA
  const handleRoomClick = (room) => {
    if (loading) {
      toast.info('Cargando datos, por favor espera...')
      return
    }

    console.log('🔘 Room clicked:', room)
    console.log('🔍 Current savedOrders:', savedOrders)
    console.log('🔍 Looking for order in room:', room.number)

    if (checkoutMode) {
      // Modo Check-out: solo habitaciones ocupadas
      if (room.status === 'occupied') {
        setSelectedRoom(room)
        
        // BÚSQUEDA MEJORADA de orden guardada
        let orderFound = null
        
        // 1. Buscar por número de habitación en savedOrders
        if (savedOrders && savedOrders[room.number]) {
          orderFound = savedOrders[room.number]
          console.log('✅ Order found by room number:', orderFound)
        }
        
        // 2. Si no se encuentra, buscar por reservationId en la habitación
        if (!orderFound && room.reservationId) {
          // Buscar en savedOrders por reservationId
          const orderByReservationId = Object.values(savedOrders || {}).find(
            order => order.reservationId === room.reservationId
          )
          if (orderByReservationId) {
            orderFound = orderByReservationId
            console.log('✅ Order found by reservationId:', orderFound)
          }
        }
        
        // 3. Si no se encuentra, crear orden temporal desde datos de la habitación
        if (!orderFound && (room.currentGuest || room.guestName || room.activeReservation)) {
          console.log('⚠️ Creating temporary order from room data')
          
          const floor = Math.floor(parseInt(room.number) / 100)
          const roomPrice = roomPrices && roomPrices[floor] ? roomPrices[floor] : 100
          
          // Crear orden temporal desde datos de habitación
          orderFound = {
            id: room.reservationId || `temp-${room.number}`,
            room: {
              id: room.id,
              number: room.number,
              status: room.status,
              floor: room.floor || floor,
              room_type: room.room_type || 'Habitación Estándar'
            },
            roomPrice: roomPrice,
            snacks: [],
            total: roomPrice,
            checkInDate: room.checkInDate || room.activeReservation?.check_in || new Date().toISOString().split('T')[0],
            checkOutDate: room.checkOutDate || room.activeReservation?.check_out || new Date().toISOString().split('T')[0],
            guestName: room.guestName || room.currentGuest?.name || 'Huésped Temporal',
            guestId: room.currentGuest?.id || null,
            reservationId: room.reservationId || room.activeReservation?.id || null,
            confirmationCode: room.confirmationCode || room.activeReservation?.confirmation_code || `TEMP-${room.number}`,
            // Información adicional si está disponible
            guestEmail: room.currentGuest?.email || '',
            guestPhone: room.currentGuest?.phone || '',
            specialRequests: room.activeReservation?.special_requests || '',
            paymentStatus: room.activeReservation?.payment_status || 'pending',
            checkedInAt: room.activeReservation?.checked_in_at || new Date().toISOString()
          }
          
          console.log('📋 Temporary order created:', orderFound)
          
          // Actualizar savedOrders para que esté disponible en próximas consultas
          setSavedOrders(prev => ({
            ...prev,
            [room.number]: orderFound
          }))
        }
        
        if (orderFound) {
          setCurrentOrder(orderFound)
          setOrderStep(2) // Ir directamente al resumen de pago
          console.log('✅ Proceeding to checkout with order:', orderFound)
        } else {
          // Último recurso: mostrar error con información de debug
          console.error('❌ No order information found for room:', room.number)
          console.error('Available savedOrders keys:', Object.keys(savedOrders || {}))
          console.error('Room data:', room)
          
          toast.error(
            `No se encontró información de reserva para la habitación ${room.number}. ` +
            `Posibles causas: La reserva no está en estado "checked_in" o hubo un error al cargar los datos.`,
            { duration: 6000 }
          )
          
          // Mostrar botón de debug en desarrollo
          if (process.env.NODE_ENV === 'development') {
            toast((t) => (
              <div>
                <p>Error en habitación {room.number}</p>
                <button 
                  onClick={() => {
                    debugData()
                    toast.dismiss(t.id)
                  }}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  Ver Debug Info
                </button>
              </div>
            ), { duration: 10000 })
          }
        }
      } else {
        toast.warning('Solo puedes hacer check-out de habitaciones ocupadas (rojas)')
      }
    } else {
      // Modo Check-in: solo habitaciones disponibles
      if (room.status === 'available' && room.cleaning_status === 'clean') {
        setSelectedRoom(room)
        const floor = Math.floor(parseInt(room.number) / 100)
        const roomPrice = roomPrices && roomPrices[floor] ? roomPrices[floor] : 100
        
        console.log(`💰 Room price for floor ${floor}: ${roomPrice}`)
        
        setCurrentOrder({
          room: room,
          roomPrice: roomPrice,
          snacks: [],
          total: roomPrice
        })
        setOrderStep(1)
      } else if (room.status === 'occupied') {
        toast.warning('Esta habitación ya está ocupada')
      } else if (room.cleaning_status !== 'clean') {
        toast.warning('Esta habitación no está lista (necesita limpieza)')
      } else {
        toast.warning('Esta habitación no está disponible')
      }
    }
  }

  const handleCheckOutClick = () => {
    console.log('🚪 Switching to checkout mode')
    setCheckoutMode(true)
    setSelectedRoom(null)
    setOrderStep(0)
    setSelectedSnacks([])
    setCurrentOrder(null)
  }

  const handleCheckInClick = () => {
    console.log('🏨 Switching to checkin mode')
    setCheckoutMode(false)
    setSelectedRoom(null)
    setOrderStep(0)
    setSelectedSnacks([])
    setCurrentOrder(null)
  }

  // Handlers para SnackSelection
  const handleSnackTypeSelect = (typeId) => {
    console.log('🍎 Snack type selected:', typeId)
    setSelectedSnackType(typeId)
  }

  const handleSnackSelect = (snack) => {
    console.log('🍪 Snack selected:', snack)
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

  // Confirmar check-in con snacks
  const handleConfirmOrder = async () => {
    if (!currentOrder) {
      toast.error('No hay orden actual')
      return
    }

    console.log('✅ Confirming order with snacks:', selectedSnacks)

    try {
      const { data, error } = await processCheckIn(currentOrder, selectedSnacks)
      
      if (error) {
        toast.error(error.message || 'Error al procesar check-in')
        return
      }

      const snacksTotal = selectedSnacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0)
      
      toast.success(
        `Check-in completado!\nHabitación: ${currentOrder.room.number}\nTotal: S/ ${(currentOrder.roomPrice + snacksTotal).toFixed(2)}`,
        { duration: 4000 }
      )
      
      resetOrder()
    } catch (error) {
      console.error('❌ Error in handleConfirmOrder:', error)
      toast.error('Error inesperado al procesar check-in')
    }
  }

  // Confirmar check-in solo habitación
  const handleConfirmRoomOnly = async () => {
    if (!currentOrder) {
      toast.error('No hay orden actual')
      return
    }

    console.log('✅ Confirming room only order')

    try {
      const { data, error } = await processCheckIn(currentOrder, [])
      
      if (error) {
        toast.error(error.message || 'Error al procesar check-in')
        return
      }

      toast.success(
        `Check-in completado!\nHabitación: ${currentOrder.room.number}\nTotal: S/ ${currentOrder.roomPrice.toFixed(2)}`,
        { duration: 4000 }
      )
      
      resetOrder()
    } catch (error) {
      console.error('❌ Error in handleConfirmRoomOnly:', error)
      toast.error('Error inesperado al procesar check-in')
    }
  }

  // Procesar pago y check-out
  const handleProcessPayment = async (paymentMethod) => {
    if (!currentOrder) {
      toast.error('No hay orden actual')
      return
    }

    console.log('💳 Processing payment:', paymentMethod)

    try {
      const { data, error } = await processCheckOut(currentOrder.room.number, paymentMethod)
      
      if (error) {
        toast.error(error.message || 'Error al procesar check-out')
        return
      }

      toast.success(
        `Check-out completado!\nHabitación: ${currentOrder.room.number}\nHuésped: ${currentOrder.guestName}\nTotal: S/ ${currentOrder.total.toFixed(2)}\nMétodo: ${paymentMethod}`,
        { duration: 4000 }
      )
      
      resetOrder()
    } catch (error) {
      console.error('❌ Error in handleProcessPayment:', error)
      toast.error('Error inesperado al procesar check-out')
    }
  }

  const resetOrder = () => {
    console.log('🔄 Resetting order')
    setOrderStep(0)
    setSelectedSnackType(null)
    setSelectedSnacks([])
    setCurrentOrder(null)
    setSelectedRoom(null)
    setCheckoutMode(false)
  }

  // Panel de Debug para desarrollo
  const DebugPanel = () => {
    const [showDebug, setShowDebug] = useState(false)

    if (process.env.NODE_ENV !== 'development') {
      return null
    }

    const roomsData = getRoomsData()
    const occupiedRooms = Object.values(roomsData || {})
      .flat()
      .filter(room => room.status === 'occupied')

    const roomsWithOrders = Object.keys(savedOrders || {})

    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-red-600"
        >
          🐛 Debug
        </button>
        
        {showDebug && (
          <div className="absolute bottom-12 right-0 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-96 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm">Debug Panel</h3>
              <button
                onClick={() => setShowDebug(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3 text-xs">
              {/* Estado general */}
              <div className="border-b pb-2">
                <strong>Estado General:</strong>
                <div className="ml-2">
                  <div>Modo: {checkoutMode ? 'Check-out' : 'Check-in'}</div>
                  <div>Piso seleccionado: {selectedFloor}</div>
                  <div>Total pisos: {Object.keys(roomsData || {}).length}</div>
                  <div>Total órdenes: {Object.keys(savedOrders || {}).length}</div>
                </div>
              </div>

              {/* Habitaciones ocupadas */}
              <div className="border-b pb-2">
                <strong>Habitaciones Ocupadas ({occupiedRooms.length}):</strong>
                <div className="ml-2 max-h-20 overflow-y-auto">
                  {occupiedRooms.map(room => (
                    <div key={room.number} className="flex justify-between">
                      <span>{room.number}</span>
                      <span className={savedOrders[room.number] ? 'text-green-600' : 'text-red-600'}>
                        {savedOrders[room.number] ? '✅' : '❌'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Órdenes guardadas */}
              <div className="border-b pb-2">
                <strong>Órdenes Guardadas ({roomsWithOrders.length}):</strong>
                <div className="ml-2 max-h-20 overflow-y-auto">
                  {roomsWithOrders.map(roomNum => (
                    <div key={roomNum} className="text-xs">
                      <div className="flex justify-between">
                        <span>{roomNum}:</span>
                        <span className="text-blue-600">{savedOrders[roomNum].guestName}</span>
                      </div>
                      <div className="text-gray-500 truncate">
                        ID: {savedOrders[roomNum].reservationId || 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Problemas detectados */}
              <div className="border-b pb-2">
                <strong>Problemas Detectados:</strong>
                <div className="ml-2">
                  {occupiedRooms.filter(room => !savedOrders[room.number]).map(room => (
                    <div key={room.number} className="text-red-600 text-xs">
                      Room {room.number}: Ocupada pero sin orden
                      {room.guestName && <div className="ml-2">Huésped: {room.guestName}</div>}
                      {room.reservationId && <div className="ml-2">Reserva: {room.reservationId}</div>}
                    </div>
                  ))}
                  {roomsWithOrders.filter(roomNum => 
                    !occupiedRooms.find(room => room.number === roomNum)
                  ).map(roomNum => (
                    <div key={roomNum} className="text-orange-600 text-xs">
                      Room {roomNum}: Orden sin habitación ocupada
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones de debug */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    debugData()
                    console.log('🔍 Full debug executed')
                  }}
                  className="w-full bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                >
                  Log Complete Debug Info
                </button>
                
                <button
                  onClick={() => {
                    console.log('🏠 RoomsByFloor:', roomsData)
                    console.log('📋 SavedOrders:', savedOrders)
                  }}
                  className="w-full bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                >
                  Log Raw Data
                </button>
                
                <button
                  onClick={() => {
                    const missingOrders = occupiedRooms.filter(room => !savedOrders[room.number])
                    console.log('❌ Occupied rooms without orders:', missingOrders)
                    if (missingOrders.length > 0) {
                      alert(`Habitaciones ocupadas sin orden: ${missingOrders.map(r => r.number).join(', ')}`)
                    } else {
                      alert('Todas las habitaciones ocupadas tienen órdenes ✅')
                    }
                  }}
                  className="w-full bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
                >
                  Check Missing Orders
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Manejar errores de carga
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error al cargar datos</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-4">
              <Button
                variant="primary"
                onClick={refreshData}
                icon={RefreshCw}
                disabled={loading}
              >
                {loading ? 'Recargando...' : 'Reintentar'}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Recargar página completa
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Estado de carga inicial
  if (loading && orderStep === 0) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Reception Panel</h1>
            <p className="text-gray-600">Gestión de Check-in y Check-out</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos de habitaciones...</p>
            <p className="text-gray-400 text-sm mt-2">Conectando con Supabase...</p>
          </div>
        </div>
      </div>
    )
  }

  // Obtener datos de habitaciones
  const roomsData = getRoomsData()

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Reception Panel</h1>
          <p className="text-gray-600">Gestión de Check-in y Check-out</p>
        </div>

        {/* Action Buttons - Solo mostrar en paso 0 */}
        {orderStep === 0 && (
          <div className="flex justify-center space-x-4 mb-8">
            <Button
              variant={!checkoutMode ? "primary" : "outline"}
              size="lg"
              icon={LogIn}
              onClick={handleCheckInClick}
              className="px-8 py-4 text-lg"
              disabled={loading}
            >
              Check In
            </Button>
            
            <Button
              variant={checkoutMode ? "danger" : "outline"}
              size="lg"
              icon={LogOut}
              onClick={handleCheckOutClick}
              className="px-8 py-4 text-lg"
              disabled={loading}
            >
              Check Out
            </Button>

            <Button
              variant="outline"
              size="lg"
              icon={RefreshCw}
              onClick={refreshData}
              className="px-4 py-4"
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>
          </div>
        )}

        {/* Contenido Principal */}
        <div className="bg-white rounded-lg shadow-lg p-6">

          {/* Paso 0: Grid de Habitaciones */}
          {orderStep === 0 && (
            <RoomGrid
              floorRooms={roomsData}
              selectedFloor={selectedFloor}
              selectedRoom={selectedRoom}
              checkoutMode={checkoutMode}
              savedOrders={savedOrders || {}}
              onFloorChange={handleFloorChange}
              onRoomClick={handleRoomClick}
              onNext={() => {}} // No se usa más
            />
          )}

          {/* Paso 1: Selección de Snacks */}
          {orderStep === 1 && !checkoutMode && (
            <SnackSelection
              currentOrder={currentOrder}
              selectedSnackType={selectedSnackType}
              selectedSnacks={selectedSnacks}
              snackTypes={snackTypes}
              snackItems={snackItems}
              onBack={() => setOrderStep(0)}
              onSnackTypeSelect={handleSnackTypeSelect}
              onSnackSelect={handleSnackSelect}
              onSnackRemove={handleSnackRemove}
              onQuantityUpdate={handleQuantityUpdate}
              onConfirmOrder={handleConfirmOrder}
              onConfirmRoomOnly={handleConfirmRoomOnly}
              onCancelOrder={resetOrder}
            />
          )}

          {/* Paso 2: Resumen de Check Out */}
          {orderStep === 2 && checkoutMode && (
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
                <span>Total habitaciones: {Object.values(roomsData).flat().length}</span>
                <span>Órdenes guardadas: {Object.keys(savedOrders || {}).length}</span>
                <span>Modo: {checkoutMode ? 'Check-out' : 'Check-in'}</span>
              </div>
              <div className="text-xs text-gray-400">
                Última actualización: {new Date().toLocaleTimeString()}
              </div>
            </div>
            
            {/* Debug info en desarrollo */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                <strong>Debug:</strong> 
                Loading: {loading ? 'Sí' : 'No'} | 
                Error: {error ? 'Sí' : 'No'} | 
                Rooms: {typeof roomsData} | 
                Keys: {Object.keys(roomsData).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panel de Debug - Solo en desarrollo */}
      <DebugPanel />
    </div>
  )
}

export default CheckIn