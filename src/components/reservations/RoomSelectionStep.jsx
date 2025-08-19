// src/components/reservations/RoomSelectionStep.jsx - ACTUALIZADO
import React from 'react';
import { Calendar, Loader2, AlertCircle } from 'lucide-react';

const RoomSelectionStep = ({ 
  availableRooms, 
  formData, 
  setFormData, 
  errors, 
  loading,
  register,
  watchedValues 
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Buscando habitaciones disponibles en Supabase...</p>
        </div>
      </div>
    );
  }

  if (availableRooms.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">No hay habitaciones disponibles</h3>
        <p className="mt-1 text-gray-500">
          No se encontraron habitaciones disponibles para las fechas seleccionadas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Calendar className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Fechas y Habitación</h3>
      </div>

      {/* Date Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Entrada *
          </label>
          <input
            type="date"
            {...register('checkIn')}
            min={new Date().toISOString().split('T')[0]}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.checkIn ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.checkIn && (
            <p className="text-red-600 text-sm mt-1">{errors.checkIn.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Salida *
          </label>
          <input
            type="date"
            {...register('checkOut')}
            min={watchedValues.checkIn || new Date().toISOString().split('T')[0]}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.checkOut ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.checkOut && (
            <p className="text-red-600 text-sm mt-1">{errors.checkOut.message}</p>
          )}
        </div>
      </div>

      {/* Guest Count */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adultos *
          </label>
          <input
            type="number"
            min="1"
            {...register('adults')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.adults ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.adults && (
            <p className="text-red-600 text-sm mt-1">{errors.adults.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Niños
          </label>
          <input
            type="number"
            min="0"
            {...register('children')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Room Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Habitación *
        </label>
        <select
          {...register('roomId')}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.roomId ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value="">Seleccionar habitación</option>
          {availableRooms.map(room => (
            <option key={room.id} value={room.id}>
              Habitación {room.number} - S/ {room.base_rate.toFixed(2)}/noche
            </option>
          ))}
        </select>
        {errors.roomId && (
          <p className="text-red-600 text-sm mt-1">{errors.roomId.message}</p>
        )}
      </div>

      {/* Special Requests */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Solicitudes Especiales
        </label>
        <textarea
          {...register('specialRequests')}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Camas adicionales, dieta especial, etc."
        />
      </div>
    </div>
  );
};

export default RoomSelectionStep;