import React from 'react';
import { X, User, Phone, Mail, IdCard, Calendar, DollarSign, Star } from 'lucide-react';
import Button from '../common/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';

const GuestProfile = ({ isOpen, onClose, guest }) => {
  if (!isOpen || !guest) return null;

  // Generar iniciales desde el nombre completo
  const getInitials = (fullName) => {
    return fullName
      ?.split(' ')
      .map(name => name[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'G';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {getInitials(guest.full_name || guest.fullName)}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {guest.full_name || guest.fullName}
              </h2>
              <p className="text-gray-600 text-sm">Perfil del Huésped</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
          
          <div className="space-y-4">
            {/* Nombre Completo */}
            <div className="flex items-start space-x-3">
              <User size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Nombre Completo</p>
                <p className="text-gray-700">{guest.full_name || guest.fullName}</p>
              </div>
            </div>

            {/* Documento */}
            <div className="flex items-start space-x-3">
              <IdCard size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Documento</p>
                <p className="text-gray-700">
                  {guest.document_type || guest.documentType || 'DNI'}: {guest.document_number || guest.documentNumber}
                </p>
              </div>
            </div>

            {/* Teléfono */}
            {guest.phone && (
              <div className="flex items-start space-x-3">
                <Phone size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Teléfono</p>
                  <p className="text-gray-700">{guest.phone}</p>
                </div>
              </div>
            )}

            {/* Email */}
            {guest.email && (
              <div className="flex items-start space-x-3">
                <Mail size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Correo Electrónico</p>
                  <p className="text-gray-700">{guest.email}</p>
                </div>
              </div>
            )}

            {/* Estado */}
            <div className="flex items-start space-x-3">
              <div className={`w-4 h-4 rounded-full mt-1 ${
                guest.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Estado</p>
                <p className={`text-sm font-medium capitalize ${
                  guest.status === 'active' ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {guest.status === 'active' ? 'Activo' : 'Inactivo'}
                </p>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          {(guest.total_visits > 0 || guest.total_spent > 0 || guest.last_visit) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Estadísticas</h4>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Total de Visitas */}
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar size={16} className="text-blue-600" />
                  </div>
                  <p className="text-lg font-bold text-blue-600">{guest.total_visits || 0}</p>
                  <p className="text-xs text-blue-700">Visitas</p>
                </div>

                {/* Total Gastado */}
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <DollarSign size={16} className="text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(guest.total_spent || 0)}
                  </p>
                  <p className="text-xs text-green-700">Gastado</p>
                </div>
              </div>

              {/* Última Visita */}
              {guest.last_visit && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-900">Última Visita</p>
                  <p className="text-sm text-gray-600">{formatDate(guest.last_visit)}</p>
                </div>
              )}
            </div>
          )}

          {/* Fecha de Registro */}
          {guest.created_at && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-900">Registrado el</p>
              <p className="text-sm text-gray-600">{formatDate(guest.created_at)}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuestProfile;