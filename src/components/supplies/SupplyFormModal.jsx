// src/components/supplies/SupplyFormModal.jsx
import React, { useState, useEffect } from 'react'
import { X, Package, Plus, Building2, Tag } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

const SupplyFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  supply = null,
  categories,
  suppliers,
  onCreateCategory,
  onCreateSupplier,
  loading = false
}) => {
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [showNewSupplier, setShowNewSupplier] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newSupplierData, setNewSupplierData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: ''
  })

  const isEditing = !!supply

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
      supplierId: '',
      unitOfMeasure: '',
      minimumStock: 0,
      currentStock: 0,
      unitCost: 0,
      sku: ''
    }
  })

  // Resetear formulario cuando se abre/cierra o cambia el suministro
  useEffect(() => {
    if (isOpen && supply) {
      // Modo edición
      setValue('name', supply.name || '')
      setValue('categoryId', supply.category?.id || '')
      setValue('supplierId', supply.supplier?.id || '')
      setValue('unitOfMeasure', supply.unit_of_measure || '')
      setValue('minimumStock', supply.minimum_stock || 0)
      setValue('currentStock', supply.current_stock || 0)
      setValue('unitCost', supply.unit_cost || 0)
      setValue('sku', supply.sku || '')
    } else if (isOpen) {
      // Modo creación
      reset()
    }
  }, [isOpen, supply, setValue, reset])

  // Limpiar formulario al cerrar
  useEffect(() => {
    if (!isOpen) {
      reset()
      setShowNewCategory(false)
      setShowNewSupplier(false)
      setNewCategoryName('')
      setNewSupplierData({ name: '', contactPerson: '', email: '', phone: '' })
    }
  }, [isOpen, reset])

  const handleFormSubmit = async (data) => {
    try {
      const submitData = {
        name: data.name.trim(),
        categoryId: data.categoryId || null,
        supplierId: data.supplierId || null,
        unitOfMeasure: data.unitOfMeasure.trim(),
        minimumStock: parseInt(data.minimumStock) || 0,
        currentStock: parseInt(data.currentStock) || 0,
        unitCost: parseFloat(data.unitCost) || 0,
        sku: data.sku?.trim() || null
      }

      if (isEditing) {
        await onSubmit(supply.id, submitData)
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
      }
    } catch (error) {
      console.error('Error creando categoría:', error)
    }
  }

  const handleCreateSupplier = async () => {
    if (!newSupplierData.name.trim()) {
      toast.error('Ingresa un nombre para el proveedor')
      return
    }

    try {
      const result = await onCreateSupplier(newSupplierData)
      if (result.success) {
        setValue('supplierId', result.data.id)
        setShowNewSupplier(false)
        setNewSupplierData({ name: '', contactPerson: '', email: '', phone: '' })
      }
    } catch (error) {
      console.error('Error creando proveedor:', error)
    }
  }

  const unitMeasures = [
    'unidad', 'piezas', 'kg', 'gramos', 'litros', 'ml', 'metros', 'cm',
    'cajas', 'paquetes', 'rollos', 'hojas', 'galones', 'latas', 'botellas'
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 xl:w-2/5 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Package className="h-6 w-6 mr-2" />
            {isEditing ? 'Editar Suministro' : 'Nuevo Suministro'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del suministro *
              </label>
              <input
                type="text"
                {...register('name', { 
                  required: 'El nombre es obligatorio',
                  minLength: { value: 2, message: 'Mínimo 2 caracteres' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Papel higiénico, Detergente, etc."
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <div className="flex">
                <select
                  {...register('categoryId')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
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
                  className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200 transition-colors"
                  title="Nueva categoría"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proveedor
              </label>
              <div className="flex">
                <select
                  {...register('supplierId')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sin proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewSupplier(true)}
                  className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200 transition-colors"
                  title="Nuevo proveedor"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidad de medida *
              </label>
              <select
                {...register('unitOfMeasure', { required: 'La unidad de medida es obligatoria' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar...</option>
                {unitMeasures.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              {errors.unitOfMeasure && (
                <p className="text-red-500 text-sm mt-1">{errors.unitOfMeasure.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU (opcional)
              </label>
              <input
                type="text"
                {...register('sku')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Código interno"
              />
            </div>
          </div>

          {/* Stock y costos */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Stock y Costos</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock actual
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  {...register('currentStock', { 
                    min: { value: 0, message: 'No puede ser negativo' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
                {errors.currentStock && (
                  <p className="text-red-500 text-sm mt-1">{errors.currentStock.message}</p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
                {errors.minimumStock && (
                  <p className="text-red-500 text-sm mt-1">{errors.minimumStock.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Costo unitario (S/)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('unitCost', { 
                    min: { value: 0, message: 'No puede ser negativo' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
                {errors.unitCost && (
                  <p className="text-red-500 text-sm mt-1">{errors.unitCost.message}</p>
                )}
              </div>
            </div>

            {/* Valor total calculado */}
            {watch('currentStock') > 0 && watch('unitCost') > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <div className="text-sm text-blue-800">
                  <strong>Valor total del inventario: S/ {(
                    (watch('currentStock') || 0) * (watch('unitCost') || 0)
                  ).toFixed(2)}</strong>
                </div>
              </div>
            )}
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
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Suministro')}
            </button>
          </div>
        </form>

        {/* Modal para nueva categoría */}
        {showNewCategory && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-80">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                Nueva Categoría
              </h4>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre de la categoría"
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
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para nuevo proveedor */}
        {showNewSupplier && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-96">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Nuevo Proveedor
              </h4>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newSupplierData.name}
                  onChange={(e) => setNewSupplierData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre del proveedor"
                />
                <input
                  type="text"
                  value={newSupplierData.contactPerson}
                  onChange={(e) => setNewSupplierData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Persona de contacto"
                />
                <input
                  type="email"
                  value={newSupplierData.email}
                  onChange={(e) => setNewSupplierData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Email"
                />
                <input
                  type="tel"
                  value={newSupplierData.phone}
                  onChange={(e) => setNewSupplierData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Teléfono"
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setShowNewSupplier(false)}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateSupplier}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SupplyFormModal