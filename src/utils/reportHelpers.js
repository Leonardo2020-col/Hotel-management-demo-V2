// src/utils/reportHelpers.js
// CREAR ESTE ARCHIVO NUEVO

// =============================================
// FUNCIONES AUXILIARES PARA REPORTES
// =============================================

// Filtrar reservas por período de tiempo
export const filterReservationsByPeriod = (reservations, dateRange) => {
  if (!dateRange?.startDate || !dateRange?.endDate) {
    // Si no hay rango, usar último mes
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    
    return reservations.filter(reservation => {
      const checkOut = new Date(reservation.checked_out_at || reservation.check_out);
      return checkOut >= start && checkOut <= end;
    });
  }
  
  const start = new Date(dateRange.startDate);
  const end = new Date(dateRange.endDate);
  
  return reservations.filter(reservation => {
    const checkIn = new Date(reservation.check_in);
    const checkOut = new Date(reservation.check_out);
    
    // Incluir si la reserva se solapa con el período
    return checkIn <= end && checkOut >= start;
  });
};

// Calcular noches entre fechas
export const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 1;
  
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(1, diffDays);
};

// Determinar si una fecha está en un período específico
export const isInPeriod = (dateStr, dateRange) => {
  if (!dateRange?.startDate || !dateRange?.endDate) {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    const date = new Date(dateStr);
    return date >= start && date <= end;
  }
  
  const date = new Date(dateStr);
  const start = new Date(dateRange.startDate);
  const end = new Date(dateRange.endDate);
  
  return date >= start && date <= end;
};

// Calcular ingresos del período anterior para comparación
export const calculatePreviousPeriodRevenue = async (reservations, dateRange) => {
  if (!dateRange?.startDate || !dateRange?.endDate) {
    return 0;
  }
  
  const start = new Date(dateRange.startDate);
  const end = new Date(dateRange.endDate);
  const periodLength = end - start;
  
  const previousStart = new Date(start.getTime() - periodLength);
  const previousEnd = new Date(start.getTime());
  
  return reservations
    .filter(reservation => {
      if (reservation.status !== 'checked_out') return false;
      const checkOut = new Date(reservation.checked_out_at || reservation.check_out);
      return checkOut >= previousStart && checkOut < previousEnd;
    })
    .reduce((sum, r) => sum + (r.total_amount || 0), 0);
};

// Generar alertas basadas en datos
export const generateAlerts = ({ lowStockItems, maintenanceIssues, occupancyRate, revenueGrowth }) => {
  const alerts = [];
  
  if (lowStockItems > 0) {
    alerts.push({
      type: 'warning',
      message: `${lowStockItems} items con stock bajo requieren atención`,
      category: 'Suministros'
    });
  }
  
  if (maintenanceIssues > 0) {
    alerts.push({
      type: 'info',
      message: `${maintenanceIssues} habitaciones en mantenimiento`,
      category: 'Operaciones'
    });
  }
  
  if (occupancyRate >= 85) {
    alerts.push({
      type: 'success',
      message: `Ocupación excelente: ${occupancyRate.toFixed(1)}%`,
      category: 'Rendimiento'
    });
  }
  
  if (revenueGrowth > 0) {
    alerts.push({
      type: 'success',
      message: `Crecimiento de ingresos: +${revenueGrowth.toFixed(1)}%`,
      category: 'Financiero'
    });
  } else if (revenueGrowth < -5) {
    alerts.push({
      type: 'warning',
      message: `Disminución de ingresos: ${revenueGrowth.toFixed(1)}%`,
      category: 'Financiero'
    });
  }
  
  return alerts;
};

// Formatear período para mostrar
export const formatPeriod = (dateRange) => {
  if (!dateRange?.startDate || !dateRange?.endDate) {
    return 'Período no definido';
  }
  
  const start = new Date(dateRange.startDate).toLocaleDateString('es-PE');
  const end = new Date(dateRange.endDate).toLocaleDateString('es-PE');
  
  return `${start} - ${end}`;
};

