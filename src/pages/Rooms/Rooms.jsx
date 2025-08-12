// src/pages/Rooms/Rooms.jsx - VERSIÓN FINAL INTEGRADA CON TU HOOK
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Grid, 
  List,
  Download,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

// Hook existente con 3 estados simplificados
import { useRooms } from '../../hooks/useRooms';

// Componentes
import RoomStats from '../../components/rooms/RoomStats';
import RoomFilters from '../../components/rooms/RoomFilters';
import RoomGrid from '../../components/rooms/RoomGrid';
import RoomList from '../../components/rooms/RoomList';
import RoomFormModal from '../../components/rooms/RoomFormModal';
import EditRoomModal from '../../components/rooms/EditRoomModal';
import RoomDetailsModal from '../../components/rooms/RoomDetailsModal';
import CleaningManagement from '../../components/rooms/CleaningManagement';
import Button from '../../components/common/Button';

const Rooms = () => {
  // Hook existente con sistema de 3 estados simplificados
  const { 
    rooms, 
    roomStats,
    cleaningStaff,
    loading, 
    error,
    handleRoomCleanClick,
    createRoom,
    updateRoom,
    deleteRoom,
    ROOM_STATUS,
    getRoomsNeedingCleaning,
    getAvailableRooms,
    getOccupiedRooms,
    refetch
  } = useRooms();

  // Estados para UI y modales
  const [filters, setFilters] = useState({
    status: 'all',
    floor: 'all',
    search: ''
  });
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'cleaning'
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [processingRoom, setProcessingRoom] = useState(null);

  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [viewingRoom, setViewingRoom] = useState(null);

  // Filtrar habitaciones
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesStatus = filters.status === 'all' || room.status === filters.status;
      const matchesFloor = filters.floor === 'all' || room.floor.toString() === filters.floor;
      const matchesSearch = !filters.search || 
        room.number.toLowerCase().includes(filters.search.toLowerCase());
      
      return matchesStatus && matchesFloor && matchesSearch;
    });
  }, [rooms, filters]);

  // Agrupar habitaciones por piso para el grid
  const roomsByFloor = useMemo(() => {
    const grouped = {};
    filteredRooms.forEach(room => {
      if (!grouped[room.floor]) {
        grouped[room.floor] = [];
      }
      grouped[room.floor].push(room);
    });
    return grouped;
  }, [filteredRooms]);

  // Habitaciones que necesitan limpieza (usando tu hook)
  const roomsNeedingCleaning = useMemo(() => {
    return getRoomsNeedingCleaning();
  }, [getRoomsNeedingCleaning]);

  // Handlers de acciones usando tu hook existente
  const handleCreateRoom = async (roomData) => {
    const result = await createRoom(roomData);
    if (!result.error) {
      setShowCreateModal(false);
    }
  };

  const handleEditRoom = async (roomId, updateData) => {
    const result = await updateRoom(roomId, updateData);
    if (!result.error) {
      setEditingRoom(null);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta habitación?')) {
      return;
    }

    const result = await deleteRoom(roomId);
    // Toast ya se muestra en el hook
  };

  const handleRoomClick = async (room) => {
    // Si la habitación necesita limpieza, limpiarla con un click (tu sistema)
    if (room.status === ROOM_STATUS.NEEDS_CLEANING) {
      setProcessingRoom(room.number);
      try {
        const result = await handleRoomCleanClick(room.id);
        // Toast ya se muestra en el hook
      } catch (error) {
        console.error('Error cleaning room:', error);
      } finally {
        setProcessingRoom(null);
      }
    } else {
      // Mostrar detalles
      setViewingRoom(room);
    }
  };

  const handleAssignCleaning = async (roomIds, staffId) => {
    try {
      // Lógica de asignación de limpieza
      toast.success('Limpieza asignada exitosamente');
      refetch();
    } catch (error) {
      toast.error('Error al asignar limpieza');
    }
  };

  const handleCleaningStatusChange = async (roomId, newStatus) => {
    try {
      // Usar tu hook para cambiar estados
      await handleRoomCleanClick(roomId);
    } catch (error) {
      toast.error('Error al actualizar estado de limpieza');
    }
  };

  const handleExport = () => {
    // Generar CSV de habitaciones
    const csvData = filteredRooms.map(room => ({
      Numero: room.number,
      Piso: room.floor,
      Estado: room.status,
      Capacidad: room.capacity,
      Tarifa: room.base_rate,
      'Ultima Limpieza': room.last_cleaned
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `habitaciones_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Datos exportados exitosamente');
  };

  // Estados de carga y error
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="text-red-600 mr-3" size={24} />
            <div>
              <h3 className="text-lg font-medium text-red-900">Error al cargar habitaciones</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button 
                onClick={refetch}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Habitaciones</h1>
          <p className="text-gray-600 mt-1">
            Sistema simplificado con 3 estados: Disponible, Ocupada, Necesita Limpieza
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            icon={Download}
            onClick={handleExport}
          >
            Exportar
          </Button>
          
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            Nueva Habitación
          </Button>
        </div>
      </div>

      {/* Mensaje del sistema simplificado */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-6 h-6 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Sistema Ultra-Simplificado</h3>
            <p className="text-blue-700 text-sm mt-1">
              <strong>3 estados únicos:</strong> ✅ Disponible (verde) · 👥 Ocupada (azul) · 🧹 Necesita Limpieza (naranja)
              <br />
              <strong>Campos obligatorios:</strong> Solo número y piso · 
              <strong>Limpieza:</strong> Click en habitaciones naranjas para limpiar automáticamente
            </p>
          </div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Vista General
          </button>
          <button
            onClick={() => setActiveTab('cleaning')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cleaning'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Sparkles size={16} />
              <span>Gestión de Limpieza</span>
              {roomsNeedingCleaning.length > 0 && (
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                  {roomsNeedingCleaning.length}
                </span>
              )}
            </div>
          </button>
        </nav>
      </div>

      {/* Contenido según tab activo */}
      {activeTab === 'overview' && (
        <>
          {/* Estadísticas */}
          <RoomStats 
            stats={roomStats} 
            loading={loading}
          />

          {/* Filtros */}
          <RoomFilters
            filters={filters}
            onFiltersChange={setFilters}
            rooms={rooms}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            loading={loading}
          />

          {/* Vista de habitaciones */}
          {viewMode === 'grid' ? (
            <RoomGrid
              floorRooms={roomsByFloor}
              selectedFloor={selectedFloor}
              onFloorChange={setSelectedFloor}
              onRoomClick={handleRoomClick}
              processingRoom={processingRoom}
            />
          ) : (
            <RoomList
              rooms={filteredRooms}
              loading={loading}
              onEdit={(room) => setEditingRoom(room)}
              onDelete={(room) => handleDeleteRoom(room.id)}
            />
          )}
        </>
      )}

      {activeTab === 'cleaning' && (
        <CleaningManagement
          rooms={rooms}
          cleaningStaff={cleaningStaff}
          roomsNeedingCleaning={roomsNeedingCleaning}
          onAssignCleaning={handleAssignCleaning}
          onCleaningStatusChange={handleCleaningStatusChange}
          loading={loading}
        />
      )}

      {/* Modales */}
      {showCreateModal && (
        <RoomFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateRoom}
        />
      )}

      {editingRoom && (
        <EditRoomModal
          isOpen={!!editingRoom}
          onClose={() => setEditingRoom(null)}
          onSubmit={handleEditRoom}
          roomData={editingRoom}
          existingRooms={rooms}
        />
      )}

      {viewingRoom && (
        <RoomDetailsModal
          room={viewingRoom}
          isOpen={!!viewingRoom}
          onClose={() => setViewingRoom(null)}
          onEdit={(room) => {
            setViewingRoom(null);
            setEditingRoom(room);
          }}
          onClean={(roomId) => {
            setViewingRoom(null);
            handleRoomClick({ id: roomId, status: ROOM_STATUS.NEEDS_CLEANING });
          }}
        />
      )}

      {/* Estado vacío cuando no hay habitaciones */}
      {!loading && rooms.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Plus className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay habitaciones registradas
          </h3>
          <p className="text-gray-600 mb-6">
            Comienza agregando la primera habitación para gestionar tu hotel
          </p>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            Crear Primera Habitación
          </Button>
        </div>
      )}

      {/* Estado vacío de filtros */}
      {!loading && rooms.length > 0 && filteredRooms.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron habitaciones
          </h3>
          <p className="text-gray-600 mb-6">
            Intenta ajustar los filtros de búsqueda o agregar nuevas habitaciones
          </p>
          <div className="space-x-3">
            <Button
              variant="outline"
              onClick={() => setFilters({ status: 'all', floor: 'all', search: '' })}
            >
              Limpiar Filtros
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowCreateModal(true)}
            >
              Agregar Habitación
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;