// src/components/rooms/RoomFormModal.jsx - Modal para crear/editar habitaciones
import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Wifi, Tv, Car, Coffee, Wind, Bath, Bed } from 'lucide-react';
import toast from 'react-hot-toast';

const RoomFormModal = ({ room, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    number: '',
    floor: 1,
    capacity: 2,
    baseRate: 100,
    size: 25,
    beds: [{ type: 'Doble', count: 1 }],
    features: [],
    description: ''
  });

  const [saving, setSaving] = useState(false);

  // Amenidades disponibles
  const availableFeatures = [
    { id: 'wifi', name: 'WiFi Gratis', icon: Wifi },
    { id: 'tv', name: 'TV Smart', icon: Tv },
    { id: 'air_conditioning', name: 'Aire Acondicionado', icon: Wind },
    { id: 'minibar', name: 'Minibar', icon: Coffee },
    { id: 'balcony', name: 'Balcón', icon: Bath },
    { id: 'parking', name: 'Estacionamiento', icon: Car },
    { id: 'jacuzzi', name: 'Jacuzzi', icon: Bath },
    { id: 'safe', name: 'Caja Fuerte', icon: Bath },
    { id: 'kitchenette', name: 'Kitchenette', icon: Coffee },
    { id: 'workspace', name: 'Área de Trabajo', icon: Tv }
  ];

  // Tipos de cama disponibles
  const bedTypes = [
    'Individual',
    'Doble',
    'Queen',
    'King',
    'Litera',
    'Sofá Cama'
  ];

  useEffect(() => {
    if (room && isOpen) {
      setFormData({
        number: room.number || '',
        floor: room.floor || 1,
        capacity: room.capacity || 2,
        baseRate: room.base_rate || room.rate || 100,
        size: room.size || 25,
        beds: room.beds && room.beds.length > 0 ? room.beds : [{ type: 'Doble', count: 1 }],
        features: room.features || [],
        description: room.description || ''
      });
    } else if (isOpen && !room) {
      setFormData({
        number: '',
        floor: 1,
        capacity: 2,
        baseRate: 100,
        size: 25,
        beds: [{ type: 'Doble', count: 1 }],
        features: [],
        description: ''
      });
    }
  }, [room, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.number.trim()) {
      toast.error('El número de habitación es obligatorio');
      return;
    }

    if (formData.floor < 1 || formData.floor > 20) {
      toast.error('El piso debe estar entre 1 y 20');
      return;
    }

    if (formData.capacity < 1 || formData.capacity > 10) {
      toast.error('La capacidad debe estar entre 1 y 10 personas');
      return;
    }

    if (formData.baseRate < 1 || formData.baseRate > 5000) {
      toast.error('La tarifa debe estar entre S/ 1 y S/ 5,000');
      return;
    }

    setSaving(true);
    try {
      const roomData = {
        number: formData.number.trim(),
        floor: parseInt(formData.floor),
        capacity: parseInt(formData.capacity),
        base_rate: parseFloat(formData.baseRate),
        size: parseInt(formData.size),
        beds: formData.beds,
        features: formData.features,
        description: formData.description.trim()
      };

      await onSave(roomData);
      onClose();
      toast.success(room ? 'Habitación actualizada exitosamente' : 'Habitación creada exitosamente');
    } catch (error) {
      console.error('Error saving room:', error);
      toast.error(error.message || 'Error al guardar la habitación');
    } finally {
      setSaving(false);
    }
  };

  const addBed = () => {
    setFormData(prev => ({
      ...prev,
      beds: [...prev.beds, { type: 'Individual', count: 1 }]
    }));
  };

  const removeBed = (index) => {
    setFormData(prev => ({
      ...prev,
      beds: prev.beds.filter((_, i) => i !== index)
    }));
  };

  const updateBed = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      beds: prev.beds.map((bed, i) => 
        i === index ? { ...bed, [field]: value } : bed
      )
    }));
  };

  const toggleFeature = (featureId) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {room ? 'Editar Habitación' : 'Agregar Habitación'}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={saving}
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Habitación *
                </label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="101"
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Piso *
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.floor}
                  onChange={(e) => setFormData(prev => ({ ...prev, floor: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidad (personas) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 2 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarifa Base (S/) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  step="0.01"
                  value={formData.baseRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseRate: parseFloat(e.target.value) || 100 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tamaño (m²)
                </label>
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={formData.size}
                  onChange={(e) => setFormData(prev => ({ ...prev, size: parseInt(e.target.value) || 25 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Configuración de camas */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Configuración de Camas
                </label>
                <button
                  type="button"
                  onClick={addBed}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                  disabled={saving}
                >
                  <Plus size={16} />
                  <span>Agregar cama</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.beds.map((bed, index) => (
                  <div key={index} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                    <Bed className="text-gray-400" size={20} />
                    
                    <select
                      value={bed.type}
                      onChange={(e) => updateBed(index, 'type', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={saving}
                    >
                      {bedTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => updateBed(index, 'count', Math.max(1, bed.count - 1))}
                        className="p-1 text-gray-500 hover:text-gray-700"
                        disabled={saving || bed.count <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center">{bed.count}</span>
                      <button
                        type="button"
                        onClick={() => updateBed(index, 'count', Math.min(4, bed.count + 1))}
                        className="p-1 text-gray-500 hover:text-gray-700"
                        disabled={saving || bed.count >= 4}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    
                    {formData.beds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBed(index)}
                        className="p-1 text-red-500 hover:text-red-700"
                        disabled={saving}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Amenidades */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Amenidades
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableFeatures.map((feature) => {
                  const IconComponent = feature.icon;
                  const isSelected = formData.features.includes(feature.id);
                  
                  return (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => toggleFeature(feature.id)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center space-x-2 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                      disabled={saving}
                    >
                      <IconComponent size={18} />
                      <span className="text-sm font-medium">{feature.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descripción opcional de la habitación..."
                disabled={saving}
              />
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving}
              >
                {saving ? 'Guardando...' : (room ? 'Actualizar' : 'Crear')} Habitación
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoomFormModal;