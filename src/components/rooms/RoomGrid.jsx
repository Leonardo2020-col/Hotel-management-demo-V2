// src/components/rooms/RoomGrid.jsx - COMPATIBLE CON TU SISTEMA DE 3 ESTADOS
import React, { memo, useMemo } from 'react';
import { CheckCircle, Users, AlertTriangle, Clock, Wrench, Sparkles } from 'lucide-react';
import classNames from 'classnames';

// Función para obtener configuración de estado visual - ADAPTADA A TU SISTEMA
const getRoomDisplayStatus = (room) => {
  // Tu sistema ya tiene el estado correcto en room.status
  return room.status;
};

const getStatusColors = (status) => {
  const configs = {
    available: {
      bg: 'bg-green-50 hover:bg-green-100',
      border: 'border-green-200 hover:border-green-300',
      text: 'text-green-700',
      icon: 'text-green-600',
      hover: 'hover:shadow-md',
      label: 'Disponible',
      icon_component: CheckCircle
    },
    occupied: {
      bg: 'bg-blue-50 hover:bg-blue-100',
      border: 'border-blue-200 hover:border-blue-300',
      text: 'text-blue-700',
      icon: 'text-blue-600',
      hover: 'hover:shadow-md',
      label: 'Ocupada',
      icon_component: Users
    },
    needs_cleaning: {
      bg: 'bg-orange-50 hover:bg-orange-100',
      border: 'border-orange-200 hover:border-orange-300',
      text: 'text-orange-700',
      icon: 'text-orange-600',
      hover: 'hover:shadow-lg cursor-pointer transform hover:scale-105',
      label: '🧹 Click para limpiar',
      icon_component: AlertTriangle
    }
  };
  
  return configs[status] || configs.available;
};

const RoomCard = memo(({ room, onRoomClick, processingRoom }) => {
  const displayStatus = getRoomDisplayStatus(room);
  const colors = getStatusColors(displayStatus);
  const isProcessing = processingRoom === room.number;
  const StatusIcon = colors.icon_component;

  const handleClick = () => {
    if (!isProcessing) {
      onRoomClick(room);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={classNames(
        'relative p-4 rounded-xl border-2 transition-all duration-200',
        colors.border,
        colors.bg,
        colors.text,
        isProcessing ? 'opacity-50 cursor-not-allowed' : colors.hover
      )}
    >
      {/* Contenido principal del card */}
      <div className="text-center space-y-3">
        {/* Número de habitación */}
        <div className="text-2xl font-bold text-gray-900">
          {room.number}
        </div>
        
        {/* Estado con icono */}
        <div className="flex items-center justify-center space-x-2">
          <StatusIcon size={16} className={colors.icon} />
          <span className="text-sm font-medium">{colors.label}</span>
        </div>
        
        {/* Información adicional */}
        <div className="text-xs space-y-1">
          <div>Piso {room.floor}</div>
          <div>Cap. {room.capacity || 2}</div>
          {room.base_rate && (
            <div className="font-semibold text-green-600">
              S/ {room.base_rate}
            </div>
          )}
        </div>

        {/* Información del huésped si está ocupada */}
        {room.currentGuest && (
          <div className="text-xs bg-white bg-opacity-70 rounded-lg p-2">
            <div className="font-medium truncate">
              {room.currentGuest.name}
            </div>
            {room.currentGuest.checkOut && (
              <div className="text-gray-600">
                Sale: {new Date(room.currentGuest.checkOut).toLocaleDateString('es-ES')}
              </div>
            )}
          </div>
        )}

        {/* Próxima reserva */}
        {room.nextReservation && !room.currentGuest && (
          <div className="text-xs bg-purple-100 rounded-lg p-2">
            <div className="font-medium text-purple-800 truncate">
              {room.nextReservation.guest}
            </div>
            <div className="text-purple-600">
              Entra: {new Date(room.nextReservation.checkIn).toLocaleDateString('es-ES')}
            </div>
          </div>
        )}

        {/* Indicador especial para habitaciones que necesitan limpieza */}
        {displayStatus === 'needs_cleaning' && (
          <div className="absolute -top-2 -right-2">
            <div className="bg-orange-500 text-white rounded-full p-1 animate-pulse">
              <Sparkles size={12} />
            </div>
          </div>
        )}
      </div>

      {/* Overlay de procesamiento */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-xl">
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <span className="text-xs text-white font-medium">Limpiando...</span>
          </div>
        </div>
      )}
    </div>
  );
});

const RoomGrid = memo(({ 
  floorRooms, 
  selectedFloor, 
  onFloorChange, 
  onRoomClick, 
  processingRoom 
}) => {
  const floors = useMemo(() => {
    return Object.keys(floorRooms || {})
      .map(f => parseInt(f))
      .sort((a, b) => a - b);
  }, [floorRooms]);

  const currentRooms = useMemo(() => {
    return floorRooms[selectedFloor] || [];
  }, [floorRooms, selectedFloor]);

  // Si no hay pisos, mostrar estado vacío
  if (!floors.length) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay habitaciones disponibles
        </h3>
        <p className="text-gray-600">
          Las habitaciones aparecerán aquí una vez que ajustes los filtros
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instrucciones del sistema simplificado */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <h4 className="font-medium text-blue-900 mb-1">
              Sistema de limpieza con un click
            </h4>
            <p className="text-blue-700">
              <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full mr-2">
                🧹 Necesita limpieza
              </span>
              Haz click en las habitaciones naranjas para marcarlas como limpias automáticamente
            </p>
          </div>
        </div>
      </div>

      {/* Selector de piso */}
      <div className="flex flex-wrap gap-2">
        {floors.map(floor => {
          const floorRoomCount = floorRooms[floor]?.length || 0;
          const needsCleaningCount = floorRooms[floor]?.filter(room => 
            getRoomDisplayStatus(room) === 'needs_cleaning'
          ).length || 0;
          
          return (
            <button
              key={floor}
              onClick={() => onFloorChange(floor)}
              className={classNames(
                'relative px-4 py-2 rounded-lg font-medium transition-colors',
                selectedFloor === floor
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              )}
            >
              <div className="flex items-center space-x-2">
                <span>Piso {floor}</span>
                <span className="text-xs opacity-75">({floorRoomCount})</span>
              </div>
              
              {/* Indicador de habitaciones que necesitan limpieza */}
              {needsCleaningCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {needsCleaningCount}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid de habitaciones */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {currentRooms.map(room => (
          <RoomCard
            key={room.id}
            room={room}
            onRoomClick={onRoomClick}
            processingRoom={processingRoom}
          />
        ))}
      </div>

      {/* Estadísticas del piso actual */}
      {currentRooms.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-3">Resumen Piso {selectedFloor}</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">{currentRooms.length}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {currentRooms.filter(r => getRoomDisplayStatus(r) === 'available').length}
              </div>
              <div className="text-xs text-gray-600">Disponibles</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {currentRooms.filter(r => getRoomDisplayStatus(r) === 'occupied').length}
              </div>
              <div className="text-xs text-gray-600">Ocupadas</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">
                {currentRooms.filter(r => getRoomDisplayStatus(r) === 'needs_cleaning').length}
              </div>
              <div className="text-xs text-gray-600">Necesitan Limpieza</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

RoomCard.displayName = 'RoomCard';
RoomGrid.displayName = 'RoomGrid';

export default RoomGrid;