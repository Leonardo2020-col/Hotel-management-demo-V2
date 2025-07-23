import React, { useState } from 'react';
import { X, User, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../common/Button';
import { db } from '../../lib/supabase';
import toast from 'react-hot-toast';

// Schema simplificado para la nueva estructura
const schema = yup.object().shape({
  fullName: yup.string().required('El nombre completo es obligatorio'),
  email: yup.string().email('Email inválido'),
  phone: yup.string(),
  documentType: yup.string().required('El tipo de documento es obligatorio'),
  documentNumber: yup.string().required('El número de documento es obligatorio')
});

const CreateGuestModal = ({ isOpen, onClose, onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      documentType: 'DNI'
    }
  });

  const documentTypes = [
    { value: 'DNI', label: 'DNI' },
    { value: 'Pasaporte', label: 'Pasaporte' },
    { value: 'Carnet', label: 'Carné de Extranjería' }
  ];

  const onFormSubmit = async (data) => {
    try {
      // Preparar datos para Supabase
      const guestData = {
        full_name: data.fullName,
        email: data.email || null,
        phone: data.phone || null,
        document_type: data.documentType,
        document_number: data.documentNumber,
        status: 'inactive', // Por defecto
        total_visits: 0,
        total_spent: 0
      };

      // Crear huésped usando Supabase
      const { data: newGuest, error } = await db.createGuest(guestData);

      if (error) {
        toast.error('Error al crear el huésped: ' + error.message);
        return;
      }

      toast.success('Huésped creado exitosamente');
      
      // Llamar callback del padre si existe
      if (onSubmit) {
        onSubmit(newGuest);
      }

      handleClose();
    } catch (error) {
      console.error('Error creating guest:', error);
      toast.error('Error al crear el huésped');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nuevo Huésped</h2>
            <p className="text-gray-600 mt-1">Registro simplificado de huésped</p>
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
              icon={User}
            >
              Crear Huésped
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGuestModal;