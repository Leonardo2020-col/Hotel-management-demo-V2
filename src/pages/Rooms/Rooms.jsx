// src/pages/Rooms/Rooms.jsx - SIMPLIFICADO CON CLICK PARA LIMPIAR (SIN ROOM_TYPE)
import React, { useState } from 'react'
import { Plus, Calendar, Sparkles, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { useRooms } from '../../hooks/useRooms'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'
import RoomStats from '../../components/rooms/RoomStats'
import RoomFilters from '../../components/rooms/RoomFilters'
import RoomGrid from '../../components/rooms/RoomGrid'
import RoomList from '../../components/rooms/RoomList'
import CreateRoomModal from '../../components/rooms/CreateRoomModal'
import toast from 'react-hot-toast'

const Rooms = () => {
  const navigate = useNavigate()
  
  // Estados principales
  const [viewMode, setViewMode] = useState('grid')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedRooms, setSelectedRooms] = useState([])
  
  // Filtros simplificados (sin tipo de habitación)
  const [filters, setFilters] = useState({
    status: 'all',
    floor: 'all',
    search: ''
  })

  // Hook simplificado con estados de 3 niveles
  const {
    rooms,
    cleaningStaff,
    reservations,
    roomStats,
    loading,
    error,
    ROOM_STATUS,
    createRoom,
    updateRoom,
    deleteRoom,
    updateRoomStatus,
    // FUNCIÓN PRINCIPAL: Click para limpiar
    handleRoomCleanClick,
    processCheckIn,
    processCheckOut,
    getRoomsNeedingCleaning,
    getAvailableRooms,
    getOccupiedRooms,
    refetch
  } = useRooms()

  // Handler para crear habitación
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

  // Handlers para reservas
  const handleViewReservation = (reservationId) => {
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
      
      toast.success(`Check-out realizado. Habitación ${room.number} marcada para limpieza.`)
    } catch (error) {
      console.error('Error in handleProcessCheckOut:', error)
      toast.error('Error inesperado en el check-out')
    }
  }

  // FUNCIÓN PARA LIMPIAR TODAS LAS HABITACIONES PENDIENTES
  const handleCleanAllRooms = async () => {
    const roomsNeedingCleaning = getRoomsNeedingCleaning()
    
    if (roomsNeedingCleaning.length === 0) {
      toast.success('No hay habitaciones que necesiten limpieza')
      return
    }
    
    const confirmed = window.confirm(
      `¿Marcar como limpias ${roomsNeedingCleaning.length} habitación${roomsNeedingCleaning.length > 1 ? 'es' : ''}?`
    )
    
    if (!confirmed) return
    
    try {
      let successCount = 0
      let errorCount = 0
      
      // Procesar en paralelo para mejor rendimiento
      const cleaningPromises = roomsNeedingCleaning.map(async (room) => {
        try {
          await handleRoomCleanClick(room.id)
          successCount++
        } catch (error) {
          errorCount++
          console.error(`Error cleaning room ${room.number}:`, error)
        }
      })
      
      await Promise.all(cleaningPromises)
      
      if (successCount > 0) {
        toast.success(`✨ ${successCount} habitación${successCount > 1 ? 'es' : ''} limpiada${successCount > 1 ? 's' : ''} exitosamente`)
      }
      
      if (errorCount > 0) {
        toast.error(`Error en ${errorCount} habitación${errorCount > 1 ? 'es' : ''}`)
      }
      
    } catch (error) {
      toast.error('Error al limpiar habitaciones en lote')
    }
  }

  const handleRefresh = () => {
    refetch()
    toast.success('Datos actualizados')
  }

  // Filtrar habitaciones (sin tipo de habitación)
  const filteredRooms = React.useMemo(() => {
    if (!rooms) return []

    return rooms.filter(room => {
      // Filtro por búsqueda
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const matchesSearch = 
          room.number.toString().toLowerCase().includes(searchTerm) ||
          room.status.toLowerCase().includes(searchTerm) ||
          (room.currentGuest?.name || '').toLowerCase().includes(searchTerm)
        if (!matchesSearch) return false
      }

      // Filtro por estado simplificado
      if (filters.status !== 'all' && room.status !== filters.status) return false
      
      // Filtro por piso
      if (filters.floor !== 'all' && room.floor.toString() !== filters.floor) return false
      
      return true
    })
  }, [rooms, filters])

  // Obtener conteos para indicadores
  const cleaningCounts = React.useMemo(() => {
    if (!rooms) return { needsCleaning: 0, available: 0, occupied: 0 }
    
    return {
      needsCleaning: rooms.filter(r => r.status === ROOM_STATUS.NEEDS_CLEANING).length,
      available: rooms.filter(r => r.status === ROOM_STATUS.AVAILABLE).length,
      occupied: rooms.filter(r => r.status === ROOM_STATUS.OCCUPIED).length
    }
  }, [rooms, ROOM_STATUS])

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
          <h1 className="text-3xl font-bold text-gray-900">Panel de Habitaciones</h1>
          <p className="text-gray-600 mt-1">
            Sistema simplificado: Disponible · Ocupada · Necesita Limpieza
          </p>
          {cleaningCounts.needsCleaning > 0 && (
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
              <Sparkles className="w-4 h-4 mr-1" />
              {cleaningCounts.needsCleaning} habitación{cleaningCounts.needsCleaning > 1 ? 'es' : ''} necesitan limpieza
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
          {/* Acción de limpieza masiva */}
          {cleaningCounts.needsCleaning > 0 && (
            <Button
              variant="warning"
              icon={Sparkles}
              onClick={handleCleanAllRooms}
              disabled={loading}
              className="font-semibold"
            >
              🧹 Limpiar Todas ({cleaningCounts.needsCleaning})
            </Button>
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

      {/* Indicadores de estado rápido */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
          <div className="flex flex-wrap gap-6 items-center justify-between">
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>{cleaningCounts.available} Disponibles</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>{cleaningCounts.occupied} Ocupadas</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>{cleaningCounts.needsCleaning} Necesitan Limpieza</span>
              </div>
            </div>
            
            {cleaningCounts.needsCleaning === 0 && rooms && rooms.length > 0 && (
              <div className="flex items-center text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4 mr-1" />
                ¡Todas las habitaciones están limpias!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistics */}
      <RoomStats 
        stats={roomStats} 
        loading={loading} 
      />

      {/* Filters (sin tipo de habitación) */}
      <RoomFilters
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        loading={loading}
      />

      {/* Loading State */}
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
              onViewReservation={handleViewReservation}
              onProcessCheckIn={handleProcessCheckIn}
              onProcessCheckOut={handleProcessCheckOut}
              // FUNCIÓN PRINCIPAL: Click para limpiar
              onRoomCleanClick={handleRoomCleanClick}
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
              floor: 'all',
              search: ''
            })}
          >
            Limpiar Filtros
          </Button>
        </div>
      )}

      {/* Empty State para no hay habitaciones */}
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

      {/* Modal para crear habitación */}
      {showCreateModal && (
        <CreateRoomModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateRoom}
          loading={loading}
        />
      )}

      {/* Información de sistema simplificado */}
      {!loading && rooms && rooms.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Sparkles className="w-6 h-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Sistema de Limpieza Simplificado</h3>
              <div className="text-blue-700 text-sm mt-2 space-y-1">
                <p>• <strong>Verde (Disponible):</strong> Habitación limpia y lista para nuevos huéspedes</p>
                <p>• <strong>Azul (Ocupada):</strong> Habitación con huésped actualmente</p>
                <p>• <strong>Naranja (Necesita Limpieza):</strong> Haz click para marcar como limpia</p>
              </div>
              {cleaningCounts.needsCleaning > 0 && (
                <div className="mt-3 p-2 bg-orange-100 border border-orange-300 rounded">
                  <p className="text-orange-800 text-sm font-medium">
                    🧹 {cleaningCounts.needsCleaning} habitación{cleaningCounts.needsCleaning > 1 ? 'es' : ''} esperando limpieza. 
                    Haz click en las habitaciones naranjas o usa el botón "Limpiar Todas".
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer con estadísticas */}
      {!loading && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>Total: {rooms?.length || 0} habitaciones</span>
              <span>Disponibles: {cleaningCounts.available}</span>
              <span>Ocupadas: {cleaningCounts.occupied}</span>
              <span>Pendientes limpieza: {cleaningCounts.needsCleaning}</span>
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
    </div>
  )
}

export default Rooms;