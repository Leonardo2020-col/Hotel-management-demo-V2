import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/supabase';
import toast from 'react-hot-toast';

export const useGuests = () => {
  const [guests, setGuests] = useState([]);
  const [guestsStats, setGuestsStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar huéspedes desde Supabase
  const loadGuests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await db.getGuests();

      if (error) {
        console.error('Error loading guests:', error);
        setError('Error al cargar los huéspedes');
        return;
      }

      // Transformar datos para compatibilidad con el frontend
      const transformedGuests = data.map(guest => ({
        id: guest.id,
        fullName: guest.full_name,
        full_name: guest.full_name, // Compatibilidad
        email: guest.email,
        phone: guest.phone,
        documentType: guest.document_type,
        document_type: guest.document_type, // Compatibilidad
        documentNumber: guest.document_number,
        document_number: guest.document_number, // Compatibilidad
        status: guest.status,
        totalVisits: guest.total_visits || 0,
        total_visits: guest.total_visits || 0, // Compatibilidad
        totalSpent: parseFloat(guest.total_spent || 0),
        total_spent: parseFloat(guest.total_spent || 0), // Compatibilidad
        lastVisit: guest.last_visit,
        last_visit: guest.last_visit, // Compatibilidad
        createdAt: guest.created_at,
        created_at: guest.created_at, // Compatibilidad
        updatedAt: guest.updated_at,
        updated_at: guest.updated_at // Compatibilidad
      }));

      setGuests(transformedGuests);
      calculateStats(transformedGuests);
      
    } catch (error) {
      console.error('Error in loadGuests:', error);
      setError('Error al cargar los huéspedes');
    } finally {
      setLoading(false);
    }
  }, []);

  // Calcular estadísticas
  const calculateStats = useCallback((guestsData) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const stats = {
      total: guestsData.length,
      active: guestsData.filter(g => g.status === 'active').length,
      inactive: guestsData.filter(g => g.status === 'inactive').length,
      newThisMonth: guestsData.filter(g => {
        const createdDate = new Date(g.createdAt);
        return createdDate.getMonth() === currentMonth && 
               createdDate.getFullYear() === currentYear;
      }).length,
      totalRevenue: guestsData.reduce((sum, g) => sum + (g.totalSpent || 0), 0),
      averageSpent: guestsData.length > 0 
        ? guestsData.reduce((sum, g) => sum + (g.totalSpent || 0), 0) / guestsData.length 
        : 0,
      frequent: guestsData.filter(g => (g.totalVisits || 0) >= 3).length,
      withEmail: guestsData.filter(g => g.email).length,
      withPhone: guestsData.filter(g => g.phone).length,
      // Distribución por tipo de documento
      documentTypes: guestsData.reduce((acc, guest) => {
        const docType = guest.documentType || 'Sin especificar';
        acc[docType] = (acc[docType] || 0) + 1;
        return acc;
      }, {}),
      // Huéspedes recientes
      recentGuests: guestsData
        .filter(g => {
          const daysDiff = Math.floor((new Date() - new Date(g.createdAt)) / (1000 * 60 * 60 * 24));
          return daysDiff <= 30;
        })
        .length
    };

    setGuestsStats(stats);
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  // Crear nuevo huésped
  const createGuest = useCallback(async (guestData) => {
    try {
      const { data, error } = await db.createGuest(guestData);

      if (error) {
        toast.error('Error al crear el huésped: ' + error.message);
        throw error;
      }

      toast.success('Huésped creado exitosamente');
      
      // Recargar lista
      await loadGuests();
      
      return data;
    } catch (error) {
      console.error('Error creating guest:', error);
      throw error;
    }
  }, [loadGuests]);

  // Actualizar huésped
  const updateGuest = useCallback(async (guestId, updateData) => {
    try {
      const { data, error } = await db.updateGuest(guestId, updateData);

      if (error) {
        toast.error('Error al actualizar el huésped: ' + error.message);
        throw error;
      }

      toast.success('Huésped actualizado exitosamente');
      
      // Actualizar estado local
      setGuests(prev => prev.map(guest => 
        guest.id === guestId ? { ...guest, ...updateData } : guest
      ));
      
      return data;
    } catch (error) {
      console.error('Error updating guest:', error);
      throw error;
    }
  }, []);

  // Eliminar huésped
  const deleteGuest = useCallback(async (guestId) => {
    try {
      const { data, error } = await db.deleteGuest(guestId);

      if (error) {
        toast.error('Error al eliminar el huésped: ' + error.message);
        throw error;
      }

      toast.success('Huésped eliminado exitosamente');
      
      // Remover del estado local
      setGuests(prev => prev.filter(guest => guest.id !== guestId));
      
      return data;
    } catch (error) {
      console.error('Error deleting guest:', error);
      toast.error('Error al eliminar el huésped');
      throw error;
    }
  }, []);

  // Buscar huéspedes
  const searchGuests = useCallback(async (searchTerm) => {
    try {
      if (!searchTerm || searchTerm.length < 2) {
        return guests; // Devolver todos los huéspedes si no hay término de búsqueda
      }

      const { data, error } = await db.searchGuests(searchTerm);

      if (error) {
        console.error('Error searching guests:', error);
        return guests;
      }

      // Transformar datos
      const transformedResults = data.map(guest => ({
        id: guest.id,
        fullName: guest.full_name,
        full_name: guest.full_name,
        email: guest.email,
        phone: guest.phone,
        documentType: guest.document_type,
        document_type: guest.document_type,
        documentNumber: guest.document_number,
        document_number: guest.document_number,
        status: guest.status,
        totalVisits: guest.total_visits || 0,
        total_visits: guest.total_visits || 0,
        totalSpent: parseFloat(guest.total_spent || 0),
        total_spent: parseFloat(guest.total_spent || 0),
        lastVisit: guest.last_visit,
        last_visit: guest.last_visit,
        createdAt: guest.created_at,
        created_at: guest.created_at
      }));

      return transformedResults;
    } catch (error) {
      console.error('Error in searchGuests:', error);
      return guests;
    }
  }, [guests]);

  // Obtener huésped por ID
  const getGuestById = useCallback((guestId) => {
    return guests.find(guest => guest.id === parseInt(guestId));
  }, [guests]);

  // Filtrar huéspedes localmente
  const filterGuests = useCallback((filters) => {
    let filtered = [...guests];

    // Filtro por estado
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(guest => guest.status === filters.status);
    }

    // Filtro por búsqueda
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(guest => 
        guest.fullName?.toLowerCase().includes(searchTerm) ||
        guest.email?.toLowerCase().includes(searchTerm) ||
        guest.phone?.includes(searchTerm) ||
        guest.documentNumber?.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por tipo de documento
    if (filters.documentType && filters.documentType !== 'all') {
      filtered = filtered.filter(guest => guest.documentType === filters.documentType);
    }

    return filtered;
  }, [guests]);

  // Obtener huéspedes activos
  const getActiveGuests = useCallback(() => {
    return guests.filter(guest => guest.status === 'active');
  }, [guests]);

  // Obtener huéspedes frecuentes
  const getFrequentGuests = useCallback(() => {
    return guests.filter(guest => (guest.totalVisits || 0) >= 3)
      .sort((a, b) => (b.totalVisits || 0) - (a.totalVisits || 0));
  }, [guests]);

  // Obtener huéspedes recientes
  const getRecentGuests = useCallback(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return guests.filter(guest => new Date(guest.createdAt) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [guests]);

  return {
    // Datos
    guests,
    guestsStats,
    loading,
    error,
    
    // Métodos CRUD
    createGuest,
    updateGuest,
    deleteGuest,
    
    // Métodos de consulta
    searchGuests,
    getGuestById,
    filterGuests,
    getActiveGuests,
    getFrequentGuests,
    getRecentGuests,
    
    // Utilidades
    refresh: loadGuests,
    calculateStats: () => calculateStats(guests)
  };
};