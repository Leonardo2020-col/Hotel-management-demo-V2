import React from 'react';
import { X, User, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../common/Button';

// Schema simplificado para edición
const schema = yup.object().shape({
  fullName: yup.string().required('El nombre completo es obligatorio'),
  email: yup.string().email('Email inválido'),
  phone: yup.string(),
  documentType: yup.string().required('El tipo de documento es obligatorio'),
  documentNumber: yup.string().required('El número de documento es obligatorio'),
  status: yup.string().required('El estado es obligatorio')
});

const EditGuestModal = ({ isOpen, onClose, onSubmit, guest }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      fullName: guest?.full_name || guest?.fullName || '',
      email: guest?.email || '',
      phone: guest?.phone || '',
      documentType: guest?.document_type || guest?.documentType || 'DNI',
      documentNumber: guest?.document_number || guest?.documentNumber || '',
      status: guest?.status || 'inactive'
    }
  });

  const documentTypes = [
    { value: 'DNI', label: 'DNI' },
    { value: 'Pasaporte', label: 'Pasaporte' },
    { value: 'Carnet', label: 'Carné de Extranjería' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' }
  ];

  const onFormSubmit = async (data) => {
    try {
      // Preparar datos para actualización
      const updateData = {
        full_name: data.fullName,
        email: data.email || null,
        phone: data.phone || null,
        document_type: data.documentType,
        document_number: data.documentNumber,
        status: data.status
      };

      await onSubmit(updateData);
    } catch (error) {
      console.error('Error updating guest:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen || !guest) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Editar Huésped</h2>
            <p className="text-gray-600 mt-1">Modificar información de {guest.full_name || guest.fullName}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="p-6 space-y-6">
            {/* Nombre Completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                {...register('fullName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Carlos Eduardo Mendoza García"
              />
              {errors.fullName && (
                <p className="text-red-600 text-sm mt-1">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-gray-500">(opcional)</span>
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ejemplo@email.com"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono <span className="text-gray-500">(opcional)</span>
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+51 987 654 321"
              />
            </div>

            {/* Tipo de Documento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Documento *
              </label>
              <select
                {...register('documentType')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {documentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.documentType && (
                <p className="text-red-600 text-sm mt-1">{errors.documentType.message}</p>
              )}
            </div>

            {/* Número de Documento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Documento *
              </label>
              <input
                type="text"
                {...register('documentNumber')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="12345678"
              />
              {errors.documentNumber && (
                <p className="text-red-600 text-sm mt-1">{errors.documentNumber.message}</p>
              )}
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado *
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="text-red-600 text-sm mt-1">{errors.status.message}</p>
              )}
            </div>

            {/* Estadísticas (solo lectura) */}
            {(guest.total_visits > 0 || guest.total_spent > 0) && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Estadísticas (solo lectura)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-lg font-bold text-blue-600">{guest.total_visits || 0}</p>
                    <p className="text-xs text-blue-700">Visitas</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-lg font-bold text-green-600">
                      S/ {parseFloat(guest.total_spent || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-green-700">Gastado</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              icon={Save}
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGuestModal;