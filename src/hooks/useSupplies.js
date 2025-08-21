// src/hooks/useSupplies.js
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

  // Cargar datos iniciales
  useEffect(() => {
    if (primaryBranch?.id) {
      loadAllData()
    }
  }, [primaryBranch?.id])

  // =====================================================
  // 📊 FUNCIONES DE CARGA DE DATOS
  // =====================================================

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Cargando datos de suministros para:', primaryBranch?.name)

      const [
        suppliesResult,
        categoriesResult,
        suppliersResult,
        alertsResult
      ] = await Promise.all([
        suppliesService.getSupplies(filters),
        suppliesService.getCategories(),
        suppliesService.getSuppliers(),
        suppliesService.getAlerts()
      ])

      if (suppliesResult.error) throw suppliesResult.error
      if (categoriesResult.error) throw categoriesResult.error
      if (suppliersResult.error) throw suppliersResult.error

      setSupplies(suppliesResult.data || [])
      setCategories(categoriesResult.data || [])
      setSuppliers(suppliersResult.data || [])
      setAlerts(alertsResult.data || [])

      console.log('✅ Datos cargados:', {
        supplies: suppliesResult.data?.length || 0,
        categories: categoriesResult.data?.length || 0,
        suppliers: suppliersResult.data?.length || 0,
        alerts: alertsResult.data?.length || 0
      })

    } catch (err) {
      console.error('❌ Error cargando datos de suministros:', err)
      setError(err.message || 'Error al cargar suministros')
      toast.error('Error al cargar datos de suministros')
    } finally {
      setLoading(false)
    }
  }, [primaryBranch?.id, filters])

  const loadSupplies = async () => {
    try {
      const { data, error } = await suppliesService.getSupplies(filters)
      if (error) throw error
      setSupplies(data || [])
    } catch (err) {
      console.error('❌ Error cargando suministros:', err)
      toast.error('Error al cargar suministros')
    }
  }

  const loadMovements = async (supplyId, limit = 20) => {
    try {
      const { data, error } = await suppliesService.getMovements(supplyId, limit)
      if (error) throw error
      setMovements(data || [])
      return data || []
    } catch (err) {
      console.error('❌ Error cargando movimientos:', err)
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
      return { success: false }
    }

    try {
      setCreating(true)
      console.log('📦 Creando nuevo suministro:', supplyData)

      const { data, error } = await suppliesService.createSupply({
        ...supplyData,
        createdBy: userInfo.id
      })

      if (error) throw error

      await loadSupplies()
      toast.success(`Suministro "${data.name}" creado exitosamente`)
      
      return { success: true, data }

    } catch (err) {
      console.error('❌ Error creando suministro:', err)
      toast.error('Error al crear el suministro')
      return { success: false, error: err.message }
    } finally {
      setCreating(false)
    }
  }

  const updateSupply = async (supplyId, updateData) => {
    if (!userInfo?.id) {
      toast.error('Error de autenticación')
      return { success: false }
    }

    try {
      setUpdating(true)
      console.log('🔄 Actualizando suministro:', { supplyId, updateData })

      const { data, error } = await suppliesService.updateSupply(supplyId, updateData)
      if (error) throw error

      // Actualizar en el estado local
      setSupplies(prev => prev.map(supply => 
        supply.id === supplyId ? { ...supply, ...data } : supply
      ))

      toast.success('Suministro actualizado exitosamente')
      return { success: true, data }

    } catch (err) {
      console.error('❌ Error actualizando suministro:', err)
      toast.error('Error al actualizar el suministro')
      return { success: false, error: err.message }
    } finally {
      setUpdating(false)
    }
  }

  const deleteSupply = async (supplyId) => {
    if (!userInfo?.id) {
      toast.error('Error de autenticación')
      return { success: false }
    }

    try {
      const confirmed = window.confirm(
        '¿Estás seguro de que deseas eliminar este suministro? Esta acción no se puede deshacer.'
      )
      
      if (!confirmed) return { success: false }

      const { error } = await suppliesService.deleteSupply(supplyId)
      if (error) throw error

      // Remover del estado local
      setSupplies(prev => prev.filter(supply => supply.id !== supplyId))
      
      toast.success('Suministro eliminado exitosamente')
      return { success: true }

    } catch (err) {
      console.error('❌ Error eliminando suministro:', err)
      toast.error('Error al eliminar el suministro')
      return { success: false, error: err.message }
    }
  }

  // =====================================================
  // 📈 FUNCIONES DE MOVIMIENTOS DE STOCK
  // =====================================================

  const addMovement = async (movementData) => {
    if (!userInfo?.id || !primaryBranch?.id) {
      toast.error('Error de autenticación')
      return { success: false }
    }

    try {
      console.log('📈 Agregando movimiento de stock:', movementData)

      const { data, error } = await suppliesService.addMovement({
        ...movementData,
        branchId: primaryBranch.id,
        processedBy: userInfo.id
      })

      if (error) throw error

      // Recargar suministros para actualizar stock
      await loadSupplies()
      
      // Recargar alertas por si cambió el estado de stock
      const alertsResult = await suppliesService.getAlerts()
      if (!alertsResult.error) {
        setAlerts(alertsResult.data || [])
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
      toast.error('Error al registrar el movimiento')
      return { success: false, error: err.message }
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
      return { success: false }
    }

    try {
      const { error } = await suppliesService.resolveAlert(alertId, userInfo.id)
      if (error) throw error

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
      toast.error('Error al resolver la alerta')
      return { success: false, error: err.message }
    }
  }

  const dismissAlert = async (alertId) => {
    // Similar a resolveAlert pero sin mostrar como resuelto
    return resolveAlert(alertId)
  }

  // =====================================================
  // 📋 FUNCIONES DE CATEGORÍAS Y PROVEEDORES
  // =====================================================

  const createCategory = async (categoryData) => {
    try {
      const { data, error } = await suppliesService.createCategory(categoryData)
      if (error) throw error

      setCategories(prev => [...prev, data])
      toast.success(`Categoría "${data.name}" creada exitosamente`)
      
      return { success: true, data }

    } catch (err) {
      console.error('❌ Error creando categoría:', err)
      toast.error('Error al crear la categoría')
      return { success: false, error: err.message }
    }
  }

  const createSupplier = async (supplierData) => {
    try {
      const { data, error } = await suppliesService.createSupplier(supplierData)
      if (error) throw error

      setSuppliers(prev => [...prev, data])
      toast.success(`Proveedor "${data.name}" creado exitosamente`)
      
      return { success: true, data }

    } catch (err) {
      console.error('❌ Error creando proveedor:', err)
      toast.error('Error al crear el proveedor')
      return { success: false, error: err.message }
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
      if (error) throw error
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
      categories: [...new Set(supplies.map(s => s.category?.name))].length,
      suppliers: [...new Set(supplies.map(s => s.supplier?.name))].length,
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