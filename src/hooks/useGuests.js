import { useState, useEffect, useCallback, useRef } from 'react';
import { guestService } from '../lib/supabase';

export const useGuests = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ SOLUCIÓN 1: Evitar llamadas duplicadas con ref
  const isLoadingRef = useRef(false);
  const lastSearchTermRef = useRef('');
  const abortControllerRef = useRef(null);

  // ✅ SOLUCIÓN 2: Memoizar fetchGuests para evitar recreaciones
  const fetchGuests = useCallback(async (searchTerm = '') => {
    // Evitar múltiples llamadas simultáneas
    if (isLoadingRef.current) {
      console.log('🔄 Fetch already in progress, skipping...');
      return;
    }

    // Si es la misma búsqueda, no hacer nada
    if (searchTerm === lastSearchTermRef.current && guests.length > 0 && !loading) {
      console.log('🔄 Same search term, skipping fetch...');
      return;
    }

    try {
      // Cancelar request anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      isLoadingRef.current = true;
      lastSearchTermRef.current = searchTerm;
      
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching guests with search term:', searchTerm || '(all)');

      let result;
      
      if (searchTerm.trim()) {
        // Usar searchGuests para búsquedas específicas
        result = await guestService.searchGuests(searchTerm, 50);
      } else {
        // Usar getAllGuests para listado completo
        result = await guestService.getAllGuests({ 
          limit: 100, // Aumentar límite para mejor UX
          orderBy: 'created_at', 
          order: 'desc' 
        });
      }
      
      if (result.error) {
        throw result.error;
      }

      console.log('✅ Guests fetched successfully:', result.data?.length || 0);
      setGuests(result.data || []);
      
    } catch (err) {
      // No mostrar error si fue cancelado
      if (err.name !== 'AbortError') {
        console.error('❌ Error fetching guests:', err);
        setError(err.message || 'Error al cargar huéspedes');
      }
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []); // ✅ Dependencias vacías - memoización estable

  // ✅ SOLUCIÓN 3: Memoizar createGuest
  const createGuest = useCallback(async (guestData) => {
    try {
      setError(null);
      
      console.log('➕ Creating guest:', guestData);
      
      // Adaptar datos al formato que espera el servicio
      const adaptedData = {
        fullName: guestData.full_name || guestData.fullName,
        phone: guestData.phone || '',
        documentType: guestData.document_type || guestData.documentType || 'DNI',
        documentNumber: guestData.document_number || guestData.documentNumber
      };
      
      // Validar datos antes de enviar
      const validation = guestService.validateGuestData(adaptedData);
      if (!validation.isValid) {
        const errorMsg = Object.values(validation.errors)[0];
        throw new Error(errorMsg);
      }
      
      const result = await guestService.createGuest(adaptedData);
      
      if (result.error) {
        throw result.error;
      }

      console.log('✅ Guest created successfully:', result.data.full_name);
      
      // ✅ Actualizar lista local de manera inmutable
      setGuests(prev => {
        // Evitar duplicados
        if (prev.find(g => g.id === result.data.id)) {
          return prev;
        }
        return [result.data, ...prev];
      });
      
      return result.data;
    } catch (err) {
      const errorMsg = err.message || 'Error al crear huésped';
      console.error('❌ Error creating guest:', errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []); // Dependencias vacías - función estable

  // ✅ SOLUCIÓN 4: Memoizar updateGuest
  const updateGuest = useCallback(async (id, guestData) => {
    try {
      setError(null);
      
      console.log('🔄 Updating guest:', id, guestData);
      
      // Validar datos antes de enviar
      const validation = guestService.validateGuestData(guestData);
      if (!validation.isValid) {
        const errorMsg = Object.values(validation.errors)[0];
        throw new Error(errorMsg);
      }
      
      const result = await guestService.updateGuest(id, guestData);
      
      if (result.error) {
        throw result.error;
      }

      console.log('✅ Guest updated successfully:', result.data.full_name);
      
      // ✅ Actualizar lista local de manera inmutable
      setGuests(prev => 
        prev.map(guest => guest.id === id ? result.data : guest)
      );
      
      return result.data;
    } catch (err) {
      const errorMsg = err.message || 'Error al actualizar huésped';
      console.error('❌ Error updating guest:', errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []); // Dependencias vacías - función estable

  // ✅ SOLUCIÓN 5: Memoizar deleteGuest
  const deleteGuest = useCallback(async (id) => {
    try {
      setError(null);
      
      console.log('🗑️ Deleting guest:', id);
      
      const result = await guestService.deleteGuest(id);
      
      if (result.error) {
        throw result.error;
      }

      console.log('✅ Guest deleted successfully');
      
      // ✅ Actualizar lista local de manera inmutable
      setGuests(prev => prev.filter(guest => guest.id !== id));
      
      return true;
    } catch (err) {
      const errorMsg = err.message || 'Error al eliminar huésped';
      console.error('❌ Error deleting guest:', errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []); // Dependencias vacías - función estable

  // ✅ SOLUCIÓN 6: Memoizar funciones auxiliares
  const getGuestById = useCallback(async (id) => {
    try {
      console.log('🔍 Getting guest by ID:', id);
      const result = await guestService.getGuestWithHistory(id);
      if (result.error) throw result.error;
      return result.data;
    } catch (err) {
      console.error('❌ Error fetching guest:', err);
      throw err;
    }
  }, []);

  const findGuestByDocument = useCallback(async (documentNumber, documentType = null) => {
    try {
      console.log('🔍 Finding guest by document:', documentNumber, documentType);
      const result = await guestService.findGuestByDocument(documentNumber, documentType);
      if (result.error) throw result.error;
      return result.data;
    } catch (err) {
      console.error('❌ Error finding guest by document:', err);
      throw err;
    }
  }, []);

  // ✅ SOLUCIÓN 7: Optimizar getGuestsStats con cache simple
  const statsCache = useRef({ data: null, timestamp: 0 });
  const STATS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  const getGuestsStats = useCallback(async () => {
    try {
      const now = Date.now();
      
      // Usar cache si es reciente
      if (statsCache.current.data && 
          (now - statsCache.current.timestamp) < STATS_CACHE_DURATION) {
        console.log('📊 Using cached guest stats');
        return statsCache.current.data;
      }
      
      console.log('📊 Fetching fresh guest statistics...');
      const result = await guestService.getGuestsStatistics();
      
      if (result.error) throw result.error;
      
      // Actualizar cache
      statsCache.current = {
        data: result.data,
        timestamp: now
      };
      
      console.log('✅ Guest statistics fetched:', result.data);
      return result.data;
    } catch (err) {
      console.error('❌ Error fetching guest stats:', err);
      
      // Fallback: calcular estadísticas desde los datos locales
      const fallbackStats = {
        total: guests.length,
        monthly: 0, // No podemos calcularlo sin fechas
        complete: guests.filter(g => g.document_number && g.phone).length,
        withDocument: guests.filter(g => g.document_number).length,
        withPhone: guests.filter(g => g.phone).length,
        documentTypes: {},
        completionRate: guests.length > 0 
          ? ((guests.filter(g => g.document_number && g.phone).length / guests.length) * 100).toFixed(1)
          : 0
      };
      
      console.log('📊 Using fallback stats:', fallbackStats);
      return fallbackStats;
    }
  }, [guests.length]); // Solo depende del número de guests

  // ✅ SOLUCIÓN 8: Funciones auxiliares memoizadas
  const checkForDuplicates = useCallback(async (guestData) => {
    try {
      console.log('🔍 Checking for duplicates:', guestData);
      const result = await guestService.checkForDuplicates(guestData);
      if (result.error) throw result.error;
      return result.data;
    } catch (err) {
      console.error('❌ Error checking duplicates:', err);
      return [];
    }
  }, []);

  const exportGuests = useCallback(async (filters = {}) => {
    try {
      console.log('📤 Exporting guests with filters:', filters);
      const result = await guestService.exportGuests(filters);
      if (result.error) throw result.error;
      return result.data;
    } catch (err) {
      console.error('❌ Error exporting guests:', err);
      throw err;
    }
  }, []);

  const findSimilarGuests = useCallback(async (searchTerm) => {
    try {
      console.log('🔍 Finding similar guests:', searchTerm);
      const result = await guestService.findSimilarGuests(searchTerm);
      if (result.error) throw result.error;
      return result.data;
    } catch (err) {
      console.error('❌ Error finding similar guests:', err);
      return [];
    }
  }, []);

  // ✅ SOLUCIÓN 9: Effect optimizado para carga inicial
  useEffect(() => {
    console.log('🚀 useGuests hook mounted, loading initial data...');
    
    // Solo cargar si no hay datos y no está cargando
    if (guests.length === 0 && !isLoadingRef.current) {
      fetchGuests();
    }
    
    // Cleanup function para cancelar requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // ✅ Dependencias vacías - solo al montar

  // ✅ SOLUCIÓN 10: Función para refrescar datos manualmente
  const refreshGuests = useCallback(() => {
    console.log('🔄 Manual refresh requested');
    lastSearchTermRef.current = ''; // Reset search term
    statsCache.current = { data: null, timestamp: 0 }; // Clear stats cache
    fetchGuests();
  }, [fetchGuests]);

  // ✅ SOLUCIÓN 11: Limpiar error automáticamente después de un tiempo
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000); // Limpiar error después de 5 segundos
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    // ✅ Estados básicos
    guests,
    loading,
    error,
    
    // ✅ Operaciones CRUD básicas (todas memoizadas)
    fetchGuests,
    createGuest,
    updateGuest,
    deleteGuest,
    getGuestById,
    findGuestByDocument,
    getGuestsStats,
    refreshGuests, // ✅ Nueva función para refrescar manualmente
    
    // ✅ Funciones avanzadas (todas memoizadas)
    checkForDuplicates,
    exportGuests,
    findSimilarGuests,
    
    // ✅ Utilidades de formateo (directamente del servicio - no causan re-renders)
    formatGuestData: guestService.formatGuestData,
    validateGuestData: guestService.validateGuestData,
    formatPhone: guestService.formatPhone,
    getInitials: guestService.getInitials,
    
    // ✅ Estadísticas adicionales
    guestCount: guests.length,
    hasGuests: guests.length > 0,
    isEmpty: guests.length === 0 && !loading
  };
};