// src/components/rooms/EditRoomModal.jsx - CORREGIDO ERROR DE UNDEFINED
import React, { useState, useEffect } from 'react';
import { X, Bed } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../common/Button';

// SCHEMA SUPER SIMPLE - Solo número y piso
const schema = yup.object().shape({
  number: yup.string().required('El número de habitación es obligatorio'),
  floor: yup.number().min(1, 'El piso debe ser mayor a 0').required('El piso es obligatorio')
});

const EditRoomModal = ({ isOpen, onClose, onSubmit, roomData, existingRooms = [] }) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      number: '',
      floor: 1
    }
  });

  // Cargar datos de la habitación cuando se abre el modal
  useEffect(() => {
    if (isOpen && roomData) {
      console.log('Loading room data into form:', roomData);
      setValue('number', roomData.number || '');
      setValue('floor', roomData.floor || 1);
    }
  }, [isOpen, roomData, setValue]);

  const onFormSubmit = async (data) => {
    try {
      console.log('Updating room with data:', data);
      
      // Solo enviar número y piso
      const updateData = {
        number: data.number.trim(),
        floor: parseInt(data.floor)
      };
      
      await onSubmit(roomData.id, updateData);
      handleClose();
    } catch (error) {
      console.error('Error updating room:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Verificar si el número ya existe (excluyendo la habitación actual)
  const watchedNumber = watch('number');
  const numberExists = existingRooms?.some(room => 
    room.id !== roomData?.id && 
    room.number.toLowerCase() === watchedNumber?.toLowerCase().trim()
  );

  // PROTECCIÓN CONTRA UNDEFINED
  if (!isOpen) return null;
  
  // Si no hay roomData, mostrar loading o retornar null
  if (!roomData) {
    console.warn('EditRoomModal: roomData is undefined');
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Editar Habitación</h2>
            <p className="text-gray-600 mt-1">
              Modificar número y piso
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
            {/* Información actual - CON PROTECCIÓN CONTRA UNDEFINED */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h4 className="font-medium text-gray-700 mb-2">Datos Actuales</h4>
              <p className="text-sm text-gray-600">
                Habitación <strong>{roomData?.number || 'N/A'}</strong> - Piso <strong>{roomData?.floor || 'N/A'}</strong>
              </p>
            </div>

            {/* Campos editables */}
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

            {/* Vista previa de cambios - CON PROTECCIÓN CONTRA UNDEFINED */}
            {(watch('number') !== roomData?.number || watch('floor') !== roomData?.floor) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Vista Previa de Cambios</h4>
                <div className="bg-white rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-lg font-bold text-gray-900">
                      Habitación {watch('number') || 'N/A'}
                    </h5>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      Actualizada
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    📍 Piso {watch('floor') || 'N/A'}
                  </p>
                </div>
              </div>
            )}

            {/* Información adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-700 mb-2">ℹ️ Información</h4>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Solo se pueden editar número y piso</li>
                <li>• El estado de la habitación se mantiene</li>
                <li>• Las reservas activas no se ven afectadas</li>
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
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRoomModal;