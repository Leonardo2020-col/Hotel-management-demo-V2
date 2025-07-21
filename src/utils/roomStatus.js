// ============================================
// src/utils/roomStatus.js - UTILIDADES PARA HABITACIONES
// ============================================

/**
 * Constantes para los 3 estados simplificados
 */
export const ROOM_STATUS = {
  AVAILABLE: 'available',      // Verde - Limpio y disponible
  OCCUPIED: 'occupied',        // Rojo - Ocupado con huésped  
  NEEDS_CLEANING: 'needs_cleaning'  // Amarillo - Necesita limpieza
};

/**
 * Determina el estado de display simplificado basado en status y cleaning_status
 * @param {Object} room - Objeto de habitación
 * @returns {string} - Estado simplificado ('available', 'occupied', 'needs_cleaning')
 */
export const getRoomDisplayStatus = (room) => {
  if (!room) return ROOM_STATUS.AVAILABLE;
  
  // Si está ocupada, siempre mostrar ocupada
  if (room.status === 'occupied') {
    return ROOM_STATUS.OCCUPIED;
  }
  
  // Si necesita limpieza (por cualquier motivo)
  if (room.cleaning_status === 'dirty' || 
      room.status === 'cleaning' || 
      room.status === 'maintenance') {
    return ROOM_STATUS.NEEDS_CLEANING;
  }
  
  // En cualquier otro caso, está disponible
  return ROOM_STATUS.AVAILABLE;
};

/**
 * Obtiene las clases de colores para un estado
 * @param {string} displayStatus - Estado simplificado
 * @returns {Object} - Objeto con clases de Tailwind
 */
export const getStatusColors = (displayStatus) => {
  switch (displayStatus) {
    case ROOM_STATUS.AVAILABLE:
      return {
        bg: 'bg-green-500',
        hover: 'hover:bg-green-600',
        text: 'text-white',
        light: 'bg-green-100 text-green-800',
        border: 'border-green-200',
        ring: 'ring-green-300'
      };
    case ROOM_STATUS.OCCUPIED:
      return {
        bg: 'bg-red-500',
        hover: 'hover:bg-red-600', 
        text: 'text-white',
        light: 'bg-red-100 text-red-800',
        border: 'border-red-200',
        ring: 'ring-red-300'
      };
    case ROOM_STATUS.NEEDS_CLEANING:
      return {
        bg: 'bg-yellow-500',
        hover: 'hover:bg-yellow-600',
        text: 'text-white', 
        light: 'bg-yellow-100 text-yellow-800',
        border: 'border-yellow-200',
        ring: 'ring-yellow-300'
      };
    default:
      return {
        bg: 'bg-gray-500',
        hover: 'hover:bg-gray-600',
        text: 'text-white',
        light: 'bg-gray-100 text-gray-800',
        border: 'border-gray-200',
        ring: 'ring-gray-300'
      };
  }
};

/**
 * Obtiene el texto descriptivo para un estado
 * @param {string} displayStatus - Estado simplificado
 * @returns {string} - Texto descriptivo
 */
export const getStatusText = (displayStatus) => {
  switch (displayStatus) {
    case ROOM_STATUS.AVAILABLE:
      return 'Disponible';
    case ROOM_STATUS.OCCUPIED:
      return 'Ocupada';
    case ROOM_STATUS.NEEDS_CLEANING:
      return 'Necesita Limpieza';
    default:
      return 'Desconocido';
  }
};

/**
 * Obtiene el icono para un estado
 * @param {string} displayStatus - Estado simplificado
 * @returns {string} - Emoji o icono
 */
export const getStatusIcon = (displayStatus) => {
  switch (displayStatus) {
    case ROOM_STATUS.AVAILABLE:
      return '✅';
    case ROOM_STATUS.OCCUPIED:
      return '👥';
    case ROOM_STATUS.NEEDS_CLEANING:
      return '🧹';
    default:
      return '❓';
  }
};

/**
 * Determina si una habitación es clickeable según el modo y estado
 * @param {Object} room - Objeto de habitación
 * @param {string} mode - Modo actual ('checkin', 'checkout', 'cleaning')
 * @returns {boolean} - Si la habitación es clickeable
 */
export const isRoomClickable = (room, mode = 'checkin') => {
  const displayStatus = getRoomDisplayStatus(room);
  
  switch (mode) {
    case 'checkin':
      return displayStatus === ROOM_STATUS.AVAILABLE || displayStatus === ROOM_STATUS.NEEDS_CLEANING;
    case 'checkout':
      return displayStatus === ROOM_STATUS.OCCUPIED;
    case 'cleaning':
      return displayStatus === ROOM_STATUS.NEEDS_CLEANING;
    default:
      return true;
  }
};

