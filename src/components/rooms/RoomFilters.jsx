// src/components/rooms/RoomFilters.jsx - ADAPTADO A TU SISTEMA DE 3 ESTADOS
import React from 'react';
import { Search, Filter, X, Grid, List } from 'lucide-react';
import Button from '../common/Button';

// TUS 3 ESTADOS SIMPLIFICADOS
const ROOM_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  NEEDS_CLEANING: 'needs_cleaning'
};

const RoomFilters = ({ 
  filters = {}, 
  onFiltersChange, 
  rooms = [], 
  viewMode = 'grid', 
  onViewModeChange, 
  loading = false
}) => {
  const handleFilterChange = (key, value) => {
    if (onFiltersChange) {
      onFiltersChange(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  const clearFilters = () => {
    if (onFiltersChange) {
      onFiltersChange({
        status: 'all',
        floor: 'all',
        search: ''
      });
    }
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'search') return value !== '';
    return value !== 'all';
  });

  // TUS 3 OPCIONES DE ESTADO SIMPLIFICADAS
  const statusOptions = [
    { value: 'all', label: 'Todos los estados', icon: '🏨' },
    { value: ROOM_STATUS.AVAILABLE, label: 'Disponibles', icon: '✅' },
    { value: ROOM_STATUS.OCCUPIED, label: 'Ocupadas', icon: '👥' },
    { value: ROOM_STATUS.NEEDS_CLEANING, label: 'Necesitan Limpieza', icon: '🧹' }
  ];

  // Generar opciones de piso dinámicamente desde las habitaciones
  const floorOptions = React.useMemo(() => {
    const allFloors = [{ value: 'all', label: 'Todos los pisos' }];
    
    if (rooms && rooms.length > 0) {
      const uniqueFloors = [...new Set(rooms.map(room => room.floor).filter(f => f != null))];
      uniqueFloors.sort((a, b) => a - b);
      uniqueFloors.forEach(floor => {
        allFloors.push({ value: floor.toString(), label: `Piso ${floor}` });
      });
    }
    
    return allFloors;
  }, [rooms]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          {hasActiveFilters && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              Activos
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={16} />
              <span>Limpiar filtros</span>
            </button>
          )}
          
          {/* View Mode Toggle */}
          {onViewModeChange && (
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                icon={Grid}
                onClick={() => onViewModeChange('grid')}
                className="px-3 py-1.5"
              >
                Cuadrícula
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                icon={List}
                onClick={() => onViewModeChange('list')}
                className="px-3 py-1.5"
              >
                Lista
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* EXPLICACIÓN DEL SISTEMA SIMPLIFICADO */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-700 text-sm">
          <strong>Sistema ultra-simplificado:</strong> 
          <span className="ml-2">
            Solo número de habitación y piso requeridos · ✅ Disponible · 👥 Ocupada · 🧹 Necesita Limpieza
          </span>
        </p>
      </div>

      {/* SOLO 3 FILTROS: Búsqueda, Estado, Piso */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por número..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={filters.status || 'all'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>

        {/* Floor Filter */}
        <select
          value={filters.floor || 'all'}
          onChange={(e) => handleFilterChange('floor', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {floorOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Indicadores de estado activo */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Filtros activos:</span>
          {filters.search && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              Búsqueda: "{filters.search}"
              <button
                onClick={() => handleFilterChange('search', '')}
                className="ml-1 hover:text-blue-600"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {filters.status !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              Estado: {statusOptions.find(opt => opt.value === filters.status)?.label}
              <button
                onClick={() => handleFilterChange('status', 'all')}
                className="ml-1 hover:text-green-600"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {filters.floor !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
              Piso: {filters.floor}
              <button
                onClick={() => handleFilterChange('floor', 'all')}
                className="ml-1 hover:text-orange-600"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Contador de resultados y información */}
      <div className="mt-4 text-sm text-gray-500 border-t pt-3">
        <div className="flex justify-between items-center">
          <span>
            ✨ Sistema súper simple: Solo número y piso obligatorios
          </span>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Disponible</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Ocupada</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Necesita Limpieza</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomFilters;