// components/rooms/RoomCard.jsx
import React, { useState, useCallback } from 'react'
import { 
  Bed, 
  User, 
  Clock, 
  Phone, 
  DollarSign, 
  Sparkles, 
  Wrench, 
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  Calendar,
  UserCheck,
  Settings
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

const RoomCard = ({ 
  room, 
  onStatusChange, 
  onRoomSelect,
  onQuickAction,
  className = '',
  showActions = true,
  compact = false 
}) => {
  const [actionMenuOpen, setActionMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // ✅ Configuración de estados con colores y acciones
  const statusConfig = {
    disponible: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      badgeColor: 'bg-green-100 text-green-800',
      actions: ['occupy', 'maintenance', 'outOfOrder']
    },
    ocupada: {
      icon: User,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      badgeColor: 'bg-red-100 text-red-800',
      actions: ['checkout', 'extend']
    },
    limpieza: {
      icon: Sparkles,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      badgeColor: 'bg-yellow-100 text-yellow-800',
      actions: ['clean', 'maintenance']
    },
    mantenimiento: {
      icon: Wrench,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      badgeColor: 'bg-blue-100 text-blue-800',
      actions: ['complete', 'outOfOrder']
    },
    fuera_servicio: {
      icon: AlertTriangle,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-800',
      badgeColor: 'bg-gray-100 text-gray-800',
      actions: ['repair', 'maintenance']
    }
  }

  const config = statusConfig[room.statusName] || statusConfig.disponible
  const StatusIcon = config.icon

  // ✅ Manejar acciones rápidas
  const handleQuickAction = useCallback(async (action) => {
    setLoading(true)
    setActionMenuOpen(false)

    try {
      let result
      switch (action) {
        case 'clean':
          result = await onStatusChange?.(room.id, 'disponible')
          break
        case 'maintenance':
          result = await onStatusChange?.(room.id, 'mantenimiento')
          break
        case 'outOfOrder':
          result = await onStatusChange?.(room.id, 'fuera_servicio')
          break
        case 'complete':
          result = await onStatusChange?.(room.id, 'disponible')
          break
        default:
          if (onQuickAction) {
            result = await onQuickAction(action, room)
          }
      }

      if (result?.success === false) {
        throw new Error(result.error?.message || 'Error en la acción')
      }
    } catch (error) {
      console.error('Error in quick action:', error)
      toast.error(error.message || 'Error al realizar la acción')
    } finally {
      setLoading(false)
    }
  }, [room, onStatusChange, onQuickAction])

  // ✅ Formatear tiempo de check-in
  const formatCheckInTime = useCallback((checkInTime) => {
    if (!checkInTime) return null
    
    try {
      return format(new Date(checkInTime), 'HH:mm', { locale: es })
    } catch {
      return 'Hora inválida'
    }
  }, [])

  // ✅ Formatear fecha de checkout esperado
  const formatExpectedCheckout = useCallback((checkoutDate) => {
    if (!checkoutDate) return null
    
    try {
      const date = new Date(checkoutDate)
      const today = new Date()
      const isToday = date.toDateString() === today.toDateString()
      
      return isToday 
        ? 'Hoy'
        : format(date, 'dd MMM', { locale: es })
    } catch {
      return 'Fecha inválida'
    }
  }, [])

  // ✅ Acciones disponibles según el estado
  const getAvailableActions = useCallback(() => {
    const actions = []
    
    switch (room.statusName) {
      case 'disponible':
        actions.push(
          { id: 'occupy', label: 'Ocupar', icon: UserCheck, type: 'primary' },
          { id: 'maintenance', label: 'Mantenimiento', icon: Wrench, type: 'secondary' },
          { id: 'outOfOrder', label: 'Fuera de servicio', icon: AlertTriangle, type: 'danger' }
        )
        break
      case 'ocupada':
        actions.push(
          { id: 'checkout', label: 'Check-out', icon: UserCheck, type: 'primary' },
          { id: 'extend', label: 'Extender', icon: Calendar, type: 'secondary' }
        )
        break
      case 'limpieza':
        actions.push(
          { id: 'clean', label: 'Listo', icon: CheckCircle, type: 'success' },
          { id: 'maintenance', label: 'Mantenimiento', icon: Wrench, type: 'secondary' }
        )
        break
      case 'mantenimiento':
        actions.push(
          { id: 'complete', label: 'Completar', icon: CheckCircle, type: 'success' },
          { id: 'outOfOrder', label: 'Fuera de servicio', icon: AlertTriangle, type: 'danger' }
        )
        break
      case 'fuera_servicio':
        actions.push(
          { id: 'repair', label: 'Reparar', icon: Wrench, type: 'secondary' },
          { id: 'maintenance', label: 'Mantenimiento', icon: Settings, type: 'secondary' }
        )
        break
    }
    
    return actions
  }, [room.statusName])

  // ✅ Estilo del botón de acción
  const getActionButtonStyle = (type) => {
    const styles = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      success: 'bg-green-600 hover:bg-green-700 text-white',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
      danger: 'bg-red-600 hover:bg-red-700 text-white'
    }
    return styles[type] || styles.secondary
  }

  if (compact) {
    return (
      <div 
        className={`${config.bgColor} ${config.borderColor} border rounded-lg p-3 hover:shadow-md transition-all cursor-pointer ${className}`}
        onClick={() => onRoomSelect?.(room)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <StatusIcon className={`h-4 w-4 ${config.textColor}`} />
            <span className="font-semibold text-gray-900">{room.room_number}</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.badgeColor}`}>
            {room.statusName.charAt(0).toUpperCase() + room.statusName.slice(1)}
          </span>
        </div>
        {room.currentGuest && (
          <div className="mt-1 text-sm text-gray-600 truncate">
            {room.currentGuest}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-6 hover:shadow-lg transition-all duration-200 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${config.badgeColor}`}>
            <StatusIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Hab. {room.room_number}
            </h3>
            <p className="text-sm text-gray-500">{room.floorLabel}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Badge de estado */}
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.badgeColor}`}>
            {room.statusName.charAt(0).toUpperCase() + room.statusName.slice(1).replace('_', ' ')}
          </span>
          
          {/* Menú de acciones */}
          {showActions && (
            <div className="relative">
              <button
                onClick={() => setActionMenuOpen(!actionMenuOpen)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
                disabled={loading}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              
              {actionMenuOpen && (
                <div className="absolute right-0 top-8 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    {getAvailableActions().map((action) => {
                      const ActionIcon = action.icon
                      return (
                        <button
                          key={action.id}
                          onClick={() => handleQuickAction(action.id)}
                          disabled={loading}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          <ActionIcon className="h-4 w-4 mr-3 text-gray-400" />
                          {action.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Información principal */}
      <div className="space-y-3 mb-4">
        {/* Precio */}
        <div className="flex items-center text-sm text-gray-600">
          <DollarSign className="h-4 w-4 mr-2" />
          <span className="font-medium">{room.priceFormatted}</span>
          <span className="text-gray-400 ml-1">/ noche</span>
        </div>

        {/* Descripción */}
        {room.description && (
          <div className="flex items-start text-sm text-gray-600">
            <Bed className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{room.description}</span>
          </div>
        )}

        {/* Información del huésped (si está ocupada) */}
        {room.isOccupied && room.currentGuest && (
          <div className="bg-white bg-opacity-60 rounded-lg p-3 space-y-2">
            <div className="flex items-center text-sm font-medium text-gray-900">
              <User className="h-4 w-4 mr-2" />
              <span className="truncate">{room.currentGuest}</span>
            </div>
            
            {room.currentGuestPhone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                <span>{room.currentGuestPhone}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              {room.checkInTime && (
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Check-in: {formatCheckInTime(room.checkInTime)}</span>
                </div>
              )}
              
              {room.expectedCheckout && (
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>Hasta: {formatExpectedCheckout(room.expectedCheckout)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Acciones rápidas */}
      {showActions && getAvailableActions().length > 0 && (
        <div className="flex flex-wrap gap-2">
          {getAvailableActions().slice(0, 2).map((action) => {
            const ActionIcon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                disabled={loading}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${getActionButtonStyle(action.type)}`}
              >
                <ActionIcon className="h-4 w-4 mr-2" />
                {action.label}
              </button>
            )
          })}
          
          {getAvailableActions().length > 2 && (
            <button
              onClick={() => setActionMenuOpen(true)}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              +{getAvailableActions().length - 2} más
            </button>
          )}
        </div>
      )}

      {/* Indicador de carga */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  )
}

export default RoomCard