/**
 * Filtra habitaciones por estado de display
 * @param {Array} rooms - Array de habitaciones
 * @param {string} statusFilter - Estado a filtrar ('all', 'available', 'occupied', 'needs_cleaning')
 * @returns {Array} - Habitaciones filtradas
 */
export const filterRoomsByStatus = (rooms, statusFilter = 'all') => {
  if (!rooms || !Array.isArray(rooms)) return [];
  
  if (statusFilter === 'all') return rooms;
  
  return rooms.filter(room => getRoomDisplayStatus(room) === statusFilter);
};

/**
 * Obtiene estadísticas de habitaciones por estado
 * @param {Array} rooms - Array de habitaciones
 * @returns {Object} - Estadísticas por estado
 */
export const getRoomStatsByStatus = (rooms) => {
  if (!rooms || !Array.isArray(rooms)) {
    return {
      total: 0,
      available: 0,
      occupied: 0,
      needsCleaning: 0,
      occupancyRate: 0
    };
  }

  const stats = {
    total: rooms.length,
    available: 0,
    occupied: 0,
    needsCleaning: 0
  };

  rooms.forEach(room => {
    const status = getRoomDisplayStatus(room);
    switch (status) {
      case ROOM_STATUS.AVAILABLE:
        stats.available++;
        break;
      case ROOM_STATUS.OCCUPIED:
        stats.occupied++;
        break;
      case ROOM_STATUS.NEEDS_CLEANING:
        stats.needsCleaning++;
        break;
    }
  });

  // Calcular tasa de ocupación
  stats.occupancyRate = stats.total > 0 
    ? Math.round((stats.occupied / stats.total) * 100) 
    : 0;

  return stats;
};

/**
 * Agrupa habitaciones por piso
 * @param {Array} rooms - Array de habitaciones
 * @returns {Object} - Habitaciones agrupadas por piso
 */
export const groupRoomsByFloor = (rooms) => {
  if (!rooms || !Array.isArray(rooms)) return {};
  
  return rooms.reduce((acc, room) => {
    const floor = room.floor || Math.floor(parseInt(room.number) / 100) || 1;
    if (!acc[floor]) {
      acc[floor] = [];
    }
    acc[floor].push(room);
    return acc;
  }, {});
};

/**
 * Ordena habitaciones por número
 * @param {Array} rooms - Array de habitaciones
 * @returns {Array} - Habitaciones ordenadas
 */
export const sortRoomsByNumber = (rooms) => {
  if (!rooms || !Array.isArray(rooms)) return [];
  
  return [...rooms].sort((a, b) => {
    const numA = parseInt(a.number) || 0;
    const numB = parseInt(b.number) || 0;
    return numA - numB;
  });
};

/**
 * Obtiene el siguiente número de habitación disponible
 * @param {Array} rooms - Array de habitaciones existentes
 * @param {number} floor - Piso deseado
 * @returns {string} - Número de habitación sugerido
 */
export const getNextRoomNumber = (rooms, floor) => {
  if (!rooms || !Array.isArray(rooms) || !floor) return `${floor}01`;
  
  const floorRooms = rooms.filter(room => room.floor === floor);
  const floorNumbers = floorRooms
    .map(room => parseInt(room.number) || 0)
    .filter(num => Math.floor(num / 100) === floor)
    .sort((a, b) => a - b);
  
  if (floorNumbers.length === 0) {
    return `${floor}01`;
  }
  
  // Buscar el primer hueco o siguiente número
  for (let i = 1; i <= 99; i++) {
    const expectedNumber = floor * 100 + i;
    if (!floorNumbers.includes(expectedNumber)) {
      return expectedNumber.toString().padStart(3, '0');
    }
  }
  
  return `${floor}01`; // Fallback
};

/**
 * Valida si un número de habitación es válido
 * @param {string} roomNumber - Número de habitación
 * @param {Array} existingRooms - Habitaciones existentes
 * @returns {Object} - Resultado de validación
 */
