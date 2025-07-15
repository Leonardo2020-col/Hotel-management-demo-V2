// src/pages/Rooms/Rooms.jsx - Actualizado para Supabase
import React, { useState } from 'react'
import { Plus, Calendar, Sparkles, RefreshCw, AlertCircle } from 'lucide-react'
import { useRooms } from '../../hooks/useRooms'
import Button from '../../components/common/Button'
import RoomStats from '../../components/rooms/RoomStats'
import RoomFilters from '../../components/rooms/RoomFilters'
import RoomGrid from '../../components/rooms/RoomGrid'
import RoomList from '../../components/rooms/RoomList'
import CleaningManagement from '../../components/rooms/CleaningManagement'
import CreateRoomModal from '../../components/rooms/CreateRoomModal'
import toast from 'react-hot-toast'

const Rooms = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState('rooms')
  const [viewMode, setViewMode] = useState('grid')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedRooms, setSelectedRooms] = useState([])
  const [showAssignCleaning, setShowAssignCleaning] = useState(false)
  
  // Filtros
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    floor: 'all',
    cleaningStatus: 'all',
    search: ''
  })

  // Hook actualizado para Supabase
  const {
    rooms,
    roomTypes,
    cleaningStaff,
    roomStats,
    roomsByType,
    loading,
    error,
    ROOM_STATUS,
    CLEANING_STATUS,
    createRoom,
    updateRoom,
    deleteRoom,
    updateRoomStatus,
    updateCleaningStatus,
    assignCleaning,
    getRoomsNeedingCleaning,
    getAvailableRooms,
    getCleaningStats,
    refetch
  } = useRooms()

  // Configuración de tabs
  const tabs = [
    { id: 'rooms', label: 'Habitaciones', icon: Calendar },
    { id: 'cleaning', label: 'Gestión de Limpieza', icon: Sparkles }
  ]

  // Handlers
  const handleCreateRoom = async (roomData) => {
    try {
      const { data, error } = await createRoom(roomData)
      
      if (error) {
        toast.error(error.message || 'Error al crear habitación')
        return
      }
      
      setShowCreateModal(false)
      toast.success('Habitación creada exitosamente')
    } catch (error) {
      toast.error('Error inesperado al crear habitación')
    }
  }

  const handleEditRoom = async (roomId, roomData) => {
    try {
      const { data, error } = await updateRoom(roomId, roomData)
      
      if (error) {
        toast.error(error.message || 'Error al actualizar habitación')
        return
      }
      
      toast.success('Habitación actualizada exitosamente')
    } catch (error) {
      toast.error('Error inesperado al actualizar habitación')
    }
  }

  const handleDeleteRoom = async (roomId) => {
    const room = rooms.find(r => r.id === roomId)
    const roomNumber = room?.number || 'desconocida'
    
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la habitación ${roomNumber}?`)) {
      return
    }

    try {
      const { data, error } = await deleteRoom(roomId)
      
      if (error) {
        toast.error(error.message || 'Error al eliminar habitación')
        return
      }
      
      // Remover de selección si estaba seleccionada
      setSelectedRooms(prev => prev.filter(id => id !== roomId))
      toast.success(`Habitación ${roomNumber} eliminada exitosamente`)
    } catch (error) {
      toast.error('Error inesperado al eliminar habitación')
    }
  }

  const handleStatusChange = async (roomId, newStatus) => {
    try {
      const { data, error } = await updateRoomStatus(roomId, newStatus)
      
      if (error) {
        toast.error(error.message || 'Error al actualizar estado')
        return
      }
      
      // El toast ya se muestra en el hook
    } catch (error) {
      toast.error('Error inesperado al actualizar estado')
    }
  }

  const handleCleaningStatusChange = async (roomId, newStatus) => {
    try {
      const { data, error } = await updateCleaningStatus(roomId, newStatus)
      
      if (error) {
        toast.error(error.message || 'Error al actualizar estado de limpieza')
        return
      }
      
      // El toast ya se muestra en el hook
    } catch (error) {
      toast.error('Error inesperado al actualizar estado de limpieza')
    }
  }

  const handleAssignCleaning = async (roomIds, staffId) => {
    try {
      const { data, error } = await assignCleaning(roomIds, staffId)
      
      if (error) {
        toast.error(error.message || 'Error al asignar limpieza')
        return
      }
      
      setSelectedRooms([]) // Limpiar selección después de asignar
      setShowAssignCleaning(false)
    } catch (error) {
      toast.error('Error inesperado al asignar limpieza')
    }
  }

  const handleBulkAssignCleaning = () => {
    if (selectedRooms.length === 0) {
      toast.warning('Selecciona al menos una habitación')
      return
    }
    setShowAssignCleaning(true)
  }

  const handleRefresh = () => {
    refetch()
    toast.success('Datos actualizados')
  }

  // Filtrar habitaciones
  const filteredRooms = React.useMemo(() => {
    if (!rooms) return []

    return rooms.filter(room => {
      // Filtro por búsqueda
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const matchesSearch = 
          room.number.toString().toLowerCase().includes(searchTerm) ||
          room.room_type?.name?.toLowerCase().includes(searchTerm) ||
          room.status.toLowerCase().includes(searchTerm)
        if (!matchesSearch) return false
      }

      // Filtro por estado
      if (filters.status !== 'all' && room.status !== filters.status) return false
      
      // Filtro por tipo
      if (filters.type !== 'all' && room.room_type_id !== filters.type) return false
      
      // Filtro por piso
      if (filters.floor !== 'all' && room.floor.toString() !== filters.floor) return false
      
      // Filtro por estado de limpieza
      if (filters.cleaningStatus !== 'all' && room.cleaning_status !== filters.cleaningStatus) return false
      
      return true
    })
  }, [rooms, filters])

  // Manejar estado de error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-3">
            <Button 
              variant="primary" 
              onClick={handleRefresh}
              icon={RefreshCw}
              disabled={loading}
            >
              {loading ? 'Recargando...' : 'Reintentar'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Recargar página
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Habitaciones</h1>
          <p className="text-gray-600 mt-1">
            Administra habitaciones, limpieza y mantenimiento
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
          {/* Acciones en lote */}
          {selectedRooms.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedRooms.length} seleccionada{selectedRooms.length > 1 ? 's' : ''}
              </span>
              <Button
                variant="outline"
                size="sm"
                icon={Sparkles}
                onClick={handleBulkAssignCleaning}
                disabled={loading}
              >
                Asignar Limpieza
              </Button>
            </div>
          )}
          
          {/* Botón de actualizar */}
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? 'Actualizando...' : 'Actualizar'}
          </Button>
          
          {/* Botón crear habitación */}
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
            disabled={loading}
          >
            Nueva Habitación
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
                disabled={loading}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          {/* Statistics */}
          <RoomStats 
            stats={roomStats} 
            roomsByType={roomsByType}
            loading={loading} 
          />

          {/* Filters */}
          <RoomFilters
            filters={filters}
            onFiltersChange={setFilters}
            roomTypes={roomTypes || []}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            loading={loading}
          />

          {/* Loading State para la lista */}
          {loading && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando habitaciones...</p>
            </div>
          )}

          {/* Rooms Display */}
          {!loading && (
            <>
              {viewMode === 'grid' ? (
                <RoomGrid
                  rooms={filteredRooms}
                  loading={loading}
                  selectedRooms={selectedRooms}
                  onSelectRoom={setSelectedRooms}
                  onStatusChange={handleStatusChange}
                  onCleaningStatusChange={handleCleaningStatusChange}
                  onEdit={handleEditRoom}
                  onDelete={handleDeleteRoom}
                />
              ) : (
                <RoomList
                  rooms={filteredRooms}
                  loading={loading}
                  selectedRooms={selectedRooms}
                  onSelectRoom={setSelectedRooms}
                  onStatusChange={handleStatusChange}
                  onCleaningStatusChange={handleCleaningStatusChange}
                  onEdit={handleEditRoom}
                  onDelete={handleDeleteRoom}
                />
              )}
            </>
          )}

          {/* Empty State para habitaciones filtradas */}
          {!loading && filteredRooms.length === 0 && rooms && rooms.length > 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron habitaciones
              </h3>
              <p className="text-gray-600 mb-4">
                Intenta ajustar los filtros de búsqueda
              </p>
              <Button
                variant="outline"
                onClick={() => setFilters({
                  status: 'all',
                  type: 'all',
                  floor: 'all',
                  cleaningStatus: 'all',
                  search: ''
                })}
              >
                Limpiar Filtros
              </Button>
            </div>
          )}

          {/* Empty State para no hay habitaciones en absoluto */}
          {!loading && (!rooms || rooms.length === 0) && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay habitaciones registradas
              </h3>
              <p className="text-gray-600 mb-4">
                Comienza creando la primera habitación del hotel
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
        </div>
      )}

      {/* Tab de Gestión de Limpieza */}
      {activeTab === 'cleaning' && (
        <CleaningManagement
          rooms={rooms || []}
          cleaningStaff={cleaningStaff || []}
          cleaningStats={getCleaningStats()}
          roomsNeedingCleaning={getRoomsNeedingCleaning()}
          onAssignCleaning={handleAssignCleaning}
          onCleaningStatusChange={handleCleaningStatusChange}
          loading={loading}
        />
      )}

      {/* Modal para crear habitación */}
      {showCreateModal && (
        <CreateRoomModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateRoom}
          roomTypes={roomTypes || []}
          loading={loading}
        />
      )}

      {/* Modal para asignar limpieza en lote */}
      {showAssignCleaning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Asignar Limpieza a {selectedRooms.length} Habitación{selectedRooms.length > 1 ? 'es' : ''}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Personal de Limpieza
                </label>
                <select
                  id="cleaning-staff"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  defaultValue=""
                >
                  <option value="" disabled>Seleccionar personal...</option>
                  {cleaningStaff
                    ?.filter(staff => staff.active)
                    .map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} - {staff.shift}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-sm text-gray-600 mb-1">Habitaciones seleccionadas:</p>
                <div className="text-sm font-medium text-gray-900">
                  {selectedRooms
                    .map(roomId => rooms.find(r => r.id === roomId)?.number)
                    .filter(Boolean)
                    .join(', ')
                  }
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    const staffSelect = document.getElementById('cleaning-staff')
                    const staffId = parseInt(staffSelect.value)
                    if (staffId) {
                      handleAssignCleaning(selectedRooms, staffId)
                    } else {
                      toast.warning('Selecciona un miembro del personal')
                    }
                  }}
                  className="flex-1"
                  disabled={loading}
                >
                  Asignar Limpieza
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAssignCleaning(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información de estado en la parte inferior */}
      {!loading && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>Total: {rooms?.length || 0} habitaciones</span>
              <span>Disponibles: {roomStats.available}</span>
              <span>Ocupadas: {roomStats.occupied}</span>
              <span>Limpieza: {roomStats.cleaning}</span>
              <span>Mantenimiento: {roomStats.maintenance}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>Ocupación: {roomStats.occupancyRate}%</span>
              <span>Última actualización: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Rooms