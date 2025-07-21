// src/pages/CheckIn/CheckIn.jsx - CON LIMPIEZA RÁPIDA INTEGRADA
import React, { useState, useEffect } from 'react'
import { LogIn, LogOut, RefreshCw, Sparkles } from 'lucide-react'
import Button from '../../components/common/Button'
import RoomGrid from '../../components/checkin/RoomGrid'
import SnackSelection from '../../components/checkin/SnackSelection'
import CheckoutSummary from '../../components/checkin/CheckoutSummary'
import { useCheckInData } from '../../hooks/useCheckInData'
import { db } from '../../lib/supabase'
import toast from 'react-hot-toast'

const CheckIn = () => {
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [orderStep, setOrderStep] = useState(0)
  const [checkoutMode, setCheckoutMode] = useState(false)
  const [selectedSnackType, setSelectedSnackType] = useState(null)
  const [selectedSnacks, setSelectedSnacks] = useState([])
  const [currentOrder, setCurrentOrder] = useState(null)
  
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

  // Hook con nueva función de limpieza rápida
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
    cleanRoom, // NUEVA FUNCIÓN
    refreshData,
    debugData,
    setSavedOrders,
    hasQuickCleanCapability // NUEVA FLAG
  } = useCheckInData()

  // Debug al cargar
  useEffect(() => {
    console.log('🔍 CheckIn Component Debug:')
    console.log('Has quick clean capability:', hasQuickCleanCapability)
    
    if (debugData) {
      debugData()
    }
  }, [floorRooms, roomsByFloor, loading, error, debugData, hasQuickCleanCapability])

  // Seleccionar piso automáticamente
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

  // Determinar qué datos usar
  const getRoomsData = () => {
    const rooms = floorRooms || roomsByFloor
    console.log('📊 Using rooms data:', rooms)
    return rooms || {}
  }

  // Handler para cambio de piso
  const handleFloorChange = (floor) => {
    console.log(`🏠 Changing to floor ${floor}`)
    setSelectedFloor(floor)
    setSelectedRoom(null)
  }

  // NUEVO: Handler para limpieza rápida
  const handleQuickClean = async (roomId) => {
    try {
      console.log(`✨ Quick clean requested for room ID: ${roomId}`)
      
      // Mostrar confirmación
      const roomData = Object.values(getRoomsData())
        .flat()
        .find(room => room.id === roomId || room.room_id === roomId)
      
      const roomNumber = roomData?.number || 'desconocida'
      
      const confirmed = window.confirm(
        `¿Marcar habitación ${roomNumber} como limpia y disponible?`
      )
      
      if (!confirmed) return
      
      // Llamar función de limpieza
      const { data, error } = await cleanRoom(roomId)
      
      if (error) {
        toast.error(`Error al limpiar habitación: ${error.message}`)
        return
      }
      
      // Mostrar notificación de éxito con efecto especial
      toast.success(`🎉 Habitación ${roomNumber} lista para nuevos huéspedes!`, {
        duration: 4000,
        icon: '✨',
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

  // Funciones auxiliares para búsqueda de reservas
  const searchReservationForRoom = async (room) => {
    try {
      const { data: reservations, error } = await db.getReservations({
        roomId: room.id
      })
      
      if (error) {
        console.error('Error searching reservations:', error)
        return null
      }
      
      const today = new Date().toISOString().split('T')[0]
      
      const relevantReservation = reservations?.find(r => r.status === 'checked_in') ||
                                reservations?.find(r => 
                                  r.status === 'confirmed' && 
                                  new Date(r.check_in).toISOString().split('T')[0] <= today
                                )
      
      return relevantReservation || null
    } catch (error) {
      console.error('Error in searchReservationForRoom:', error)
      return null
    }
  }

  const createTemporaryOrderFromReservation = (room, reservation) => {
    console.log('📋 Creating order from database reservation:', reservation)
    
    const floor = Math.floor(parseInt(room.number) / 100)
    const roomPrice = parseFloat(reservation.rate) || roomPrices[floor] || 100
    
    const orderFound = {
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
      guestName: reservation.guest?.full_name || 
                `${reservation.guest?.first_name || ''} ${reservation.guest?.last_name || ''}`.trim(),
      guestId: reservation.guest_id,
      reservationId: reservation.id,
      confirmationCode: reservation.confirmation_code,
      reservationStatus: reservation.status,
      guestEmail: reservation.guest?.email || '',
      guestPhone: reservation.guest?.phone || '',
      specialRequests: reservation.special_requests || '',
      paymentStatus: reservation.payment_status || 'pending',
      checkedInAt: reservation.checked_in_at,
      needsAutoCheckIn: reservation.status === 'confirmed'
    }
    
    setSavedOrders(prev => ({
      ...prev,
      [room.number]: orderFound
    }))
    
    if (orderFound.needsAutoCheckIn) {
      handleAutoCheckIn(orderFound)
    }
    
    setCurrentOrder(orderFound)
    setOrderStep(2)
    
    toast.success(`Información de reserva encontrada para habitación ${room.number}`)
  }

  const createTemporaryOrderFromRoomData = (room) => {
    const floor = Math.floor(parseInt(room.number) / 100)
    const roomPrice = roomPrices && roomPrices[floor] ? roomPrices[floor] : 100
    
    const orderFound = {
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
      guestEmail: room.currentGuest?.email || '',
      guestPhone: room.currentGuest?.phone || '',
      specialRequests: room.activeReservation?.special_requests || '',
      paymentStatus: room.activeReservation?.payment_status || 'pending',
      checkedInAt: room.activeReservation?.checked_in_at || new Date().toISOString(),
      isTemporary: true
    }
    
    console.log('📋 Temporary order created from room data:', orderFound)
    
    setSavedOrders(prev => ({
      ...prev,
      [room.number]: orderFound
    }))
    
    return orderFound
  }

  const handleAutoCheckIn = async (order) => {
    try {
      console.log('🔄 Performing automatic check-in for reservation:', order.reservationId)
      
      const { error } = await db.updateReservation(order.reservationId, {
        status: 'checked_in',
        checked_in_at: new Date().toISOString()
      })
      
      if (error) {
        console.error('Error in auto check-in:', error)
        toast.warning('Error al actualizar estado de reserva automáticamente')
        return
      }
      
      setSavedOrders(prev => ({
        ...prev,
        [order.room.number]: {
          ...order,
          reservationStatus: 'checked_in',
          checkedInAt: new Date().toISOString(),
          needsAutoCheckIn: false
        }
      }))
      
      toast.success(`Check-in automático realizado para habitación ${order.room.number}`)
      
    } catch (error) {
      console.error('Error in handleAutoCheckIn:', error)
      toast.error('Error al realizar check-in automático')
    }
  }

  const handleNoOrderFound = (room) => {
    console.error('❌ No order information found for room:', room.number)
    
    toast((t) => (
      <div className="max-w-md">
        <p className="font-semibold mb-2">No se encontró información de reserva</p>
        <p className="text-sm text-gray-600 mb-3">
          Habitación {room.number} está ocupada pero no tiene reserva activa.
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              refreshData()
              toast.dismiss(t.id)
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Recargar Datos
          </button>
          <button
            onClick={() => {
              createManualCheckIn(room)
              toast.dismiss(t.id)
            }}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Check-in Manual
          </button>
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => {
                debugData()
                toast.dismiss(t.id)
              }}
              className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
            >
              Debug
            </button>
          )}
        </div>
      </div>
    ), { 
      duration: 10000,
      position: 'top-center'
    })
  }

  const createManualCheckIn = async (room) => {
    try {
      const floor = Math.floor(parseInt(room.number) / 100)
      const roomPrice = roomPrices[floor] || 100
      
      const { data: guest, error: guestError } = await db.createGuest({
        first_name: 'Huésped',
        last_name: 'Manual',
        email: `manual-${room.number}@hotel.com`,
        phone: '+51999999999',
        document_type: 'DNI',
        document_number: `MANUAL-${room.number}`
      })
      
      if (guestError) {
        throw new Error('Error creando huésped temporal: ' + guestError.message)
      }
      
      const reservationData = {
        guest_id: guest.id,
        room_id: room.id,
        branch_id: 1,
        check_in: new Date().toISOString().split('T')[0],
        check_out: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        adults: 1,
        children: 0,
        status: 'checked_in',
        total_amount: roomPrice,
        rate: roomPrice,
        source: 'manual',
        special_requests: 'Check-in manual desde interfaz',
        payment_status: 'pending'
      }
      
      const { data: reservation, error: reservationError } = await db.createReservation(reservationData)
      
      if (reservationError) {
        throw new Error('Error creando reserva: ' + reservationError.message)
      }
      
      const newOrder = {
        id: reservation.id,
        room: {
          id: room.id,
          number: room.number,
          status: 'occupied',
          floor: room.floor || floor,
          room_type: room.room_type || 'Habitación Estándar'
        },
        roomPrice: roomPrice,
        snacks: [],
        total: roomPrice,
        checkInDate: reservationData.check_in,
        checkOutDate: reservationData.check_out,
        guestName: `${guest.first_name} ${guest.last_name}`,
        guestId: guest.id,
        reservationId: reservation.id,
        confirmationCode: reservation.confirmation_code,
        reservationStatus: 'checked_in',
        isManual: true
      }
      
      setSavedOrders(prev => ({
        ...prev,
        [room.number]: newOrder
      }))
      
      setCurrentOrder(newOrder)
      setOrderStep(2)
      
      toast.success(`Check-in manual creado para habitación ${room.number}`)
      
    } catch (error) {
      console.error('Error in createManualCheckIn:', error)
      toast.error('Error al crear check-in manual: ' + error.message)
    }
  }

  // FUNCIÓN PRINCIPAL: handleRoomClick
  const handleRoomClick = (room) => {
    if (loading) {
      toast.info('Cargando datos, por favor espera...')
      return
    }

    console.log('🔘 Room clicked:', room)

    if (checkoutMode) {
      // Modo Check-out: solo habitaciones ocupadas
      if (room.status === 'occupied') {
        setSelectedRoom(room)
        
        let orderFound = null
        
        // 1. Buscar por número de habitación en savedOrders
        if (savedOrders && savedOrders[room.number]) {
          orderFound = savedOrders[room.number]
          console.log('✅ Order found by room number:', orderFound)
          
          if (orderFound.needsAutoCheckIn && orderFound.reservationStatus === 'confirmed') {
            console.log('🔄 Auto check-in needed for confirmed reservation')
            handleAutoCheckIn(orderFound)
          }
        }
        
        // 2. Si no se encuentra, buscar por reservationId
        if (!orderFound && room.reservationId) {
          const orderByReservationId = Object.values(savedOrders || {}).find(
            order => order.reservationId === room.reservationId
          )
          if (orderByReservationId) {
            orderFound = orderByReservationId
            console.log('✅ Order found by reservationId:', orderFound)
          }
        }
        
        // 3. Buscar reserva directamente en base de datos
        if (!orderFound) {
          console.log('🔍 Searching for reservation directly in database...')
          searchReservationForRoom(room).then(reservation => {
            if (reservation) {
              console.log('✅ Found reservation in database:', reservation)
              createTemporaryOrderFromReservation(room, reservation)
            } else {
              if (room.currentGuest || room.guestName || room.activeReservation) {
                console.log('⚠️ Creating temporary order from room data')
                const tempOrder = createTemporaryOrderFromRoomData(room)
                setCurrentOrder(tempOrder)
                setOrderStep(2)
              } else {
                handleNoOrderFound(room)
              }
            }
          })
          return
        }
        
        if (orderFound) {
          setCurrentOrder(orderFound)
          setOrderStep(2)
          console.log('✅ Proceeding to checkout with order:', orderFound)
        }
      } else {
        toast.warning('Solo puedes hacer check-out de habitaciones ocupadas (rojas)')
      }
    } else {
      // Modo Check-in: solo habitaciones disponibles y limpias
      if (room.status === 'available' && room.cleaning_status === 'clean') {
        setSelectedRoom(room)
        const floor = Math.floor(parseInt(room.number) / 100)
        const roomPrice = roomPrices && roomPrices[floor] ? roomPrices[floor] : 100
        
        console.log(`💰 Room price for floor ${floor}: ${roomPrice}`)
        
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
        
        setCurrentOrder({
          room: room,
          roomPrice: roomPrice,
          snacks: [],
          total: roomPrice
        })
        setOrderStep(1)
      } else if (room.status === 'occupied') {
        toast.warning('Esta habitación ya está ocupada')
      } else if (room.cleaning_status === 'dirty') {
        // NUEVA: Ofrecer limpiar la habitación
        toast((t) => (
          <div className="max-w-md">
            <p className="font-semibold mb-2">Habitación necesita limpieza</p>
            <p className="text-sm text-gray-600 mb-3">
              ¿Deseas marcarla como limpia para que esté disponible?
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  handleQuickClean(room.id || room.room_id)
                  toast.dismiss(t.id)
                }}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 flex items-center space-x-1"
              >
                <Sparkles size={14} />
                <span>Limpiar Ahora</span>
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        ), { 
          duration: 8000,
          position: 'top-center'
        })
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

  const handleCheckInClick = () => {
    console.log('🏨 Switching to checkin mode')
    setCheckoutMode(false)
    setSelectedRoom(null)
    setOrderStep(0)
    setSelectedSnacks([])
    setCurrentOrder(null)
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

  const handleGuestDataChange = (newGuestData) => {
    setGuestData(newGuestData)
    console.log('👤 Guest data updated:', newGuestData)
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

  // Confirmar check-in con snacks y datos de huésped
  const handleConfirmOrder = async () => {
    if (!currentOrder) {
      toast.error('No hay orden actual')
      return
    }

    if (!guestData.fullName?.trim() || !guestData.documentNumber?.trim() || !guestData.phone?.trim()) {
      toast.error('Por favor complete los datos obligatorios del huésped')
      return
    }

    console.log('✅ Confirming order with snacks and guest data:', { guestData, selectedSnacks })

    try {
      const { data, error } = await processCheckIn(currentOrder, selectedSnacks, guestData)
      
      if (error) {
        toast.error(error.message || 'Error al procesar check-in')
        return
      }

      const snacksTotal = selectedSnacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0)
      
      toast.success(
        `Check-in sin reserva completado!\nHuésped: ${guestData.fullName}\nHabitación: ${currentOrder.room.number}\nTotal: S/ ${(currentOrder.roomPrice + snacksTotal).toFixed(2)}`,
        { duration: 5000 }
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

    if (!guestData.fullName?.trim() || !guestData.documentNumber?.trim() || !guestData.phone?.trim()) {
      toast.error('Por favor complete los datos obligatorios del huésped')
      return
    }

    console.log('✅ Confirming room only order with guest data:', guestData)

    try {
      const { data, error } = await processCheckIn(currentOrder, [], guestData)
      
      if (error) {
        toast.error(error.message || 'Error al procesar check-in')
        return
      }

      toast.success(
        `Check-in sin reserva completado!\nHuésped: ${guestData.fullName}\nHabitación: ${currentOrder.room.number}\nTotal: S/ ${currentOrder.roomPrice.toFixed(2)}`,
        { duration: 5000 }
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

  // Panel de Debug para desarrollo
  const DebugPanel = () => {
    const [showDebug, setShowDebug] = useState(false)

    if (process.env.NODE_ENV !== 'development') {
      return null
    }

    const roomsData = getRoomsData()
    const needsCleaningRooms = Object.values(roomsData || {})
      .flat()
      .filter(room => room.cleaning_status === 'dirty' || room.status === 'cleaning')

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
              <div className="border-b pb-2">
                <strong>Estado General:</strong>
                <div className="ml-2">
                  <div>Modo: {checkoutMode ? 'Check-out' : 'Check-in'}</div>
                  <div>Piso seleccionado: {selectedFloor}</div>
                  <div>Limpieza rápida: {hasQuickCleanCapability ? '✅' : '❌'}</div>
                  <div>Habitaciones sucias: {needsCleaningRooms.length}</div>
                </div>
              </div>

              <div className="border-b pb-2">
                <strong>Habitaciones que necesitan limpieza:</strong>
                <div className="ml-2 max-h-20 overflow-y-auto">
                  {needsCleaningRooms.map(room => (
                    <div key={room.number} className="flex justify-between">
                      <span>{room.number}</span>
                      <button
                        onClick={() => handleQuickClean(room.id || room.room_id)}
                        className="text-green-600 hover:text-green-800 text-xs"
                      >
                        ✨ Limpiar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    debugData()
                    console.log('🔍 Full debug executed')
                  }}
                  className="w-full bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                >
                  Log Debug Info
                </button>
                
                <button
                  onClick={() => {
                    const dirtyRooms = needsCleaningRooms.length
                    if (dirtyRooms > 0) {
                      alert(`Hay ${dirtyRooms} habitaciones que necesitan limpieza`)
                    } else {
                      alert('Todas las habitaciones están limpias ✅')
                    }
                  }}
                  className="w-full bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
                >
                  Check Limpieza
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
          <p className="text-gray-600">
            {checkoutMode ? 'Check-out de huéspedes' : 'Check-in sin reservación'}
          </p>
          {orderStep === 1 && !checkoutMode && (
            <div className="mt-2 inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm">
              🆕 Registro directo sin reserva previa - Complete los datos del huésped
            </div>
          )}
          {/* NUEVA: Indicador de funcionalidad de limpieza rápida */}
          {hasQuickCleanCapability && orderStep === 0 && (
            <div className="mt-2 inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm">
              ✨ Limpieza rápida habilitada - Click en el botón ✨ para limpiar habitaciones
            </div>
          )}
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
              Check In Directo
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

            {/* NUEVO: Botón de limpieza rápida */}
            {hasQuickCleanCapability && (
              <Button
                variant="success"
                size="lg"
                icon={Sparkles}
                onClick={() => {
                  const needsCleaningRooms = Object.values(roomsData || {})
                    .flat()
                    .filter(room => room.cleaning_status === 'dirty' || room.status === 'cleaning')
                  
                  if (needsCleaningRooms.length === 0) {
                    toast.success('Todas las habitaciones están limpias ✨')
                  } else {
                    toast.info(`${needsCleaningRooms.length} habitación${needsCleaningRooms.length > 1 ? 'es' : ''} necesita${needsCleaningRooms.length === 1 ? '' : 'n'} limpieza. Click en ✨ junto a cada habitación.`)
                  }
                }}
                className="px-6 py-4"
                disabled={loading}
              >
                Estado Limpieza
              </Button>
            )}
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
              onCleanRoom={handleQuickClean} // NUEVA PROP
            />
          )}

          {/* Paso 1: Registro de Huésped y Selección de Snacks */}
          {orderStep === 1 && !checkoutMode && (
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
                <span>Modo: {checkoutMode ? 'Check-out' : 'Check-in directo'}</span>
                {/* NUEVA: Información de limpieza */}
                {hasQuickCleanCapability && (
                  <span className="text-green-600 font-medium">
                    Necesitan limpieza: {Object.values(roomsData).flat().filter(r => r.cleaning_status === 'dirty' || r.status === 'cleaning').length}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                Última actualización: {new Date().toLocaleTimeString()}
              </div>
            </div>
            
            {/* Información del modo */}
            <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
              {checkoutMode ? (
                <span>💡 <strong>Modo Check-out:</strong> Selecciona una habitación ocupada (roja) para procesar la salida del huésped</span>
              ) : (
                <span>💡 <strong>Modo Check-in Directo:</strong> Selecciona una habitación disponible (verde) para registrar un huésped sin reserva previa</span>
              )}
              {/* NUEVA: Información de limpieza */}
              {hasQuickCleanCapability && (
                <span className="block mt-1">
                  ✨ <strong>Limpieza Rápida:</strong> Click en el botón ✨ junto a habitaciones amarillas para marcarlas como limpias
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Panel de Debug - Solo en desarrollo */}
      <DebugPanel />
    </div>
  )
}

export default CheckIn;