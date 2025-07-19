// src/hooks/useCheckInData.js - FORMATO DE DATOS CORREGIDO
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
      
      // 1. Cargar habitaciones agrupadas por piso
      console.log('📍 Loading rooms by floor...')
      const roomsData = await loadRoomsByFloor()
      console.log('✅ Rooms loaded:', roomsData)
      
      // 2. Cargar snacks
      console.log('🍎 Loading snack items...')
      const { data: snacksData, error: snacksError } = await db.getSnackItems()
      if (snacksError) {
        console.warn('⚠️ Snacks error:', snacksError)
      }
      console.log('✅ Snacks loaded:', snacksData)
      
      // 3. Cargar órdenes guardadas (reservas activas)
      console.log('📋 Loading saved orders...')
      const { data: ordersData, error: ordersError } = await loadSavedOrders()
      if (ordersError) {
        console.warn('⚠️ Orders error:', ordersError)
      }
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

  // FUNCIÓN CORREGIDA: Cargar habitaciones por piso con formato correcto
  const loadRoomsByFloor = async () => {
    try {
      // Intentar obtener habitaciones directamente
      const { data: rooms, error } = await db.getRooms()
      
      if (error) {
        console.warn('Error getting rooms, using mock data:', error)
        return generateMockRooms()
      }
      
      if (!rooms || !Array.isArray(rooms)) {
        console.warn('No rooms data or invalid format, using mock data')
        return generateMockRooms()
      }
      
      console.log('📊 Raw rooms data:', rooms)
      
      // Agrupar habitaciones por piso correctamente
      const roomsByFloor = {}
      
      rooms.forEach(room => {
        const floor = room.floor || Math.floor(parseInt(room.number) / 100) || 1
        
        if (!roomsByFloor[floor]) {
          roomsByFloor[floor] = []
        }
        
        // Formatear habitación correctamente
        const formattedRoom = {
          id: room.id,
          number: room.number,
          status: room.status || 'available',
          cleaning_status: room.cleaning_status || 'clean',
          type: room.room_type || 'Habitación Estándar',
          capacity: room.capacity || 2,
          rate: room.base_rate || roomPrices[floor] || 100,
          beds: room.beds || [{ type: 'Doble', count: 1 }],
          features: room.features || ['WiFi Gratis'],
          room_id: room.id,
          floor: floor,
          // Información de reservas si existe
          currentGuest: room.currentGuest || null,
          nextReservation: room.nextReservation || null,
          activeReservation: room.activeReservation || null
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
      
      console.log('📋 Formatted rooms by floor:', roomsByFloor)
      
      // Verificar que cada piso tiene un array
      Object.keys(roomsByFloor).forEach(floor => {
        if (!Array.isArray(roomsByFloor[floor])) {
          console.error(`❌ Floor ${floor} is not an array:`, roomsByFloor[floor])
          roomsByFloor[floor] = []
        }
      })
      
      return roomsByFloor
      
    } catch (error) {
      console.error('❌ Error in loadRoomsByFloor:', error)
      return generateMockRooms()
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
          type: 'Habitación Estándar',
          capacity: 2,
          rate: 80.00,
          beds: [{ type: 'Doble', count: 1 }],
          features: ['WiFi Gratis', 'TV Smart'],
          room_id: 1,
          floor: 1
        },
        {
          id: 2,
          number: '102',
          status: 'occupied',
          cleaning_status: 'dirty',
          type: 'Habitación Estándar',
          capacity: 2,
          rate: 80.00,
          beds: [{ type: 'Individual', count: 2 }],
          features: ['WiFi Gratis', 'TV Smart'],
          room_id: 2,
          floor: 1
        },
        {
          id: 3,
          number: '103',
          status: 'cleaning',
          cleaning_status: 'in_progress',
          type: 'Habitación Estándar',
          capacity: 2,
          rate: 80.00,
          beds: [{ type: 'Doble', count: 1 }],
          features: ['WiFi Gratis', 'TV Smart'],
          room_id: 3,
          floor: 1
        },
        {
          id: 4,
          number: '104',
          status: 'available',
          cleaning_status: 'clean',
          type: 'Habitación Estándar',
          capacity: 2,
          rate: 80.00,
          beds: [{ type: 'Doble', count: 1 }],
          features: ['WiFi Gratis', 'TV Smart'],
          room_id: 4,
          floor: 1
        }
      ],
      2: [
        {
          id: 5,
          number: '201',
          status: 'available',
          cleaning_status: 'clean',
          type: 'Habitación Deluxe',
          capacity: 3,
          rate: 95.00,
          beds: [{ type: 'Queen', count: 1 }],
          features: ['WiFi Gratis', 'TV Smart', 'Balcón'],
          room_id: 5,
          floor: 2
        },
        {
          id: 6,
          number: '202',
          status: 'occupied',
          cleaning_status: 'dirty',
          type: 'Habitación Deluxe',
          capacity: 3,
          rate: 95.00,
          beds: [{ type: 'King', count: 1 }],
          features: ['WiFi Gratis', 'TV Smart', 'Balcón'],
          room_id: 6,
          floor: 2
        }
      ],
      3: [
        {
          id: 7,
          number: '301',
          status: 'available',
          cleaning_status: 'clean',
          type: 'Suite Ejecutiva',
          capacity: 4,
          rate: 110.00,
          beds: [{ type: 'King', count: 1 }, { type: 'Sofá Cama', count: 1 }],
          features: ['WiFi Gratis', 'TV Smart', 'Jacuzzi', 'Vista al Mar'],
          room_id: 7,
          floor: 3
        }
      ]
    }
    
    console.log('✅ Mock rooms generated:', mockRooms)
    return mockRooms
  }

  // Cargar órdenes guardadas desde reservas activas
  const loadSavedOrders = async () => {
    try {
      const { data: reservations, error } = await db.getReservations({
        status: 'checked_in'
      })
      
      if (error) {
        console.warn('Error loading reservations:', error)
        return { data: {}, error: null }
      }
      
      // Convertir reservas a formato de órdenes guardadas
      const orders = {}
      
      if (reservations && Array.isArray(reservations)) {
        reservations.forEach(reservation => {
          if (reservation.room && reservation.guest) {
            // Calcular precio por piso si no está disponible
            const floor = Math.floor(parseInt(reservation.room.number) / 100)
            const roomPrice = reservation.rate || roomPrices[floor] || 100
            
            orders[reservation.room.number] = {
              id: reservation.id,
              room: {
                id: reservation.room.id,
                number: reservation.room.number,
                status: 'occupied'
              },
              roomPrice: roomPrice,
              snacks: [],
              total: reservation.total_amount || roomPrice,
              checkInDate: reservation.check_in,
              guestName: reservation.guest.full_name || 
                        `${reservation.guest.first_name || ''} ${reservation.guest.last_name || ''}`.trim(),
              guestId: reservation.guest_id,
              reservationId: reservation.id
            }
          }
        })
      }
      
      return { data: orders, error: null }
    } catch (error) {
      console.error('Error in loadSavedOrders:', error)
      return { data: {}, error: null }
    }
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

      // 5. Actualizar roomsByFloor localmente - FORMATO CORRECTO
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
      const order = savedOrders[roomNumber]
      if (!order) {
        throw new Error('Orden no encontrada para la habitación ' + roomNumber)
      }

      console.log('🚪 Processing check-out for room:', roomNumber)

      // 1. Actualizar reserva a checked_out
      const { error: reservationError } = await db.updateReservation(order.reservationId, {
        status: 'checked_out',
        checked_out_at: new Date().toISOString(),
        payment_status: 'paid'
      })

      if (reservationError) {
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
                ? { ...r, status: 'cleaning', cleaning_status: 'dirty' }
                : r
            )
          }
        })
        return updated
      })

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

  // Función de debug
  const debugData = () => {
    console.log('🐛 Debug - Current state:')
    console.log('roomsByFloor:', roomsByFloor)
    console.log('savedOrders:', savedOrders)
    console.log('snackItems:', snackItems)
    console.log('loading:', loading)
    console.log('error:', error)
    
    // Verificar formato de cada piso
    Object.keys(roomsByFloor).forEach(floor => {
      console.log(`🏠 Floor ${floor}:`, {
        type: typeof roomsByFloor[floor],
        isArray: Array.isArray(roomsByFloor[floor]),
        length: Array.isArray(roomsByFloor[floor]) ? roomsByFloor[floor].length : 'N/A',
        data: roomsByFloor[floor]
      })
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