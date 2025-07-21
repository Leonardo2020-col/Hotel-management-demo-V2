// src/hooks/useRooms.js - SIN ROOM_TYPES
import { useState, useEffect, useMemo } from 'react'
import { db, subscriptions } from '../lib/supabase'
import toast from 'react-hot-toast'

export const useRooms = () => {
  const [rooms, setRooms] = useState([])
  const [cleaningStaff, setCleaningStaff] = useState([])
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ESTADOS SIMPLIFICADOS - SOLO 3 ESTADOS
  const ROOM_STATUS = {
    AVAILABLE: 'available',      // Limpio y disponible
    OCCUPIED: 'occupied',        // Ocupado con huésped
    NEEDS_CLEANING: 'needs_cleaning'  // Necesita limpieza
  }

  // Mapeo de estados legacy a nuevos estados
  const mapLegacyStatus = (status, cleaningStatus) => {
    if (status === 'occupied') return ROOM_STATUS.OCCUPIED
    if (status === 'cleaning' || cleaningStatus === 'dirty') return ROOM_STATUS.NEEDS_CLEANING
    return ROOM_STATUS.AVAILABLE
  }

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading rooms data with simplified states...')
      
      // 1. Cargar habitaciones
      const roomsResult = await db.getRooms()
      if (roomsResult.error) {
        console.error('Error loading rooms:', roomsResult.error)
        throw new Error('Error al cargar habitaciones: ' + roomsResult.error.message)
      }
      
      // 2. Cargar reservas activas
      const reservationsResult = await db.getReservations({
        status: ['checked_in', 'confirmed'],
        limit: 200
      })
      
      if (reservationsResult.error) {
        console.error('Error loading reservations:', reservationsResult.error)
        setReservations([])
      } else {
        setReservations(reservationsResult.data || [])
      }
      
      // 3. Mapear habitaciones con estados simplificados
      const simplifiedRooms = await mapRoomsToSimplifiedStates(
        roomsResult.data || [], 
        reservationsResult.data || []
      )
      
      console.log('Rooms with simplified states:', simplifiedRooms)
      setRooms(simplifiedRooms)
      
      // 4. Cargar personal de limpieza
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

  // Mapear habitaciones a estados simplificados
  const mapRoomsToSimplifiedStates = async (roomsData, reservationsData) => {
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

      // DETERMINAR ESTADO SIMPLIFICADO
      let simplifiedStatus = ROOM_STATUS.AVAILABLE
      
      if (activeReservation) {
        simplifiedStatus = ROOM_STATUS.OCCUPIED
      } else if (room.status === 'cleaning' || room.cleaning_status === 'dirty') {
        simplifiedStatus = ROOM_STATUS.NEEDS_CLEANING
      }

      // Enriquecer la habitación
      const enrichedRoom = {
        ...room,
        // ESTADO PRINCIPAL SIMPLIFICADO
        status: simplifiedStatus,
        
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
        activeReservation: activeReservation || null,
        
        // Estados legacy para compatibilidad (opcional)
        original_status: room.status,
        cleaning_status: room.cleaning_status || 'clean'
      }

      return enrichedRoom
    })
  }

  // Calcular estadísticas simplificadas
  const roomStats = useMemo(() => {
    if (!rooms || rooms.length === 0) {
      return {
        total: 0,
        available: 0,
        occupied: 0,
        needsCleaning: 0,
        occupancyRate: 0,
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
    const needsCleaning = rooms.filter(r => r.status === ROOM_STATUS.NEEDS_CLEANING).length
    
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0

    // Calcular ingresos basados en reservas activas
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
      needsCleaning,
      occupancyRate,
      revenue: {
        today: todayRevenue,
        thisMonth: monthlyRevenue,
        average: averageRevenue
      }
    }
  }, [rooms])

  // FUNCIÓN PRINCIPAL: Click para limpiar habitación
  const handleRoomCleanClick = async (roomId) => {
    try {
      const room = rooms.find(r => r.id === roomId)
      if (!room) {
        toast.error('Habitación no encontrada')
        return { data: null, error: 'Room not found' }
      }

      console.log(`🧹 Cleaning room ${room.number} (ID: ${roomId})`)

      // Solo permitir limpiar habitaciones que necesitan limpieza
      if (room.status !== ROOM_STATUS.NEEDS_CLEANING) {
        toast.warning('Esta habitación no necesita limpieza')
        return { data: null, error: 'Room does not need cleaning' }
      }

      // Actualizar en base de datos: marcar como disponible y limpio
      const { data, error } = await db.updateRoomStatus(roomId, 'available', 'clean')
      
      if (error) {
        console.error('Error updating room status:', error)
        throw error
      }

      // Actualizar estado local inmediatamente
      setRooms(prev => 
        prev.map(r => r.id === roomId ? { 
          ...r, 
          status: ROOM_STATUS.AVAILABLE,
          original_status: 'available',
          cleaning_status: 'clean',
          last_cleaned: new Date().toISOString(),
          cleaned_by: 'Reception Staff'
        } : r)
      )
      
      toast.success(`✅ Habitación ${room.number} limpiada y disponible`)
      return { data: true, error: null }
      
    } catch (error) {
      console.error('Error in handleRoomCleanClick:', error)
      toast.error('Error al limpiar la habitación')
      return { data: null, error }
    }
  }

  // Crear nueva habitación
  const createRoom = async (roomData) => {
    try {
      console.log('Creating room with data:', roomData)
      
      const newRoomData = {
        number: roomData.number,
        floor: parseInt(roomData.floor),
        room_type: roomData.room_type || 'Habitación Estándar',
        base_rate: parseFloat(roomData.rate || roomData.base_rate || 100),
        capacity: parseInt(roomData.capacity || 2),
        status: 'available', // Estado en BD
        cleaning_status: 'clean', // Estado en BD
        beds: roomData.beds || [{ type: 'Doble', count: 1 }],
        size: parseInt(roomData.size) || 25,
        features: roomData.features || ['WiFi Gratis'],
        bed_options: roomData.bed_options || ['Doble'],
        branch_id: 1
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

  // Actualizar estado de habitación (simplificado)
  const updateRoomStatus = async (roomId, newSimplifiedStatus) => {
    try {
      let dbStatus, dbCleaningStatus
      
      // Mapear estado simplificado a estados de BD
      switch (newSimplifiedStatus) {
        case ROOM_STATUS.AVAILABLE:
          dbStatus = 'available'
          dbCleaningStatus = 'clean'
          break
        case ROOM_STATUS.OCCUPIED:
          dbStatus = 'occupied'
          dbCleaningStatus = 'dirty'
          break
        case ROOM_STATUS.NEEDS_CLEANING:
          dbStatus = 'cleaning'
          dbCleaningStatus = 'dirty'
          break
        default:
          dbStatus = 'available'
          dbCleaningStatus = 'clean'
      }

      const { data, error } = await db.updateRoomStatus(roomId, dbStatus, dbCleaningStatus)
      
      if (error) throw error
      
      // Actualizar estado local
      setRooms(prev => 
        prev.map(room => room.id === roomId ? { 
          ...room, 
          status: newSimplifiedStatus,
          original_status: dbStatus,
          cleaning_status: dbCleaningStatus
        } : room)
      )
      
      const statusMessages = {
        [ROOM_STATUS.AVAILABLE]: 'Habitación disponible',
        [ROOM_STATUS.OCCUPIED]: 'Habitación ocupada', 
        [ROOM_STATUS.NEEDS_CLEANING]: 'Habitación necesita limpieza'
      }
      
      toast.success(statusMessages[newSimplifiedStatus] || 'Estado actualizado')
      return { data, error: null }
      
    } catch (error) {
      console.error('Error updating room status:', error)
      toast.error('Error al actualizar el estado')
      return { data: null, error }
    }
  }

  // Procesar check-out (marca como necesita limpieza)
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

      // Actualizar estado: de ocupado a necesita limpieza
      await updateRoomStatus(roomId, ROOM_STATUS.NEEDS_CLEANING)
      
      // Recargar datos para actualizar información
      await loadData()
      
      toast.success('Check-out realizado. Habitación marcada para limpieza.')
      return { data, error: null }
      
    } catch (error) {
      console.error('Error in processCheckOut:', error)
      toast.error(error.message || 'Error en el check-out')
      return { data: null, error }
    }
  }

  // Procesar check-in
  const processCheckIn = async (roomId, reservationId) => {
    try {
      // Llamar función de Supabase para check-in
      const { data, error } = await db.processCheckIn(reservationId)
      
      if (error) {
        throw new Error(error.message || 'Error en el check-in')
      }

      // Actualizar estado: de disponible a ocupado
      await updateRoomStatus(roomId, ROOM_STATUS.OCCUPIED)
      
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

  // Resto de funciones simplificadas...
  const updateRoom = async (roomId, updateData) => {
    try {
      const { data, error } = await db.updateRoom(roomId, updateData)
      
      if (error) throw error
      
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
      
      setRooms(prev => prev.filter(room => room.id !== roomId))
      
      toast.success('Habitación eliminada exitosamente')
      return { data, error: null }
      
    } catch (error) {
      console.error('Error deleting room:', error)
      toast.error('Error al eliminar la habitación')
      return { data: null, error }
    }
  }

  // Generar roomTypes dinámicamente desde las habitaciones existentes
  const roomTypes = useMemo(() => {
    if (!rooms || rooms.length === 0) return []
    
    const typesMap = new Map()
    
    rooms.forEach(room => {
      const type = room.room_type
      if (type && !typesMap.has(type)) {
        // Calcular estadísticas para este tipo
        const roomsOfType = rooms.filter(r => r.room_type === type)
        const available = roomsOfType.filter(r => r.status === ROOM_STATUS.AVAILABLE).length
        const occupied = roomsOfType.filter(r => r.status === ROOM_STATUS.OCCUPIED).length
        const averageRate = roomsOfType.reduce((sum, r) => sum + (r.base_rate || 0), 0) / roomsOfType.length
        
        typesMap.set(type, {
          id: type.toLowerCase().replace(/\s+/g, '_'),
          name: type,
          description: `Tipo de habitación ${type}`,
          baseRate: averageRate,
          capacity: room.capacity || 2,
          size: room.size || 25,
          totalRooms: roomsOfType.length,
          availableRooms: available,
          occupiedRooms: occupied,
          active: true,
          features: room.features || [],
          bedOptions: room.bed_options || []
        })
      }
    })
    
    return Array.from(typesMap.values())
  }, [rooms])

  return {
    // Datos
    rooms,
    roomTypes, // GENERADO DINÁMICAMENTE
    cleaningStaff,
    reservations,
    roomStats,
    loading,
    error,
    
    // Estados simplificados
    ROOM_STATUS,
    
    // Métodos principales
    createRoom,
    updateRoom,
    deleteRoom,
    updateRoomStatus,
    
    // FUNCIÓN PRINCIPAL: Limpiar con click
    handleRoomCleanClick,
    
    // Métodos para manejo de reservas
    processCheckIn,
    processCheckOut,
    
    // Métodos de consulta simplificados
    getRoomsNeedingCleaning: () => rooms.filter(room => 
      room.status === ROOM_STATUS.NEEDS_CLEANING
    ),
    getAvailableRooms: () => rooms.filter(room => 
      room.status === ROOM_STATUS.AVAILABLE
    ),
    getOccupiedRooms: () => rooms.filter(room => 
      room.status === ROOM_STATUS.OCCUPIED
    ),
    
    // Utilidades
    refetch: loadData
  }
}