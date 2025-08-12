// src/hooks/useCheckInData.js - VERSIÓN CORREGIDA CON MEJORES PRÁCTICAS
import { useState, useEffect, useCallback, useMemo } from 'react'
import { db } from '../lib/supabase'
import toast from 'react-hot-toast'

// Custom hook with better error handling and performance optimizations
export const useCheckInData = () => {
  const [roomsByFloor, setRoomsByFloor] = useState({})
  const [savedOrders, setSavedOrders] = useState({})
  const [snackItems, setSnackItems] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Memoized constants to prevent recreation on every render
  const snackTypes = useMemo(() => [
    { id: 'FRUTAS', name: 'FRUTAS', description: 'Frutas frescas y naturales' },
    { id: 'BEBIDAS', name: 'BEBIDAS', description: 'Bebidas frías y calientes' },
    { id: 'SNACKS', name: 'SNACKS', description: 'Bocadillos y aperitivos' },
    { id: 'POSTRES', name: 'POSTRES', description: 'Dulces y postres' }
  ], [])

  const roomPrices = useMemo(() => ({
    1: 80.00,
    2: 95.00,
    3: 110.00,
    4: 120.00
  }), [])

  // Error handling utility
  const handleError = useCallback((error, operation) => {
    console.error(`❌ Error in ${operation}:`, error)
    const message = error?.message || `Error en ${operation}`
    setError(message)
    toast.error(message)
    return { data: null, error: message }
  }, [])

  // Success notification utility
  const showSuccess = useCallback((message, options = {}) => {
    toast.success(message, {
      icon: '✅',
      duration: 3000,
      ...options
    })
  }, [])

  // Load initial data with better error handling
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Loading initial check-in data...')
      
      // Load all data in parallel for better performance
      const [roomsResult, snacksResult, ordersResult] = await Promise.all([
        loadRoomsByFloorWithReservations(),
        loadSnackItems(),
        loadSavedOrdersFromReservations()
      ])
      
      // Update state with results
      if (roomsResult.data) setRoomsByFloor(roomsResult.data)
      if (snacksResult.data) setSnackItems(snacksResult.data)
      if (ordersResult.data) setSavedOrders(ordersResult.data)
      
      setLastUpdated(new Date().toISOString())
      console.log('✅ All check-in data loaded successfully!')
      
    } catch (err) {
      handleError(err, 'cargar datos iniciales')
    } finally {
      setLoading(false)
    }
  }, [handleError])

  // Load rooms by floor with reservations
  const loadRoomsByFloorWithReservations = useCallback(async () => {
    try {
      console.log('📍 Loading rooms by floor with reservations...')
      
      const { data: rooms, error } = await db.getRooms()
      
      if (error) {
        console.warn('Error getting rooms, using mock data:', error)
        return { data: generateMockRooms(), error: null }
      }
      
      if (!rooms || !Array.isArray(rooms)) {
        console.warn('No rooms data or invalid format, using mock data')
        return { data: generateMockRooms(), error: null }
      }
      
      // Get active reservations
      const { data: reservations } = await db.getReservations({
        status: ['checked_in', 'confirmed'],
        limit: 200
      })
      
      // Group rooms by floor and enrich with reservation data
      const roomsByFloor = {}
      
      rooms.forEach(room => {
        const floor = room.floor || Math.floor(parseInt(room.number) / 100) || 1
        
        if (!roomsByFloor[floor]) {
          roomsByFloor[floor] = []
        }
        
        // Find active reservation for this room
        const activeReservation = reservations?.find(res => 
          res.room_id === room.id && res.status === 'checked_in'
        )
        
        // Find next confirmed reservation
        const nextReservation = reservations?.find(res => 
          res.room_id === room.id && 
          res.status === 'confirmed' &&
          new Date(res.check_in) >= new Date()
        )
        
        // Enrich room data
        const enrichedRoom = {
          ...room,
          id: room.id,
          number: room.number,
          floor: floor,
          capacity: room.capacity || 2,
          rate: room.base_rate || roomPrices[floor] || 100,
          beds: room.beds || [{ type: 'Doble', count: 1 }],
          features: room.features || ['WiFi Gratis'],
          room_id: room.id,
          
          // Current guest information
          currentGuest: activeReservation ? {
            id: activeReservation.guest_id,
            name: activeReservation.guest?.full_name || 'Huésped',
            email: activeReservation.guest?.email,
            phone: activeReservation.guest?.phone,
            checkIn: activeReservation.check_in,
            checkOut: activeReservation.check_out,
            confirmationCode: activeReservation.confirmation_code,
            reservationId: activeReservation.id
          } : null,

          // Next reservation information
          nextReservation: nextReservation ? {
            id: nextReservation.id,
            guest: nextReservation.guest?.full_name || 'Huésped',
            checkIn: nextReservation.check_in,
            checkOut: nextReservation.check_out,
            confirmationCode: nextReservation.confirmation_code
          } : null,

          // Additional reservation data
          activeReservation: activeReservation || null,
          guestName: activeReservation?.guest?.full_name || null,
          checkInDate: activeReservation?.check_in || null,
          checkOutDate: activeReservation?.check_out || null,
          reservationId: activeReservation?.id || null,
          confirmationCode: activeReservation?.confirmation_code || null
        }
        
        roomsByFloor[floor].push(enrichedRoom)
      })
      
      // Sort rooms by number within each floor
      Object.keys(roomsByFloor).forEach(floor => {
        roomsByFloor[floor].sort((a, b) => {
          const numA = parseInt(a.number) || 0
          const numB = parseInt(b.number) || 0
          return numA - numB
        })
      })
      
      console.log('✅ Rooms by floor loaded:', Object.keys(roomsByFloor).length, 'floors')
      return { data: roomsByFloor, error: null }
      
    } catch (error) {
      console.error('❌ Error loading rooms by floor:', error)
      return { data: generateMockRooms(), error }
    }
  }, [roomPrices])

  // Load snack items
  const loadSnackItems = useCallback(async () => {
    try {
      console.log('🍎 Loading snack items...')
      
      const { data, error } = await db.getSnackItems()
      
      if (error) {
        console.warn('⚠️ Snacks error:', error)
        return { data: {}, error: null }
      }
      
      console.log('✅ Snacks loaded')
      return { data: data || {}, error: null }
      
    } catch (error) {
      console.error('Error loading snacks:', error)
      return { data: {}, error: null }
    }
  }, [])

  // Load saved orders from reservations
  const loadSavedOrdersFromReservations = useCallback(async () => {
    try {
      console.log('📋 Loading saved orders from reservations...')
      
      const today = new Date().toISOString().split('T')[0]
      
      // Get checked-in reservations
      const { data: checkedInReservations, error: checkedInError } = await db.getReservations({
        status: 'checked_in'
      })
      
      // Get confirmed reservations for today
      const { data: confirmedReservations, error: confirmedError } = await db.getReservations({
        status: 'confirmed'
      })
      
      if (checkedInError) {
        console.warn('Error loading checked-in reservations:', checkedInError)
      }
      
      if (confirmedError) {
        console.warn('Error loading confirmed reservations:', confirmedError)
      }
      
      // Combine both types of reservations
      const allReservations = [
        ...(checkedInReservations || []),
        ...(confirmedReservations || []).filter(reservation => {
          const checkInDate = new Date(reservation.check_in).toISOString().split('T')[0]
          return checkInDate <= today
        })
      ]
      
      // Convert reservations to saved orders format
      const orders = {}
      
      if (allReservations && Array.isArray(allReservations)) {
        allReservations.forEach(reservation => {
          if (reservation.room && reservation.guest) {
            const roomNumber = reservation.room.number
            
            // Skip if we already have a checked-in reservation for this room
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
      
      console.log('✅ Saved orders loaded:', Object.keys(orders).length)
      return { data: orders, error: null }
      
    } catch (error) {
      console.error('Error loading saved orders:', error)
      return { data: {}, error: null }
    }
  }, [roomPrices])

  // Clean room with one click
  const cleanRoom = useCallback(async (roomId) => {
    try {
      console.log(`🧹 Quick cleaning room with ID: ${roomId}`)
      
      const { data, error } = await db.cleanRoomWithClick(roomId)
      
      if (error) {
        throw new Error(`Error updating room status: ${error.message}`)
      }
      
      // Update local state immediately
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
      
      // Find room number for toast
      let roomNumber = 'desconocida'
      Object.values(roomsByFloor).flat().forEach(room => {
        if ((room.id === roomId || room.room_id === roomId)) {
          roomNumber = room.number
        }
      })
      
      showSuccess(`Habitación ${roomNumber} marcada como limpia y disponible`, {
        icon: '✨',
        duration: 3000
      })
      
      return { data, error: null }
      
    } catch (error) {
      return handleError(error, 'limpiar habitación')
    }
  }, [roomsByFloor, handleError, showSuccess])

  // Create guest and reservation without prior booking
  const createGuestAndReservation = useCallback(async (roomData, guestData, snacks = []) => {
    try {
      console.log('👤 Creating guest and reservation...', {
        fullName: guestData.fullName,
        documentNumber: guestData.documentNumber,
        documentType: guestData.documentType
      })
      
      // Validation
      if (!guestData.fullName?.trim()) {
        throw new Error('El nombre completo es obligatorio')
      }
      
      if (!guestData.documentNumber?.trim()) {
        throw new Error('El documento de identidad es obligatorio')
      }
      
      const room = roomData.room || roomData
      const floor = Math.floor(parseInt(room.number) / 100)
      const roomPrice = roomPrices[floor] || 100
      const snacksTotal = snacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0)
      const totalAmount = roomPrice + snacksTotal

      // 1. Create guest
      console.log('👤 Creating guest with full_name')
      
      const newGuestData = {
        full_name: guestData.fullName.trim(),
        document_type: guestData.documentType || 'DNI',
        document_number: guestData.documentNumber.trim(),
        email: guestData.email?.trim() || null,
        phone: guestData.phone?.trim() || null,
        status: 'active'
      }

      const { data: guest, error: guestError } = await db.createGuest(newGuestData)
      
      if (guestError) {
        console.error('❌ Error creating guest:', guestError)
        throw new Error(`Error creating guest: ${guestError.message}`)
      }

      console.log('✅ Guest created successfully:', guest.id)

      // 2. Create reservation without nights field
      console.log('📅 Creating reservation...')
      
      const reservationData = {
        guest_id: guest.id,
        room_id: room.id || room.room_id,
        branch_id: 1,
        check_in: new Date().toISOString().split('T')[0],
        check_out: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        adults: 1,
        children: 0,
        status: 'checked_in',
        total_amount: totalAmount,
        rate: roomPrice,
        paid_amount: 0,
        special_requests: snacks.length > 0 ? `Snacks: ${snacks.map(s => `${s.name} x${s.quantity}`).join(', ')}` : '',
        payment_status: 'pending',
        source: 'walk_in'
      }

      const { data: reservation, error: reservationError } = await db.createReservation(reservationData)
      
      if (reservationError) {
        console.error('❌ Error creating reservation:', reservationError)
        // Cleanup guest if reservation fails
        await db.deleteGuest(guest.id)
        throw new Error(`Error creating reservation: ${reservationError.message}`)
      }

      console.log('✅ Reservation created successfully:', reservation.id)

      // 3. Update room status
      const { error: roomError } = await db.updateRoomStatus(
        room.id || room.room_id, 
        'occupied', 
        'dirty'
      )
      
      if (roomError) {
        console.warn('⚠️ Warning updating room status:', roomError)
      }

      // 4. Create local order
      const newOrder = {
        id: reservation.id,
        room: { 
          id: room.id || room.room_id,
          number: room.number, 
          status: 'occupied',
          floor: room.floor || floor,
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
        guestDocument: guestData.documentNumber,
        guestDocumentType: guestData.documentType || 'DNI',
        nights: 1,
        isWalkIn: true
      }

      // 5. Update local state
      setSavedOrders(prev => ({
        ...prev,
        [room.number]: newOrder
      }))

      // 6. Update roomsByFloor locally
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
                      name: guestData.fullName
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

      showSuccess(`¡Check-in completado! ${guestData.fullName} en habitación ${room.number}`, {
        icon: '🎉',
        duration: 4000
      })
      
      return { data: newOrder, error: null }

    } catch (error) {
      return handleError(error, 'crear registro de huésped')
    }
  }, [roomPrices, handleError, showSuccess])

  // Process check-in
  const processCheckIn = useCallback(async (roomData, snacks = [], guestData = null) => {
    try {
      // If guest data provided, it's a walk-in check-in
      if (guestData) {
        console.log('🆕 Processing walk-in check-in with guest registration')
        return await createGuestAndReservation(roomData, guestData, snacks)
      }

      // Original check-in logic for existing reservations
      const room = roomData.room || roomData
      const floor = Math.floor(parseInt(room.number) / 100)
      const roomPrice = roomPrices[floor] || 100
      const snacksTotal = snacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0)
      const totalAmount = roomPrice + snacksTotal

      console.log('🏨 Processing check-in for room:', room.number)

      // Update room status to occupied
      const { error: roomError } = await db.updateRoomStatus(
        room.id || room.room_id, 
        'occupied', 
        'dirty'
      )
      
      if (roomError) {
        throw new Error(`Error updating room status: ${roomError.message}`)
      }

      // Get or create default guest
      let guestId = null
      const { data: guests } = await db.getGuests({ limit: 1 })
      
      if (guests && guests.length > 0) {
        guestId = guests[0].id
      } else {
        const { data: newGuest } = await db.createGuest({
          full_name: 'Huésped Temporal',
          email: `temp${room.number}@hotel.com`,
          phone: '+51999999999',
          document_type: 'DNI',
          document_number: '99999999'
        })
        guestId = newGuest?.id
      }

      // Create automatic reservation
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

      // Update local saved orders
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

      // Update roomsByFloor locally
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

      showSuccess(`Check-in completado para habitación ${room.number}`)
      return { data: newOrder, error: null }

    } catch (error) {
      return handleError(error, 'procesar check-in')
    }
  }, [roomPrices, createGuestAndReservation, handleError, showSuccess])

  // Process check-out
  const processCheckOut = useCallback(async (roomNumber, paymentMethod = 'cash') => {
    try {
      console.log('🚪 Processing check-out for room:', roomNumber)
      
      if (!roomNumber) {
        throw new Error('Número de habitación es requerido')
      }
      
      const order = savedOrders[roomNumber]
      if (!order) {
        throw new Error(`No se encontró información de reserva para la habitación ${roomNumber}`)
      }

      if (!order.reservationId) {
        throw new Error(`ID de reserva no encontrado para la habitación ${roomNumber}`)
      }

      // Update reservation to checked_out
      const { error: reservationError } = await db.updateReservation(order.reservationId, {
        status: 'checked_out',
        checked_out_at: new Date().toISOString(),
        payment_status: 'paid',
        payment_method: paymentMethod,
        paid_amount: order.total || order.roomPrice || 0
      })

      if (reservationError) {
        throw new Error(`Error updating reservation: ${reservationError.message}`)
      }

      // Update room to available but dirty
      const roomId = order.room?.id || order.room?.room_id
      if (roomId) {
        const { error: roomError } = await db.updateRoomStatus(
          roomId,
          'available',
          'dirty'
        )

        if (roomError) {
          console.warn('⚠️ Warning updating room status:', roomError)
        }
      }

      // Remove from saved orders
      setSavedOrders(prev => {
        const newOrders = { ...prev }
        delete newOrders[roomNumber]
        return newOrders
      })

      // Update roomsByFloor locally
      setRoomsByFloor(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(floor => {
          if (Array.isArray(updated[floor])) {
            updated[floor] = updated[floor].map(r => 
              r.number === roomNumber 
                ? { 
                    ...r, 
                    status: 'available',
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

      showSuccess(`Check-out completado para habitación ${roomNumber}. La habitación necesita limpieza.`, {
        icon: '🚪',
        duration: 4000
      })
      
      return { data: true, error: null }

    } catch (error) {
      return handleError(error, 'procesar check-out')
    }
  }, [savedOrders, handleError, showSuccess])

  // Generate mock rooms for testing
  const generateMockRooms = useCallback(() => {
    console.log('🏗️ Generating mock rooms...')
    
    return {
      1: [
        {
          id: 1,
          number: '101',
          status: 'available',
          cleaning_status: 'clean',
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
            checkIn: '2025-01-15',
            checkOut: '2025-01-17'
          },
          activeReservation: {
            id: 1,
            check_in: '2025-01-15',
            check_out: '2025-01-17',
            confirmation_code: 'HTP-2025-001'
          }
        }
      ],
      2: [
        {
          id: 5,
          number: '201',
          status: 'available',
          cleaning_status: 'clean',
          capacity: 3,
          rate: 95.00,
          beds: [{ type: 'Queen', count: 1 }],
          features: ['WiFi Gratis', 'TV Smart', 'Balcón'],
          room_id: 5,
          floor: 2,
          currentGuest: null,
          activeReservation: null
        }
      ]
    }
  }, [])

  // Utility functions
  const getAvailableRooms = useCallback(() => {
    const available = {}
    
    Object.keys(roomsByFloor).forEach(floor => {
      if (Array.isArray(roomsByFloor[floor])) {
        available[floor] = roomsByFloor[floor].filter(room => 
          room.status === 'available' && room.cleaning_status === 'clean'
        )
      }
    })
    
    return available
  }, [roomsByFloor])

  const getOccupiedRooms = useCallback(() => {
    const occupied = {}
    
    Object.keys(roomsByFloor).forEach(floor => {
      if (Array.isArray(roomsByFloor[floor])) {
        occupied[floor] = roomsByFloor[floor].filter(room => 
          room.status === 'occupied'
        )
      }
    })
    
    return occupied
  }, [roomsByFloor])

  const refreshData = useCallback(() => {
    console.log('🔄 Refreshing check-in data...')
    loadInitialData()
  }, [loadInitialData])

  const debugData = useCallback(() => {
    console.log('🐛 Debug - Current state:')
    console.log('roomsByFloor:', roomsByFloor)
    console.log('savedOrders:', savedOrders)
    console.log('snackItems:', snackItems)
    console.log('loading:', loading)
    console.log('error:', error)
    console.log('lastUpdated:', lastUpdated)
  }, [roomsByFloor, savedOrders, snackItems, loading, error, lastUpdated])

  // Load initial data on mount
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        loadInitialData()
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [loadInitialData, loading])

  return {
    // State
    roomsByFloor,
    snackTypes,
    snackItems,
    roomPrices,
    savedOrders,
    loading,
    error,
    lastUpdated,
    
    // Main actions
    processCheckIn,
    processCheckOut,
    refreshData,
    debugData,
    cleanRoom,
    
    // Walk-in guest functions
    createGuestAndReservation,
    
    // Utilities
    getAvailableRooms,
    getOccupiedRooms,
    
    // Compatibility
    floorRooms: roomsByFloor,
    setSavedOrders,
    
    // Features
    hasQuickCleanCapability: true,
    supportedFeatures: [
      'walk_in_checkin',
      'guest_registration', 
      'snack_selection',
      'quick_room_cleaning',
      'auto_refresh'
    ]
  }
}