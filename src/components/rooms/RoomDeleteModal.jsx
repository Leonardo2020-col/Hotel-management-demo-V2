// components/rooms/RoomDeleteModal.jsx - ELIMINACIÓN PERMANENTE
import React from 'react'
import { AlertTriangle, X, Trash2 } from 'lucide-react'

const RoomDeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  room = null,
  isSubmitting = false 
}) => {
  if (!isOpen || !room) return null

  const handleConfirm = () => {
    onConfirm(room.id)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full mr-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Eliminar Habitación Permanentemente
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            ¿Estás seguro de que deseas eliminar <strong>permanentemente</strong> la habitación{' '}
            <span className="font-semibold text-gray-900">
              {room.room_number}
            </span>
            ?
          </p>
          
          {/* Información de la habitación */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Número:</span>
              <span className="text-sm font-medium">{room.room_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Piso:</span>
              <span className="text-sm font-medium">Piso {room.floor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Precio:</span>
              <span className="text-sm font-medium">{room.priceFormatted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Estado:</span>
              <span className="text-sm font-medium capitalize">
                {room.statusName.replace('_', ' ')}
              </span>
            </div>
            {room.description && (
              <div>
                <span className="text-sm text-gray-500">Descripción:</span>
                <p className="text-sm text-gray-700 mt-1">{room.description}</p>
              </div>
            )}
          </div>

          {/* Advertencia de eliminación permanente */}
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium mb-2">⚠️ ELIMINACIÓN PERMANENTE</p>
                <ul className="space-y-1 text-xs">
                  <li>• La habitación será eliminada completamente de la base de datos</li>
                  <li>• Esta acción NO se puede deshacer</li>
                  <li>• Se perderán todos los datos asociados</li>
                  <li>• Si tiene reservaciones o historial, la eliminación será bloqueada</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Consejos */}
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex">
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">💡 Alternativa recomendada:</p>
                <p className="text-xs">
                  Si solo necesitas ocultar temporalmente la habitación, considera cambiar su estado 
                  a "Fuera de servicio" en lugar de eliminarla.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Permanentemente
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoomDeleteModal