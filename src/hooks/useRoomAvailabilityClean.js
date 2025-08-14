// src/hooks/useRoomAvailabilityClean.js
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { db } from '../lib/supabase';

export const useRoomAvailabilityClean = () => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar disponibilidad sin usar branch_id directamente
  const loadAvailability = async (startDate = null, endDate = null, branchId = null) => {
    try {
      setLoading(true);
      setError(null);

      const start = startDate || new Date().toISOString().split('T')[0];
      const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      console.log('Loading availability (estructura limpia):', { start, end, branchId });

      // Usar filtro por branchId que internamente hace JOIN
      const filters = { startDate: start, endDate: end };
      if (branchId) {
        filters.branchId = branchId;
      }

      const { data, error } = await db.getRoomAvailability(filters);

      if (error) {
        throw error;
      }

      setAvailability(data || []);
      
    } catch (err) {
      console.error('Error loading availability:', err);
      setError(err.message);
      toast.error('Error al cargar disponibilidad');
    } finally {
      setLoading(false);
    }
  };

  // Crear disponibilidad sin branch_id
  const createAvailability = async (roomId, startDate, endDate, availabilityData) => {
    try {
      // No pasar branch_id ya que no existe en la tabla
      const cleanData = { ...availabilityData };
      delete cleanData.branch_id; // Eliminar si viene en los datos
      
      const { data, error } = await db.bulkCreateRoomAvailability(
        roomId, 
        startDate, 
        endDate, 
        cleanData
      );
      
      if (error) {
        throw error;
      }

      toast.success('Disponibilidad actualizada');
      await loadAvailability();
      
      return { data, error: null };

    } catch (error) {
      console.error('Error creating availability:', error);
      toast.error('Error al crear disponibilidad');
      return { data: null, error };
    }
  };

  // Actualizar disponibilidad
  const updateAvailability = async (availabilityId, updates) => {
    try {
      const { data, error } = await db.updateRoomAvailability(availabilityId, updates);
      
      if (error) {
        throw error;
      }

      toast.success('Disponibilidad actualizada');
      await loadAvailability();
      
      return { data, error: null };

    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Error al actualizar disponibilidad');
      return { data: null, error };
    }
  };

  // Bloquear habitación
  const blockRoom = async (roomId, startDate, endDate, reason = 'Bloqueado') => {
    try {
      const { data, error } = await db.bulkCreateRoomAvailability(roomId, startDate, endDate, {
        is_available: false,
        notes: reason
      });
      
      if (error) {
        throw error;
      }

      toast.success(`Habitación bloqueada desde ${startDate} hasta ${endDate}`);
      await loadAvailability();
      
      return { data, error: null };

    } catch (error) {
      console.error('Error blocking room:', error);
      toast.error('Error al bloquear habitación');
      return { data: null, error };
    }
  };

  // Desbloquear habitación
  const unblockRoom = async (roomId, startDate, endDate) => {
    try {
      const { data, error } = await db.bulkCreateRoomAvailability(roomId, startDate, endDate, {
        is_available: true,
        notes: null
      });
      
      if (error) {
        throw error;
      }

      toast.success(`Habitación desbloqueada desde ${startDate} hasta ${endDate}`);
      await loadAvailability();
      
      return { data, error: null };

    } catch (error) {
      console.error('Error unblocking room:', error);
      toast.error('Error al desbloquear habitación');
      return { data: null, error };
    }
  };

  // Actualizar tarifas
  const updateRates = async (roomId, startDate, endDate, newRate) => {
    try {
      const { data, error } = await db.bulkCreateRoomAvailability(roomId, startDate, endDate, {
        rate: parseFloat(newRate)
      });
      
      if (error) {
        throw error;
      }

      toast.success(`Tarifas actualizadas a S/ ${newRate}`);
      await loadAvailability();
      
      return { data, error: null };

    } catch (error) {
      console.error('Error updating rates:', error);
      toast.error('Error al actualizar tarifas');
      return { data: null, error };
    }
  };

  // Verificar disponibilidad de habitación
  const isRoomAvailable = (roomId, date) => {
    const dayAvailability = availability.find(item => 
      item.room_id === roomId && item.date === date
    );
    
    return dayAvailability?.is_available ?? true;
  };

  // Obtener disponibilidad de habitación
  const getRoomAvailabilityForRoom = (roomId, date = null) => {
    if (date) {
      return availability.find(item => 
        item.room_id === roomId && item.date === date
      );
    }
    
    return availability.filter(item => item.room_id === roomId);
  };

  // Estadísticas de disponibilidad
  const availabilityStats = useMemo(() => {
    if (!availability || availability.length === 0) {
      return {
        totalDays: 0,
        availableDays: 0,
        blockedDays: 0,
        occupancyRate: 0
      };
    }

    const totalDays = availability.length;
    const availableDays = availability.filter(item => item.is_available).length;
    const blockedDays = totalDays - availableDays;
    const occupancyRate = totalDays > 0 ? Math.round(((totalDays - availableDays) / totalDays) * 100) : 0;

    return {
      totalDays,
      availableDays,
      blockedDays,
      occupancyRate
    };
  }, [availability]);

  // Cargar datos al montar
  useEffect(() => {
    loadAvailability();
  }, []);

  return {
    // Datos
    availability,
    loading,
    error,
    availabilityStats,
    
    // Métodos principales
    loadAvailability,
    createAvailability,
    updateAvailability,
    blockRoom,
    unblockRoom,
    updateRates,
    
    // Consultas
    getRoomAvailability: getRoomAvailabilityForRoom,
    isRoomAvailable,
    
    // Utilidades
    refetch: loadAvailability
  };
};

// Hook combinado con useRooms (opcional)
export const useRoomsWithAvailability = () => {
  const roomsData = useRooms();
  const availabilityData = useRoomAvailabilityClean();

  // Combinar habitaciones con su disponibilidad
  const roomsWithAvailability = useMemo(() => {
    if (!roomsData.rooms || !availabilityData.availability) {
      return roomsData.rooms || [];
    }

    return roomsData.rooms.map(room => {
      const today = new Date().toISOString().split('T')[0];
      const todayAvailability = availabilityData.availability.find(
        item => item.room_id === room.id && item.date === today
      );

      return {
        ...room,
        todayAvailability,
        isAvailableToday: todayAvailability?.is_available ?? true,
        todayRate: todayAvailability?.rate || room.base_rate,
        availabilityNotes: todayAvailability?.notes,
        hasAvailabilityConflicts: !todayAvailability?.is_available && room.status === 'available'
      };
    });
  }, [roomsData.rooms, availabilityData.availability]);

  return {
    // Datos del hook original
    ...roomsData,
    
    // Datos de disponibilidad
    ...availabilityData,
    
    // Datos combinados
    rooms: roomsWithAvailability,
    
    // Loading combinado
    loading: roomsData.loading || availabilityData.loading,
    error: roomsData.error || availabilityData.error
  };
};