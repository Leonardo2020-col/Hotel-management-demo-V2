// src/components/rooms/RoomGrid.jsx - OPTIMIZADO
import React, { memo, useMemo } from 'react';
import { getRoomDisplayStatus, getStatusColors } from '../../utils/roomStatus';

const RoomCard = memo(({ room, onRoomClick, processingRoom }) => {
  const displayStatus = getRoomDisplayStatus(room);
  const colors = getStatusColors(displayStatus);
  const isProcessing = processingRoom === room.number;

  return (
    <div
      onClick={() => !isProcessing && onRoomClick(room)}
      className={`
        relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 
        ${colors.border} ${colors.bg} ${colors.text}
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : colors.hover}
      `}
    >
      {/* Contenido del card */}
      <div className="text-center">
        <h3 className="text-lg font-bold">{room.number}</h3>
        <p className="text-sm opacity-90">{displayStatus}</p>
      </div>
      
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
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

  return (
    <div className="space-y-4">
      {/* Floor Selector */}
      <div className="flex flex-wrap gap-2">
        {floors.map(floor => (
          <button
            key={floor}
            onClick={() => onFloorChange(floor)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedFloor === floor
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Piso {floor}
          </button>
        ))}
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {currentRooms.map(room => (
          <RoomCard
            key={room.id}
            room={room}
            onRoomClick={onRoomClick}
            processingRoom={processingRoom}
          />
        ))}
      </div>
    </div>
  );
});

export default RoomGrid;