// ============================================
// src/components/checkin/RoomGrid.jsx - CORREGIDO
// ============================================
import React from 'react';
import { Bed, ShoppingCart, ChevronRight, Users, MapPin } from 'lucide-react';
import Button from '../common/Button';

const RoomGrid = ({ 
  floorRooms, 
  selectedFloor, 
  selectedRoom, 
  checkoutMode, 
  savedOrders, 
  onFloorChange, 
  onRoomClick, 
  onNext 
}) => {
  
  const getRoomStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'occupied': return 'bg-red-500 hover:bg-red-600 text-white';
      case 'cleaning': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'maintenance': return 'bg-orange-500 hover:bg-orange-600 text-white';
      case 'out_of_order': return 'bg-gray-500 text-white cursor-not-allowed';
      default: return 'bg-gray-400 text-white cursor-not-allowed';
    }
  };

  const getRoomStatusText = (status) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'occupied': return 'Ocupada';
      case 'cleaning': return 'Limpieza';
      case 'maintenance': return 'Mantenimiento';
      case 'out_of_order': return 'Fuera de Servicio';
      default: return 'Desconocido';
    }
  };

  // Validate floorRooms data
  if (!floorRooms || !floorRooms[selectedFloor]) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No hay habitaciones disponibles para el piso {selectedFloor}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {checkoutMode ? 'Selecciona habitación para Check Out' : 'Habitaciones Disponibles'}
        </h2>
        
        {/* Selector de Pisos */}
        <div className="flex space-x-2">
          {Object.keys(floorRooms).map((floor) => (
            <button
              key={floor}
              onClick={() => onFloorChange(parseInt(floor))}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedFloor === parseInt(floor)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Piso {floor}
            </button>
          ))}
        </div>
      </div>

      {/* Mensaje de modo */}
      {checkoutMode && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">
            🔴 Modo Check Out: Solo puedes seleccionar habitaciones ocupadas (rojas)
          </p>
        </div>
      )}

      {/* Grid de Habitaciones */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        {floorRooms[selectedFloor].map((room) => {
          const isClickable = checkoutMode ? room.status === 'occupied' : room.status === 'available';
          const hasOrder = savedOrders && savedOrders[room.number];
          
          return (
            <button
              key={room.id || room.number}
              onClick={() => isClickable && onRoomClick(room)}
              disabled={!isClickable}
              className={`
                relative p-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-105
                ${getRoomStatusColor(room.status)}
                ${selectedRoom?.number === room.number ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
                ${!isClickable ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <Bed className="w-6 h-6 mx-auto mb-2" />
              <div className="mb-1">{room.number}</div>
              
              {/* Room info */}
              <div className="text-xs opacity-90">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Users size={10} />
                  <span>{room.capacity || 2}</span>
                </div>
                <div className="text-xs">
                  S/ {(room.rate || 0).toFixed(0)}
                </div>
              </div>
              
              {/* Indicador de orden guardada */}
              {hasOrder && (
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  <ShoppingCart size={12} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span>Ocupada</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
            <span>Limpieza</span>
          </div>
          <div className="flex items-center">
            <ShoppingCart className="w-4 h-4 mr-2 text-blue-600" />
            <span>Con orden</span>
          </div>
        </div>

        {/* Botón Siguiente */}
        {selectedRoom && (
          <Button
            variant="primary"
            onClick={onNext}
            icon={ChevronRight}
            className="px-6 py-3"
          >
            {checkoutMode ? 'Ver Resumen de Pago' : 'Siguiente - Agregar Orden'}
          </Button>
        )}
      </div>
    </>
  );
};

export default RoomGrid;
