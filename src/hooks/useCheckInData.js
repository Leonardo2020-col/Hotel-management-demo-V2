// src/hooks/useCheckInData.js - AÑADIDA FUNCIÓN DE LIMPIEZA RÁPIDA
import { useState, useEffect } from 'react'
import { db } from '../lib/supabase'
import toast from 'react-hot-toast'

export const useCheckInData = () => {
  const [roomsByFloor, setRoomsByFloor] = useState({})
  const [savedOrders, setSavedOrders] = useState({})
  const [snackItems, setSnackItems] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Tipos de snacks 
  const snackTypes = [
    { id: 'FRUTAS', name: 'FRUTAS', description: 'Frutas frescas y naturales' },
    { id: 'BEBIDAS', name: 'BEBIDAS', description: 'Bebidas frías y calientes' },
    { id: 'SNACKS', name: 'SNACKS', description: 'Bocadillos y aperitivos' },
    { id: 'POSTRES', name: 'POSTRES', description: 'Dulces y postres' }
  ]

  // Precios de habitaciones por piso 
  const roomPrices = {
    1: 80.00,
    2: 95.00,
    3: 110.00,
    4: 120.00
  }

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Loading initial data...')
      
      // 1. Cargar habitaciones agrupadas por piso CON RESERVAS
      console.log('📍 Loading rooms by floor with reservations...')
      const roomsData = await loadRoomsByFloorWithReservations()
      console.log('✅ Rooms loaded:', roomsData)
      
      // 2. Cargar snacks
      console.log('🍎 Loading snack items...')
      const { data: snacksData, error: snacksError } = await db.getSnackItems()
      if (snacksError) {
        console.warn('⚠️ Snacks error:', snacksError)
      }
      console.log('✅ Snacks loaded:', snacksData)
      
      // 3. Cargar órdenes guardadas (reservas activas)
      console.log('📋 Loading saved orders from reservations...')
      const ordersData = await loadSavedOrdersFromReservations()
      console.log('✅ Orders loaded:', ordersData)
      
      // Actualizar estado
      setRoomsByFloor(roomsData || {})
      setSnackItems(snacksData || {})
      setSavedOrders(ordersData || {})
      
      console.log('🎉 All data loaded successfully!')
      
    } catch (err) {
      console.error('❌ Error loading initial data:', err)
      setError(err.message || 'Error al cargar datos del check-in')
      toast.error('Error al cargar datos del check-in')
    } finally {
      setLoading(false)
    }
  }

  // FUNCIÓN CORREGIDA: Cargar habitaciones por piso CON información de reservas
  const loadRoomsByFloorWithReservations = async () => {
    try {
      // Obtener habitaciones con información de reservas
      const { data: rooms, error } = await db.getRooms()
      
      if (error) {
        console.warn('Error getting rooms, using mock data:', error)
        return generateMockRooms()
      }
      
      if (!rooms || !Array.isArray(rooms)) {
        console.warn('No rooms data or invalid format, using mock data')
        return generateMockRooms()
      }
      
      console.log('📊 Raw rooms data with reservations:', rooms)
      
      // Agrupar habitaciones por piso correctamente
      const roomsByFloor = {}
      
      rooms.forEach(room => {
        const floor = room.floor || Math.floor(parseInt(room.number) / 100) || 1
        
        if (!roomsByFloor[floor]) {
          roomsByFloor[floor] = []
        }
        
        // Formatear habitación correctamente CON información de reservas
        const formattedRoom = {
          id: room.id,
          number: room.number,
          status: room.status || 'available',
          cleaning_status: room.cleaning_status || 'clean',
          //room_type: room.room_type || 'Habitación Estándar',
          capacity: room.capacity || 2,
          rate: room.base_rate || roomPrices[floor] || 100,
          beds: room.beds || [{ type: 'Doble', count: 1 }],
          features: room.features || ['WiFi Gratis'],
          room_id: room.id,
          floor: floor,
          // INFORMACIÓN DE RESERVAS - MEJORADA
          currentGuest: room.currentGuest || null,
          nextReservation: room.nextReservation || null,
          activeReservation: room.activeReservation || null,
          // Información adicional si existe
          guestName: room.currentGuest?.name || null,
          checkInDate: room.activeReservation?.check_in || null,
          checkOutDate: room.activeReservation?.check_out || null,
          reservationId: room.activeReservation?.id || null,
          confirmationCode: room.activeReservation?.confirmation_code || null
        }
        
        roomsByFloor[floor].push(formattedRoom)
      })
      
      // Ordenar habitaciones por número dentro de cada piso
      Object.keys(roomsByFloor).forEach(floor => {
        roomsByFloor[floor].sort((a, b) => {
          const numA = parseInt(a.number) || 0
          const numB = parseInt(b.number) || 0
          return numA - numB
        })
      })
      
      console.log('📋 Formatted rooms by floor with reservations:', roomsByFloor)
      
      return roomsByFloor
      
    } catch (error) {
      console.error('❌ Error in loadRoomsByFloorWithReservations:', error)
      return generateMockRooms()
    }
  }

  // Cargar órdenes guardadas desde reservas
  const loadSavedOrdersFromReservations = async () => {
    try {
      console.log('📋 Loading saved orders from multiple reservation states...')
      
      const today = new Date().toISOString().split('T')[0]
      
      // 1. Obtener reservas actualmente en checked_in
      const { data: checkedInReservations, error: checkedInError } = await db.getReservations({
        status: 'checked_in'
      })
      
      if (checkedInError) {
        console.warn('Error loading checked-in reservations:', checkedInError)
      }
      
      // 2. Obtener reservas confirmadas para hoy
      const { data: confirmedReservations, error: confirmedError } = await db.getReservations({
        status: 'confirmed'
      })
      
      if (confirmedError) {
        console.warn('Error loading confirmed reservations:', confirmedError)
      }
      
      // 3. Combinar ambos tipos de reservas
      const allReservations = [
        ...(checkedInReservations || []),
        ...(confirmedReservations || []).filter(reservation => {
          const checkInDate = new Date(reservation.check_in).toISOString().split('T')[0]
          return checkInDate <= today
        })
      ]
      
      console.log('📊 Found reservations:', {
        checkedIn: checkedInReservations?.length || 0,
        confirmedForToday: confirmedReservations?.filter(r => 
          new Date(r.check_in).toISOString().split('T')[0] <= today
        ).length || 0,
        total: allReservations.length
      })
      
      // Convertir reservas a formato de órdenes guardadas
      const orders = {}
      
      if (allReservations && Array.isArray(allReservations)) {
        allReservations.forEach(reservation => {
          if (reservation.room && reservation.guest) {
            const roomNumber = reservation.room.number
            if (orders[roomNumber] && orders[roomNumber].reservationStatus === 'checked_in') {
              return
            }
            
            const floor = Math.floor(parseInt(reservation.room.number) / 100)
            const roomPrice = parseFloat(reservation.rate) || roomPrices[floor] || 100
            
            orders[roomNumber] = {
              id: reservation.id,
              room: {
                id: reservation.room.id,
                number: reservation.room.number,
                status: 'occupied',
                floor: reservation.room.floor,
                //room_type: reservation.room.room_type || 'Habitación Estándar'
              },
              roomPrice: roomPrice,
              snacks: [],
              total: parseFloat(reservation.total_amount) || roomPrice,
              checkInDate: reservation.check_in,
              checkOutDate: reservation.check_out,
              guestName: reservation.guest.full_name || 
                        `${reservation.guest.first_name || ''} ${reservation.guest.last_name || ''}`.trim(),
              guestId: reservation.guest_id,
              reservationId: reservation.id,
              confirmationCode: reservation.confirmation_code,
              reservationStatus: reservation.status,
              guestEmail: reservation.guest.email,
              guestPhone: reservation.guest.phone,
              guestDocument: reservation.guest.document_number,
              specialRequests: reservation.special_requests,
              paymentStatus: reservation.payment_status,
              checkedInAt: reservation.checked_in_at,
              nights: reservation.nights || Math.ceil(
                (new Date(reservation.check_out) - new Date(reservation.check_in)) / (1000 * 60 * 60 * 24)
              ),
              needsAutoCheckIn: reservation.status === 'confirmed'
            }
          }
        })
      }
      
      console.log('📋 Saved orders created from reservations:', orders)
      return orders
      
    } catch (error) {
      console.error('Error in loadSavedOrdersFromReservations:', error)
      return {}
    }
  }

  // NUEVA FUNCIÓN: Limpiar habitación con un click
  const cleanRoom = async (roomId) => {
    try {
      console.log(`🧹 Quick cleaning room with ID: ${roomId}`)
      
      // Actualizar estado de la habitación a disponible y limpia
      const { data, error } = await db.updateRoomStatus(roomId, 'available', 'clean')
      
      if (error) {
        throw new Error(`Error updating room status: ${error.message}`)
      }
      
      // Actualizar estado local inmediatamente
      setRoomsByFloor(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(floor => {
          if (Array.isArray(updated[floor])) {
            updated[floor] = updated[floor].map(room => 
              room.id === roomId || room.room_id === roomId
                ? { 
                    ...room, 
                    status: 'available', 
                    cleaning_status: 'clean',
                    last_cleaned: new Date().toISOString(),
                    cleaned_by: 'Sistema'
                  }
                : room
            )
          }
        })
        return updated
      })
      
      // Encontrar el número de habitación para el toast
      let roomNumber = 'desconocida'
      Object.values(roomsByFloor).flat().forEach(room => {
        if ((room.id === roomId || room.room_id === roomId)) {
          roomNumber = room.number
        }
      })
      
      console.log('✅ Room cleaned successfully')
      toast.success(`Habitación ${roomNumber} marcada como limpia y disponible`, {
        icon: '✨',
        duration: 3000
      })
      
      return { data, error: null }
      
    } catch (error) {
      console.error('❌ Error cleaning room:', error)
      toast.error(`Error al limpiar habitación: ${error.message}`)
      return { data: null, error }
    }
  }

  // Generar habitaciones mock para pruebas
  const generateMockRooms = () => {
    console.log('🏗️ Generating mock rooms...')
    
    const mockRooms = {
      1: [
        {
          id: 1,
          number: '101',
          status: 'available',
          cleaning_status: 'clean',
          //room_type: 'Habitación Estándar',
          capacity: 2,
          rate: 80.00,
          beds: [{ type: 'Doble', count: 1 }],
          features: ['WiFi Gratis', 'TV Smart'],
          room_id: 1,
          floor: 1,
          currentGuest: null,
          activeReservation: null
        },
        {
          id: 2,
          number: '102',
          status: 'occupied',
          cleaning_status: 'dirty',
          //room_type: 'Habitación Estándar',
          capacity: 2,
          rate: 80.00,
          beds: [{ type: 'Individual', count: 2 }],
          features: ['WiFi Gratis', 'TV Smart'],
          room_id: 2,
          floor: 1,
          currentGuest: {
            id: 1,
            name: 'Juan Pérez',
            email: 'juan@example.com',
            phone: '+51987654321',
            checkIn: '2025-07-19',
            checkOut: '2025-07-21'
          },
          activeReservation: {
            id: 1,
            check_in: '2025-07-19',
            check_out: '2025-07-21',
            confirmation_code: 'HTP-2025-001'
          },
          guestName: 'Juan Pérez',
          reservationId: 1
        },
        {
          id: 3,
          number: '103',
          status: 'cleaning', // Necesita limpieza
          cleaning_status: 'dirty',
          //room_type: 'Habitación Estándar',
          capacity: 2,
          rate: 80.00,
          beds: [{ type: 'Doble', count: 1 }],
          features: ['WiFi Gratis', 'TV Smart'],
          room_id: 3,
          floor: 1,
          currentGuest: null,
          activeReservation: null
        },
        {
          id: 4,
          number: '104',
          status: 'available',
          cleaning_status: 'clean',
          //room_type: 'Habitación Estándar',
          capacity: 2,
          rate: 80.00,
          beds: [{ type: 'Doble', count: 1 }],
          features: ['WiFi Gratis', 'TV Smart'],
          room_id: 4,
          floor: 1,
          currentGuest: null,
          activeReservation: null
        }
      ],
      2: [
        {
          id: 5,
          number: '201',
          status: 'available',
          cleaning_status: 'clean',
          //room_type: 'Habitación Deluxe',
          capacity: 3,
          rate: 95.00,
          beds: [{ type: 'Queen', count: 1 }],
          features: ['WiFi Gratis', 'TV Smart', 'Balcón'],
          room_id: 5,
          floor: 2,
          currentGuest: null,
          activeReservation: null
        },
        {
          id: 6,
          number: '202',
          status: 'occupied',
          cleaning_status: 'dirty',
          //room_type: 'Habitación Deluxe',
          capacity: 3,
          rate: 95.00,
          beds: [{ type: 'King', count: 1 }],
          features: ['WiFi Gratis', 'TV Smart', 'Balcón'],
          room_id: 6,
          floor: 2,
          currentGuest: {
            id: 2,
            name: 'María García',
            email: 'maria@example.com',
            phone: '+51987654322',
            checkIn: '2025-07-18',
            checkOut: '2025-07-20'
          },
          activeReservation: {
            id: 2,
            check_in: '2025-07-18',
            check_out: '2025-07-20',
            confirmation_code: 'HTP-2025-002'
          },
          guestName: 'María García',
          reservationId: 2
        }
      ]
    }
    
    console.log('✅ Mock rooms generated:', mockRooms)
    return mockRooms
  }

  // NUEVA FUNCIÓN: Crear huésped y reserva sin reservación previa
  const createGuestAndReservation = async (roomData, guestData, snacks = []) => {
    try {
      console.log('👤 Creating guest and reservation without prior booking...')
      
      const room = roomData.room || roomData
      const floor = Math.floor(parseInt(room.number) / 100)
      const roomPrice = roomPrices[floor] || 100
      const snacksTotal = snacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0)
      const totalAmount = roomPrice + snacksTotal

      // 1. Crear el huésped primero
      console.log('👤 Creating guest with data:', guestData)
      
      const newGuestData = {
        first_name: guestData.fullName.split(' ')[0] || 'Huésped',
        last_name: guestData.fullName.split(' ').slice(1).join(' ') || 'Registro',
        email: guestData.email || null,
        phone: guestData.phone || null,
        document_type: guestData.documentType || 'DNI',
        document_number: guestData.documentNumber || '',
        nationality: guestData.nationality || 'Peruana',
        gender: guestData.gender || null,
        status: 'active'
      }

      const { data: guest, error: guestError } = await db.createGuest(newGuestData)
      
      if (guestError) {
        throw new Error(`Error creating guest: ${guestError.message}`)
      }

      console.log('✅ Guest created:', guest)

      // 2. Crear la reserva automáticamente
      const reservationData = {
        guest_id: guest.id,
        room_id: room.id || room.room_id,
        branch_id: 1,
        check_in: new Date().toISOString().split('T')[0],
        check_out: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        adults: guestData.adults || 1,
        children: guestData.children || 0,
        status: 'checked_in',
        total_amount: totalAmount,
        rate: roomPrice,
        paid_amount: 0,
        special_requests: [
          guestData.specialRequests || '',
          snacks.length > 0 ? `Snacks: ${snacks.map(s => `${s.name} x${s.quantity}`).join(', ')}` : ''
        ].filter(Boolean).join(' | '),
        payment_status: 'pending',
        source: 'walk_in'
      }

      const { data: reservation, error: reservationError } = await db.createReservation(reservationData)
      
      if (reservationError) {
        await db.deleteGuest(guest.id)
        throw new Error(`Error creating reservation: ${reservationError.message}`)
      }

      console.log('✅ Reservation created:', reservation)

      // 3. Actualizar estado de la habitación a ocupada
      const { error: roomError } = await db.updateRoomStatus(
        room.id || room.room_id, 
        'occupied', 
        'dirty'
      )
      
      if (roomError) {
        console.warn('⚠️ Warning updating room status:', roomError)
      }

      // 4. Crear orden local
      const newOrder = {
        id: reservation.id,
        room: { 
          id: room.id || room.room_id,
          number: room.number, 
          status: 'occupied',
          floor: room.floor || floor,
          //room_type: room.room_type || 'Habitación Estándar'
        },
        roomPrice,
        snacks,
        total: totalAmount,
        checkInDate: reservationData.check_in,
        checkOutDate: reservationData.check_out,
        guestName: guestData.fullName,
        guestId: guest.id,
        reservationId: reservation.id,
        confirmationCode: reservation.confirmation_code,
        guestEmail: guestData.email,
        guestPhone: guestData.phone,
        guestDocument: guestData.documentNumber,
        guestDocumentType: guestData.documentType,
        specialRequests: guestData.specialRequests,
        adults: guestData.adults || 1,
        children: guestData.children || 0,
        nationality: guestData.nationality,
        isWalkIn: true
      }

      // 5. Actualizar estado local
      setSavedOrders(prev => ({
        ...prev,
        [room.number]: newOrder
      }))

      // 6. Actualizar roomsByFloor localmente
      setRoomsByFloor(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(floor => {
          if (Array.isArray(updated[floor])) {
            updated[floor] = updated[floor].map(r => 
              r.number === room.number 
                ? { 
                    ...r, 
                    status: 'occupied', 
                    cleaning_status: 'dirty',
                    currentGuest: {
                      id: guest.id,
                      name: guestData.fullName,
                      email: guestData.email,
                      phone: guestData.phone
                    },
                    activeReservation: {
                      id: reservation.id,
                      check_in: reservationData.check_in,
                      check_out: reservationData.check_out,
                      confirmation_code: reservation.confirmation_code
                    },
                    guestName: guestData.fullName,
                    reservationId: reservation.id
                  }
                : r
            )
          }
        })
        return updated
      })

      toast.success(`Check-in sin reserva completado para habitación ${room.number}`)
      return { data: newOrder, error: null }

    } catch (error) {
      console.error('❌ Error in createGuestAndReservation:', error)
      toast.error(`Error al crear registro: ${error.message}`)
      return { data: null, error }
    }
  }

  // Procesar check-in de habitación
  const processCheckIn = async (roomData, snacks = [], guestData = null) => {
    try {
      // Si hay datos de huésped, es un registro sin reserva previa
      if (guestData) {
        console.log('🆕 Processing walk-in check-in with guest registration')
        return await createGuestAndReservation(roomData, guestData, snacks)
      }

      // Lógica original para check-ins con reserva previa
      const room = roomData.room || roomData
      const floor = Math.floor(parseInt(room.number) / 100)
      const roomPrice = roomPrices[floor] || 100
      const snacksTotal = snacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0)
      const totalAmount = roomPrice + snacksTotal

      console.log('🏨 Processing check-in for room:', room.number)

      // 1. Actualizar estado de la habitación a ocupada
      const { error: roomError } = await db.updateRoomStatus(
        room.id || room.room_id, 
        'occupied', 
        'dirty'
      )
      
      if (roomError) {
        throw new Error(`Error updating room status: ${roomError.message}`)
      }

      // 2. Obtener o crear un huésped por defecto
      let guestId = null
      const { data: guests } = await db.getGuests({ limit: 1 })
      
      if (guests && guests.length > 0) {
        guestId = guests[0].id
      } else {
        const { data: newGuest } = await db.createGuest({
          first_name: 'Huésped',
          last_name: 'Temporal',
          email: `temp${room.number}@hotel.com`,
          phone: '+51999999999',
          document_type: 'DNI',
          document_number: '99999999'
        })
        guestId = newGuest?.id
      }

      // 3. Crear reserva automática
      const reservationData = {
        guest_id: guestId,
        room_id: room.id || room.room_id,
        branch_id: 1,
        check_in: new Date().toISOString().split('T')[0],
        check_out: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        adults: 1,
        children: 0,
        status: 'checked_in',
        total_amount: totalAmount,
        rate: roomPrice,
        paid_amount: totalAmount,
        special_requests: snacks.length > 0 ? `Snacks: ${snacks.map(s => `${s.name} x${s.quantity}`).join(', ')}` : '',
        payment_status: 'paid',
        source: 'direct'
      }

      const { data: reservation, error: reservationError } = await db.createReservation(reservationData)
      
      if (reservationError) {
        throw new Error(`Error creating reservation: ${reservationError.message}`)
      }

      console.log('✅ Reservation created:', reservation)

      // 4. Actualizar órdenes guardadas localmente
      const newOrder = {
        id: reservation.id,
        room: { 
          id: room.id || room.room_id,
          number: room.number, 
          status: 'occupied' 
        },
        roomPrice,
        snacks,
        total: totalAmount,
        checkInDate: reservationData.check_in,
        guestName: guests?.[0]?.full_name || 'Huésped Temporal',
        guestId: guestId,
        reservationId: reservation.id
      }

      setSavedOrders(prev => ({
        ...prev,
        [room.number]: newOrder
      }))

      // 5. Actualizar roomsByFloor localmente
      setRoomsByFloor(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(floor => {
          if (Array.isArray(updated[floor])) {
            updated[floor] = updated[floor].map(r => 
              r.number === room.number 
                ? { ...r, status: 'occupied', cleaning_status: 'dirty' }
                : r
            )
          }
        })
        return updated
      })

      toast.success(`Check-in completado para habitación ${room.number}`)
      return { data: newOrder, error: null }

    } catch (error) {
      console.error('❌ Error processing check-in:', error)
      toast.error(`Error al procesar check-in: ${error.message}`)
      return { data: null, error }
    }
  }

  // Procesar check-out
  const processCheckOut = async (roomNumber, paymentMethod) => {
    try {
      console.log('🚪 Processing check-out for room:', roomNumber)
      
      const order = savedOrders[roomNumber]
      if (!order) {
        const errorMsg = `No se encontró información de reserva para la habitación ${roomNumber}`
        console.error('❌', errorMsg)
        throw new Error(errorMsg)
      }

      console.log('📋 Order found for checkout:', order)

      if (!order.reservationId) {
        const errorMsg = `ID de reserva no encontrado para la habitación ${roomNumber}`
        console.error('❌', errorMsg)
        throw new Error(errorMsg)
      }

      // 1. Actualizar reserva a checked_out
      const { error: reservationError } = await db.updateReservation(order.reservationId, {
        status: 'checked_out',
        checked_out_at: new Date().toISOString(),
        payment_status: 'paid',
        payment_method: paymentMethod
      })

      if (reservationError) {
        console.error('❌ Error updating reservation:', reservationError)
        throw new Error(`Error updating reservation: ${reservationError.message}`)
      }

      // 2. Actualizar habitación a necesita limpieza (NO a limpieza automática)
      const { error: roomError } = await db.updateRoomStatus(
        order.room.id,
        'available', // CAMBIADO: disponible pero sucia
        'dirty'      // NECESITA limpieza
      )

      if (roomError) {
        console.warn('⚠️ Warning updating room status:', roomError)
      }

      // 3. Remover de órdenes guardadas
      setSavedOrders(prev => {
        const newOrders = { ...prev }
        delete newOrders[roomNumber]
        return newOrders
      })

      // 4. Actualizar roomsByFloor localmente - ESTADO NECESITA LIMPIEZA
      setRoomsByFloor(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(floor => {
          if (Array.isArray(updated[floor])) {
            updated[floor] = updated[floor].map(r => 
              r.number === roomNumber 
                ? { 
                    ...r, 
                    status: 'available',        // DISPONIBLE
                    cleaning_status: 'dirty',   // PERO NECESITA LIMPIEZA
                    currentGuest: null,
                    activeReservation: null,
                    guestName: null,
                    checkInDate: null,
                    checkOutDate: null,
                    reservationId: null
                  }
                : r
            )
          }
        })
        return updated
      })

      console.log('✅ Check-out completed successfully')
      toast.success(`Check-out completado para habitación ${roomNumber}. La habitación necesita limpieza.`, {
        icon: '🚪',
        duration: 4000
      })
      return { data: true, error: null }

    } catch (error) {
      console.error('❌ Error processing check-out:', error)
      toast.error(`Error al procesar check-out: ${error.message}`)
      return { data: null, error }
    }
  }

  // Obtener habitaciones disponibles
  const getAvailableRooms = () => {
    const available = {}
    
    Object.keys(roomsByFloor).forEach(floor => {
      if (Array.isArray(roomsByFloor[floor])) {
        available[floor] = roomsByFloor[floor].filter(room => 
          room.status === 'available' && room.cleaning_status === 'clean'
        )
      }
    })
    
    return available
  }

  // Obtener habitaciones ocupadas
  const getOccupiedRooms = () => {
    const occupied = {}
    
    Object.keys(roomsByFloor).forEach(floor => {
      if (Array.isArray(roomsByFloor[floor])) {
        occupied[floor] = roomsByFloor[floor].filter(room => 
          room.status === 'occupied'
        )
      }
    })
    
    return occupied
  }

  // Agregar esta función al hook useCheckInData
const quickCleanRoom = async (roomId) => {
  try {
    console.log(`✨ Quick clean requested for room ID: ${roomId}`);
    
    // Llamar función de limpieza de Supabase
    const { data, error } = await db.cleanRoomWithClick(roomId);
    
    if (error) {
      throw new Error(`Error updating room status: ${error.message}`);
    }
    
    // Actualizar estado local inmediatamente en roomsByFloor
    setRoomsByFloor(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(floor => {
        if (Array.isArray(updated[floor])) {
          updated[floor] = updated[floor].map(room => 
            room.id === roomId || room.room_id === roomId
              ? { 
                  ...room, 
                  status: 'available', 
                  cleaning_status: 'clean',
                  displayStatus: 'available',
                  last_cleaned: new Date().toISOString(),
                  cleaned_by: 'Reception Staff'
                }
              : room
          );
        }
      });
      return updated;
    });
    
    // Encontrar el número de habitación para el toast
    let roomNumber = 'desconocida';
    Object.values(roomsByFloor).flat().forEach(room => {
      if ((room.id === roomId || room.room_id === roomId)) {
        roomNumber = room.number;
      }
    });
    
    console.log('✅ Room cleaned successfully');
    toast.success(`Habitación ${roomNumber} marcada como limpia y disponible`, {
      icon: '✨',
      duration: 3000
    });
    
    return { data, error: null };
    
  } catch (error) {
    console.error('❌ Error in quickCleanRoom:', error);
    toast.error(`Error al limpiar habitación: ${error.message}`);
    return { data: null, error };
  }
};

  // Actualizar datos en tiempo real
  const refreshData = () => {
    console.log('🔄 Refreshing data...')
    loadInitialData()
  }

  const debugData = () => {
    console.log('🐛 Debug - Current state:')
    console.log('roomsByFloor:', roomsByFloor)
    console.log('savedOrders:', savedOrders)
    console.log('snackItems:', snackItems)
    console.log('loading:', loading)
    console.log('error:', error)
  }

  return {
    // Estado
    roomsByFloor,
    snackTypes,
    snackItems,
    roomPrices,
    savedOrders,
    loading,
    error,
    
    // Acciones principales
    processCheckIn,
    processCheckOut,
    refreshData,
    debugData,
    cleanRoom, // NUEVA FUNCIÓN para limpiar con un click
    
    // Funciones para registro sin reserva
    createGuestAndReservation,
    
    // Utilidades
    getAvailableRooms,
    getOccupiedRooms,
    
    // Para compatibilidad
    floorRooms: roomsByFloor,
    setSavedOrders,
    
    // Información adicional
    hasQuickCleanCapability: true, // NUEVA FLAG
    supportedFeatures: [
      'walk_in_checkin',
      'guest_registration', 
      'snack_selection',
      'quick_room_cleaning' // NUEVA CARACTERÍSTICA
    ]
  }
}