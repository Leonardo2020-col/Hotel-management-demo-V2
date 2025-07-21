// src/components/rooms/RoomGrid.jsx - SIMPLIFICADO CON CLICK PARA LIMPIAR
import React, { useState } from 'react';
import { 
  Edit, 
  Trash2, 
  MapPin, 
  CheckCircle,
  AlertTriangle,
  Users,
  Eye,
  LogOut,
  LogIn,
  Calendar,
  Phone,
  Mail,
  CreditCard,
  X,
  Sparkles
} from 'lucide-react';
import Button from '../common/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import classNames from 'classnames';
import toast from 'react-hot-toast'; 

// ESTADOS SIMPLIFICADOS
const ROOM_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied', 
  NEEDS_CLEANING: 'needs_cleaning'
};

const RoomGrid = ({ 
  rooms = [], 
  loading = false, 
  selectedRooms = [], 
  onSelectRoom,
  onStatusChange,
  onEdit,
  onDelete,
  onViewReservation,
  onProcessCheckIn,
  onProcessCheckOut,
  // NUEVA FUNCIÓN: Click para limpiar
  onRoomCleanClick
}) => {
  const [showingReservationDetails, setShowingReservationDetails] = useState(null);

  // Obtener color según estado simplificado
  const getStatusColor = (status) => {
    switch (status) {
      case ROOM_STATUS.AVAILABLE:
        return 'bg-green-100 text-green-800 border-green-200';
      case ROOM_STATUS.OCCUPIED:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case ROOM_STATUS.NEEDS_CLEANING:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obtener icono según estado simplificado
  const getStatusIcon = (status) => {
    switch (status) {
      case ROOM_STATUS.AVAILABLE:
        return CheckCircle;
      case ROOM_STATUS.OCCUPIED:
        return Users;
      case ROOM_STATUS.NEEDS_CLEANING:
        return AlertTriangle;
      default:
        return AlertTriangle;
    }
  };

  // Obtener texto del estado
  const getStatusText = (status) => {
    switch (status) {
      case ROOM_STATUS.AVAILABLE:
        return 'Disponible';
      case ROOM_STATUS.OCCUPIED:
        return 'Ocupada';
      case ROOM_STATUS.NEEDS_CLEANING:
        return 'Necesita Limpieza';
      default:
        return 'Desconocido';
    }
  };

  const handleSelectRoom = (roomId) => {
    if (onSelectRoom) {
      onSelectRoom(prev => 
        prev.includes(roomId)
          ? prev.filter(id => id !== roomId)
          : [...prev, roomId]
      );
    }
  };

  // NUEVA FUNCIÓN: Manejar click de limpieza
  const handleCleaningClick = async (room, event) => {
    event.stopPropagation(); // Evitar propagación del click
    
    if (room.status !== ROOM_STATUS.NEEDS_CLEANING) {
      toast.warning('Esta habitación no necesita limpieza');
      return;
    }

    if (onRoomCleanClick) {
      await onRoomCleanClick(room.id);
    }
  };

  const handleViewReservationInfo = (room) => {
    if (room.status === ROOM_STATUS.OCCUPIED && room.currentGuest) {
      setShowingReservationDetails(room);
    } else {
      toast.warning('Esta habitación no tiene una reserva activa');
    }
  };

  // Componente de acciones según estado
  const StatusActions = ({ room }) => {
    const availableActions = [];

    switch (room.status) {
      case ROOM_STATUS.AVAILABLE:
        // Si hay una reserva confirmada para hoy
        if (room.nextReservation && 
            new Date(room.nextReservation.checkIn).toDateString() === new Date().toDateString()) {
          availableActions.push({
            label: 'Check-in',
            action: () => onProcessCheckIn && onProcessCheckIn(room.id, room.nextReservation.id),
            color: 'primary',
            icon: LogIn
          });
        }
        break;
        
      case ROOM_STATUS.OCCUPIED:
        availableActions.push(
          {
            label: 'Ver Reserva',
            action: () => handleViewReservationInfo(room),
            color: 'info',
            icon: Eye
          },
          { 
            label: 'Check-out', 
            action: () => onProcessCheckOut && onProcessCheckOut(room.id),
            color: 'success',
            icon: LogOut
          }
        );
        break;
        
      case ROOM_STATUS.NEEDS_CLEANING:
        // ACCIÓN PRINCIPAL: Botón de limpieza destacado
        availableActions.push({
          label: 'Limpiar Ahora',
          action: (e) => handleCleaningClick(room, e),
          color: 'warning',
          icon: Sparkles,
          isMainAction: true
        });
        break;
    }

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {availableActions.map((action, index) => {
          const ActionIcon = action.icon || CheckCircle;
          return (
            <Button
              key={index}
              size="sm"
              variant={action.color}
              onClick={action.action}
              icon={ActionIcon}
              className={classNames(
                "text-xs px-3 py-1",
                action.isMainAction && "ring-2 ring-orange-300 font-semibold shadow-lg transform hover:scale-105"
              )}
            >
              {action.label}
            </Button>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="mt-4 flex space-x-2">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay habitaciones disponibles
        </h3>
        <p className="text-gray-600">
          Ajusta los filtros o agrega nuevas habitaciones
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rooms.map((room) => {
          const StatusIcon = getStatusIcon(room.status);
          const isSelected = selectedRooms.includes(room.id);

          return (
            <div
              key={room.id}
              className={classNames(
                'bg-white rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl cursor-pointer',
                isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-100',
                // DESTACAR habitaciones que necesitan limpieza
                room.status === ROOM_STATUS.NEEDS_CLEANING && 'ring-2 ring-orange-300 shadow-orange-100'
              )}
              // CLICK PRINCIPAL: Si necesita limpieza, limpiar directamente
              onClick={(e) => {
                if (room.status === ROOM_STATUS.NEEDS_CLEANING) {
                  handleCleaningClick(room, e);
                }
              }}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectRoom(room.id);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <h3 className="text-xl font-bold text-gray-900">
                      {room.number}
                    </h3>
                  </div>
                  <span className={classNames(
                    'px-3 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1',
                    getStatusColor(room.status)
                  )}>
                    <StatusIcon size={14} />
                    <span>{getStatusText(room.status)}</span>
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <MapPin size={14} />
                    <span>Piso {room.floor}</span>
                  </div>
                  
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                {/* Rate */}
                <div className="text-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(room.base_rate || 0)}/noche
                  </span>
                </div>

                {/* INDICADOR ESPECIAL: Necesita limpieza */}
                {room.status === ROOM_STATUS.NEEDS_CLEANING && (
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 text-center">
                    <Sparkles className="mx-auto h-8 w-8 text-orange-600 mb-2" />
                    <p className="text-sm font-bold text-orange-900 mb-2">
                      🧹 Habitación necesita limpieza
                    </p>
                    <p className="text-xs text-orange-700 mb-3">
                      Haz click en la habitación para marcarla como limpia
                    </p>
                    <Button
                      size="sm"
                      variant="warning"
                      onClick={(e) => handleCleaningClick(room, e)}
                      icon={Sparkles}
                      className="w-full font-semibold"
                    >
                      ✨ Limpiar Ahora
                    </Button>
                  </div>
                )}

                {/* Current Guest - solo para ocupadas */}
                {room.status === ROOM_STATUS.OCCUPIED && room.currentGuest && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-blue-900">
                        Huésped Actual
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        icon={Eye}
                        onClick={() => handleViewReservationInfo(room)}
                        className="text-xs px-2 py-1"
                      >
                        Ver Detalles
                      </Button>
                    </div>
                    <p className="font-medium text-blue-900 mb-1">
                      {room.currentGuest.name}
                    </p>
                    <div className="space-y-1 text-xs text-blue-700">
                      <div className="flex items-center space-x-1">
                        <Calendar size={12} />
                        <span>Check-out: {formatDate(room.currentGuest.checkOut)}</span>
                      </div>
                      {room.currentGuest.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone size={12} />
                          <span>{room.currentGuest.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <CreditCard size={12} />
                        <span>#{room.currentGuest.confirmationCode}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Reservation - solo para disponibles */}
                {room.status === ROOM_STATUS.AVAILABLE && room.nextReservation && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-yellow-900 mb-2">
                      Próxima Reserva
                    </p>
                    <p className="font-medium text-yellow-900 mb-1">
                      {room.nextReservation.guest}
                    </p>
                    <div className="space-y-1 text-xs text-yellow-700">
                      <div className="flex items-center space-x-1">
                        <Calendar size={12} />
                        <span>Check-in: {formatDate(room.nextReservation.checkIn)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CreditCard size={12} />
                        <span>#{room.nextReservation.confirmationCode}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Available State - solo para disponibles sin reservas */}
                {room.status === ROOM_STATUS.AVAILABLE && !room.nextReservation && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <CheckCircle className="mx-auto h-6 w-6 text-green-600 mb-2" />
                    <p className="text-sm font-medium text-green-900">
                      Habitación Disponible
                    </p>
                    <p className="text-xs text-green-700">
                      Lista para nueva reserva
                    </p>
                  </div>
                )}

                {/* Status Actions */}
                <StatusActions room={room} />
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <div className="flex justify-between space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Edit}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit && onEdit(room.id);
                    }}
                    className="flex-1"
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    icon={Trash2}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete && onDelete(room.id);
                    }}
                    className="flex-1"
                    disabled={room.status === ROOM_STATUS.OCCUPIED}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Detalles de Reserva */}
      {showingReservationDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Habitación {showingReservationDetails.number}
                </h2>
                <p className="text-gray-600 mt-1">
                  Información de la reserva actual
                </p>
              </div>
              <button
                onClick={() => setShowingReservationDetails(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Room Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Información de la Habitación
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Número</p>
                    <p className="font-semibold">{showingReservationDetails.number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Piso</p>
                    <p className="font-semibold">{showingReservationDetails.floor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tarifa</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(showingReservationDetails.base_rate || 0)}/noche
                    </p>
                  </div>
                </div>
              </div>

              {/* Guest Info */}
              {showingReservationDetails.currentGuest && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    Información del Huésped
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-blue-600">Nombre completo</p>
                      <p className="font-semibold text-blue-900">
                        {showingReservationDetails.currentGuest.name}
                      </p>
                    </div>
                    {showingReservationDetails.currentGuest.email && (
                      <div>
                        <p className="text-sm text-blue-600">Email</p>
                        <p className="font-semibold text-blue-900">
                          {showingReservationDetails.currentGuest.email}
                        </p>
                      </div>
                    )}
                    {showingReservationDetails.currentGuest.phone && (
                      <div>
                        <p className="text-sm text-blue-600">Teléfono</p>
                        <p className="font-semibold text-blue-900">
                          {showingReservationDetails.currentGuest.phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reservation Info */}
              {showingReservationDetails.activeReservation && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">
                    Detalles de la Reserva
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-green-600">Código de confirmación</p>
                      <p className="font-semibold text-green-900">
                        {showingReservationDetails.currentGuest.confirmationCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-green-600">Check-in</p>
                      <p className="font-semibold text-green-900">
                        {formatDate(showingReservationDetails.currentGuest.checkIn)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-green-600">Check-out</p>
                      <p className="font-semibold text-green-900">
                        {formatDate(showingReservationDetails.currentGuest.checkOut)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-green-600">Total</p>
                      <p className="font-semibold text-green-900">
                        {formatCurrency(showingReservationDetails.activeReservation.total_amount || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setShowingReservationDetails(null)}
              >
                Cerrar
              </Button>
              
              <div className="flex space-x-3">
                {onViewReservation && (
                  <Button
                    variant="outline"
                    icon={Eye}
                    onClick={() => {
                      onViewReservation(showingReservationDetails.activeReservation.id);
                      setShowingReservationDetails(null);
                    }}
                  >
                    Ver en Reservas
                  </Button>
                )}
                
                {onProcessCheckOut && (
                  <Button
                    variant="primary"
                    icon={LogOut}
                    onClick={() => {
                      onProcessCheckOut(showingReservationDetails.id);
                      setShowingReservationDetails(null);
                    }}
                  >
                    Realizar Check-out
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoomGrid;