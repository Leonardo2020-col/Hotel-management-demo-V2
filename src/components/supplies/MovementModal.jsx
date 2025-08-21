// src/components/supplies/MovementModal.jsx
import React, { useState, useEffect } from 'react'
import { X, ArrowUp, ArrowDown, RefreshCw, Package } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

const MovementModal = ({
  isOpen,
  onClose,
  onSubmit,
  supply,
  loading = false
}) => {
  const [selectedMovementType, setSelectedMovementType] = useState('in')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      movementType: 'in',
      quantity: '',
      unitCost: '',
      referenceDocument: '',
      reason: ''
    }
  })

  const watchedQuantity = watch('quantity')
  const watchedUnitCost = watch('unitCost')

  // Resetear formulario cuando se abre/cierra
  useEffect(() => {
    if (isOpen && supply) {
      reset({
        movementType: 'in',
        quantity: '',
        unitCost: supply.unit_cost || '',
        referenceDocument: '',
        reason: ''
      })
      setSelectedMovementType('in')
    }
  }, [isOpen, supply, reset])

  // Limpiar formulario al cerrar
  useEffect(() => {
    if (!isOpen) {
      reset()
      setSelectedMovementType('in')
    }
  }, [isOpen, reset])

  const handleFormSubmit = async (data) => {
    try {
      const submitData = {
        supplyId: supply.id,
        movementType: selectedMovementType,
        quantity: parseInt(data.quantity),
        unitCost: parseFloat(data.unitCost) || 0,
        referenceDocument: data.referenceDocument?.trim() || null,
        reason: data.reason?.trim() || null
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error('Error en movimiento:', error)
    }
  }

  const movementTypes = [
    {
      id: 'in',
      label: 'Entrada',
      description: 'Agregar stock al inventario',
      icon: ArrowUp,
      color: 'text-green-600 bg-green-50 border-green-200',
      examples: ['Compra', 'Donación', 'Devolución']
    },
    {
      id: 'out',
      label: 'Salida',
      description: 'Reducir stock del inventario',
      icon: ArrowDown,
      color: 'text-red-600 bg-red-50 border-red-200',
      examples: ['Uso', 'Venta', 'Pérdida', 'Daño']
    },
    {
      id: 'adjustment',
      label: 'Ajuste',
      description: 'Corregir stock por inventario físico',
      icon: RefreshCw,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      examples: ['Inventario físico', 'Corrección de error']
    }
  ]

  const selectedType = movementTypes.find(type => type.id === selectedMovementType)
  const Icon = selectedType?.icon || Package

  // Calcular nuevo stock estimado
  const calculateNewStock = () => {
    if (!supply || !watchedQuantity) return null
    
    const quantity = parseInt(watchedQuantity)
    const currentStock = supply.current_stock || 0
    
    switch (selectedMovementType) {
      case 'in':
        return currentStock + quantity
      case 'out':
        return Math.max(0, currentStock - quantity)
      case 'adjustment':
        return quantity
      default:
        return currentStock
    }
  }

  const newStock = calculateNewStock()
  const totalCost = (watchedQuantity && watchedUnitCost) 
    ? (parseFloat(watchedQuantity) * parseFloat(watchedUnitCost)).toFixed(2)
    : '0.00'

  if (!isOpen || !supply) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 xl:w-2/5 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Package className="h-6 w-6 mr-2" />
              Registrar Movimiento
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {supply.name} • Stock actual: {supply.current_stock} {supply.unit_of_measure}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Tipo de movimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de movimiento
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {movementTypes.map((type) => {
                const TypeIcon = type.icon
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setSelectedMovementType(type.id)
                      setValue('movementType', type.id)
                    }}
                    className={`
                      p-4 border rounded-lg text-left transition-all hover:shadow-sm
                      ${selectedMovementType === type.id 
                        ? type.color + ' border-2' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center mb-2">
                      <TypeIcon className={`h-5 w-5 mr-2 ${
                        selectedMovementType === type.id ? type.color.split(' ')[0] : 'text-gray-400'
                      }`} />
                      <span className="font-medium">{type.label}</span>
                    </div>
                    <p className="text-xs text-gray-600">{type.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cantidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={selectedMovementType === 'adjustment' ? '0' : '1'}
                  step="1"
                  {...register('quantity', { 
                    required: 'La cantidad es obligatoria',
                    min: { 
                      value: selectedMovementType === 'adjustment' ? 0 : 1, 
                      message: selectedMovementType === 'adjustment' 
                        ? 'No puede ser negativo' 
                        : 'Mínimo 1 unidad'
                    },
                    max: selectedMovementType === 'out' ? {
                      value: supply.current_stock,
                      message: `No puedes sacar más de ${supply.current_stock} unidades`
                    } : undefined
                  })}
                  className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder={selectedMovementType === 'adjustment' ? 'Stock final' : 'Cantidad'}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{supply.unit_of_measure}</span>
                </div>
              </div>
              {errors.quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
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
                {...register('unitCost')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Último costo: S/ {supply.unit_cost?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>

          {/* Documento de referencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Documento de referencia (opcional)
            </label>
            <input
              type="text"
              {...register('referenceDocument')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Factura #001, Orden de compra #123"
            />
          </div>

          {/* Razón del movimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Razón del movimiento
            </label>
            <textarea
              rows={3}
              {...register('reason')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Ej: ${selectedType?.examples.join(', ')}`}
            />
          </div>

          {/* Resumen del movimiento */}
          {watchedQuantity && (
            <div className={`p-4 rounded-lg border ${selectedType?.color || 'bg-gray-50 border-gray-200'}`}>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Icon className="h-4 w-4 mr-2" />
                Resumen del movimiento
              </h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Stock actual:</span>
                  <span>{supply.current_stock} {supply.unit_of_measure}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    {selectedMovementType === 'in' ? 'Cantidad a agregar:' :
                     selectedMovementType === 'out' ? 'Cantidad a reducir:' :
                     'Nuevo stock:'}
                  </span>
                  <span>{watchedQuantity} {supply.unit_of_measure}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Stock resultante:</span>
                  <span className={
                    newStock !== null && newStock <= supply.minimum_stock 
                      ? 'text-red-600' 
                      : 'text-gray-900'
                  }>
                    {newStock !== null ? `${newStock} ${supply.unit_of_measure}` : '-'}
                  </span>
                </div>
                {watchedUnitCost && selectedMovementType !== 'adjustment' && (
                  <div className="flex justify-between text-gray-600">
                    <span>Costo total:</span>
                    <span>S/ {totalCost}</span>
                  </div>
                )}
                {newStock !== null && newStock <= supply.minimum_stock && (
                  <div className="text-xs text-red-600 mt-2">
                    ⚠️ El stock resultante estará por debajo del mínimo ({supply.minimum_stock})
                  </div>
                )}
              </div>
            </div>
          )}

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
              disabled={loading || !watchedQuantity}
              className={`
                px-6 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50
                ${selectedType?.color.includes('green') ? 'bg-green-600 hover:bg-green-700' :
                  selectedType?.color.includes('red') ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'}
              `}
            >
              {loading ? 'Registrando...' : `Registrar ${selectedType?.label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MovementModal