// src/pages/Rooms/Rooms.jsx - CORREGIDO CON MANEJO DE RESERVAS
import React, { useState } from 'react'
import { Plus, Calendar, Sparkles, RefreshCw, AlertCircle, LogIn, LogOut } from 'lucide-react'
import { useRooms } from '../../hooks/useRooms'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'
import RoomStats from '../../components/rooms/RoomStats'
import RoomFilters from '../../components/rooms/RoomFilters'
import RoomGrid from '../../components/rooms/RoomGrid'
import RoomList from '../../components/rooms/RoomList'
import CleaningManagement from '../../components/rooms/CleaningManagement'
import CreateRoomModal from '../../components/rooms/CreateRoomModal'
import toast from 'react-hot-toast'

const Rooms = () => {
  const navigate = useNavigate()
  
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

  // Hook corregido con reservas
  const {
    rooms,
    roomTypes,
    cleaningStaff,
    reservations,
    roomStats,
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
    // NUEVAS FUNCIONES para manejo de reservas
    getRoomReservationInfo,
    processCheckIn,
    processCheckOut,
    refetch
  } = useRooms()

  // Configuración de tabs
  const tabs = [
    { id: 'rooms', label: 'Habitaciones', icon: Calendar },
    { id: 'cleaning', label: 'Gestión de Limpieza', icon: Sparkles }
  ]

  // Handlers básicos
  const handleCreateRoom = async (roomData) => {
    try {
      console.log('Creating room with data:', roomData)
      
      const { data, error } = await createRoom(roomData)
      
      if (error) {
        toast.error(error.message || 'Error al crear habitación')
        return
      }
      
      setShowCreateModal(false)
      toast.success(`Habitación ${roomData.number} creada exitosamente`)
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
    
    // Verificar si la habitación está ocupada
    if (room?.status === ROOM_STATUS.OCCUPIED) {
      toast.error('No se puede eliminar una habitación ocupada. Realiza el check-out primero.')
      return
    }
    
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la habitación ${roomNumber}?`)) {
      return
    }

    try {
      const { data, error } = await deleteRoom(roomId)
      
      if (error) {
        toast.error(error.message || 'Error al eliminar habitación')
        return
      }
      
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
      
      setSelectedRooms([])
      setShowAssignCleaning(false)
    } catch (error) {
      toast.error('Error inesperado al asignar limpieza')
    }
  }

  // NUEVOS HANDLERS para manejo de reservas
  const handleViewReservation = (reservationId) => {
    // Navegar a la página de reservas con el ID específico
    navigate(`/reservations?id=${reservationId}`)
  }

  const handleProcessCheckIn = async (roomId, reservationId) => {
    try {
      const room = rooms.find(r => r.id === roomId)
      
      if (!reservationId) {
        toast.error('ID de reserva no encontrado')
        return
      }
      
      const confirmed = window.confirm(
        `¿Realizar check-in para la habitación ${room?.number}?`
      )
      
      if (!confirmed) return
      
      const { data, error } = await processCheckIn(roomId, reservationId)
      
      if (error) {
        toast.error(error.message || 'Error en el check-in')
        return
      }
      
      toast.success(`Check-in realizado exitosamente en habitación ${room?.number}`)
    } catch (error) {
      console.error('Error in handleProcessCheckIn:', error)
      toast.error('Error inesperado en el check-in')
    }
  }

  const handleProcessCheckOut = async (roomId, paymentMethod = 'cash') => {
    try {
      const room = rooms.find(r => r.id === roomId)
      
      if (!room?.currentGuest) {
        toast.error('No se encontró información de huésped para esta habitación')
        return
      }
      
      const confirmed = window.confirm(
        `¿Realizar check-out para ${room.currentGuest.name} de la habitación ${room.number}?`
      )
      
      if (!confirmed) return
      
      const { data, error } = await processCheckOut(roomId, paymentMethod)
      
      if (error) {
        toast.error(error.message || 'Error en el check-out')
        return
      }
      
      toast.success(`Check-out realizado exitosamente para habitación ${room.number}`)
    } catch (error) {
      console.error('Error in handleProcessCheckOut:', error)
      toast.error('Error inesperado en el check-out')
    }
  }

  const handleViewRoomReservationInfo = (roomId) => {
    try {
      const info = getRoomReservationInfo(roomId)
      
      if (info.error) {
        toast.warning(info.error)
        return
      }
      
      // Mostrar información detallada (ya se maneja en RoomGrid)
      console.log('Room reservation info:', info)
    } catch (error) {
      toast.error('Error al obtener información de la reserva')
    }
  }

  // Handler para acciones en lote
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
          (room.room_type || '').toLowerCase().includes(searchTerm) ||
          room.status.toLowerCase().includes(searchTerm) ||
          (room.currentGuest?.name || '').toLowerCase().includes(searchTerm)
        if (!matchesSearch) return false
      }

      // Filtro por estado
      if (filters.status !== 'all' && room.status !== filters.status) return false
      
      // Filtro por tipo
      if (filters.type !== 'all' && room.room_type !== filters.type) return false
      
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
            Administra habitaciones, reservas, limpieza y mantenimiento
          </p>
          {reservations && reservations.length > 0 && (
            <p className="text-sm text-blue-600 mt-1">
              {reservations.length} reserva{reservations.length !== 1 ? 's' : ''} activa{reservations.length !== 1 ? 's' : ''}
            </p>
          )}
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
            roomsByType={[]} // Simplificado
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
                  onEdit={handleEditRoom}
                  onDelete={handleDeleteRoom}
                  // NUEVAS PROPS para manejo de reservas
                  onViewReservation={handleViewReservation}
                  onProcessCheckIn={handleProcessCheckIn}
                  onProcessCheckOut={handleProcessCheckOut}
                />
              ) : (
                <RoomList
                  rooms={filteredRooms}
                  loading={loading}
                  selectedRooms={selectedRooms}
                  onSelectRoom={setSelectedRooms}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEditRoom}
                  onDelete={handleDeleteRoom}
                  // NUEVAS PROPS para manejo de reservas
                  onViewReservation={handleViewReservation}
                  onProcessCheckIn={handleProcessCheckIn}
                  onProcessCheckOut={handleProcessCheckOut}
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
                    ?.filter(staff => staff.is_active)
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
              {reservations && reservations.length > 0 && (
                <span className="text-blue-600 font-medium">
                  {reservations.length} reserva{reservations.length !== 1 ? 's' : ''} activa{reservations.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>Ocupación: {roomStats.occupancyRate}%</span>
              <span>Ingresos hoy: {roomStats.revenue ? `S/ ${roomStats.revenue.today.toFixed(2)}` : 'S/ 0.00'}</span>
              <span>Última actualización: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas adicionales de reservas */}
      {!loading && reservations && reservations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Resumen de Reservas Activas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {reservations.filter(r => r.status === 'checked_in').length}
              </div>
              <div className="text-blue-700">Check-in realizados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {reservations.filter(r => r.status === 'confirmed' && 
                  new Date(r.check_in).toDateString() === new Date().toDateString()).length}
              </div>
              <div className="text-blue-700">Llegadas hoy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {reservations.filter(r => r.status === 'checked_in' && 
                  new Date(r.check_out).toDateString() === new Date().toDateString()).length}
              </div>
              <div className="text-blue-700">Salidas hoy</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Rooms;