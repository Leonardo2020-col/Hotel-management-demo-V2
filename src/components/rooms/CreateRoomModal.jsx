// src/components/rooms/CreateRoomModal.jsx - SOLO NÚMERO Y PISO
import React, { useState } from 'react';
import { X, Bed } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../common/Button';

// SCHEMA SUPER SIMPLE - Solo número y piso obligatorios
const schema = yup.object().shape({
  number: yup.string().required('El número de habitación es obligatorio'),
  floor: yup.number().min(1, 'El piso debe ser mayor a 0').required('El piso es obligatorio')
});

const CreateRoomModal = ({ isOpen, onClose, onSubmit, existingRooms = [] }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      number: '',
      floor: 1
    }
  });

  const onFormSubmit = async (data) => {
    try {
      console.log('Submitting simple room data:', data);
      
      // Solo enviar número y piso
      const roomData = {
        number: data.number.trim(),
        floor: parseInt(data.floor)
      };
      
      await onSubmit(roomData);
      handleClose();
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Verificar si el número ya existe
  const watchedNumber = watch('number');
  const numberExists = existingRooms?.some(room => 
    room.number.toLowerCase() === watchedNumber?.toLowerCase().trim()
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nueva Habitación</h2>
            <p className="text-gray-600 mt-1">
              Solo número y piso requeridos
            </p>
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
            {/* Campos requeridos */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Habitación *
                </label>
                <input
                  type="text"
                  {...register('number')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: 101, A-15, 201"
                />
                {errors.number && (
                  <p className="text-red-600 text-sm mt-1">{errors.number.message}</p>
                )}
                {numberExists && (
                  <p className="text-red-600 text-sm mt-1">
                    Este número de habitación ya existe
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Piso *
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  {...register('floor')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.floor && (
                  <p className="text-red-600 text-sm mt-1">{errors.floor.message}</p>
                )}
              </div>
            </div>

            {/* Vista previa */}
            {watch('number') && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Vista Previa</h4>
                <div className="bg-white rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-lg font-bold text-gray-900">
                      Habitación {watch('number')}
                    </h5>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      Disponible
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    📍 Piso {watch('floor')}
                  </p>
                </div>
              </div>
            )}

            {/* Información adicional */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-2">ℹ️ Información</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Solo se requiere número y piso</li>
                <li>• La habitación se creará como "Disponible"</li>
                <li>• Otros datos se pueden agregar después editando</li>
                <li>• El número debe ser único en el hotel</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
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
              icon={Bed}
              disabled={numberExists || !watch('number')?.trim()}
            >
              Crear Habitación
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;