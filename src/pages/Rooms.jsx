// pages/Rooms.jsx
import React, { useState, useCallback } from 'react'
import { 
  Hotel, 
  Plus, 
  Settings, 
  BarChart3, 
  Calendar,
  Users,
  Filter,
  Download,
  Bell,
  Zap
} from 'lucide-react'
import { useRooms } from '../hooks/useRooms'
import { useAuth } from '../context/AuthContext'
import RoomsGrid from '../components/rooms/RoomsGrid'
import toast from 'react-hot-toast'

const Rooms = () => {
  const { isAdmin, getPrimaryBranch } = useAuth()
  const primaryBranch = getPrimaryBranch()
  
  const {
    rooms,
    roomStats,
    loading,
    refreshing,
    error,
    filters,
    updateRoomStatus,
    cleanRoom,
    setRoomMaintenance,
    setRoomOutOfOrder,
    refresh,
    updateFilters,
    clearFilters,
    getFloors,
    hasRooms,
    isEmpty,
    isFiltered
  } = useRooms()

  // Estados locales
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [actionsPanelOpen, setActionsPanelOpen] = useState(false)

  // ✅ Manejar acciones de habitación
  const handleRoomAction = useCallback(async (action, room) => {
    try {
      let result
      
      switch (action) {
        case 'clean':
          result = await cleanRoom(room.id || room)
          break
        case 'maintenance':
          result = await setRoomMaintenance(room.id || room)
          break
        case 'outOfOrder':
          result = await setRoomOutOfOrder(room.id || room)
          break
        case 'occupy':
          // Redirigir a check-in con habitación seleccionada
          window.location.href = `/checkin?room=${room.id}`
          return
        case 'checkout':
          // Aquí iría la lógica de checkout
          toast.info('Función de checkout en desarrollo')
          return
        case 'extend':
          toast.info('Función de extensión en desarrollo')
          return
        default:
          // Asumir que es un cambio de estado directo
          result = await updateRoomStatus(room.id || room, action)
      }

      return result
    } catch (error) {
      console.error('Error in room action:', error)
      toast.error('Error al realizar la acción')
      return { success: false, error }
    }
  }, [cleanRoom, setRoomMaintenance, setRoomOutOfOrder, updateRoomStatus])

  // ✅ Seleccionar habitación
  const handleRoomSelect = useCallback((room) => {
    setSelectedRoom(room)
    // Aquí podrías abrir un modal con detalles de la habitación
    console.log('Room selected:', room)
  }, [])

  // ✅ Acciones masivas rápidas
  const handleBulkAction = useCallback(async (action) => {
    const targetRooms = rooms.filter(room => {
      switch (action) {
        case 'cleanAll':
          return room.statusName === 'limpieza'
        case 'maintenanceAll':
          return room.statusName === 'disponible'
        default:
          return false
      }
    })

    if (targetRooms.length === 0) {
      toast.info('No hay habitaciones para esta acción')
      return
    }

    const confirmed = window.confirm(
      `¿Confirmas realizar esta acción en ${targetRooms.length} habitaciones?`
    )

    if (!confirmed) return

    const loadingToast = toast.loading('Procesando habitaciones...')
    let successCount = 0
    let errorCount = 0

    for (const room of targetRooms) {
      try {
        const result = await handleRoomAction(
          action === 'cleanAll' ? 'clean' : 'maintenance', 
          room
        )
        if (result?.success !== false) {
          successCount++
        } else {
          errorCount++
        }
      } catch (error) {
        errorCount++
      }
    }

    toast.dismiss(loadingToast)
    
    if (successCount > 0) {
      toast.success(`${successCount} habitaciones actualizadas`)
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} habitaciones con error`)
    }

    await refresh()
  }, [rooms, handleRoomAction, refresh])

  // ✅ Estadísticas con mejores cálculos
  const enhancedStats = React.useMemo(() => {
    const stats = { ...roomStats }
    
    // Agregar más métricas
    stats.needsCleaning = rooms.filter(r => r.statusName === 'limpieza').length
    stats.needsMaintenance = rooms.filter(r => r.statusName === 'mantenimiento').length
    stats.revenueToday = rooms
      .filter(r => r.isOccupied)
      .reduce((sum, r) => sum + (r.base_price || 0), 0)
    
    return stats
  }, [roomStats, rooms])

  // ✅ Renderizar estado de carga
  if (loading && !hasRooms) {
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
  if (error && !hasRooms) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Hotel className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error al cargar habitaciones
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={refresh}
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
            {primaryBranch?.name} • {enhancedStats.total} habitaciones
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Acciones rápidas */}
          {enhancedStats.needsCleaning > 0 && (
            <button
              onClick={() => handleBulkAction('cleanAll')}
              className="flex items-center px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors border border-yellow-200"
            >
              <Zap className="h-4 w-4 mr-2" />
              Limpiar todas ({enhancedStats.needsCleaning})
            </button>
          )}

          {/* Notificaciones */}
          {(enhancedStats.needsCleaning > 0 || enhancedStats.needsMaintenance > 0) && (
            <button className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
            </button>
          )}

          {/* Acciones admin */}
          {isAdmin() && (
            <>
              <button className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </button>
              <button className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total</p>
              <p className="text-3xl font-bold">{enhancedStats.total}</p>
              <p className="text-blue-100 text-sm">habitaciones</p>
            </div>
            <Hotel className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Disponibles</p>
              <p className="text-3xl font-bold">{enhancedStats.available}</p>
              <p className="text-green-100 text-sm">
                {enhancedStats.total > 0 
                  ? Math.round((enhancedStats.available / enhancedStats.total) * 100)
                  : 0
                }% del total
              </p>
            </div>
            <div className="h-8 w-8 bg-green-400 rounded-full flex items-center justify-center">
              ✓
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Ocupadas</p>
              <p className="text-3xl font-bold">{enhancedStats.occupied}</p>
              <p className="text-red-100 text-sm">
                {enhancedStats.occupancyRate}% ocupación
              </p>
            </div>
            <Users className="h-8 w-8 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Ingresos hoy</p>
              <p className="text-3xl font-bold">
                S/ {enhancedStats.revenueToday?.toFixed(0) || '0'}
              </p>
              <p className="text-yellow-100 text-sm">estimados</p>
            </div>
            <BarChart3 className="h-8 w-8 text-yellow-200" />
          </div>
        </div>
      </div>

      {/* Alertas y notificaciones */}
      {(enhancedStats.needsCleaning > 0 || enhancedStats.needsMaintenance > 0) && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <Bell className="h-5 w-5 text-orange-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-orange-800">
                Atención requerida
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <ul className="space-y-1">
                  {enhancedStats.needsCleaning > 0 && (
                    <li>• {enhancedStats.needsCleaning} habitaciones necesitan limpieza</li>
                  )}
                  {enhancedStats.needsMaintenance > 0 && (
                    <li>• {enhancedStats.needsMaintenance} habitaciones en mantenimiento</li>
                  )}
                </ul>
              </div>
              <div className="mt-3 flex space-x-3">
                {enhancedStats.needsCleaning > 0 && (
                  <button
                    onClick={() => handleBulkAction('cleanAll')}
                    className="text-sm bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 transition-colors"
                  >
                    Limpiar todas
                  </button>
                )}
                <button
                  onClick={() => setActionsPanelOpen(true)}
                  className="text-sm text-orange-600 hover:text-orange-800 transition-colors"
                >
                  Ver detalles
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros activos */}
      {isFiltered && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Filter className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm text-blue-800 font-medium">
              Filtros activos:
            </span>
            <div className="ml-3 flex items-center space-x-2">
              {filters.status !== 'all' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Estado: {filters.status}
                </span>
              )}
              {filters.floor !== 'all' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Piso: {filters.floor}
                </span>
              )}
              {filters.search && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Búsqueda: "{filters.search}"
                </span>
              )}
              {filters.priceRange !== 'all' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Precio: {filters.priceRange}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Grid principal de habitaciones */}
      <RoomsGrid
        rooms={rooms}
        loading={loading}
        refreshing={refreshing}
        filters={filters}
        onFilterChange={updateFilters}
        onRefresh={refresh}
        onRoomAction={handleRoomAction}
        onRoomSelect={handleRoomSelect}
      />

      {/* Panel de acciones masivas */}
      {actionsPanelOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Acciones Masivas
              </h3>
              <button
                onClick={() => setActionsPanelOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {enhancedStats.needsCleaning > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Habitaciones en limpieza</p>
                    <p className="text-sm text-gray-600">{enhancedStats.needsCleaning} habitaciones</p>
                  </div>
                  <button
                    onClick={() => {
                      handleBulkAction('cleanAll')
                      setActionsPanelOpen(false)
                    }}
                    className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                  >
                    Limpiar todas
                  </button>
                </div>
              )}

              {enhancedStats.available > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Habitaciones disponibles</p>
                    <p className="text-sm text-gray-600">{enhancedStats.available} habitaciones</p>
                  </div>
                  <button
                    onClick={() => {
                      handleBulkAction('maintenanceAll')
                      setActionsPanelOpen(false)
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Mantenimiento
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => setActionsPanelOpen(false)}
                  className="w-full px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de habitación seleccionada */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Habitación {selectedRoom.room_number}
              </h3>
              <button
                onClick={() => setSelectedRoom(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado</label>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {selectedRoom.statusName.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Precio</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedRoom.priceFormatted}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Piso</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedRoom.floor}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Disponible</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedRoom.isAvailable ? 'Sí' : 'No'}
                  </p>
                </div>
              </div>

              {selectedRoom.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Descripción</label>
                  <p className="text-gray-900">{selectedRoom.description}</p>
                </div>
              )}

              {selectedRoom.isOccupied && selectedRoom.currentGuest && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Huésped actual</h4>
                  <p className="text-red-800">{selectedRoom.currentGuest}</p>
                  {selectedRoom.currentGuestPhone && (
                    <p className="text-red-700 text-sm">{selectedRoom.currentGuestPhone}</p>
                  )}
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    window.location.href = `/checkin?room=${selectedRoom.id}`
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Usar en Check-in
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información de debug (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-sm">
          <h4 className="font-semibold mb-2">Debug Info</h4>
          <p>Total habitaciones: {rooms.length}</p>
          <p>Filtros activos: {isFiltered ? 'Sí' : 'No'}</p>
          <p>Cargando: {loading ? 'Sí' : 'No'}</p>
          <p>Refrescando: {refreshing ? 'Sí' : 'No'}</p>
          <p>Sucursal: {primaryBranch?.name || 'Ninguna'}</p>
        </div>
      )}
    </div>
  )
}

export default Rooms