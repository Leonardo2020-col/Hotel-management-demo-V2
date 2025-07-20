// src/hooks/useRooms.js - CORREGIDO CON RESERVAS
import { useState, useEffect, useMemo } from 'react'
import { db, subscriptions } from '../lib/supabase'
import toast from 'react-hot-toast'

export const useRooms = () => {
  const [rooms, setRooms] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [cleaningStaff, setCleaningStaff] = useState([])
  const [reservations, setReservations] = useState([]) // NUEVO: Estado para reservas
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estados de limpieza y habitaciones
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

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading rooms data with reservations...')
      
      // 1. Cargar habitaciones
      const roomsResult = await db.getRooms()
      if (roomsResult.error) {
        console.error('Error loading rooms:', roomsResult.error)
        throw new Error('Error al cargar habitaciones: ' + roomsResult.error.message)
      }
      
      // 2. Cargar reservas activas (checked_in y confirmed para hoy)
      const reservationsResult = await db.getReservations({
        status: ['checked_in', 'confirmed'],
        limit: 200 // Suficiente para todas las reservas activas
      })
      
      if (reservationsResult.error) {
        console.error('Error loading reservations:', reservationsResult.error)
        // No fallar completamente si no se pueden cargar reservas
        setReservations([])
      } else {
        setReservations(reservationsResult.data || [])
      }
      
      // 3. Combinar habitaciones con información de reservas
      const enrichedRooms = await enrichRoomsWithReservations(
        roomsResult.data || [], 
        reservationsResult.data || []
      )
      
      console.log('Enriched rooms with reservations:', enrichedRooms)
      setRooms(enrichedRooms)
      
      // 4. Generar tipos únicos desde las habitaciones existentes
      const uniqueTypes = await db.getRoomTypes()
      if (uniqueTypes.data) {
        setRoomTypes(uniqueTypes.data)
      } else {
        const types = generateTypesFromRooms(roomsResult.data || [])
        setRoomTypes(types)
      }
      
      // 5. Cargar personal de limpieza
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

  // NUEVA FUNCIÓN: Enriquecer habitaciones con información de reservas
  const enrichRoomsWithReservations = async (roomsData, reservationsData) => {
    return roomsData.map(room => {
      // Buscar reserva activa para esta habitación
      const activeReservation = reservationsData.find(reservation => {
        return reservation.room_id === room.id && reservation.status === 'checked_in'
      })

      // Buscar próxima reserva confirmada
      const nextReservation = reservationsData.find(reservation => {
        return reservation.room_id === room.id && 
               reservation.status === 'confirmed' &&
               new Date(reservation.check_in) >= new Date()
      })

      // Enriquecer la habitación con información de reservas
      const enrichedRoom = {
        ...room,
        // Información del huésped actual
        currentGuest: activeReservation ? {
          id: activeReservation.guest_id,
          name: activeReservation.guest?.full_name || 
                `${activeReservation.guest?.first_name} ${activeReservation.guest?.last_name}`,
          email: activeReservation.guest?.email,
          phone: activeReservation.guest?.phone,
          checkIn: activeReservation.check_in,
          checkOut: activeReservation.check_out,
          confirmationCode: activeReservation.confirmation_code,
          reservationId: activeReservation.id
        } : null,

        // Información de la próxima reserva
        nextReservation: nextReservation ? {
          id: nextReservation.id,
          guest: nextReservation.guest?.full_name || 
                `${nextReservation.guest?.first_name} ${nextReservation.guest?.last_name}`,
          checkIn: nextReservation.check_in,
          checkOut: nextReservation.check_out,
          confirmationCode: nextReservation.confirmation_code
        } : null,

        // Información adicional de la reserva activa
        activeReservation: activeReservation || null
      }

      return enrichedRoom
    })
  }

  // Generar tipos únicos desde habitaciones existentes - CORREGIDO
  const generateTypesFromRooms = (roomsData) => {
    const uniqueTypes = {}
    
    roomsData.forEach((room, index) => {
      // CORREGIDO: Usar room_type en lugar de type
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

  // Calcular estadísticas de habitaciones - MEJORADO
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

    // Calcular ingresos reales basados en reservas activas
    const todayRevenue = rooms.reduce((sum, room) => {
      if (room.currentGuest && room.activeReservation) {
        return sum + (parseFloat(room.activeReservation.rate) || room.base_rate || 100)
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

  // Función para obtener información detallada de una habitación ocupada
  const getRoomReservationInfo = (roomId) => {
    const room = rooms.find(r => r.id === roomId)
    if (!room) {
      return { error: 'Habitación no encontrada' }
    }

    if (room.status !== ROOM_STATUS.OCCUPIED) {
      return { error: 'La habitación no está ocupada' }
    }

    if (!room.currentGuest) {
      return { error: 'No se encontró información de reserva para esta habitación' }
    }

    return {
      room: {
        id: room.id,
        number: room.number,
        floor: room.floor,
        room_type: room.room_type, // CORREGIDO: usar room_type
        status: room.status,
        cleaningStatus: room.cleaning_status
      },
      guest: room.currentGuest,
      reservation: room.activeReservation,
      nextReservation: room.nextReservation
    }
  }

  // Crear nueva habitación - MEJORADO
  const createRoom = async (roomData) => {
    try {
      console.log('Creating room with data:', roomData)
      
      const newRoomData = {
        number: roomData.number,
        floor: parseInt(roomData.floor),
        room_type: roomData.room_type || 'Habitación Estándar', // CORREGIDO: usar room_type
        base_rate: parseFloat(roomData.rate || roomData.base_rate || 100),
        capacity: parseInt(roomData.capacity || 2),
        status: ROOM_STATUS.AVAILABLE,
        cleaning_status: CLEANING_STATUS.CLEAN,
        beds: roomData.beds || [{ type: 'Doble', count: 1 }],
        size: parseInt(roomData.size) || 25,
        features: roomData.features || ['WiFi Gratis'],
        bed_options: roomData.bed_options || ['Doble'],
        branch_id: 1
        // ELIMINADO: description
      }

      const { data, error } = await db.createRoom(newRoomData)
      
      if (error) {
        console.error('Error from createRoom:', error)
        throw error
      }
      
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

  // Función para procesar check-in desde habitaciones
  const processCheckIn = async (roomId, reservationId) => {
    try {
      // Llamar función de Supabase para check-in
      const { data, error } = await db.processCheckIn(reservationId)
      
      if (error) {
        throw new Error(error.message || 'Error en el check-in')
      }

      // Actualizar estado de la habitación
      await updateRoomStatus(roomId, ROOM_STATUS.OCCUPIED, CLEANING_STATUS.DIRTY)
      
      // Recargar datos para actualizar información
      await loadData()
      
      toast.success('Check-in realizado exitosamente')
      return { data, error: null }
      
    } catch (error) {
      console.error('Error in processCheckIn:', error)
      toast.error(error.message || 'Error en el check-in')
      return { data: null, error }
    }
  }

  // Función para procesar check-out desde habitaciones
  const processCheckOut = async (roomId, paymentMethod = 'cash') => {
    try {
      const room = rooms.find(r => r.id === roomId)
      if (!room || !room.activeReservation) {
        throw new Error('No se encontró reserva activa para esta habitación')
      }

      // Llamar función de Supabase para check-out
      const { data, error } = await db.processCheckOut(room.activeReservation.id, paymentMethod)
      
      if (error) {
        throw new Error(error.message || 'Error en el check-out')
      }

      // Actualizar estado de la habitación
      await updateRoomStatus(roomId, ROOM_STATUS.CLEANING, CLEANING_STATUS.DIRTY)
      
      // Recargar datos para actualizar información
      await loadData()
      
      toast.success('Check-out realizado exitosamente')
      return { data, error: null }
      
    } catch (error) {
      console.error('Error in processCheckOut:', error)
      toast.error(error.message || 'Error en el check-out')
      return { data: null, error }
    }
  }

  // Resto de funciones existentes...
  const updateRoom = async (roomId, updateData) => {
    try {
      const { data, error } = await db.updateRoom(roomId, updateData)
      
      if (error) throw error
      
      // Recargar datos para mantener sincronización
      await loadData()
      
      toast.success('Habitación actualizada exitosamente')
      return { data, error: null }
      
    } catch (error) {
      console.error('Error updating room:', error)
      toast.error('Error al actualizar la habitación')
      return { data: null, error }
    }
  }

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

  const updateRoomStatus = async (roomId, newStatus, cleaningStatus = null) => {
    try {
      const { data, error } = await db.updateRoomStatus(roomId, newStatus, cleaningStatus)
      
      if (error) throw error
      
      // Actualizar estado local inmediatamente
      setRooms(prev => 
        prev.map(room => room.id === roomId ? { 
          ...room, 
          status: newStatus,
          ...(cleaningStatus && { cleaning_status: cleaningStatus })
        } : room)
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

  // Funciones auxiliares existentes...
  const updateCleaningStatus = async (roomId, newStatus) => {
    try {
      let roomStatus = null
      if (newStatus === CLEANING_STATUS.CLEAN) {
        roomStatus = ROOM_STATUS.AVAILABLE
      } else if (newStatus === CLEANING_STATUS.IN_PROGRESS) {
        roomStatus = ROOM_STATUS.CLEANING
      }

      const { data, error } = await db.updateRoomStatus(roomId, roomStatus, newStatus)
      
      if (error) throw error
      
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

  const assignCleaning = async (roomIds, staffId) => {
    try {
      const staff = cleaningStaff.find(s => s.id === staffId)
      const staffName = staff ? staff.name : 'Personal asignado'

      const { data, error } = await db.assignCleaning(roomIds, staffName)
      
      if (error) throw error
      
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

  return {
    // Datos
    rooms,
    roomTypes,
    cleaningStaff,
    reservations, // NUEVO: Reservas cargadas
    roomStats,
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
    
    // NUEVOS: Métodos para manejo de reservas desde habitaciones
    getRoomReservationInfo,
    processCheckIn,
    processCheckOut,
    
    // Métodos de consulta existentes
    getRoomsNeedingCleaning: () => rooms.filter(room => 
      room.status === ROOM_STATUS.CLEANING || 
      room.cleaning_status === CLEANING_STATUS.DIRTY ||
      room.cleaning_status === CLEANING_STATUS.IN_PROGRESS
    ),
    getAvailableRooms: () => rooms.filter(room => 
      room.status === ROOM_STATUS.AVAILABLE && 
      room.cleaning_status === CLEANING_STATUS.CLEAN
    ),
    getCleaningStats: () => {
      const needsCleaning = rooms.filter(r => r.cleaning_status === CLEANING_STATUS.DIRTY).length
      const inProgress = rooms.filter(r => r.cleaning_status === CLEANING_STATUS.IN_PROGRESS).length
      const clean = rooms.filter(r => r.cleaning_status === CLEANING_STATUS.CLEAN).length
      const inspected = rooms.filter(r => r.cleaning_status === CLEANING_STATUS.INSPECTED).length

      return { needsCleaning, inProgress, clean, inspected, total: rooms.length }
    },
    
    // Utilidades
    refetch: loadData
  }
}