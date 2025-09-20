// src/pages/Supplies.jsx - VERSIÓN FINAL CON BRANCH SUPPORT
import React, { useState, useEffect } from 'react'
import { RefreshCw, Plus, AlertTriangle, Eye, EyeOff, Coffee } from 'lucide-react'
import { useSupplies } from '../hooks/useSupplies'
import { useAuth } from '../context/AuthContext'
import Button from '../components/common/Button'

// Importar componentes
import StatsCards from '../components/supplies/StatsCards'
import SuppliesFilters from '../components/supplies/SuppliesFilters'
import SuppliesTable from '../components/supplies/SuppliesTable'
import SupplyFormModal from '../components/supplies/SupplyFormModal'
import MovementModal from '../components/supplies/MovementModal'
import AlertsPanel from '../components/supplies/AlertsPanel'
import SnackFormModal from '../components/supplies/SnackFormModal'

import toast from 'react-hot-toast'

const Supplies = () => {
  const { primaryBranch } = useAuth()
  
  const {
    // Estados principales
    supplies,
    categories,
    suppliers,
    alerts,
    loading,
    error,
    
    // Estados de snacks
    snacks,
    snackCategories,
    
    // Funciones de gestión
    getSuppliesStats,
    getLowStockSupplies,
    getOutOfStockSupplies,
    refreshData,
    updateFilters,
    clearFilters,
    filters,
    
    // Funciones de suministros
    createSupply,
    updateSupply,
    deleteSupply,
    addMovement,
    
    // Funciones de snacks
    createSnack,
    updateSnack,
    updateSnackStock,
    
    // Funciones de alertas
    resolveAlert,
    dismissAlert,
    
    // Funciones de categorías
    createCategory,
    createSnackCategory,
    createSupplier,
    
    // Funciones de modales
    openCreateModal,
    openEditModal,
    openMovementModal,
    closeModals,
    showCreateModal,
    showMovementModal,
    selectedSupply
  } = useSupplies()

  // Estados locales para la página
  const [currentView, setCurrentView] = useState('inventory') // 'inventory', 'alerts', 'snacks'
  const [showResolvedAlerts, setShowResolvedAlerts] = useState(false)
  
  // Estados para el modal de snacks
  const [showSnackModal, setShowSnackModal] = useState(false)
  const [selectedSnack, setSelectedSnack] = useState(null)

  // Mostrar información de la sucursal actual si no hay sucursal primaria
  useEffect(() => {
    if (!primaryBranch?.id) {
      console.warn('No hay sucursal primaria configurada')
    }
  }, [primaryBranch])

  // ✅ Función para manejar creación de snacks
  const handleCreateSnack = async (snackData) => {
    try {
      console.log('🍿 Creando nuevo snack:', snackData)
      
      const result = await createSnack({
        name: snackData.name,
        categoryId: snackData.categoryId,
        price: snackData.price,
        cost: snackData.cost,
        stock: snackData.stock,
        minimumStock: snackData.minimumStock
      })
      
      if (result.success) {
        closeSnackModal()
        toast.success('Snack creado exitosamente')
      } else {
        toast.error(result.error || 'Error al crear snack')
      }
      
      return result
    } catch (error) {
      console.error('❌ Error creando snack:', error)
      toast.error('Error al crear snack')
      return { success: false, error }
    }
  }

  // ✅ Función para manejar actualización de snacks
  const handleUpdateSnack = async (snackId, updateData) => {
    try {
      console.log('🔄 Actualizando snack:', { snackId, updateData })
      
      const result = await updateSnack(snackId, updateData)
      
      if (result.success) {
        closeSnackModal()
        toast.success('Snack actualizado exitosamente')
      } else {
        toast.error(result.error || 'Error al actualizar snack')
      }
      
      return result
    } catch (error) {
      console.error('❌ Error actualizando snack:', error)
      toast.error('Error al actualizar snack')
      return { success: false, error }
    }
  }

  // ✅ Función para manejar ajuste de stock de snacks
  const handleUpdateSnackStock = async (snackId, newStock, reason = 'Ajuste manual de stock') => {
    try {
      console.log('🔄 Updating snack stock:', { snackId, newStock, reason })
      
      const result = await updateSnackStock(snackId, newStock, reason)
      
      if (result.success) {
        toast.success('Stock de snack actualizado exitosamente')
      } else {
        toast.error(result.error || 'Error al actualizar stock del snack')
      }
      
      return result
    } catch (error) {
      console.error('❌ Error updating snack stock:', error)
      toast.error('Error al actualizar stock del snack')
      return { success: false, error }
    }
  }

  // ✅ Función para crear categoría de snack
  const handleCreateSnackCategory = async (categoryData) => {
    try {
      console.log('🏷️ Creando categoría de snack:', categoryData)
      
      const result = await createSnackCategory(categoryData)
      
      if (result.success) {
        return { success: true, data: result.data }
      }
      
      return result
    } catch (error) {
      console.error('❌ Error creando categoría de snack:', error)
      return { success: false, error }
    }
  }

  // Funciones para abrir/cerrar modales de snacks
  const openCreateSnackModal = () => {
    setSelectedSnack(null)
    setShowSnackModal(true)
  }

  const openEditSnackModal = (snack) => {
    setSelectedSnack(snack)
    setShowSnackModal(true)
  }

  const closeSnackModal = () => {
    setShowSnackModal(false)
    setSelectedSnack(null)
  }

  // ✅ Combinar suministros y snacks para las estadísticas
  const getCombinedStats = () => {
    const suppliesStats = getSuppliesStats()
    
    // Estadísticas de snacks
    const snacksLowStock = snacks.filter(s => s.stock <= s.minimum_stock).length
    const snacksOutOfStock = snacks.filter(s => s.stock === 0).length
    const snacksValue = snacks.reduce((sum, s) => sum + (s.stock * (s.cost || 0)), 0)
    
    return {
      ...suppliesStats,
      total: suppliesStats.total + snacks.length,
      totalValue: suppliesStats.totalValue + snacksValue,
      categories: suppliesStats.categories + snackCategories.length,
      // Mantener los contadores originales
      lowStock: suppliesStats.lowStock,
      outOfStock: suppliesStats.outOfStock,
      // Agregar stats específicos de snacks
      snacksTotal: snacks.length,
      snacksLowStock,
      snacksOutOfStock,
      snacksValue
    }
  }

  // ✅ Convertir snacks al formato de suministros para mostrar en la tabla
  const convertSnacksToSupplyFormat = () => {
    return snacks.map(snack => ({
      id: snack.id,
      name: snack.name,
      category: { 
        id: snack.category_id, 
        name: snack.category_name || 'Snacks' 
      },
      supplier: null,
      unit_of_measure: 'unidad',
      minimum_stock: snack.minimum_stock,
      current_stock: snack.stock,
      unit_cost: snack.cost || 0,
      sku: null,
      is_active: snack.is_active,
      created_at: snack.created_at,
      updated_at: snack.updated_at,
      // Campos calculados
      stockStatus: snack.stock_status,
      totalValue: snack.stock * (snack.cost || 0),
      needsRestock: snack.stock <= snack.minimum_stock,
      isOutOfStock: snack.stock === 0,
      stockPercentage: snack.stock_percentage,
      // Marcadores especiales
      isSnack: true,
      price: snack.price
    }))
  }

  // ✅ Obtener items de inventario según la vista actual
  const getAllInventoryItems = () => {
    if (currentView === 'snacks') {
      return convertSnacksToSupplyFormat()
    } else {
      return supplies
    }
  }

  const stats = getCombinedStats()
  const lowStockSupplies = getLowStockSupplies()
  const outOfStockSupplies = getOutOfStockSupplies()
  const inventoryItems = getAllInventoryItems()

  // Funciones de manejo de suministros
  const handleCreateSupply = async (supplyData) => {
    const result = await createSupply(supplyData)
    if (result.success) {
      closeModals()
      toast.success('Suministro creado exitosamente')
    }
    return result
  }

  const handleUpdateSupply = async (supplyId, updateData) => {
    const result = await updateSupply(supplyId, updateData)
    if (result.success) {
      closeModals()
      toast.success('Suministro actualizado exitosamente')
    }
    return result
  }

  const handleDeleteSupply = async (supplyId) => {
    const confirmed = window.confirm('¿Estás seguro de que deseas eliminar este suministro?')
    if (!confirmed) return

    const result = await deleteSupply(supplyId)
    if (result.success) {
      toast.success('Suministro eliminado exitosamente')
    }
    return result
  }

  const handleAddMovement = async (movementData) => {
    const result = await addMovement(movementData)
    if (result.success) {
      closeModals()
      toast.success('Movimiento registrado exitosamente')
    }
    return result
  }

  // Funciones de manejo de alertas
  const handleResolveAlert = async (alertId) => {
    const result = await resolveAlert(alertId)
    if (result.success) {
      toast.success('Alerta resuelta')
    }
    return result
  }

  const handleDismissAlert = async (alertId) => {
    const result = await dismissAlert(alertId)
    if (result.success) {
      toast.success('Alerta descartada')
    }
    return result
  }

  // Funciones de categorías y proveedores
  const handleCreateCategory = async (categoryData) => {
    const result = await createCategory(categoryData)
    return result
  }

  const handleCreateSupplier = async (supplierData) => {
    const result = await createSupplier(supplierData)
    return result
  }

  // Verificar si hay sucursal configurada
  if (!primaryBranch?.id) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-600 mb-4">Sucursal no configurada</h2>
            <p className="text-gray-600 mb-6">
              No se ha encontrado una sucursal primaria para tu usuario. El inventario se gestiona por sucursal.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-yellow-800 mb-2">💡 Para configurar tu sucursal:</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Contacta al administrador del sistema</li>
                <li>• Verifica que tu usuario esté asignado a una sucursal</li>
                <li>• Asegúrate de que tengas una sucursal marcada como "primaria"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error al cargar inventario</h2>
            <p className="text-gray-600 mb-4">Sucursal: {primaryBranch.name}</p>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-4">
              <Button
                variant="primary"
                onClick={refreshData}
                icon={RefreshCw}
                disabled={loading}
              >
                {loading ? 'Recargando...' : 'Reintentar'}
              </Button>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-yellow-800 mb-2">💡 Posibles soluciones:</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Verifica que las tablas tengan la columna branch_id</li>
                  <li>• Ejecuta el script de corrección de suministros por sucursal</li>
                  <li>• Revisa los permisos de Row Level Security (RLS)</li>
                  <li>• Comprueba la conexión a internet</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Inventario - {primaryBranch.name}</h1>
            <p className="text-gray-600">Gestión de suministros y snacks</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando inventario para {primaryBranch.name}...</p>
            <p className="text-sm text-gray-500 mt-2">
              Obteniendo suministros, snacks, categorías y alertas...
            </p>
          </div>
        </div>
      </div>
    )
  }

  const unresolvedAlertsCount = alerts.filter(a => !a.is_resolved).length

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header con información de sucursal */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Inventario - {primaryBranch.name}
          </h1>
          <p className="text-gray-600">Gestión de suministros y snacks por sucursal</p>
          <div className="mt-2 text-sm text-gray-500">
            📍 {primaryBranch.address || 'Dirección no disponible'}
          </div>
        </div>

        {/* Navegación de pestañas */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setCurrentView('inventory')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  currentView === 'inventory'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Suministros
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {supplies.length}
                </span>
              </button>
              
              <button
                onClick={() => setCurrentView('snacks')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  currentView === 'snacks'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Coffee className="w-4 h-4 mr-1" />
                Snacks Check-in
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {snacks.length}
                </span>
              </button>
              
              <button
                onClick={() => setCurrentView('alerts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  currentView === 'alerts'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Alertas
                {unresolvedAlertsCount > 0 && (
                  <span className="ml-2 bg-orange-100 text-orange-600 py-0.5 px-2 rounded-full text-xs">
                    {unresolvedAlertsCount}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Stats Cards combinadas */}
        <div className="mb-8">
          <StatsCards 
            stats={stats}
            lowStockCount={lowStockSupplies.length}
            outOfStockCount={outOfStockSupplies.length}
          />
          
          {/* Stats adicionales de snacks */}
          {stats.snacksTotal > 0 && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Coffee className="w-5 h-5 text-green-600" />
                  <div>
                    <h3 className="text-sm font-semibold text-green-800">
                      Inventario de Snacks para Check-in
                    </h3>
                    <p className="text-sm text-green-700">
                      {stats.snacksTotal} items • Stock bajo: {stats.snacksLowStock} • Agotados: {stats.snacksOutOfStock}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-800">
                    S/ {stats.snacksValue.toFixed(2)}
                  </div>
                  <div className="text-xs text-green-600">Valor inventario snacks</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alerta global si hay stock bajo */}
        {unresolvedAlertsCount > 0 && (currentView === 'inventory' || currentView === 'snacks') && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <div>
                  <h3 className="text-sm font-semibold text-orange-800">
                    {unresolvedAlertsCount} Alerta{unresolvedAlertsCount !== 1 ? 's' : ''} de Inventario
                  </h3>
                  <p className="text-sm text-orange-700">
                    Hay productos que requieren atención inmediata por stock bajo o agotado.
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => setCurrentView('alerts')}
                >
                  Ver Alertas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({ lowStock: true })}
                >
                  Filtrar Stock Bajo
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        {(currentView === 'inventory' || currentView === 'snacks') ? (
          <div className="space-y-6">
            {/* Filtros - Solo para suministros regulares */}
            {currentView === 'inventory' && (
              <SuppliesFilters
                filters={filters}
                categories={categories}
                suppliers={suppliers}
                onFiltersChange={updateFilters}
                onClearFilters={clearFilters}
                loading={loading}
              />
            )}

            {/* Header del inventario con botón de crear */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {currentView === 'snacks' ? (
                    <div className="flex items-center">
                      <Coffee className="w-5 h-5 mr-2 text-green-600" />
                      Inventario de Snacks para Check-in
                    </div>
                  ) : (
                    'Inventario de Suministros'
                  )}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {inventoryItems.length} artículos registrados en {primaryBranch.name}
                  {currentView === 'snacks' && (
                    <span className="text-green-600 ml-2">
                      • Se consumen automáticamente en check-ins
                    </span>
                  )}
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  icon={RefreshCw}
                  onClick={refreshData}
                  disabled={loading}
                >
                  {loading ? 'Actualizando...' : 'Actualizar'}
                </Button>
                
                {/* Botón para crear suministros */}
                {currentView === 'inventory' && (
                  <Button
                    variant="primary"
                    icon={Plus}
                    onClick={openCreateModal}
                  >
                    Nuevo Suministro
                  </Button>
                )}
                
                {/* Botón para crear snacks */}
                {currentView === 'snacks' && (
                  <Button
                    variant="success"
                    icon={Plus}
                    onClick={openCreateSnackModal}
                  >
                    Nuevo Snack
                  </Button>
                )}
              </div>
            </div>

            {/* Tabla con soporte completo para snacks */}
            <SuppliesTable
              supplies={inventoryItems}
              loading={loading}
              onEdit={currentView === 'snacks' ? null : openEditModal}
              onEditSnack={currentView === 'snacks' ? openEditSnackModal : null}
              onDelete={currentView === 'snacks' ? null : handleDeleteSupply}
              onAddMovement={currentView === 'snacks' ? null : openMovementModal}
              onAdjustStock={async (itemId, newStock, reason) => {
                if (currentView === 'snacks') {
                  return handleUpdateSnackStock(itemId, newStock, reason)
                } else {
                  return handleAddMovement({
                    supplyId: itemId,
                    movementType: 'adjustment',
                    quantity: newStock,
                    reason: reason || 'Ajuste de inventario'
                  })
                }
              }}
              currentUser={null}
              isSnacksView={currentView === 'snacks'}
            />

            {/* Información adicional para snacks */}
            {currentView === 'snacks' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <Coffee className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">
                      ¿Cómo funciona el inventario de snacks?
                    </h3>
                    <div className="text-sm text-blue-700 space-y-2">
                      <p>
                        <strong>✅ Consumo Automático:</strong> Cuando se realiza un check-in y el huésped 
                        selecciona snacks, el stock se reduce automáticamente.
                      </p>
                      <p>
                        <strong>🔄 Ajuste Manual:</strong> Puedes ajustar el stock manualmente usando 
                        el botón "Ajustar Stock" en cada fila.
                      </p>
                      <p>
                        <strong>⚠️ Alertas:</strong> Se generan alertas automáticas cuando el stock 
                        está por debajo del mínimo configurado.
                      </p>
                      <p>
                        <strong>📊 Seguimiento:</strong> Todos los consumos quedan registrados en 
                        la tabla quick_checkins con el detalle de snacks consumidos.
                      </p>
                      <p>
                        <strong>🏢 Por Sucursal:</strong> Cada sucursal maneja su propio inventario 
                        de snacks de forma independiente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Vista de Alertas */
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Centro de Alertas - {primaryBranch.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Gestión de alertas de inventario
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  icon={showResolvedAlerts ? EyeOff : Eye}
                  onClick={() => setShowResolvedAlerts(!showResolvedAlerts)}
                >
                  {showResolvedAlerts ? 'Ocultar Resueltas' : 'Mostrar Resueltas'}
                </Button>
                
                <Button
                  variant="outline"
                  icon={RefreshCw}
                  onClick={refreshData}
                  disabled={loading}
                >
                  Actualizar
                </Button>
              </div>
            </div>

            <AlertsPanel
              alerts={showResolvedAlerts ? alerts : alerts.filter(a => !a.is_resolved)}
              supplies={supplies}
              onResolve={handleResolveAlert}
              onDismiss={handleDismissAlert}
              loading={loading}
            />
          </div>
        )}

        {/* MODALES */}
        
        {/* Modal de crear/editar suministro */}
        <SupplyFormModal
          isOpen={showCreateModal}
          onClose={closeModals}
          onSubmit={selectedSupply ? handleUpdateSupply : handleCreateSupply}
          supply={selectedSupply}
          categories={categories}
          suppliers={suppliers}
          onCreateCategory={handleCreateCategory}
          onCreateSupplier={handleCreateSupplier}
          loading={loading}
        />

        {/* Modal de movimiento de stock */}
        <MovementModal
          isOpen={showMovementModal}
          onClose={closeModals}
          onSubmit={handleAddMovement}
          supply={selectedSupply}
          loading={loading}
        />

        {/* Modal de crear/editar snack */}
        <SnackFormModal
          isOpen={showSnackModal}
          onClose={closeSnackModal}
          onSubmit={selectedSnack ? handleUpdateSnack : handleCreateSnack}
          snack={selectedSnack}
          categories={snackCategories}
          onCreateCategory={handleCreateSnackCategory}
          loading={loading}
        />

        {/* Debug Info para desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <details>
              <summary className="cursor-pointer font-medium text-gray-700">
                🐛 Debug Info (Development)
              </summary>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p><strong>Current Branch:</strong> {primaryBranch.name} ({primaryBranch.id})</p>
                <p><strong>Current View:</strong> {currentView}</p>
                <p><strong>Supplies loaded:</strong> {supplies.length}</p>
                <p><strong>Snacks loaded:</strong> {snacks.length}</p>
                <p><strong>Categories loaded:</strong> {categories.length}</p>
                <p><strong>Snack Categories loaded:</strong> {snackCategories.length}</p>
                <p><strong>Suppliers loaded:</strong> {suppliers.length}</p>
                <p><strong>Alerts count:</strong> {alerts.length}</p>
                <p><strong>Unresolved alerts:</strong> {unresolvedAlertsCount}</p>
                <p><strong>Inventory items shown:</strong> {inventoryItems.length}</p>
                <p><strong>Combined stats:</strong> Total: {stats.total}, Value: S/ {stats.totalValue?.toFixed(2)}</p>
                <p><strong>Current filters:</strong> {JSON.stringify(filters)}</p>
                <p><strong>Loading state:</strong> {loading ? 'True' : 'False'}</p>
                <p><strong>Error state:</strong> {error || 'None'}</p>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}

export default Supplies