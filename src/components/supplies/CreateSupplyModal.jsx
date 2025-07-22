// src/components/supplies/CreateSupplyModal.jsx - CÓDIGO COMPLETADO
import React, { useState, useEffect } from 'react';
import { X, Package, Plus, AlertTriangle, Cookie, Wrench } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../common/Button';

// Flexible schema that adapts to item type
const createSchema = (itemType) => {
  const baseSchema = {
    name: yup.string().required('El nombre del item es obligatorio'),
    description: yup.string().required('La descripción es obligatoria'),
    category: yup.string().required('La categoría es obligatoria'),
    unitPrice: yup.number().min(0, 'El precio debe ser positivo').required('El precio unitario es obligatorio')
  };

  if (itemType === 'snack') {
    return yup.object().shape({
      ...baseSchema,
      sku: yup.string(),
      supplier: yup.string(),
      unit: yup.string()
    });
  } else {
    return yup.object().shape({
      ...baseSchema,
      sku: yup.string(),
      supplier: yup.string(),
      unit: yup.string().required('La unidad de medida es obligatoria'),
      currentStock: yup.number().min(0, 'El stock debe ser positivo').required('El stock inicial es obligatorio'),
      minStock: yup.number().min(0, 'El stock mínimo debe ser positivo').required('El stock mínimo es obligatorio'),
      maxStock: yup.number().min(0, 'El stock máximo debe ser positivo').required('El stock máximo es obligatorio')
    });
  }
};

