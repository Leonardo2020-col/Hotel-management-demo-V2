// src/components/rooms/RoomDetailsModal.jsx - Modal de detalles completos de habitación
import React from 'react';
import { 
  X, 
  User, 
  Calendar, 
  CreditCard, 
  Phone, 
  Mail, 
  Bed, 
  Users, 
  MapPin,
  Wifi,
  Tv,
  Car,
  Coffee,
  Wind,
  Bath,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Wrench,
  History
} from 'lucide-react';

const RoomDetailsModal = ({ room, isOpen, onClose, onEdit, onClean }) => {
  if (!isOpen || !room) return null;

  const getStatusConfig = (status) => {
    const configs = {
      available: {
        color: 'green',
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        icon: CheckCircle,
        label: 'Disponible'
      },
      occupied: {
        color: 'red',
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        icon: User,
        label: 'Ocupada'
      },
      cleaning: {
        color: 'blue',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: Clock,
        label: 'En Limpieza'
      },
      maintenance: {
        color: 'yellow',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        icon: Wrench,
        label: 'Mantenimiento'
      },
      reserved: {
        color: 'purple',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700',
        icon: Calendar,
        label: 'Reservada'
      }
    };
    return configs[status] || configs.available;
  };

  const getAmenityIcon = (amenity) => {
    const icons = {
      wifi: Wifi,
      tv: Tv,
      air_conditioning: Wind,
      minibar: Coffee,
      balcony: MapPin,
      jacuzzi: Bath,
      parking: Car,
      safe: Bath,
      kitchenette: Coffee,
      workspace: Tv
    };
    return icons[amenity] || CheckCircle;
  };

  const statusConfig = getStatusConfig(room.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-900">
                  Habitación {room.number}
                </h2>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                  <StatusIcon size={16} />
                  <span className="text-sm font-medium">{statusConfig.label}</span>
                </div>
              </div>
              <p className="text-gray-600">
                Piso {room.floor} • {room.capacity} personas • {room.size || 25} m²
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información Básica */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la Habitación</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bed className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tipo de Habitación</p>
                      <p className="font-medium text-gray-900">{room.type || 'Estándar'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="text-green-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Capacidad</p>
                      <p className="font-medium text-gray-900">{room.capacity} personas</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <DollarSign className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tarifa Base</p>
                      <p className="font-medium text-gray-900">S/ {room.base_rate || room.rate || 100}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <MapPin className="text-orange-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ubicación</p>
                      <p className="font-medium text-gray-900">Piso {room.floor}</p>
                    </div>
                  </div>
                </div>

                {room.description && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Descripción</p>
                    <p className="text-gray-900">{room.description}</p>
                  </div>
                )}
              </div>

              {/* Configuración de Camas */}
              {room.beds && room.beds.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Camas</h3>
                  <div className="space-y-3">
                    {room.beds.map((bed, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Bed className="text-gray-400" size={20} />
                          <span className="font-medium text-gray-900">{bed.type}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {bed.count} {bed.count === 1 ? 'cama' : 'camas'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenidades */}
              {room.features && room.features.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenidades</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {room.features.map((feature, index) => {
                      const IconComponent = getAmenityIcon(feature);
                      const featureName = feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                      
                      return (
                        <div key={index} className="flex items-center space-x-2 bg-white p-2 rounded-lg">
                          <IconComponent className="text-blue-600" size={16} />
                          <span className="text-sm text-gray-700">{featureName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Historial de Limpieza */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Limpieza</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Última limpieza:</span>
                    <span className="font-medium text-gray-900">
                      {room.last_cleaned 
                        ? new Date(room.last_cleaned).toLocaleDateString('es-ES') 
                        : 'No registrada'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Limpiado por:</span>
                    <span className="font-medium text-gray-900">
                      {room.cleaned_by || 'No especificado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estado:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      room.cleaning_status === 'clean' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {room.cleaning_status === 'clean' ? 'Limpia' : 'Necesita limpieza'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Información del Huésped Actual */}
            <div className="space-y-6">
              {/* Huésped Actual */}
              {room.currentGuest ? (
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Huésped Actual</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900">{room.currentGuest.name}</p>
                        <p className="text-sm text-blue-600">Huésped principal</p>
                      </div>
                    </div>

                    {room.currentGuest.email && (
                      <div className="flex items-center space-x-2 text-sm text-blue-700">
                        <Mail size={16} />
                        <span>{room.currentGuest.email}</span>
                      </div>
                    )}

                    {room.currentGuest.phone && (
                      <div className="flex items-center space-x-2 text-sm text-blue-700">
                        <Phone size={16} />
                        <span>{room.currentGuest.phone}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-blue-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-600">Check-in:</span>
                        <span className="font-medium text-blue-900">
                          {new Date(room.currentGuest.checkIn).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-blue-600">Check-out:</span>
                        <span className="font-medium text-blue-900">
                          {new Date(room.currentGuest.checkOut).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      {room.currentGuest.confirmationCode && (
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-blue-600">Código:</span>
                          <span className="font-medium text-blue-900">
                            {room.currentGuest.confirmationCode}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : room.nextReservation ? (
                /* Próxima Reserva */
                <div className="bg-purple-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-purple-900 mb-4">Próxima Reserva</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Calendar className="text-purple-600" size={24} />
                      </div>
                      <div>
                        <p className="font-semibold text-purple-900">{room.nextReservation.guest}</p>
                        <p className="text-sm text-purple-600">Próximo huésped</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-purple-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-600">Check-in:</span>
                        <span className="font-medium text-purple-900">
                          {new Date(room.nextReservation.checkIn).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      {room.nextReservation.checkOut && (
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-purple-600">Check-out:</span>
                          <span className="font-medium text-purple-900">
                            {new Date(room.nextReservation.checkOut).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      )}
                      {room.nextReservation.confirmationCode && (
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-purple-600">Código:</span>
                          <span className="font-medium text-purple-900">
                            {room.nextReservation.confirmationCode}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Habitación Disponible */
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Estado Actual</h3>
                  
                  <div className="text-center py-6">
                    <CheckCircle className="mx-auto text-green-600 mb-3" size={48} />
                    <p className="text-green-900 font-medium">Habitación Disponible</p>
                    <p className="text-sm text-green-600 mt-1">
                      Lista para nuevos huéspedes
                    </p>
                  </div>
                </div>
              )}

              {/* Acciones Rápidas */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => onEdit(room)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <User size={16} />
                    <span>Editar Habitación</span>
                  </button>

                  {room.status === 'cleaning' || room.cleaning_status === 'dirty' ? (
                    <button 
                      onClick={() => onClean(room.id)}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <CheckCircle size={16} />
                      <span>Marcar como Limpia</span>
                    </button>
                  ) : null}

                  {room.status === 'occupied' && room.currentGuest ? (
                    <button 
                      className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Clock size={16} />
                      <span>Procesar Check-out</span>
                    </button>
                  ) : null}

                  {room.status === 'available' ? (
                    <button 
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Calendar size={16} />
                      <span>Nueva Reserva</span>
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Información Técnica */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Técnica</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID Habitación:</span>
                    <span className="font-medium text-gray-900">{room.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Creada:</span>
                    <span className="font-medium text-gray-900">
                      {room.created_at 
                        ? new Date(room.created_at).toLocaleDateString('es-ES')
                        : 'No disponible'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Actualizada:</span>
                    <span className="font-medium text-gray-900">
                      {room.updated_at 
                        ? new Date(room.updated_at).toLocaleDateString('es-ES')
                        : 'No disponible'
                      }
                    </span>
                  </div>
                  {room.branch_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sucursal ID:</span>
                      <span className="font-medium text-gray-900">{room.branch_id}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button 
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
            <button 
              onClick={() => onEdit(room)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Editar Habitación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailsModal;