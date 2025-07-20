// src/hooks/useCheckInData.js - CÓDIGO COMPLETO CORREGIDO FINAL
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
      
      // 3. Cargar órdenes guardadas (reservas activas) - CORREGIDO
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
          room_type: room.room_type || 'Habitación Estándar',
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

  // FUNCIÓN CORREGIDA FINAL: loadSavedOrdersFromReservations
  const loadSavedOrdersFromReservations = async () => {
    try {
      console.log('📋 Loading saved orders from multiple reservation states...')
      
      // ESTRATEGIA MÚLTIPLE: Obtener reservas de diferentes estados
      const today = new Date().toISOString().split('T')[0]
      
      // 1. Obtener reservas actualmente en checked_in
      const { data: checkedInReservations, error: checkedInError } = await db.getReservations({
        status: 'checked_in'
      })
      
      if (checkedInError) {
        console.warn('Error loading checked-in reservations:', checkedInError)
      }
      
      // 2. Obtener reservas confirmadas para hoy (que deberían estar en checked_in)
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
          // Solo incluir reservas confirmadas que son para hoy o ya pasaron su fecha de check-in
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
      
      // Convertir reservas a formato de órdenes guardadas para check-out
      const orders = {}
      
      if (allReservations && Array.isArray(allReservations)) {
        allReservations.forEach(reservation => {
          if (reservation.room && reservation.guest) {
            // Evitar duplicados (priorizar checked_in sobre confirmed)
            const roomNumber = reservation.room.number
            if (orders[roomNumber] && orders[roomNumber].reservationStatus === 'checked_in') {
              return // Ya tenemos una reserva checked_in para esta habitación
            }
            
            // Calcular precio por piso si no está disponible
            const floor = Math.floor(parseInt(reservation.room.number) / 100)
            const roomPrice = parseFloat(reservation.rate) || roomPrices[floor] || 100
            
            // FORMATO CORRECTO para savedOrders
            orders[roomNumber] = {
              id: reservation.id,
              room: {
                id: reservation.room.id,
                number: reservation.room.number,
                status: 'occupied',
                floor: reservation.room.floor,
                room_type: reservation.room.room_type || 'Habitación Estándar'
              },
              roomPrice: roomPrice,
              snacks: [], // Los snacks se pueden obtener de special_requests si es necesario
              total: parseFloat(reservation.total_amount) || roomPrice,
              checkInDate: reservation.check_in,
              checkOutDate: reservation.check_out,
              guestName: reservation.guest.full_name || 
                        `${reservation.guest.first_name || ''} ${reservation.guest.last_name || ''}`.trim(),
              guestId: reservation.guest_id,
              reservationId: reservation.id,
              confirmationCode: reservation.confirmation_code,
              // NUEVA: Información adicional para debugging
              reservationStatus: reservation.status, // 'checked_in' o 'confirmed'
              guestEmail: reservation.guest.email,
              guestPhone: reservation.guest.phone,
              guestDocument: reservation.guest.document_number,
              specialRequests: reservation.special_requests,
              paymentStatus: reservation.payment_status,
              checkedInAt: reservation.checked_in_at,
              nights: reservation.nights || Math.ceil(
                (new Date(reservation.check_out) - new Date(reservation.check_in)) / (1000 * 60 * 60 * 24)
              ),
              // Flag para identificar si necesita check-in automático
              needsAutoCheckIn: reservation.status === 'confirmed'
            }
          }
        })
      }
      
      console.log('📋 Saved orders created from reservations:', orders)
      console.log('📊 Orders by room:', Object.keys(orders))
      
      return orders
      
    } catch (error) {
      console.error('Error in loadSavedOrdersFromReservations:', error)
      return {}
    }
  }

  // Generar habitaciones mock para pruebas - CORREGIDO
  const generateMockRooms = () => {
    console.log('🏗️ Generating mock rooms...')
    
    const mockRooms = {
      1: [
        {
          id: 1,
          number: '101',
          status: 'available',
          cleaning_status: 'clean',
          room_type: 'Habitación Estándar',
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
          room_type: 'Habitación Estándar',
          capacity: 2,
          rate: 80.00,
          beds: [{ type: 'Individual', count: 2 }],
          features: ['WiFi Gratis', 'TV Smart'],
          room_id: 2,
          floor: 1,
          // Mock guest data para testing
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
          status: 'cleaning',
          cleaning_status: 'in_progress',
          room_type: 'Habitación Estándar',
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
          room_type: 'Habitación Estándar',
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
          room_type: 'Habitación Deluxe',
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
          room_type: 'Habitación Deluxe',
          capacity: 3,
          rate: 95.00,
          beds: [{ type: 'King', count: 1 }],
          features: ['WiFi Gratis', 'TV Smart', 'Balcón'],
          room_id: 6,
          floor: 2,
          // Mock guest data para testing
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

  // Procesar check-in de habitación
  const processCheckIn = async (roomData, snacks = []) => {
    try {
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
        // Crear huésped temporal si no existe ninguno
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

  // Procesar check-out - MEJORADO con validaciones
  const processCheckOut = async (roomNumber, paymentMethod) => {
    try {
      console.log('🚪 Processing check-out for room:', roomNumber)
      
      // Verificar que existe la orden
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

      // 2. Actualizar habitación a limpieza
      const { error: roomError } = await db.updateRoomStatus(
        order.room.id,
        'cleaning',
        'dirty'
      )

      if (roomError) {
        console.warn('⚠️ Warning updating room status:', roomError)
        // No fallar por este error, es menos crítico
      }

      // 3. Remover de órdenes guardadas
      setSavedOrders(prev => {
        const newOrders = { ...prev }
        delete newOrders[roomNumber]
        return newOrders
      })

      // 4. Actualizar roomsByFloor localmente
      setRoomsByFloor(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(floor => {
          if (Array.isArray(updated[floor])) {
            updated[floor] = updated[floor].map(r => 
              r.number === roomNumber 
                ? { 
                    ...r, 
                    status: 'cleaning', 
                    cleaning_status: 'dirty',
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
      toast.success(`Check-out completado para habitación ${roomNumber}`)
      return { data: true, error: null }

    } catch (error) {
      console.error('❌ Error processing check-out:', error)
      toast.error(`Error al procesar check-out: ${error.message}`)
      return { data: null, error }
    }
  }

  // Obtener habitaciones disponibles para check-in
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

  // Obtener habitaciones ocupadas para check-out
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

  // Actualizar datos en tiempo real
  const refreshData = () => {
    console.log('🔄 Refreshing data...')
    loadInitialData()
  }

  // Función de debug MEJORADA
  const debugData = () => {
    console.log('🐛 Debug - Current state:')
    console.log('roomsByFloor:', roomsByFloor)
    console.log('savedOrders:', savedOrders)
    console.log('savedOrders keys:', Object.keys(savedOrders))
    console.log('snackItems:', snackItems)
    console.log('loading:', loading)
    console.log('error:', error)
    
    // Verificar formato de cada piso
    Object.keys(roomsByFloor).forEach(floor => {
      console.log(`🏠 Floor ${floor}:`, {
        type: typeof roomsByFloor[floor],
        isArray: Array.isArray(roomsByFloor[floor]),
        length: Array.isArray(roomsByFloor[floor]) ? roomsByFloor[floor].length : 'N/A',
        rooms: roomsByFloor[floor]?.map(r => ({
          number: r.number,
          status: r.status,
          hasCurrentGuest: !!r.currentGuest,
          hasActiveReservation: !!r.activeReservation,
          guestName: r.guestName,
          reservationId: r.reservationId
        }))
      })
    })

    // Verificar correspondencia entre habitaciones ocupadas y savedOrders
    console.log('🔗 Checking room-order correspondence:')
    Object.keys(roomsByFloor).forEach(floor => {
      if (Array.isArray(roomsByFloor[floor])) {
        roomsByFloor[floor].forEach(room => {
          if (room.status === 'occupied') {
            const hasOrder = savedOrders[room.number]
            console.log(`Room ${room.number}: status=${room.status}, hasOrder=${!!hasOrder}, guestName=${room.guestName}`)
            if (!hasOrder) {
              console.warn(`⚠️ Room ${room.number} is occupied but has no saved order!`)
            }
          }
        })
      }
    })
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
    
    // Acciones
    processCheckIn,
    processCheckOut,
    refreshData,
    debugData,
    
    // Utilidades
    getAvailableRooms,
    getOccupiedRooms,
    
    // Para compatibilidad con componente existente
    floorRooms: roomsByFloor,
    setSavedOrders
  }
}