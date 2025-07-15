// src/hooks/useRooms.js - Actualizado para Supabase
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

  // Mock de personal de limpieza (esto podría venir de la BD)
  const defaultCleaningStaff = [
    { id: 1, name: 'María García', active: true, shift: 'Mañana' },
    { id: 2, name: 'Ana López', active: true, shift: 'Tarde' },
    { id: 3, name: 'Pedro Martín', active: true, shift: 'Mañana' },
    { id: 4, name: 'Carmen Ruiz', active: true, shift: 'Tarde' },
    { id: 5, name: 'José Hernández', active: false, shift: 'Noche' }
  ]

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [])

  // Suscripción en tiempo real
  useEffect(() => {
    const subscription = subscriptions.rooms((payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload
      
      switch (eventType) {
        case 'INSERT':
          setRooms(prev => [...prev, newRecord])
          toast.success('Nueva habitación agregada')
          break
        case 'UPDATE':
          setRooms(prev => 
            prev.map(room => room.id === newRecord.id ? newRecord : room)
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
      subscription.unsubscribe()
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [roomsResult, roomTypesResult] = await Promise.all([
        db.getRooms(),
        db.getRoomTypes()
      ])
      
      if (roomsResult.error) throw roomsResult.error
      if (roomTypesResult.error) throw roomTypesResult.error
      
      setRooms(roomsResult.data || [])
      setRoomTypes(roomTypesResult.data || [])
      setCleaningStaff(defaultCleaningStaff) // Por ahora mock data
      
    } catch (err) {
      setError(err.message)
      toast.error('Error al cargar datos de habitaciones')
    } finally {
      setLoading(false)
    }
  }

  // Calcular estadísticas de habitaciones
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

    // Calcular ingresos estimados basados en tipos de habitación
    const todayRevenue = rooms.reduce((sum, room) => {
      if (room.status === ROOM_STATUS.OCCUPIED && room.room_type?.base_rate) {
        return sum + room.room_type.base_rate
      }
      return sum
    }, 0)
    
    const monthlyRevenue = todayRevenue * 30
    const averageRevenue = monthlyRevenue / 30

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

  // Calcular habitaciones por tipo
  const roomsByType = useMemo(() => {
    if (!rooms || rooms.length === 0 || !roomTypes) return {}

    const typeStats = {}
    
    roomTypes.forEach(type => {
      const typeRooms = rooms.filter(r => r.room_type_id === type.id)
      typeStats[type.name] = {
        total: typeRooms.length,
        available: typeRooms.filter(r => r.status === ROOM_STATUS.AVAILABLE).length,
        occupied: typeRooms.filter(r => r.status === ROOM_STATUS.OCCUPIED).length,
        averageRate: type.base_rate
      }
    })

    return typeStats
  }, [rooms, roomTypes])

  // Crear nueva habitación
  const createRoom = async (roomData) => {
    try {
      // Encontrar el room_type_id basado en el nombre
      const roomType = roomTypes.find(rt => rt.name === roomData.type)
      if (!roomType) {
        throw new Error('Tipo de habitación no encontrado')
      }

      const newRoomData = {
        number: roomData.number,
        floor: parseInt(roomData.floor),
        room_type_id: roomType.id,
        status: ROOM_STATUS.AVAILABLE,
        cleaning_status: CLEANING_STATUS.CLEAN,
        beds: roomData.beds || [{ type: 'Doble', count: 1 }],
        size: parseInt(roomData.size),
        features: roomData.features || roomType.features,
        description: roomData.description || `Habitación ${roomType.name}`,
        last_cleaned: new Date().toISOString(),
        cleaned_by: 'Sistema',
        maintenance_notes: ''
      }

      const { data, error } = await db.createRoom(newRoomData)
      
      if (error) throw error
      
      toast.success('Habitación creada exitosamente')
      return { data, error: null }
      
    } catch (error) {
      toast.error('Error al crear la habitación')
      return { data: null, error }
    }
  }

  // Actualizar habitación
  const updateRoom = async (roomId, updateData) => {
    try {
      const { data, error } = await db.updateRoom(roomId, updateData)
      
      if (error) throw error
      
      toast.success('Habitación actualizada exitosamente')
      return { data, error: null }
      
    } catch (error) {
      toast.error('Error al actualizar la habitación')
      return { data: null, error }
    }
  }

  // Eliminar habitación
  const deleteRoom = async (roomId) => {
    try {
      const { data, error } = await db.deleteRoom(roomId)
      
      if (error) throw error
      
      toast.success('Habitación eliminada exitosamente')
      return { data, error: null }
      
    } catch (error) {
      toast.error('Error al eliminar la habitación')
      return { data: null, error }
    }
  }

  // Actualizar estado de habitación
  const updateRoomStatus = async (roomId, newStatus) => {
    try {
      const { data, error } = await db.updateRoomStatus(roomId, newStatus)
      
      if (error) throw error
      
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
      toast.error('Error al actualizar el estado')
      return { data: null, error }
    }
  }

  // Actualizar estado de limpieza
  const updateCleaningStatus = async (roomId, newStatus) => {
    try {
      const { data, error } = await db.updateRoomStatus(roomId, null, newStatus)
      
      if (error) throw error
      
      const cleaningMessages = {
        [CLEANING_STATUS.CLEAN]: 'Habitación limpia',
        [CLEANING_STATUS.DIRTY]: 'Habitación sucia',
        [CLEANING_STATUS.IN_PROGRESS]: 'Limpieza en progreso',
        [CLEANING_STATUS.INSPECTED]: 'Habitación inspeccionada'
      }
      
      toast.success(cleaningMessages[newStatus] || 'Estado de limpieza actualizado')
      return { data, error: null }
      
    } catch (error) {
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
      
      toast.success(`Limpieza asignada a ${staffName}`)
      return { data, error: null }
      
    } catch (error) {
      toast.error('Error al asignar la limpieza')
      return { data: null, error }
    }
  }

  // Obtener habitaciones que necesitan limpieza
  const getRoomsNeedingCleaning = () => {
    return rooms.filter(room => 
      room.status === ROOM_STATUS.CLEANING || 
      room.cleaning_status === CLEANING_STATUS.DIRTY
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

  return {
    // Datos
    rooms,
    roomTypes,
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
    refetch: loadData
  }
}