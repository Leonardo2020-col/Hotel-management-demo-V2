// src/components/reservations/ReservationTable.jsx
import React, { useState } from 'react'
import { 
  Eye, 
  Edit3, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  User, 
  MapPin, 
  CreditCard,
  Clock,
  MoreVertical,
  FileText,
  AlertCircle
} from 'lucide-react'

const ReservationTable = ({
  reservations,
  loading,
  onViewDetails,
  onEditReservation,
  onConfirmReservation,
  onCancelReservation,
  onCheckIn,
  currentUser
}) => {
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [showActionMenu, setShowActionMenu] = useState(null)

  // Obtener el color del estado
  const getStatusBadge = (reservation) => {
    const statusColors = {
      'pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'confirmada': 'bg-green-100 text-green-800 border-green-200',
      'en_uso': 'bg-blue-100 text-blue-800 border-blue-200',
      'completada': 'bg-gray-100 text-gray-800 border-gray-200',
      'cancelada': 'bg-red-100 text-red-800 border-red-200',
      'no_show': 'bg-red-100 text-red-900 border-red-300'
    }

    const status = reservation.status?.status || 'pendiente'
    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
        {getStatusText(status)}
      </span>
    )
  }

  const getStatusText = (status) => {
    const statusTexts = {
      'pendiente': 'Pendiente',
      'confirmada': 'Confirmada',
      'en_uso': 'En uso',
      'completada': 'Completada',
      'cancelada': 'Cancelada',
      'no_show': 'No show'
    }
    return statusTexts[status] || 'Sin estado'
  }

  // Obtener el indicador de pago
  const getPaymentBadge = (reservation) => {
    const balance = reservation.balance || 0
    const totalAmount = reservation.total_amount || 0
    const paidAmount = reservation.paid_amount || 0

    if (balance <= 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Pagado
        </span>
      )
    } else if (paidAmount > 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Parcial
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Pendiente
        </span>
      )
    }
  }

  // Verificar si se puede realizar una acción
  const canPerformAction = (action, reservation) => {
    const status = reservation.status?.status
    const today = new Date()
    const checkInDate = new Date(reservation.check_in_date)
    
    switch (action) {
      case 'confirm':
        return status === 'pendiente'
      case 'cancel':
        return ['pendiente', 'confirmada'].includes(status)
      case 'checkIn':
        return status === 'confirmada' && checkInDate <= today
      case 'edit':
        return ['pendiente', 'confirmada'].includes(status)
      default:
        return true
    }
  }

  // Renderizar acciones según el estado
  const renderActions = (reservation) => {
    return (
      <div className="relative">
        <button
          onClick={() => setShowActionMenu(showActionMenu === reservation.id ? null : reservation.id)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {showActionMenu === reservation.id && (
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
            <div className="py-1">
              <button
                onClick={() => {
                  onViewDetails(reservation)
                  setShowActionMenu(null)
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver detalles
              </button>

              {canPerformAction('edit', reservation) && (
                <button
                  onClick={() => {
                    onEditReservation(reservation)
                    setShowActionMenu(null)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </button>
              )}

              {canPerformAction('confirm', reservation) && (
                <button
                  onClick={() => {
                    onConfirmReservation(reservation.id)
                    setShowActionMenu(null)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar
                </button>
              )}

              {canPerformAction('checkIn', reservation) && (
                <button
                  onClick={() => {
                    onCheckIn(reservation)
                    setShowActionMenu(null)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Check-in
                </button>
              )}

              {canPerformAction('cancel', reservation) && (
                <button
                  onClick={() => {
                    onCancelReservation(reservation.id)
                    setShowActionMenu(null)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const isToday = date.toDateString() === today.toDateString()
    const isTomorrow = date.toDateString() === tomorrow.toDateString()

    if (isToday) return 'Hoy'
    if (isTomorrow) return 'Mañana'
    
    return date.toLocaleDateString('es-PE', { 
      day: '2-digit', 
      month: '2-digit' 
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando reservaciones...</p>
        </div>
      </div>
    )
  }

  if (reservations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reservaciones</h3>
          <p className="text-sm text-gray-600">
            No se encontraron reservaciones con los filtros aplicados.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header de la tabla */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900">
          Reservaciones ({reservations.length})
        </h3>
      </div>

      {/* Tabla responsive */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código / Huésped
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fechas / Habitación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pago
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reservations.map((reservation) => {
              const isToday = reservation.isToday
              const isPending = reservation.isPending
              const canCheckInToday = reservation.canCheckIn && isToday

              return (
                <tr 
                  key={reservation.id} 
                  className={`hover:bg-gray-50 transition-colors ${
                    canCheckInToday ? 'bg-blue-50' : 
                    isToday ? 'bg-yellow-50' : ''
                  }`}
                >
                  {/* Código y Huésped */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {reservation.reservation_code}
                        </span>
                        {isToday && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Hoy
                          </span>
                        )}
                      </div>
                      <div className="flex items-center mt-1">
                        <User className="h-3 w-3 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-600">
                          {reservation.guestName}
                        </span>
                      </div>
                      {reservation.guest?.phone && (
                        <div className="text-xs text-gray-500 mt-1">
                          {reservation.guest.phone}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Fechas y Habitación */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                        <span>
                          {formatDate(reservation.check_in_date)} - {formatDate(reservation.check_out_date)}
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-600">
                          Hab. {reservation.roomNumber}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({reservation.nights} noche{reservation.nights !== 1 ? 's' : ''})
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {getStatusBadge(reservation)}
                      {canCheckInToday && (
                        <span className="inline-flex items-center text-xs text-blue-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Listo para check-in
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Pago */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {getPaymentBadge(reservation)}
                      {reservation.balance > 0 && (
                        <span className="text-xs text-gray-600">
                          Saldo: {reservation.formattedBalance}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Total */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {reservation.formattedTotal}
                      </div>
                      {reservation.paid_amount > 0 && (
                        <div className="text-xs text-gray-500">
                          Pagado: S/ {reservation.paid_amount.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Acciones rápidas */}
                      {canPerformAction('confirm', reservation) && (
                        <button
                          onClick={() => onConfirmReservation(reservation.id)}
                          className="p-1 text-green-600 hover:text-green-800 transition-colors"
                          title="Confirmar reservación"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}

                      {canCheckInToday && (
                        <button
                          onClick={() => onCheckIn(reservation)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Realizar check-in"
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onViewDetails(reservation)}
                        className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Menú de acciones */}
                      {renderActions(reservation)}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer con información adicional */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Total: {reservations.length} reservaciones</span>
            <span>•</span>
            <span>
              Pendientes: {reservations.filter(r => r.isPending).length}
            </span>
            <span>•</span>
            <span>
              Check-ins hoy: {reservations.filter(r => r.isToday && r.canCheckIn).length}
            </span>
          </div>
          
          <div className="text-xs text-gray-500">
            Última actualización: {new Date().toLocaleTimeString('es-PE')}
          </div>
        </div>
      </div>

      {/* Click away listener para cerrar menús */}
      {showActionMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowActionMenu(null)}
        />
      )}
    </div>
  )
}

export default ReservationTable