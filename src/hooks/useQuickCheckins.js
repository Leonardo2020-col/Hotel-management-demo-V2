// src/hooks/useQuickCheckins.js - Hook separado para check-ins rápidos
import { useState, useEffect } from 'react'
import { db } from '../lib/supabase'
import toast from 'react-hot-toast'

export const useQuickCheckins = () => {
  const [roomsByFloor, setRoomsByFloor] = useState({})
  const [activeCheckins, setActiveCheckins] = useState({}) // Por número de habitación
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
      
      console.log('🔄 Loading quick check-in data...')
      
      // 1. Cargar habitaciones con check-ins activos
      await loadRoomsWithQuickCheckins()
      
      // 2. Cargar snacks
      const { data: snacksData } = await db.getSnackItems()
      setSnackItems(snacksData || {})
      
      console.log('✅ Quick check-in data loaded successfully!')
      
    } catch (err) {
      console.error('❌ Error loading quick check-in data:', err)
      setError(err.message || 'Error al cargar datos del panel de recepción')
      toast.error('Error al cargar datos del panel de recepción')
    } finally {
      setLoading(false)
    }
  }

  // Cargar habitaciones con información de check-ins rápidos activos
  const loadRoomsWithQuickCheckins = async () => {
    try {
      // Obtener habitaciones
      const { data: rooms, error: roomsError } = await db.getRooms()
      
      if (roomsError) {
        console.warn('Error getting rooms:', roomsError)
        return generateMockRooms()
      }
      
      // Obtener check-ins rápidos activos
      const { data: activeQuickCheckins } = await db.getActiveQuickCheckins()
      
      // Agrupar habitaciones por piso
      const roomsByFloor = {}
      const activeCheckinsMap = {}
      
      // Crear mapa de check-ins activos por habitación
      if (activeQuickCheckins) {
        activeQuickCheckins.forEach(checkin => {
          activeCheckinsMap[checkin.room_number] = checkin
        })
      }
      
      rooms?.forEach(room => {
        const floor = room.floor || Math.floor(parseInt(room.number) / 100) || 1
        
        if (!roomsByFloor[floor]) {
          roomsByFloor[floor] = []
        }
        
        const activeCheckin = activeCheckinsMap[room.number]
        
        // Formatear habitación con información de check-in rápido
        const formattedRoom = {
          id: room.id,
          number: room.number,
          floor: floor,
          capacity: room.capacity || 2,
          rate: room.base_rate || roomPrices[floor] || 100,
          
          // Estado basado en check-ins rápidos (NO reservaciones)
          status: activeCheckin ? 'occupied' : (room.status || 'available'),
          cleaning_status: room.cleaning_status || 'clean',
          
          // Información del check-in rápido actual
          quickCheckin: activeCheckin || null,
          guestName: activeCheckin?.guest_name || null,
          checkInDate: activeCheckin?.check_in_date || null,
          checkOutDate: activeCheckin?.check_out_date || null,
          confirmationCode: activeCheckin?.confirmation_code || null,
          
          // NO incluir información de reservaciones
          // ❌ activeReservation: null,
          // ❌ nextReservation: null,
          // ❌ reservationId: null
        }
        
        roomsByFloor[floor].push(formattedRoom)
      })
      
      // Ordenar habitaciones por número
      Object.keys(roomsByFloor).forEach(floor => {
        roomsByFloor[floor].sort((a, b) => {
          const numA = parseInt(a.number) || 0
          const numB = parseInt(b.number) || 0
          return numA - numB
        })
      })
      
      setRoomsByFloor(roomsByFloor)
      setActiveCheckins(activeCheckinsMap)
      
      console.log('📋 Rooms with quick check-ins loaded:', {
        floors: Object.keys(roomsByFloor).length,
        totalRooms: Object.values(roomsByFloor).flat().length,
        activeCheckins: Object.keys(activeCheckinsMap).length
      })
      
    } catch (error) {
      console.error('❌ Error loading rooms with quick check-ins:', error)
      setRoomsByFloor(generateMockRooms())
    }
  }

  // Procesar check-in rápido (SIN crear reservación)
  const processQuickCheckIn = async (roomData, guestData, snacks = []) => {
    try {
      console.log('🏨 Processing quick check-in (NO reservation):', {
        room: roomData.number,
        guest: guestData.fullName,
        snacksCount: snacks.length
      })
      
      // Validación mínima
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

      // 1. Crear check-in rápido (NO reservación)
      const quickCheckinData = {
        guest_name: guestData.fullName.trim(),
        document_type: guestData.documentType || 'DNI',
        document_number: guestData.documentNumber.trim(),
        phone: guestData.phone?.trim() || null,
        email: guestData.email?.trim() || null,
        
        room_id: room.id || room.room_id,
        room_number: room.number,
        floor: floor,
        
        check_in_date: new Date().toISOString().split('T')[0],
        check_out_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nights: 1,
        
        room_rate: roomPrice,
        snacks_total: snacksTotal,
        total_amount: totalAmount,
        payment_method: 'cash',
        payment_status: 'pending',
        
        snacks_consumed: snacks || [],
        special_notes: snacks.length > 0 ? `Snacks: ${snacks.map(s => `${s.name} x${s.quantity}`).join(', ')}` : null,
        
        status: 'checked_in',
        source: 'walk_in',
        branch_id: 1
      }

      console.log('📝 Creating quick check-in record:', quickCheckinData)

      const { data: quickCheckin, error: checkinError } = await db.createQuickCheckin(quickCheckinData)
      
      if (checkinError) {
        console.error('❌ Error creating quick check-in:', checkinError)
        throw new Error(`Error al crear check-in: ${checkinError.message}`)
      }

      console.log('✅ Quick check-in created successfully:', quickCheckin.id)

      // 2. Actualizar estado de la habitación
      const { error: roomError } = await db.updateRoomStatus(
        room.id || room.room_id, 
        'occupied', 
        'dirty'
      )
      
      if (roomError) {
        console.warn('⚠️ Warning updating room status:', roomError)
      }

      // 3. Actualizar estado local
      const newQuickCheckin = {
        ...quickCheckin,
        room: { 
          id: room.id || room.room_id,
          number: room.number, 
          status: 'occupied',
          floor: floor,
        },
        roomPrice,
        snacks,
        total: totalAmount,
        guestName: guestData.fullName,
        isQuickCheckin: true // Flag para distinguir de reservaciones
      }

      setActiveCheckins(prev => ({
        ...prev,
        [room.number]: newQuickCheckin
      }))

      // Actualizar roomsByFloor localmente
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
                    quickCheckin: newQuickCheckin,
                    guestName: guestData.fullName,
                    checkInDate: quickCheckinData.check_in_date,
                    confirmationCode: quickCheckin.confirmation_code
                  }
                : r
            )
          }
        })
        return updated
      })

      toast.success(`¡Check-in rápido completado! ${guestData.fullName} en habitación ${room.number}`, {
        icon: '🎉',
        duration: 4000
      })
      
      return { data: newQuickCheckin, error: null }

    } catch (error) {
      console.error('❌ Error in quick check-in:', error)
      toast.error(`Error al procesar check-in: ${error.message}`)
      return { data: null, error }
    }
  }

  // Procesar check-out rápido
  const processQuickCheckOut = async (roomNumber, paymentMethod) => {
    try {
      console.log('🚪 Processing quick check-out for room:', roomNumber)
      
      const activeCheckin = activeCheckins[roomNumber]
      if (!activeCheckin) {
        throw new Error(`No se encontró check-in activo para la habitación ${roomNumber}`)
      }

      // Actualizar check-in a checked_out
      const { error: updateError } = await db.updateQuickCheckin(activeCheckin.id, {
        status: 'checked_out',
        checked_out_at: new Date().toISOString(),
        payment_status: 'paid',
        payment_method: paymentMethod || 'cash'
      })

      if (updateError) {
        throw new Error(`Error al actualizar check-in: ${updateError.message}`)
      }

      // Actualizar habitación
      const roomId = activeCheckin.room?.id || activeCheckin.room_id
      if (roomId) {
        await db.updateRoomStatus(roomId, 'available', 'dirty')
      }

      // Remover de check-ins activos
      setActiveCheckins(prev => {
        const newCheckins = { ...prev }
        delete newCheckins[roomNumber]
        return newCheckins
      })

      // Actualizar roomsByFloor
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
                    quickCheckin: null,
                    guestName: null,
                    checkInDate: null,
                    confirmationCode: null
                  }
                : r
            )
          }
        })
        return updated
      })

      toast.success(`Check-out completado para habitación ${roomNumber}. La habitación necesita limpieza.`, {
        icon: '🚪',
        duration: 4000
      })
      
      return { data: true, error: null }

    } catch (error) {
      console.error('❌ Error processing quick check-out:', error)
      toast.error(`Error al procesar check-out: ${error.message}`)
      return { data: null, error }
    }
  }

  // Limpiar habitación
  const cleanRoom = async (roomId) => {
    try {
      const { data, error } = await db.updateRoomStatus(roomId, 'available', 'clean')
      
      if (error) {
        throw new Error(`Error updating room status: ${error.message}`)
      }
      
      // Actualizar estado local
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
                    last_cleaned: new Date().toISOString()
                  }
                : room
            )
          }
        })
        return updated
      })
      
      let roomNumber = 'desconocida'
      Object.values(roomsByFloor).flat().forEach(room => {
        if ((room.id === roomId || room.room_id === roomId)) {
          roomNumber = room.number
        }
      })
      
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

  // Obtener historial de check-ins
  const getQuickCheckinHistory = async (filters = {}) => {
    try {
      const { data, error } = await db.getQuickCheckinHistory(filters)
      return { data: data || [], error }
    } catch (error) {
      console.error('Error getting quick checkin history:', error)
      return { data: [], error }
    }
  }

  // Generar habitaciones mock para pruebas
  const generateMockRooms = () => {
    return {
      1: [
        {
          id: 1, number: '101', status: 'available', cleaning_status: 'clean',
          capacity: 2, rate: 80.00, floor: 1, quickCheckin: null
        },
        {
          id: 2, number: '102', status: 'available', cleaning_status: 'clean',
          capacity: 2, rate: 80.00, floor: 1, quickCheckin: null
        }
      ]
    }
  }

  const refreshData = () => {
    loadInitialData()
  }

  return {
    // Estado
    roomsByFloor,
    activeCheckins,
    snackTypes,
    snackItems,
    roomPrices,
    loading,
    error,
    
    // Acciones principales
    processQuickCheckIn,
    processQuickCheckOut,
    cleanRoom,
    refreshData,
    
    // Consultas
    getQuickCheckinHistory,
    
    // Utilidades
    hasQuickCleanCapability: true,
    supportedFeatures: [
      'quick_walk_in_checkin',
      'guest_registration', 
      'snack_selection',
      'quick_room_cleaning'
    ]
  }
}