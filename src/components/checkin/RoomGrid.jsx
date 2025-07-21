// src/components/checkin/RoomGrid.jsx - VERSIÓN SIMPLIFICADA CON 3 ESTADOS
import React from 'react';
import { Bed, ChevronRight, Users, MapPin, Sparkles } from 'lucide-react';
import Button from '../common/Button';

const RoomGrid = ({ 
  floorRooms, 
  selectedFloor, 
  selectedRoom, 
  checkoutMode, 
  savedOrders, 
  onFloorChange, 
  onRoomClick, 
  onNext,
  onCleanRoom // NUEVA PROP para limpiar habitación con un click
}) => {
  
  // ESTADOS SIMPLIFICADOS - Solo 3 estados
  const SIMPLE_ROOM_STATUS = {
    AVAILABLE: 'available',     // Verde - Limpia y disponible
    OCCUPIED: 'occupied',       // Rojo - Ocupada
    NEEDS_CLEANING: 'dirty'     // Amarillo - Necesita limpieza
  };

  const getRoomStatusColor = (room) => {
    // Lógica simplificada para determinar el color
    if (room.status === 'occupied') {
      return 'bg-red-500 hover:bg-red-600 text-white'; // Rojo - Ocupada
    }
    
    if (room.cleaning_status === 'dirty' || room.status === 'cleaning') {
      return 'bg-yellow-500 hover:bg-yellow-600 text-white'; // Amarillo - Necesita limpieza
    }
    
    // Disponible y limpia
    return 'bg-green-500 hover:bg-green-600 text-white'; // Verde - Disponible
  };

  const getRoomStatusText = (room) => {
    if (room.status === 'occupied') {
      return 'Ocupada';
    }
    
    if (room.cleaning_status === 'dirty' || room.status === 'cleaning') {
      return 'Necesita Limpieza';
    }
    
    return 'Disponible';
  };

  // Handler para limpiar habitación con un click
  const handleQuickClean = (room, event) => {
    event.stopPropagation(); // Evitar que se active el click del cuarto
    
    if (room.cleaning_status === 'dirty' || room.status === 'cleaning') {
      if (onCleanRoom) {
        onCleanRoom(room.id);
      }
    }
  };

  // Validación de datos
  if (!floorRooms || typeof floorRooms !== 'object') {
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

  const availableFloors = Object.keys(floorRooms);
  
  if (availableFloors.length === 0) {
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
    );
  }

  if (!floorRooms[selectedFloor]) {
    const firstFloor = availableFloors[0];
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
    );
  }

  const currentFloorRooms = floorRooms[selectedFloor];
  
  if (!Array.isArray(currentFloorRooms)) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error: Las habitaciones del piso {selectedFloor} no están en formato correcto</p>
      </div>
    );
  }

  if (currentFloorRooms.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No hay habitaciones en el piso {selectedFloor}</p>
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

      {/* NUEVA: Leyenda simplificada */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Estados de Habitaciones (Simplificado)</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span>Disponible (Limpia)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span>Ocupada</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
            <span>Necesita Limpieza</span>
            <Sparkles className="w-4 h-4 ml-1 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Grid de Habitaciones SIMPLIFICADO */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        {currentFloorRooms.map((room, index) => {
          if (!room) return null;

          const roomNumber = room.number || room.id || `${selectedFloor}${index.toString().padStart(2, '0')}`;
          const roomStatus = room.status || 'available';
          const roomCapacity = room.capacity || 2;
          const roomRate = room.rate || room.base_rate || 100;
          const roomType = room.room_type || 'Habitación Estándar';

          const isClickable = checkoutMode ? roomStatus === 'occupied' : roomStatus === 'available';
          const hasOrder = savedOrders && savedOrders[roomNumber];
          const guestInfo = room.currentGuest || room.guestName || hasOrder?.guestName;
          
          // Determinar si la habitación necesita limpieza
          const needsCleaning = room.cleaning_status === 'dirty' || room.status === 'cleaning';
          
          return (
            <div key={room.id || roomNumber || index} className="relative">
              {/* Botón principal de la habitación */}
              <button
                onClick={() => isClickable && onRoomClick(room)}
                disabled={!isClickable}
                className={`
                  relative p-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-105
                  ${getRoomStatusColor(room)}
                  ${selectedRoom?.number === roomNumber ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
                  ${!isClickable ? 'opacity-50 cursor-not-allowed' : ''}
                  w-full
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
                  <div className="text-xs mt-1">
                    {getRoomStatusText(room)}
                  </div>
                </div>
                
                {/* Información del huésped para habitaciones ocupadas */}
                {roomStatus === 'occupied' && guestInfo && (
                  <div className="absolute top-1 left-1 bg-white bg-opacity-90 rounded px-1 py-0.5 text-xs text-gray-800 max-w-[80%] truncate">
                    {typeof guestInfo === 'string' ? guestInfo : guestInfo.name || 'Huésped'}
                  </div>
                )}
                
                {/* Indicador de orden guardada */}
                {hasOrder && (
                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    ✓
                  </div>
                )}
              </button>

              {/* NUEVO: Botón de limpieza rápida */}
              {needsCleaning && (
                <button
                  onClick={(e) => handleQuickClean(room, e)}
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 hover:bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
                  title="Click para marcar como limpia"
                >
                  <Sparkles size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda de acciones */}
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
            <span>Necesita Limpieza</span>
          </div>
          {/* NUEVA: Instrucción para limpieza rápida */}
          <div className="flex items-center text-green-600 font-medium">
            <Sparkles className="w-4 h-4 mr-2" />
            <span>Click en ✨ para limpiar</span>
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

      {/* Información adicional */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Habitaciones en piso {selectedFloor}: {currentFloorRooms.length} | 
        Disponibles: {currentFloorRooms.filter(r => r.status === 'available' && r.cleaning_status !== 'dirty').length} | 
        Ocupadas: {currentFloorRooms.filter(r => r.status === 'occupied').length} |
        Necesitan limpieza: {currentFloorRooms.filter(r => r.cleaning_status === 'dirty' || r.status === 'cleaning').length}
      </div>
    </>
  );
};

// Para src/components/checkin/RoomGrid.jsx - Versión simplificada
const SimplifiedCheckInRoomCard = ({ 
  room, 
  onRoomClick, 
  onQuickClean,
  selectedRoom,
  checkoutMode = false 
}) => {
  // Determinar estado simplificado
  const getDisplayStatus = () => {
    if (room.status === 'occupied') return 'occupied';
    if (room.cleaning_status === 'dirty' || room.status === 'cleaning') return 'needs_cleaning';
    return 'available';
  };
  
  const displayStatus = getDisplayStatus();
  
  // Colores por estado
  const getStatusColor = () => {
    switch (displayStatus) {
      case 'available':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'occupied':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'needs_cleaning':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };
  
  const getStatusText = () => {
    switch (displayStatus) {
      case 'available': return 'Disponible';
      case 'occupied': return 'Ocupada';  
      case 'needs_cleaning': return 'Necesita Limpieza';
      default: return 'Desconocido';
    }
  };
  
  const isClickable = checkoutMode 
    ? displayStatus === 'occupied' 
    : displayStatus === 'available';
    
  const isSelected = selectedRoom?.number === room.number;
  
  // Handler principal del click
  const handleMainClick = () => {
    if (displayStatus === 'needs_cleaning') {
      // Si necesita limpieza, limpiar directamente
      handleQuickClean();
    } else if (isClickable) {
      // Si es clickeable, acción normal
      onRoomClick(room);
    }
  };
  
  // Handler para limpieza rápida
  const handleQuickClean = (event) => {
    if (event) event.stopPropagation();
    
    if (displayStatus === 'needs_cleaning' && onQuickClean) {
      onQuickClean(room.id || room.room_id);
    }
  };
  
  return (
    <div className="relative">
      {/* Botón principal de la habitación */}
      <button
        onClick={handleMainClick}
        disabled={!isClickable && displayStatus !== 'needs_cleaning'}
        className={`
          relative p-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-105
          ${getStatusColor()}
          ${isSelected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
          ${!isClickable && displayStatus !== 'needs_cleaning' ? 'opacity-50 cursor-not-allowed' : ''}
          ${displayStatus === 'needs_cleaning' ? 'animate-pulse' : ''}
          w-full
        `}
      >
        {/* Número de habitación */}
        <div className="text-center mb-2">
          <div className="text-2xl font-bold">{room.number}</div>
          <div className="text-sm opacity-90">{getStatusText()}</div>
        </div>
        
        {/* Información de la habitación */}
        <div className="text-xs opacity-75">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <span>👥 {room.capacity || 2}</span>
          </div>
          <div className="text-center">
            S/ {parseFloat(room.rate || room.base_rate || 100).toFixed(0)}
          </div>
        </div>
        
        {/* Información del huésped para habitaciones ocupadas */}
        {displayStatus === 'occupied' && (room.guestName || room.currentGuest) && (
          <div className="absolute top-1 left-1 bg-white bg-opacity-90 rounded px-1 py-0.5 text-xs text-gray-800 max-w-[80%] truncate">
            {room.guestName || room.currentGuest?.name || 'Huésped'}
          </div>
        )}
      </button>

      {/* Botón de limpieza rápida flotante */}
      {displayStatus === 'needs_cleaning' && (
        <button
          onClick={handleQuickClean}
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 hover:bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
          title="Click para marcar como limpia"
        >
          ✨
        </button>
      )}
      
      {/* Indicador de necesita limpieza */}
      {displayStatus === 'needs_cleaning' && (
        <div className="absolute top-1 right-1 w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
      )}
    </div>
  );
};

export default RoomGrid;