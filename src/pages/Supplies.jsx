// src/pages/Supplies.jsx - VERSIÓN COMPLETA CON COMPONENTES INTEGRADOS
import React, { useState } from 'react'
import { RefreshCw, Plus, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { useSupplies } from '../hooks/useSupplies'
import Button from '../components/common/Button'

// Importar componentes de suministros
import StatsCards from '../components/supplies/StatsCards'
import SuppliesFilters from '../components/supplies/SuppliesFilters'
import SuppliesTable from '../components/supplies/SuppliesTable'
import SupplyFormModal from '../components/supplies/SupplyFormModal'
import MovementModal from '../components/supplies/MovementModal'
import AlertsPanel from '../components/supplies/AlertsPanel'

import toast from 'react-hot-toast'

const Supplies = () => {
  const {
    supplies,
    categories,
    suppliers,
    alerts,
    loading,
    error,
    getSuppliesStats,
    getLowStockSupplies,
    getOutOfStockSupplies,
    refreshData,
    updateFilters,
    clearFilters,
    filters,
    createSupply,
    updateSupply,
    deleteSupply,
    addMovement,
    resolveAlert,
    dismissAlert,
    createCategory,
    createSupplier,
    openCreateModal,
    openEditModal,
    openMovementModal,
    closeModals,
    showCreateModal,
    showMovementModal,
    selectedSupply
  } = useSupplies()

  // Estados locales para la página
  const [currentView, setCurrentView] = useState('inventory') // 'inventory', 'alerts'
  const [showResolvedAlerts, setShowResolvedAlerts] = useState(false)

  const stats = getSuppliesStats()
  const lowStockSupplies = getLowStockSupplies()
  const outOfStockSupplies = getOutOfStockSupplies()

  // ✅ FUNCIONES DE MANEJO DE SUMINISTROS
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

  // ✅ FUNCIONES DE MANEJO DE ALERTAS
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

  // ✅ FUNCIONES DE CATEGORÍAS Y PROVEEDORES
  const handleCreateCategory = async (categoryData) => {
    const result = await createCategory(categoryData)
    return result
  }

  const handleCreateSupplier = async (supplierData) => {
    const result = await createSupplier(supplierData)
    return result
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error al cargar datos de suministros</h2>
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
                  <li>• Verifica que las tablas de suministros existan en Supabase</li>
                  <li>• Ejecuta el script de "Completar Base de Datos - Suministros"</li>
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
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Suministros e Inventario</h1>
            <p className="text-gray-600">Gestión de productos y stock del hotel</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando inventario...</p>
            <p className="text-sm text-gray-500 mt-2">
              Obteniendo suministros, categorías y alertas...
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
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Suministros e Inventario</h1>
          <p className="text-gray-600">Gestión completa de productos y stock del hotel</p>
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
                Inventario
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {supplies.length}
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

        {/* Stats Cards - Siempre visible */}
        <div className="mb-8">
          <StatsCards 
            stats={stats}
            lowStockCount={lowStockSupplies.length}
            outOfStockCount={outOfStockSupplies.length}
          />
        </div>

        {/* Alerta global si hay stock bajo */}
        {unresolvedAlertsCount > 0 && currentView === 'inventory' && (
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

        {/* Contenido principal según la vista */}
        {currentView === 'inventory' ? (
          <div className="space-y-6">
            {/* Filtros */}
            <SuppliesFilters
              filters={filters}
              categories={categories}
              suppliers={suppliers}
              onFiltersChange={updateFilters}
              onClearFilters={clearFilters}
              loading={loading}
            />

            {/* Header del inventario con botón de crear */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Inventario de Suministros
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {supplies.length} artículos registrados
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  icon={RefreshCw}
                  onClick={refreshData}
                  disabled={loading}
                >
                  Actualizar
                </Button>
                
                {/* ✅ BOTÓN PRINCIPAL - NUEVO SUMINISTRO */}
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={openCreateModal}
                >
                  Nuevo Suministro
                </Button>
              </div>
            </div>

            {/* Tabla de suministros */}
            <SuppliesTable
              supplies={supplies}
              loading={loading}
              onEdit={openEditModal}
              onDelete={handleDeleteSupply}
              onAddMovement={openMovementModal}
              onAdjustStock={async (supplyId, newStock, reason) => {
                return handleAddMovement({
                  supplyId,
                  movementType: 'adjustment',
                  quantity: newStock,
                  reason: reason || 'Ajuste de inventario'
                })
              }}
            />
          </div>
        ) : (
          /* Vista de Alertas */
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Centro de Alertas
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

        {/* ✅ MODALES */}
        
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

        {/* Debug Info - Solo en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <details>
              <summary className="cursor-pointer font-medium text-gray-700">
                🐛 Debug Info (Development)
              </summary>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p><strong>Current View:</strong> {currentView}</p>
                <p><strong>Supplies loaded:</strong> {supplies.length}</p>
                <p><strong>Categories loaded:</strong> {categories.length}</p>
                <p><strong>Suppliers loaded:</strong> {suppliers.length}</p>
                <p><strong>Alerts count:</strong> {alerts.length}</p>
                <p><strong>Unresolved alerts:</strong> {unresolvedAlertsCount}</p>
                <p><strong>Current filters:</strong> {JSON.stringify(filters)}</p>
                <p><strong>Loading state:</strong> {loading ? 'True' : 'False'}</p>
                <p><strong>Error state:</strong> {error || 'None'}</p>
                <p><strong>Show Create Modal:</strong> {showCreateModal ? 'True' : 'False'}</p>
                <p><strong>Show Movement Modal:</strong> {showMovementModal ? 'True' : 'False'}</p>
                <p><strong>Selected Supply:</strong> {selectedSupply?.name || 'None'}</p>
                <p><strong>Show Resolved Alerts:</strong> {showResolvedAlerts ? 'True' : 'False'}</p>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}

export default Supplies