// src/hooks/useRooms.js - SIN ROOM_TYPES
import { useState, useEffect, useMemo } from 'react'
import { db, subscriptions } from '../lib/supabase'
import toast from 'react-hot-toast'

export const useRooms = () => {
  const [rooms, setRooms] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [cleaningStaff, setCleaningStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estados de limpieza y habitaciones (para compatibilidad)
  const ROOM_STATUS = {
    AVAILABLE: 'available',
    OCCUPIED: 'occupied', 
    CLEANING: 'cleaning',
    MAINTENANCE: 'maintenance',
    OUT_OF_ORDER: 'out_of_order'
  }

  const CLEANING_STATUS = {
    CLEAN: 'clean',
    DIRTY: 'dirty',
    IN_PROGRESS: 'in_progress',
    INSPECTED: 'inspected'
  }

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [])

  // Suscripción en tiempo real - SIMPLIFICADA
  useEffect(() => {
    if (rooms.length === 0) return

    const subscription = subscriptions.rooms((payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload
      
      switch (eventType) {
        case 'INSERT':
          loadData() // Recargar todo para mantener consistencia
          toast.success('Nueva habitación agregada')
          break
        case 'UPDATE':
          setRooms(prev => 
            prev.map(room => room.id === newRecord.id ? { ...room, ...newRecord } : room)
          )
          break
        case 'DELETE':
          setRooms(prev => prev.filter(room => room.id !== oldRecord.id))
          toast.info('Habitación eliminada')
          break
        default:
          break
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [rooms.length])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading rooms data without room_types...')
      
      // 1. Cargar habitaciones
      const roomsResult = await db.getRooms()
      if (roomsResult.error) {
        console.error('Error loading rooms:', roomsResult.error)
        throw new Error('Error al cargar habitaciones: ' + roomsResult.error.message)
      }
      
      console.log('Rooms loaded:', roomsResult.data)
      setRooms(roomsResult.data || [])
      
      // 2. Generar tipos únicos desde las habitaciones existentes
      const uniqueTypes = await db.getRoomTypes()
      if (uniqueTypes.data) {
        setRoomTypes(uniqueTypes.data)
      } else {
        // Fallback: crear tipos desde habitaciones existentes
        const types = generateTypesFromRooms(roomsResult.data || [])
        setRoomTypes(types)
      }
      
      // 3. Cargar personal de limpieza (mock data)
      const staffResult = await db.getCleaningStaff()
      setCleaningStaff(staffResult.data || [])
      
    } catch (err) {
      console.error('Error in loadData:', err)
      setError(err.message)
      toast.error('Error al cargar datos de habitaciones')
    } finally {
      setLoading(false)
    }
  }

  // Generar tipos únicos desde habitaciones existentes
  const generateTypesFromRooms = (roomsData) => {
    const uniqueTypes = {}
    
    roomsData.forEach((room, index) => {
      const typeName = room.room_type || 'Habitación Estándar'
      if (!uniqueTypes[typeName]) {
        uniqueTypes[typeName] = {
          id: index + 1,
          name: typeName,
          base_rate: room.base_rate || 100,
          capacity: room.capacity || 2,
          active: true
        }
      }
    })

    // Si no hay tipos, crear uno por defecto
    if (Object.keys(uniqueTypes).length === 0) {
      uniqueTypes['Habitación Estándar'] = {
        id: 1,
        name: 'Habitación Estándar',
        base_rate: 100,
        capacity: 2,
        active: true
      }
    }

    return Object.values(uniqueTypes)
  }

  // Calcular estadísticas de habitaciones - SIMPLIFICADO
  const roomStats = useMemo(() => {
    if (!rooms || rooms.length === 0) {
      return {
        total: 0,
        available: 0,
        occupied: 0,
        occupancyRate: 0,
        cleaning: 0,
        maintenance: 0,
        outOfOrder: 0,
        needsCleaning: 0,
        revenue: {
          today: 0,
          thisMonth: 0,
          average: 0
        }
      }
    }

    const total = rooms.length
    const available = rooms.filter(r => r.status === ROOM_STATUS.AVAILABLE).length
    const occupied = rooms.filter(r => r.status === ROOM_STATUS.OCCUPIED).length
    const cleaning = rooms.filter(r => r.status === ROOM_STATUS.CLEANING).length
    const maintenance = rooms.filter(r => r.status === ROOM_STATUS.MAINTENANCE).length
    const outOfOrder = rooms.filter(r => r.status === ROOM_STATUS.OUT_OF_ORDER).length
    const needsCleaning = rooms.filter(r => r.cleaning_status === CLEANING_STATUS.DIRTY).length
    
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0

    // Calcular ingresos estimados
    const todayRevenue = rooms.reduce((sum, room) => {
      if (room.status === ROOM_STATUS.OCCUPIED) {
        return sum + (room.base_rate || 100)
      }
      return sum
    }, 0)
    
    const monthlyRevenue = todayRevenue * 30
    const averageRevenue = total > 0 ? monthlyRevenue / total : 0

    return {
      total,
      available,
      occupied,
      occupancyRate,
      cleaning,
      maintenance,
      outOfOrder,
      needsCleaning,
      revenue: {
        today: todayRevenue,
        thisMonth: monthlyRevenue,
        average: averageRevenue
      }
    }
  }, [rooms])

  // Calcular habitaciones por tipo - SIMPLIFICADO
  const roomsByType = useMemo(() => {
    if (!rooms || rooms.length === 0) return []

    const typeStats = {}
    
    rooms.forEach(room => {
      const typeName = room.room_type || 'Habitación Estándar'
      if (!typeStats[typeName]) {
        typeStats[typeName] = {
          name: typeName,
          total: 0,
          available: 0,
          occupied: 0,
          averageRate: room.base_rate || 100
        }
      }
      typeStats[typeName].total++
      if (room.status === ROOM_STATUS.AVAILABLE) typeStats[typeName].available++
      if (room.status === ROOM_STATUS.OCCUPIED) typeStats[typeName].occupied++
    })

    return Object.values(typeStats)
  }, [rooms])

  // Crear nueva habitación - SIMPLIFICADO
  const createRoom = async (roomData) => {
    try {
      console.log('Creating room without room_types:', roomData)
      
      const newRoomData = {
        number: roomData.number,
        floor: parseInt(roomData.floor),
        room_type: roomData.type || roomData.room_type || 'Habitación Estándar',
        base_rate: parseFloat(roomData.rate || roomData.base_rate || 100),
        capacity: parseInt(roomData.capacity || 2),
        status: ROOM_STATUS.AVAILABLE,
        cleaning_status: CLEANING_STATUS.CLEAN,
        beds: roomData.beds || [{ type: 'Doble', count: 1 }],
        size: parseInt(roomData.size) || 25,
        features: roomData.features || ['WiFi Gratis'],
        description: roomData.description || `${roomData.type || 'Habitación Estándar'} ${roomData.number}`,
        bed_options: roomData.bed_options || ['Doble'],
        branch_id: 1
      }

      console.log('Sending room data to create:', newRoomData)

      const { data, error } = await db.createRoom(newRoomData)
      
      if (error) {
        console.error('Error from createRoom:', error)
        throw error
      }
      
      console.log('Room created successfully:', data)
      
      // Recargar datos para mantener consistencia
      await loadData()
      
      toast.success('Habitación creada exitosamente')
      return { data, error: null }
      
    } catch (error) {
      console.error('Error in createRoom:', error)
      const errorMessage = error.message || 'Error desconocido al crear la habitación'
      toast.error(errorMessage)
      return { data: null, error: { message: errorMessage } }
    }
  }

  // Actualizar habitación - SIMPLIFICADO
  const updateRoom = async (roomId, updateData) => {
    try {
      const { data, error } = await db.updateRoom(roomId, updateData)
      
      if (error) throw error
      
      // Actualizar estado local inmediatamente
      setRooms(prev => 
        prev.map(room => room.id === roomId ? { ...room, ...data } : room)
      )
      
      toast.success('Habitación actualizada exitosamente')
      return { data, error: null }
      
    } catch (error) {
      console.error('Error updating room:', error)
      toast.error('Error al actualizar la habitación')
      return { data: null, error }
    }
  }

  // Eliminar habitación
  const deleteRoom = async (roomId) => {
    try {
      const { data, error } = await db.deleteRoom(roomId)
      
      if (error) throw error
      
      // Actualizar estado local inmediatamente
      setRooms(prev => prev.filter(room => room.id !== roomId))
      
      toast.success('Habitación eliminada exitosamente')
      return { data, error: null }
      
    } catch (error) {
      console.error('Error deleting room:', error)
      toast.error('Error al eliminar la habitación')
      return { data: null, error }
    }
  }

  // Actualizar estado de habitación
  const updateRoomStatus = async (roomId, newStatus) => {
    try {
      const { data, error } = await db.updateRoomStatus(roomId, newStatus)
      
      if (error) throw error
      
      // Actualizar estado local inmediatamente
      setRooms(prev => 
        prev.map(room => room.id === roomId ? { ...room, status: newStatus } : room)
      )
      
      const statusMessages = {
        [ROOM_STATUS.AVAILABLE]: 'Habitación disponible',
        [ROOM_STATUS.OCCUPIED]: 'Habitación ocupada',
        [ROOM_STATUS.CLEANING]: 'Habitación en limpieza',
        [ROOM_STATUS.MAINTENANCE]: 'Habitación en mantenimiento',
        [ROOM_STATUS.OUT_OF_ORDER]: 'Habitación fuera de servicio'
      }
      
      toast.success(statusMessages[newStatus] || 'Estado actualizado')
      return { data, error: null }
      
    } catch (error) {
      console.error('Error updating room status:', error)
      toast.error('Error al actualizar el estado')
      return { data: null, error }
    }
  }

  // Actualizar estado de limpieza
  const updateCleaningStatus = async (roomId, newStatus) => {
    try {
      // Determinar si también cambiar el estado de la habitación
      let roomStatus = null
      if (newStatus === CLEANING_STATUS.CLEAN) {
        roomStatus = ROOM_STATUS.AVAILABLE
      } else if (newStatus === CLEANING_STATUS.IN_PROGRESS) {
        roomStatus = ROOM_STATUS.CLEANING
      }

      const { data, error } = await db.updateRoomStatus(roomId, roomStatus, newStatus)
      
      if (error) throw error
      
      // Actualizar estado local inmediatamente
      setRooms(prev => 
        prev.map(room => room.id === roomId ? { 
          ...room, 
          cleaning_status: newStatus,
          ...(roomStatus && { status: roomStatus })
        } : room)
      )
      
      const cleaningMessages = {
        [CLEANING_STATUS.CLEAN]: 'Habitación limpia',
        [CLEANING_STATUS.DIRTY]: 'Habitación sucia',
        [CLEANING_STATUS.IN_PROGRESS]: 'Limpieza en progreso',
        [CLEANING_STATUS.INSPECTED]: 'Habitación inspeccionada'
      }
      
      toast.success(cleaningMessages[newStatus] || 'Estado de limpieza actualizado')
      return { data, error: null }
      
    } catch (error) {
      console.error('Error updating cleaning status:', error)
      toast.error('Error al actualizar el estado de limpieza')
      return { data: null, error }
    }
  }

  // Asignar limpieza a habitaciones
  const assignCleaning = async (roomIds, staffId) => {
    try {
      const staff = cleaningStaff.find(s => s.id === staffId)
      const staffName = staff ? staff.name : 'Personal asignado'

      const { data, error } = await db.assignCleaning(roomIds, staffName)
      
      if (error) throw error
      
      // Actualizar estado local inmediatamente
      setRooms(prev => 
        prev.map(room => 
          roomIds.includes(room.id) ? {
            ...room,
            cleaning_status: CLEANING_STATUS.IN_PROGRESS,
            assigned_cleaner: staffName,
            status: ROOM_STATUS.CLEANING
          } : room
        )
      )
      
      toast.success(`Limpieza asignada a ${staffName}`)
      return { data, error: null }
      
    } catch (error) {
      console.error('Error assigning cleaning:', error)
      toast.error('Error al asignar la limpieza')
      return { data: null, error }
    }
  }

  // Obtener habitaciones que necesitan limpieza
  const getRoomsNeedingCleaning = () => {
    return rooms.filter(room => 
      room.status === ROOM_STATUS.CLEANING || 
      room.cleaning_status === CLEANING_STATUS.DIRTY ||
      room.cleaning_status === CLEANING_STATUS.IN_PROGRESS
    )
  }

  // Obtener habitaciones disponibles
  const getAvailableRooms = () => {
    return rooms.filter(room => 
      room.status === ROOM_STATUS.AVAILABLE && 
      room.cleaning_status === CLEANING_STATUS.CLEAN
    )
  }

  // Obtener estadísticas de limpieza
  const getCleaningStats = () => {
    const needsCleaning = rooms.filter(r => r.cleaning_status === CLEANING_STATUS.DIRTY).length
    const inProgress = rooms.filter(r => r.cleaning_status === CLEANING_STATUS.IN_PROGRESS).length
    const clean = rooms.filter(r => r.cleaning_status === CLEANING_STATUS.CLEAN).length
    const inspected = rooms.filter(r => r.cleaning_status === CLEANING_STATUS.INSPECTED).length

    return {
      needsCleaning,
      inProgress,
      clean,
      inspected,
      total: rooms.length
    }
  }

  // Función de depuración para verificar datos
  const debugData = () => {
    console.log('=== DEBUG DATA (WITHOUT ROOM_TYPES) ===')
    console.log('Rooms:', rooms)
    console.log('Room Types (generated):', roomTypes)
    console.log('Cleaning Staff:', cleaningStaff)
    console.log('Room Stats:', roomStats)
    console.log('Rooms by Type:', roomsByType)
    console.log('=======================================')
  }

  return {
    // Datos
    rooms,
    roomTypes, // Generados dinámicamente desde habitaciones
    cleaningStaff,
    roomStats,
    roomsByType,
    loading,
    error,
    
    // Estados para compatibilidad
    ROOM_STATUS,
    CLEANING_STATUS,
    
    // Métodos CRUD
    createRoom,
    updateRoom,
    deleteRoom,
    updateRoomStatus,
    updateCleaningStatus,
    assignCleaning,
    
    // Métodos de consulta
    getRoomsNeedingCleaning,
    getAvailableRooms,
    getCleaningStats,
    
    // Utilidades
    refetch: loadData,
    debugData
  }
}