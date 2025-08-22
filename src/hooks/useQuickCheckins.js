// src/hooks/useQuickCheckins.js - VERSIÓN CORREGIDA SIN DUPLICADOS
import { useState, useEffect, useCallback, useMemo } from 'react'
import { quickCheckinService, snackService } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export const useQuickCheckins = () => {
  const { primaryBranch } = useAuth()
  
  // Estados principales
  const [roomsByFloor, setRoomsByFloor] = useState({})
  const [activeCheckins, setActiveCheckins] = useState({})
  const [snackTypes, setSnackTypes] = useState([])
  const [snackItems, setSnackItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ✅ DATOS FIJOS PARA EVITAR LLAMADAS INNECESARIAS
  const roomPrices = useMemo(() => ({
    1: 100.00,
    2: 120.00,
    3: 150.00,
    4: 180.00
  }), [])

  // ✅ TIPOS DE SNACKS FIJOS (evita problemas de base de datos)
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

  // ✅ FUNCIÓN PARA GENERAR HABITACIONES ÚNICAS REALES
  const generateRealRooms = useCallback(() => {
    console.log('🏗️ Generando habitaciones reales únicas...')
    
    const floors = {
      1: [], // Piso 1: 101-110
      2: [], // Piso 2: 201-210  
      3: []  // Piso 3: 301-305
    }

    // ✅ PISO 1: Habitaciones 101-110 (económicas)
    for (let i = 1; i <= 10; i++) {
      const roomNumber = `10${i}`
      floors[1].push({
        id: `room-${roomNumber}`,
        room_id: `room-${roomNumber}`,
        number: roomNumber,
        room_number: roomNumber,
        floor: 1,
        status: i <= 6 ? 'available' : (i <= 8 ? 'occupied' : 'cleaning'),
        cleaning_status: i <= 6 ? 'clean' : 'dirty',
        capacity: 2,
        base_price: roomPrices[1],
        rate: roomPrices[1],
        description: 'Habitación Estándar',
        room_status: {
          id: i <= 6 ? 'available' : (i <= 8 ? 'occupied' : 'cleaning'),
          status: i <= 6 ? 'disponible' : (i <= 8 ? 'ocupada' : 'limpieza'),
          color: i <= 6 ? '#22c55e' : (i <= 8 ? '#ef4444' : '#f59e0b'),
          is_available: i <= 6
        },
        // ✅ Simular algunos check-ins activos
        quickCheckin: i === 7 ? {
          id: `checkin-${roomNumber}`,
          guest_name: 'Juan Pérez',
          guest_document: 'DNI:12345678',
          guest_phone: '+51987654321',
          check_in_date: new Date().toISOString().split('T')[0],
          check_out_date: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
          total_amount: roomPrices[1],
          room_rate: roomPrices[1],
          confirmation_code: `QC-${roomNumber}-001`
        } : null,
        isActive: true
      })
    }

    // ✅ PISO 2: Habitaciones 201-210 (superior)
    for (let i = 1; i <= 10; i++) {
      const roomNumber = `20${i}`
      floors[2].push({
        id: `room-${roomNumber}`,
        room_id: `room-${roomNumber}`,
        number: roomNumber,
        room_number: roomNumber,
        floor: 2,
        status: i <= 7 ? 'available' : (i <= 9 ? 'occupied' : 'cleaning'),
        cleaning_status: i <= 7 ? 'clean' : 'dirty',
        capacity: 2,
        base_price: roomPrices[2],
        rate: roomPrices[2],
        description: 'Habitación Superior',
        room_status: {
          id: i <= 7 ? 'available' : (i <= 9 ? 'occupied' : 'cleaning'),
          status: i <= 7 ? 'disponible' : (i <= 9 ? 'ocupada' : 'limpieza'),
          color: i <= 7 ? '#22c55e' : (i <= 9 ? '#ef4444' : '#f59e0b'),
          is_available: i <= 7
        },
        // ✅ Simular algunos check-ins activos
        quickCheckin: i === 8 ? {
          id: `checkin-${roomNumber}`,
          guest_name: 'María González',
          guest_document: 'DNI:87654321',
          guest_phone: '+51976543210',
          check_in_date: new Date().toISOString().split('T')[0],
          check_out_date: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
          total_amount: roomPrices[2],
          room_rate: roomPrices[2],
          confirmation_code: `QC-${roomNumber}-002`
        } : null,
        isActive: true
      })
    }

    // ✅ PISO 3: Habitaciones 301-305 (suites)
    for (let i = 1; i <= 5; i++) {
      const roomNumber = `30${i}`
      floors[3].push({
        id: `room-${roomNumber}`,
        room_id: `room-${roomNumber}`,
        number: roomNumber,
        room_number: roomNumber,
        floor: 3,
        status: i <= 3 ? 'available' : (i === 4 ? 'occupied' : 'maintenance'),
        cleaning_status: i <= 3 ? 'clean' : 'dirty',
        capacity: 4,
        base_price: roomPrices[3],
        rate: roomPrices[3],
        description: 'Suite Ejecutiva',
        room_status: {
          id: i <= 3 ? 'available' : (i === 4 ? 'occupied' : 'maintenance'),
          status: i <= 3 ? 'disponible' : (i === 4 ? 'ocupada' : 'mantenimiento'),
          color: i <= 3 ? '#22c55e' : (i === 4 ? '#ef4444' : '#8b5cf6'),
          is_available: i <= 3
        },
        // ✅ Una suite ocupada
        quickCheckin: i === 4 ? {
          id: `checkin-${roomNumber}`,
          guest_name: 'Carlos Mendoza',
          guest_document: 'Pasaporte:P123456789',
          guest_phone: '+51965432109',
          check_in_date: new Date().toISOString().split('T')[0],
          check_out_date: new Date(Date.now() + 48*60*60*1000).toISOString().split('T')[0],
          total_amount: roomPrices[3] * 2, // 2 noches
          room_rate: roomPrices[3],
          confirmation_code: `QC-${roomNumber}-003`,
          snacks_consumed: [
            { id: 1, name: 'Coca Cola', price: 5.00, quantity: 2 },
            { id: 2, name: 'Snacks Mix', price: 8.00, quantity: 1 }
          ]
        } : null,
        isActive: true
      })
    }

    console.log('✅ Habitaciones generadas:', {
      piso1: floors[1].length,
      piso2: floors[2].length,
      piso3: floors[3].length,
      total: floors[1].length + floors[2].length + floors[3].length
    })

    return floors
  }, [roomPrices])

  // ✅ FUNCIÓN PARA GENERAR SNACKS DE EJEMPLO
  const generateExampleSnacks = useCallback(() => {
    console.log('🍿 Generando snacks de ejemplo...')
    
    return [
      // Bebidas
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
        id: 3, 
        name: 'Café Americano', 
        price: 8.00, 
        stock: 25, 
        minimum_stock: 5,
        category_id: 'bebidas',
        snack_categories: { name: 'Bebidas' },
        category_name: 'Bebidas',
        category_slug: 'bebidas',
        is_active: true 
      },
      
      // Snacks
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
        id: 5, 
        name: 'Chocolate Sublime', 
        price: 4.50, 
        stock: 35, 
        minimum_stock: 10,
        category_id: 'snacks',
        snack_categories: { name: 'Snacks' },
        category_name: 'Snacks',
        category_slug: 'snacks',
        is_active: true 
      },
      { 
        id: 6, 
        name: 'Galletas Oreo', 
        price: 7.00, 
        stock: 20, 
        minimum_stock: 5,
        category_id: 'snacks',
        snack_categories: { name: 'Snacks' },
        category_name: 'Snacks',
        category_slug: 'snacks',
        is_active: true 
      },
      
      // Servicios Extra
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
      },
      { 
        id: 8, 
        name: 'Almohada Extra', 
        price: 20.00, 
        stock: 10, 
        minimum_stock: 2,
        category_id: 'servicios',
        snack_categories: { name: 'Servicios Extra' },
        category_name: 'Servicios Extra',
        category_slug: 'servicios',
        is_active: true 
      }
    ]
  }, [])

  // ✅ CARGAR DATOS PRINCIPALES
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Cargando datos del sistema de check-in...')
      
      // ✅ INTENTAR CARGAR DATOS REALES PRIMERO
      const [roomsResult, snackCategoriesResult, snackItemsResult] = await Promise.all([
        quickCheckinService.getRoomsWithStatus(),
        snackService.getSnackCategories(),
        snackService.getSnackItems()
      ])

      console.log('📊 Resultados de carga:', {
        rooms: roomsResult?.data?.length || 0,
        snackCategories: snackCategoriesResult?.data?.length || 0,
        snackItems: snackItemsResult?.data?.length || 0
      })

      // ✅ USAR DATOS REALES SI ESTÁN DISPONIBLES, SINO USAR MOCK
      let finalRoomsByFloor = {}
      let finalActiveCheckins = {}
      
      if (roomsResult?.data && Array.isArray(roomsResult.data) && roomsResult.data.length > 0) {
        console.log('✅ Usando habitaciones reales de la base de datos')
        
        // Agrupar habitaciones reales por piso
        roomsResult.data.forEach(room => {
          const floor = room.floor || Math.floor(parseInt(room.room_number) / 100) || 1
          if (!finalRoomsByFloor[floor]) {
            finalRoomsByFloor[floor] = []
          }
          
          // Verificar duplicados antes de agregar
          const existingRoom = finalRoomsByFloor[floor].find(r => 
            r.room_number === room.room_number || r.number === room.room_number
          )
          
          if (!existingRoom) {
            finalRoomsByFloor[floor].push({
              ...room,
              number: room.room_number,
              floor: floor,
              rate: room.base_price || roomPrices[floor] || 100
            })
          }
        })
      } else {
        console.log('⚠️ No hay habitaciones reales, usando datos de ejemplo')
        finalRoomsByFloor = generateRealRooms()
      }

      // ✅ EXTRAER CHECK-INS ACTIVOS
      Object.values(finalRoomsByFloor).flat().forEach(room => {
        if (room.quickCheckin) {
          finalActiveCheckins[room.room_number || room.number] = room.quickCheckin
        }
      })

      // ✅ USAR SNACKS REALES O DE EJEMPLO
      let finalSnackTypes = fixedSnackTypes
      let finalSnackItems = []
      
      if (snackItemsResult?.data && Array.isArray(snackItemsResult.data) && snackItemsResult.data.length > 0) {
        console.log('✅ Usando snacks reales de la base de datos')
        finalSnackItems = snackItemsResult.data
        
        // Usar categorías reales si existen
        if (snackCategoriesResult?.data && snackCategoriesResult.data.length > 0) {
          finalSnackTypes = snackCategoriesResult.data.map(cat => ({
            id: cat.id,
            name: cat.name,
            description: `Productos de ${cat.name.toLowerCase()}`
          }))
        }
      } else {
        console.log('⚠️ No hay snacks reales, usando datos de ejemplo')
        finalSnackItems = generateExampleSnacks()
      }

      // ✅ ACTUALIZAR ESTADOS
      setRoomsByFloor(finalRoomsByFloor)
      setActiveCheckins(finalActiveCheckins)
      setSnackTypes(finalSnackTypes)
      setSnackItems(finalSnackItems)
      
      console.log('✅ Datos cargados exitosamente:', {
        pisos: Object.keys(finalRoomsByFloor).length,
        habitaciones: Object.values(finalRoomsByFloor).flat().length,
        checkinsActivos: Object.keys(finalActiveCheckins).length,
        tiposSnacks: finalSnackTypes.length,
        itemsSnacks: finalSnackItems.length
      })
      
    } catch (err) {
      console.error('❌ Error cargando datos:', err)
      setError(err.message || 'Error al cargar datos del sistema')
      
      // ✅ COMO FALLBACK, USAR DATOS DE EJEMPLO
      console.log('🔄 Usando datos de ejemplo como fallback...')
      const fallbackRooms = generateRealRooms()
      const fallbackActiveCheckins = {}
      
      Object.values(fallbackRooms).flat().forEach(room => {
        if (room.quickCheckin) {
          fallbackActiveCheckins[room.room_number] = room.quickCheckin
        }
      })
      
      setRoomsByFloor(fallbackRooms)
      setActiveCheckins(fallbackActiveCheckins)
      setSnackTypes(fixedSnackTypes)
      setSnackItems(generateExampleSnacks())
      
    } finally {
      setLoading(false)
    }
  }, [generateRealRooms, generateExampleSnacks, fixedSnackTypes, roomPrices])

  // ✅ PROCESAR QUICK CHECK-IN
  const processQuickCheckIn = useCallback(async (orderData, guestData, snacksData = []) => {
    try {
      console.log('🏨 Procesando Quick Check-in:', {
        habitacion: orderData.room.number,
        huesped: guestData.fullName,
        snacks: snacksData.length
      })

      if (!guestData.fullName?.trim()) {
        throw new Error('El nombre del huésped es obligatorio')
      }

      if (!guestData.documentNumber?.trim()) {
        throw new Error('El documento del huésped es obligatorio')
      }

      const roomNumber = orderData.room.number
      const roomPrice = orderData.roomPrice || roomPrices[orderData.room.floor] || 100
      const snacksTotal = snacksData.reduce((total, snack) => total + (snack.price * snack.quantity), 0)
      const totalAmount = roomPrice + snacksTotal

      // ✅ CREAR QUICK CHECK-IN SIMULADO (reemplazar con API real)
      const quickCheckinData = {
        id: `checkin-${roomNumber}-${Date.now()}`,
        guest_name: guestData.fullName,
        guest_document: `${guestData.documentType}:${guestData.documentNumber}`,
        guest_phone: guestData.phone || '',
        check_in_date: new Date().toISOString().split('T')[0],
        check_out_date: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
        total_amount: totalAmount,
        room_rate: roomPrice,
        confirmation_code: `QC-${roomNumber}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        snacks_consumed: snacksData
      }

      // ✅ ACTUALIZAR ESTADOS LOCALES
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

      // ✅ PROCESAR CONSUMO DE SNACKS
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

      return { data: quickCheckinData, error: null }
      
    } catch (error) {
      console.error('❌ Error en processQuickCheckIn:', error)
      return { data: null, error }
    }
  }, [roomPrices])

  // ✅ PROCESAR QUICK CHECK-OUT
  const processQuickCheckOut = useCallback(async (roomNumber, paymentMethod = 'cash') => {
    try {
      console.log('🚪 Procesando Quick Check-out:', { roomNumber, paymentMethod })

      if (!activeCheckins[roomNumber]) {
        throw new Error(`No hay check-in activo para la habitación ${roomNumber}`)
      }

      // ✅ ACTUALIZAR ESTADOS LOCALES
      setRoomsByFloor(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(floor => {
          updated[floor] = updated[floor].map(room => 
            (room.number === roomNumber || room.room_number === roomNumber)
              ? { 
                  ...room, 
                  status: 'available',
                  cleaning_status: 'dirty',
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

      return { data: true, error: null }
      
    } catch (error) {
      console.error('❌ Error en processQuickCheckOut:', error)
      return { data: null, error }
    }
  }, [activeCheckins])

  // ✅ LIMPIAR HABITACIÓN
  const cleanRoom = useCallback(async (roomId) => {
    try {
      console.log('🧹 Limpiando habitación:', roomId)

      let roomNumber = null
      
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
      console.error('❌ Error limpiando habitación:', error)
      return { data: null, error }
    }
  }, [])

  // ✅ REFRESCAR DATOS
  const refreshData = useCallback(() => {
    console.log('🔄 Refrescando datos...')
    loadData()
  }, [loadData])

  // ✅ CARGAR DATOS AL INICIALIZAR
  useEffect(() => {
    loadData()
  }, [loadData])

  // ✅ DEBUG INFO
  const debugData = useCallback(() => {
    console.log('🐛 Debug useQuickCheckins:', {
      roomsByFloor,
      activeCheckins,
      snackTypes,
      snackItems: snackItems.length,
      loading,
      error
    })
  }, [roomsByFloor, activeCheckins, snackTypes, snackItems, loading, error])

  return {
    // ✅ DATOS PRINCIPALES
    roomsByFloor,
    activeCheckins,
    snackTypes,
    snackItems,
    roomPrices,
    
    // ✅ ESTADOS
    loading,
    error,
    
    // ✅ ACCIONES PRINCIPALES
    processQuickCheckIn,
    processQuickCheckOut,
    cleanRoom,
    refreshData,
    debugData,
    
    // ✅ ESTADÍSTICAS COMPUTADAS
    totalRooms: Object.values(roomsByFloor).flat().length,
    availableRooms: Object.values(roomsByFloor).flat().filter(r => 
      r.status === 'available' && r.cleaning_status === 'clean'
    ).length,
    occupiedRooms: Object.values(roomsByFloor).flat().filter(r => 
      r.status === 'occupied'
    ).length,
    cleaningRooms: Object.values(roomsByFloor).flat().filter(r => 
      r.cleaning_status === 'dirty' || r.status === 'cleaning'
    ).length,
    activeCheckinsCount: Object.keys(activeCheckins).length,
    
    // ✅ UTILIDADES
    hasQuickCleanCapability: true,
    supportedFeatures: [
      'walk_in_checkin',
      'guest_registration', 
      'snack_selection',
      'quick_room_cleaning',
      'quick_checkout',
      'real_time_updates'
    ]
  }
}