// src/pages/Rooms/Rooms.jsx - CORREGIDO PARA MANEJAR TIPOS DE HABITACIÓN
import React, { useState, useEffect } from 'react'
import { Plus, Calendar, Sparkles, RefreshCw, AlertCircle } from 'lucide-react'
import { db } from '../../lib/supabase'
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
  
  // Estados de datos
  const [rooms, setRooms] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [cleaningStaff, setCleaningStaff] = useState([])
  const [roomStats, setRoomStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    cleaning: 0,
    maintenance: 0,
    outOfOrder: 0,
    needsCleaning: 0,
    occupancyRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filtros
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    floor: 'all',
    cleaningStatus: 'all',
    search: ''
  })

  // Configuración de tabs
  const tabs = [
    { id: 'rooms', label: 'Habitaciones', icon: Calendar },
    { id: 'cleaning', label: 'Gestión de Limpieza', icon: Sparkles }
  ]

  // Cargar datos iniciales
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Cargando datos...')

      // 1. Cargar tipos de habitación primero
      const { data: roomTypesData, error: roomTypesError } = await db.getRoomTypes()
      if (roomTypesError) {
        console.error('Error loading room types:', roomTypesError)
        throw new Error('Error al cargar tipos de habitación: ' + roomTypesError.message)
      }

      console.log('Room types loaded:', roomTypesData)
      setRoomTypes(roomTypesData || [])

      // 2. Cargar habitaciones
      const { data: roomsData, error: roomsError } = await db.getRooms()
      if (roomsError) {
        console.error('Error loading rooms:', roomsError)
        throw new Error('Error al cargar habitaciones: ' + roomsError.message)
      }

      console.log('Rooms loaded:', roomsData)
      setRooms(roomsData || [])

      // 3. Calcular estadísticas
      const stats = calculateRoomStats(roomsData || [])
      setRoomStats(stats)

      // 4. Cargar personal de limpieza
      try {
        const { data: staffData, error: staffError } = await db.getCleaningStaff()
        if (!staffError && staffData) {
          setCleaningStaff(staffData)
        } else {
          // Fallback para personal de limpieza
          setCleaningStaff([
            { id: 1, name: 'María González', shift: 'morning', active: true },
            { id: 2, name: 'Ana López', shift: 'afternoon', active: true },
            { id: 3, name: 'Pedro Martín', shift: 'morning', active: true }
          ])
        }
      } catch (staffError) {
        console.warn('Could not load cleaning staff, using fallback')
        setCleaningStaff([
          { id: 1, name: 'María González', shift: 'morning', active: true },
          { id: 2, name: 'Ana López', shift: 'afternoon', active: true }
        ])
      }

    } catch (err) {
      console.error('Error loading data:', err)
      setError(err.message || 'Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  // Calcular estadísticas de habitaciones
  const calculateRoomStats = (roomsData) => {
    if (!roomsData || roomsData.length === 0) {
      return {
        total: 0,
        available: 0,
        occupied: 0,
        cleaning: 0,
        maintenance: 0,
        outOfOrder: 0,
        needsCleaning: 0,
        occupancyRate: 0
      }
    }

    const total = roomsData.length
    const available = roomsData.filter(r => r.status === 'available').length
    const occupied = roomsData.filter(r => r.status === 'occupied').length
    const cleaning = roomsData.filter(r => r.status === 'cleaning').length
    const maintenance = roomsData.filter(r => r.status === 'maintenance').length
    const outOfOrder = roomsData.filter(r => r.status === 'out_of_order').length
    const needsCleaning = roomsData.filter(r => r.cleaning_status === 'dirty').length
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0

    return {
      total,
      available,
      occupied,
      cleaning,
      maintenance,
      outOfOrder,
      needsCleaning,
      occupancyRate
    }
  }

  // Efecto para cargar datos al montar el componente
  useEffect(() => {
    loadData()
  }, [])

  // Handlers
  const handleCreateRoom = async (roomData) => {
    try {
      console.log('Creating room with data:', roomData)
      
      // Asegurar que tenemos un tipo de habitación válido
      if (!roomData.type && roomTypes.length > 0) {
        roomData.type = roomTypes[0].name
        roomData.room_type_id = roomTypes[0].id
      }

      const { data, error } = await db.createRoom(roomData)
      
      if (error) {
        console.error('Error creating room:', error)
        toast.error(error.message || 'Error al crear habitación')
        return
      }
      
      console.log('Room created successfully:', data)
      
      // Recargar datos después de crear
      await loadData()
      setShowCreateModal(false)
      toast.success(`Habitación ${roomData.number} creada exitosamente`)
      
    } catch (error) {
      console.error('Unexpected error creating room:', error)
      toast.error('Error inesperado al crear habitación')
    }
  }

  const handleEditRoom = async (roomId, roomData) => {
    try {
      const { data, error } = await db.updateRoom(roomId, roomData)
      
      if (error) {
        toast.error(error.message || 'Error al actualizar habitación')
        return
      }
      
      // Recargar datos después de actualizar
      await loadData()
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
      const { data, error } = await db.deleteRoom(roomId)
      
      if (error) {
        toast.error(error.message || 'Error al eliminar habitación')
        return
      }
      
      // Remover de selección si estaba seleccionada
      setSelectedRooms(prev => prev.filter(id => id !== roomId))
      
      // Recargar datos después de eliminar
      await loadData()
      toast.success(`Habitación ${roomNumber} eliminada exitosamente`)
    } catch (error) {
      toast.error('Error inesperado al eliminar habitación')
    }
  }

  const handleStatusChange = async (roomId, newStatus) => {
    try {
      const { data, error } = await db.updateRoomStatus(roomId, newStatus)
      
      if (error) {
        toast.error(error.message || 'Error al actualizar estado')
        return
      }
      
      // Actualizar estado local inmediatamente
      setRooms(prev => prev.map(room => 
        room.id === roomId ? { ...room, status: newStatus } : room
      ))
      
      // Recalcular estadísticas
      const updatedRooms = rooms.map(room => 
        room.id === roomId ? { ...room, status: newStatus } : room
      )
      setRoomStats(calculateRoomStats(updatedRooms))
      
      toast.success('Estado actualizado exitosamente')
    } catch (error) {
      toast.error('Error inesperado al actualizar estado')
    }
  }

  const handleCleaningStatusChange = async (roomId, newStatus) => {
    try {
      const cleaningStatus = newStatus
      let roomStatus = null
      
      // Determinar si también necesitamos cambiar el estado de la habitación
      if (newStatus === 'clean') {
        roomStatus = 'available'
      } else if (newStatus === 'in_progress') {
        roomStatus = 'cleaning'
      }
      
      const { data, error } = await db.updateRoomStatus(roomId, roomStatus, cleaningStatus)
      
      if (error) {
        toast.error(error.message || 'Error al actualizar estado de limpieza')
        return
      }
      
      // Actualizar estado local
      setRooms(prev => prev.map(room => 
        room.id === roomId ? { 
          ...room, 
          cleaning_status: cleaningStatus,
          ...(roomStatus && { status: roomStatus })
        } : room
      ))
      
      // Recalcular estadísticas
      const updatedRooms = rooms.map(room => 
        room.id === roomId ? { 
          ...room, 
          cleaning_status: cleaningStatus,
          ...(roomStatus && { status: roomStatus })
        } : room
      )
      setRoomStats(calculateRoomStats(updatedRooms))
      
      toast.success('Estado de limpieza actualizado exitosamente')
    } catch (error) {
      toast.error('Error inesperado al actualizar estado de limpieza')
    }
  }

  const handleAssignCleaning = async (roomIds, staffId) => {
    try {
      const staff = cleaningStaff.find(s => s.id === staffId)
      if (!staff) {
        toast.error('Personal de limpieza no encontrado')
        return
      }

      const { data, error } = await db.assignCleaning(roomIds, staff.name)
      
      if (error) {
        toast.error(error.message || 'Error al asignar limpieza')
        return
      }
      
      // Actualizar estado local
      setRooms(prev => prev.map(room => 
        roomIds.includes(room.id) ? { 
          ...room, 
          cleaning_status: 'in_progress',
          assigned_cleaner: staff.name,
          status: 'cleaning'
        } : room
      ))
      
      setSelectedRooms([])
      setShowAssignCleaning(false)
      
      toast.success(`Limpieza asignada a ${staff.name} para ${roomIds.length} habitación${roomIds.length > 1 ? 'es' : ''}`)
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
    loadData()
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
      
      // Filtro por tipo - CORREGIDO
      if (filters.type !== 'all') {
        // Buscar por nombre del tipo
        if (room.room_type?.name !== filters.type) return false
      }
      
      // Filtro por piso
      if (filters.floor !== 'all' && room.floor.toString() !== filters.floor) return false
      
      // Filtro por estado de limpieza
      if (filters.cleaningStatus !== 'all' && room.cleaning_status !== filters.cleaningStatus) return false
      
      return true
    })
  }, [rooms, filters])

  // Calcular roomsByType para las estadísticas
  const roomsByType = React.useMemo(() => {
    if (!rooms || !roomTypes) return []

    return roomTypes.map(type => {
      const typeRooms = rooms.filter(room => room.room_type?.name === type.name)
      return {
        name: type.name,
        count: typeRooms.length,
        available: typeRooms.filter(r => r.status === 'available').length,
        occupied: typeRooms.filter(r => r.status === 'occupied').length,
        averageRate: type.base_rate || 0
      }
    }).filter(type => type.count > 0)
  }, [rooms, roomTypes])

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
          roomsNeedingCleaning={rooms.filter(r => r.cleaning_status === 'dirty') || []}
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

export default Rooms;