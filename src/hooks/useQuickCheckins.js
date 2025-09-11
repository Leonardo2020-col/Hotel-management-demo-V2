// src/hooks/useQuickCheckins.js - VERSIÓN CORREGIDA PARA PROBLEMA DE CHECKOUT
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

  // ✅ FUNCIÓN NUEVA: Limpiar check-ins obsoletos
  const cleanupObsoleteCheckins = useCallback(async () => {
    try {
      console.log('🧹 Limpiando check-ins obsoletos...')
      
      if (!branchId) return

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      // ✅ CORRECCIÓN: Marcar como checked_out los registros antiguos
      const { error } = await supabase
        .from('quick_checkins')
        .update({ 
          status: 'checked_out',
          actual_check_out_date: new Date().toISOString()
        })
        .eq('branch_id', branchId)
        .is('actual_check_out_date', null) // Solo los que no tienen checkout real
        .lt('check_out_date', yesterdayStr) // Más antiguos que ayer

      if (error) {
        console.warn('⚠️ Warning limpiando check-ins obsoletos:', error)
      } else {
        console.log('✅ Check-ins obsoletos limpiados exitosamente')
      }
    } catch (error) {
      console.warn('⚠️ Error en cleanup de check-ins:', error)
    }
  }, [branchId])

  // Cargar habitaciones desde la base de datos
  const loadRoomsFromDatabase = useCallback(async () => {
    try {
      console.log('📍 Cargando habitaciones desde la base de datos para branch:', branchId)
      
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

      console.log('✅ Habitaciones cargadas desde BD:', Object.keys(grouped).length, 'pisos')
      return grouped

    } catch (error) {
      console.error('❌ Error cargando habitaciones:', error)
      return generateFallbackRooms()
    }
  }, [branchId, roomPrices])

  // ✅ FUNCIÓN CORREGIDA: Cargar check-ins activos (SOLUCION AL PROBLEMA)
  const loadActiveCheckinsFromDatabase = useCallback(async () => {
  try {
    console.log('📋 Cargando check-ins activos desde la base de datos...')
    
    if (!branchId) {
      console.log('⚠️ No branchId disponible')
      return {}
    }

    const today = new Date().toISOString().split('T')[0]
    
    // ✅ CONSULTA CORREGIDA - MÁS PERMISIVA
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
        status,
        actual_check_out_date,
        snacks_consumed,
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
      // ✅ CAMBIO CRÍTICO: Incluir registros de hoy también
      .gte('check_out_date', today) 
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('⚠️ Error cargando check-ins activos:', error)
      return {}
    }

    console.log(`🔍 Procesando ${data?.length || 0} registros de quick_checkins...`)
    
    // ✅ DEBUGGING MEJORADO
    if (data && data.length > 0) {
      data.forEach((checkin, index) => {
        console.log(`📝 Quick checkin ${index + 1}:`, {
          id: checkin.id,
          room: checkin.room?.room_number,
          guest: checkin.guest_name,
          status: checkin.status,
          actual_checkout: checkin.actual_check_out_date,
          check_out_date: checkin.check_out_date,
          created_at: checkin.created_at
        })
      })
    }

    const structured = {}
    
    if (data && Array.isArray(data)) {
      data.forEach(checkin => {
        // ✅ LÓGICA DE FILTRADO CORREGIDA
        const roomNumber = checkin.room?.room_number
        
        if (!roomNumber) {
          console.log('⚠️ Quick checkin sin room_number:', checkin.id)
          return
        }

        // ✅ NUEVO: Condiciones más claras para incluir/excluir
        const hasActualCheckout = checkin.actual_check_out_date !== null
        const statusIsCheckedOut = checkin.status === 'checked_out'
        const checkOutDatePassed = new Date(checkin.check_out_date) < new Date(today)
        
        // ✅ DEBUGGING POR HABITACIÓN
        console.log(`🔍 Evaluando habitación ${roomNumber}:`, {
          hasActualCheckout,
          statusIsCheckedOut,
          checkOutDatePassed,
          shouldInclude: !hasActualCheckout && !statusIsCheckedOut && !checkOutDatePassed
        })

        // ✅ CONDICIÓN CORREGIDA: Solo excluir si realmente hizo checkout
        if (hasActualCheckout || statusIsCheckedOut) {
          console.log(`⏭️ Excluyendo habitación ${roomNumber} - Ya procesó checkout`)
          return
        }

        // ✅ INCLUIR ESTE CHECK-IN COMO ACTIVO
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
          snacks_consumed: checkin.snacks_consumed || [],
          isQuickCheckin: true,
          status: checkin.status || 'active'
        }
        
        console.log(`✅ Check-in activo incluido: Habitación ${roomNumber}`, structured[roomNumber])
      })
    }

    console.log(`✅ Check-ins activos cargados (filtrados): ${Object.keys(structured).length}`)
    
    // ✅ DEBUGGING FINAL
    Object.keys(structured).forEach(roomNumber => {
      console.log(`🏨 Habitación ${roomNumber} tiene check-in activo:`, {
        guest: structured[roomNumber].guest_name,
        id: structured[roomNumber].id,
        amount: structured[roomNumber].total_amount
      })
    })

    return structured

  } catch (error) {
    console.error('❌ Error en loadActiveCheckinsFromDatabase:', error)
    return {}
  }
}, [branchId])

  // Cargar todos los datos
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Cargando todos los datos del sistema...')

      // ✅ NUEVO: Limpiar datos obsoletos PRIMERO
      await cleanupObsoleteCheckins()

      // Cargar datos en paralelo
      const [rooms, checkins, snackCategoriesResult, snackItemsResult] = await Promise.all([
        loadRoomsFromDatabase(),
        loadActiveCheckinsFromDatabase(), // ✅ Ahora filtra correctamente
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
        console.log('✅ Usando snacks reales de la base de datos')
        finalSnackItems = snackItemsResult.data

        if (snackCategoriesResult?.data && snackCategoriesResult.data.length > 0) {
          finalSnackTypes = snackCategoriesResult.data.map(cat => ({
            id: cat.id || cat.name.toLowerCase().replace(/\s+/g, '-'),
            name: cat.name,
            description: `Productos de ${cat.name.toLowerCase()}`
          }))
        }
      } else {
        console.log('📝 Usando snacks de ejemplo')
        finalSnackItems = generateExampleSnacks()
      }

      // Actualizar estados
      setRoomsByFloor(updatedRooms)
      setActiveCheckins(checkins)
      setSnackTypes(finalSnackTypes)
      setSnackItems(finalSnackItems)
      
      console.log('✅ Todos los datos cargados exitosamente:', {
        pisos: Object.keys(updatedRooms).length,
        habitaciones: Object.values(updatedRooms).flat().length,
        checkinsActivos: Object.keys(checkins).length,
        tiposSnacks: finalSnackTypes.length,
        itemsSnacks: finalSnackItems.length
      })
      
    } catch (err) {
      console.error('❌ Error cargando datos:', err)
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
  }, [loadRoomsFromDatabase, loadActiveCheckinsFromDatabase, cleanupObsoleteCheckins, fixedSnackTypes])

  // FUNCIÓN CORREGIDA: Procesar Quick Check-in REAL
  const processQuickCheckIn = useCallback(async (orderData, guestData, snacksData = []) => {
    try {
      console.log('🔄 Procesando Quick Check-in REAL:', {
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
      console.log('📡 Llamando a quickCheckinService.createQuickCheckin...')
      const { data: serviceResult, error: serviceError } = await quickCheckinService.createQuickCheckin(
        roomDataForService,
        guestData,
        snacksData
      )

      if (serviceError) {
        console.error('❌ Error del servicio:', serviceError)
        throw serviceError
      }

      if (!serviceResult) {
        throw new Error('No se recibió confirmación del servidor')
      }

      console.log('✅ Quick check-in guardado en la base de datos:', serviceResult)

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
        isQuickCheckin: true,
        status: 'active' // ✅ NUEVO: Marcar como activo
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
      console.error('❌ Error en processQuickCheckIn:', error)
      return { data: null, error }
    }
  }, [roomPrices])

  // ✅ FUNCIÓN CORREGIDA: Procesar Quick Check-out REAL (SOLUCION AL PROBLEMA)
  const processQuickCheckOut = useCallback(async (roomNumber, paymentMethod = 'efectivo') => {
    try {
      console.log('🚪 Procesando Quick Check-out REAL:', { roomNumber, paymentMethod })

      const activeCheckin = activeCheckins[roomNumber]
      if (!activeCheckin) {
        throw new Error(`No hay check-in activo para la habitación ${roomNumber}`)
      }

      // ✅ CORRECCIÓN CRÍTICA: Marcar como checked_out en la base de datos
      console.log('📝 Actualizando estado del quick_checkin a checked_out...')
      
      const { error: updateError } = await supabase
        .from('quick_checkins')
        .update({
          status: 'checked_out', // ✅ Marcar como procesado
          actual_check_out_date: new Date().toISOString(), // ✅ Fecha real de checkout
          updated_at: new Date().toISOString()
        })
        .eq('id', activeCheckin.id)

      if (updateError) {
        console.error('❌ Error actualizando estado del quick checkin:', updateError)
        throw new Error(`Error marcando checkout: ${updateError.message}`)
      }

      console.log('✅ Estado actualizado en la base de datos exitosamente')

      // Llamar al servicio adicional si existe
      try {
        const { data: serviceResult, error: serviceError } = await quickCheckinService.processQuickCheckOut(
          activeCheckin.id,
          paymentMethod
        )

        if (serviceError) {
          console.warn('⚠️ Warning en servicio adicional:', serviceError)
          // No hacer throw aquí, el checkout principal ya se completó
        }
      } catch (serviceError) {
        console.warn('⚠️ Error en servicio adicional (no crítico):', serviceError)
      }

      console.log('✅ Quick check-out procesado completamente en la base de datos')

      // ✅ Actualizar estados locales inmediatamente
      setRoomsByFloor(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(floor => {
          updated[floor] = updated[floor].map(room => 
            (room.number === roomNumber || room.room_number === roomNumber)
              ? { 
                  ...room, 
                  status: 'available',
                  cleaning_status: 'dirty', // ✅ Necesita limpieza después del checkout
                  quickCheckin: null,
                  room_status: {
                    ...room.room_status,
                    status: 'limpieza', // ✅ Estado correcto: limpieza
                    color: '#f59e0b',
                    is_available: false
                  }
                }
              : room
          )
        })
        return updated
      })

      // ✅ Remover de check-ins activos
      setActiveCheckins(prev => {
        const updated = { ...prev }
        delete updated[roomNumber]
        return updated
      })

      return { data: { roomNumber, guestName: activeCheckin.guest_name }, error: null }
      
    } catch (error) {
      console.error('❌ Error en processQuickCheckOut:', error)
      return { data: null, error }
    }
  }, [activeCheckins])

  // Limpiar habitación
  const cleanRoom = useCallback(async (roomId) => {
    try {
      console.log('🧹 Limpiando habitación:', roomId)

      let roomNumber = null
      
      // ✅ TODO: Implementar llamada a API para actualizar estado a 'disponible'
      // await supabase.from('rooms').update({ status_id: availableStatusId }).eq('id', roomId)
      
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

  // Refrescar datos
  const refreshData = useCallback(() => {
    console.log('🔄 Refrescando datos...')
    loadData()
  }, [loadData])

  // ✅ FUNCIONES AUXILIARES

  // Mapear estados de BD a estados internos
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

  // Generar habitaciones de fallback
  const generateFallbackRooms = () => {
    console.log('🏗️ Generando habitaciones de fallback...')
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

  // Generar snacks de ejemplo
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
    console.log('================================')
  }, [branchId, roomsByFloor, activeCheckins, loading, error])

  // ✅ EFECTOS

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-refresh con cleanup mejorado
  useEffect(() => {
    if (!branchId || loading) return

    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh de datos (cada 5 minutos)...')
      loadData()
    }, 5 * 60 * 1000) // Cada 5 minutos

    return () => clearInterval(interval)
  }, [branchId, loading, loadData])

  // ✅ ESTADÍSTICAS COMPUTADAS
  const allRooms = Object.values(roomsByFloor).flat()
  const totalRooms = allRooms.length
  const availableRooms = allRooms.filter(r => r.status === 'available' && r.cleaning_status === 'clean').length
  const occupiedRooms = allRooms.filter(r => r.status === 'occupied').length
  const cleaningRooms = allRooms.filter(r => r.cleaning_status === 'dirty' || r.status === 'cleaning').length
  const activeCheckinsCount = Object.keys(activeCheckins).length

  // ✅ RETURN DEL HOOK
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
    processQuickCheckOut, // ✅ Función corregida
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
    
    // ✅ Features soportadas (actualizado)
    supportedFeatures: [
      'walk_in_checkin',
      'guest_registration', 
      'snack_selection',
      'quick_room_cleaning',
      'quick_checkout',
      'real_time_updates',
      'database_persistence',
      'checkout_state_management', // ✅ Nueva feature
      'automatic_cleanup' // ✅ Nueva feature
    ]
  }
}