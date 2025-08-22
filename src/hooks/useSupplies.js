// src/hooks/useSupplies.js - VERSIÓN CORREGIDA
import { useState, useEffect, useCallback } from 'react'
import { suppliesService } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export const useSupplies = () => {
  const { userInfo, primaryBranch } = useAuth()
  
  // Estados principales
  const [supplies, setSupplies] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [movements, setMovements] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Estados para filtros
  const [filters, setFilters] = useState({
    category: '',
    supplier: '',
    lowStock: false,
    search: ''
  })

  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [selectedSupply, setSelectedSupply] = useState(null)

  // =====================================================
  // 📊 FUNCIONES DE CARGA DE DATOS - CORREGIDAS
  // =====================================================

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Cargando datos de suministros para:', primaryBranch?.name)

      // ✅ Cargar datos en paralelo con manejo de errores individual
      const [
        suppliesResult,
        categoriesResult,
        suppliersResult,
        alertsResult
      ] = await Promise.allSettled([
        suppliesService.getSupplies(filters),
        suppliesService.getCategories(),
        suppliesService.getSuppliers(),
        suppliesService.getAlerts()
      ])

      // ✅ Procesar resultados con manejo de errores mejorado
      if (suppliesResult.status === 'fulfilled' && !suppliesResult.value.error) {
        setSupplies(suppliesResult.value.data || [])
        console.log('✅ Supplies loaded:', suppliesResult.value.data?.length || 0)
      } else {
        console.warn('⚠️ Error loading supplies:', suppliesResult.reason || suppliesResult.value?.error)
        setSupplies([])
      }

      if (categoriesResult.status === 'fulfilled' && !categoriesResult.value.error) {
        setCategories(categoriesResult.value.data || [])
        console.log('✅ Categories loaded:', categoriesResult.value.data?.length || 0)
      } else {
        console.warn('⚠️ Error loading categories:', categoriesResult.reason || categoriesResult.value?.error)
        setCategories([])
      }

      if (suppliersResult.status === 'fulfilled' && !suppliersResult.value.error) {
        setSuppliers(suppliersResult.value.data || [])
        console.log('✅ Suppliers loaded:', suppliersResult.value.data?.length || 0)
      } else {
        console.warn('⚠️ Error loading suppliers:', suppliersResult.reason || suppliersResult.value?.error)
        setSuppliers([])
      }

      if (alertsResult.status === 'fulfilled' && !alertsResult.value.error) {
        setAlerts(alertsResult.value.data || [])
        console.log('✅ Alerts loaded:', alertsResult.value.data?.length || 0)
      } else {
        console.warn('⚠️ Error loading alerts:', alertsResult.reason || alertsResult.value?.error)
        setAlerts([])
      }

      console.log('✅ Datos de suministros cargados exitosamente')

    } catch (err) {
      console.error('❌ Error crítico cargando datos de suministros:', err)
      setError(err.message || 'Error al cargar suministros')
      toast.error('Error al cargar datos de suministros')
    } finally {
      setLoading(false)
    }
  }, [primaryBranch?.id, filters])

  // Cargar datos iniciales cuando cambie la sucursal
  useEffect(() => {
    if (primaryBranch?.id) {
      loadAllData()
    }
  }, [primaryBranch?.id])

  // Recargar cuando cambien los filtros (con debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (primaryBranch?.id) {
        loadSupplies()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [filters])

  const loadSupplies = async () => {
    try {
      console.log('🔄 Recargando suministros con filtros:', filters)
      const { data, error } = await suppliesService.getSupplies(filters)
      if (error) {
        console.warn('⚠️ Error cargando suministros:', error)
        toast.error('Error al cargar suministros')
        return
      }
      setSupplies(data || [])
    } catch (err) {
      console.error('❌ Error en loadSupplies:', err)
      toast.error('Error al cargar suministros')
    }
  }

  const loadMovements = async (supplyId, limit = 20) => {
    try {
      const { data, error } = await suppliesService.getMovements(supplyId, limit)
      if (error) {
        console.warn('⚠️ Error cargando movimientos:', error)
        toast.error('Error al cargar movimientos')
        return []
      }
      setMovements(data || [])
      return data || []
    } catch (err) {
      console.error('❌ Error en loadMovements:', err)
      toast.error('Error al cargar movimientos')
      return []
    }
  }

  // =====================================================
  // 📦 FUNCIONES DE GESTIÓN DE SUMINISTROS
  // =====================================================

  const createSupply = async (supplyData) => {
    if (!userInfo?.id) {
      toast.error('Error de autenticación')
      return { success: false, error: 'No autenticado' }
    }

    try {
      setCreating(true)
      console.log('📦 Creando nuevo suministro:', supplyData)

      const { data, error } = await suppliesService.createSupply({
        ...supplyData,
        createdBy: userInfo.id
      })

      if (error) {
        throw error
      }

      await loadSupplies()
      toast.success(`Suministro "${data.name}" creado exitosamente`)
      
      return { success: true, data }

    } catch (err) {
      console.error('❌ Error creando suministro:', err)
      const errorMessage = err.message || 'Error al crear el suministro'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setCreating(false)
    }
  }

  const updateSupply = async (supplyId, updateData) => {
    if (!userInfo?.id) {
      toast.error('Error de autenticación')
      return { success: false, error: 'No autenticado' }
    }

    try {
      setUpdating(true)
      console.log('🔄 Actualizando suministro:', { supplyId, updateData })

      const { data, error } = await suppliesService.updateSupply(supplyId, updateData)
      if (error) {
        throw error
      }

      // Actualizar en el estado local
      setSupplies(prev => prev.map(supply => 
        supply.id === supplyId ? { ...supply, ...data } : supply
      ))

      toast.success('Suministro actualizado exitosamente')
      return { success: true, data }

    } catch (err) {
      console.error('❌ Error actualizando suministro:', err)
      const errorMessage = err.message || 'Error al actualizar el suministro'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setUpdating(false)
    }
  }

  const deleteSupply = async (supplyId) => {
    if (!userInfo?.id) {
      toast.error('Error de autenticación')
      return { success: false, error: 'No autenticado' }
    }

    try {
      const confirmed = window.confirm(
        '¿Estás seguro de que deseas eliminar este suministro? Esta acción no se puede deshacer.'
      )
      
      if (!confirmed) return { success: false, error: 'Cancelado por el usuario' }

      const { error } = await suppliesService.deleteSupply(supplyId)
      if (error) {
        throw error
      }

      // Remover del estado local
      setSupplies(prev => prev.filter(supply => supply.id !== supplyId))
      
      toast.success('Suministro eliminado exitosamente')
      return { success: true }

    } catch (err) {
      console.error('❌ Error eliminando suministro:', err)
      const errorMessage = err.message || 'Error al eliminar el suministro'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // =====================================================
  // 📈 FUNCIONES DE MOVIMIENTOS DE STOCK
  // =====================================================

  const addMovement = async (movementData) => {
    if (!userInfo?.id || !primaryBranch?.id) {
      toast.error('Error de autenticación')
      return { success: false, error: 'No autenticado' }
    }

    try {
      console.log('📈 Agregando movimiento de stock:', movementData)

      const { data, error } = await suppliesService.addMovement({
        ...movementData,
        branchId: primaryBranch.id,
        processedBy: userInfo.id
      })

      if (error) {
        throw error
      }

      // Recargar suministros para actualizar stock
      await loadSupplies()
      
      // Recargar alertas por si cambió el estado de stock
      try {
        const alertsResult = await suppliesService.getAlerts()
        if (!alertsResult.error) {
          setAlerts(alertsResult.data || [])
        }
      } catch (alertError) {
        console.warn('⚠️ Error recargando alertas:', alertError)
      }

      const movementTypes = {
        'in': 'Entrada',
        'out': 'Salida', 
        'adjustment': 'Ajuste'
      }

      toast.success(`${movementTypes[movementData.movementType]} registrada exitosamente`)
      
      return { success: true, data }

    } catch (err) {
      console.error('❌ Error agregando movimiento:', err)
      const errorMessage = err.message || 'Error al registrar el movimiento'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const adjustStock = async (supplyId, newStock, reason = '') => {
    return addMovement({
      supplyId,
      movementType: 'adjustment',
      quantity: newStock,
      reason: reason || 'Ajuste de inventario'
    })
  }

  // =====================================================
  // 🚨 FUNCIONES DE ALERTAS
  // =====================================================

  const resolveAlert = async (alertId) => {
    if (!userInfo?.id) {
      toast.error('Error de autenticación')
      return { success: false, error: 'No autenticado' }
    }

    try {
      const { error } = await suppliesService.resolveAlert(alertId, userInfo.id)
      if (error) {
        throw error
      }

      // Actualizar en el estado local
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, is_resolved: true, resolved_by: userInfo.id, resolved_at: new Date() }
          : alert
      ))

      toast.success('Alerta resuelta')
      return { success: true }

    } catch (err) {
      console.error('❌ Error resolviendo alerta:', err)
      const errorMessage = err.message || 'Error al resolver la alerta'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const dismissAlert = async (alertId) => {
    return resolveAlert(alertId)
  }

  // =====================================================
  // 📋 FUNCIONES DE CATEGORÍAS Y PROVEEDORES
  // =====================================================

  const createCategory = async (categoryData) => {
    try {
      const { data, error } = await suppliesService.createCategory(categoryData)
      if (error) {
        throw error
      }

      setCategories(prev => [...prev, data])
      toast.success(`Categoría "${data.name}" creada exitosamente`)
      
      return { success: true, data }

    } catch (err) {
      console.error('❌ Error creando categoría:', err)
      const errorMessage = err.message || 'Error al crear la categoría'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const createSupplier = async (supplierData) => {
    try {
      const { data, error } = await suppliesService.createSupplier(supplierData)
      if (error) {
        throw error
      }

      setSuppliers(prev => [...prev, data])
      toast.success(`Proveedor "${data.name}" creado exitosamente`)
      
      return { success: true, data }

    } catch (err) {
      console.error('❌ Error creando proveedor:', err)
      const errorMessage = err.message || 'Error al crear el proveedor'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // =====================================================
  // 🔍 FUNCIONES DE FILTROS Y BÚSQUEDA
  // =====================================================

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      supplier: '',
      lowStock: false,
      search: ''
    })
  }

  const searchSupplies = async (searchTerm) => {
    try {
      const { data, error } = await suppliesService.searchSupplies(searchTerm)
      if (error) {
        throw error
      }
      return data || []
    } catch (err) {
      console.error('❌ Error buscando suministros:', err)
      return []
    }
  }

  // =====================================================
  // 📊 FUNCIONES DE ESTADÍSTICAS
  // =====================================================

  const getSuppliesStats = () => {
    const stats = {
      total: supplies.length,
      lowStock: supplies.filter(s => s.current_stock <= s.minimum_stock).length,
      outOfStock: supplies.filter(s => s.current_stock === 0).length,
      totalValue: supplies.reduce((sum, s) => sum + (s.current_stock * s.unit_cost), 0),
      categories: [...new Set(supplies.map(s => s.category?.name).filter(Boolean))].length,
      suppliers: [...new Set(supplies.map(s => s.supplier?.name).filter(Boolean))].length,
      alertsCount: alerts.filter(a => !a.is_resolved).length
    }

    return stats
  }

  const getLowStockSupplies = () => {
    return supplies.filter(supply => supply.current_stock <= supply.minimum_stock)
  }

  const getOutOfStockSupplies = () => {
    return supplies.filter(supply => supply.current_stock === 0)
  }

  // =====================================================
  // 🔄 FUNCIONES DE REFRESCADO
  // =====================================================

  const refreshData = async () => {
    await loadAllData()
    toast.success('Datos actualizados')
  }

  const refreshSupplies = async () => {
    await loadSupplies()
  }

  // =====================================================
  // 📱 FUNCIONES DE MODALES
  // =====================================================

  const openCreateModal = () => {
    setSelectedSupply(null)
    setShowCreateModal(true)
  }

  const openEditModal = (supply) => {
    setSelectedSupply(supply)
    setShowCreateModal(true)
  }

  const openMovementModal = (supply) => {
    setSelectedSupply(supply)
    setShowMovementModal(true)
  }

  const closeModals = () => {
    setShowCreateModal(false)
    setShowMovementModal(false)
    setSelectedSupply(null)
  }

  // =====================================================
  // 🎯 RETORNO DEL HOOK
  // =====================================================

  return {
    // Estados principales
    supplies,
    categories,
    suppliers,
    movements,
    alerts,
    loading,
    error,
    creating,
    updating,

    // Estados de filtros
    filters,

    // Estados de modales
    showCreateModal,
    showMovementModal,
    selectedSupply,

    // Funciones principales
    createSupply,
    updateSupply,
    deleteSupply,
    
    // Funciones de movimientos
    addMovement,
    adjustStock,
    loadMovements,

    // Funciones de alertas
    resolveAlert,
    dismissAlert,

    // Funciones de categorías y proveedores
    createCategory,
    createSupplier,

    // Funciones de filtros
    updateFilters,
    clearFilters,
    searchSupplies,

    // Funciones de estadísticas
    getSuppliesStats,
    getLowStockSupplies,
    getOutOfStockSupplies,

    // Funciones de refrescado
    refreshData,
    refreshSupplies,

    // Funciones de modales
    openCreateModal,
    openEditModal,
    openMovementModal,
    closeModals,

    // Información de contexto
    currentBranch: primaryBranch,
    currentUser: userInfo
  }
}