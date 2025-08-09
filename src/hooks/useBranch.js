// src/hooks/useBranch.js - VERSIÓN COMPLETA Y OPTIMIZADA
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/supabase';

export const useBranch = () => {
  const { selectedBranch, user, selectBranch, loading } = useAuth();
  const [availableBranches, setAvailableBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchStats, setBranchStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Referencias para evitar operaciones duplicadas
  const loadingBranchesRef = useRef(false);

  // Cargar sucursales disponibles desde Supabase
  useEffect(() => {
    if (!user?.id || loadingBranchesRef.current) return;
    loadAvailableBranches();
  }, [user?.id]);

  // Cargar estadísticas cuando cambia la sucursal seleccionada
  useEffect(() => {
    if (selectedBranch?.id && !statsLoading) {
      loadCurrentBranchStats();
    }
  }, [selectedBranch?.id]);

  const loadAvailableBranches = useCallback(async () => {
    if (!user?.id || loadingBranchesRef.current) return;
    
    try {
      setBranchesLoading(true);
      loadingBranchesRef.current = true;
      
      console.log('🏢 Loading available branches for user:', user.id);
      
      if (user.role === 'admin') {
        // Admin ve todas las sucursales
        const { data: branches, error } = await db.getBranches();
        if (error) throw error;
        setAvailableBranches(branches || []);
        console.log(`✅ Loaded ${branches?.length || 0} branches for admin`);
      } else {
        // Recepción ve solo sus sucursales asignadas
        const { data: userBranches, error } = await db.getUserBranches(user.id);
        if (error) throw error;
        setAvailableBranches(userBranches || []);
        console.log(`✅ Loaded ${userBranches?.length || 0} branches for user`);
      }
    } catch (error) {
      console.error('Error loading available branches:', error);
      setAvailableBranches([]);
    } finally {
      setBranchesLoading(false);
      loadingBranchesRef.current = false;
    }
  }, [user?.id, user?.role]);

  const loadCurrentBranchStats = useCallback(async () => {
    if (!selectedBranch?.id || statsLoading) return;
    
    try {
      setStatsLoading(true);
      const { data: stats, error } = await db.getBranchStats(selectedBranch.id);
      if (error) throw error;
      setBranchStats(stats);
      console.log('📊 Branch stats updated for:', selectedBranch.name);
    } catch (error) {
      console.error('Error loading branch stats:', error);
      setBranchStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [selectedBranch?.id]);

  // 🔧 FUNCIÓN PRINCIPAL DE CAMBIO DE SUCURSAL - SIMPLIFICADA
  const changeBranch = useCallback(async (branchId) => {
    console.log('🔄 useBranch.changeBranch called with ID:', branchId);
    
    try {
      // Buscar la sucursal en las disponibles
      let branch = availableBranches.find(b => b.id === branchId);
      
      if (!branch) {
        // Si no está en las disponibles, buscarla en la base de datos
        const { data: foundBranch, error } = await db.getBranchById(branchId);
        if (error || !foundBranch) {
          throw new Error('Sucursal no encontrada');
        }
        branch = foundBranch;
      }

      // SOLO LLAMAR selectBranch del AuthContext
      const result = await selectBranch(branch);
      
      if (!result.success) {
        throw new Error(result.error || 'Error al cambiar de sucursal');
      }
      
      console.log('🎉 Branch change completed successfully');
      return result;
      
    } catch (error) {
      console.error('❌ Error in changeBranch:', error);
      return { success: false, error: error.message };
    }
  }, [selectBranch, availableBranches]);

  // MÉTODO SIMPLIFICADO PARA CAMBIAR SUCURSAL POR OBJETO
  const switchToBranch = useCallback(async (branch) => {
    console.log('🔄 useBranch.switchToBranch called with:', branch.name);
    
    try {
      const result = await selectBranch(branch);
      
      if (!result.success) {
        throw new Error(result.error || 'Error al cambiar de sucursal');
      }
      
      console.log('🎉 Branch switch completed successfully');
      return result;
      
    } catch (error) {
      console.error('❌ Error in switchToBranch:', error);
      return { success: false, error: error.message };
    }
  }, [selectBranch]);

  const getCurrentBranchInfo = useCallback(async () => {
    if (!selectedBranch?.id) return null;
    
    try {
      const { data: branch, error } = await db.getBranchById(selectedBranch.id);
      if (error) throw error;
      return branch;
    } catch (error) {
      console.error('Error getting current branch info:', error);
      return selectedBranch;
    }
  }, [selectedBranch?.id]);

  const getBranchById = useCallback(async (id) => {
    try {
      const { data: branch, error } = await db.getBranchById(id);
      if (error) throw error;
      return branch;
    } catch (error) {
      console.error(`Error getting branch ${id}:`, error);
      return availableBranches.find(branch => branch.id === id) || null;
    }
  }, [availableBranches]);

  const canChangeBranch = useCallback(() => {
    return user?.role === 'admin';
  }, [user?.role]);

  const getBranchDisplayName = useCallback(() => {
    return selectedBranch?.name || branchStats?.branchName || 'Sin sucursal';
  }, [selectedBranch?.name, branchStats?.branchName]);

  const getBranchShortName = useCallback(() => {
    if (!selectedBranch) return 'N/A';
    return `${selectedBranch.code || 'N/A'} - ${selectedBranch.location || ''}`;
  }, [selectedBranch]);

  const getCurrentBranchCode = useCallback(() => {
    return selectedBranch?.code || branchStats?.branchCode || 'N/A';
  }, [selectedBranch?.code, branchStats?.branchCode]);

  const isBranchSelected = useCallback((branchId) => {
    return selectedBranch?.id === branchId;
  }, [selectedBranch?.id]);

  const getCurrentBranchRooms = useCallback(async (filters = {}) => {
    if (!selectedBranch?.id) return [];

    try {
      const { data: rooms, error } = await db.getRoomsByBranch(selectedBranch.id, filters);
      if (error) throw error;
      return rooms || [];
    } catch (error) {
      console.error('Error fetching branch rooms:', error);
      return [];
    }
  }, [selectedBranch?.id]);

  const getCurrentBranchReservations = useCallback(async (filters = {}) => {
    if (!selectedBranch?.id) return [];

    try {
      const { data: reservations, error } = await db.getReservationsByBranch(selectedBranch.id, filters);
      if (error) throw error;
      return reservations || [];
    } catch (error) {
      console.error('Error fetching branch reservations:', error);
      return [];
    }
  }, [selectedBranch?.id]);

  const refreshBranchStats = useCallback(async () => {
    await loadCurrentBranchStats();
  }, [loadCurrentBranchStats]);

  const refreshAvailableBranches = useCallback(async () => {
    loadingBranchesRef.current = false; // Reset lock
    await loadAvailableBranches();
  }, [loadAvailableBranches]);

  const canOperateInCurrentBranch = useCallback(() => {
    if (!selectedBranch) return false;
    if (user?.role === 'admin') return true;
    return availableBranches.some(branch => branch.id === selectedBranch.id);
  }, [selectedBranch, user?.role, availableBranches]);

  // Funciones administrativas (solo admin)
  const createBranch = useCallback(async (branchData) => {
    if (!canChangeBranch()) {
      throw new Error('No tienes permisos para crear sucursales');
    }

    try {
      const { data: newBranch, error } = await db.createBranch(branchData);
      if (error) throw error;
      
      await refreshAvailableBranches();
      return newBranch;
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  }, [canChangeBranch, refreshAvailableBranches]);

  const updateBranch = useCallback(async (branchId, updateData) => {
    if (!canChangeBranch()) {
      throw new Error('No tienes permisos para actualizar sucursales');
    }

    try {
      const { data: updatedBranch, error } = await db.updateBranch(branchId, updateData);
      if (error) throw error;
      
      await refreshAvailableBranches();
      
      if (selectedBranch?.id === branchId) {
        await refreshBranchStats();
      }
      
      return updatedBranch;
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  }, [canChangeBranch, refreshAvailableBranches, selectedBranch?.id, refreshBranchStats]);

  // 🔧 FUNCIÓN FALTANTE: deleteBranch
  const deleteBranch = useCallback(async (branchId) => {
    if (!canChangeBranch()) {
      throw new Error('No tienes permisos para eliminar sucursales');
    }

    try {
      const { data, error } = await db.deleteBranch(branchId);
      if (error) throw error;
      
      await refreshAvailableBranches();
      
      if (selectedBranch?.id === branchId) {
        console.warn('Current branch was deleted');
        // Si la sucursal actual fue eliminada, podrías necesitar seleccionar otra
      }
      
      return data;
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw error;
    }
  }, [canChangeBranch, refreshAvailableBranches, selectedBranch?.id]);

  const getCurrentBranchStats = useCallback(async () => {
    if (!selectedBranch?.id) return null;
    
    try {
      const { data: stats, error } = await db.getBranchStats(selectedBranch.id);
      if (error) throw error;
      return stats;
    } catch (error) {
      console.error('Error getting current branch stats:', error);
      return branchStats;
    }
  }, [selectedBranch?.id, branchStats]);

  const updateCurrentBranchRoomCount = useCallback(async () => {
    if (!selectedBranch?.id) return null;

    try {
      const { data, error } = await db.updateBranchRoomCount(selectedBranch.id);
      if (error) throw error;
      
      await loadCurrentBranchStats();
      return data;
    } catch (error) {
      console.error('Error updating branch room count:', error);
      return null;
    }
  }, [selectedBranch?.id, loadCurrentBranchStats]);

  // NUEVO: Función para obtener sucursales con estadísticas
  const getBranchesWithStats = useCallback(async () => {
    try {
      const branches = await Promise.all(
        availableBranches.map(async (branch) => {
          try {
            const { data: stats } = await db.getBranchStats(branch.id);
            return {
              ...branch,
              stats: stats || {
                occupancyRate: 0,
                currentGuests: 0,
                totalRooms: branch.rooms_count || 0
              }
            };
          } catch (error) {
            console.warn(`Error loading stats for branch ${branch.id}:`, error);
            return {
              ...branch,
              stats: {
                occupancyRate: 0,
                currentGuests: 0,
                totalRooms: branch.rooms_count || 0
              }
            };
          }
        })
      );
      
      return branches;
    } catch (error) {
      console.error('Error getting branches with stats:', error);
      return availableBranches;
    }
  }, [availableBranches]);

  // NUEVO: Función para validar acceso a sucursal
  const validateBranchAccess = useCallback((branchId) => {
    if (user?.role === 'admin') return true;
    return availableBranches.some(branch => branch.id === branchId);
  }, [user?.role, availableBranches]);

  // Limpiar referencias al desmontar
  useEffect(() => {
    return () => {
      loadingBranchesRef.current = false;
    };
  }, []);

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
    getBranchesWithStats,
    
    // Funciones de datos
    getCurrentBranchRooms,
    getCurrentBranchReservations,
    
    // Funciones de acción - SIMPLIFICADAS
    changeBranch,        // Por ID
    switchToBranch,      // Por objeto completo
    canChangeBranch,
    isBranchSelected,
    canOperateInCurrentBranch,
    validateBranchAccess,
    
    // Funciones de gestión (solo admin)
    createBranch,
    updateBranch,
    deleteBranch,        // ✅ YA INCLUIDA
    
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