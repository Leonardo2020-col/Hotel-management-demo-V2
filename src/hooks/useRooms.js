// hooks/useRooms.js
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const useRooms = (options = {}) => {
  const { getPrimaryBranch, isAuthenticated } = useAuth()
  const primaryBranch = getPrimaryBranch()
  
  // Estados principales
  const [rooms, setRooms] = useState([])
  const [roomStatuses, setRoomStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Estados para filtros y búsqueda
  const [filters, setFilters] = useState({
    status: options.defaultStatus || 'all',
    floor: options.defaultFloor || 'all',
    search: '',
    priceRange: 'all'
  })

  // Estados computados
  const [roomStats, setRoomStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    cleaning: 0,
    maintenance: 0,
    outOfOrder: 0,
    occupancyRate: 0
  })

  // ✅ Cargar estados de habitación
  const fetchRoomStatuses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('room_status')
        .select('*')
        .order('status')
      
      if (error) throw error
      setRoomStatuses(data || [])
      return data
    } catch (err) {
      console.error('Error fetching room statuses:', err)
      setError(err.message)
      return []
    }
  }, [])

  // ✅ Cargar habitaciones con detalles completos
  const fetchRooms = useCallback(async (showLoading = true) => {
    if (!primaryBranch?.id || !isAuthenticated()) {
      setLoading(false)
      return
    }

    try {
      if (showLoading) {
        setLoading(true)
        setError(null)
      } else {
        setRefreshing(true)
      }

      console.log('🏨 Fetching rooms for branch:', primaryBranch.name)

      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id,
          room_number,
          floor,
          base_price,
          description,
          is_active,
          created_at,
          updated_at,
          room_status:status_id(
            id,
            status,
            color,
            description,
            is_available
          ),
          branch:branch_id(
            id,
            name
          )
        `)
        .eq('branch_id', primaryBranch.id)
        .eq('is_active', true)
        .order('room_number')

      if (error) throw error

      // Enriquecer datos con información adicional
      const enrichedRooms = (data || []).map(room => {
        const isOccupied = room.room_status?.status === 'ocupada'
        
        return {
          ...room,
          // Información del estado
          statusName: room.room_status?.status || 'unknown',
          statusColor: room.room_status?.color || '#6b7280',
          statusDescription: room.room_status?.description || '',
          isAvailable: room.room_status?.is_available || false,
          
          // Información de ocupación
          isOccupied,
          currentGuest: null, // Se puede agregar más tarde
          currentGuestPhone: null,
          checkInTime: null,
          expectedCheckout: null,
          
          // Campos calculados
          floorLabel: `Piso ${room.floor}`,
          priceFormatted: new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
          }).format(room.base_price),
          
          // Acciones disponibles
          canClean: room.room_status?.status === 'limpieza',
          canMaintain: ['disponible', 'limpieza'].includes(room.room_status?.status),
          canOccupy: room.room_status?.status === 'disponible',
          canCheckOut: room.room_status?.status === 'ocupada',
          
          // Metadatos
          roomKey: `${room.room_number}-${room.floor}`,
          lastUpdated: room.updated_at
        }
      })

      setRooms(enrichedRooms)
      calculateRoomStats(enrichedRooms)
      
      console.log('✅ Rooms loaded successfully:', enrichedRooms.length)
      
    } catch (err) {
      console.error('❌ Error fetching rooms:', err)
      setError(err.message)
      toast.error('Error al cargar habitaciones')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [primaryBranch?.id, isAuthenticated])

  // ✅ Calcular estadísticas de habitaciones
  const calculateRoomStats = useCallback((roomsData) => {
    const stats = roomsData.reduce((acc, room) => {
      acc.total++
      
      switch (room.statusName) {
        case 'disponible':
          acc.available++
          break
        case 'ocupada':
          acc.occupied++
          break
        case 'limpieza':
          acc.cleaning++
          break
        case 'mantenimiento':
          acc.maintenance++
          break
        case 'fuera_servicio':
          acc.outOfOrder++
          break
        default:
          break
      }
      
      return acc
    }, {
      total: 0,
      available: 0,
      occupied: 0,
      cleaning: 0,
      maintenance: 0,
      outOfOrder: 0
    })

    stats.occupancyRate = stats.total > 0 
      ? Math.round((stats.occupied / stats.total) * 100) 
      : 0

    setRoomStats(stats)
  }, [])

  // ✅ Actualizar estado de habitación
  const updateRoomStatus = useCallback(async (roomId, newStatus, options = {}) => {
    try {
      console.log('🔄 Updating room status:', { roomId, newStatus })
      
      const loadingToast = toast.loading('Actualizando habitación...')
      
      // Obtener el ID del nuevo estado
      const { data: statusData, error: statusError } = await supabase
        .from('room_status')
        .select('id')
        .eq('status', newStatus)
        .single()

      if (statusError) throw statusError

      // Actualizar la habitación
      const { data, error } = await supabase
        .from('rooms')
        .update({ status_id: statusData.id })
        .eq('id', roomId)
        .select()
        .single()
      
      if (error) throw error
      
      // Actualizar room en el estado local
      setRooms(prev => prev.map(room => 
        room.id === roomId 
          ? { 
              ...room, 
              statusName: newStatus,
              statusColor: roomStatuses.find(s => s.status === newStatus)?.color || room.statusColor,
              isAvailable: roomStatuses.find(s => s.status === newStatus)?.is_available || false,
              lastUpdated: new Date().toISOString()
            }
          : room
      ))
      
      // Refrescar datos si es necesario
      if (options.refreshAfter) {
        await fetchRooms(false)
      }
      
      toast.dismiss(loadingToast)
      toast.success(`Habitación ${newStatus === 'disponible' ? 'disponible' : 'actualizada'}`)
      
      return { success: true, data }
    } catch (err) {
      console.error('❌ Error updating room status:', err)
      toast.error('Error al actualizar habitación')
      return { success: false, error: err }
    }
  }, [roomStatuses, fetchRooms])

  // ✅ Limpiar habitación (cambiar a disponible)
  const cleanRoom = useCallback(async (roomId) => {
    return await updateRoomStatus(roomId, 'disponible', { refreshAfter: true })
  }, [updateRoomStatus])

  // ✅ Marcar habitación para mantenimiento
  const setRoomMaintenance = useCallback(async (roomId) => {
    return await updateRoomStatus(roomId, 'mantenimiento', { refreshAfter: true })
  }, [updateRoomStatus])

  // ✅ Marcar habitación como fuera de servicio
  const setRoomOutOfOrder = useCallback(async (roomId) => {
    return await updateRoomStatus(roomId, 'fuera_servicio', { refreshAfter: true })
  }, [updateRoomStatus])

  // ✅ Filtrar habitaciones
  const filteredRooms = useCallback(() => {
    let filtered = [...rooms]

    // Filtro por estado
    if (filters.status !== 'all') {
      filtered = filtered.filter(room => room.statusName === filters.status)
    }

    // Filtro por piso
    if (filters.floor !== 'all') {
      filtered = filtered.filter(room => room.floor === parseInt(filters.floor))
    }

    // Filtro por búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(room =>
        room.room_number.toLowerCase().includes(searchLower) ||
        room.description?.toLowerCase().includes(searchLower) ||
        room.currentGuest?.toLowerCase().includes(searchLower)
      )
    }

    // Filtro por rango de precios
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(Number)
      filtered = filtered.filter(room => {
        if (max) {
          return room.base_price >= min && room.base_price <= max
        } else {
          return room.base_price >= min
        }
      })
    }

    return filtered
  }, [rooms, filters])

  // ✅ Obtener habitaciones disponibles para un rango de fechas
  const getAvailableRooms = useCallback(async (startDate, endDate) => {
    if (!primaryBranch?.id) return { data: [], error: 'No branch selected' }

    try {
      // Simplificada: solo habitaciones disponibles
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id,
          room_number,
          base_price,
          room_status:status_id(status, is_available)
        `)
        .eq('branch_id', primaryBranch.id)
        .eq('is_active', true)
        .eq('room_status.is_available', true)
      
      if (error) throw error
      return { data: data || [], error: null }
    } catch (err) {
      console.error('Error fetching available rooms:', err)
      return { data: [], error: err.message }
    }
  }, [primaryBranch?.id])

  // ✅ Refrescar datos
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchRoomStatuses(),
      fetchRooms(false)
    ])
  }, [fetchRoomStatuses, fetchRooms])

  // ✅ Actualizar filtros
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // ✅ Limpiar filtros
  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      floor: 'all',
      search: '',
      priceRange: 'all'
    })
  }, [])

  // ✅ Obtener pisos únicos
  const getFloors = useCallback(() => {
    const floors = [...new Set(rooms.map(room => room.floor))].sort((a, b) => a - b)
    return floors.map(floor => ({ value: floor, label: `Piso ${floor}` }))
  }, [rooms])

  // ✅ Obtener habitación por ID
  const getRoomById = useCallback((roomId) => {
    return rooms.find(room => room.id === roomId)
  }, [rooms])

  // ✅ Suscripción a cambios en tiempo real (simplificada)
  useEffect(() => {
    if (!primaryBranch?.id) return

    const subscription = supabase
      .channel('room-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `branch_id=eq.${primaryBranch.id}`
        },
        (payload) => {
          console.log('🔄 Real-time room update:', payload)
          fetchRooms(false)
        }
      )
      .subscribe()

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [primaryBranch?.id, fetchRooms])

  // ✅ Cargar datos iniciales
  useEffect(() => {
    if (primaryBranch?.id && isAuthenticated()) {
      Promise.all([
        fetchRoomStatuses(),
        fetchRooms(true)
      ])
    }
  }, [primaryBranch?.id, isAuthenticated, fetchRoomStatuses, fetchRooms])

  // Export default
  return {
    // Estados
    rooms: filteredRooms(),
    allRooms: rooms,
    roomStatuses,
    roomStats,
    loading,
    refreshing,
    error,
    filters,

    // Acciones
    updateRoomStatus,
    cleanRoom,
    setRoomMaintenance,
    setRoomOutOfOrder,
    refresh,
    updateFilters,
    clearFilters,

    // Utilidades
    getAvailableRooms,
    getFloors,
    getRoomById,

    // Metadatos
    hasRooms: rooms.length > 0,
    isEmpty: !loading && rooms.length === 0,
    isFiltered: Object.values(filters).some(v => v !== 'all' && v !== ''),
    
    // Branch info
    currentBranch: primaryBranch
  }
}

export default useRooms