export const validateRoomNumber = (roomNumber, existingRooms = []) => {
  const errors = [];
  
  if (!roomNumber || roomNumber.trim() === '') {
    errors.push('El número de habitación es obligatorio');
  }
  
  if (roomNumber && !/^[A-Za-z0-9\-]+$/.test(roomNumber)) {
    errors.push('El número solo puede contener letras, números y guiones');
  }
  
  if (existingRooms.some(room => room.number === roomNumber)) {
    errors.push('Ya existe una habitación con este número');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Formatea información de huésped para display
 * @param {Object} guest - Objeto de huésped
 * @returns {string} - Nombre formateado
 */
export const formatGuestName = (guest) => {
  if (!guest) return '';
  
  if (guest.full_name) return guest.full_name;
  if (guest.name) return guest.name;
  
  const firstName = guest.first_name || guest.firstName || '';
  const lastName = guest.last_name || guest.lastName || '';
  
  return `${firstName} ${lastName}`.trim() || 'Huésped';
};

/**
 * Calcula el precio total por noches
 * @param {number} rate - Tarifa por noche
 * @param {number} nights - Número de noches
 * @param {Array} snacks - Array de snacks opcionales
 * @returns {number} - Total calculado
 */
export const calculateTotalPrice = (rate, nights, snacks = []) => {
  const roomTotal = (rate || 0) * (nights || 1);
  const snacksTotal = snacks.reduce((total, snack) => {
    return total + ((snack.price || 0) * (snack.quantity || 1));
  }, 0);
  
  return roomTotal + snacksTotal;
};

/**
 * Obtiene el color del piso para UI
 * @param {number} floor - Número de piso
 * @returns {string} - Clase de color
 */
export const getFloorColor = (floor) => {
  const colors = [
    'bg-blue-500',    // Piso 1
    'bg-green-500',   // Piso 2  
    'bg-purple-500',  // Piso 3
    'bg-orange-500',  // Piso 4
    'bg-pink-500',    // Piso 5
    'bg-indigo-500',  // Piso 6
    'bg-red-500',     // Piso 7
    'bg-yellow-500'   // Piso 8+
  ];
  
  return colors[(floor - 1) % colors.length] || 'bg-gray-500';
};

/**
 * Hook personalizado para manejo de habitaciones (para usar en componentes)
 */
export const useRoomUtils = () => {
  const getRoomsNeedingCleaning = (rooms) => {
    return filterRoomsByStatus(rooms, ROOM_STATUS.NEEDS_CLEANING);
  };
  
  const getAvailableRooms = (rooms) => {
    return filterRoomsByStatus(rooms, ROOM_STATUS.AVAILABLE);
  };
  
  const getOccupiedRooms = (rooms) => {
    return filterRoomsByStatus(rooms, ROOM_STATUS.OCCUPIED);
  };
  
  const getRoomsByFloor = (rooms, floor) => {
    return rooms.filter(room => room.floor === floor);
  };
  
  return {
    getRoomsNeedingCleaning,
    getAvailableRooms,
    getOccupiedRooms,
    getRoomsByFloor,
    getRoomDisplayStatus,
    getStatusColors,
    getStatusText,
    getStatusIcon,
    isRoomClickable,
    getRoomStatsByStatus,
    groupRoomsByFloor,
    sortRoomsByNumber
  };
};

/**
 * Constantes para mensajes de toast
 */
export const TOAST_MESSAGES = {
  ROOM_CLEANED: (roomNumber) => `✨ Habitación ${roomNumber} limpiada y disponible`,
  ROOM_OCCUPIED: 'Esta habitación ya está ocupada',
  ROOM_NOT_DIRTY: 'Esta habitación no necesita limpieza',
  ROOM_NOT_FOUND: 'Habitación no encontrada',
  CLEANING_ERROR: 'Error al limpiar la habitación',
  MULTIPLE_ROOMS_CLEANED: (count) => `🎉 ${count} habitación${count > 1 ? 'es' : ''} limpiada${count > 1 ? 's' : ''}`,
  NO_ROOMS_TO_CLEAN: 'No hay habitaciones que necesiten limpieza',
  ALL_ROOMS_CLEAN: '¡Excelente! Todas las habitaciones están limpias'
};

/**
 * Configuración por defecto para habitaciones
 */
export const DEFAULT_ROOM_CONFIG = {
  capacity: 2,
  size: 25,
  rate: 100,
  features: ['WiFi Gratis', 'TV Smart', 'Aire Acondicionado'],
  beds: [{ type: 'Doble', count: 1 }],
  status: 'available',
  cleaning_status: 'clean'
};

// Exportación por defecto con todas las utilidades
export default {
  ROOM_STATUS,
  getRoomDisplayStatus,
  getStatusColors,
  getStatusText,
  getStatusIcon,
  isRoomClickable,
  filterRoomsByStatus,
  getRoomStatsByStatus,
  groupRoomsByFloor,
  sortRoomsByNumber,
  getNextRoomNumber,
  validateRoomNumber,
  formatGuestName,
  calculateTotalPrice,
  getFloorColor,
  useRoomUtils,
  TOAST_MESSAGES,
  DEFAULT_ROOM_CONFIG
};