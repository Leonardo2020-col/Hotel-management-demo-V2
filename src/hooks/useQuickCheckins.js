import { useState, useEffect, useCallback } from 'react'
import { supabase, snackService, quickCheckinService } from '../lib/supabase'
import toast from 'react-hot-toast'

export const useQuickCheckins = () => {
  const [roomsByFloor, setRoomsByFloor] = useState({})
  const [activeCheckins, setActiveCheckins] = useState({})
  const [snackTypes, setSnackTypes] = useState([])
  const [snackItems, setSnackItems] = useState([])
  const [roomPrices] = useState({ 1: 80, 2: 95, 3: 110, 4: 120 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ✅ FUNCIÓN PRINCIPAL: Cargar todos los datos desde Supabase
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Loading all data from Supabase...')

      // Ejecutar todas las consultas en paralelo
      const [roomsResult, quickCheckinsResult, snackCategoriesResult, snackItemsResult] = await Promise.all([
        loadRoomsFromSupabase(),
        loadActiveQuickCheckins(),
        loadSnackCategories(),
        loadSnackItems()
      ])

      // Actualizar estado con resultados reales
      if (roomsResult.success) {
        setRoomsByFloor(roomsResult.data)
      }

      if (quickCheckinsResult.success) {
        setActiveCheckins(quickCheckinsResult.data)
      }

      if (snackCategoriesResult.success) {
        setSnackTypes(snackCategoriesResult.data)
      }

      if (snackItemsResult.success) {
        setSnackItems(snackItemsResult.data)
      }

      console.log('✅ All data loaded successfully!')
    } catch (err) {
      console.error('❌ Error loading data:', err)
      setError(err.message)
      toast.error('Error cargando datos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // ✅ CARGAR HABITACIONES REALES DESDE SUPABASE
  const loadRoomsFromSupabase = useCallback(async () => {
    try {
      console.log('🏨 Loading rooms from Supabase...')

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
          ),
          branch:branch_id(
            id,
            name
          )
        `)
        .eq('is_active', true)
        .order('room_number')

      if (error) {
        console.error('❌ Error loading rooms:', error)
        throw error
      }

      if (!rooms || rooms.length === 0) {
        console.warn('⚠️ No rooms found in database')
        return { success: false, data: {}, error: 'No hay habitaciones en la base de datos' }
      }

      // Agrupar habitaciones por piso
      const roomsByFloor = {}

      rooms.forEach(room => {
        const floor = room.floor || Math.floor(parseInt(room.room_number) / 100) || 1
        
        if (!roomsByFloor[floor]) {
          roomsByFloor[floor] = []
        }

        // Procesar habitación con datos reales de Supabase
        const processedRoom = {
          id: room.id,
          number: room.room_number,
          room_number: room.room_number,
          floor: floor,
          base_price: room.base_price || roomPrices[floor] || 100,
          description: room.description || 'Habitación Estándar',
          status: room.room_status?.status || 'disponible',
          room_status: room.room_status,
          capacity: 2, // Default capacity
          is_active: room.is_active,
          branch: room.branch
        }

        roomsByFloor[floor].push(processedRoom)
      })

      // Ordenar habitaciones por número dentro de cada piso
      Object.keys(roomsByFloor).forEach(floor => {
        roomsByFloor[floor].sort((a, b) => {
          const numA = parseInt(a.room_number) || 0
          const numB = parseInt(b.room_number) || 0
          return numA - numB
        })
      })

      console.log('✅ Rooms loaded from Supabase:', {
        totalRooms: rooms.length,
        floors: Object.keys(roomsByFloor).length,
        roomsByFloor: Object.keys(roomsByFloor).map(floor => ({
          floor,
          count: roomsByFloor[floor].length
        }))
      })

      return { success: true, data: roomsByFloor, error: null }
    } catch (error) {
      console.error('❌ Error in loadRoomsFromSupabase:', error)
      return { success: false, data: {}, error: error.message }
    }
  }, [roomPrices])

  // ✅ CARGAR CHECK-INS ACTIVOS DESDE SUPABASE
  const loadActiveQuickCheckins = useCallback(async () => {
    try {
      console.log('📋 Loading active quick checkins from Supabase...')

      const { data: quickCheckins, error } = await supabase
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
            room_number
          ),
          payment_method:payment_method_id(
            id,
            name
          )
        `)
        .gte('check_out_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error loading quick checkins:', error)
        throw error
      }

      // Convertir a formato esperado por el frontend
      const activeCheckins = {}
      
      if (quickCheckins && quickCheckins.length > 0) {
        quickCheckins.forEach(checkin => {
          const roomNumber = checkin.room?.room_number
          if (roomNumber) {
            activeCheckins[roomNumber] = {
              id: checkin.id,
              room_id: checkin.room_id,
              guest_name: checkin.guest_name,
              guest_document: checkin.guest_document,
              guest_phone: checkin.guest_phone,
              check_in_date: checkin.check_in_date,
              check_out_date: checkin.check_out_date,
              total_amount: checkin.amount,
              payment_method: checkin.payment_method?.name,
              created_at: checkin.created_at
            }
          }
        })
      }

      console.log('✅ Active quick checkins loaded:', Object.keys(activeCheckins).length)
      return { success: true, data: activeCheckins, error: null }
    } catch (error) {
      console.error('❌ Error in loadActiveQuickCheckins:', error)
      return { success: false, data: {}, error: error.message }
    }
  }, [])

  // ✅ CARGAR CATEGORÍAS DE SNACKS DESDE SUPABASE
  const loadSnackCategories = useCallback(async () => {
    try {
      console.log('🏷️ Loading snack categories from Supabase...')
      
      const { data, error } = await snackService.getSnackCategories()
      
      if (error) {
        console.error('❌ Error loading snack categories:', error)
        throw error
      }

      // Convertir formato de base de datos a formato esperado por frontend
      const processedCategories = (data || []).map(category => ({
        id: category.name.toLowerCase().replace(/\s+/g, '-').replace(/[áéíóúñ]/g, match => {
          const accents = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'n' }
          return accents[match] || match
        }),
        name: category.name,
        description: `Productos de ${category.name.toLowerCase()}`
      }))

      console.log('✅ Snack categories processed:', processedCategories.length)
      return { success: true, data: processedCategories, error: null }
    } catch (error) {
      console.error('❌ Error in loadSnackCategories:', error)
      return { success: false, data: [], error: error.message }
    }
  }, [])

  // ✅ CARGAR ITEMS DE SNACKS DESDE SUPABASE
  const loadSnackItems = useCallback(async () => {
    try {
      console.log('🍿 Loading snack items from Supabase...')
      
      const { data, error } = await snackService.getSnackItems()
      
      if (error) {
        console.error('❌ Error loading snack items:', error)
        throw error
      }

      console.log('✅ Snack items loaded:', data?.length || 0)
      return { success: true, data: data || [], error: null }
    } catch (error) {
      console.error('❌ Error in loadSnackItems:', error)
      return { success: false, data: [], error: error.message }
    }
  }, [])

  // ✅ PROCESAR CHECK-IN RÁPIDO
  const processQuickCheckIn = useCallback(async (orderData, guestData, snacks = []) => {
    try {
      console.log('🚀 Processing quick check-in...', {
        room: orderData.room?.number,
        guest: guestData.fullName,
        snacks: snacks.length
      })

      const { data, error } = await quickCheckinService.createQuickCheckin(
        {
          roomId: orderData.room.id,
          roomPrice: orderData.roomPrice,
          checkInDate: orderData.checkInDate,
          checkOutDate: orderData.checkOutDate,
          paymentMethod: 'efectivo'
        },
        guestData,
        snacks
      )

      if (error) {
        throw error
      }

      // Recargar datos después del check-in
      await loadAllData()

      return { data, error: null }
    } catch (error) {
      console.error('❌ Error in processQuickCheckIn:', error)
      return { data: null, error }
    }
  }, [loadAllData])

  // ✅ PROCESAR CHECK-OUT RÁPIDO
  const processQuickCheckOut = useCallback(async (roomNumber, paymentMethod = 'efectivo') => {
    try {
      console.log('🚪 Processing quick check-out for room:', roomNumber)

      // Encontrar el check-in activo
      const activeCheckin = activeCheckins[roomNumber]
      if (!activeCheckin) {
        throw new Error(`No se encontró check-in activo para la habitación ${roomNumber}`)
      }

      // Eliminar el quick check-in
      const { error } = await supabase
        .from('quick_checkins')
        .delete()
        .eq('id', activeCheckin.id)

      if (error) {
        throw error
      }

      // Actualizar estado de la habitación a disponible pero sucia
      const roomData = Object.values(roomsByFloor)
        .flat()
        .find(room => room.room_number === roomNumber)

      if (roomData) {
        const { data: statusData } = await supabase
          .from('room_status')
          .select('id')
          .eq('status', 'limpieza')
          .single()

        if (statusData) {
          await supabase
            .from('rooms')
            .update({ status_id: statusData.id })
            .eq('id', roomData.id)
        }
      }

      // Recargar datos
      await loadAllData()

      return { data: true, error: null }
    } catch (error) {
      console.error('❌ Error in processQuickCheckOut:', error)
      return { data: null, error }
    }
  }, [activeCheckins, roomsByFloor, loadAllData])

  // ✅ LIMPIAR HABITACIÓN
  const cleanRoom = useCallback(async (roomId) => {
    try {
      console.log('🧹 Cleaning room:', roomId)

      // Actualizar estado a disponible
      const { data: statusData } = await supabase
        .from('room_status')
        .select('id')
        .eq('status', 'disponible')
        .single()

      if (!statusData) {
        throw new Error('Estado "disponible" no encontrado')
      }

      const { error } = await supabase
        .from('rooms')
        .update({ status_id: statusData.id })
        .eq('id', roomId)

      if (error) {
        throw error
      }

      // Recargar datos
      await loadAllData()

      return { data: true, error: null }
    } catch (error) {
      console.error('❌ Error in cleanRoom:', error)
      return { data: null, error }
    }
  }, [loadAllData])

  // ✅ REFRESCAR DATOS
  const refreshData = useCallback(() => {
    console.log('🔄 Refreshing all data...')
    loadAllData()
  }, [loadAllData])

  // ✅ CARGAR DATOS AL MONTAR EL COMPONENTE
  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // ✅ AUTO-REFRESH CADA 2 MINUTOS
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        loadAllData()
      }
    }, 2 * 60 * 1000) // 2 minutos

    return () => clearInterval(interval)
  }, [loadAllData, loading])

  return {
    // Estado
    roomsByFloor,
    activeCheckins,
    snackTypes,
    snackItems,
    roomPrices,
    loading,
    error,

    // Acciones
    processQuickCheckIn,
    processQuickCheckOut,
    cleanRoom,
    refreshData,

    // Información del sistema
    isConnectedToSupabase: true,
    dataSource: 'supabase_only',
    supportedFeatures: [
      'real_time_rooms',
      'quick_checkin',
      'quick_checkout', 
      'room_cleaning',
      'snack_management'
    ]
  }
}