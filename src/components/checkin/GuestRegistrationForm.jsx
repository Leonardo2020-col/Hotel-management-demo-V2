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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Registro Ultra Rápido de Huésped
          </h3>
        </div>
        <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-medium">
          ⚡ Solo 2 campos
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Solo Campos Obligatorios */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-300 rounded-xl p-6">
          <div className="text-center mb-4">
            <h4 className="text-lg font-bold text-blue-800 mb-2">
              📝 Complete estos 2 campos únicamente
            </h4>
            <p className="text-sm text-blue-600">
              Es todo lo que necesitamos para el check-in inmediato
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre Completo */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                <span className="text-red-500 text-xl">*</span> Nombre Completo
              </label>
              <input
                type="text"
                value={guestData.fullName || ''}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Ej: Juan Carlos Pérez López"
                className={`w-full px-5 py-4 border-3 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-400 text-lg font-medium ${
                  errors.fullName 
                    ? 'border-red-500 bg-red-50 focus:ring-red-400' 
                    : 'border-blue-400 focus:border-blue-600 bg-white'
                }`}
                disabled={loading}
                autoFocus
              />
              {errors.fullName && (
                <p className="text-red-600 text-sm mt-2 font-semibold flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Documento de Identidad */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                <span className="text-red-500 text-xl">*</span> Documento de Identidad
              </label>
              <div className="flex space-x-3">
                <select
                  value={guestData.documentType || 'DNI'}
                  onChange={(e) => handleInputChange('documentType', e.target.value)}
                  className="px-4 py-4 border-3 border-blue-400 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-600 font-medium text-lg"
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
                  className={`flex-1 px-5 py-4 border-3 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-400 text-lg font-medium ${
                    errors.documentNumber 
                      ? 'border-red-500 bg-red-50 focus:ring-red-400' 
                      : 'border-blue-400 focus:border-blue-600 bg-white'
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.documentNumber && (
                <p className="text-red-600 text-sm mt-2 font-semibold flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.documentNumber}
                </p>
              )}
            </div>
          </div>

          {/* ✅ Campos opcionales adicionales */}
          <div className="mt-6 pt-6 border-t border-blue-200">
            <h5 className="text-md font-semibold text-blue-800 mb-4">📱 Información Opcional</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Teléfono opcional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={guestData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="987654321"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  disabled={loading}
                />
              </div>

              {/* Email opcional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={guestData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="ejemplo@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-center space-x-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            icon={X}
            disabled={loading}
            className="px-6 py-3"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="success"
            icon={Save}
            disabled={loading}
            className="px-12 py-4 text-xl font-bold"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Guardando...</span>
              </div>
            ) : (
              '✅ Continuar al Check-in'
            )}
          </Button>
        </div>
      </form>

      {/* Información destacada */}
      <div className="mt-6 p-4 bg-green-100 border-2 border-green-300 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">🚀</div>
          <div>
            <p className="text-green-900 font-bold text-lg">
              ¡Check-in Ultra Rápido!
            </p>
            <p className="text-green-800 text-sm">
              Solo necesitas completar 2 campos obligatorios para un check-in inmediato. 
              Los campos opcionales ayudan pero no son necesarios.
            </p>
          </div>
        </div>
      </div>

      {/* Indicador de progreso visual */}
      <div className="mt-4">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <div className={`w-4 h-4 rounded-full ${guestData.fullName?.trim() ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span>Nombre</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-300"></div>
          <div className="flex items-center space-x-1">
            <div className={`w-4 h-4 rounded-full ${guestData.documentNumber?.trim() && guestData.documentNumber.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span>Documento</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-300"></div>
          <div className="flex items-center space-x-1">
            <div className={`w-4 h-4 rounded-full ${guestData.fullName?.trim() && guestData.documentNumber?.trim() && guestData.documentNumber.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span>¡Listo!</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestRegistrationForm;