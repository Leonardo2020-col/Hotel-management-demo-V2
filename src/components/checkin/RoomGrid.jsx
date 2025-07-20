// src/components/checkin/RoomGrid.jsx - CORREGIDO PARA MANEJAR DATOS
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

  // VALIDACIÓN ROBUSTA DE DATOS
  console.log('🔍 RoomGrid Debug:')
  console.log('floorRooms:', floorRooms)
  console.log('selectedFloor:', selectedFloor)
  console.log('checkoutMode:', checkoutMode)
  console.log('savedOrders:', savedOrders)
  console.log('typeof floorRooms:', typeof floorRooms)

  // Verificar si floorRooms existe y es válido
  if (!floorRooms) {
    console.warn('⚠️ floorRooms is null/undefined')
    return (
      <div className="text-center py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        <p className="text-gray-500 mt-4">Cargando habitaciones...</p>
      </div>
    );
  }

  // Verificar el tipo de floorRooms
  if (typeof floorRooms !== 'object') {
    console.error('❌ floorRooms is not an object:', floorRooms)
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error: Formato de datos incorrecto</p>
        <p className="text-gray-500 text-sm">floorRooms debe ser un objeto</p>
      </div>
    )
  }

  // Obtener las claves de los pisos disponibles
  const availableFloors = Object.keys(floorRooms)
  console.log('📋 Available floors:', availableFloors)

  // Si no hay pisos disponibles
  if (availableFloors.length === 0) {
    console.warn('⚠️ No floors available')
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No hay habitaciones disponibles</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Recargar página
        </button>
      </div>
    )
  }

  // Verificar si el piso seleccionado existe
  if (!floorRooms[selectedFloor]) {
    console.warn(`⚠️ Selected floor ${selectedFloor} not found. Available:`, availableFloors)
    // Seleccionar el primer piso disponible
    const firstFloor = availableFloors[0]
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Piso {selectedFloor} no disponible</p>
        <button 
          onClick={() => onFloorChange(parseInt(firstFloor))}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Ir al Piso {firstFloor}
        </button>
      </div>
    )
  }

  // Obtener habitaciones del piso seleccionado
  const currentFloorRooms = floorRooms[selectedFloor]
  console.log(`🏠 Rooms for floor ${selectedFloor}:`, currentFloorRooms)

  // Verificar que currentFloorRooms sea un array
  if (!Array.isArray(currentFloorRooms)) {
    console.error(`❌ Rooms for floor ${selectedFloor} is not an array:`, currentFloorRooms)
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error: Las habitaciones del piso {selectedFloor} no están en formato correcto</p>
        <p className="text-gray-500 text-sm">Se esperaba un array, se recibió: {typeof currentFloorRooms}</p>
      </div>
    )
  }

  // Si el array está vacío
  if (currentFloorRooms.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No hay habitaciones en el piso {selectedFloor}</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {checkoutMode ? 'Selecciona habitación para Check Out' : 'Habitaciones Disponibles'}
        </h2>
        
        {/* Selector de Pisos */}
        <div className="flex space-x-2">
          {availableFloors.map((floor) => (
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

      {/* Información de debug (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <p><strong>Debug Info:</strong></p>
          <p>Piso seleccionado: {selectedFloor}</p>
          <p>Habitaciones en este piso: {currentFloorRooms.length}</p>
          <p>Tipo de datos: {Array.isArray(currentFloorRooms) ? 'Array ✅' : 'No es array ❌'}</p>
          <p>Órdenes guardadas: {Object.keys(savedOrders || {}).length}</p>
          <p>Habitaciones con órdenes: {Object.keys(savedOrders || {}).join(', ')}</p>
        </div>
      )}

      {/* Grid de Habitaciones */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        {currentFloorRooms.map((room, index) => {
          // Validar cada habitación individual
          if (!room) {
            console.warn(`⚠️ Room at index ${index} is null/undefined`)
            return null
          }

          // Asegurar que room.number existe
          const roomNumber = room.number || room.id || `${selectedFloor}${index.toString().padStart(2, '0')}`
          const roomStatus = room.status || 'available'
          const roomCapacity = room.capacity || 2
          const roomRate = room.rate || room.base_rate || 100
          const roomType = room.room_type || 'Habitación Estándar'

          // VERIFICACIÓN MEJORADA de disponibilidad para click
          const isClickable = checkoutMode ? roomStatus === 'occupied' : roomStatus === 'available'
          
          // VERIFICACIÓN MEJORADA de orden guardada
          const hasOrder = savedOrders && savedOrders[roomNumber]
          
          // Información del huésped para habitaciones ocupadas
          const guestInfo = room.currentGuest || room.guestName || hasOrder?.guestName
          
          // Debug por habitación
          if (checkoutMode && roomStatus === 'occupied') {
            console.log(`🔍 Room ${roomNumber} debug:`, {
              roomStatus,
              hasOrder: !!hasOrder,
              guestInfo,
              savedOrderKeys: Object.keys(savedOrders || {}),
              roomData: room
            })
          }
          
          return (
            <button
              key={room.id || roomNumber || index}
              onClick={() => isClickable && onRoomClick(room)}
              disabled={!isClickable}
              className={`
                relative p-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-105
                ${getRoomStatusColor(roomStatus)}
                ${selectedRoom?.number === roomNumber ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
                ${!isClickable ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <Bed className="w-6 h-6 mx-auto mb-2" />
              <div className="mb-1">{roomNumber}</div>
              
              {/* Room info */}
              <div className="text-xs opacity-90">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Users size={10} />
                  <span>{roomCapacity}</span>
                </div>
                <div className="text-xs">
                  S/ {parseFloat(roomRate).toFixed(0)}
                </div>
                {/* Mostrar tipo de habitación si es diferente del estándar */}
                {roomType !== 'Habitación Estándar' && (
                  <div className="text-xs mt-1 truncate" title={roomType}>
                    {roomType.split(' ')[0]}
                  </div>
                )}
              </div>
              
              {/* INFORMACIÓN DEL HUÉSPED para habitaciones ocupadas */}
              {roomStatus === 'occupied' && guestInfo && (
                <div className="absolute top-1 left-1 bg-white bg-opacity-90 rounded px-1 py-0.5 text-xs text-gray-800 max-w-[80%] truncate">
                  {typeof guestInfo === 'string' ? guestInfo : guestInfo.name || 'Huésped'}
                </div>
              )}
              
              {/* Indicador de orden guardada */}
              {hasOrder && (
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  <ShoppingCart size={12} />
                </div>
              )}

              {/* Indicador especial para check-out */}
              {checkoutMode && roomStatus === 'occupied' && !hasOrder && (
                <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  ⚠️
                </div>
              )}

              {/* Estado de limpieza si es relevante */}
              {room.cleaning_status && room.cleaning_status !== 'clean' && (
                <div className="absolute bottom-1 left-1 bg-yellow-500 text-white rounded px-1 py-0.5 text-xs">
                  {room.cleaning_status === 'dirty' ? 'Sucia' : 
                   room.cleaning_status === 'in_progress' ? 'Limpiando' : 
                   room.cleaning_status}
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
          {checkoutMode && (
            <div className="flex items-center">
              <span className="w-4 h-4 mr-2 text-red-600">⚠️</span>
              <span>Sin info de reserva</span>
            </div>
          )}
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

      {/* Información adicional */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Habitaciones en piso {selectedFloor}: {currentFloorRooms.length} | 
        Disponibles: {currentFloorRooms.filter(r => r.status === 'available').length} | 
        Ocupadas: {currentFloorRooms.filter(r => r.status === 'occupied').length}
        {checkoutMode && (
          <span> | Con orden guardada: {currentFloorRooms.filter(r => savedOrders && savedOrders[r.number]).length}</span>
        )}
      </div>

      {/* Debug específico para checkout */}
      {checkoutMode && process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
          <strong>Debug Check-out:</strong>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <strong>Habitaciones ocupadas:</strong>
              {currentFloorRooms
                .filter(r => r.status === 'occupied')
                .map(r => (
                  <div key={r.number} className="ml-2">
                    {r.number}: {savedOrders && savedOrders[r.number] ? '✅ Con orden' : '❌ Sin orden'}
                    {r.guestName && <span className="text-green-600"> - {r.guestName}</span>}
                  </div>
                ))
              }
            </div>
            <div>
              <strong>Órdenes guardadas:</strong>
              {Object.keys(savedOrders || {}).map(roomNum => (
                <div key={roomNum} className="ml-2">
                  {roomNum}: {savedOrders[roomNum].guestName}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoomGrid;