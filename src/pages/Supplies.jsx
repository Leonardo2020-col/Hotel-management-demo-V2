// src/pages/Supplies.jsx
import React, { useState } from 'react'
import { 
  Plus, 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  DollarSign,
  Download,
  RefreshCw,
  Search,
  Filter,
  Archive,
  Truck,
  BarChart3
} from 'lucide-react'
import toast from 'react-hot-toast'

// Hooks
import { useSupplies } from '../hooks/useSupplies'
import { useAuth } from '../context/AuthContext'

// Components
import SuppliesTable from '../components/supplies/SuppliesTable'
import SupplyFormModal from '../components/supplies/SupplyFormModal'
import MovementModal from '../components/supplies/MovementModal'
import SuppliesFilters from '../components/supplies/SuppliesFilters'
import AlertsPanel from '../components/supplies/AlertsPanel'
import StatsCards from '../components/supplies/StatsCards'

const Supplies = () => {
  const { userInfo, hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState('inventory') // inventory, movements, alerts
  
  const {
    supplies,
    categories,
    suppliers,
    alerts,
    loading,
    creating,
    updating,
    filters,
    showCreateModal,
    showMovementModal,
    selectedSupply,
    createSupply,
    updateSupply,
    deleteSupply,
    addMovement,
    adjustStock,
    resolveAlert,
    dismissAlert,
    createCategory,
    createSupplier,
    updateFilters,
    clearFilters,
    getSuppliesStats,
    getLowStockSupplies,
    getOutOfStockSupplies,
    refreshData,
    openCreateModal,
    openEditModal,
    openMovementModal,
    closeModals,
    currentBranch
  } = useSupplies()

  // Estadísticas calculadas
  const stats = getSuppliesStats()
  const lowStockSupplies = getLowStockSupplies()
  const outOfStockSupplies = getOutOfStockSupplies()

  // =====================================================
  // HANDLERS DE ACCIONES
  // =====================================================

  const handleCreateSupply = async (supplyData) => {
    const result = await createSupply(supplyData)
    if (result.success) {
      closeModals()
    }
    return result
  }

  const handleUpdateSupply = async (supplyId, updateData) => {
    const result = await updateSupply(supplyId, updateData)
    if (result.success) {
      closeModals()
    }
    return result
  }

  const handleDeleteSupply = async (supplyId) => {
    const result = await deleteSupply(supplyId)
    return result
  }

  const handleAddMovement = async (movementData) => {
    const result = await addMovement(movementData)
    if (result.success) {
      closeModals()
    }
    return result
  }

  const handleAdjustStock = async (supplyId, newStock, reason) => {
    const result = await adjustStock(supplyId, newStock, reason)
    if (result.success) {
      toast.success('Stock ajustado exitosamente')
    }
    return result
  }

  const handleResolveAlert = async (alertId) => {
    const result = await resolveAlert(alertId)
    return result
  }

  const handleExportData = () => {
    try {
      // Preparar datos para CSV
      const csvData = supplies.map(supply => ({
        'Nombre': supply.name,
        'SKU': supply.sku || '',
        'Categoría': supply.category?.name || '',
        'Proveedor': supply.supplier?.name || '',
        'Stock Actual': supply.current_stock,
        'Stock Mínimo': supply.minimum_stock,
        'Unidad': supply.unit_of_measure,
        'Costo Unitario': supply.unit_cost,
        'Valor Total': supply.totalValue?.toFixed(2) || '0.00',
        'Estado': supply.stockStatus,
        'Necesita Restock': supply.needsRestock ? 'Sí' : 'No'
      }))

      if (csvData.length === 0) {
        toast.error('No hay datos para exportar')
        return
      }

      // Convertir a CSV
      const headers = Object.keys(csvData[0])
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => `"${row[header] || ''}"`).join(',')
        )
      ].join('\n')

      // Descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `inventario_${currentBranch?.name || 'hotel'}_${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      toast.success('Inventario exportado exitosamente')
    } catch (error) {
      console.error('Error exportando datos:', error)
      toast.error('Error al exportar datos')
    }
  }

  // =====================================================
  // VERIFICACIÓN DE PERMISOS
  // =====================================================

  const canManageSupplies = hasPermission('supplies') || hasPermission('all')
  const canViewSupplies = hasPermission('supplies_view') || hasPermission('supplies') || hasPermission('all')

  if (!canViewSupplies) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Sin acceso</h2>
          <p className="text-sm text-gray-600">
            No tienes permisos para ver los suministros. Contacta al administrador.
          </p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'inventory', label: 'Inventario', icon: Package, count: supplies.length },
    { id: 'alerts', label: 'Alertas', icon: AlertTriangle, count: alerts.filter(a => !a.is_resolved).length },
    { id: 'reports', label: 'Reportes', icon: BarChart3 }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suministros e Inventario</h1>
          <p className="text-sm text-gray-600">
            {currentBranch?.name} • {userInfo?.first_name} {userInfo?.last_name}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshData}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>

          <button
            onClick={handleExportData}
            disabled={supplies.length === 0}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </button>

          {canManageSupplies && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Suministro
            </button>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <StatsCards 
        stats={stats}
        lowStockCount={lowStockSupplies.length}
        outOfStockCount={outOfStockSupplies.length}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      tab.id === 'alerts' 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Contenido de tabs */}
      {activeTab === 'inventory' && (
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

          {/* Tabla de inventario */}
          <SuppliesTable
            supplies={supplies}
            loading={loading}
            onEdit={canManageSupplies ? openEditModal : null}
            onDelete={canManageSupplies ? handleDeleteSupply : null}
            onAddMovement={canManageSupplies ? openMovementModal : null}
            onAdjustStock={canManageSupplies ? handleAdjustStock : null}
            currentUser={userInfo}
          />
        </div>
      )}

      {activeTab === 'alerts' && (
        <AlertsPanel
          alerts={alerts}
          supplies={supplies}
          onResolve={canManageSupplies ? handleResolveAlert : null}
          onDismiss={canManageSupplies ? dismissAlert : null}
          loading={loading}
        />
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Reportes de Inventario</h3>
            <p className="text-sm text-gray-600">
              Los reportes detallados estarán disponibles próximamente.
            </p>
          </div>
        </div>
      )}

      {/* Modales */}
      <SupplyFormModal
        isOpen={showCreateModal}
        onClose={closeModals}
        onSubmit={selectedSupply ? handleUpdateSupply : handleCreateSupply}
        supply={selectedSupply}
        categories={categories}
        suppliers={suppliers}
        onCreateCategory={createCategory}
        onCreateSupplier={createSupplier}
        loading={creating || updating}
      />

      <MovementModal
        isOpen={showMovementModal}
        onClose={closeModals}
        onSubmit={handleAddMovement}
        supply={selectedSupply}
        loading={updating}
      />
    </div>
  )
}

export default Supplies