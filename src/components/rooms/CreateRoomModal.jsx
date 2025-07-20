// src/components/rooms/CreateRoomModal.jsx - SIN ROOM_TYPES Y DESCRIPCIÓN
import React, { useState } from 'react';
import { X, Bed, Users, Maximize, DollarSign, MapPin, Plus, Trash2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../common/Button';

// Tipos de habitación comunes (predefinidos)
const COMMON_ROOM_TYPES = [
  'Habitación Estándar',
  'Habitación Deluxe',
  'Suite Ejecutiva',
  'Junior Suite',
  'Suite Presidencial',
  'Habitación Familiar',
  'Habitación Individual',
  'Habitación Doble'
];

// Características de habitación
const ROOM_FEATURES = {
  WIFI: 'WiFi Gratis',
  AC: 'Aire Acondicionado',
  TV: 'TV Cable',
  MINIBAR: 'Minibar',
  BALCONY: 'Balcón',
  BATHROOM: 'Baño Privado',
  SAFE: 'Caja Fuerte',
  PHONE: 'Teléfono',
  ROOM_SERVICE: 'Room Service',
  LAUNDRY: 'Servicio de Lavandería',
  JACUZZI: 'Jacuzzi',
  KITCHEN: 'Kitchenette',
  TERRACE: 'Terraza',
  SEA_VIEW: 'Vista al Mar',
  CITY_VIEW: 'Vista a la Ciudad'
};

// SCHEMA SIMPLIFICADO - Solo número y piso requeridos, SIN DESCRIPCIÓN
const schema = yup.object().shape({
  number: yup.string().required('El número de habitación es obligatorio'),
  floor: yup.number().min(1, 'El piso debe ser mayor a 0').required('El piso es obligatorio'),
  room_type: yup.string().optional(),
  capacity: yup.number().min(1, 'La capacidad debe ser mayor a 0').optional(),
  size: yup.number().min(1, 'El tamaño debe ser mayor a 0').optional(),
  base_rate: yup.number().min(0, 'La tarifa debe ser positiva').optional(),
  beds: yup.array().of(
    yup.object().shape({
      type: yup.string().optional(),
      count: yup.number().min(1, 'Cantidad debe ser mayor a 0').optional()
    })
  ).optional(),
  features: yup.array().optional()
});

const CreateRoomModal = ({ isOpen, onClose, onSubmit, roomTypes = [] }) => {
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      beds: [{ type: 'Doble', count: 1 }],
      features: [],
      capacity: 2,
      size: 25,
      base_rate: 100,
      room_type: 'Habitación Estándar'
      // ELIMINADO: description: ''
    }
  });

  const { fields: bedFields, append: addBed, remove: removeBed } = useFieldArray({
    control,
    name: 'beds'
  });

  const watchedType = watch('room_type');

  // Auto-completar campos basado en tipo seleccionado
  React.useEffect(() => {
    if (watchedType && roomTypes && roomTypes.length > 0) {
      const selectedType = roomTypes.find(type => type.name === watchedType);
      if (selectedType) {
        setValue('capacity', selectedType.capacity || 2);
        setValue('size', selectedType.size || 25);
        setValue('base_rate', selectedType.base_rate || 100);
        
        // Características por defecto según el tipo
        const typeFeatures = getDefaultFeaturesForType(watchedType);
        setSelectedFeatures(typeFeatures);
        setValue('features', typeFeatures);
      }
    }
  }, [watchedType, roomTypes, setValue]);

  // Obtener características por defecto según el tipo
  const getDefaultFeaturesForType = (roomType) => {
    const baseFeatures = ['WiFi Gratis', 'TV Cable', 'Aire Acondicionado', 'Baño Privado'];
    
    switch (roomType) {
      case 'Habitación Estándar':
        return [...baseFeatures, 'Minibar'];
      case 'Habitación Deluxe':
        return [...baseFeatures, 'Minibar', 'Balcón', 'Caja Fuerte'];
      case 'Suite Ejecutiva':
        return [...baseFeatures, 'Minibar', 'Jacuzzi', 'Vista al Mar', 'Room Service', 'Caja Fuerte'];
      case 'Junior Suite':
        return [...baseFeatures, 'Minibar', 'Balcón', 'Kitchenette'];
      case 'Suite Presidencial':
        return [...baseFeatures, 'Minibar', 'Jacuzzi', 'Vista al Mar', 'Room Service', 'Terraza', 'Caja Fuerte'];
      case 'Habitación Familiar':
        return [...baseFeatures, 'Minibar', 'Room Service'];
      default:
        return baseFeatures;
    }
  };

  const handleFeatureToggle = (feature) => {
    const newFeatures = selectedFeatures.includes(feature)
      ? selectedFeatures.filter(f => f !== feature)
      : [...selectedFeatures, feature];
    
    setSelectedFeatures(newFeatures);
    setValue('features', newFeatures);
  };

  const onFormSubmit = async (data) => {
    try {
      const roomData = {
        ...data,
        features: selectedFeatures,
        status: 'available',
        cleaningStatus: 'clean',
        // Valores por defecto si están vacíos
        capacity: data.capacity || 2,
        size: data.size || 25,
        base_rate: data.base_rate || 100,
        room_type: data.room_type || 'Habitación Estándar',
        // Convertir base_rate a rate para compatibilidad
        rate: data.base_rate || 100,
        type: data.room_type || 'Habitación Estándar'
        // ELIMINADO: description generada automáticamente
      };
      
      console.log('Submitting room data:', roomData);
      await onSubmit(roomData);
      handleClose();
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedFeatures([]);
    onClose();
  };

  const bedTypeOptions = [
    'Individual',
    'Doble',
    'Queen',
    'King',
    'Sofá Cama',
    'Litera'
  ];

  // Combinar tipos dinámicos con tipos comunes
  const allRoomTypes = React.useMemo(() => {
    const existingTypes = roomTypes?.map(t => t.name) || [];
    const combinedTypes = [...new Set([...COMMON_ROOM_TYPES, ...existingTypes])];
    return combinedTypes;
  }, [roomTypes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nueva Habitación</h2>
            <p className="text-gray-600 mt-1">
              Solo número y piso son obligatorios. Sistema simplificado sin room_types.
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
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
            {/* Basic Information - CAMPOS REQUERIDOS */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Información Básica (Requerida)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Habitación *
                  </label>
                  <input
                    type="text"
                    {...register('number')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: 101, A-15"
                  />
                  {errors.number && (
                    <p className="text-red-600 text-sm mt-1">{errors.number.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Piso *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    {...register('floor')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.floor && (
                    <p className="text-red-600 text-sm mt-1">{errors.floor.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Optional Information */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Información Adicional (Opcional)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Habitación
                  </label>
                  <select
                    {...register('room_type')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {allRoomTypes.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Los tipos se generan automáticamente desde las habitaciones existentes
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacidad (huéspedes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    {...register('capacity')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamaño (m²)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    {...register('size')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="25"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarifa por Noche (S/)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('base_rate')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100.00"
                  />
                </div>
              </div>

              {/* ELIMINADO: Campo Description */}

              {/* Beds Configuration */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Configuración de Camas (Opcional)
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Plus}
                    onClick={() => addBed({ type: 'Individual', count: 1 })}
                  >
                    Agregar Cama
                  </Button>
                </div>

                <div className="space-y-3">
                  {bedFields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <select
                          {...register(`beds.${index}.type`)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {bedTypeOptions.map(bedType => (
                            <option key={bedType} value={bedType}>
                              {bedType}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          max="5"
                          {...register(`beds.${index}.count`)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Cant."
                        />
                      </div>
                      {bedFields.length > 1 && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => removeBed(index)}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Features Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Características y Amenidades (Opcional)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.values(ROOM_FEATURES).map((feature) => (
                    <label 
                      key={feature}
                      className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFeatures.includes(feature)}
                        onChange={() => handleFeatureToggle(feature)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 flex-1">{feature}</span>
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    </label>
                  ))}
                </div>
                
                {selectedFeatures.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Características seleccionadas ({selectedFeatures.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedFeatures.map((feature) => (
                        <span 
                          key={feature}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Card - SIN DESCRIPCIÓN */}
            {watch('number') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-3">Vista Previa</h4>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-lg font-bold text-gray-900">
                      Habitación {watch('number')}
                    </h5>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      Disponible
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <MapPin size={14} />
                      <span>Piso {watch('floor') || '?'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Maximize size={14} />
                      <span>{watch('size') || '25'}m²</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users size={14} />
                      <span>Max {watch('capacity') || '2'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign size={14} />
                      <span className="font-semibold text-blue-600">
                        S/ {watch('base_rate') || '100'}/noche
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">
                      {watch('room_type') || 'Habitación Estándar'}
                    </span>
                  </div>
                  
                  {/* ELIMINADO: Descripción preview */}
                  
                  {bedFields.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Camas:</p>
                      <div className="flex flex-wrap gap-2">
                        {bedFields.map((bed, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded flex items-center space-x-1"
                          >
                            <Bed size={12} />
                            <span>
                              {watch(`beds.${index}.count`) || '1'} {watch(`beds.${index}.type`) || 'Doble'}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedFeatures.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Características:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedFeatures.slice(0, 4).map((feature) => (
                          <span 
                            key={feature}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {feature}
                          </span>
                        ))}
                        {selectedFeatures.length > 4 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            +{selectedFeatures.length - 4} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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