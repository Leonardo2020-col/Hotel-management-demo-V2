import React, { useState } from 'react';
import { 
  Trash2, 
  Eye, 
  Phone,
  Mail,
  User,
  IdCard,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import Button from '../common/Button';
import classNames from 'classnames';
import { formatCurrency, formatDate } from '../../utils/formatters';

const GuestsGrid = ({ 
  guests, 
  loading, 
  selectedGuests, 
  onSelectGuest,
  onEdit,
  onDelete,
  onViewProfile
}) => {
  const [deletingGuests, setDeletingGuests] = useState(new Set());

  const handleSelectGuest = (guestId) => {
    onSelectGuest(prev => 
      prev.includes(guestId)
        ? prev.filter(id => id !== guestId)
        : [...prev, guestId]
    );
  };

  const handleDeleteGuest = async (guest) => {
    const guestName = guest.fullName || guest.full_name || 'este huésped';
    
    // Confirmación detallada
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar a ${guestName}?\n\n` +
      '⚠️ Esta acción no se puede deshacer.\n' +
      '• Se verificará que no tenga reservas activas\n' +
      '• Si tiene reservas, deberás cancelarlas primero'
    );
    
    if (!confirmed) return;
    
    try {
      // Marcar como "eliminando" para mostrar loading
      setDeletingGuests(prev => new Set([...prev, guest.id]));
      
      await onDelete(guest.id);
      
    } catch (error) {
      console.error('Error deleting guest:', error);
      // El error ya se maneja en el componente padre
    } finally {
      // Quitar del estado de "eliminando"
      setDeletingGuests(prev => {
        const newSet = new Set(prev);
        newSet.delete(guest.id);
        return newSet;
      });
    }
  };

  // Generar iniciales desde el nombre completo
  const getInitials = (fullName) => {
    return fullName
      ?.split(' ')
      .map(name => name[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'G';
  };

  // Determinar el color del avatar basado en el estado
  const getAvatarColor = (guest) => {
    if (guest.status === 'active') {
      return 'from-blue-500 to-purple-600';
    } else if (guest.is_deleted) {
      return 'from-gray-400 to-gray-600';
    } else {
      return 'from-orange-500 to-red-600';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="mt-4 flex space-x-2">
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!guests || guests.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No se encontraron huéspedes
        </h3>
        <p className="text-gray-600">
          Intenta ajustar los filtros de búsqueda o registra un nuevo huésped
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {guests.map((guest) => {
        const isSelected = selectedGuests?.includes(guest.id);
        const isDeleting = deletingGuests.has(guest.id);
        const guestName = guest.full_name || guest.fullName || 'Sin nombre';
        const documentNumber = guest.document_number || guest.documentNumber || 'Sin documento';
        const avatarColor = getAvatarColor(guest);

        return (
          <div
            key={guest.id}
            className={classNames(
              'bg-white rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl relative overflow-hidden',
              isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-100',
              isDeleting && 'opacity-50 pointer-events-none'
            )}
          >
            {/* Loading overlay para eliminación */}
            {isDeleting && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                  <span className="text-sm text-red-600 font-medium">Eliminando...</span>
                </div>
              </div>
            )}

            {/* Checkbox de selección */}
            <div className="absolute top-3 left-3 z-20">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleSelectGuest(guest.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isDeleting}
              />
            </div>

            {/* Indicador de estado */}
            <div className="absolute top-3 right-3 z-20">
              {guest.is_deleted ? (
                <div className="w-3 h-3 bg-red-500 rounded-full" title="Eliminado" />
              ) : guest.status === 'active' ? (
                <div className="w-3 h-3 bg-green-500 rounded-full" title="Activo" />
              ) : (
                <div className="w-3 h-3 bg-gray-400 rounded-full" title="Inactivo" />
              )}
            </div>

            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3 mb-4 mt-2">
                <div className={`w-12 h-12 bg-gradient-to-br ${avatarColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white font-bold text-sm">
                    {getInitials(guestName)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 leading-tight break-words">
                    {guestName}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    {guest.document_type || guest.documentType || 'DNI'}: {documentNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-3">
              {/* Contact Information */}
              <div className="space-y-3">
                {/* Teléfono */}
                {guest.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone size={14} className="flex-shrink-0" />
                    <span className="truncate">{guest.phone}</span>
                  </div>
                )}
                
                {/* Email */}
                {guest.email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail size={14} className="flex-shrink-0" />
                    <span className="truncate">{guest.email}</span>
                  </div>
                )}

                {/* Estado con icono */}
                <div className="flex items-center space-x-2 text-sm">
                  {guest.is_deleted ? (
                    <>
                      <AlertTriangle size={14} className="text-red-500" />
                      <span className="text-red-600 font-medium">Eliminado</span>
                    </>
                  ) : guest.status === 'active' ? (
                    <>
                      <CheckCircle size={14} className="text-green-500" />
                      <span className="text-green-600 font-medium">Activo</span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      <span className="text-gray-600 font-medium">Inactivo</span>
                    </>
                  )}
                </div>
              </div>

              {/* Statistics */}
              {(guest.total_visits > 0 || guest.total_spent > 0 || guest.totalVisits > 0 || guest.totalSpent > 0) && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-blue-50 rounded-lg p-2">
                      <div className="flex items-center justify-center mb-1">
                        <Calendar size={12} className="text-blue-600" />
                      </div>
                      <p className="text-sm font-bold text-blue-600">
                        {guest.total_visits || guest.totalVisits || 0}
                      </p>
                      <p className="text-xs text-blue-700">Visitas</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2">
                      <div className="flex items-center justify-center mb-1">
                        <DollarSign size={12} className="text-green-600" />
                      </div>
                      <p className="text-xs font-bold text-green-600">
                        {formatCurrency(guest.total_spent || guest.totalSpent || 0)}
                      </p>
                      <p className="text-xs text-green-700">Gastado</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Última visita */}
              {(guest.last_visit || guest.lastVisit) && (
                <div className="text-xs text-gray-500">
                  Última visita: {formatDate(guest.last_visit || guest.lastVisit)}
                </div>
              )}

              {/* Fecha de registro */}
              {(guest.created_at || guest.createdAt) && (
                <div className="text-xs text-gray-500">
                  Registrado: {formatDate(guest.created_at || guest.createdAt)}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="space-y-2">
                {/* Ver Perfil */}
                <Button
                  size="sm"
                  variant="primary"
                  icon={Eye}
                  onClick={() => onViewProfile(guest)}
                  className="w-full text-xs"
                  disabled={isDeleting}
                >
                  Ver Perfil
                </Button>
                
                {/* Eliminar */}
                <Button
                  size="sm"
                  variant="danger"
                  icon={Trash2}
                  onClick={() => handleDeleteGuest(guest)}
                  className="w-full text-xs"
                  disabled={isDeleting}
                  loading={isDeleting}
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GuestsGrid;