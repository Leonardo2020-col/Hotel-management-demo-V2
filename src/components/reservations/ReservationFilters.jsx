// src/components/reservations/ReservationFilters.jsx
import React, { useState } from 'react'
import { Search, Filter, Calendar, User, X, RotateCcw } from 'lucide-react'

const ReservationFilters = ({
  filters,
  onFiltersChange,
  onClearFilters,
  loading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'pendiente', label: 'Pendiente', color: 'bg-yellow-500' },
    { value: 'confirmada', label: 'Confirmada', color: 'bg-green-500' },
    { value: 'en_uso', label: 'En uso', color: 'bg-blue-500' },
    { value: 'completada', label: 'Completada', color: 'bg-gray-500' },
    { value: 'cancelada', label: 'Cancelada', color: 'bg-red-500' },
    { value: 'no_show', label: 'No show', color: 'bg-red-700' }
  ]

  const handleInputChange = (field, value) => {
    onFiltersChange({ [field]: value })
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Header siempre visible */}
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Búsqueda rápida */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre de huésped..."
              value={filters.guestName || ''}
              onChange={(e) => handleInputChange('guestName', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Controles */}
          <div className="flex items-center space-x-2">
            {/* Filtro de estado rápido */}
            <select
              value={filters.status || ''}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Botón de filtros avanzados */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`
                inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium transition-colors
                ${isExpanded || hasActiveFilters
                  ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }
              `}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                  {Object.values(filters).filter(v => v !== '').length}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Fecha desde */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Calendar className="inline h-3 w-3 mr-1" />
                Check-in desde
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleInputChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Fecha hasta */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Calendar className="inline h-3 w-3 mr-1" />
                Check-in hasta
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleInputChange('dateTo', e.target.value)}
                min={filters.dateFrom || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Número de habitación */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Número de habitación
              </label>
              <input
                type="text"
                placeholder="Ej: 101, 201..."
                value={filters.roomNumber || ''}
                onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Código de reservación */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Código de reservación
              </label>
              <input
                type="text"
                placeholder="RES-20241201-0001"
                value={filters.reservationCode || ''}
                onChange={(e) => handleInputChange('reservationCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filtros adicionales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {/* Tipo de documento */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <User className="inline h-3 w-3 mr-1" />
                Tipo de documento
              </label>
              <select
                value={filters.documentType || ''}
                onChange={(e) => handleInputChange('documentType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="dni">DNI</option>
                <option value="pasaporte">Pasaporte</option>
                <option value="carnet_extranjeria">Carnet de Extranjería</option>
              </select>
            </div>

            {/* Monto mínimo */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Monto mínimo (S/)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={filters.minAmount || ''}
                onChange={(e) => handleInputChange('minAmount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Monto máximo */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Monto máximo (S/)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={filters.maxAmount || ''}
                onChange={(e) => handleInputChange('maxAmount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filtros de estado de pago */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Estado de pago
            </label>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="paymentStatus"
                  value=""
                  checked={!filters.paymentStatus}
                  onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Todos</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="paymentStatus"
                  value="paid"
                  checked={filters.paymentStatus === 'paid'}
                  onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                  className="form-radio text-green-600"
                />
                <span className="ml-2 text-sm text-gray-700">Pagado completo</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="paymentStatus"
                  value="partial"
                  checked={filters.paymentStatus === 'partial'}
                  onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                  className="form-radio text-yellow-600"
                />
                <span className="ml-2 text-sm text-gray-700">Pago parcial</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="paymentStatus"
                  value="pending"
                  checked={filters.paymentStatus === 'pending'}
                  onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                  className="form-radio text-red-600"
                />
                <span className="ml-2 text-sm text-gray-700">Sin pago</span>
              </label>
            </div>
          </div>

          {/* Acciones de filtros */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {hasActiveFilters && (
                <span>
                  {Object.values(filters).filter(v => v !== '').length} filtro(s) activo(s)
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
      {!isExpanded && hasActiveFilters && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {filters.status && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Estado: {statusOptions.find(s => s.value === filters.status)?.label}
                <button
                  type="button"
                  onClick={() => handleInputChange('status', '')}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 text-blue-400 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filters.dateFrom && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Desde: {new Date(filters.dateFrom).toLocaleDateString('es-PE')}
                <button
                  type="button"
                  onClick={() => handleInputChange('dateFrom', '')}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 text-green-400 hover:text-green-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filters.dateTo && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Hasta: {new Date(filters.dateTo).toLocaleDateString('es-PE')}
                <button
                  type="button"
                  onClick={() => handleInputChange('dateTo', '')}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 text-green-400 hover:text-green-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filters.guestName && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Huésped: {filters.guestName}
                <button
                  type="button"
                  onClick={() => handleInputChange('guestName', '')}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 text-purple-400 hover:text-purple-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filters.roomNumber && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Habitación: {filters.roomNumber}
                <button
                  type="button"
                  onClick={() => handleInputChange('roomNumber', '')}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 text-orange-400 hover:text-orange-600"
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

export default ReservationFilters