// Analizar tipos de documento para demografía
export const analyzeDocumentTypes = (guests) => {
  if (!guests || guests.length === 0) {
    return [{ country: 'Sin datos', count: 0, percentage: 100 }];
  }

  // Analizar por tipo de documento para simular nacionalidades
  const analysis = [];
  
  const dniGuests = guests.filter(g => 
    g.document_type === 'DNI' || 
    (g.document_number && g.document_number.length === 8 && /^\d+$/.test(g.document_number))
  ).length;
  
  const passportGuests = guests.filter(g => 
    g.document_type === 'Pasaporte' ||
    (g.document_number && g.document_number.length > 8)
  ).length;
  
  const otherGuests = guests.length - dniGuests - passportGuests;
  
  if (dniGuests > 0) {
    analysis.push({
      country: 'Perú (DNI)',
      count: dniGuests,
      percentage: Math.round((dniGuests / guests.length) * 100)
    });
  }
  
  if (passportGuests > 0) {
    analysis.push({
      country: 'Extranjeros (Pasaporte)',
      count: passportGuests,
      percentage: Math.round((passportGuests / guests.length) * 100)
    });
  }
  
  if (otherGuests > 0) {
    analysis.push({
      country: 'Otros documentos',
      count: otherGuests,
      percentage: Math.round((otherGuests / guests.length) * 100)
    });
  }
  
  return analysis.length > 0 ? analysis : [{ country: 'Sin datos', count: 0, percentage: 100 }];
};

// Generar tendencia mensual
export const generateMonthlyTrend = (reservations) => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const trend = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const monthReservations = reservations.filter(r => {
      const checkIn = new Date(r.check_in);
      return checkIn >= monthStart && checkIn <= monthEnd;
    });
    
    const uniqueGuests = new Set(monthReservations.map(r => r.guest_id)).size;
    
    trend.push({
      month: months[date.getMonth()],
      guests: uniqueGuests
    });
  }
  
  return trend;
};

// Calcular estadísticas de tipos de habitación
export const calculateRoomTypeStats = (rooms, reservations) => {
  if (!rooms || rooms.length === 0) return [];

  // Agrupar habitaciones por tipo
  const roomsByType = rooms.reduce((acc, room) => {
    const type = room.room_type || 'Estándar';
    if (!acc[type]) {
      acc[type] = {
        type,
        total: 0,
        occupied: 0,
        revenue: 0,
        rates: []
      };
    }
    acc[type].total++;
    if (room.status === 'occupied') {
      acc[type].occupied++;
    }
    if (room.base_rate) {
      acc[type].rates.push(room.base_rate);
    }
    return acc;
  }, {});

  // Calcular ingresos por tipo
  const completedReservations = reservations.filter(r => r.status === 'checked_out');
  completedReservations.forEach(reservation => {
    const room = rooms.find(r => r.id === reservation.room_id);
    if (room) {
      const type = room.room_type || 'Estándar';
      if (roomsByType[type]) {
        roomsByType[type].revenue += reservation.total_amount || 0;
      }
    }
  });

  // Convertir a array con estadísticas calculadas
  return Object.values(roomsByType).map(typeData => ({
    type: typeData.type,
    total: typeData.total,
    occupied: typeData.occupied,
    rate: typeData.total > 0 ? Math.round((typeData.occupied / typeData.total) * 100) : 0,
    avgPrice: typeData.rates.length > 0 
      ? Math.round(typeData.rates.reduce((sum, rate) => sum + rate, 0) / typeData.rates.length)
      : 0,
    revenue: typeData.revenue
  }));
};

// Generar datos de ocupación diaria
export const generateDailyOccupancy = (rooms, reservations) => {
  const dailyData = [];
  const totalRooms = rooms?.length || 0;
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Contar habitaciones ocupadas en esa fecha
    const occupiedOnDate = reservations.filter(r => 
      r.status === 'checked_in' &&
      r.check_in <= dateStr &&
      r.check_out > dateStr
    ).length;
    
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedOnDate / totalRooms) * 100) : 0;
    
    dailyData.push({
      date: dateStr,
      occupied: occupiedOnDate,
      total: totalRooms,
      rate: occupancyRate
    });
  }
  
  return dailyData;
};

// Estadísticas de limpieza
export const calculateCleaningStats = (rooms) => {
  if (!rooms || rooms.length === 0) {
    return {
      cleanRooms: 0,
      dirtyRooms: 0,
      inProgress: 0
    };
  }

  return {
    cleanRooms: rooms.filter(r => r.cleaning_status === 'clean').length,
    dirtyRooms: rooms.filter(r => r.cleaning_status === 'dirty').length,
    inProgress: rooms.filter(r => r.cleaning_status === 'in_progress').length
  };
};

// Validar datos de entrada
export const validateReportData = (data, requiredFields) => {
  const errors = [];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`El campo ${field} es obligatorio`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Formatear tiempo transcurrido
export const formatTimeAgo = (minutes) => {
  if (minutes < 60) {
    return `${minutes}m`;
  } else if (minutes < 1440) {
    return `${Math.floor(minutes / 60)}h`;
  } else {
    return `${Math.floor(minutes / 1440)}d`;
  }
};