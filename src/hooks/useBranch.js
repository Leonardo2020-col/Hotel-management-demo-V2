// src/hooks/useBranch.js - VERSIÓN CORREGIDA PARA EVITAR REFRESH
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/supabase';

export const useBranch = () => {
  const { selectedBranch, user, selectBranch, loading } = useAuth();
  const [availableBranches, setAvailableBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchStats, setBranchStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Cargar sucursales disponibles desde Supabase
  useEffect(() => {
    loadAvailableBranches();
  }, [user?.id]); // Solo recargar cuando cambie el usuario

  // Cargar estadísticas cuando cambia la sucursal seleccionada
  useEffect(() => {
    if (selectedBranch?.id) {
      loadCurrentBranchStats();
    }
  }, [selectedBranch?.id]);

  const loadAvailableBranches = async () => {
    if (!user?.id) return;
    
    try {
      setBranchesLoading(true);
      
      if (user.role === 'admin') {
        const { data: branches, error } = await db.getBranches();
        if (error) throw error;
        setAvailableBranches(branches || []);
      } else {
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

  const getCurrentBranchInfo = async () => {
    if (!selectedBranch?.id) return null;
    
    try {
      const { data: branch, error } = await db.getBranchById(selectedBranch.id);
      if (error) throw error;
      return branch;
    } catch (error) {
      console.error('Error getting current branch info:', error);
      return selectedBranch;
    }
  };

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

  const canChangeBranch = () => {
    return user?.role === 'admin';
  };

  const getCurrentBranchCode = () => {
    return selectedBranch?.code || branchStats?.branchCode || 'N/A';
  };

  const getCurrentBranchStats = async () => {
    if (!selectedBranch?.id) return null;
    
    try {
      const { data: stats, error } = await db.getBranchStats(selectedBranch.id);
      if (error) throw error;
      return stats;
    } catch (error) {
      console.error('Error getting current branch stats:', error);
      return branchStats;
    }
  };

  // 🔧 FUNCIÓN CORREGIDA PARA EVITAR REFRESH
  const changeBranch = async (branchId) => {
    console.log('🔄 Starting branch change to:', branchId);
    
    if (!canChangeBranch()) {
      const error = new Error('No tienes permisos para cambiar de sucursal');
      console.error('❌ Permission denied:', error.message);
      throw error;
    }

    try {
      // Buscar la sucursal en las disponibles primero (más rápido)
      let branch = availableBranches.find(b => b.id === branchId);
      
      // Si no está en las disponibles, buscar en base de datos
      if (!branch) {
        console.log('🔍 Branch not in cache, fetching from database...');
        branch = await getBranchById(branchId);
      }
      
      if (!branch) {
        const error = new Error('Sucursal no encontrada');
        console.error('❌ Branch not found:', branchId);
        throw error;
      }

      console.log('✅ Branch found:', branch.name);
      console.log('🔄 Calling selectBranch...');
      
      // Llamar a selectBranch del AuthContext
      const result = await selectBranch(branch);
      
      console.log('✅ selectBranch result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Error al cambiar de sucursal');
      }
      
      console.log('🎉 Branch change completed successfully');
      return result;
      
    } catch (error) {
      console.error('❌ Error in changeBranch:', error);
      throw error;
    }
  };

  const getBranchDisplayName = () => {
    return selectedBranch?.name || branchStats?.branchName || 'Sin sucursal';
  };

  const getBranchShortName = () => {
    if (!selectedBranch) return 'N/A';
    return `${selectedBranch.code || 'N/A'} - ${selectedBranch.location || ''}`;
  };

  const isBranchSelected = (branchId) => {
    return selectedBranch?.id === branchId;
  };

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

  const updateCurrentBranchRoomCount = async () => {
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
  };

  const refreshBranchStats = async () => {
    await loadCurrentBranchStats();
  };

  const refreshAvailableBranches = async () => {
    await loadAvailableBranches();
  };

  const canOperateInCurrentBranch = () => {
    if (!selectedBranch) return false;
    if (user?.role === 'admin') return true;
    return availableBranches.some(branch => branch.id === selectedBranch.id);
  };

  const createBranch = async (branchData) => {
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
  };

  const updateBranch = async (branchId, updateData) => {
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
  };

  const deleteBranch = async (branchId) => {
    if (!canChangeBranch()) {
      throw new Error('No tienes permisos para eliminar sucursales');
    }

    try {
      const { data, error } = await db.deleteBranch(branchId);
      if (error) throw error;
      
      await refreshAvailableBranches();
      
      if (selectedBranch?.id === branchId) {
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