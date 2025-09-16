// src/components/supplies/SnackFormModal.jsx - Modal para gestionar snacks
import React, { useState, useEffect } from 'react'
import { X, Coffee, Plus, Tag, DollarSign } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

const SnackFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  snack = null,
  categories,
  onCreateCategory,
  loading = false
}) => {
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const isEditing = !!snack

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      categoryId: '',
      price: 0,
      cost: 0,
      stock: 0,
      minimumStock: 0
    }
  })

  // Resetear formulario cuando se abre/cierra o cambia el snack
  useEffect(() => {
    if (isOpen && snack) {
      // Modo edición
      setValue('name', snack.name || '')
      setValue('categoryId', snack.category_id || '')
      setValue('price', snack.price || 0)
      setValue('cost', snack.cost || 0)
      setValue('stock', snack.stock || 0)
      setValue('minimumStock', snack.minimum_stock || 0)
    } else if (isOpen) {
      // Modo creación
      reset()
    }
  }, [isOpen, snack, setValue, reset])

  // Limpiar formulario al cerrar
  useEffect(() => {
    if (!isOpen) {
      reset()
      setShowNewCategory(false)
      setNewCategoryName('')
    }
  }, [isOpen, reset])

  const handleFormSubmit = async (data) => {
    try {
      const submitData = {
        name: data.name.trim(),
        categoryId: data.categoryId || null,
        price: parseFloat(data.price) || 0,
        cost: parseFloat(data.cost) || 0,
        stock: parseInt(data.stock) || 0,
        minimumStock: parseInt(data.minimumStock) || 0
      }

      if (isEditing) {
        await onSubmit(snack.id, submitData)
      } else {
        await onSubmit(submitData)
      }
    } catch (error) {
      console.error('Error en formulario:', error)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Ingresa un nombre para la categoría')
      return
    }

    try {
      const result = await onCreateCategory({ name: newCategoryName.trim() })
      if (result.success) {
        setValue('categoryId', result.data.id)
        setShowNewCategory(false)
        setNewCategoryName('')
        toast.success('Categoría creada exitosamente')
      }
    } catch (error) {
      console.error('Error creando categoría:', error)
    }
  }

  // Calcular margen de ganancia
  const watchedPrice = watch('price')
  const watchedCost = watch('cost')
  const margin = watchedPrice && watchedCost && watchedPrice > 0 
    ? (((watchedPrice - watchedCost) / watchedPrice) * 100).toFixed(1)
    : 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 xl:w-2/5 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Coffee className="h-6 w-6 mr-2 text-green-600" />
            {isEditing ? 'Editar Snack' : 'Nuevo Snack para Check-in'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Información básica */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-lg font-medium text-green-800 mb-4">Información del Snack</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del snack *
                </label>
                <input
                  type="text"
                  {...register('name', { 
                    required: 'El nombre es obligatorio',
                    minLength: { value: 2, message: 'Mínimo 2 caracteres' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: Agua Mineral, Coca Cola, Papitas Lays..."
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <div className="flex">
                  <select
                    {...register('categoryId')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="px-3 py-2 bg-green-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-green-200 transition-colors"
                    title="Nueva categoría"
                  >
                    <Plus className="h-4 w-4 text-green-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Precios y costos */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-lg font-medium text-blue-800 mb-4">Precios y Costos</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio de venta (S/) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  {...register('price', { 
                    required: 'El precio es obligatorio',
                    min: { value: 0.50, message: 'Precio mínimo S/ 0.50' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="5.00"
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Precio que paga el huésped en el check-in
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Costo unitario (S/)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('cost')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="2.50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Costo de adquisición del producto
                </p>
              </div>
            </div>

            {/* Mostrar margen de ganancia */}
            {margin > 0 && (
              <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">Margen de ganancia:</span>
                  <span className="text-lg font-bold text-green-700">{margin}%</span>
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Ganancia por unidad: S/ {(watchedPrice - watchedCost).toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {/* Stock e inventario */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="text-lg font-medium text-orange-800 mb-4">Inventario</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock inicial
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  {...register('stock', { 
                    min: { value: 0, message: 'No puede ser negativo' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  placeholder="50"
                />
                {errors.stock && (
                  <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock mínimo
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  {...register('minimumStock', { 
                    min: { value: 0, message: 'No puede ser negativo' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  placeholder="10"
                />
                {errors.minimumStock && (
                  <p className="text-red-500 text-sm mt-1">{errors.minimumStock.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Se generará alerta cuando el stock baje de este nivel
                </p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar Snack' : 'Crear Snack')}
            </button>
          </div>
        </form>

        {/* Modal para nueva categoría */}
        {showNewCategory && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-80">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Tag className="h-5 w-5 mr-2 text-green-600" />
                Nueva Categoría de Snack
              </h4>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                placeholder="Ej: Bebidas Frías, Snacks Dulces..."
                onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
              />
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setShowNewCategory(false)}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateCategory}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Coffee className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Sobre los snacks en check-in:</p>
              <ul className="text-xs space-y-1">
                <li>• Los snacks aparecen disponibles durante el proceso de check-in</li>
                <li>• El stock se reduce automáticamente cuando un huésped los selecciona</li>
                <li>• Se generan alertas automáticas cuando el stock está bajo</li>
                <li>• Los huéspedes pagan el precio de venta durante el check-in</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SnackFormModal