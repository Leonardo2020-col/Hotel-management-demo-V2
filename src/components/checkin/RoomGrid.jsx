// ============================================
// src/components/checkin/RoomGrid.jsx - VERSIÓN COMPLETAMENTE CORREGIDA
// ============================================
import React from 'react';
import { Bed, Users, Sparkles, Loader, LogIn, LogOut, Clock, User, AlertTriangle, Info } from 'lucide-react';

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
  
  // ✅ FUNCIÓN MEJORADA: Validación defensiva de datos de habitación
  const validateRoomData = (room, index) => {
    if (!room || typeof room !== 'object') {
      console.warn(`❌ Invalid room data at index ${index}:`, room);
      return null;
    }
    
    // ✅ Extraer datos con múltiples fallbacks
    const roomId = room.id || room.room_id || `temp_${index}_${Date.now()}`;
    const roomNumber = room.number || room.room_number || `${selectedFloor}${String(index + 1).padStart(2, '0')}`;
    const roomStatus = room.status || room.room_status?.status || 'available';
    const cleaningStatus = room.cleaning_status || 'clean';
    const roomCapacity = room.capacity || room.max_occupancy || 2;
    const roomRate = room.rate || room.base_rate || room.base_price || 100;
    const roomFloor = room.floor || Math.floor(parseInt(roomNumber) / 100) || selectedFloor || 1;
    
    return {
      id: roomId,
      number: roomNumber,
      status: roomStatus,
      cleaning_status: cleaningStatus,
      capacity: roomCapacity,
      rate: roomRate,
      floor: roomFloor,
      room_type: room.room_type || room.description || 'Habitación Estándar',
      features: room.features || ['WiFi Gratis'],
      beds: room.beds || [{ type: 'Doble', count: 1 }],
      
      // ✅ Información del huésped actual
      currentGuest: room.currentGuest || room.guest || null,
      guestName: room.guestName || room.currentGuest?.name || room.guest?.name || null,
      checkInDate: room.checkInDate || room.currentGuest?.checkIn || null,
      checkOutDate: room.checkOutDate || room.currentGuest?.checkOut || null,
      confirmationCode: room.confirmationCode || room.currentGuest?.confirmationCode || null,
      
      // ✅ Información de reservación activa
      activeReservation: room.activeReservation || null,
      reservationId: room.reservationId || room.activeReservation?.id || null,
      
      // ✅ Quick checkin info
      quickCheckin: room.quickCheckin || null,
      
      // ✅ Datos originales para debugging
      _original: process.env.NODE_ENV === 'development' ? room : undefined
    };
  };

  // ✅ FUNCIÓN MEJORADA: Determinar color basado en el estado de la habitación
  const getRoomStatusColor = (room) => {
    const { status, cleaning_status } = room;
    
    // Ocupada - Rojo
    if (status === 'occupied' || status === 'ocupada') {
      return 'bg-red-500 hover:bg-red-600 text-white border-red-600';
    }
    
    // Necesita limpieza - Amarillo
    if (cleaning_status === 'dirty' || status === 'limpieza' || status === 'cleaning') {
      return 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600';
    }
    
    // Mantenimiento - Púrpura
    if (status === 'mantenimiento' || status === 'maintenance') {
      return 'bg-purple-500 hover:bg-purple-600 text-white border-purple-600';
    }
    
    // Fuera de servicio - Gris
    if (status === 'out_of_order' || status === 'fuera_servicio') {
      return 'bg-gray-500 hover:bg-gray-600 text-white border-gray-600';
    }
    
    // Disponible y limpia - Verde
    return 'bg-green-500 hover:bg-green-600 text-white border-green-600';
  };

  // ✅ FUNCIÓN MEJORADA: Obtener texto del estado
  const getRoomStatusText = (room) => {
    const { status, cleaning_status } = room;
    
    if (status === 'occupied' || status === 'ocupada') {
      return 'Ocupada';
    }
    
    if (cleaning_status === 'dirty' || status === 'limpieza' || status === 'cleaning') {
      return 'Necesita Limpieza';
    }
    
    if (status === 'mantenimiento' || status === 'maintenance') {
      return 'Mantenimiento';
    }
    
    if (status === 'out_of_order' || status === 'fuera_servicio') {
      return 'Fuera de Servicio';
    }
    
    return 'Disponible';
  };

  // ✅ FUNCIÓN MEJORADA: Obtener ícono de acción
  const getRoomActionIcon = (room) => {
    const { status, cleaning_status } = room;
    
    if (status === 'occupied' || status === 'ocupada') {
      return <LogOut className="w-4 h-4" />; // Check-out
    }
    
    if (cleaning_status === 'dirty' || status === 'limpieza' || status === 'cleaning') {
      return <Sparkles className="w-4 h-4" />; // Limpiar
    }
    
    if (status === 'mantenimiento' || status === 'maintenance') {
      return <AlertTriangle className="w-4 h-4" />; // Mantenimiento
    }
    
    return <LogIn className="w-4 h-4" />; // Check-in
  };

  // ✅ FUNCIÓN MEJORADA: Obtener texto de acción
  const getRoomActionText = (room) => {
    const { status, cleaning_status } = room;
    
    if (status === 'occupied' || status === 'ocupada') {
      return 'Click: Check-out / Servicios';
    }
    
    if (cleaning_status === 'dirty' || status === 'limpieza' || status === 'cleaning') {
      return 'Click: Marcar como Limpia';
    }
    
    if (status === 'mantenimiento' || status === 'maintenance') {
      return 'En mantenimiento';
    }
    
    return 'Click: Check-in Rápido';
  };

  // ✅ FUNCIÓN NUEVA: Calcular tiempo de estadía
  const calculateStayTime = (checkInDate) => {
    if (!checkInDate) return null;
    
    try {
      const checkIn = new Date(checkInDate);
      const now = new Date();
      const diffTime = Math.abs(now - checkIn);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (diffDays > 0) {
        return `${diffDays}d ${diffHours}h`;
      } else if (diffHours > 0) {
        return `${diffHours}h`;
      } else {
        return 'Hoy';
      }
    } catch (error) {
      console.warn('Error calculating stay time:', error);
      return null;
    }
  };

  // ✅ VALIDACIÓN MEJORADA de datos de entrada
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
        <div className="mt-2 text-xs text-gray-400">
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="cursor-pointer">Debug Info</summary>
              <div className="mt-2 text-left bg-gray-100 p-2 rounded text-xs">
                <p>floorRooms type: {typeof floorRooms}</p>
                <p>floorRooms value: {JSON.stringify(floorRooms)}</p>
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  // ✅ VALIDACIÓN: Obtener pisos disponibles
  const availableFloors = Object.keys(floorRooms)
    .map(f => parseInt(f))
    .filter(f => !isNaN(f) && floorRooms[f] && Array.isArray(floorRooms[f]))
    .sort();
  
  if (availableFloors.length === 0) {
    return (
      <div className="text-center py-8">
        <Bed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">No hay habitaciones disponibles en el sistema</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Recargar página
        </button>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-gray-400">Debug Info</summary>
            <div className="mt-2 text-left bg-gray-100 p-2 rounded text-xs">
              <p>Available floors: {JSON.stringify(Object.keys(floorRooms))}</p>
              <p>Floor rooms data: {JSON.stringify(floorRooms, null, 2)}</p>
            </div>
          </details>
        )}
      </div>
    );
  }

  // ✅ Auto-seleccionar piso válido
  const validFloor = availableFloors.includes(selectedFloor) ? selectedFloor : availableFloors[0];
  
  // ✅ VALIDACIÓN: Habitaciones del piso actual
  const currentFloorRooms = floorRooms[validFloor] || [];
  
  if (currentFloorRooms.length === 0) {
    return (
      <div className="text-center py-8">
        <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">No hay habitaciones configuradas en el piso {validFloor}</p>
        <div className="flex justify-center space-x-2">
          {availableFloors.map((floor) => (
            <button 
              key={floor}
              onClick={() => onFloorChange && onFloorChange(floor)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Piso {floor}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ✅ VALIDAR y procesar habitaciones del piso actual
  const validatedRooms = currentFloorRooms
    .map((room, index) => validateRoomData(room, index))
    .filter(room => room !== null);

  if (validatedRooms.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-500 mb-4">Error: No se pudieron procesar las habitaciones del piso {validFloor}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Recargar página
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Header - Solo si no es modo compacto */}
      {!compact && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Panel de Habitaciones - Click Inteligente
          </h2>
          
          {/* Selector de Pisos */}
          {availableFloors.length > 1 && (
            <div className="flex space-x-2">
              {availableFloors.map((floor) => (
                <button
                  key={floor}
                  onClick={() => onFloorChange && onFloorChange(floor)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    validFloor === floor
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Piso {floor}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selector de pisos compacto */}
      {compact && availableFloors.length > 1 && (
        <div className="flex justify-center space-x-2 mb-4">
          {availableFloors.map((floor) => (
            <button
              key={floor}
              onClick={() => onFloorChange && onFloorChange(floor)}
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
                <div className="text-red-600 text-xs">Click → Check-out / Servicios</div>
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
        {validatedRooms.map((room, index) => {
          const isProcessing = processingRoom === room.number;
          const isSelected = selectedRoom?.number === room.number || selectedRoom?.id === room.id;
          
          // ✅ Mejorar detección de órdenes guardadas y huéspedes
          const hasOrder = savedOrders && savedOrders[room.number];
          const guestInfo = room.guestName || hasOrder?.guestName;
          const stayTime = calculateStayTime(room.checkInDate || hasOrder?.checkInDate);
          
          return (
            <div key={room.id} className="relative group">
              {/* Botón principal de la habitación */}
              <button
                onClick={() => !isProcessing && onRoomClick && onRoomClick(room)}
                disabled={isProcessing || room.status === 'mantenimiento'}
                className={`
                  relative p-4 rounded-lg font-bold transition-all duration-200 transform hover:scale-105
                  ${getRoomStatusColor(room)}
                  ${isSelected ? 'ring-4 ring-blue-400 ring-opacity-50 scale-105' : ''}
                  ${isProcessing ? 'opacity-50 cursor-wait' : room.status === 'mantenimiento' ? 'cursor-not-allowed' : 'cursor-pointer'}
                  w-full ${compact ? 'min-h-[80px]' : 'min-h-[120px]'} flex flex-col justify-between
                  border-2 shadow-lg
                `}
              >
                {/* Indicador de procesamiento */}
                {isProcessing && (
                  <div className="absolute top-2 right-2 z-10">
                    <Loader className="w-4 h-4 animate-spin" />
                  </div>
                )}

                {/* Número de habitación */}
                <div className="flex items-center justify-center mb-2">
                  <Bed className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} mr-2`} />
                  <span className={`font-bold ${compact ? 'text-lg' : 'text-xl'}`}>{room.number}</span>
                </div>
                
                {/* Información de la habitación */}
                {!compact && (
                  <div className="text-xs opacity-90 space-y-1">
                    <div className="flex items-center justify-center space-x-1">
                      <Users size={12} />
                      <span>{room.capacity} personas</span>
                    </div>
                    <div>S/ {parseFloat(room.rate).toFixed(0)}</div>
                    <div className="text-xs font-medium">
                      {getRoomStatusText(room)}
                    </div>
                  </div>
                )}

                {/* Información compacta para modo compact */}
                {compact && (
                  <div className="text-xs opacity-90">
                    <div>S/ {parseFloat(room.rate).toFixed(0)}</div>
                    <div className="text-xs">
                      {getRoomStatusText(room)}
                    </div>
                  </div>
                )}

                {/* Ícono de acción en la esquina inferior */}
                <div className="absolute bottom-2 left-2">
                  {getRoomActionIcon(room)}
                </div>
                
                {/* Información del huésped para habitaciones ocupadas */}
                {(room.status === 'occupied' || room.status === 'ocupada') && guestInfo && (
                  <div className="absolute top-1 left-1 bg-white bg-opacity-90 rounded px-2 py-1 text-xs text-gray-800 max-w-[80%] truncate">
                    <User className="w-3 h-3 inline mr-1" />
                    {typeof guestInfo === 'string' ? guestInfo : guestInfo.name || 'Huésped'}
                  </div>
                )}
                
                {/* Indicador de orden guardada */}
                {hasOrder && (
                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10">
                    ✓
                  </div>
                )}

                {/* Indicador de tiempo para habitaciones ocupadas */}
                {(room.status === 'occupied' || room.status === 'ocupada') && stayTime && (
                  <div className="absolute top-1 right-1 bg-black bg-opacity-50 rounded px-1 py-0.5 text-xs flex items-center text-white">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{stayTime}</span>
                  </div>
                )}
              </button>

              {/* Tooltip de acción */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
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
                <span>Disponibles: {validatedRooms.filter(r => r.status === 'available' && r.cleaning_status === 'clean').length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Ocupadas: {validatedRooms.filter(r => r.status === 'occupied' || r.status === 'ocupada').length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Por limpiar: {validatedRooms.filter(r => r.cleaning_status === 'dirty' || r.status === 'limpieza' || r.status === 'cleaning').length}</span>
              </div>
              {validatedRooms.filter(r => r.status === 'mantenimiento' || r.status === 'maintenance').length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Mantenimiento: {validatedRooms.filter(r => r.status === 'mantenimiento' || r.status === 'maintenance').length}</span>
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-500">
              Piso {validFloor} - {validatedRooms.length} habitaciones
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
              <div>Current Floor Rooms: {validatedRooms.length} (de {currentFloorRooms.length} originales)</div>
              <div>Processing Room: {processingRoom || 'None'}</div>
              <div>Saved Orders: {Object.keys(savedOrders || {}).length}</div>
              <div>Compact Mode: {compact ? 'Yes' : 'No'}</div>
              <div>Selected Room: {selectedRoom?.number || 'None'}</div>
              {validatedRooms.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer">Sample Room Data</summary>
                  <pre className="mt-1 text-xs bg-white p-2 rounded overflow-auto">
                    {JSON.stringify(validatedRooms[0], null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </details>
        </div>
      )}
    </>
  );
};

export default RoomGrid;