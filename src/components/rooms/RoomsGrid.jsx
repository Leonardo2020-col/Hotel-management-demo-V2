// components/rooms/RoomsGrid.jsx
import React, { useState, useMemo } from 'react'
import { 
  Grid3X3, 
  List, 
  Filter, 
  Search, 
  RefreshCw,
  Building,
  Eye,
  EyeOff,
  SortAsc,
  SortDesc
} from 'lucide-react'
import RoomCard from './RoomCard'

const RoomsGrid = ({ 
  rooms, 
  loading, 
  refreshing,
  filters,
  onFilterChange,
  onRefresh,
  onRoomAction,
  onRoomSelect,
  className = '' 
}) => {
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('room_number') // 'room_number' | 'status' | 'floor' | 'price'
  const [sortOrder, setSortOrder] = useState('asc') // 'asc' | 'desc'
  const [showFilters, setShowFilters] = useState(false)

  // ✅ Opciones de filtros
  const statusOptions = [
    { value: 'all', label: 'Todos los estados', color: 'bg-gray-100' },
    { value: 'disponible', label: 'Disponible', color: 'bg-green-100 text-green-800' },
    { value: 'ocupada', label: 'Ocupada', color: 'bg-red-100 text-red-800' },
    { value: 'limpieza', label: 'Limpieza', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'mantenimiento', label: 'Mantenimiento', color: 'bg-blue-100 text-blue-800' },
    { value: 'fuera_servicio', label: 'Fuera de servicio', color: 'bg-gray-100 text-gray-800' }
  ]

  const floorOptions = useMemo(() => {
    const floors = [...new Set(rooms.map(room => room.floor))].sort((a, b) => a - b)
    return [
      { value: 'all', label: 'Todos los pisos' },
      ...floors.map(floor => ({ value: floor.toString(), label: `Piso ${floor}` }))
    ]
  }, [rooms])

  const priceRangeOptions = [
    { value: 'all', label: 'Todos los precios' },
    { value: '0-100', label: 'S/ 0 - S/ 100' },
    { value: '100-200', label: 'S/ 100 - S/ 200' },
    { value: '200-300', label: 'S/ 200 - S/ 300' },
    { value: '300-', label: 'S/ 300+' }
  ]

  // ✅ Ordenar habitaciones
  const sortedRooms = useMemo(() => {
    const sorted = [...rooms].sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'room_number':
          aValue = parseInt(a.room_number) || 0
          bValue = parseInt(b.room_number) || 0
          break
        case 'status':
          aValue = a.statusName
          bValue = b.statusName
          break
        case 'floor':
          aValue = a.floor
          bValue = b.floor
          break
        case 'price':
          aValue = a.base_price
          bValue = b.base_price
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [rooms, sortBy, sortOrder])

  // ✅ Agrupar habitaciones por piso para vista de grid
  const roomsByFloor = useMemo(() => {
    const grouped = {}
    sortedRooms.forEach(room => {
      if (!grouped[room.floor]) {
        grouped[room.floor] = []
      }
      grouped[room.floor].push(room)
    })
    return grouped
  }, [sortedRooms])

  // ✅ Manejar cambio de ordenamiento
  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('asc')
    }
  }

  // ✅ Obtener icono de ordenamiento
  const getSortIcon = (field) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
  }

  // ✅ Estadísticas rápidas
  const quickStats = useMemo(() => {
    const total = rooms.length
    const available = rooms.filter(r => r.statusName === 'disponible').length
    const occupied = rooms.filter(r => r.statusName === 'ocupada').length
    const cleaning = rooms.filter(r => r.statusName === 'limpieza').length
    
    return { total, available, occupied, cleaning }
  }, [rooms])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando habitaciones...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con controles */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        {/* Fila superior */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Habitaciones ({rooms.length})
            </h2>
            
            {/* Estadísticas rápidas */}
            <div className="hidden md:flex items-center space-x-4 text-sm">
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">{quickStats.available} disponibles</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">{quickStats.occupied} ocupadas</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">{quickStats.cleaning} limpieza</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Botón de vista */}
            <div className="flex rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-400 hover:text-gray-600'
                } transition-colors`}
                title="Vista de grilla"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-400 hover:text-gray-600'
                } transition-colors`}
                title="Vista de lista"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Botón de filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-3 py-2 rounded-lg border border-gray-200 transition-colors ${
                showFilters 
                  ? 'bg-blue-50 text-blue-600 border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {showFilters ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              Filtros
            </button>

            {/* Botón de refrescar */}
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
              title="Refrescar"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Panel de filtros expandible */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar habitación..."
                value={filters.search}
                onChange={(e) => onFilterChange({ search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro por estado */}
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ status: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Filtro por piso */}
            <select
              value={filters.floor}
              onChange={(e) => onFilterChange({ floor: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {floorOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Filtro por precio */}
            <select
              value={filters.priceRange}
              onChange={(e) => onFilterChange({ priceRange: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {priceRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Controles de ordenamiento */}
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-500">Ordenar por:</span>
          <button
            onClick={() => handleSort('room_number')}
            className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
              sortBy === 'room_number' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Número</span>
            {getSortIcon('room_number')}
          </button>
          <button
            onClick={() => handleSort('status')}
            className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
              sortBy === 'status' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Estado</span>
            {getSortIcon('status')}
          </button>
          <button
            onClick={() => handleSort('floor')}
            className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
              sortBy === 'floor' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Piso</span>
            {getSortIcon('floor')}
          </button>
          <button
            onClick={() => handleSort('price')}
            className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
              sortBy === 'price' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Precio</span>
            {getSortIcon('price')}
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      {rooms.length === 0 ? (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay habitaciones
          </h3>
          <p className="text-gray-500 mb-4">
            No se encontraron habitaciones con los filtros seleccionados.
          </p>
          <button
            onClick={() => onFilterChange({ status: 'all', floor: 'all', search: '', priceRange: 'all' })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {viewMode === 'grid' ? (
            /* Vista de grilla agrupada por piso */
            Object.keys(roomsByFloor)
              .sort((a, b) => parseInt(a) - parseInt(b))
              .map(floor => (
                <div key={floor} className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Building className="h-5 w-5 mr-2 text-gray-400" />
                    Piso {floor}
                    <span className="ml-2 text-sm text-gray-500">
                      ({roomsByFloor[floor].length} habitaciones)
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {roomsByFloor[floor].map(room => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        onStatusChange={onRoomAction}
                        onRoomSelect={onRoomSelect}
                        onQuickAction={onRoomAction}
                      />
                    ))}
                  </div>
                </div>
              ))
          ) : (
            /* Vista de lista */
            <div className="space-y-3">
              {sortedRooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onStatusChange={onRoomAction}
                  onRoomSelect={onRoomSelect}
                  onQuickAction={onRoomAction}
                  compact={true}
                  className="hover:shadow-md"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RoomsGrid