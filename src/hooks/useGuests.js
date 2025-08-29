import { useState, useEffect } from 'react';
import { guestService } from '../lib/supabase';

export const useGuests = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar huéspedes
  const fetchGuests = async (searchTerm = '') => {
    try {
      setLoading(true);
      setError(null);

      let result;
      
      if (searchTerm.trim()) {
        // Usar searchGuests para búsquedas específicas
        result = await guestService.searchGuests(searchTerm, 50);
      } else {
        // Usar getAllGuests para listado completo
        result = await guestService.getAllGuests({ 
          limit: 50, 
          orderBy: 'created_at', 
          order: 'desc' 
        });
      }
      
      if (result.error) {
        throw result.error;
      }

      setGuests(result.data || []);
    } catch (err) {
      console.error('Error fetching guests:', err);
      setError(err.message || 'Error al cargar huéspedes');
    } finally {
      setLoading(false);
    }
  };

  // Crear huésped
  const createGuest = async (guestData) => {
    try {
      setError(null);
      
      // Adaptar datos al formato que espera tu servicio
      const adaptedData = {
        fullName: guestData.full_name || guestData.fullName,
        phone: guestData.phone,
        documentType: guestData.document_type || guestData.documentType,
        documentNumber: guestData.document_number || guestData.documentNumber
      };
      
      const result = await guestService.createGuest(adaptedData);
      
      if (result.error) {
        throw result.error;
      }

      // Actualizar lista local
      setGuests(prev => [result.data, ...prev]);
      return result.data;
    } catch (err) {
      const errorMsg = err.message || 'Error al crear huésped';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Actualizar huésped
  const updateGuest = async (id, guestData) => {
    try {
      setError(null);
      
      // Usar la función updateGuest de tu servicio
      const result = await guestService.updateGuest(id, guestData);
      
      if (result.error) {
        throw result.error;
      }

      // Actualizar lista local
      setGuests(prev => 
        prev.map(guest => guest.id === id ? result.data : guest)
      );
      return result.data;
    } catch (err) {
      const errorMsg = err.message || 'Error al actualizar huésped';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Eliminar huésped
  const deleteGuest = async (id) => {
    try {
      setError(null);
      
      const result = await guestService.deleteGuest(id);
      
      if (result.error) {
        throw result.error;
      }

      // Actualizar lista local
      setGuests(prev => prev.filter(guest => guest.id !== id));
      return true;
    } catch (err) {
      const errorMsg = err.message || 'Error al eliminar huésped';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Obtener huésped por ID
  const getGuestById = async (id) => {
    try {
      // Tu servicio ya tiene getGuestWithHistory que es más completo
      const result = await guestService.getGuestWithHistory(id);
      if (result.error) throw result.error;
      return result.data;
    } catch (err) {
      console.error('Error fetching guest:', err);
      throw err;
    }
  };

  // Buscar huésped por documento
  const findGuestByDocument = async (documentNumber, documentType = null) => {
    try {
      const result = await guestService.findGuestByDocument(documentNumber, documentType);
      if (result.error) throw result.error;
      return result.data;
    } catch (err) {
      console.error('Error finding guest by document:', err);
      throw err;
    }
  };

  // Obtener estadísticas
  const getGuestsStats = async () => {
    try {
      const result = await guestService.getGuestsStatistics();
      if (result.error) throw result.error;
      return result.data;
    } catch (err) {
      console.error('Error fetching guest stats:', err);
      return { total: 0, monthly: 0, complete: 0, withDocument: 0, withPhone: 0 };
    }
  };

  // Funciones adicionales disponibles en tu servicio
  const checkForDuplicates = async (guestData) => {
    try {
      const result = await guestService.checkForDuplicates(guestData);
      if (result.error) throw result.error;
      return result.data;
    } catch (err) {
      console.error('Error checking duplicates:', err);
      return [];
    }
  };

  const exportGuests = async (filters = {}) => {
    try {
      const result = await guestService.exportGuests(filters);
      if (result.error) throw result.error;
      return result.data;
    } catch (err) {
      console.error('Error exporting guests:', err);
      throw err;
    }
  };

  const findSimilarGuests = async (searchTerm) => {
    try {
      const result = await guestService.findSimilarGuests(searchTerm);
      if (result.error) throw result.error;
      return result.data;
    } catch (err) {
      console.error('Error finding similar guests:', err);
      return [];
    }
  };

  // Cargar huéspedes al montar
  useEffect(() => {
    fetchGuests();
  }, []);

  return {
    // Estados básicos
    guests,
    loading,
    error,
    
    // Operaciones CRUD básicas
    fetchGuests,
    createGuest,
    updateGuest,
    deleteGuest,
    getGuestById,
    findGuestByDocument,
    getGuestsStats,
    
    // Funciones avanzadas de tu servicio
    checkForDuplicates,
    exportGuests,
    findSimilarGuests,
    
    // Utilidades de formateo (directamente del servicio)
    formatGuestData: guestService.formatGuestData,
    validateGuestData: guestService.validateGuestData,
    formatPhone: guestService.formatPhone,
    getInitials: guestService.getInitials
  };
};