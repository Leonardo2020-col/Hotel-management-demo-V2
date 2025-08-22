// src/pages/Supplies.jsx - PÁGINA BÁSICA CORREGIDA
import React, { useState } from 'react'
import { RefreshCw, Package, AlertTriangle, Plus, Search, Filter } from 'lucide-react'
import { useSupplies } from '../hooks/useSupplies'
import Button from '../components/common/Button'
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
    refreshData,
    updateFilters,
    clearFilters,
    filters
  } = useSupplies()

  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const stats = getSuppliesStats()

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    updateFilters({ search: value })
  }

  const handleFilterChange = (filterName, value) => {
    updateFilters({ [filterName]: value })
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    clearFilters()
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Suministros e Inventario</h1>
          <p className="text-gray-600">Gestión de productos y stock del hotel</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-sm text-gray-600">Total de Artículos</div>
            <div className="text-xs text-gray-500 mt-1">Artículos en inventario</div>
            <div className="text-xs text-green-600 font-medium">✓ Todo bien</div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">{stats.lowStock}</div>
            <div className="text-sm text-gray-600">Stock Bajo</div>
            <div className="text-xs text-gray-500 mt-1">Requieren restock</div>
            {stats.lowStock > 0 ? (
              <div className="text-xs text-orange-600 font-medium">⚠ Revisar</div>
            ) : (
              <div className="text-xs text-green-600 font-medium">✓ Todo bien</div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
            <div className="text-sm text-gray-600">Agotados</div>
            <div className="text-xs text-gray-500 mt-1">Sin stock disponible</div>
            {stats.outOfStock > 0 ? (
              <div className="text-xs text-red-600 font-medium">🚨 Urgente</div>
            ) : (
              <div className="text-xs text-green-600 font-medium">✓ Todo bien</div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-green-600 text-2xl font-bold mb-2">S/</div>
            <div className="text-2xl font-bold text-gray-800">{stats.totalValue.toFixed(0)}</div>
            <div className="text-sm text-gray-600">Valor Total</div>
            <div className="text-xs text-gray-500 mt-1">Valor del inventario</div>
            <div className="text-xs text-gray-600">💰 Inventario</div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-purple-600 text-2xl font-bold mb-2">📁</div>
            <div className="text-2xl font-bold text-gray-800">{stats.categories}</div>
            <div className="text-sm text-gray-600">Categorías</div>
            <div className="text-xs text-gray-500 mt-1">Diferentes categorías</div>
            <div className="text-xs text-gray-600">🏷 Tipos</div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-blue-600 text-2xl font-bold mb-2">🏢</div>
            <div className="text-2xl font-bold text-gray-800">{stats.suppliers}</div>
            <div className="text-sm text-gray-600">Proveedores</div>
            <div className="text-xs text-gray-500 mt-1">Proveedores activos</div>
            <div className="text-xs text-gray-600">📦 Activos</div>
          </div>
        </div>

        {/* Alertas si las hay */}
        {stats.alertsCount > 0 && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <h3 className="text-sm font-semibold text-orange-800">
                  {stats.alertsCount} Alerta{stats.alertsCount !== 1 ? 's' : ''} de Inventario
                </h3>
                <p className="text-sm text-orange-700">
                  Hay productos que requieren atención inmediata por stock bajo o agotado.
                </p>
              </div>
              <Button
                variant="warning"
                size="sm"
                onClick={() => handleFilterChange('lowStock', true)}
              >
                Ver Alertas
              </Button>
            </div>
          </div>
        )}

        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Búsqueda */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o SKU..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                icon={Filter}
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-blue-50 border-blue-300' : ''}
              >
                Filtros
              </Button>
              
              <Button
                variant="outline"
                icon={RefreshCw}
                onClick={refreshData}
                disabled={loading}
              >
                Actualizar
              </Button>

              <Button
                variant="primary"
                icon={Plus}
                onClick={() => toast.info('Funcionalidad en desarrollo')}
              >
                Nuevo Suministro
              </Button>
            </div>
          </div>

          {/* Panel de Filtros */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtro por Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Proveedor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proveedor
                  </label>
                  <select
                    value={filters.supplier}
                    onChange={(e) => handleFilterChange('supplier', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los proveedores</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro Stock Bajo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado de Stock
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.lowStock}
                      onChange={(e) => handleFilterChange('lowStock', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Solo mostrar stock bajo</span>
                  </label>
                </div>
              </div>

              {/* Limpiar Filtros */}
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Suministros */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Lista de Suministros ({supplies.length})
            </h2>
            {filters.search && (
              <p className="text-sm text-gray-600 mt-1">
                Mostrando resultados para: "{filters.search}"
              </p>
            )}
          </div>

          {supplies.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">
                {filters.search || filters.category || filters.supplier || filters.lowStock 
                  ? 'No hay suministros que coincidan con los filtros'
                  : 'No hay suministros registrados'
                }
              </h3>
              <p className="text-gray-400 mb-4">
                {filters.search || filters.category || filters.supplier || filters.lowStock
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza agregando tu primer suministro al inventario'
                }
              </p>
              
              {(filters.search || filters.category || filters.supplier || filters.lowStock) ? (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                >
                  Limpiar Filtros
                </Button>
              ) : (
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => toast.info('Funcionalidad en desarrollo')}
                >
                  Agregar Primer Suministro
                </Button>
              )}
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {supplies.map((supply) => (
                  <div
                    key={supply.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Header del Suministro */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">
                          {supply.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {supply.category?.name || 'Sin categoría'}
                        </p>
                        {supply.sku && (
                          <p className="text-xs text-gray-500">
                            SKU: {supply.sku}
                          </p>
                        )}
                      </div>

                      {/* Badge de Stock */}
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        supply.stockStatus === 'out_of_stock' 
                          ? 'bg-red-100 text-red-800'
                          : supply.stockStatus === 'low_stock'
                            ? 'bg-orange-100 text-orange-800'
                            : supply.stockStatus === 'medium_stock'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                      }`}>
                        {supply.stockStatus === 'out_of_stock' && 'Agotado'}
                        {supply.stockStatus === 'low_stock' && 'Stock Bajo'}
                        {supply.stockStatus === 'medium_stock' && 'Stock Medio'}
                        {supply.stockStatus === 'good_stock' && 'Stock Bueno'}
                      </div>
                    </div>

                    {/* Información de Stock */}
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Stock actual:</span>
                        <span className="font-medium">
                          {supply.current_stock} {supply.unit_of_measure}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Stock mínimo:</span>
                        <span className="font-medium">
                          {supply.minimum_stock} {supply.unit_of_measure}
                        </span>
                      </div>

                      {/* Barra de Progreso de Stock */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            supply.stockPercentage <= 25 
                              ? 'bg-red-500'
                              : supply.stockPercentage <= 50
                                ? 'bg-orange-500'
                                : supply.stockPercentage <= 75
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${Math.min(supply.stockPercentage, 100)}%` 
                          }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Costo unitario:</span>
                        <span className="font-medium">
                          S/ {supply.unit_cost.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Valor total:</span>
                        <span className="font-bold text-green-600">
                          S/ {supply.totalValue.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Proveedor */}
                    {supply.supplier && (
                      <div className="text-xs text-gray-500 mb-3">
                        📦 {supply.supplier.name}
                      </div>
                    )}

                    {/* Botones de Acción */}
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => toast.info('Funcionalidad en desarrollo')}
                      >
                        Ver Detalles
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => toast.info('Funcionalidad en desarrollo')}
                      >
                        Actualizar Stock
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Debug Info - Solo en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <details>
              <summary className="cursor-pointer font-medium text-gray-700">
                🐛 Debug Info (Development)
              </summary>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p><strong>Supplies loaded:</strong> {supplies.length}</p>
                <p><strong>Categories loaded:</strong> {categories.length}</p>
                <p><strong>Suppliers loaded:</strong> {suppliers.length}</p>
                <p><strong>Alerts count:</strong> {alerts.length}</p>
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