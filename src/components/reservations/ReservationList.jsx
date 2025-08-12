import React from 'react';
import { 
  Eye, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Calendar,
  MapPin,
  User,
  Edit,
  Clock,
  DollarSign
} from 'lucide-react';
import Button from '../common/Button';
import classNames from 'classnames';

// Usar constantes directas
const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
};

// Función auxiliar para formatear fechas
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Función auxiliar para formatear moneda
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'S/ 0.00';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(amount);
};

const ReservationList = ({ 
  reservations, 
  loading, 
  pagination,
  onPaginationChange,
  onStatusChange,
  onEdit,
  onDelete,
  readOnly = false
}) => {

  const getStatusColor = (status) => {
    switch (status) {
      case RESERVATION_STATUS.CONFIRMED:
        return 'bg-green-100 text-green-800 border-green-200';
      case RESERVATION_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case RESERVATION_STATUS.CHECKED_IN:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case RESERVATION_STATUS.CHECKED_OUT:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case RESERVATION_STATUS.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-200';
      case RESERVATION_STATUS.NO_SHOW:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case RESERVATION_STATUS.PENDING:
        return 'Pendiente';
      case RESERVATION_STATUS.CONFIRMED:
        return 'Confirmada';
      case RESERVATION_STATUS.CHECKED_IN:
        return 'Check-in';
      case RESERVATION_STATUS.CHECKED_OUT:
        return 'Check-out';
      case RESERVATION_STATUS.CANCELLED:
        return 'Cancelada';
      case RESERVATION_STATUS.NO_SHOW:
        return 'No Show';
      default:
        return status;
    }
  };

  const StatusActions = ({ reservation }) => {
    if (readOnly) return null;

    const availableActions = [];

    switch (reservation.status) {
      case RESERVATION_STATUS.PENDING:
        availableActions.push(
          { 
            label: 'Confirmar', 
            action: () => onStatusChange?.(reservation.id, RESERVATION_STATUS.CONFIRMED),
            icon: CheckCircle,
            color: 'success'
          },
          { 
            label: 'Cancelar', 
            action: () => onStatusChange?.(reservation.id, RESERVATION_STATUS.CANCELLED),
            icon: XCircle,
            color: 'danger'
          }
        );
        break;
      case RESERVATION_STATUS.CONFIRMED:
        availableActions.push(
          { 
            label: 'Check-in', 
            action: () => onStatusChange?.(reservation.id, RESERVATION_STATUS.CHECKED_IN),
            icon: CheckCircle,
            color: 'primary'
          }
        );
        break;
      case RESERVATION_STATUS.CHECKED_IN:
        availableActions.push(
          { 
            label: 'Check-out', 
            action: () => onStatusChange?.(reservation.id, RESERVATION_STATUS.CHECKED_OUT),
            icon: CheckCircle,
            color: 'success'
          }
        );
        break;
      default:
        break;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {availableActions.map((action, index) => (
          <Button
            key={index}
            size="sm"
            variant={action.color}
            onClick={action.action}
            icon={action.icon}
            className="text-xs px-3 py-1"
          >
            {action.label}
          </Button>
        ))}
      </div>
    );
  };

  const PaymentStatus = ({ reservation }) => {
    const isFullyPaid = reservation.paidAmount >= reservation.totalAmount;
    const hasPartialPayment = reservation.paidAmount > 0 && reservation.paidAmount < reservation.totalAmount;

    return (
      <div className="flex items-center space-x-2">
        <DollarSign size={14} className="text-gray-500" />
        <span className="text-sm">
          {formatCurrency(reservation.paidAmount)} / {formatCurrency(reservation.totalAmount)}
        </span>
        <span className={classNames(
          'text-xs px-2 py-1 rounded-full font-medium',
          isFullyPaid 
            ? 'bg-green-100 text-green-800' 
            : hasPartialPayment 
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        )}>
          {isFullyPaid ? 'Pagado' : hasPartialPayment ? 'Parcial' : 'Pendiente'}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-20 h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!reservations || reservations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay reservas</h3>
          <p className="text-gray-500">No se encontraron reservas con los filtros actuales.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900">
            {reservations.length} reserva{reservations.length !== 1 ? 's' : ''}
          </span>
          {readOnly && (
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Solo lectura
            </span>
          )}
        </div>
      </div>

      {/* Reservations List */}
      <div className="divide-y divide-gray-200">
        {reservations.map((reservation) => (
          <div key={reservation.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start space-x-4">
              {/* Guest Avatar */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                {reservation.guest?.name ? 
                  reservation.guest.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() :
                  'GU'
                }
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Guest Info & Status */}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {reservation.guest?.name || 'Huésped sin nombre'}
                      </h3>
                      <span className={classNames(
                        'px-3 py-1 rounded-full text-xs font-semibold border',
                        getStatusColor(reservation.status)
                      )}>
                        {getStatusLabel(reservation.status)}
                      </span>
                      <span className="text-sm text-gray-500">
                        #{reservation.confirmationCode || reservation.id}
                      </span>
                    </div>

                    {/* Contact Info */}
                    {(reservation.guest?.email || reservation.guest?.phone) && (
                      <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-600">
                        {reservation.guest.email && (
                          <span>📧 {reservation.guest.email}</span>
                        )}
                        {reservation.guest.phone && (
                          <span>📱 {reservation.guest.phone}</span>
                        )}
                      </div>
                    )}

                    {/* Reservation Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin size={16} />
                        <span>Habitación {reservation.room?.number || 'N/A'}</span>
                        {reservation.room?.type && (
                          <span className="text-gray-400">• {reservation.room.type}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar size={16} />
                        <span>
                          {formatDate(reservation.checkIn)} - {formatDate(reservation.checkOut)}
                        </span>
                        <span className="text-gray-400">• {reservation.nights} noche{reservation.nights !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User size={16} />
                        <span>
                          {reservation.adults || 1} adulto{(reservation.adults || 1) > 1 ? 's' : ''}
                          {reservation.children > 0 && `, ${reservation.children} niño${reservation.children > 1 ? 's' : ''}`}
                        </span>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="mb-4">
                      <PaymentStatus reservation={reservation} />
                    </div>

                    {/* Special Requests */}
                    {reservation.specialRequests && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Solicitudes especiales:</strong> {reservation.specialRequests}
                        </p>
                      </div>
                    )}

                    {/* Status Actions */}
                    <StatusActions reservation={reservation} />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      icon={Eye}
                      onClick={() => console.log('View reservation', reservation.id)}
                      className="whitespace-nowrap"
                    >
                      Ver
                    </Button>
                    {!readOnly && onEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={Edit}
                        onClick={() => onEdit(reservation)}
                        className="whitespace-nowrap"
                      >
                        Editar
                      </Button>
                    )}
                    {!readOnly && onDelete && reservation.status !== RESERVATION_STATUS.CHECKED_OUT && (
                      <Button
                        size="sm"
                        variant="danger"
                        icon={Trash2}
                        onClick={() => onDelete(reservation.id)}
                        className="whitespace-nowrap"
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            {(reservation.checkedInAt || reservation.checkedOutAt) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {reservation.checkedInAt && (
                    <div className="flex items-center space-x-1">
                      <Clock size={12} />
                      <span>Check-in: {formatDate(reservation.checkedInAt)}</span>
                    </div>
                  )}
                  {reservation.checkedOutAt && (
                    <div className="flex items-center space-x-1">
                      <Clock size={12} />
                      <span>Check-out: {formatDate(reservation.checkedOutAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && onPaginationChange && (
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Mostrando {Math.min(pagination.limit, reservations.length)} de {pagination.total} reservas
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPaginationChange(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page <= 1}
              >
                Anterior
              </Button>
              
              <span className="text-sm text-gray-500">
                Página {pagination.page}
              </span>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPaginationChange(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={reservations.length < pagination.limit}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationList;