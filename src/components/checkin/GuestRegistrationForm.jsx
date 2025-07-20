// src/components/checkin/GuestRegistrationForm.jsx
import React, { useState } from 'react';
import { User, CreditCard, Save, X } from 'lucide-react';
import Button from '../common/Button';

const GuestRegistrationForm = ({ 
  guestData,
  onGuestDataChange,
  onSave,
  onCancel,
  loading = false
}) => {
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!guestData.fullName?.trim()) {
      newErrors.fullName = 'El nombre completo es obligatorio';
    }

    if (!guestData.documentNumber?.trim()) {
      newErrors.documentNumber = 'El documento de identidad es obligatorio';
    } else if (guestData.documentNumber.length < 6) {
      newErrors.documentNumber = 'El documento debe tener al menos 6 caracteres';
    }

    if (!guestData.phone?.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
    }

    if (guestData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestData.email)) {
      newErrors.email = 'El email no tiene un formato válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave();
    }
  };

  const handleInputChange = (field, value) => {
    onGuestDataChange({
      ...guestData,
      [field]: value
    });
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  return (
    <div className="bg-white border-2 border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Información del Huésped
          </h3>
        </div>
        <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          Registro Rápido
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre Completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={guestData.fullName || ''}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Ej: Juan Carlos Pérez López"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.fullName 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Documento de Identidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Documento de Identidad *
            </label>
            <div className="flex space-x-2">
              <select
                value={guestData.documentType || 'DNI'}
                onChange={(e) => handleInputChange('documentType', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="DNI">DNI</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="Carnet">Carnet</option>
              </select>
              <input
                type="text"
                value={guestData.documentNumber || ''}
                onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                placeholder="Número de documento"
                className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.documentNumber 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300'
                }`}
                disabled={loading}
              />
            </div>
            {errors.documentNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.documentNumber}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              value={guestData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+51 987 654 321"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phone 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Email (Opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (Opcional)
            </label>
            <input
              type="email"
              value={guestData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="ejemplo@correo.com"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Nacionalidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nacionalidad
            </label>
            <input
              type="text"
              value={guestData.nationality || 'Peruana'}
              onChange={(e) => handleInputChange('nationality', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Género */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Género
            </label>
            <select
              value={guestData.gender || ''}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Seleccionar</option>
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
              <option value="other">Otro</option>
            </select>
          </div>

          {/* Número de huéspedes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Huéspedes
            </label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={guestData.adults || 1}
                  onChange={(e) => handleInputChange('adults', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <label className="text-xs text-gray-500">Adultos</label>
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={guestData.children || 0}
                  onChange={(e) => handleInputChange('children', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <label className="text-xs text-gray-500">Niños</label>
              </div>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones Especiales
          </label>
          <textarea
            value={guestData.specialRequests || ''}
            onChange={(e) => handleInputChange('specialRequests', e.target.value)}
            placeholder="Alguna solicitud especial, alergias, preferencias, etc."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            icon={X}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="success"
            icon={Save}
            disabled={loading}
            className="px-6"
          >
            {loading ? 'Guardando...' : 'Continuar con Snacks'}
          </Button>
        </div>
      </form>

      {/* Información */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-700 text-sm">
          💡 <strong>Registro Rápido:</strong> Los campos marcados con (*) son obligatorios. 
          Puedes completar la información adicional más tarde desde el sistema de huéspedes.
        </p>
      </div>
    </div>
  );
};

export default GuestRegistrationForm;