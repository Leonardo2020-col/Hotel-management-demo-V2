// components/rooms/RoomFormModal.jsx
import React, { useState, useEffect } from 'react'
import { X, Save, DollarSign, Building, FileText, Hash } from 'lucide-react'

const RoomFormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  room = null, 
  roomStatuses = [],
  isSubmitting = false 
}) => {
  const isEdit = !!room

  const [formData, setFormData] = useState({
    room_number: '',
    floor: 1,
    base_price: 0,
    description: '',
    status_id: ''
  })

  const [errors, setErrors] = useState({})

  // ✅ Inicializar formulario
  useEffect(() => {
    if (isOpen) {
      if (isEdit && room) {
        setFormData({
          room_number: room.room_number || '',
          floor: room.floor || 1,
          base_price: room.base_price || 0,
          description: room.description || '',
          status_id: room.room_status?.id || ''
        })
      } else {
        // Formulario para crear nueva habitación
        setFormData({
          room_number: '',
          floor: 1,
          base_price: 0,
          description: '',
          status_id: roomStatuses.find(s => s.status === 'disponible')?.id || ''
        })
      }
      setErrors({})
    }
  }, [isOpen, isEdit, room, roomStatuses])

  // ✅ Validar formulario
  const validateForm = () => {
    const newErrors = {}

    if (!formData.room_number.trim()) {
      newErrors.room_number = 'Número de habitación es requerido'
    } else if (formData.room_number.length > 10) {
      newErrors.room_number = 'Máximo 10 caracteres'
    }

    if (!formData.floor || formData.floor < 1 || formData.floor > 50) {
      newErrors.floor = 'Piso debe estar entre 1 y 50'
    }

    if (!formData.base_price || formData.base_price < 0 || formData.base_price > 10000) {
      newErrors.base_price = 'Precio debe estar entre 0 y 10,000'
    }

    if (!formData.status_id) {
      newErrors.status_id = 'Estado es requerido'
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Máximo 500 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ✅ Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  // ✅ Manejar cambios en inputs
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Editar Habitación' : 'Nueva Habitación'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Número de habitación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Hash className="inline h-4 w-4 mr-1" />
              Número de Habitación *
            </label>
            <input
              type="text"
              value={formData.room_number}
              onChange={(e) => handleChange('room_number', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.room_number ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: 101, A1, Suite-1"
              disabled={isSubmitting}
              maxLength={10}
            />
            {errors.room_number && (
              <p className="mt-1 text-sm text-red-600">{errors.room_number}</p>
            )}
          </div>

          {/* Piso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building className="inline h-4 w-4 mr-1" />
              Piso *
            </label>
            <input
              type="number"
              value={formData.floor}
              onChange={(e) => handleChange('floor', parseInt(e.target.value) || 1)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.floor ? 'border-red-300' : 'border-gray-300'
              }`}
              min="1"
              max="50"
              disabled={isSubmitting}
            />
            {errors.floor && (
              <p className="mt-1 text-sm text-red-600">{errors.floor}</p>
            )}
          </div>

          {/* Precio base */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign className="inline h-4 w-4 mr-1" />
              Precio por Noche (S/) *
            </label>
            <input
              type="number"
              value={formData.base_price}
              onChange={(e) => handleChange('base_price', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.base_price ? 'border-red-300' : 'border-gray-300'
              }`}
              min="0"
              max="10000"
              step="0.01"
              placeholder="0.00"
              disabled={isSubmitting}
            />
            {errors.base_price && (
              <p className="mt-1 text-sm text-red-600">{errors.base_price}</p>
            )}
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado *
            </label>
            <select
              value={formData.status_id}
              onChange={(e) => handleChange('status_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.status_id ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            >
              <option value="">Seleccionar estado</option>
              {roomStatuses.map(status => (
                <option key={status.id} value={status.id}>
                  {status.status.charAt(0).toUpperCase() + status.status.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
            {errors.status_id && (
              <p className="mt-1 text-sm text-red-600">{errors.status_id}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="inline h-4 w-4 mr-1" />
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              rows="3"
              placeholder="Descripción de la habitación, amenidades, etc."
              disabled={isSubmitting}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {formData.description.length}/500
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEdit ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEdit ? 'Actualizar' : 'Crear'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RoomFormModal