// src/hooks/useCheckInData.js - Actualizado para Supabase
import { useState, useEffect } from 'react'
import { db } from '../lib/supabase'
import toast from 'react-hot-toast'

export const useCheckInData = () => {
  const [roomsByFloor, setRoomsByFloor] = useState({})
  const [savedOrders, setSavedOrders] = useState({})
  const [snackItems, setSnackItems] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Tipos de snacks (estos podrían venir de la BD en el futuro)
  const snackTypes = [
    { id: 'frutas', name: 'FRUTAS', description: 'Frutas frescas y naturales' },
    { id: 'bebidas', name: 'BEBIDAS', description: 'Bebidas frías y calientes' },
    { id: 'snacks', name: 'SNACKS', description: 'Bocadillos y aperitivos' },
    { id: 'postres', name: 'POSTRES', description: 'Dulces y postres' }
  ]

  // Precios de habitaciones por piso (esto vendrá de room_types en la BD)
  const roomPrices = {
    1: 80.00,
    2: 95.00,
    3: 110.00
  }

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Cargar habitaciones agrupadas por piso
      const { data: roomsData, error: roomsError } = await db.getRoomsByFloor()
      if (roomsError) throw roomsError
      
      // Cargar snacks (mock data por ahora)
      const { data: snacksData, error: snacksError } = await db.getSnackItems()
      if (snacksError) throw snacksError
      
      // Cargar órdenes guardadas (reservas activas con check-in)
      const { data: ordersData, error: ordersError } = await loadSavedOrders()
      if (ordersError) throw ordersError
      
      setRoomsByFloor(roomsData || {})
      setSnackItems(snacksData || {})
      setSavedOrders(ordersData || {})
      
    } catch (err) {
      setError(err.message)
      toast.error('Error al cargar datos del check-in')
    } finally {
      setLoading(false)
    }
  }

  // Cargar órdenes guardadas desde reservas activas
  const loadSavedOrders = async () => {
    try {
      const { data: reservations, error } = await db.getReservations({
        status: 'checked_in'
      })
      
      if (error) throw error
      
      // Convertir reservas a formato de órdenes guardadas
      const orders = {}
      
      reservations?.forEach(reservation => {
        if (reservation.room && reservation.guest) {
          orders[reservation.room.number] = {
            id: reservation.id,
            room: {
              number: reservation.room.number,
              status: 'occupied'
            },
            roomPrice: reservation.rate,
            snacks: [], // Por ahora vacío, se puede expandir
            total: reservation.total_amount,
            checkInDate: reservation.check_in,
            guestName: reservation.guest.full_name || `${reservation.guest.first_name} ${reservation.guest.last_name}`,
            guestId: reservation.guest_id,
            reservationId: reservation.id
          }
        }
      })
      
      return { data: orders, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Procesar check-in de habitación
  const processCheckIn = async (roomData, snacks = []) => {
    try {
      const room = roomData.room || roomData
      const floor = Math.floor(room.number / 100)
      const roomPrice = roomPrices[floor]
      const snacksTotal = snacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0)
      const totalAmount = roomPrice + snacksTotal

      // Actualizar estado de la habitación a ocupada
      const { error: roomError } = await db.updateRoomStatus(
        room.id || room.room_id, 
        'occupied', 
        'dirty'
      )
      
      if (roomError) throw roomError

      // Crear reserva automática o actualizar existente
      const reservationData = {
        room_id: room.id || room.room_id,
        check_in: new Date().toISOString().split('T')[0],
        check_out: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +1 día
        adults: 1,
        children: 0,
        status: 'checked_in',
        total_amount: totalAmount,
        rate: roomPrice,
        special_requests: snacks.length > 0 ? `Snacks: ${snacks.map(s => `${s.name} x${s.quantity}`).join(', ')}` : '',
        payment_status: 'paid'
      }

      // Si no hay guest_id, necesitaremos crear un huésped temporal o usar uno existente
      // Por ahora, usar un huésped por defecto
      const { data: defaultGuest } = await db.getGuests({ limit: 1 })
      if (defaultGuest && defaultGuest.length > 0) {
        reservationData.guest_id = defaultGuest[0].id
      }

      const { data: reservation, error: reservationError } = await db.createReservation(reservationData)
      
      if (reservationError) throw reservationError

      // Actualizar órdenes guardadas localmente
      const newOrder = {
        id: reservation.id,
        room: { number: room.number, status: 'occupied' },
        roomPrice,
        snacks,
        total: totalAmount,
        checkInDate: reservationData.check_in,
        guestName: defaultGuest?.[0]?.full_name || 'Huésped',
        guestId: reservationData.guest_id,
        reservationId: reservation.id
      }

      setSavedOrders(prev => ({
        ...prev,
        [room.number]: newOrder
      }))

      toast.success(`Check-in completado para habitación ${room.number}`)
      return { data: newOrder, error: null }

    } catch (error) {
      toast.error('Error al procesar check-in')
      return { data: null, error }
    }
  }

  // Procesar check-out
  const processCheckOut = async (roomNumber, paymentMethod) => {
    try {
      const order = savedOrders[roomNumber]
      if (!order) throw new Error('Orden no encontrada')

      // Actualizar reserva a checked_out
      const { error: reservationError } = await db.updateReservation(order.reservationId, {
        status: 'checked_out',
        payment_status: 'paid'
      })

      if (reservationError) throw reservationError

      // Actualizar habitación a limpieza
      const { error: roomError } = await db.updateRoomStatus(
        order.room.id,
        'cleaning',
        'dirty'
      )

      if (roomError) throw roomError

      // Remover de órdenes guardadas
      setSavedOrders(prev => {
        const newOrders = { ...prev }
        delete newOrders[roomNumber]
        return newOrders
      })

      toast.success(`Check-out completado para habitación ${roomNumber}`)
      return { data: true, error: null }

    } catch (error) {
      toast.error('Error al procesar check-out')
      return { data: null, error }
    }
  }

  // Obtener habitaciones disponibles para check-in
  const getAvailableRooms = () => {
    const available = {}
    
    Object.keys(roomsByFloor).forEach(floor => {
      available[floor] = roomsByFloor[floor].filter(room => 
        room.status === 'available' && room.cleaning_status === 'clean'
      )
    })
    
    return available
  }

  // Obtener habitaciones ocupadas para check-out
  const getOccupiedRooms = () => {
    const occupied = {}
    
    Object.keys(roomsByFloor).forEach(floor => {
      occupied[floor] = roomsByFloor[floor].filter(room => 
        room.status === 'occupied'
      )
    })
    
    return occupied
  }

  // Actualizar datos en tiempo real
  const refreshData = () => {
    loadInitialData()
  }

  return {
    // Estado
    roomsByFloor,
    snackTypes,
    snackItems,
    roomPrices,
    savedOrders,
    loading,
    error,
    
    // Acciones
    processCheckIn,
    processCheckOut,
    refreshData,
    
    // Utilidades
    getAvailableRooms,
    getOccupiedRooms,
    
    // Para compatibilidad con componente existente
    floorRooms: roomsByFloor,
    setSavedOrders
  }
}