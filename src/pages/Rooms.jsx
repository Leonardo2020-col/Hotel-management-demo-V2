// pages/Rooms.jsx - VERSIÓN FINAL CON CRUD COMPLETO
import React, { useState, useEffect } from 'react'
import { 
  Hotel, 
  Users, 
  Bed, 
  Sparkles, 
  Wrench, 
  CheckCircle, 
  Plus, 
  Edit2, 
  Trash2, 
  Search,
  RefreshCw,
  Eye,
  DollarSign,
  Building,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

// Importar los componentes modales
import RoomFormModal from '../components/rooms/RoomFormModal'
import RoomDeleteModal from '../components/rooms/RoomDeleteModal'
import RoomViewModal from '../components/rooms/RoomViewModal'

const Rooms = () => {
  const { getPrimaryBranch, isAdmin } = useAuth()
  const primaryBranch = getPrimaryBranch()
  
  // Estados principales
  const [rooms, setRooms] = useState([])
  const [roomStatuses, setRoomStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estados de UI
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [floorFilter, setFloorFilter] = useState('all')

  // ✅ Cargar estados de habitación
  const fetchRoomStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('room_status')
        .select('*')
        .order('status')
      
      if (error) throw error
      setRoomStatuses(data || [])
    } catch (err) {
      console.error('Error fetching room statuses:', err)
    }
  }

  // ✅ Cargar habitaciones
  const fetchRooms = async () => {
    if (!primaryBranch?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log('🏨 Cargando habitaciones para:', primaryBranch.name)

      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id,
          room_number,
          floor,
          base_price,
          description,
          is_active,
          created_at,
          updated_at,
          room_status:status_id(
            id,
            status,
            color,
            is_available
          )
        `)
        .eq('branch_id', primaryBranch.id)
        .order('room_number')

      if (error) throw error

      const processedRooms = (data || []).map(room => ({
        ...room,
        statusName: room.room_status?.status || 'disponible',
        statusColor: room.room_status?.color || '#6b7280',
        isAvailable: room.room_status?.is_available || false,
        priceFormatted: new Intl.NumberFormat('es-PE', {
          style: 'currency',
          currency: 'PEN'
        }).format(room.base_price || 0)
      }))

      setRooms(processedRooms)
      console.log('✅ Habitaciones cargadas:', processedRooms.length)
      
    } catch (err) {
      console.error('❌ Error cargando habitaciones:', err)
      setError(err.message)
      toast.error('Error al cargar habitaciones')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Crear habitación
  const createRoom = async (formData) => {
    try {
      setIsSubmitting(true)
      
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          branch_id: primaryBranch.id,
          room_number: formData.room_number,
          floor: parseInt(formData.floor),
          base_price: parseFloat(formData.base_price),
          description: formData.description,
          status_id: formData.status_id,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Habitación creada exitosamente')
      setIsCreateModalOpen(false)
      await fetchRooms()
      
    } catch (error) {
      console.error('Error creating room:', error)
      if (error.code === '23505') {
        toast.error('Ya existe una habitación con ese número')
      } else {
        toast.error('Error al crear habitación')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ✅ Actualizar habitación
  const updateRoom = async (formData) => {
    if (!selectedRoom) return

    try {
      setIsSubmitting(true)
      
      const { data, error } = await supabase
        .from('rooms')
        .update({
          room_number: formData.room_number,
          floor: parseInt(formData.floor),
          base_price: parseFloat(formData.base_price),
          description: formData.description,
          status_id: formData.status_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRoom.id)
        .select()
        .single()

      if (error) throw error

      toast.success('Habitación actualizada exitosamente')
      setIsEditModalOpen(false)
      setSelectedRoom(null)
      await fetchRooms()
      
    } catch (error) {
      console.error('Error updating room:', error)
      if (error.code === '23505') {
        toast.error('Ya existe una habitación con ese número')
      } else {
        toast.error('Error al actualizar habitación')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ✅ Eliminar habitación (soft delete)
  const deleteRoom = async (roomId) => {
    try {
      setIsSubmitting(true)
      
      const { error } = await supabase
        .from('rooms')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId)

      if (error) throw error

      toast.success('Habitación eliminada exitosamente')
      setIsDeleteModalOpen(false)
      setSelectedRoom(null)
      await fetchRooms()
      
    } catch (error) {
      console.error('Error deleting room:', error)
      toast.error('Error al eliminar habitación')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ✅ Actualizar estado de habitación
  const updateRoomStatus = async (roomId, newStatus) => {
    try {
      const loadingToast = toast.loading('Actualizando estado...')
      
      const { data: statusData, error: statusError } = await supabase
        .from('room_status')
        .select('id')
        .eq('status', newStatus)
        .single()

      if (statusError) throw statusError

      const { error } = await supabase
        .from('rooms')
        .update({ 
          status_id: statusData.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId)

      if (error) throw error

      toast.dismiss(loadingToast)
      toast.success('Estado actualizado')
      await fetchRooms()
      
    } catch (error) {
      console.error('Error updating room status:', error)
      toast.error('Error al actualizar estado')
    }
  }

  // ✅ Abrir modal de edición
  const openEditModal = (room) => {
    setSelectedRoom(room)
    setIsEditModalOpen(true)
  }

  // ✅ Abrir modal de eliminación
  const openDeleteModal = (room) => {
    setSelectedRoom(room)
    setIsDeleteModalOpen(true)
  }

  // ✅ Abrir modal de vista
  const openViewModal = (room) => {
    setSelectedRoom(room)
    setIsViewModalOpen(true)
  }

  // ✅ Filtrar habitaciones
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || room.statusName === statusFilter
    
    const matchesFloor = floorFilter === 'all' || room.floor.toString() === floorFilter

    return matchesSearch && matchesStatus && matchesFloor && room.is_active
  })

  // ✅ Obtener pisos únicos
  const uniqueFloors = [...new Set(rooms.filter(r => r.is_active).map(room => room.floor))].sort((a, b) => a - b)

  // ✅ Configuración de estados
  const statusConfig = {
    disponible: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      badgeColor: 'bg-green-100 text-green-800'
    },
    ocupada: {
      icon: Users,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      badgeColor: 'bg-red-100 text-red-800'
    },
    limpieza: {
      icon: Sparkles,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      badgeColor: 'bg-yellow-100 text-yellow-800'
    },
    mantenimiento: {
      icon: Wrench,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    fuera_servicio: {
      icon: AlertTriangle,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-800',
      badgeColor: 'bg-gray-100 text-gray-800'
    }
  }

  // ✅ Estadísticas
  const stats = {
    total: rooms.filter(r => r.is_active).length,
    available: rooms.filter(r => r.statusName === 'disponible' && r.is_active).length,
    occupied: rooms.filter(r => r.statusName === 'ocupada' && r.is_active).length,
    cleaning: rooms.filter(r => r.statusName === 'limpieza' && r.is_active).length,
    maintenance: rooms.filter(r => r.statusName === 'mantenimiento' && r.is_active).length
  }

  stats.occupancyRate = stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0

  // ✅ Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchRoomStatuses(),
        fetchRooms()
      ])
    }
    loadData()
  }, [primaryBranch?.id])

  // ✅ Renderizar estado de carga
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Hotel className="h-8 w-8 mr-3 text-blue-600" />
            Gestión de Habitaciones
          </h1>
          <p className="text-gray-600 mt-1">
            {primaryBranch?.name} • {stats.total} habitaciones activas
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchRooms}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refrescar
          </button>
          
          {isAdmin() && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Habitación
            </button>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total</p>
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-blue-100 text-sm">habitaciones</p>
            </div>
            <Hotel className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Disponibles</p>
              <p className="text-3xl font-bold">{stats.available}</p>
              <p className="text-green-100 text-sm">
                {stats.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0}% del total
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Ocupadas</p>
              <p className="text-3xl font-bold">{stats.occupied}</p>
              <p className="text-red-100 text-sm">{stats.occupancyRate}% ocupación</p>
            </div>
            <Users className="h-8 w-8 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Limpieza</p>
              <p className="text-3xl font-bold">{stats.cleaning}</p>
              <p className="text-yellow-100 text-sm">requieren atención</p>
            </div>
            <Sparkles className="h-8 w-8 text-yellow-200" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar habitación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filtro por estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los estados</option>
            {roomStatuses.map(status => (
              <option key={status.id} value={status.status}>
                {status.status.charAt(0).toUpperCase() + status.status.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>

          {/* Filtro por piso */}
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los pisos</option>
            {uniqueFloors.map(floor => (
              <option key={floor} value={floor}>
                Piso {floor}
              </option>
            ))}
          </select>

          {/* Limpiar filtros */}
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setFloorFilter('all')
            }}
            className="px-3 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Tabla de habitaciones */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Habitaciones ({filteredRooms.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Habitación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Piso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay habitaciones
                    </h3>
                    <p className="text-gray-500">
                      {searchTerm || statusFilter !== 'all' || floorFilter !== 'all' 
                        ? 'No se encontraron habitaciones con los filtros aplicados.'
                        : 'No hay habitaciones registradas.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRooms.map(room => {
                  const config = statusConfig[room.statusName] || statusConfig.disponible
                  const StatusIcon = config.icon

                  return (
                    <tr key={room.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg ${config.badgeColor} mr-3`}>
                            <StatusIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Habitación {room.room_number}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {room.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.badgeColor}`}>
                          {room.statusName.charAt(0).toUpperCase() + room.statusName.slice(1).replace('_', ' ')}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 text-gray-400 mr-1" />
                          Piso {room.floor}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                          {room.priceFormatted}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">
                          {room.description || 'Sin descripción'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Acciones de estado */}
                          {room.statusName === 'limpieza' && (
                            <button
                              onClick={() => updateRoomStatus(room.id, 'disponible')}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            >
                              Limpiar
                            </button>
                          )}
                          
                          {room.statusName === 'disponible' && (
                            <select
                              onChange={(e) => e.target.value && updateRoomStatus(room.id, e.target.value)}
                              value=""
                              className="text-xs border border-gray-200 rounded px-2 py-1"
                            >
                              <option value="">Cambiar estado</option>
                              <option value="limpieza">Limpieza</option>
                              <option value="mantenimiento">Mantenimiento</option>
                              <option value="fuera_servicio">Fuera de servicio</option>
                            </select>
                          )}
                          
                          {room.statusName === 'mantenimiento' && (
                            <button
                              onClick={() => updateRoomStatus(room.id, 'disponible')}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            >
                              Completar
                            </button>
                          )}

                          {/* Acciones CRUD */}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => openViewModal(room)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            {isAdmin() && (
                              <>
                                <button
                                  onClick={() => openEditModal(room)}
                                  className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                
                                <button
                                  onClick={() => openDeleteModal(room)}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      <RoomFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createRoom}
        roomStatuses={roomStatuses}
        isSubmitting={isSubmitting}
      />

      <RoomFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedRoom(null)
        }}
        onSubmit={updateRoom}
        room={selectedRoom}
        roomStatuses={roomStatuses}
        isSubmitting={isSubmitting}
      />

      <RoomDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedRoom(null)
        }}
        onConfirm={deleteRoom}
        room={selectedRoom}
        isSubmitting={isSubmitting}
      />

      <RoomViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedRoom(null)
        }}
        room={selectedRoom}
        onEdit={isAdmin() ? openEditModal : null}
        canEdit={isAdmin()}
      />

      {/* Debug info (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-sm">
          <h4 className="font-semibold mb-2">Debug Info</h4>
          <p>Total habitaciones: {rooms.length}</p>
          <p>Habitaciones activas: {stats.total}</p>
          <p>Filtros aplicados: {searchTerm || statusFilter !== 'all' || floorFilter !== 'all' ? 'Sí' : 'No'}</p>
          <p>Sucursal: {primaryBranch?.name || 'Ninguna'}</p>
        </div>
      )}
    </div>
  )
}

export default Rooms