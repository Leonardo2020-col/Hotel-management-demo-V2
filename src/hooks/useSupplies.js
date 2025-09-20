// src/hooks/useSupplies.js - VERSIÓN ACTUALIZADA CON BRANCH_ID
import { useState, useEffect, useCallback } from 'react'
import { suppliesService, snackService } from '../lib/supabase'
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
  
  // Estados para snacks
  const [snacks, setSnacks] = useState([])
  const [snackCategories, setSnackCategories] = useState([])
  
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
  // FUNCIONES DE CARGA DE DATOS
  // =====================================================

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!primaryBranch?.id) {
        console.warn('No primary branch found, skipping data load')
        setLoading(false)
        return
      }

      console.log('Cargando datos de suministros para sucursal:', primaryBranch.name)

      // Cargar todos los datos en paralelo
      const [
        suppliesResult,
        categoriesResult,
        suppliersResult,
        alertsResult,
        snackItemsResult,
        snackCategoriesResult
      ] = await Promise.allSettled([
        suppliesService.getSuppliesByBranch(primaryBranch.id, filters),
        suppliesService.getCategories(),
        suppliesService.getSuppliers(),
        suppliesService.getAlertsByBranch(primaryBranch.id),
        snackService.getSnackItemsByBranch(primaryBranch.id),
        snackService.getSnackCategories()
      ])

      // Procesar resultados
      if (suppliesResult.status === 'fulfilled' && !suppliesResult.value.error) {
        setSupplies(suppliesResult.value.data || [])
        console.log('Suministros cargados:', suppliesResult.value.data?.length || 0)
      } else {
        console.warn('Error cargando suministros:', suppliesResult.reason || suppliesResult.value?.error)
        setSupplies([])
      }

      if (categoriesResult.status === 'fulfilled' && !categoriesResult.value.error) {
        setCategories(categoriesResult.value.data || [])
      } else {
        setCategories([])
      }

      if (suppliersResult.status === 'fulfilled' && !suppliersResult.value.error) {
        setSuppliers(suppliersResult.value.data || [])
      } else {
        setSuppliers([])
      }

      if (alertsResult.status === 'fulfilled' && !alertsResult.value.error) {
        setAlerts(alertsResult.value.data || [])
      } else {
        setAlerts([])
      }

      if (snackItemsResult.status === 'fulfilled' && !snackItemsResult.value.error) {
        setSnacks(snackItemsResult.value.data || [])
        console.log('Snacks cargados:', snackItemsResult.value.data?.length || 0)
      } else {
        console.warn('Error cargando snacks:', snackItemsResult.reason || snackItemsResult.value?.error)
        setSnacks([])
      }

      if (snackCategoriesResult.status === 'fulfilled' && !snackCategoriesResult.value.error) {
        setSnackCategories(snackCategoriesResult.value.data || [])
      } else {
        setSnackCategories([])
      }

      console.log('Datos cargados exitosamente para:', primaryBranch.name)

    } catch (err) {
      console.error('Error crítico cargando datos:', err)
      setError(err.message || 'Error al cargar datos de inventario')
      toast.error('Error al cargar datos de inventario')
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
      if (!primaryBranch?.id) return
      
      console.log('Recargando suministros con filtros:', filters)
      const { data, error } = await suppliesService.getSuppliesByBranch(primaryBranch.id, filters)
      
      if (error) {
        console.warn('Error cargando suministros:', error)
        toast.error('Error al cargar suministros')
        return
      }
      setSupplies(data || [])
    } catch (err) {
      console.error('Error en loadSupplies:', err)
      toast.error('Error al cargar suministros')
    }
  }

  const loadSnacks = async () => {
    try {
      if (!primaryBranch?.id) return
      
      console.log('Recargando snacks...')
      const { data, error } = await snackService.getSnackItemsByBranch(primaryBranch.id)
      
      if (error) {
        console.warn('Error cargando snacks:', error)
        toast.error('Error al cargar snacks')
        return
      }
      setSnacks(data || [])
    } catch (err) {
      console.error('Error en loadSnacks:', err)
      toast.error('Error al cargar snacks')
    }
  }

  const loadMovements = async (supplyId, limit = 20) => {
    try {
      const { data, error } = await suppliesService.getMovements(supplyId, limit)
      if (error) {
        console.warn('Error cargando movimientos:', error)
        toast.error('Error al cargar movimientos')
        return []
      }
      setMovements(data || [])
      return data || []
    } catch (err) {
      console.error('Error en loadMovements:', err)
      toast.error('Error al cargar movimientos')
      return []
    }
  }

  // =====================================================
  // FUNCIONES DE GESTIÓN DE SUMINISTROS
  // =====================================================

  const createSupply = async (supplyData) => {
    if (!userInfo?.id || !primaryBranch?.id) {
      toast.error('Error de autenticación o sucursal')
      return { success: false, error: 'No autenticado o sin sucursal' }
    }

    try {
      setCreating(true)
      console.log('Creando nuevo suministro:', supplyData)

      const { data, error } = await suppliesService.createSupply({
        ...supplyData,
        branchId: primaryBranch.id,
        createdBy: userInfo.id
      })

      if (error) {
        throw error
      }

      await loadSupplies()
      toast.success(`Suministro "${data.name}" creado exitosamente`)
      
      return { success: true, data }

    } catch (err) {
      console.error('Error creando suministro:', err)
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
      console.log('Actualizando suministro:', { supplyId, updateData })

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
      console.error('Error actualizando suministro:', err)
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
      console.error('Error eliminando suministro:', err)
      const errorMessage = err.message || 'Error al eliminar el suministro'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // =====================================================
  // FUNCIONES PARA GESTIÓN DE SNACKS
  // =====================================================

  const createSnack = async (snackData) => {
    if (!userInfo?.id || !primaryBranch?.id) {
      toast.error('Error de autenticación o sucursal')
      return { success: false, error: 'No autenticado o sin sucursal' }
    }

    try {
      console.log('Creando nuevo snack:', snackData)

      const { data, error } = await snackService.createSnackItem({
        ...snackData,
        branchId: primaryBranch.id
      })

      if (error) {
        throw error
      }

      await loadSnacks()
      toast.success(`Snack "${data.name}" creado exitosamente`)
      
      return { success: true, data }

    } catch (err) {
      console.error('Error creando snack:', err)
      const errorMessage = err.message || 'Error al crear el snack'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const updateSnack = async (snackId, updateData) => {
    try {
      console.log('Actualizando snack:', { snackId, updateData })

      const { data, error } = await snackService.updateSnackItem(snackId, updateData)
      if (error) {
        throw error
      }

      // Actualizar en el estado local
      setSnacks(prev => prev.map(snack => 
        snack.id === snackId ? { ...snack, ...data } : snack
      ))

      toast.success('Snack actualizado exitosamente')
      return { success: true, data }

    } catch (err) {
      console.error('Error actualizando snack:', err)
      const errorMessage = err.message || 'Error al actualizar el snack'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const updateSnackStock = async (snackId, newStock, reason = 'Ajuste manual') => {
    try {
      console.log('Actualizando stock de snack:', { snackId, newStock, reason })

      const { data, error } = await snackService.updateSnackStock(snackId, newStock)
      if (error) {
        throw error
      }

      // Actualizar en el estado local
      setSnacks(prev => prev.map(snack => 
        snack.id === snackId ? { ...snack, stock: newStock } : snack
      ))

      toast.success('Stock de snack actualizado exitosamente')
      return { success: true, data }

    } catch (err) {
      console.error('Error actualizando stock de snack:', err)
      const errorMessage = err.message || 'Error al actualizar stock del snack'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const processSnackConsumption = async (snacksConsumed) => {
    try {
      console.log('Procesando consumo de snacks:', snacksConsumed.length, 'items')

      const result = await snackService.processSnackConsumption(snacksConsumed)
      if (result.error) {
        throw result.error
      }

      // Recargar snacks para reflejar el nuevo stock
      await loadSnacks()

      console.log('Consumo de snacks procesado exitosamente')
      return { success: true, data: result.data }

    } catch (err) {
      console.error('Error procesando consumo de snacks:', err)
      const errorMessage = err.message || 'Error al procesar consumo de snacks'
      return { success: false, error: errorMessage }
    }
  }

  // =====================================================
  // FUNCIONES DE MOVIMIENTOS DE STOCK
  // =====================================================

  const addMovement = async (movementData) => {
    if (!userInfo?.id || !primaryBranch?.id) {
      toast.error('Error de autenticación')
      return { success: false, error: 'No autenticado' }
    }

    try {
      console.log('Agregando movimiento de stock:', movementData)

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
        const alertsResult = await suppliesService.getAlertsByBranch(primaryBranch.id)
        if (!alertsResult.error) {
          setAlerts(alertsResult.data || [])
        }
      } catch (alertError) {
        console.warn('Warning recargando alertas:', alertError)
      }

      const movementTypes = {
        'in': 'Entrada',
        'out': 'Salida', 
        'adjustment': 'Ajuste'
      }

      toast.success(`${movementTypes[movementData.movementType]} registrada exitosamente`)
      
      return { success: true, data }

    } catch (err) {
      console.error('Error agregando movimiento:', err)
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
  // FUNCIONES DE ALERTAS
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
      console.error('Error resolviendo alerta:', err)
      const errorMessage = err.message || 'Error al resolver la alerta'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const dismissAlert = async (alertId) => {
    return resolveAlert(alertId)
  }

  // =====================================================
  // FUNCIONES DE CATEGORÍAS Y PROVEEDORES
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
      console.error('Error creando categoría:', err)
      const errorMessage = err.message || 'Error al crear la categoría'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const createSnackCategory = async (categoryData) => {
    try {
      const { data, error } = await snackService.createSnackCategory(categoryData)
      if (error) {
        throw error
      }

      setSnackCategories(prev => [...prev, data])
      toast.success(`Categoría de snack "${data.name}" creada exitosamente`)
      
      return { success: true, data }

    } catch (err) {
      console.error('Error creando categoría de snack:', err)
      const errorMessage = err.message || 'Error al crear la categoría de snack'
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
      console.error('Error creando proveedor:', err)
      const errorMessage = err.message || 'Error al crear el proveedor'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // =====================================================
  // FUNCIONES DE FILTROS Y BÚSQUEDA
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
      console.error('Error buscando suministros:', err)
      return []
    }
  }

  const searchSnacks = async (searchTerm) => {
    try {
      const { data, error } = await snackService.searchSnacks(searchTerm)
      if (error) {
        throw error
      }
      return data || []
    } catch (err) {
      console.error('Error buscando snacks:', err)
      return []
    }
  }

  // =====================================================
  // FUNCIONES DE ESTADÍSTICAS
  // =====================================================

  const getSuppliesStats = () => {
    // Estadísticas de suministros regulares
    const suppliesStats = {
      total: supplies.length,
      lowStock: supplies.filter(s => s.current_stock <= s.minimum_stock).length,
      outOfStock: supplies.filter(s => s.current_stock === 0).length,
      totalValue: supplies.reduce((sum, s) => sum + (s.current_stock * s.unit_cost), 0),
      categories: [...new Set(supplies.map(s => s.category?.name).filter(Boolean))].length,
      suppliers: [...new Set(supplies.map(s => s.supplier?.name).filter(Boolean))].length,
      alertsCount: alerts.filter(a => !a.is_resolved).length
    }

    // Estadísticas de snacks
    const snacksStats = {
      total: snacks.length,
      lowStock: snacks.filter(s => s.stock <= s.minimum_stock).length,
      outOfStock: snacks.filter(s => s.stock === 0).length,
      totalValue: snacks.reduce((sum, s) => sum + (s.stock * (s.cost || 0)), 0),
      categories: [...new Set(snacks.map(s => s.category_name).filter(Boolean))].length
    }

    // Combinar estadísticas
    return {
      ...suppliesStats,
      // Totales combinados
      totalItems: suppliesStats.total + snacksStats.total,
      totalCombinedValue: suppliesStats.totalValue + snacksStats.totalValue,
      totalCombinedCategories: suppliesStats.categories + snacksStats.categories,
      
      // Estadísticas específicas de snacks
      snacks: snacksStats
    }
  }

  const getLowStockSupplies = () => {
    return supplies.filter(supply => supply.current_stock <= supply.minimum_stock)
  }

  const getOutOfStockSupplies = () => {
    return supplies.filter(supply => supply.current_stock === 0)
  }

  const getLowStockSnacks = () => {
    return snacks.filter(snack => snack.stock <= snack.minimum_stock)
  }

  const getOutOfStockSnacks = () => {
    return snacks.filter(snack => snack.stock === 0)
  }

  const getCombinedAlerts = () => {
    const suppliesAlerts = alerts
    
    // Generar alertas virtuales para snacks con stock bajo
    const snacksAlerts = snacks
      .filter(snack => snack.stock <= snack.minimum_stock)
      .map(snack => ({
        id: `snack-${snack.id}`,
        alert_type: snack.stock === 0 ? 'out_of_stock' : 'low_stock',
        message: snack.stock === 0 
          ? `Snack agotado: ${snack.name}` 
          : `Snack con stock bajo: ${snack.name} (${snack.stock}/${snack.minimum_stock})`,
        is_resolved: false,
        created_at: new Date().toISOString(),
        supply: {
          id: snack.id,
          name: snack.name,
          current_stock: snack.stock,
          minimum_stock: snack.minimum_stock
        },
        isSnackAlert: true
      }))

    return [...suppliesAlerts, ...snacksAlerts]
  }

  // =====================================================
  // FUNCIONES DE REFRESCADO
  // =====================================================

  const refreshData = async () => {
    await loadAllData()
    toast.success('Datos actualizados')
  }

  const refreshSupplies = async () => {
    await loadSupplies()
  }

  const refreshSnacks = async () => {
    await loadSnacks()
  }

  // =====================================================
  // FUNCIONES DE MODALES
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
  // RETORNO DEL HOOK
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

    // Estados de snacks
    snacks,
    snackCategories,

    // Estados de filtros
    filters,

    // Estados de modales
    showCreateModal,
    showMovementModal,
    selectedSupply,

    // Funciones principales de suministros
    createSupply,
    updateSupply,
    deleteSupply,
    
    // Funciones de snacks
    createSnack,
    updateSnack,
    updateSnackStock,
    processSnackConsumption,
    
    // Funciones de movimientos
    addMovement,
    adjustStock,
    loadMovements,

    // Funciones de alertas
    resolveAlert,
    dismissAlert,

    // Funciones de categorías y proveedores
    createCategory,
    createSnackCategory,
    createSupplier,

    // Funciones de filtros
    updateFilters,
    clearFilters,
    searchSupplies,
    searchSnacks,

    // Funciones de estadísticas
    getSuppliesStats,
    getLowStockSupplies,
    getOutOfStockSupplies,
    getLowStockSnacks,
    getOutOfStockSnacks,
    getCombinedAlerts,

    // Funciones de refrescado
    refreshData,
    refreshSupplies,
    refreshSnacks,

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