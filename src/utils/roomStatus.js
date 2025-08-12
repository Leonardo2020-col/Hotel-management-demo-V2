// src/utils/roomStatus.js - UTILIDADES PARA ESTADOS DE HABITACIONES

// =============================================
// CONSTANTES DE ESTADO
// =============================================

export const ROOM_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  NEEDS_CLEANING: 'needs_cleaning',
  CLEANING: 'cleaning',
  MAINTENANCE: 'maintenance',
  OUT_OF_ORDER: 'out_of_order'
};

export const CLEANING_STATUS = {
  CLEAN: 'clean',
  DIRTY: 'dirty',
  IN_PROGRESS: 'in_progress',
  INSPECTED: 'inspected'
};

// =============================================
// FUNCIONES DE UTILIDAD
// =============================================

/**
 * Determina el estado visual de una habitación basado en su estado y estado de limpieza
 */
export const getRoomDisplayStatus = (room) => {
  if (!room) return 'available';
  
  // Prioridad: estado de la habitación primero
  if (room.status === 'occupied') return 'occupied';
  if (room.status === 'maintenance') return 'maintenance';
  if (room.status === 'out_of_order') return 'out_of_order';
  
  // Luego verificar limpieza
  if (room.cleaning_status === 'dirty' || room.status === 'needs_cleaning') {
    return 'needs_cleaning';
  }
  if (room.cleaning_status === 'in_progress' || room.status === 'cleaning') {
    return 'cleaning';
  }
  
  // Por defecto disponible
  return 'available';
};

/**
 * Obtiene la configuración de colores y estilos para cada estado
 */
export const getStatusColors = (status) => {
  const configs = {
    available: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      hover: 'hover:bg-green-100 hover:border-green-300 hover:shadow-md',
      label: 'Disponible',
      priority: 1
    },
    occupied: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      hover: 'hover:bg-blue-100 hover:border-blue-300 hover:shadow-md',
      label: 'Ocupada',
      priority: 5
    },
    needs_cleaning: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      hover: 'hover:bg-orange-100 hover:border-orange-300 hover:shadow-lg cursor-pointer transform hover:scale-105',
      label: '🧹 Click para limpiar',
      clickable: true,
      priority: 4
    },
    cleaning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      hover: 'hover:bg-yellow-100 hover:border-yellow-300 hover:shadow-md',
      label: 'En limpieza',
      priority: 3
    },
    maintenance: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      hover: 'hover:bg-red-100 hover:border-red-300 hover:shadow-md',
      label: 'Mantenimiento',
      priority: 6
    },
    out_of_order: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      hover: 'hover:bg-gray-100 hover:border-gray-300',
      label: 'Fuera de servicio',
      priority: 7
    }
  };
  
  return configs[status] || configs.available;
};

/**
 * Obtiene el ícono correspondiente para cada estado
 */
export const getStatusIcon = (status) => {
  const icons = {
    available: 'CheckCircle',
    occupied: 'Users',
    needs_cleaning: 'AlertTriangle',
    cleaning: 'Clock',
    maintenance: 'Wrench',
    out_of_order: 'XCircle'
  };
  
  return icons[status] || 'CheckCircle';
};

/**
 * Calcula estadísticas de habitaciones
 */
export const calculateRoomStats = (rooms) => {
  if (!rooms || rooms.length === 0) {
    return {
      total: 0,
      available: 0,
      occupied: 0,
      needsCleaning: 0,
      cleaning: 0,
      maintenance: 0,
      occupancyRate: 0,
      revenue: {
        today: 0,
        thisMonth: 0,
        average: 0
      }
    };
  }

  const stats = {
    total: rooms.length,
    available: 0,
    occupied: 0,
    needsCleaning: 0,
    cleaning: 0,
    maintenance: 0
  };

  rooms.forEach(room => {
    const displayStatus = getRoomDisplayStatus(room);
    switch (displayStatus) {
      case 'available':
        stats.available++;
        break;
      case 'occupied':
        stats.occupied++;
        break;
      case 'needs_cleaning':
        stats.needsCleaning++;
        break;
      case 'cleaning':
        stats.cleaning++;
        break;
      case 'maintenance':
        stats.maintenance++;
        break;
    }
  });

  // Calcular tasa de ocupación
  stats.occupancyRate = stats.total > 0 
    ? Math.round((stats.occupied / stats.total) * 100) 
    : 0;

  // Revenue - esto se calculará con datos reales de reservas
  stats.revenue = {
    today: 0,
    thisMonth: 0,
    average: stats.total > 0 
      ? rooms.reduce((sum, room) => sum + (room.base_rate || 0), 0) / stats.total 
      : 0
  };

  return stats;
};

/**
 * Filtra habitaciones por estado
 */
export const filterRoomsByStatus = (rooms, status) => {
  if (!rooms) return [];
  if (status === 'all') return rooms;
  
  return rooms.filter(room => {
    const displayStatus = getRoomDisplayStatus(room);
    return displayStatus === status;
  });
};

