// ============================================
// src/components/checkin/RoomGrid.jsx - ADAPTADO Y MEJORADO
// ============================================
import React from 'react';
import { Bed, Users, Sparkles, Loader, LogIn, LogOut, Clock, User } from 'lucide-react';

const RoomGrid = ({ 
  floorRooms, 
  selectedFloor, 
  selectedRoom, 
  savedOrders, 
  processingRoom,
  onFloorChange, 
  onRoomClick,
  onCleanRoom,
  compact = false // ✅ Nuevo prop para modo compacto
}) => {
  
  // ✅ Función mejorada para determinar el color basado en el estado de la habitación
  const getRoomStatusColor = (room) => {
    if (room.status === 'occupied') {
      return 'bg-red-500 hover:bg-red-600 text-white'; // Rojo - Ocupada
    }
    
    if (room.cleaning_status === 'dirty' || room.status === 'limpieza' || room.status === 'cleaning') {
      return 'bg-yellow-500 hover:bg-yellow-600 text-white'; // Amarillo - Necesita limpieza
    }
    
    if (room.status === 'mantenimiento' || room.status === 'maintenance') {
      return 'bg-purple-500 hover:bg-purple-600 text-white'; // Púrpura - Mantenimiento
    }
    
    // Disponible y limpia
    return 'bg-green-500 hover:bg-green-600 text-white'; // Verde - Disponible
  };

  const getRoomStatusText = (room) => {
    if (room.status === 'occupied') {
      return 'Ocupada';
    }
    
    if (room.cleaning_status === 'dirty' || room.status === 'limpieza' || room.status === 'cleaning') {
      return 'Necesita Limpieza';
    }
    
    if (room.status === 'mantenimiento' || room.status === 'maintenance') {
      return 'Mantenimiento';
    }
    
    return 'Disponible';
  };

  // Función para obtener el ícono de acción
  const getRoomActionIcon = (room) => {
    if (room.status === 'occupied') {
      return <LogOut className="w-4 h-4" />; // Check-out
    }
    
    if (room.cleaning_status === 'dirty' || room.status === 'limpieza' || room.status === 'cleaning') {
      return <Sparkles className="w-4 h-4" />; // Limpiar
    }
    
    return <LogIn className="w-4 h-4" />; // Check-in
  };

  const getRoomActionText = (room) => {
    if (room.status === 'occupied') {
      return 'Click: Check-out';
    }
    
    if (room.cleaning_status === 'dirty' || room.status === 'limpieza' || room.status === 'cleaning') {
      return 'Click: Limpiar';
    }
    
    return 'Click: Check-in';
  };

  // ✅ Validación mejorada de datos
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

  const availableFloors = Object.keys(floorRooms).map(f => parseInt(f)).filter(f => !isNaN(f)).sort();
  
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

  // ✅ Auto-seleccionar piso válido
  const validFloor = availableFloors.includes(selectedFloor) ? selectedFloor : availableFloors[0];
  
  if (!floorRooms[validFloor] || floorRooms[validFloor].length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No hay habitaciones en el piso {validFloor}</p>
        <div className="flex justify-center space-x-2">
          {availableFloors.map((floor) => (
            <button 
              key={floor}
              onClick={() => onFloorChange(floor)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Piso {floor}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentFloorRooms = floorRooms[validFloor];

  return (
    <>
      {/* Header - Solo si no es modo compacto */}
      {!compact && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Panel de Habitaciones - Click Inteligente
          </h2>
          
          {/* Selector de Pisos */}
          <div className="flex space-x-2">
            {availableFloors.map((floor) => (
              <button
                key={floor}
                onClick={() => onFloorChange(floor)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  validFloor === floor
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Piso {floor}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selector de pisos compacto */}
      {compact && availableFloors.length > 1 && (
        <div className="flex justify-center space-x-2 mb-4">
          {availableFloors.map((floor) => (
            <button
              key={floor}
              onClick={() => onFloorChange(floor)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                validFloor === floor
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Piso {floor}
            </button>
          ))}
        </div>
      )}

      {/* Leyenda de acciones - Solo si no es modo compacto */}
      {!compact && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">Guía de Acciones Automáticas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-3 p-3 bg-green-100 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <LogIn className="w-4 h-4 text-green-700" />
              </div>
              <div>
                <div className="font-medium text-green-800">Habitación Disponible</div>
                <div className="text-green-600 text-xs">Click → Iniciar Check-in</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-red-100 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <LogOut className="w-4 h-4 text-red-700" />
              </div>
              <div>
                <div className="font-medium text-red-800">Habitación Ocupada</div>
                <div className="text-red-600 text-xs">Click → Procesar Check-out</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-yellow-100 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <Sparkles className="w-4 h-4 text-yellow-700" />
              </div>
              <div>
                <div className="font-medium text-yellow-800">Necesita Limpieza</div>
                <div className="text-yellow-600 text-xs">Click → Marcar como Limpia</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Habitaciones */}
      <div className={`grid gap-4 mb-6 ${
        compact 
          ? 'grid-cols-3 md:grid-cols-5 lg:grid-cols-6' 
          : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6'
      }`}>
        {currentFloorRooms.map((room, index) => {
          if (!room) return null;

          // ✅ Compatibilidad mejorada con diferentes formatos de datos
          const roomNumber = room.number || room.room_number || room.id || `${validFloor}${index.toString().padStart(2, '0')}`;
          const roomStatus = room.status || 'available';
          const roomCapacity = room.capacity || room.max_occupancy || 2;
          const roomRate = room.rate || room.base_rate || room.base_price || 100;
          const roomType = room.room_type || room.description || 'Habitación Estándar';
          const isProcessing = processingRoom === roomNumber;

          // ✅ Mejorar detección de órdenes guardadas y huéspedes
          const hasOrder = savedOrders && savedOrders[roomNumber];
          const guestInfo = room.quickCheckin?.guest_name || room.currentGuest || room.guestName || hasOrder?.guestName;
          
          return (
            <div key={room.id || roomNumber || index} className="relative group">
              {/* Botón principal de la habitación */}
              <button
                onClick={() => !isProcessing && onRoomClick(room)}
                disabled={isProcessing}
                className={`
                  relative p-4 rounded-lg font-bold transition-all duration-200 transform hover:scale-105
                  ${getRoomStatusColor(room)}
                  ${selectedRoom?.number === roomNumber ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
                  ${isProcessing ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                  w-full ${compact ? 'min-h-[80px]' : 'min-h-[120px]'} flex flex-col justify-between
                `}
              >
                {/* Indicador de procesamiento */}
                {isProcessing && (
                  <div className="absolute top-2 right-2">
                    <Loader className="w-4 h-4 animate-spin" />
                  </div>
                )}

                {/* Número de habitación */}
                <div className="flex items-center justify-center mb-2">
                  <Bed className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} mr-2`} />
                  <span className={`font-bold ${compact ? 'text-lg' : 'text-xl'}`}>{roomNumber}</span>
                </div>
                
                {/* Información de la habitación */}
                {!compact && (
                  <div className="text-xs opacity-90 space-y-1">
                    <div className="flex items-center justify-center space-x-1">
                      <Users size={12} />
                      <span>{roomCapacity} personas</span>
                    </div>
                    <div>S/ {parseFloat(roomRate).toFixed(0)}</div>
                    <div className="text-xs font-medium">
                      {getRoomStatusText(room)}
                    </div>
                  </div>
                )}

                {/* Información compacta para modo compact */}
                {compact && (
                  <div className="text-xs opacity-90">
                    <div>S/ {parseFloat(roomRate).toFixed(0)}</div>
                  </div>
                )}

                {/* Ícono de acción en la esquina inferior */}
                <div className="absolute bottom-2 left-2">
                  {getRoomActionIcon(room)}
                </div>
                
                {/* Información del huésped para habitaciones ocupadas */}
                {roomStatus === 'occupied' && guestInfo && (
                  <div className="absolute top-1 left-1 bg-white bg-opacity-90 rounded px-2 py-1 text-xs text-gray-800 max-w-[80%] truncate">
                    <User className="w-3 h-3 inline mr-1" />
                    {typeof guestInfo === 'string' ? guestInfo : guestInfo.name || 'Huésped'}
                  </div>
                )}
                
                {/* Indicador de orden guardada */}
                {hasOrder && (
                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    ✓
                  </div>
                )}

                {/* Indicador de tiempo para habitaciones ocupadas */}
                {roomStatus === 'occupied' && (room.checkInDate || room.quickCheckin?.check_in_date) && (
                  <div className="absolute top-1 right-1 bg-black bg-opacity-50 rounded px-1 py-0.5 text-xs flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>
                      {Math.floor((new Date() - new Date(room.checkInDate || room.quickCheckin.check_in_date)) / (1000 * 60 * 60 * 24))}d
                    </span>
                  </div>
                )}
              </button>

              {/* Tooltip de acción */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {isProcessing ? 'Procesando...' : getRoomActionText(room)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Estadísticas del piso actual - Solo si no es modo compacto */}
      {!compact && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Disponibles: {currentFloorRooms.filter(r => r.status === 'available' && r.cleaning_status === 'clean').length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Ocupadas: {currentFloorRooms.filter(r => r.status === 'occupied').length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Por limpiar: {currentFloorRooms.filter(r => r.cleaning_status === 'dirty' || r.status === 'limpieza' || r.status === 'cleaning').length}</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              Piso {validFloor} - {currentFloorRooms.length} habitaciones
            </div>
          </div>

          {processingRoom && (
            <div className="mt-3 p-2 bg-blue-100 border border-blue-200 rounded text-center">
              <div className="flex items-center justify-center space-x-2 text-blue-700">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">
                  Procesando habitación {processingRoom}...
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Indicador compacto de procesamiento */}
      {compact && processingRoom && (
        <div className="mt-2 p-2 bg-blue-100 border border-blue-200 rounded text-center">
          <div className="flex items-center justify-center space-x-2 text-blue-700">
            <Loader className="w-3 h-3 animate-spin" />
            <span className="text-xs font-medium">
              Procesando {processingRoom}...
            </span>
          </div>
        </div>
      )}

      {/* Información adicional solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && !compact && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
          <details>
            <summary className="cursor-pointer font-medium">Debug Info (Development)</summary>
            <div className="mt-2 space-y-1">
              <div>Selected Floor: {validFloor}</div>
              <div>Available Floors: {availableFloors.join(', ')}</div>
              <div>Current Floor Rooms: {currentFloorRooms.length}</div>
              <div>Processing Room: {processingRoom || 'None'}</div>
              <div>Saved Orders: {Object.keys(savedOrders || {}).length}</div>
              <div>Compact Mode: {compact ? 'Yes' : 'No'}</div>
            </div>
          </details>
        </div>
      )}
    </>
  );
};

export default RoomGrid;