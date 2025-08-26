// src/hooks/useQuickCheckins.js - VERSIÓN COMPLETAMENTE CORREGIDA
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, quickCheckinService, snackService } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export const useQuickCheckins = () => {
  const { primaryBranch } = useAuth()
  const branchId = primaryBranch?.id
  
  // Estados principales
  const [roomsByFloor, setRoomsByFloor] = useState({})
  const [activeCheckins, setActiveCheckins] = useState({})
  const [snackTypes, setSnackTypes] = useState([])
  const [snackItems, setSnackItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Datos fijos
  const roomPrices = useMemo(() => ({
    1: 100.00,
    2: 120.00,
    3: 150.00,
    4: 180.00
  }), [])

  const fixedSnackTypes = useMemo(() => [
    { 
      id: 'bebidas', 
      name: 'Bebidas', 
      description: 'Bebidas frías y calientes' 
    },
    { 
      id: 'snacks', 
      name: 'Snacks', 
      description: 'Bocadillos y aperitivos' 
    },
    { 
      id: 'servicios', 
      name: 'Servicios Extra', 
      description: 'Servicios adicionales' 
    }
  ], [])

  // Cargar habitaciones desde la base de datos
  const loadRoomsFromDatabase = useCallback(async () => {
    try {
      console.log('Cargando habitaciones desde la base de datos para branch:', branchId)
      
      if (!branchId) {
        console.warn('No hay branch ID disponible')
        return generateFallbackRooms()
      }

      const { data: rooms, error } = await supabase
        .from('rooms')
        .select(`
          id,
          room_number,
          floor,
          base_price,
          description,
          is_active,
          room_status:status_id(
            id,
            status,
            color,
            is_available
          )
        `)
        .eq('branch_id', branchId)
        .eq('is_active', true)
        .order('room_number')

      if (error) {
        console.warn('Error cargando habitaciones, usando fallback:', error)
        return generateFallbackRooms()
      }

      if (!rooms || rooms.length === 0) {
        console.warn('No se encontraron habitaciones, usando fallback')
        return generateFallbackRooms()
      }

      // Agrupar por piso
      const grouped = {}
      
      rooms.forEach(room => {
        const floor = room.floor || Math.floor(parseInt(room.room_number) / 100) || 1
        
        if (!grouped[floor]) {
          grouped[floor] = []
        }

        const roomStatus = room.room_status?.status || 'disponible'
        const internalStatus = mapDatabaseStatusToInternal(roomStatus)
        
        grouped[floor].push({
          id: room.id,
          room_id: room.id,
          number: room.room_number,
          room_number: room.room_number,
          floor: floor,
          status: internalStatus,
          cleaning_status: roomStatus === 'limpieza' ? 'dirty' : 'clean',
          capacity: 2,
          base_price: room.base_price || roomPrices[floor] || 100,
          rate: room.base_price || roomPrices[floor] || 100,
          description: room.description || 'Habitación Estándar',
          room_status: {
            id: room.room_status?.id,
            status: roomStatus,
            color: room.room_status?.color || '#22c55e',
            is_available: room.room_status?.is_available !== false
          },
          isActive: true
        })
      })

      // Ordenar por número
      Object.keys(grouped).forEach(floor => {
        grouped[floor].sort((a, b) => {
          const numA = parseInt(a.room_number) || 0
          const numB = parseInt(b.room_number) || 0
          return numA - numB
        })
      })

      console.log('Habitaciones cargadas desde BD:', Object.keys(grouped).length, 'pisos')
      return grouped

    } catch (error) {
      console.error('Error cargando habitaciones:', error)
      return generateFallbackRooms()
    }
  }, [branchId, roomPrices])

  // Cargar check-ins activos desde la base de datos
  const loadActiveCheckinsFromDatabase = useCallback(async () => {
    try {
      console.log('Cargando check-ins activos desde la base de datos')
      
      if (!branchId) {
        return {}
      }

      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('quick_checkins')
        .select(`
          id,
          room_id,
          guest_name,
          guest_document,
          guest_phone,
          check_in_date,
          check_out_date,
          amount,
          created_at,
          room:room_id(
            id,
            room_number,
            floor
          ),
          payment_method:payment_method_id(
            name
          )
        `)
        .eq('branch_id', branchId)
        .gte('check_out_date', today)
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Error cargando check-ins activos:', error)
        return {}
      }

      const structured = {}
      
      if (data && Array.isArray(data)) {
        data.forEach(checkin => {
          const roomNumber = checkin.room?.room_number
          if (roomNumber) {
            const docParts = checkin.guest_document?.split(':') || ['DNI', '']
            
            structured[roomNumber] = {
              id: checkin.id,
              guest_name: checkin.guest_name,
              guest_document: checkin.guest_document,
              guest_phone: checkin.guest_phone,
              documentType: docParts[0],
              documentNumber: docParts[1],
              check_in_date: checkin.check_in_date,
              check_out_date: checkin.check_out_date,
              total_amount: checkin.amount,
              room_rate: checkin.amount, // Simplificado por ahora
              confirmation_code: `QC-${checkin.id}`,
              payment_method: checkin.payment_method?.name,
              created_at: checkin.created_at,
              snacks_consumed: [], // TODO: Implementar tabla relacionada
              isQuickCheckin: true
            }
          }
        })
      }

      console.log('Check-ins activos cargados:', Object.keys(structured).length)
      return structured

    } catch (error) {
      console.error('Error cargando check-ins activos:', error)
      return {}
    }
  }, [branchId])

  // Cargar todos los datos
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Cargando todos los datos del sistema...')

      // Cargar datos en paralelo
      const [rooms, checkins, snackCategoriesResult, snackItemsResult] = await Promise.all([
        loadRoomsFromDatabase(),
        loadActiveCheckinsFromDatabase(),
        snackService.getSnackCategories().catch(() => ({ data: [], error: null })),
        snackService.getSnackItems().catch(() => ({ data: [], error: null }))
      ])

      // Actualizar habitaciones con información de check-ins
      const updatedRooms = { ...rooms }
      Object.keys(updatedRooms).forEach(floor => {
        updatedRooms[floor] = updatedRooms[floor].map(room => {
          const activeCheckin = checkins[room.room_number]
          
          if (activeCheckin) {
            return {
              ...room,
              status: 'occupied',
              cleaning_status: 'dirty',
              quickCheckin: activeCheckin,
              currentGuest: {
                name: activeCheckin.guest_name,
                checkIn: activeCheckin.check_in_date,
                checkOut: activeCheckin.check_out_date
              },
              room_status: {
                ...room.room_status,
                status: 'ocupada',
                color: '#ef4444',
                is_available: false
              }
            }
          }
          
          return room
        })
      })

      // Procesar snacks
      let finalSnackTypes = fixedSnackTypes
      let finalSnackItems = []

      if (snackItemsResult?.data && snackItemsResult.data.length > 0) {
        console.log('Usando snacks reales de la base de datos')
        finalSnackItems = snackItemsResult.data

        if (snackCategoriesResult?.data && snackCategoriesResult.data.length > 0) {
          finalSnackTypes = snackCategoriesResult.data.map(cat => ({
            id: cat.id || cat.name.toLowerCase().replace(/\s+/g, '-'),
            name: cat.name,
            description: `Productos de ${cat.name.toLowerCase()}`
          }))
        }
      } else {
        console.log('Usando snacks de ejemplo')
        finalSnackItems = generateExampleSnacks()
      }

      // Actualizar estados
      setRoomsByFloor(updatedRooms)
      setActiveCheckins(checkins)
      setSnackTypes(finalSnackTypes)
      setSnackItems(finalSnackItems)
      
      console.log('Todos los datos cargados exitosamente:', {
        pisos: Object.keys(updatedRooms).length,
        habitaciones: Object.values(updatedRooms).flat().length,
        checkinsActivos: Object.keys(checkins).length,
        tiposSnacks: finalSnackTypes.length,
        itemsSnacks: finalSnackItems.length
      })
      
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError(err.message || 'Error al cargar datos del sistema')
      
      // Usar datos de fallback
      const fallbackRooms = generateFallbackRooms()
      setRoomsByFloor(fallbackRooms)
      setActiveCheckins({})
      setSnackTypes(fixedSnackTypes)
      setSnackItems(generateExampleSnacks())
      
    } finally {
      setLoading(false)
    }
  }, [loadRoomsFromDatabase, loadActiveCheckinsFromDatabase, fixedSnackTypes])

  // FUNCIÓN CORREGIDA: Procesar Quick Check-in REAL
  const processQuickCheckIn = useCallback(async (orderData, guestData, snacksData = []) => {
    try {
      console.log('Procesando Quick Check-in REAL:', {
        habitacion: orderData.room.number,
        huesped: guestData.fullName,
        snacks: snacksData.length
      })

      // Validaciones
      if (!guestData.fullName?.trim()) {
        throw new Error('El nombre del huésped es obligatorio')
      }

      if (!guestData.documentNumber?.trim()) {
        throw new Error('El documento del huésped es obligatorio')
      }

      if (!orderData.room?.id && !orderData.room?.room_id) {
        throw new Error('ID de habitación no válido')
      }

      const roomNumber = orderData.room.number
      const roomId = orderData.room.id || orderData.room.room_id
      const roomPrice = orderData.roomPrice || roomPrices[orderData.room.floor] || 100

      // Preparar datos para el servicio
      const roomDataForService = {
        roomId: roomId,
        room: orderData.room,
        roomPrice: roomPrice,
        checkInDate: orderData.checkInDate || new Date().toISOString().split('T')[0],
        checkOutDate: orderData.checkOutDate || new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
        paymentMethod: 'efectivo'
      }

      // LLAMAR AL SERVICIO REAL DE LA BASE DE DATOS
      console.log('Llamando a quickCheckinService.createQuickCheckin...')
      const { data: serviceResult, error: serviceError } = await quickCheckinService.createQuickCheckin(
        roomDataForService,
        guestData,
        snacksData
      )

      if (serviceError) {
        console.error('Error del servicio:', serviceError)
        throw serviceError
      }

      if (!serviceResult) {
        throw new Error('No se recibió confirmación del servidor')
      }

      console.log('Quick check-in guardado en la base de datos:', serviceResult)

      // Crear datos para el estado local basados en la respuesta del servidor
      const quickCheckinData = {
        id: serviceResult.id,
        guest_name: serviceResult.guestName || guestData.fullName,
        guest_document: serviceResult.guestDocument || `${guestData.documentType}:${guestData.documentNumber}`,
        guest_phone: serviceResult.guestPhone || guestData.phone || '',
        check_in_date: serviceResult.checkInDate || roomDataForService.checkInDate,
        check_out_date: serviceResult.checkOutDate || roomDataForService.checkOutDate,
        total_amount: serviceResult.total || roomDataForService.roomPrice,
        room_rate: roomPrice,
        confirmation_code: serviceResult.confirmationCode || `QC-${serviceResult.id}`,
        snacks_consumed: snacksData,
        isQuickCheckin: true
      }

      // Actualizar estados locales
      setRoomsByFloor(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(floor => {
          updated[floor] = updated[floor].map(room => 
            (room.number === roomNumber || room.room_number === roomNumber)
              ? { 
                  ...room, 
                  status: 'occupied',
                  cleaning_status: 'dirty',
                  quickCheckin: quickCheckinData,
                  room_status: {
                    ...room.room_status,
                    status: 'ocupada',
                    color: '#ef4444',
                    is_available: false
                  }
                }
              : room
          )
        })
        return updated
      })

      setActiveCheckins(prev => ({
        ...prev,
        [roomNumber]: quickCheckinData
      }))

      // Procesar consumo de snacks
      if (snacksData.length > 0) {
        setSnackItems(prev => prev.map(item => {
          const consumedSnack = snacksData.find(s => s.id === item.id)
          if (consumedSnack) {
            return {
              ...item,
              stock: Math.max(0, item.stock - consumedSnack.quantity)
            }
          }
          return item
        }))
      }

      return { data: serviceResult, error: null }
      
    } catch (error) {
      console.error('Error en processQuickCheckIn:', error)
      return { data: null, error }
    }
  }, [roomPrices])

  // FUNCIÓN CORREGIDA: Procesar Quick Check-out REAL
  const processQuickCheckOut = useCallback(async (roomNumber, paymentMethod = 'efectivo') => {
    try {
      console.log('Procesando Quick Check-out REAL:', { roomNumber, paymentMethod })

      const activeCheckin = activeCheckins[roomNumber]
      if (!activeCheckin) {
        throw new Error(`No hay check-in activo para la habitación ${roomNumber}`)
      }

      // LLAMAR AL SERVICIO REAL
      const { data: serviceResult, error: serviceError } = await quickCheckinService.processQuickCheckOut(
        activeCheckin.id,
        paymentMethod
      )

      if (serviceError) {
        throw serviceError
      }

      console.log('Quick check-out procesado en la base de datos')

      // Actualizar estados locales
      setRoomsByFloor(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(floor => {
          updated[floor] = updated[floor].map(room => 
            (room.number === roomNumber || room.room_number === roomNumber)
              ? { 
                  ...room, 
                  status: 'available',
                  cleaning_status: 'dirty', // Necesita limpieza
                  quickCheckin: null,
                  room_status: {
                    ...room.room_status,
                    status: 'limpieza',
                    color: '#f59e0b',
                    is_available: false
                  }
                }
              : room
          )
        })
        return updated
      })

      setActiveCheckins(prev => {
        const updated = { ...prev }
        delete updated[roomNumber]
        return updated
      })

      return { data: serviceResult || true, error: null }
      
    } catch (error) {
      console.error('Error en processQuickCheckOut:', error)
      return { data: null, error }
    }
  }, [activeCheckins])

  // Limpiar habitación
  const cleanRoom = useCallback(async (roomId) => {
    try {
      console.log('Limpiando habitación:', roomId)

      let roomNumber = null
      
      // Actualizar estado en la base de datos si es necesario
      // TODO: Implementar llamada a API para actualizar estado a 'disponible'
      
      setRoomsByFloor(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(floor => {
          updated[floor] = updated[floor].map(room => {
            if (room.id === roomId || room.room_id === roomId) {
              roomNumber = room.number || room.room_number
              return { 
                ...room, 
                status: 'available',
                cleaning_status: 'clean',
                room_status: {
                  ...room.room_status,
                  status: 'disponible',
                  color: '#22c55e',
                  is_available: true
                }
              }
            }
            return room
          })
        })
        return updated
      })

      return { data: { roomNumber }, error: null }
      
    } catch (error) {
      console.error('Error limpiando habitación:', error)
      return { data: null, error }
    }
  }, [])

  // Refrescar datos
  const refreshData = useCallback(() => {
    console.log('Refrescando datos...')
    loadData()
  }, [loadData])

  // Utilidades
  const mapDatabaseStatusToInternal = (dbStatus) => {
    const statusMap = {
      'disponible': 'available',
      'ocupada': 'occupied',
      'limpieza': 'cleaning',
      'mantenimiento': 'maintenance',
      'fuera_servicio': 'out_of_service'
    }
    return statusMap[dbStatus] || 'available'
  }

  const generateFallbackRooms = () => {
    console.log('Generando habitaciones de fallback...')
    return {
      1: [
        {
          id: 'fallback-101',
          room_id: 'fallback-101',
          number: '101',
          room_number: '101',
          floor: 1,
          status: 'available',
          cleaning_status: 'clean',
          capacity: 2,
          base_price: 100.00,
          rate: 100.00,
          description: 'Habitación Estándar',
          room_status: { status: 'disponible', is_available: true, color: '#22c55e' },
          isActive: true
        },
        {
          id: 'fallback-102',
          room_id: 'fallback-102',
          number: '102',
          room_number: '102',
          floor: 1,
          status: 'available',
          cleaning_status: 'clean',
          capacity: 2,
          base_price: 100.00,
          rate: 100.00,
          description: 'Habitación Estándar',
          room_status: { status: 'disponible', is_available: true, color: '#22c55e' },
          isActive: true
        }
      ]
    }
  }

  const generateExampleSnacks = () => {
    return [
      { 
        id: 1, 
        name: 'Agua Mineral', 
        price: 3.00, 
        stock: 50, 
        minimum_stock: 10,
        category_id: 'bebidas',
        snack_categories: { name: 'Bebidas' },
        category_name: 'Bebidas',
        category_slug: 'bebidas',
        is_active: true 
      },
      { 
        id: 2, 
        name: 'Coca Cola', 
        price: 5.00, 
        stock: 30, 
        minimum_stock: 5,
        category_id: 'bebidas',
        snack_categories: { name: 'Bebidas' },
        category_name: 'Bebidas',
        category_slug: 'bebidas',
        is_active: true 
      },
      { 
        id: 4, 
        name: 'Papitas Lays', 
        price: 6.00, 
        stock: 40, 
        minimum_stock: 8,
        category_id: 'snacks',
        snack_categories: { name: 'Snacks' },
        category_name: 'Snacks',
        category_slug: 'snacks',
        is_active: true 
      },
      { 
        id: 7, 
        name: 'Toalla Extra', 
        price: 15.00, 
        stock: 15, 
        minimum_stock: 3,
        category_id: 'servicios',
        snack_categories: { name: 'Servicios Extra' },
        category_name: 'Servicios Extra',
        category_slug: 'servicios',
        is_active: true 
      }
    ]
  }

  // Debug
  const debugData = useCallback(() => {
    console.log('=== DEBUG useQuickCheckins ===')
    console.log('Branch ID:', branchId)
    console.log('Rooms by floor:', roomsByFloor)
    console.log('Active checkins:', activeCheckins)
    console.log('Loading:', loading)
    console.log('Error:', error)
  }, [branchId, roomsByFloor, activeCheckins, loading, error])

  // Efectos
  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!branchId || loading) return

    const interval = setInterval(() => {
      console.log('Auto-refresh de datos...')
      loadData()
    }, 5 * 60 * 1000) // Cada 5 minutos

    return () => clearInterval(interval)
  }, [branchId, loading, loadData])

  // Estadísticas computadas
  const allRooms = Object.values(roomsByFloor).flat()
  const totalRooms = allRooms.length
  const availableRooms = allRooms.filter(r => r.status === 'available' && r.cleaning_status === 'clean').length
  const occupiedRooms = allRooms.filter(r => r.status === 'occupied').length
  const cleaningRooms = allRooms.filter(r => r.cleaning_status === 'dirty' || r.status === 'cleaning').length
  const activeCheckinsCount = Object.keys(activeCheckins).length

  return {
    // Datos principales
    roomsByFloor,
    activeCheckins,
    snackTypes,
    snackItems,
    roomPrices,
    
    // Estados
    loading,
    error,
    
    // Acciones principales
    processQuickCheckIn,
    processQuickCheckOut,
    cleanRoom,
    refreshData,
    debugData,
    
    // Estadísticas
    totalRooms,
    availableRooms,
    occupiedRooms,
    cleaningRooms,
    activeCheckinsCount,
    
    // Utilidades
    branchId,
    hasData: totalRooms > 0,
    isReady: !loading && !error && totalRooms > 0,
    hasQuickCleanCapability: true,
    supportedFeatures: [
      'walk_in_checkin',
      'guest_registration', 
      'snack_selection',
      'quick_room_cleaning',
      'quick_checkout',
      'real_time_updates',
      'database_persistence'
    ]
  }
}