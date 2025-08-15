import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Smartphone, User, Calendar, Clock } from 'lucide-react';

const QuickCheckoutModal = ({ 
  isOpen, 
  onClose, 
  orderData, 
  onConfirm, 
  onViewDetails 
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash'); // Cambiado por defecto
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods = [
    { 
      id: 'cash', 
      name: 'Efectivo', 
      icon: DollarSign,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Pago en efectivo'
    },
    { 
      id: 'card', 
      name: 'Tarjeta', 
      icon: CreditCard,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Débito/Crédito'
    },
    { 
      id: 'digital', 
      name: 'Digital', 
      icon: Smartphone,
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Yape/Plin'
    }
  ];

  // Reset al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedPaymentMethod('cash'); // Efectivo por defecto
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Calcular días de estadía
  const calculateStayDays = () => {
    if (!orderData?.checkInDate) return 1;
    
    const checkIn = new Date(orderData.checkInDate);
    const now = new Date();
    const diffTime = Math.abs(now - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays || 1;
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(selectedPaymentMethod);
    } catch (error) {
      console.error('Error in checkout:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !orderData) return null;

  const stayDays = calculateStayDays();

  // ✅ Adaptación para datos del hook actualizado
  const roomNumber = orderData.room?.number || orderData.room?.room_number || 'N/A';
  const guestName = orderData.guestName || orderData.guest_name || 'Huésped';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={!isProcessing ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-scale-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Check-out Rápido</h3>
              <p className="text-red-100 text-sm">Habitación {roomNumber}</p>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="text-red-100 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Guest Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <User className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-800">Información del Huésped</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Nombre:</span>
                <span className="font-medium">{guestName}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Estadía:</span>
                <span className="font-medium">
                  {stayDays} día{stayDays !== 1 ? 's' : ''}
                </span>
              </div>
              
              {orderData.checkInDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in:</span>
                  <span className="font-medium">
                    {new Date(orderData.checkInDate).toLocaleDateString('es-PE')}
                  </span>
                </div>
              )}
              
              {orderData.confirmationCode && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Código:</span>
                  <span className="font-medium text-blue-600">
                    {orderData.confirmationCode}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-green-700 mb-1">Total a Cobrar</p>
              <p className="text-3xl font-bold text-green-800">
                S/ {(orderData.total || orderData.total_amount || 0).toFixed(2)}
              </p>
              {orderData.snacks && orderData.snacks.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Incluye servicios adicionales
                </p>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Método de Pago</h4>
            <div className="grid grid-cols-1 gap-2">
              {paymentMethods.map((method) => {
                const IconComponent = method.icon;
                const isSelected = selectedPaymentMethod === method.id;
                
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    disabled={isProcessing}
                    className={`
                      p-3 border-2 rounded-lg text-left transition-all flex items-center space-x-3
                      ${isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                      ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className={`
                      p-2 rounded-full text-white transition-colors
                      ${isSelected ? method.color : 'bg-gray-400'}
                    `}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{method.name}</div>
                      <div className="text-sm text-gray-500">{method.description}</div>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            
            {onViewDetails && (
              <button
                onClick={onViewDetails}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ver Detalle
              </button>
            )}
            
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className={`
                flex-1 px-4 py-2 text-white rounded-lg transition-all font-medium
                ${isProcessing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-red-500 hover:bg-red-600 hover:shadow-lg'
                }
              `}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Procesando...</span>
                </div>
              ) : (
                'Procesar Check-out'
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default QuickCheckoutModal;