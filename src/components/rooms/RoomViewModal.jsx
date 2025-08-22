// components/rooms/RoomViewModal.jsx
import React from 'react'
import { 
  X, 
  Hash, 
  Building, 
  DollarSign, 
  FileText, 
  Calendar, 
  Clock,
  User,
  Phone,
  CheckCircle,
  Users,
  Sparkles,
  Wrench,
  AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const RoomViewModal = ({ 
  isOpen, 
  onClose, 
  room = null,
  onEdit = null,
  canEdit = false 
}) => {
  if (!isOpen || !room) return null

  // ✅ Configuración de iconos por estado
  const statusIcons = {
    disponible: CheckCircle,
    ocupada: Users,
    limpieza: Sparkles,
    mantenimiento: Wrench,
    fuera_servicio: AlertTriangle
  }

  const StatusIcon = statusIcons[room.statusName] || CheckCircle

  // ✅ Configuración de colores por estado
  const statusColors = {
    disponible: 'text-green-600 bg-green-100',
    ocupada: 'text-red-600 bg-red-100',
    limpieza: 'text-yellow-600 bg-yellow-100',
    mantenimiento: 'text-blue-600 bg-blue-100',
    fuera_servicio: 'text-gray-600 bg-gray-100'
  }

  const statusColor = statusColors[room.statusName] || statusColors.disponible

  // ✅ Formatear fechas
  const formatDate = (date) => {
    if (!date) return 'No disponible'
    try {
      return format(new Date(date), 'dd MMM yyyy, HH:mm', { locale: es })
    } catch {
      return 'Fecha inválida'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${statusColor} mr-4`}>
              <StatusIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Habitación {room.room_number}
              </h3>
              <p className="text-sm text-gray-500">
                Detalles completos de la habitación
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {canEdit && onEdit && (
              <button
                onClick={() => onEdit(room)}
                className="px-3 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Editar
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Estado actual */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Estado Actual</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <StatusIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Estado:</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                  {room.statusName.charAt(0).toUpperCase() + room.statusName.slice(1).replace('_', ' ')}
                </span>
              </div>
              
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Disponible para reservas:</span>
                </div>
                <span className={`text-sm font-medium ${room.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {room.isAvailable ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Información básica */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Información Básica</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Número de habitación */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Hash className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Número</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{room.room_number}</p>
              </div>

              {/* Piso */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Building className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Piso</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">Piso {room.floor}</p>
              </div>

              {/* Precio */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Precio por noche</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{room.priceFormatted}</p>
              </div>

              {/* Estado activo */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Estado en sistema</span>
                </div>
                <p className={`text-lg font-semibold ${room.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {room.is_active ? 'Activa' : 'Inactiva'}
                </p>
              </div>
            </div>
          </div>

          {/* Descripción */}
          {room.description && (
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Descripción</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start">
                  <FileText className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 leading-relaxed">{room.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Información de ocupación (si está ocupada) */}
          {room.isOccupied && (room.currentGuest || room.checkInTime) && (
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Información de Ocupación</h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                {room.currentGuest && (
                  <div className="flex items-center mb-2">
                    <User className="h-5 w-5 text-red-400 mr-2" />
                    <span className="text-sm font-medium text-red-700 mr-2">Huésped:</span>
                    <span className="text-sm text-red-800">{room.currentGuest}</span>
                  </div>
                )}
                
                {room.currentGuestPhone && (
                  <div className="flex items-center mb-2">
                    <Phone className="h-5 w-5 text-red-400 mr-2" />
                    <span className="text-sm font-medium text-red-700 mr-2">Teléfono:</span>
                    <span className="text-sm text-red-800">{room.currentGuestPhone}</span>
                  </div>
                )}
                
                {room.checkInTime && (
                  <div className="flex items-center mb-2">
                    <Clock className="h-5 w-5 text-red-400 mr-2" />
                    <span className="text-sm font-medium text-red-700 mr-2">Check-in:</span>
                    <span className="text-sm text-red-800">{formatDate(room.checkInTime)}</span>
                  </div>
                )}
                
                {room.expectedCheckout && (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-red-400 mr-2" />
                    <span className="text-sm font-medium text-red-700 mr-2">Check-out esperado:</span>
                    <span className="text-sm text-red-800">{formatDate(room.expectedCheckout)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información del sistema */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Información del Sistema</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Creada</span>
                </div>
                <p className="text-sm text-gray-900">{formatDate(room.created_at)}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Última actualización</span>
                </div>
                <p className="text-sm text-gray-900">{formatDate(room.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* ID técnico */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Hash className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-xs font-medium text-gray-500">ID del sistema:</span>
              </div>
              <code className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">
                {room.id}
              </code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoomViewModal