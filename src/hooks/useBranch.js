// src/hooks/useBranch.js - COMPLETAMENTE CONECTADO A SUPABASE
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/supabase';

/**
 * Hook personalizado para manejar información y operaciones de sucursal
 * Completamente conectado a Supabase
 */
export const useBranch = () => {
  const { selectedBranch, user, selectBranch, loading } = useAuth();
  const [availableBranches, setAvailableBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchStats, setBranchStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Cargar sucursales disponibles desde Supabase
  useEffect(() => {
    loadAvailableBranches();
  }, []);

  // Cargar estadísticas cuando cambia la sucursal seleccionada
  useEffect(() => {
    if (selectedBranch?.id) {
      loadCurrentBranchStats();
    }
  }, [selectedBranch?.id]);

  const loadAvailableBranches = async () => {
    try {
      setBranchesLoading(true);
      
      if (user?.role === 'admin') {
        // Administradores ven todas las sucursales
        const { data: branches, error } = await db.getBranches();
        if (error) throw error;
        setAvailableBranches(branches || []);
      } else if (user?.id) {
        // Otros usuarios solo ven sus sucursales asignadas
        const { data: userBranches, error } = await db.getUserBranches(user.id);
        if (error) throw error;
        setAvailableBranches(userBranches || []);
      }
    } catch (error) {
      console.error('Error loading available branches:', error);
      setAvailableBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  };

  const loadCurrentBranchStats = async () => {
    if (!selectedBranch?.id) return;
    
    try {
      setStatsLoading(true);
      const { data: stats, error } = await db.getBranchStats(selectedBranch.id);
      if (error) throw error;
      setBranchStats(stats);
    } catch (error) {
      console.error('Error loading branch stats:', error);
      setBranchStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  /**
   * Obtiene información detallada de la sucursal actual desde Supabase
   */
  const getCurrentBranchInfo = async () => {
    if (!selectedBranch?.id) return null;
    
    try {
      const { data: branch, error } = await db.getBranchById(selectedBranch.id);
      if (error) throw error;
      return branch;
    } catch (error) {
      console.error('Error getting current branch info:', error);
      return selectedBranch; // Fallback a datos en memoria
    }
  };

  /**
   * Obtiene información de una sucursal específica por ID
   */
  const getBranchById = async (id) => {
    try {
      const { data: branch, error } = await db.getBranchById(id);
      if (error) throw error;
      return branch;
    } catch (error) {
      console.error(`Error getting branch ${id}:`, error);
      return availableBranches.find(branch => branch.id === id) || null;
    }
  };

  /**
   * Verifica si el usuario puede cambiar de sucursal
   */
  const canChangeBranch = () => {
    return user?.role === 'admin';
  };

  /**
   * Obtiene el código de la sucursal actual
   */
  const getCurrentBranchCode = () => {
    return selectedBranch?.code || branchStats?.branchCode || 'N/A';
  };

  /**
   * Obtiene estadísticas reales de la sucursal actual
   */
  const getCurrentBranchStats = async () => {
    if (!selectedBranch?.id) return null;
    
    try {
      const { data: stats, error } = await db.getBranchStats(selectedBranch.id);
      if (error) throw error;
      return stats;
    } catch (error) {
      console.error('Error getting current branch stats:', error);
      return branchStats; // Fallback a datos en caché
    }
  };

  /**
   * Cambia a una sucursal específica (solo para administradores)
   */
  const changeBranch = async (branchId) => {
    if (!canChangeBranch()) {
      throw new Error('No tienes permisos para cambiar de sucursal');
    }

    const branch = await getBranchById(branchId);
    if (!branch) {
      throw new Error('Sucursal no encontrada');
    }

    return await selectBranch(branch);
  };

  /**
   * Obtiene el formato de display para la sucursal actual
   */
  const getBranchDisplayName = () => {
    return selectedBranch?.name || branchStats?.branchName || 'Sin sucursal';
  };

  /**
   * Obtiene el formato corto para la sucursal actual
   */
  const getBranchShortName = () => {
    if (!selectedBranch) return 'N/A';
    return `${selectedBranch.code || 'N/A'} - ${selectedBranch.location || ''}`;
  };

  /**
   * Verifica si una sucursal específica está seleccionada
   */
  const isBranchSelected = (branchId) => {
    return selectedBranch?.id === branchId;
  };

  /**
   * Obtiene las habitaciones de la sucursal actual
   */
  const getCurrentBranchRooms = async (filters = {}) => {
    if (!selectedBranch?.id) return [];

    try {
      const { data: rooms, error } = await db.getRoomsByBranch(selectedBranch.id, filters);
      if (error) throw error;
      return rooms || [];
    } catch (error) {
      console.error('Error fetching branch rooms:', error);
      return [];
    }
  };

  /**
   * Obtiene las reservas de la sucursal actual
   */
  const getCurrentBranchReservations = async (filters = {}) => {
    if (!selectedBranch?.id) return [];

    try {
      const { data: reservations, error } = await db.getReservationsByBranch(selectedBranch.id, filters);
      if (error) throw error;
      return reservations || [];
    } catch (error) {
      console.error('Error fetching branch reservations:', error);
      return [];
    }
  };

  /**
   * Actualiza el conteo de habitaciones de la sucursal actual
   */
  const updateCurrentBranchRoomCount = async () => {
    if (!selectedBranch?.id) return null;

    try {
      const { data, error } = await db.updateBranchRoomCount(selectedBranch.id);
      if (error) throw error;
      
      // Recargar estadísticas
      await loadCurrentBranchStats();
      
      return data;
    } catch (error) {
      console.error('Error updating branch room count:', error);
      return null;
    }
  };

  /**
   * Recarga las estadísticas de la sucursal actual
   */
  const refreshBranchStats = async () => {
    await loadCurrentBranchStats();
  };

  /**
   * Recarga la lista de sucursales disponibles
   */
  const refreshAvailableBranches = async () => {
    await loadAvailableBranches();
  };

  /**
   * Valida si el usuario puede operar en la sucursal actual
   */
  const canOperateInCurrentBranch = () => {
    if (!selectedBranch) return false;
    if (user?.role === 'admin') return true;
    
    // Para otros usuarios, verificar si tienen acceso a esta sucursal
    return availableBranches.some(branch => branch.id === selectedBranch.id);
  };

  /**
   * Crea una nueva sucursal (solo administradores)
   */
  const createBranch = async (branchData) => {
    if (!canChangeBranch()) {
      throw new Error('No tienes permisos para crear sucursales');
    }

    try {
      const { data: newBranch, error } = await db.createBranch(branchData);
      if (error) throw error;
      
      // Recargar lista de sucursales
      await refreshAvailableBranches();
      
      return newBranch;
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  };

  /**
   * Actualiza una sucursal (solo administradores)
   */
  const updateBranch = async (branchId, updateData) => {
    if (!canChangeBranch()) {
      throw new Error('No tienes permisos para actualizar sucursales');
    }

    try {
      const { data: updatedBranch, error } = await db.updateBranch(branchId, updateData);
      if (error) throw error;
      
      // Recargar lista de sucursales
      await refreshAvailableBranches();
      
      // Si es la sucursal actual, recargar estadísticas
      if (selectedBranch?.id === branchId) {
        await refreshBranchStats();
      }
      
      return updatedBranch;
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  };

  /**
   * Elimina una sucursal (solo administradores)
   */
  const deleteBranch = async (branchId) => {
    if (!canChangeBranch()) {
      throw new Error('No tienes permisos para eliminar sucursales');
    }

    try {
      const { data, error } = await db.deleteBranch(branchId);
      if (error) throw error;
      
      // Recargar lista de sucursales
      await refreshAvailableBranches();
      
      // Si eliminamos la sucursal actual, limpiar selección
      if (selectedBranch?.id === branchId) {
        // Aquí podrías implementar lógica para seleccionar otra sucursal
        console.warn('Current branch was deleted');
      }
      
      return data;
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw error;
    }
  };

  return {
    // Estado
    selectedBranch,
    availableBranches,
    branchStats,
    loading,
    branchesLoading,
    statsLoading,
    
    // Funciones de información
    getCurrentBranchInfo,
    getBranchById,
    getCurrentBranchCode,
    getCurrentBranchStats,
    getBranchDisplayName,
    getBranchShortName,
    
    // Funciones de datos
    getCurrentBranchRooms,
    getCurrentBranchReservations,
    
    // Funciones de acción
    changeBranch,
    canChangeBranch,
    isBranchSelected,
    canOperateInCurrentBranch,
    
    // Funciones de gestión (solo admin)
    createBranch,
    updateBranch,
    deleteBranch,
    
    // Funciones de actualización
    refreshBranchStats,
    refreshAvailableBranches,
    updateCurrentBranchRoomCount,
    
    // Estado derivado
    hasSelectedBranch: !!selectedBranch,
    isAdmin: user?.role === 'admin',
    isReception: user?.role === 'reception',
    branchCode: getCurrentBranchCode(),
    branchDisplayName: getBranchDisplayName(),
    branchShortName: getBranchShortName()
  };
};