// src/pages/Rooms/Rooms.jsx - VERSIÓN CORREGIDA Y LIMPIA
import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Bed, 
  Users, 
  Wifi, 
  Tv, 
  Car,
  Coffee,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Wrench,
  Download,
  Grid,
  List,
  MoreVertical
} from 'lucide-react';

// Usar el hook de Supabase existente
import { useRooms } from '../../hooks/useRooms';
import toast from 'react-hot-toast';

// Componente de tarjeta de habitación
const RoomCard = ({ room, onEdit, onDelete, onViewDetails, onClean }) => {
  const getStatusConfig = (status) => {
    const configs = {
      available: {
        color: 'green',
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        icon: CheckCircle,
        label: 'Disponible'
      },
      occupied: {
        color: 'red',
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        icon: XCircle,
        label: 'Ocupada'
      },
      needs_cleaning: {
        color: 'blue',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: Clock,
        label: 'Necesita Limpieza'
      },
      cleaning: {
        color: 'blue',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: Clock,
        label: 'En Limpieza'
      },
      maintenance: {
        color: 'yellow',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        icon: Wrench,
        label: 'Mantenimiento'
      }
    };
    return configs[status] || configs.available;
  };

  const statusConfig = getStatusConfig(room.status);
  const StatusIcon = statusConfig.icon;

  const getAmenityIcon = (feature) => {
    const icons = {
      wifi: Wifi,
      tv: Tv,
      air_conditioning: Clock,
      minibar: Coffee,
      balcony: MapPin,
      jacuzzi: Users,
      parking: Car
    };
    return icons[feature] || Clock;
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 ${statusConfig.border} hover:shadow-md transition-all duration-200`}>
      {/* Header de la tarjeta */}
      <div className={`${statusConfig.bg} p-4 rounded-t-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-gray-900">
              {room.number}
            </div>
            <div className={`flex items-center space-x-1 ${statusConfig.text}`}>
              <StatusIcon size={16} />
              <span className="text-sm font-medium">{statusConfig.label}</span>
            </div>
          </div>
          
          {/* Menú de acciones */}
          <div className="relative group">
            <button className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors">
              <MoreVertical size={16} className="text-gray-600" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button 
                onClick={() => onViewDetails(room)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Eye size={14} />
                <span>Ver detalles</span>
              </button>
              <button 
                onClick={() => onEdit(room)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Edit size={14} />
                <span>Editar</span>
              </button>
              {room.status === 'needs_cleaning' && (
                <button 
                  onClick={() => onClean(room.id)}
                  className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center space-x-2"
                >
                  <CheckCircle size={14} />
                  <span>Marcar limpia</span>
                </button>
              )}
              <button 
                onClick={() => onDelete(room)}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <Trash2 size={14} />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido de la tarjeta */}
      <div className="p-4 space-y-4">
        {/* Información básica */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Capacidad:</span>
            <div className="flex items-center space-x-1">
              <Users size={14} className="text-gray-500" />
              <span className="font-medium text-gray-900">{room.capacity}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Tarifa:</span>
            <div className="flex items-center space-x-1">
              <DollarSign size={14} className="text-green-600" />
              <span className="font-bold text-green-600">S/ {room.base_rate || 100}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Piso:</span>
            <span className="font-medium text-gray-900">{room.floor}°</span>
          </div>
          {room.size && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tamaño:</span>
              <span className="font-medium text-gray-900">{room.size} m²</span>
            </div>
          )}
        </div>

        {/* Huésped actual */}
        {room.currentGuest && (
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-sm text-red-600 mb-1">Huésped actual:</div>
            <div className="font-medium text-red-900">{room.currentGuest.name}</div>
            {room.currentGuest.checkOut && (
              <div className="text-xs text-red-500 mt-1">
                Check-out: {new Date(room.currentGuest.checkOut).toLocaleDateString('es-ES')}
              </div>
            )}
          </div>
        )}

        {/* Próxima reserva */}
        {room.nextReservation && !room.currentGuest && (
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-sm text-purple-600 mb-1">Próxima reserva:</div>
            <div className="font-medium text-purple-900">{room.nextReservation.guest}</div>
            <div className="text-xs text-purple-500 mt-1">
              Check-in: {new Date(room.nextReservation.checkIn).toLocaleDateString('es-ES')}
            </div>
          </div>
        )}

        {/* Features destacadas */}
        {room.features && room.features.length > 0 && (
          <div>
            <div className="text-sm text-gray-600 mb-2">Amenidades:</div>
            <div className="flex flex-wrap gap-1">
              {room.features.slice(0, 3).map((feature, index) => {
                const IconComponent = getAmenityIcon(feature);
                return (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    <IconComponent size={10} className="mr-1" />
                    {feature.replace('_', ' ')}
                  </span>
                );
              })}
              {room.features.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  +{room.features.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Estado de limpieza */}
        <div className="text-xs text-gray-500 border-t pt-2">
          {room.last_cleaned && (
            <div className="flex justify-between">
              <span>Última limpieza:</span>
              <span>{new Date(room.last_cleaned).toLocaleDateString('es-ES')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente principal de Habitaciones
const Rooms = () => {
  // Usar el hook integrado con Supabase
  const { 
    rooms, 
    roomStats,
    loading, 
    error,
    handleRoomCleanClick,
    ROOM_STATUS,
    getRoomsNeedingCleaning,
    getAvailableRooms,
    getOccupiedRooms
  } = useRooms();

  // Estados locales para filtros y UI
  const [filters, setFilters] = useState({
    status: 'all',
    floor: 'all',
    search: ''
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'list'

  // Filtrar habitaciones localmente
  const filteredRooms = rooms.filter(room => {
    const matchesStatus = filters.status === 'all' || room.status === filters.status;
    const matchesFloor = filters.floor === 'all' || room.floor.toString() === filters.floor;
    const matchesSearch = !filters.search || 
      room.number.toLowerCase().includes(filters.search.toLowerCase()) ||
      (room.currentGuest?.name || '').toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesStatus && matchesFloor && matchesSearch;
  });

  // Handlers
  const handleAddRoom = () => {
    // Implementar modal de agregar habitación
    console.log('Agregar nueva habitación');
    toast.info('Funcionalidad de agregar habitación próximamente');
  };

  const handleEditRoom = (room) => {
    // Implementar modal de editar habitación
    console.log('Editar habitación:', room.id);
    toast.info('Funcionalidad de editar habitación próximamente');
  };

  const handleViewDetails = (room) => {
    // Implementar modal de detalles
    console.log('Ver detalles de habitación:', room.id);
    toast.info('Funcionalidad de detalles próximamente');
  };

  const handleDeleteRoom = (room) => {
    if (window.confirm(`¿Estás seguro de eliminar la habitación ${room.number}?`)) {
      console.log('Eliminar habitación:', room.id);
      toast.info('Funcionalidad de eliminar próximamente');
    }
  };

  const handleCleanRoom = async (roomId) => {
    try {
      const result = await handleRoomCleanClick(roomId);
      if (result.error) {
        toast.error('Error al limpiar la habitación');
      }
      // El toast de éxito ya se muestra en el hook
    } catch (error) {
      toast.error('Error al limpiar la habitación');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    toast.info('Funcionalidad de exportar próximamente');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="text-red-600 mr-2" size={20} />
          <p className="text-red-700">Error al cargar las habitaciones: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Habitaciones</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las habitaciones del hotel
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Toggle de vista */}
          <div className="flex border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List size={16} />
            </button>
          </div>

          <button 
            onClick={handleExport}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <Download size={20} />
            <span>Exportar</span>
          </button>
          
          <button 
            onClick={handleAddRoom}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Agregar habitación</span>
          </button>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{roomStats?.total || 0}</p>
            </div>
            <Bed className="text-gray-400" size={20} />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disponibles</p>
              <p className="text-xl font-bold text-green-600 mt-1">{roomStats?.available || 0}</p>
            </div>
            <CheckCircle className="text-green-400" size={20} />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ocupadas</p>
              <p className="text-xl font-bold text-red-600 mt-1">{roomStats?.occupied || 0}</p>
            </div>
            <XCircle className="text-red-400" size={20} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Necesita Limpieza</p>
              <p className="text-xl font-bold text-blue-600 mt-1">{roomStats?.needsCleaning || 0}</p>
            </div>
            <Clock className="text-blue-400" size={20} />
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar habitación..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por estado */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value={ROOM_STATUS?.AVAILABLE || 'available'}>Disponibles</option>
            <option value={ROOM_STATUS?.OCCUPIED || 'occupied'}>Ocupadas</option>
            <option value={ROOM_STATUS?.NEEDS_CLEANING || 'needs_cleaning'}>Necesita Limpieza</option>
          </select>

          {/* Filtro por piso */}
          <select
            value={filters.floor}
            onChange={(e) => handleFilterChange('floor', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los pisos</option>
            <option value="1">Piso 1</option>
            <option value="2">Piso 2</option>
            <option value="3">Piso 3</option>
            <option value="4">Piso 4</option>
          </select>

          {/* Botón limpiar filtros */}
          <button
            onClick={() => setFilters({ status: 'all', floor: 'all', search: '' })}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Grid de habitaciones */}
      <div className={`grid gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
      }`}>
        {filteredRooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onEdit={handleEditRoom}
            onDelete={handleDeleteRoom}
            onViewDetails={handleViewDetails}
            onClean={handleCleanRoom}
          />
        ))}
      </div>

      {/* Estado vacío */}
      {filteredRooms.length === 0 && (
        <div className="text-center py-12">
          <Bed className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron habitaciones
          </h3>
          <p className="text-gray-600 mb-6">
            {filters.search || filters.status !== 'all' || filters.floor !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza agregando la primera habitación'
            }
          </p>
          <button 
            onClick={handleAddRoom}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Agregar primera habitación
          </button>
        </div>
      )}
    </div>
  );
};

export default Rooms;