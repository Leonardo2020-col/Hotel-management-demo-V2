// src/hooks/useApi.js - NUEVO HOOK UNIFICADO
import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/supabase';

export const useApi = (apiFunction, dependencies = [], options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const {
    immediate = true,
    onSuccess,
    onError,
    transform
  } = options;

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction(...args);
      
      if (result.error) {
        throw new Error(result.error.message || 'Error en la API');
      }
      
      const finalData = transform ? transform(result.data) : result.data;
      setData(finalData);
      
      if (onSuccess) {
        onSuccess(finalData);
      }
      
      return { data: finalData, error: null };
    } catch (err) {
      const errorMessage = err.message || 'Error desconocido';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
      
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [apiFunction, transform, onSuccess, onError]);

  // Ejecutar automáticamente si immediate es true
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    execute,
    refetch
  };
};

// Hook específico para habitaciones
export const useRoomsData = () => {
  return useApi(
    () => db.getRooms(),
    [],
    {
      transform: (rooms) => {
        // Agrupar por piso y ordenar
        const grouped = rooms.reduce((acc, room) => {
          const floor = room.floor || Math.floor(parseInt(room.number) / 100) || 1;
          if (!acc[floor]) acc[floor] = [];
          acc[floor].push(room);
          return acc;
        }, {});

        // Ordenar habitaciones dentro de cada piso
        Object.keys(grouped).forEach(floor => {
          grouped[floor].sort((a, b) => parseInt(a.number) - parseInt(b.number));
        });

        return grouped;
      }
    }
  );
};