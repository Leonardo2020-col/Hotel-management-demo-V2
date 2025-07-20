// src/components/checkin/SnackSelection.jsx - CON FORMULARIO DE HUÉSPED
import React from 'react';
import { ChevronLeft, Check, ShoppingCart, Plus, Minus, X } from 'lucide-react';
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
  loading = false
}) => {

  const getTotalSnacks = () => {
    return selectedSnacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0);
  };

  const getTotalOrder = () => {
    return (currentOrder?.roomPrice || 0) + getTotalSnacks();
  };

  // Validar datos del huésped
  const isGuestDataValid = () => {
    return guestData?.fullName?.trim() && 
           guestData?.documentNumber?.trim() && 
           guestData?.phone?.trim();
  };

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Habitación {currentOrder?.room?.number} - Registro de Huésped y Snacks
        </h2>
        <div className="flex items-center space-x-3">
          <div className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
            💡 Registro sin reservación
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
        {/* FORMULARIO DEL HUÉSPED */}
        <GuestRegistrationForm
          guestData={guestData}
          onGuestDataChange={onGuestDataChange}
          onSave={() => {}} // Se maneja en el padre
          onCancel={onCancelOrder}
          loading={loading}
        />

        {/* SECCIÓN DE SNACKS - Solo si los datos del huésped son válidos */}
        {isGuestDataValid() ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-blue-600" />
              Snacks Opcionales
            </h3>

            {/* Grid de 3 Columnas para Snacks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
              
              {/* Columna 1: Tipos de Snack */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-semibold mb-4 text-center">TIPOS DE SNACK</h4>
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
                      <p>No hay tipos de snack disponibles</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna 2: Lista de Snacks */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-semibold mb-4 text-center">
                  {selectedSnackType && snackTypes 
                    ? snackTypes.find(t => t.id === selectedSnackType)?.name 
                    : 'LISTA DE SNACKS'
                  }
                </h4>
                
                {selectedSnackType && snackItems?.[selectedSnackType] ? (
                  <div className="space-y-3 overflow-y-auto h-[400px]">
                    {snackItems[selectedSnackType].map((item) => (
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
                      <p>Selecciona un tipo de snack para ver la lista</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Columna 3: Resumen de la Orden */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-semibold mb-4 text-center">RESUMEN DE LA ORDEN</h4>
                
                <div className="bg-white rounded-lg p-4 h-[400px] overflow-y-auto">
                  {/* Header de la habitación */}
                  <div className="text-center mb-4 p-3 bg-blue-600 text-white rounded-lg">
                    <h5 className="font-bold">Habitación {currentOrder?.room?.number}</h5>
                    <p className="text-xs text-blue-100">{currentOrder?.room?.room_type || 'Estándar'}</p>
                  </div>

                  {/* Información del huésped */}
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h6 className="font-semibold text-green-800 text-sm mb-2">Huésped:</h6>
                    <p className="text-sm text-green-700 font-medium">{guestData?.fullName}</p>
                    <p className="text-xs text-green-600">
                      {guestData?.documentType}: {guestData?.documentNumber}
                    </p>
                    {guestData?.phone && (
                      <p className="text-xs text-green-600">📞 {guestData.phone}</p>
                    )}
                    {guestData?.email && (
                      <p className="text-xs text-green-600">✉️ {guestData.email}</p>
                    )}
                  </div>

                  {/* Precio de la habitación */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium text-sm">Precio habitación</span>
                      <span className="font-bold">S/ {(currentOrder?.roomPrice || 0).toFixed(2)}</span>
                    </div>

                    {/* Número de huéspedes */}
                    {(guestData?.adults || guestData?.children) && (
                      <div className="flex justify-between items-center py-1 text-sm text-gray-600">
                        <span>Huéspedes:</span>
                        <span>
                          {guestData.adults || 1} adulto{(guestData.adults || 1) > 1 ? 's' : ''}
                          {guestData.children > 0 && `, ${guestData.children} niño${guestData.children > 1 ? 's' : ''}`}
                        </span>
                      </div>
                    )}

                    {/* Snacks seleccionados */}
                    {selectedSnacks && selectedSnacks.length > 0 ? (
                      selectedSnacks.map((snack) => (
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
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        <p className="text-sm mb-2">🍎 No hay snacks seleccionados</p>
                        <p className="text-xs text-gray-400">Los snacks son opcionales</p>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="border-t-2 border-gray-300 pt-4 mb-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">
                        S/ {getTotalOrder().toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="space-y-2">
                    {/* Botón para solo habitación - siempre disponible */}
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Complete la información del huésped
            </h3>
            <p className="text-yellow-700">
              Por favor complete los campos obligatorios del formulario de registro para continuar con la selección de snacks.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SnackSelection;