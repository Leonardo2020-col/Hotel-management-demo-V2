// src/components/checkin/SnackSelection.jsx - CORRECCIÓN PARA GUARDAR SNACKS
import React from 'react';
import { ChevronLeft, Check, ShoppingCart, Plus, Minus, X, LogOut, LogIn, User, ArrowRight } from 'lucide-react';
import Button from '../common/Button';
import GuestRegistrationForm from './GuestRegistrationForm';

const SnackSelection = ({ 
  currentOrder,
  guestData,
  selectedSnackType,
  selectedSnacks,
  snackTypes,
  snackItems,
  onBack,
  onGuestDataChange,
  onSnackTypeSelect,
  onSnackSelect,
  onSnackRemove,
  onQuantityUpdate,
  onConfirmOrder,
  onConfirmRoomOnly, // Ahora se usará para "Continuar en la Habitación"
  onCancelOrder,
  loading = false,
  isCheckout = false
}) => {

  // ✅ FUNCIÓN MEJORADA: Procesar snack items con mejor mapeo
  const processedSnackItems = React.useMemo(() => {
    if (!snackItems || !Array.isArray(snackItems) || !snackTypes || !Array.isArray(snackTypes)) {
      return {}
    }

    if (snackItems.length === 0 || snackTypes.length === 0) {
      return {}
    }

    // Agrupar items por tipo
    const grouped = {}
    
    // Inicializar grupos vacíos
    snackTypes.forEach(type => {
      grouped[type.id] = []
    })

    // Función para encontrar coincidencias
    const findMatchingType = (item) => {
      const categoryName = (item.category_name || '').toLowerCase()
      const categorySlug = item.category_slug || ''
      
      // 1. Coincidencia exacta por slug
      let matchingType = snackTypes.find(type => type.id === categorySlug)
      if (matchingType) return matchingType
      
      // 2. Coincidencia por nombres similares
      matchingType = snackTypes.find(type => {
        const typeName = type.name.toLowerCase()
        
        const categoryMappings = {
          'bebidas': ['bebidas', 'bebidas-frias', 'bebidas-calientes'],
          'snacks': ['snacks', 'snacks-dulces', 'snacks-salados'],
          'servicios': ['servicios', 'servicios-extras', 'servicios extra'],
          'alcohol': ['alcohol']
        }
        
        for (const [key, variants] of Object.entries(categoryMappings)) {
          if (categoryName.includes(key) || key.includes(categoryName)) {
            return variants.some(variant => 
              type.id === variant || typeName.includes(variant) || variant.includes(typeName)
            )
          }
        }
        
        return typeName.includes(categoryName.split(' ')[0]) || 
               categoryName.includes(typeName.split(' ')[0])
      })
      
      return matchingType
    }

    // Procesar cada item
    snackItems.forEach((item) => {
      const matchingType = findMatchingType(item)
      
      if (matchingType) {
        grouped[matchingType.id].push(item)
      } else {
        if (snackTypes.length > 0) {
          grouped[snackTypes[0].id].push(item)
        }
      }
    })

    return grouped
  }, [snackItems, snackTypes])

  // ✅ FUNCIÓN HELPER: Calcular totales
  const getTotalSnacks = () => {
    return selectedSnacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0);
  };

  const getTotalOrder = () => {
    if (isCheckout) {
      return (currentOrder?.originalTotal || currentOrder?.roomPrice || 0) + getTotalSnacks();
    }
    return (currentOrder?.roomPrice || 0) + getTotalSnacks();
  };

  // ✅ VALIDACIÓN MEJORADA
  const isGuestDataValid = () => {
    if (isCheckout) {
      return guestData?.fullName?.trim()
    }
    return guestData?.fullName?.trim() && guestData?.documentNumber?.trim()
  }

  // ✅ DETERMINAR TIPO DE OPERACIÓN
  const isWalkInCheckIn = !isCheckout && currentOrder?.isWalkIn
  const isCheckoutWithSnacks = isCheckout

  // ✅ FUNCIÓN PARA CONTINUAR EN LA HABITACIÓN (NUEVA)
  const handleContinueInRoom = () => {
    console.log('🔄 Continuing in room with additional services:', {
      roomNumber: currentOrder?.room?.number,
      selectedSnacks: selectedSnacks.length,
      totalSnacks: getTotalSnacks()
    })
    
    // ✅ IMPORTANTE: Llamar onConfirmRoomOnly en lugar de onBack
    // Esto asegura que los snacks se guarden antes de volver al grid
    onConfirmRoomOnly()
  }

  // ✅ VERIFICACIÓN DE DATOS
  if (!currentOrder) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">No hay datos de la habitación</p>
          <Button variant="outline" onClick={onBack} className="mt-4">
            Volver
          </Button>
        </div>
      </div>
    )
  }

  const roomNumber = currentOrder?.room?.number || currentOrder?.room?.room_number || 'N/A'
  const showDebugInfo = process.env.NODE_ENV === 'development'

  return (
    <div>
      {/* ✅ DEBUG INFO - Solo en desarrollo */}
      {showDebugInfo && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-bold text-yellow-800 mb-2">🐛 Debug Info (Development)</h4>
          <div className="text-sm text-yellow-700 space-y-1">
            <p><strong>Is Walk-in Check-in:</strong> {isWalkInCheckIn ? 'Sí' : 'No'}</p>
            <p><strong>Is Checkout with Snacks:</strong> {isCheckoutWithSnacks ? 'Sí' : 'No'}</p>
            <p><strong>Selected Snacks:</strong> {selectedSnacks?.length || 0}</p>
            <p><strong>Guest Data Valid:</strong> {isGuestDataValid() ? 'Sí' : 'No'}</p>
            <p><strong>Total Order:</strong> S/ {getTotalOrder().toFixed(2)}</p>
            <p><strong>Current Order ID:</strong> {currentOrder?.id || 'Sin ID'}</p>
          </div>
        </div>
      )}

      {/* ✅ HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          {isCheckout ? (
            <>
              <LogOut className="w-5 h-5 mr-2 text-red-600" />
              Habitación {roomNumber} - Servicios Adicionales
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5 mr-2 text-blue-600" />
              Habitación {roomNumber} - Check-in Rápido
            </>
          )}
        </h2>
        <div className="flex items-center space-x-3">
          <div className={`text-sm px-3 py-1 rounded-full ${
            isCheckout 
              ? 'bg-orange-100 text-orange-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {isCheckout ? '🛒 Agregando Servicios' : '⚡ Registro Rápido'}
          </div>
          <Button
            variant="outline"
            onClick={onBack}
            icon={ChevronLeft}
            disabled={loading}
          >
            Volver
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* ✅ FORMULARIO DEL HUÉSPED */}
        {isCheckout ? (
          // Para check-out: Solo mostrar información del huésped (no editable)
          <div className="bg-white border-2 border-orange-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Huésped Actual - Agregando Servicios
                </h3>
              </div>
              <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                Solo lectura
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Nombre:</span>
                  <p className="text-gray-900">{guestData?.fullName || 'No especificado'}</p>
                </div>
                
                {guestData?.documentNumber && (
                  <div>
                    <span className="font-medium text-gray-700">Documento:</span>
                    <p className="text-gray-900">{guestData.documentType}: {guestData.documentNumber}</p>
                  </div>
                )}
                
                {guestData?.phone && (
                  <div>
                    <span className="font-medium text-gray-700">Teléfono:</span>
                    <p className="text-gray-900">{guestData.phone}</p>
                  </div>
                )}
                
                {currentOrder?.checkInDate && (
                  <div>
                    <span className="font-medium text-gray-700">Check-in:</span>
                    <p className="text-gray-900">{new Date(currentOrder.checkInDate).toLocaleDateString('es-PE')}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-orange-700 text-sm">
                  🛒 <strong>Agregando servicios:</strong> Selecciona servicios adicionales. 
                  Puedes continuar en la habitación o procesar el check-out.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Para check-in: Formulario completo editable
          <GuestRegistrationForm
            guestData={guestData}
            onGuestDataChange={onGuestDataChange}
            onSave={() => {}}
            onCancel={onCancelOrder}
            loading={loading}
          />
        )}

        {/* ✅ SECCIÓN DE SNACKS - Solo si los datos del huésped son válidos */}
        {isGuestDataValid() ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-blue-600" />
              {isCheckout ? 'Servicios Adicionales' : 'Snacks Opcionales'}
            </h3>

            {/* ✅ GRID DE 3 COLUMNAS PARA SNACKS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
              
              {/* Columna 1: Tipos de Snack */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-semibold mb-4 text-center">TIPOS DE SERVICIOS</h4>
                <div className="space-y-3 overflow-y-auto h-[400px]">
                  {snackTypes && snackTypes.length > 0 ? (
                    snackTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => onSnackTypeSelect(type.id)}
                        disabled={loading}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          selectedSnackType === type.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <h5 className="font-bold text-sm mb-1">{type.name}</h5>
                        <p className="text-xs text-gray-600">{type.description}</p>
                        {processedSnackItems[type.id] && (
                          <p className="text-xs text-blue-600 mt-1">
                            {processedSnackItems[type.id].length} productos disponibles
                          </p>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <p className="text-sm font-medium">No hay tipos de servicios disponibles</p>
                      <p className="text-xs text-gray-400 mt-1">Puedes continuar sin servicios adicionales</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna 2: Lista de Snacks */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-semibold mb-4 text-center">
                  {selectedSnackType && snackTypes 
                    ? snackTypes.find(t => t.id === selectedSnackType)?.name 
                    : 'LISTA DE SERVICIOS'
                  }
                </h4>
                
                {selectedSnackType ? (
                  processedSnackItems[selectedSnackType] && processedSnackItems[selectedSnackType].length > 0 ? (
                    <div className="space-y-3 overflow-y-auto h-[400px]">
                      {processedSnackItems[selectedSnackType].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => onSnackSelect(item)}
                          disabled={loading || item.stock === 0}
                          className={`w-full p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left ${
                            loading || item.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <h5 className="font-semibold text-sm">{item.name}</h5>
                              <p className="text-green-600 font-bold text-sm">S/ {item.price.toFixed(2)}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  item.stock === 0 
                                    ? 'bg-red-100 text-red-800' 
                                    : item.stock <= item.minimum_stock
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-green-100 text-green-800'
                                }`}>
                                  Stock: {item.stock}
                                </span>
                              </div>
                            </div>
                            {selectedSnacks.find(s => s.id === item.id) && (
                              <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold ml-2">
                                {selectedSnacks.find(s => s.id === item.id)?.quantity}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-gray-500">
                      <div className="text-center">
                        <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm font-medium">No hay productos disponibles en esta categoría</p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-gray-500">
                    <div className="text-center">
                      <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm">Selecciona un tipo de servicio para ver la lista</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Columna 3: Resumen de la Orden */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-semibold mb-4 text-center">
                  {isCheckout ? 'SERVICIOS ADICIONALES' : 'RESUMEN DE LA ORDEN'}
                </h4>
                
                <div className="bg-white rounded-lg p-4 h-[400px] overflow-y-auto">
                  {/* Header de la habitación */}
                  <div className={`text-center mb-4 p-3 text-white rounded-lg ${
                    isCheckout ? 'bg-orange-600' : 'bg-blue-600'
                  }`}>
                    <h5 className="font-bold">Habitación {roomNumber}</h5>
                    <p className="text-xs opacity-90">{currentOrder?.room?.description || 'Estándar'}</p>
                    {isCheckout && (
                      <p className="text-xs opacity-90 mt-1">Agregando servicios</p>
                    )}
                  </div>

                  {/* Información del huésped */}
                  <div className={`mb-4 p-3 border rounded-lg ${
                    isCheckout 
                      ? 'bg-orange-50 border-orange-200' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <h6 className={`font-semibold text-sm mb-2 ${
                      isCheckout ? 'text-orange-800' : 'text-green-800'
                    }`}>
                      Huésped:
                    </h6>
                    <p className={`text-sm font-medium ${
                      isCheckout ? 'text-orange-700' : 'text-green-700'
                    }`}>
                      {guestData?.fullName}
                    </p>
                    {guestData?.phone && (
                      <p className={`text-xs ${
                        isCheckout ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        📞 {guestData.phone}
                      </p>
                    )}
                  </div>

                  {/* Precio de la habitación */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium text-sm">
                        {isCheckout ? 'Total estadía' : 'Precio habitación'}
                      </span>
                      <span className="font-bold">
                        S/ {(isCheckout ? (currentOrder?.originalTotal || currentOrder?.roomPrice || 0) : (currentOrder?.roomPrice || 0)).toFixed(2)}
                      </span>
                    </div>

                    {/* Servicios seleccionados */}
                    {selectedSnacks && selectedSnacks.length > 0 ? (
                      <>
                        <div className="text-sm font-medium text-gray-800 border-b pb-1">
                          Servicios adicionales:
                        </div>
                        {selectedSnacks.map((snack) => (
                          <div key={snack.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">{snack.name}</span>
                                <button
                                  onClick={() => onSnackRemove(snack.id)}
                                  disabled={loading}
                                  className="text-red-500 hover:text-red-700 text-xs p-1 disabled:opacity-50"
                                  title="Eliminar item"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => onQuantityUpdate(snack.id, Math.max(1, snack.quantity - 1))}
                                  disabled={loading}
                                  className="w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="text-sm w-8 text-center font-medium">{snack.quantity}</span>
                                <button
                                  onClick={() => onQuantityUpdate(snack.id, snack.quantity + 1)}
                                  disabled={loading}
                                  className="w-6 h-6 bg-green-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-green-600 disabled:opacity-50"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                            <span className="text-sm font-bold ml-2">
                              S/ {(snack.price * snack.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        <p className="text-sm mb-2">🍎 No hay servicios seleccionados</p>
                        <p className="text-xs text-gray-400">Los servicios son opcionales</p>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="border-t-2 border-gray-300 pt-4 mb-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className={isCheckout ? 'text-orange-600' : 'text-green-600'}>
                        S/ {getTotalOrder().toFixed(2)}
                      </span>
                    </div>
                    {selectedSnacks.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Servicios adicionales: S/ {getTotalSnacks().toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* ✅ BOTONES DE ACCIÓN CORREGIDOS */}
                  <div className="space-y-2">
                    {isCheckoutWithSnacks ? (
                      // CASO 1: CHECK-OUT CON SNACKS ADICIONALES
                      <>
                        <Button
                          variant="success"
                          onClick={handleContinueInRoom} // ✅ NUEVA FUNCIÓN
                          disabled={loading || !isGuestDataValid()}
                          className="w-full text-sm py-3"
                          icon={ArrowRight}
                        >
                          ✅ Continuar en la Habitación
                          <div className="text-xs opacity-90">
                            {selectedSnacks.length > 0 
                              ? `Con ${selectedSnacks.length} servicios adicionales`
                              : 'Sin servicios adicionales'
                            }
                          </div>
                        </Button>
                        
                        <Button
                          variant="danger"
                          onClick={onConfirmOrder}
                          disabled={loading || !isGuestDataValid()}
                          className="w-full text-sm py-3"
                          icon={LogOut}
                        >
                          🚪 Procesar Check-out
                          <div className="text-xs opacity-90">
                            S/ {getTotalOrder().toFixed(2)}
                          </div>
                        </Button>
                      </>
                    ) : (
                      // CASO 2: WALK-IN CHECK-IN (UN SOLO BOTÓN)
                      <Button
                        variant="success"
                        onClick={onConfirmOrder}
                        disabled={loading || !isGuestDataValid()}
                        className="w-full text-sm py-3"
                        icon={Check}
                      >
                        ✅ Confirmar Check-in
                        <div className="text-xs opacity-90">
                          S/ {getTotalOrder().toFixed(2)}
                          {selectedSnacks.length > 0 ? " (incluye servicios)" : " (solo habitación)"}
                        </div>
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      onClick={onCancelOrder}
                      disabled={loading}
                      className="w-full text-sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ✅ MENSAJE SI FALTAN DATOS DEL HUÉSPED */
          <div className={`border rounded-lg p-6 text-center ${
            isCheckout 
              ? 'bg-orange-50 border-orange-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-2 ${
              isCheckout ? 'text-orange-800' : 'text-yellow-800'
            }`}>
              {isCheckout ? 'Información del huésped incompleta' : 'Complete la información del huésped'}
            </h3>
            <p className={isCheckout ? 'text-orange-700' : 'text-yellow-700'}>
              {isCheckout 
                ? 'No se puede agregar servicios sin la información básica del huésped.'
                : 'Por favor complete los campos obligatorios: Nombre Completo y Documento de Identidad.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SnackSelection;