const CreateSupplyModal = ({ isOpen, onClose, onSubmit, categories, suppliers }) => {
  const [itemType, setItemType] = useState('supply'); // 'supply' or 'snack'
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newSupplier, setNewSupplier] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: yupResolver(createSchema(itemType)),
    defaultValues: {
      unit: itemType === 'snack' ? 'unidad' : 'unidad',
      currentStock: itemType === 'snack' ? 100 : 0, // Mock stock for snacks
      minStock: itemType === 'snack' ? 10 : 1,
      maxStock: itemType === 'snack' ? 500 : 100
    }
  });

  const watchedMinStock = watch('minStock');
  const watchedMaxStock = watch('maxStock');
  const watchedCurrentStock = watch('currentStock');
  const watchedUnitPrice = watch('unitPrice');

  // Reset form when item type changes
  useEffect(() => {
    reset({
      unit: itemType === 'snack' ? 'unidad' : 'unidad',
      currentStock: itemType === 'snack' ? 100 : 0,
      minStock: itemType === 'snack' ? 10 : 1,
      maxStock: itemType === 'snack' ? 500 : 100
    });
  }, [itemType, reset]);

  const onFormSubmit = async (data) => {
    try {
      const itemData = {
        ...data,
        category: showNewCategory ? newCategory : data.category,
        supplier: showNewSupplier ? newSupplier : (data.supplier || (itemType === 'snack' ? 'Proveedor de Snacks' : 'Sin proveedor')),
        item_type: itemType,
        totalValue: (data.currentStock || 100) * data.unitPrice,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        is_active: true
      };
      
      // Add default values for snacks
      if (itemType === 'snack') {
        itemData.currentStock = 100; // Mock stock
        itemData.minStock = 10;
        itemData.maxStock = 500;
        itemData.unit = 'unidad';
        itemData.sku = itemData.sku || `SNACK-${Date.now()}`;
      } else {
        itemData.sku = itemData.sku || `SUP-${Date.now()}`;
      }
      
      await onSubmit(itemData);
      handleClose();
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const handleClose = () => {
    reset();
    setShowNewCategory(false);
    setShowNewSupplier(false);
    setNewCategory('');
    setNewSupplier('');
    setItemType('supply');
    onClose();
  };

  // Categories for snacks and supplies
  const snackCategories = ['FRUTAS', 'BEBIDAS', 'SNACKS', 'POSTRES'];
  const supplyCategories = categories?.filter(cat => !snackCategories.includes(cat)) || [];

  const availableCategories = itemType === 'snack' ? snackCategories : supplyCategories;

  const units = [
    'unidad', 'kg', 'gramos', 'litros', 'ml', 'metros', 'cm', 
    'caja', 'paquete', 'docena', 'par', 'rollo', 'botella'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Nuevo {itemType === 'snack' ? 'Snack' : 'Insumo'}
            </h2>
            <p className="text-gray-600 mt-1">
              Agregar un nuevo {itemType === 'snack' ? 'snack al menú' : 'insumo al inventario'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Item Type Selector */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-center space-x-4">
            <button
              type="button"
              onClick={() => setItemType('supply')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg border-2 transition-all ${
                itemType === 'supply'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 bg-white text-gray-600'
              }`}
            >
              <Wrench className="w-5 h-5" />
              <span className="font-medium">Insumo de Hotel</span>
            </button>
            <button
              type="button"
              onClick={() => setItemType('snack')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg border-2 transition-all ${
                itemType === 'snack'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 hover:border-gray-300 bg-white text-gray-600'
              }`}
            >
              <Cookie className="w-5 h-5" />
              <span className="font-medium">Snack para Huéspedes</span>
            </button>
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            {itemType === 'snack' 
              ? 'Los snacks son productos para venta directa a huéspedes' 
              : 'Los insumos son materiales para operaciones del hotel'
            }
          </p>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del {itemType === 'snack' ? 'Snack' : 'Insumo'} *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={itemType === 'snack' ? 'Ej: Coca Cola 355ml' : 'Ej: Toallas de baño blancas'}
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU / Código <span className="text-gray-500">(opcional)</span>
                </label>
                <input
                  type="text"
                  {...register('sku')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={itemType === 'snack' ? 'SNACK-001' : 'SUP-001'}
                />
                {errors.sku && (
                  <p className="text-red-600 text-sm mt-1">{errors.sku.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Unitario (S/) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('unitPrice')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
                {errors.unitPrice && (
                  <p className="text-red-600 text-sm mt-1">{errors.unitPrice.message}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                {!showNewCategory ? (
                  <div className="flex space-x-2">
                    <select
                      {...register('category')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar categoría</option>
                      {availableCategories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={Plus}
                      onClick={() => setShowNewCategory(true)}
                    >
                      Nueva
                    </Button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Nueva categoría"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewCategory(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
                {errors.category && !showNewCategory && (
                  <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>
                )}
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proveedor <span className="text-gray-500">(opcional)</span>
                </label>
                {!showNewSupplier ? (
                  <div className="flex space-x-2">
                    <select
                      {...register('supplier')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar proveedor</option>
                      {suppliers?.map(supplier => (
                        <option key={supplier} value={supplier}>
                          {supplier}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={Plus}
                      onClick={() => setShowNewSupplier(true)}
                    >
                      Nuevo
                    </Button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newSupplier}
                      onChange={(e) => setNewSupplier(e.target.value)}
                      placeholder="Nuevo proveedor"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewSupplier(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
                {errors.supplier && !showNewSupplier && (
                  <p className="text-red-600 text-sm mt-1">{errors.supplier.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={itemType === 'snack' ? 'Describe las características del snack...' : 'Describe las características del insumo...'}
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Stock and Unit Information - Only for supplies */}
            {itemType === 'supply' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Control de Inventario
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidad de Medida *
                    </label>
                    <select
                      {...register('unit')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                    {errors.unit && (
                      <p className="text-red-600 text-sm mt-1">{errors.unit.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Inicial *
                    </label>
                    <input
                      type="number"
                      min="0"
                      {...register('currentStock')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.currentStock && (
                      <p className="text-red-600 text-sm mt-1">{errors.currentStock.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Mínimo *
                    </label>
                    <input
                      type="number"
                      min="0"
                      {...register('minStock')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.minStock && (
                      <p className="text-red-600 text-sm mt-1">{errors.minStock.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Máximo *
                    </label>
                    <input
                      type="number"
                      min="0"
                      {...register('maxStock')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.maxStock && (
                      <p className="text-red-600 text-sm mt-1">{errors.maxStock.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Snack Information */}
            {itemType === 'snack' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-900 mb-4 flex items-center">
                  <Cookie className="w-5 h-5 mr-2" />
                  Información del Snack
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidad de Venta
                    </label>
                    <select
                      {...register('unit')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="unidad">Unidad</option>
                      <option value="botella">Botella</option>
                      <option value="lata">Lata</option>
                      <option value="paquete">Paquete</option>
                      <option value="porción">Porción</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="isAvailable"
                      defaultChecked={true}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="isAvailable" className="text-sm text-gray-700">
                      Disponible para venta
                    </label>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>Nota:</strong> Los snacks no requieren control de stock detallado como los insumos. 
                    Se asume disponibilidad continua para venta a huéspedes.
                  </p>
                </div>
              </div>
            )}

            {/* Validation Warnings for supplies */}
            {itemType === 'supply' && (
              <>
                {(watchedMinStock >= watchedMaxStock && watchedMinStock > 0 && watchedMaxStock > 0) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                      <p className="text-sm text-yellow-800">
                        El stock mínimo debe ser menor que el stock máximo
                      </p>
                    </div>
                  </div>
                )}

                {(watchedCurrentStock < watchedMinStock && watchedCurrentStock >= 0 && watchedMinStock > 0) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                      <p className="text-sm text-yellow-800">
                        El stock inicial está por debajo del mínimo recomendado
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Preview */}
            {watchedUnitPrice > 0 && (
              <div className={`${itemType === 'snack' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4`}>
                <h4 className={`font-semibold ${itemType === 'snack' ? 'text-orange-900' : 'text-blue-900'} mb-2`}>
                  Resumen del {itemType === 'snack' ? 'Snack' : 'Insumo'}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={itemType === 'snack' ? 'text-orange-700' : 'text-blue-700'}>
                      Precio unitario:
                    </span>
                    <span className={`font-semibold ml-2 ${itemType === 'snack' ? 'text-orange-900' : 'text-blue-900'}`}>
                      S/ {watchedUnitPrice.toFixed(2)}
                    </span>
                  </div>
                  
                  {itemType === 'supply' && watchedCurrentStock >= 0 && (
                    <div>
                      <span className="text-blue-700">Valor total del stock:</span>
                      <span className="font-semibold text-blue-900 ml-2">
                        S/ {(watchedCurrentStock * watchedUnitPrice).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <span className={itemType === 'snack' ? 'text-orange-700' : 'text-blue-700'}>
                      Tipo de item:
                    </span>
                    <span className={`font-semibold ml-2 ${itemType === 'snack' ? 'text-orange-900' : 'text-blue-900'}`}>
                      {itemType === 'snack' ? 'Snack para huéspedes' : 'Insumo de hotel'}
                    </span>
                  </div>

                  {itemType === 'supply' && watchedCurrentStock >= 0 && watchedMinStock > 0 && (
                    <div>
                      <span className="text-blue-700">Estado inicial:</span>
                      <span className={`font-semibold ml-2 ${
                        watchedCurrentStock === 0 ? 'text-red-600' :
                        watchedCurrentStock <= watchedMinStock ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {watchedCurrentStock === 0 ? 'Sin stock' :
                         watchedCurrentStock <= watchedMinStock ? 'Stock bajo' : 'Stock OK'}
                      </span>
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
              icon={itemType === 'snack' ? Cookie : Package}
              disabled={
                (showNewCategory && !newCategory) || 
                (itemType === 'supply' && watchedMinStock >= watchedMaxStock && watchedMinStock > 0 && watchedMaxStock > 0)
              }
            >
              Crear {itemType === 'snack' ? 'Snack' : 'Insumo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSupplyModal;