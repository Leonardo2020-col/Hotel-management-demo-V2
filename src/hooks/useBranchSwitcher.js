// src/hooks/useBranchSwitcher.js - HOOK PARA CAMBIO DE SUCURSAL
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { branchService } from '../lib/supabase'
import { useErrorHandler } from './useErrorHandler'
import toast from 'react-hot-toast'

export const useBranchSwitcher = () => {
  const { userInfo, getUserBranches, getPrimaryBranch, refreshUserInfo, isAdmin } = useAuth()
  const { handleError } = useErrorHandler()
  const [loading, setLoading] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [branchStats, setBranchStats] = useState({})
  const [availableBranches, setAvailableBranches] = useState([])

  // ✅ Obtener sucursales disponibles para el usuario
  const userBranches = useMemo(() => getUserBranches(), [userInfo])
  const currentBranch = useMemo(() => getPrimaryBranch(), [userInfo])

  // ✅ Cargar estadísticas de todas las sucursales disponibles
  const loadBranchStats = useCallback(async () => {
    if (!userBranches.length) return

    try {
      setLoading(true)
      const stats = {}

      // Cargar estadísticas para cada sucursal disponible
      await Promise.all(
        userBranches.map(async (branch) => {
          try {
            const { data, error } = await branchService.getBranchStats(branch.id)
            if (!error) {
              stats[branch.id] = {
                ...data,
                branchInfo: branch
              }
            }
          } catch (error) {
            console.error(`Error loading stats for branch ${branch.id}:`, error)
            // Datos por defecto si no se pueden cargar las estadísticas
            stats[branch.id] = {
              totalRooms: 0,
              occupiedRooms: 0,
              availableRooms: 0,
              todayRevenue: 0,
              occupancyRate: 0,
              branchInfo: branch,
              error: true
            }
          }
        })
      )

      setBranchStats(stats)
    } catch (error) {
      handleError(error, 'branchStats', {
        context: 'Cargando estadísticas de sucursales',
        showToast: false
      })
    } finally {
      setLoading(false)
    }
  }, [userBranches, handleError])

  // ✅ Cambiar sucursal primaria
  const switchToBranch = useCallback(async (branchId) => {
    if (!branchId || branchId === currentBranch?.id) {
      return { success: false, message: 'Ya estás en esa sucursal' }
    }

    // Verificar que el usuario tenga acceso a esa sucursal
    const hasAccess = userBranches.some(branch => branch.id === branchId)
    if (!hasAccess) {
      toast.error('No tienes acceso a esa sucursal')
      return { success: false, message: 'Sin acceso a la sucursal' }
    }

    try {
      setSwitching(true)
      console.log('🔄 Cambiando a sucursal:', branchId)

      // Actualizar la sucursal primaria en la base de datos
      const { data, error } = await branchService.setPrimaryBranch(userInfo.id, branchId)

      if (error) throw error

      // Refrescar información del usuario para obtener la nueva sucursal primaria
      await refreshUserInfo()

      const newBranchName = userBranches.find(b => b.id === branchId)?.name || 'Nueva sucursal'
      
      toast.success(`Cambiado a ${newBranchName}`, {
        icon: '🏨',
        duration: 3000
      })

      console.log('✅ Sucursal cambiada exitosamente')
      
      return { success: true, data }
    } catch (error) {
      console.error('❌ Error cambiando sucursal:', error)
      handleError(error, 'switchBranch', {
        context: 'Cambiando sucursal',
        showToast: true
      })
      return { success: false, error }
    } finally {
      setSwitching(false)
    }
  }, [currentBranch?.id, userBranches, userInfo?.id, refreshUserInfo, handleError])

  // ✅ Obtener sucursal por ID
  const getBranchById = useCallback((branchId) => {
    return userBranches.find(branch => branch.id === branchId)
  }, [userBranches])

  // ✅ Verificar si una sucursal está disponible
  const isBranchAvailable = useCallback((branchId) => {
    return userBranches.some(branch => branch.id === branchId && branch.is_active)
  }, [userBranches])

  // ✅ Obtener estadísticas de una sucursal específica
  const getBranchStats = useCallback((branchId) => {
    return branchStats[branchId] || null
  }, [branchStats])

  // ✅ Efecto para cargar estadísticas cuando cambian las sucursales
  useEffect(() => {
    if (userBranches.length > 0 && isAdmin()) {
      loadBranchStats()
    }
  }, [userBranches, isAdmin, loadBranchStats])

  // ✅ Datos procesados para la interfaz
  const processedBranches = useMemo(() => {
    return userBranches.map(branch => {
      const stats = branchStats[branch.id]
      const isCurrent = branch.id === currentBranch?.id
      
      return {
        ...branch,
        isCurrent,
        stats: stats || {
          totalRooms: 0,
          occupiedRooms: 0,
          availableRooms: 0,
          todayRevenue: 0,
          occupancyRate: 0,
          loading: loading
        },
        occupancyPercentage: stats ? 
          (stats.totalRooms > 0 ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0) 
          : 0,
        statusColor: isCurrent ? 'bg-green-100 border-green-300' : 'bg-white border-gray-200',
        statusText: isCurrent ? 'Sucursal Actual' : 'Cambiar',
        available: branch.is_active
      }
    })
  }, [userBranches, branchStats, currentBranch?.id, loading])

  // ✅ Resumen de acceso del usuario
  const accessSummary = useMemo(() => {
    const total = userBranches.length
    const active = userBranches.filter(b => b.is_active).length
    const hasMultiple = total > 1
    
    return {
      total,
      active,
      hasMultiple,
      canSwitch: isAdmin() && hasMultiple,
      currentBranchName: currentBranch?.name || 'Sin sucursal'
    }
  }, [userBranches, currentBranch, isAdmin])

  return {
    // Estado
    loading,
    switching,
    
    // Datos
    currentBranch,
    userBranches,
    processedBranches,
    branchStats,
    accessSummary,
    
    // Acciones
    switchToBranch,
    loadBranchStats,
    getBranchById,
    getBranchStats,
    isBranchAvailable,
    
    // Utilidades
    canSwitchBranches: isAdmin() && userBranches.length > 1,
    hasMultipleBranches: userBranches.length > 1
  }
}