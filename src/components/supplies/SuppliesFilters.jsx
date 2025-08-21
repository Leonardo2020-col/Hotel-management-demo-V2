// src/components/supplies/SuppliesFilters.jsx
import React, { useState } from 'react'
import { Search, Filter, X, RotateCcw, AlertTriangle, Package } from 'lucide-react'

const SuppliesFilters = ({
  filters,
  categories,
  suppliers,
  onFiltersChange,
  onClearFilters,
  loading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleInputChange = (field, value) => {
    onFiltersChange({ [field]: value })
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== false
  )

  const quickFilters = [
    {
      id: 'all',
      label: 'Todos',
      active: !hasActiveFilters,
      onClick: () => onClearFilters()
    },
    {
      id: 'lowStock',
      label: 'Stock Bajo',
      icon: AlertTriangle,
      active: filters.lowStock,
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      onClick: () => handleInputChange('lowStock', !filters.lowStock)
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Header siempre visible */}
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Búsqueda principal */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={filters.search || ''}
              onChange={(e) => handleInputChange('search', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Filtros rápidos */}
          <div className="flex items-center space-x-2">
            {quickFilters.map((filter) => {
              const Icon = filter.icon
              return (
                <button
                  key={filter.id}
                  onClick={filter.onClick}
                  className={`
                    inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium transition-colors
                    ${filter.active 
                      ? (filter.color || 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100')
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }
                  `}
                >
                  {Icon && <Icon className="h-4 w-4 mr-1" />}
                  {filter.label}
                </button>
              )
            })}

            {/* Botón de filtros avanzados */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`
                inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium transition-colors
                ${isExpanded || (hasActiveFilters && !filters.lowStock)
                  ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }
              `}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filtros
              {(hasActiveFilters && !filters.lowStock) && (
                <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                  {Object.values(filters).filter(v => v !== '' && v !== false).length - (filters.lowStock ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Botón limpiar filtros */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                title="Limpiar filtros"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filtros expandidos */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Categoría */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Package className="inline h-3 w-3 mr-1" />
                Categoría
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Proveedor */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Proveedor
              </label>
              <select
                value={filters.supplier || ''}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los proveedores</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado de stock */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Estado de stock
              </label>
              <div className="space-y-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.lowStock || false}
                    onChange={(e) => handleInputChange('lowStock', e.target.checked)}
                    className="form-checkbox text-orange-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Solo stock bajo</span>
                </label>
              </div>
            </div>
          </div>

          {/* Acciones de filtros */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {hasActiveFilters && (
                <span>
                  {Object.values(filters).filter(v => v !== '' && v !== false).length} filtro(s) activo(s)
                </span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClearFilters}
                disabled={!hasActiveFilters}
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded hover:bg-blue-100 transition-colors"
              >
                Colapsar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indicadores de filtros activos (cuando está colapsado) */}
      {!isExpanded && hasActiveFilters && !filters.lowStock && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {filters.category && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Categoría: {categories.find(c => c.id === filters.category)?.name}
                <button
                  type="button"
                  onClick={() => handleInputChange('category', '')}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 text-blue-400 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filters.supplier && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <button
                  type="button"
                  onClick={() => handleInputChange('supplier', '')}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 text-green-400 hover:text-green-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Búsqueda: {filters.search}
                <button
                  type="button"
                  onClick={() => handleInputChange('search', '')}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 text-purple-400 hover:text-purple-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SuppliesFilters