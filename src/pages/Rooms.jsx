// pages/Rooms.jsx - VERSIÓN MÍNIMA SIN ERRORES
import React, { useState, useEffect } from 'react'
import { Hotel, Users, Bed, Sparkles, Wrench, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const Rooms = () => {
  const { getPrimaryBranch } = useAuth()
  const primaryBranch = getPrimaryBranch()
  
  // Estados básicos
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ✅ Cargar habitaciones directamente
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
          room_status:status_id(
            id,
            status,
            color,
            is_available
          )
        `)
        .eq('branch_id', primaryBranch.id)
        .eq('is_active', true)
        .order('room_number')

      if (error) throw error

      // Procesar los datos
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

  // ✅ Actualizar estado de habitación
  const updateRoomStatus = async (roomId, newStatus) => {
    try {
      const loadingToast = toast.loading('Actualizando habitación...')
      
      // Obtener ID del estado
      const { data: statusData, error: statusError } = await supabase
        .from('room_status')
        .select('id')
        .eq('status', newStatus)
        .single()

      if (statusError) throw statusError

      // Actualizar habitación
      const { error } = await supabase
        .from('rooms')
        .update({ status_id: statusData.id })
        .eq('id', roomId)

      if (error) throw error

      toast.dismiss(loadingToast)
      toast.success('Habitación actualizada')
      
      // Recargar habitaciones
      await fetchRooms()
      
    } catch (error) {
      console.error('Error actualizando habitación:', error)
      toast.error('Error al actualizar habitación')
    }
  }

  // ✅ Cargar datos al montar el componente
  useEffect(() => {
    fetchRooms()
  }, [primaryBranch?.id])

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
    }
  }

  // ✅ Estadísticas básicas
  const stats = {
    total: rooms.length,
    available: rooms.filter(r => r.statusName === 'disponible').length,
    occupied: rooms.filter(r => r.statusName === 'ocupada').length,
    cleaning: rooms.filter(r => r.statusName === 'limpieza').length,
    maintenance: rooms.filter(r => r.statusName === 'mantenimiento').length
  }

  stats.occupancyRate = stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0

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

  // ✅ Renderizar error
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Hotel className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error al cargar habitaciones
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchRooms}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
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
            {primaryBranch?.name} • {stats.total} habitaciones
          </p>
        </div>

        <button
          onClick={fetchRooms}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refrescar
        </button>
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

      {/* Lista de habitaciones */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Habitaciones</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {rooms.length === 0 ? (
            <div className="text-center py-12">
              <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay habitaciones
              </h3>
              <p className="text-gray-500">
                No se encontraron habitaciones para esta sucursal.
              </p>
            </div>
          ) : (
            rooms.map(room => {
              const config = statusConfig[room.statusName] || statusConfig.disponible
              const StatusIcon = config.icon

              return (
                <div key={room.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${config.badgeColor}`}>
                        <StatusIcon className="h-6 w-6" />
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Habitación {room.room_number}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Piso {room.floor} • {room.priceFormatted} por noche
                        </p>
                        {room.description && (
                          <p className="text-sm text-gray-600 mt-1">{room.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.badgeColor}`}>
                        {room.statusName.charAt(0).toUpperCase() + room.statusName.slice(1)}
                      </span>

                      {/* Acciones rápidas */}
                      <div className="flex space-x-2">
                        {room.statusName === 'limpieza' && (
                          <button
                            onClick={() => updateRoomStatus(room.id, 'disponible')}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            Limpiar
                          </button>
                        )}
                        
                        {room.statusName === 'disponible' && (
                          <>
                            <button
                              onClick={() => updateRoomStatus(room.id, 'limpieza')}
                              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                            >
                              Limpieza
                            </button>
                            <button
                              onClick={() => updateRoomStatus(room.id, 'mantenimiento')}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                              Mantenimiento
                            </button>
                          </>
                        )}
                        
                        {room.statusName === 'mantenimiento' && (
                          <button
                            onClick={() => updateRoomStatus(room.id, 'disponible')}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            Completar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Debug info (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-sm">
          <h4 className="font-semibold mb-2">Debug Info</h4>
          <p>Total habitaciones: {rooms.length}</p>
          <p>Sucursal: {primaryBranch?.name || 'Ninguna'}</p>
          <p>Estado: {loading ? 'Cargando...' : 'Listo'}</p>
        </div>
      )}
    </div>
  )
}

export default Rooms