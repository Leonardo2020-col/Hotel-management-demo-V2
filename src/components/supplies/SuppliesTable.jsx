// src/components/supplies/SuppliesTable.jsx - CÓDIGO COMPLETO CON SOPORTE PARA SNACKS
import React, { useState } from 'react'
import { 
  Edit3, 
  Trash2, 
  Plus, 
  Minus,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Eye,
  Archive,
  RefreshCw,
  Coffee,
  ShoppingCart,
  DollarSign
} from 'lucide-react'

const SuppliesTable = ({
  supplies,
  loading,
  onEdit,
  onDelete,
  onAddMovement,
  onAdjustStock,
  onEditSnack, // Nueva prop para editar snacks
  currentUser,
  isSnacksView = false // Nueva prop para identificar vista de snacks
}) => {
  const [selectedSupply, setSelectedSupply] = useState(null)
  const [showActionMenu, setShowActionMenu] = useState(null)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustData, setAdjustData] = useState({ newStock: '', reason: '' })

  // Obtener el badge de estado del stock
  const getStockBadge = (supply) => {
    const { current_stock, minimum_stock, stockStatus } = supply
    
    const statusConfig = {
      'out_of_stock': {
        color: 'bg-red-100 text-red-800 border-red-200',
        text: 'Agotado',
        icon: AlertTriangle
      },
      'low_stock': {
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        text: 'Stock Bajo',
        icon: TrendingDown
      },
      'medium_stock': {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        text: 'Stock Medio',
        icon: Package
      },
      'good_stock': {
        color: 'bg-green-100 text-green-800 border-green-200',
        text: 'Stock Bueno',
        icon: TrendingUp
      }
    }

    const config = statusConfig[stockStatus] || statusConfig.good_stock
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    )
  }

  // Obtener barra de progreso del stock
  const getStockProgress = (current, minimum) => {
    if (minimum === 0) return 100
    const percentage = Math.min((current / (minimum * 2)) * 100, 100)
    
    let colorClass = 'bg-green-500'
    if (percentage <= 25) colorClass = 'bg-red-500'
    else if (percentage <= 50) colorClass = 'bg-orange-500'
    else if (percentage <= 75) colorClass = 'bg-yellow-500'

    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all ${colorClass}`}
          style={{ width: `${Math.max(percentage, 5)}%` }}
        />
      </div>
    )
  }

  // Renderizar acciones adaptadas para snacks
  const renderActions = (supply) => {
    return (
      <div className="relative">
        <button
          onClick={() => setShowActionMenu(showActionMenu === supply.id ? null : supply.id)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {showActionMenu === supply.id && (
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
            <div className="py-1">
              {/* Editar - para suministros regulares O para snacks */}
              {((isSnacksView && onEditSnack) || (!isSnacksView && onEdit)) && (
                <button
                  onClick={() => {
                    if (isSnacksView && onEditSnack) {
                      onEditSnack(supply)
                    } else if (!isSnacksView && onEdit) {
                      onEdit(supply)
                    }
                    setShowActionMenu(null)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {isSnacksView ? 'Editar Snack' : 'Editar'}
                </button>
              )}

              {/* Movimiento - solo para suministros regulares */}
              {!isSnacksView && onAddMovement && (
                <button
                  onClick={() => {
                    onAddMovement(supply)
                    setShowActionMenu(null)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Registrar Movimiento
                </button>
              )}

              {/* Ajustar Stock - disponible para ambos */}
              {onAdjustStock && (
                <button
                  onClick={() => {
                    setSelectedSupply(supply)
                    setAdjustData({ 
                      newStock: supply.current_stock.toString(), 
                      reason: isSnacksView ? 'Restock de snacks' : 'Ajuste de inventario' 
                    })
                    setShowAdjustModal(true)
                    setShowActionMenu(null)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                >
                  <Package className="h-4 w-4 mr-2" />
                  {isSnacksView ? 'Ajustar Stock Snack' : 'Ajustar Stock'}
                </button>
              )}

              {/* Eliminar - solo para suministros regulares */}
              {!isSnacksView && onDelete && (
                <button
                  onClick={() => {
                    if (window.confirm(`¿Estás seguro de que deseas eliminar "${supply.name}"?`)) {
                      onDelete(supply.id)
                    }
                    setShowActionMenu(null)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Manejar ajuste de stock
  const handleAdjustStock = async () => {
    if (!selectedSupply || !adjustData.newStock) return

    const newStock = parseInt(adjustData.newStock)
    if (isNaN(newStock) || newStock < 0) {
      alert('Por favor ingresa un número válido')
      return
    }

    try {
      await onAdjustStock(selectedSupply.id, newStock, adjustData.reason)
      setShowAdjustModal(false)
      setSelectedSupply(null)
      setAdjustData({ newStock: '', reason: '' })
    } catch (error) {
      console.error('Error ajustando stock:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">
            {isSnacksView ? 'Cargando snacks...' : 'Cargando suministros...'}
          </p>
        </div>
      </div>
    )
  }

  if (supplies.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 text-center">
          {isSnacksView ? (
            <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          ) : (
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          )}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isSnacksView ? 'No hay snacks configurados' : 'No hay suministros'}
          </h3>
          <p className="text-sm text-gray-600">
            {isSnacksView 
              ? 'No se encontraron snacks para mostrar. Configura snacks usando el botón "Nuevo Snack".'
              : 'No se encontraron suministros con los filtros aplicados.'
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            {isSnacksView ? (
              <>
                <Coffee className="h-5 w-5 mr-2 text-green-600" />
                Inventario de Snacks ({supplies.length} items)
              </>
            ) : (
              <>
                <Package className="h-5 w-5 mr-2 text-blue-600" />
                Inventario de Suministros ({supplies.length} artículos)
              </>
            )}
          </h3>
        </div>

        {/* Tabla responsive */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {isSnacksView ? 'Precios' : 'Valor'}
                </th>
                {!isSnacksView && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                )}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {supplies.map((supply) => (
                <tr 
                  key={supply.id} 
                  className={`hover:bg-gray-50 transition-colors ${
                    supply.isOutOfStock ? 'bg-red-50' : 
                    supply.needsRestock ? 'bg-orange-50' : ''
                  }`}
                >
                  {/* Producto */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center">
                        {isSnacksView && (
                          <Coffee className="h-4 w-4 text-green-500 mr-2" />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {supply.name}
                        </span>
                        {supply.needsRestock && (
                          <AlertTriangle className="h-4 w-4 text-orange-500 ml-2" />
                        )}
                      </div>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        {supply.sku && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-xs mr-2">
                            SKU: {supply.sku}
                          </span>
                        )}
                        <span>{supply.category?.name || 'Sin categoría'}</span>
                        {isSnacksView && (
                          <span className="ml-2 bg-green-100 px-2 py-0.5 rounded text-xs text-green-700">
                            Check-in
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Unidad: {supply.unit_of_measure}
                      </div>
                    </div>
                  </td>

                  {/* Stock */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {supply.current_stock} / {supply.minimum_stock}
                        </span>
                        <span className="text-xs text-gray-500">
                          {supply.stockPercentage}%
                        </span>
                      </div>
                      {getStockProgress(supply.current_stock, supply.minimum_stock)}
                      <div className="text-xs text-gray-500 mt-1">
                        Mínimo: {supply.minimum_stock}
                      </div>
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStockBadge(supply)}
                  </td>

                  {/* Valor/Precios */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      {isSnacksView ? (
                        <>
                          <div className="text-sm font-medium text-green-600">
                            <ShoppingCart className="w-3 h-3 inline mr-1" />
                            Venta: S/ {supply.price?.toFixed(2) || '0.00'}
                          </div>
                          <div className="text-xs text-gray-500">
                            <DollarSign className="w-3 h-3 inline mr-1" />
                            Costo: S/ {supply.unit_cost?.toFixed(2) || '0.00'}
                          </div>
                          <div className="text-xs text-blue-600 font-medium">
                            Margen: {supply.price && supply.unit_cost 
                              ? `${(((supply.price - supply.unit_cost) / supply.price) * 100).toFixed(1)}%`
                              : 'N/A'
                            }
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-medium text-gray-900">
                            S/ {supply.totalValue?.toFixed(2) || '0.00'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Unitario: S/ {supply.unit_cost?.toFixed(2) || '0.00'}
                          </div>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Proveedor - solo para suministros */}
                  {!isSnacksView && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {supply.supplier?.name || 'Sin proveedor'}
                      </div>
                      {supply.supplier?.contact_person && (
                        <div className="text-xs text-gray-500">
                          {supply.supplier.contact_person}
                        </div>
                      )}
                    </td>
                  )}

                  {/* Acciones */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {renderActions(supply)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Total: {supplies.length} {isSnacksView ? 'snacks' : 'artículos'}</span>
              <span>•</span>
              <span className="text-red-600">
                Stock bajo: {supplies.filter(s => s.needsRestock).length}
              </span>
              <span>•</span>
              <span className="text-orange-600">
                Agotados: {supplies.filter(s => s.isOutOfStock).length}
              </span>
              {isSnacksView && (
                <>
                  <span>•</span>
                  <span className="text-green-600">
                    Valor total: S/ {supplies.reduce((sum, s) => sum + (s.current_stock * (s.unit_cost || 0)), 0).toFixed(2)}
                  </span>
                </>
              )}
            </div>
            
            <div className="text-xs text-gray-500">
              {isSnacksView && (
                <span className="mr-4 text-green-600">
                  ⚡ Consumo automático en check-ins
                </span>
              )}
              Última actualización: {new Date().toLocaleTimeString('es-PE')}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de ajuste de stock */}
      {showAdjustModal && selectedSupply && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                {isSnacksView ? (
                  <>
                    <Coffee className="h-5 w-5 mr-2 text-green-600" />
                    Ajustar Stock Snack - {selectedSupply.name}
                  </>
                ) : (
                  <>
                    <Package className="h-5 w-5 mr-2 text-blue-600" />
                    Ajustar Stock - {selectedSupply.name}
                  </>
                )}
              </h3>
              
              <div className="space-y-4">
                <div className={`p-3 rounded-lg ${isSnacksView ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Actual: {selectedSupply.current_stock} {selectedSupply.unit_of_measure}
                  </label>
                  {isSnacksView && (
                    <p className="text-xs text-green-700">
                      Este stock se consume automáticamente cuando los huéspedes seleccionan snacks en el check-in
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nuevo Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={adjustData.newStock}
                    onChange={(e) => setAdjustData(prev => ({ ...prev, newStock: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingresa el nuevo stock"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razón del ajuste {isSnacksView ? '(opcional)' : ''}
                  </label>
                  <textarea
                    rows={3}
                    value={adjustData.reason}
                    onChange={(e) => setAdjustData(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder={
                      isSnacksView 
                        ? "Ej: Restock de snacks, inventario físico, producto dañado, etc."
                        : "Ej: Inventario físico, producto dañado, etc."
                    }
                  />
                </div>

                {isSnacksView && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">Recuerda:</p>
                        <p className="text-xs mt-1">
                          Los snacks se consumen automáticamente cuando los huéspedes los seleccionan 
                          durante el proceso de check-in. Solo ajusta manualmente para correcciones 
                          de inventario o restock.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAdjustModal(false)
                    setSelectedSupply(null)
                    setAdjustData({ newStock: '', reason: '' })
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdjustStock}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md hover:shadow-lg ${
                    isSnacksView 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSnacksView ? 'Ajustar Stock Snack' : 'Ajustar Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click away listener */}
      {showActionMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowActionMenu(null)}
        />
      )}
    </>
  )
}

export default SuppliesTable