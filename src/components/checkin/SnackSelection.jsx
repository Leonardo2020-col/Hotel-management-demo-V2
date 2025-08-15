import React from 'react';
import { ChevronLeft, Check, ShoppingCart, Plus, Minus, X, LogOut, LogIn, User } from 'lucide-react';
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
  onConfirmRoomOnly,
  onCancelOrder,
  loading = false,
  isCheckout = false
}) => {

  const getTotalSnacks = () => {
    return selectedSnacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0);
  };

  const getTotalOrder = () => {
    if (isCheckout) {
      return (currentOrder?.originalTotal || currentOrder?.roomPrice || 0) + getTotalSnacks();
    }
    return (currentOrder?.roomPrice || 0) + getTotalSnacks();
  };

  // ✅ VALIDACIÓN SIMPLIFICADA - Solo nombre y documento
  const isGuestDataValid = () => {
    if (isCheckout) {
      // Para check-out, solo necesitamos el nombre (ya debería existir)
      return guestData?.fullName?.trim();
    }
    // Para check-in, solo validar los 2 campos obligatorios
    return guestData?.fullName?.trim() && guestData?.documentNumber?.trim();
  };

  // ✅ Procesar datos de snacks del hook actualizado
  const processedSnackItems = React.useMemo(() => {
    if (!snackItems || !Array.isArray(snackItems)) {
      return {};
    }

    // Agrupar items por categoría
    const grouped = {};
    snackItems.forEach(item => {
      const categoryId = item.category_id;
      if (!grouped[categoryId]) {
        grouped[categoryId] = [];
      }
      grouped[categoryId].push(item);
    });

    return grouped;
  }, [snackItems]);

  // Validate data
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
    );
  }

  // ✅ Compatibilidad mejorada con datos del hook
  const roomNumber = currentOrder?.room?.number || currentOrder?.room?.room_number || 'N/A';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          {isCheckout ? (
            <>
              <LogOut className="w-5 h-5 mr-2 text-red-600" />
              Habitación {roomNumber} - Check-out y Servicios Adicionales
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
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {isCheckout ? '🚪 Procesando Check-out' : '⚡ Solo 2 campos obligatorios'}
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
        {/* FORMULARIO DEL HUÉSPED - Diferente comportamiento para check-out */}
        {isCheckout ? (
          // Para check-out: Solo mostrar información del huésped (no editable)
          <div className="bg-white border-2 border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Información del Huésped (Check-out)
                </h3>
              </div>
              <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
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
                
                {guestData?.email && (
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <p className="text-gray-900">{guestData.email}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">
                  ℹ️ <strong>Check-out en proceso:</strong> Agrega servicios adicionales si es necesario antes de finalizar.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Para check-in: Formulario completo editable (simplificado)
          <GuestRegistrationForm
            guestData={guestData}
            onGuestDataChange={onGuestDataChange}
            onSave={() => {}} // Se maneja en el padre
            onCancel={onCancelOrder}
            loading={loading}
          />
        )}

        {/* SECCIÓN DE SNACKS - Solo si los datos del huésped son válidos */}
        {isGuestDataValid() ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-blue-600" />
              {isCheckout ? 'Servicios Adicionales para Check-out' : 'Snacks Opcionales'}
            </h3>

            {/* Grid de 3 Columnas para Snacks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
              
              {/* Columna 1: Tipos de Snack */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-semibold mb-4 text-center">TIPOS DE SERVICIOS</h4>
                <div className="space-y-3">
                  {snackTypes?.map((type) => (
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
                    </button>
                  )) || (
                    <div className="text-center text-gray-500 py-8">
                      <p>No hay tipos de servicios disponibles</p>
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
                
                {selectedSnackType && processedSnackItems[selectedSnackType] ? (
                  <div className="space-y-3 overflow-y-auto h-[400px]">
                    {processedSnackItems[selectedSnackType].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onSnackSelect(item)}
                        disabled={loading}
                        className={`w-full p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left ${
                          loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h5 className="font-semibold text-sm">{item.name}</h5>
                            <p className="text-green-600 font-bold text-sm">S/ {item.price.toFixed(2)}</p>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                            )}
                            {item.stock !== undefined && (
                              <p className="text-xs text-gray-400">Stock: {item.stock}</p>
                            )}
                          </div>
                          {selectedSnacks.find(s => s.id === item.id) && (
                            <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
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
                      <p>Selecciona un tipo de servicio para ver la lista</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Columna 3: Resumen de la Orden */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-semibold mb-4 text-center">
                  {isCheckout ? 'RESUMEN DE CHECK-OUT' : 'RESUMEN DE LA ORDEN'}
                </h4>
                
                <div className="bg-white rounded-lg p-4 h-[400px] overflow-y-auto">
                  {/* Header de la habitación */}
                  <div className={`text-center mb-4 p-3 text-white rounded-lg ${
                    isCheckout ? 'bg-red-600' : 'bg-blue-600'
                  }`}>
                    <h5 className="font-bold">Habitación {roomNumber}</h5>
                    <p className="text-xs opacity-90">{currentOrder?.room?.description || 'Estándar'}</p>
                    {isCheckout && (
                      <p className="text-xs opacity-90 mt-1">Check-out en proceso</p>
                    )}
                  </div>

                  {/* Información del huésped */}
                  <div className={`mb-4 p-3 border rounded-lg ${
                    isCheckout 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <h6 className={`font-semibold text-sm mb-2 ${
                      isCheckout ? 'text-red-800' : 'text-green-800'
                    }`}>
                      Huésped:
                    </h6>
                    <p className={`text-sm font-medium ${
                      isCheckout ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {guestData?.fullName}
                    </p>
                    {guestData?.documentNumber && (
                      <p className={`text-xs ${
                        isCheckout ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {guestData?.documentType}: {guestData?.documentNumber}
                      </p>
                    )}
                    {guestData?.phone && (
                      <p className={`text-xs ${
                        isCheckout ? 'text-red-600' : 'text-green-600'
                      }`}>
                        📞 {guestData.phone}
                      </p>
                    )}
                    {guestData?.email && (
                      <p className={`text-xs ${
                        isCheckout ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ✉️ {guestData.email}
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
                          {isCheckout ? 'Servicios adicionales:' : 'Snacks seleccionados:'}
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
                        <p className="text-sm mb-2">🍎 {isCheckout ? 'No hay servicios adicionales' : 'No hay snacks seleccionados'}</p>
                        <p className="text-xs text-gray-400">{isCheckout ? 'Los servicios son opcionales' : 'Los snacks son opcionales'}</p>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="border-t-2 border-gray-300 pt-4 mb-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className={isCheckout ? 'text-red-600' : 'text-green-600'}>
                        S/ {getTotalOrder().toFixed(2)}
                      </span>
                    </div>
                    {selectedSnacks.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Servicios adicionales: S/ {getTotalSnacks().toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="space-y-2">
                    {/* Botón principal - diferente para check-in vs check-out */}
                    {isCheckout ? (
                      <>
                        {/* Un solo botón para check-out (con o sin servicios) */}
                        <Button
                          variant="danger"
                          onClick={onConfirmOrder}
                          disabled={loading || !isGuestDataValid()}
                          className="w-full text-sm py-3"
                          icon={LogOut}
                        >
                          ✅ Procesar Check-out
                          <div className="text-xs opacity-90">
                            S/ {getTotalOrder().toFixed(2)}
                            {selectedSnacks.length > 0 && " (incluye servicios)"}
                          </div>
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* Botones para check-in */}
                        <Button
                          variant="success"
                          onClick={onConfirmRoomOnly}
                          disabled={loading || !isGuestDataValid()}
                          className="w-full text-sm py-3"
                        >
                          ✅ Confirmar Solo Habitación
                          <div className="text-xs opacity-90">S/ {(currentOrder?.roomPrice || 0).toFixed(2)}</div>
                        </Button>
                        
                        {/* Botón para habitación + snacks - solo si hay snacks */}
                        {selectedSnacks && selectedSnacks.length > 0 && (
                          <Button
                            variant="primary"
                            onClick={onConfirmOrder}
                            icon={Check}
                            disabled={loading || !isGuestDataValid()}
                            className="w-full text-sm py-3"
                          >
                            🛒 Confirmar con Snacks
                            <div className="text-xs opacity-90">S/ {getTotalOrder().toFixed(2)} total</div>
                          </Button>
                        )}
                      </>
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
          /* Mensaje si faltan datos del huésped */
          <div className={`border rounded-lg p-6 text-center ${
            isCheckout 
              ? 'bg-red-50 border-red-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-2 ${
              isCheckout ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {isCheckout ? 'Información del huésped incompleta' : 'Complete la información del huésped'}
            </h3>
            <p className={isCheckout ? 'text-red-700' : 'text-yellow-700'}>
              {isCheckout 
                ? 'No se puede procesar el check-out sin la información básica del huésped.'
                : 'Por favor complete solo los 2 campos obligatorios: Nombre Completo y Documento de Identidad.'
              }
            </p>
            
            {/* Mostrar qué campos faltan */}
            {!isCheckout && (
              <div className="mt-3 text-sm">
                <p className="font-medium text-yellow-800 mb-2">Campos faltantes:</p>
                <div className="flex justify-center space-x-4">
                  {!guestData?.fullName?.trim() && (
                    <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">
                      📝 Nombre Completo
                    </span>
                  )}
                  {!guestData?.documentNumber?.trim() && (
                    <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">
                      🆔 Documento
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SnackSelection;