/**
 * Agrupa habitaciones por piso
 */
export const groupRoomsByFloor = (rooms) => {
  if (!rooms) return {};
  
  return rooms.reduce((grouped, room) => {
    const floor = room.floor;
    if (!grouped[floor]) {
      grouped[floor] = [];
    }
    grouped[floor].push(room);
    return grouped;
  }, {});
};

/**
 * Obtiene habitaciones que necesitan atención (limpieza o mantenimiento)
 */
export const getRoomsNeedingAttention = (rooms) => {
  if (!rooms) return [];
  
  return rooms.filter(room => {
    const status = getRoomDisplayStatus(room);
    return status === 'needs_cleaning' || status === 'maintenance';
  });
};

/**
 * Verifica si una habitación puede ser limpiada con un click
 */
export const canCleanRoom = (room) => {
  if (!room) return false;
  const status = getRoomDisplayStatus(room);
  return status === 'needs_cleaning';
};

/**
 * Obtiene el siguiente estado después de limpiar una habitación
 */
export const getNextCleaningStatus = (room) => {
  if (!room) return null;
  
  const currentStatus = getRoomDisplayStatus(room);
  
  switch (currentStatus) {
    case 'needs_cleaning':
      return {
        status: 'available',
        cleaning_status: 'clean'
      };
    case 'cleaning':
      return {
        status: 'available',
        cleaning_status: 'clean'
      };
    default:
      return null;
  }
};

/**
 * Valida si se puede cambiar el estado de una habitación
 */
export const canChangeRoomStatus = (room, newStatus) => {
  if (!room || !newStatus) return false;
  
  const currentStatus = getRoomDisplayStatus(room);
  
  // Reglas de negocio para cambios de estado
  const allowedTransitions = {
    available: ['occupied', 'needs_cleaning', 'maintenance'],
    occupied: ['needs_cleaning'], // Solo se puede marcar como sucia al check-out
    needs_cleaning: ['available', 'cleaning'], // Se puede limpiar o marcar en proceso
    cleaning: ['available'], // Solo se puede completar la limpieza
    maintenance: ['available'] // Solo se puede completar el mantenimiento
  };
  
  return allowedTransitions[currentStatus]?.includes(newStatus) || false;
};

/**
 * Formatea la información de estado para mostrar al usuario
 */
export const formatRoomStatusInfo = (room) => {
  if (!room) return null;
  
  const status = getRoomDisplayStatus(room);
  const config = getStatusColors(status);
  
  return {
    status,
    label: config.label,
    canClick: config.clickable || false,
    priority: config.priority || 0,
    lastCleaned: room.last_cleaned,
    currentGuest: room.currentGuest,
    nextReservation: room.nextReservation
  };
};

/**
 * Genera un reporte de estado de habitaciones
 */
export const generateRoomStatusReport = (rooms) => {
  if (!rooms) return null;
  
  const stats = calculateRoomStats(rooms);
  const needingAttention = getRoomsNeedingAttention(rooms);
  const byFloor = groupRoomsByFloor(rooms);
  
  return {
    summary: stats,
    needingAttention: needingAttention.length,
    floorBreakdown: Object.keys(byFloor).map(floor => ({
      floor: parseInt(floor),
      count: byFloor[floor].length,
      stats: calculateRoomStats(byFloor[floor])
    })),
    recommendations: generateRecommendations(stats, needingAttention)
  };
};

/**
 * Genera recomendaciones basadas en el estado actual
 */
export const generateRecommendations = (stats, needingAttention) => {
  const recommendations = [];
  
  if (stats.needsCleaning > 0) {
    recommendations.push({
      type: 'cleaning',
      priority: 'high',
      message: `${stats.needsCleaning} habitación${stats.needsCleaning > 1 ? 'es' : ''} necesita${stats.needsCleaning === 1 ? '' : 'n'} limpieza`,
      action: 'Hacer click en las habitaciones naranjas para limpiarlas'
    });
  }
  
  if (stats.maintenance > 0) {
    recommendations.push({
      type: 'maintenance',
      priority: 'medium',
      message: `${stats.maintenance} habitación${stats.maintenance > 1 ? 'es' : ''} en mantenimiento`,
      action: 'Verificar el estado del mantenimiento'
    });
  }
  
  if (stats.occupancyRate < 30) {
    recommendations.push({
      type: 'marketing',
      priority: 'low',
      message: `Ocupación baja (${stats.occupancyRate}%)`,
      action: 'Considerar estrategias de marketing'
    });
  }
  
  if (stats.occupancyRate > 90) {
    recommendations.push({
      type: 'capacity',
      priority: 'medium',
      message: `Ocupación muy alta (${stats.occupancyRate}%)`,
      action: 'Prepararse para alta demanda'
    });
  }
  
  return recommendations;
};