// src/components/checkin/GuestRegistrationForm.jsx - VERSIÓN SIMPLIFICADA
import React, { useState } from 'react';
import { User, Save, X } from 'lucide-react';
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

    // Solo validar campos obligatorios: nombre completo y documento
    if (!guestData.fullName?.trim()) {
      newErrors.fullName = 'El nombre completo es obligatorio';
    }

    if (!guestData.documentNumber?.trim()) {
      newErrors.documentNumber = 'El documento de identidad es obligatorio';
    } else if (guestData.documentNumber.length < 6) {
      newErrors.documentNumber = 'El documento debe tener al menos 6 caracteres';
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
            Registro Rápido de Huésped
          </h3>
        </div>
        <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          Solo 2 campos requeridos
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Campos Obligatorios - Más prominentes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-3">
            📝 Información Obligatoria
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre Completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> Nombre Completo
              </label>
              <input
                type="text"
                value={guestData.fullName || ''}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Ej: Juan Carlos Pérez López"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg ${
                  errors.fullName 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-blue-300 focus:border-blue-500'
                }`}
                disabled={loading}
                autoFocus
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1 font-medium">{errors.fullName}</p>
              )}
            </div>

            {/* Documento de Identidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> Documento de Identidad
              </label>
              <div className="flex space-x-2">
                <select
                  value={guestData.documentType || 'DNI'}
                  onChange={(e) => handleInputChange('documentType', e.target.value)}
                  className="px-3 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  placeholder="12345678"
                  className={`flex-1 px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg ${
                    errors.documentNumber 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-blue-300 focus:border-blue-500'
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.documentNumber && (
                <p className="text-red-500 text-sm mt-1 font-medium">{errors.documentNumber}</p>
              )}
            </div>
          </div>
        </div>

        {/* Campos Opcionales - Colapsables */}
        <details className="bg-gray-50 border border-gray-200 rounded-lg">
          <summary className="cursor-pointer p-4 font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
            ➕ Información Adicional (Opcional)
          </summary>
          
          <div className="p-4 pt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Teléfono (Opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={guestData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+51 987 654 321"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              {/* Email (Opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={guestData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Número de huéspedes */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Número de Huéspedes
              </label>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Adultos</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={guestData.adults || 1}
                    onChange={(e) => handleInputChange('adults', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Niños</label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={guestData.children || 0}
                    onChange={(e) => handleInputChange('children', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Observaciones Especiales
              </label>
              <textarea
                value={guestData.specialRequests || ''}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                placeholder="Alguna solicitud especial, alergias, preferencias, etc."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>
        </details>

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
            className="px-8 py-3 text-lg"
          >
            {loading ? 'Guardando...' : 'Continuar ✅'}
          </Button>
        </div>
      </form>

      {/* Información mejorada */}
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-800 text-sm">
          <strong>⚡ Registro Ultra Rápido:</strong> Solo completa los 2 campos obligatorios para un check-in inmediato. 
          La información adicional es completamente opcional y se puede agregar después.
        </p>
      </div>
    </div>
  );
};

export default GuestRegistrationForm;