/**
 * Formatea una cantidad como moneda peruana (Soles)
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda (por defecto PEN para soles)
 * @returns {string} - Cantidad formateada como S/ X,XXX.XX
 */
// src/utils/formatters.js - FUNCIONES DE FORMATEO
// Formatear moneda peruana
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'S/ 0.00';
  
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(amount);
};

// Formatear números con separadores de miles
export const formatNumber = (number) => {
  if (!number && number !== 0) return '0';
  
  return new Intl.NumberFormat('es-PE').format(number);
};

// Formatear porcentajes
export const formatPercentage = (percentage, decimals = 1) => {
  if (!percentage && percentage !== 0) return '0%';
  
  return `${parseFloat(percentage).toFixed(decimals)}%`;
};

// Formatear fechas en español
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Lima',
    ...options
  };
  
  return new Date(date).toLocaleDateString('es-PE', defaultOptions);
};

// Formatear fecha corta
export const formatShortDate = (date) => {
  if (!date) return '';
  
  return new Date(date).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Lima'
  });
};

// Formatear hora
export const formatTime = (date) => {
  if (!date) return '';
  
  return new Date(date).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Lima'
  });
};

// Formatear fecha y hora completa
export const formatDateTime = (date) => {
  if (!date) return '';
  
  return new Date(date).toLocaleString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Lima'
  });
};

// Formatear duración en días
export const formatDuration = (days) => {
  if (!days && days !== 0) return '0 días';
  
  if (days === 1) return '1 día';
  return `${days} días`;
};

// Formatear estado de habitación
export const formatRoomStatus = (status) => {
  const statusMap = {
    'available': 'Disponible',
    'occupied': 'Ocupada',
    'cleaning': 'Limpieza',
    'maintenance': 'Mantenimiento',
    'out_of_order': 'Fuera de Servicio'
  };
  
  return statusMap[status] || status;
};

// Formatear estado de limpieza
export const formatCleaningStatus = (status) => {
  const statusMap = {
    'clean': 'Limpia',
    'dirty': 'Sucia',
    'in_progress': 'En Progreso',
    'inspected': 'Inspeccionada'
  };
  
  return statusMap[status] || status;
};

// Formatear estado de reserva
export const formatReservationStatus = (status) => {
  const statusMap = {
    'pending': 'Pendiente',
    'confirmed': 'Confirmada',
    'checked_in': 'Check-in',
    'checked_out': 'Check-out',
    'cancelled': 'Cancelada',
    'no_show': 'No Show'
  };
  
  return statusMap[status] || status;
};

// Formatear método de pago
export const formatPaymentMethod = (method) => {
  const methodMap = {
    'cash': 'Efectivo',
    'card': 'Tarjeta',
    'tarjeta': 'Tarjeta',
    'efectivo': 'Efectivo',
    'transfer': 'Transferencia',
    'transferencia': 'Transferencia',
    'digital': 'Digital',
    'yape': 'Yape',
    'plin': 'Plin'
  };
  
  return methodMap[method] || method;
};

// Formatear estado de pago
export const formatPaymentStatus = (status) => {
  const statusMap = {
    'pending': 'Pendiente',
    'partial': 'Parcial',
    'paid': 'Pagado',
    'refunded': 'Reembolsado'
  };
  
  return statusMap[status] || status;
};

// Formatear nivel VIP (si se vuelve a usar)
export const formatVipLevel = (level) => {
  const levelMap = {
    'none': 'Regular',
    'silver': 'Plata',
    'gold': 'Oro',
    'platinum': 'Platino'
  };
  
  return levelMap[level] || level;
};

// Formatear prioridad
export const formatPriority = (priority) => {
  const priorityMap = {
    'low': 'Baja',
    'medium': 'Media',
    'high': 'Alta',
    'urgent': 'Urgente'
  };
  
  return priorityMap[priority] || priority;
};

// Calcular y formatear diferencia de fechas
export const formatDateDifference = (date1, date2) => {
  if (!date1 || !date2) return '';
  
  const diffTime = Math.abs(new Date(date2) - new Date(date1));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return formatDuration(diffDays);
};

// Formatear capacidad de habitación
export const formatRoomCapacity = (capacity) => {
  if (!capacity) return '';
  
  if (capacity === 1) return '1 persona';
  return `${capacity} personas`;
};

// Formatear área de habitación
export const formatRoomSize = (size) => {
  if (!size) return '';
  
  return `${size} m²`;
};

// Formatear texto para URL amigable
export const formatSlug = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Formatear iniciiales de nombre
export const formatInitials = (name) => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

// Truncar texto con elipsis
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
};

// Formatear número de teléfono peruano
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remover caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Si es número peruano (9 dígitos)
  if (cleaned.length === 9) {
    return `+51 ${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }
  
  // Si ya incluye código de país
  if (cleaned.length === 11 && cleaned.startsWith('51')) {
    const number = cleaned.substring(2);
    return `+51 ${number.substring(0, 3)}-${number.substring(3, 6)}-${number.substring(6)}`;
  }
  
  return phone; // Devolver original si no coincide con formato esperado
};

// Formatear calificación en estrellas
export const formatStars = (rating, maxStars = 5) => {
  if (!rating && rating !== 0) return '';
  
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) + 
         (hasHalfStar ? '☆' : '') + 
         '☆'.repeat(emptyStars);
};

// Formatear tiempo relativo (hace cuánto)
export const formatTimeAgo = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  } else if (diffMinutes > 0) {
    return `hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
  } else {
    return 'hace un momento';
  }
};

// Validar email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validar teléfono peruano
export const isValidPeruvianPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 9 && cleaned.startsWith('9');
};

// Validar DNI peruano
export const isValidDNI = (dni) => {
  const cleaned = dni.replace(/\D/g, '');
  return cleaned.length === 8;
};

// Formatear DNI
export const formatDNI = (dni) => {
  if (!dni) return '';
  
  const cleaned = dni.replace(/\D/g, '');
  if (cleaned.length === 8) {
    return `${cleaned.substring(0, 2)}.${cleaned.substring(2, 5)}.${cleaned.substring(5)}`;
  }
  
  return dni;
};

// Formatear rango de fechas
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  
  const start = formatShortDate(startDate);
  const end = formatShortDate(endDate);
  
  if (start === end) {
    return start;
  }
  
  return `${start} - ${end}`;
};

// Calcular días entre fechas
export const calculateDaysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Formatear estado de stock
export const formatStockStatus = (currentStock, minStock) => {
  if (!currentStock && currentStock !== 0) return 'Sin datos';
  if (!minStock) return 'Normal';
  
  const ratio = currentStock / minStock;
  
  if (currentStock === 0) return 'Agotado';
  if (ratio <= 0.25) return 'Crítico';
  if (ratio <= 0.5) return 'Bajo';
  if (ratio <= 1) return 'Normal';
  return 'Suficiente';
};

// Obtener color para estado de stock
export const getStockStatusColor = (currentStock, minStock) => {
  const status = formatStockStatus(currentStock, minStock);
  
  const colorMap = {
    'Agotado': 'red',
    'Crítico': 'red',
    'Bajo': 'yellow',
    'Normal': 'green',
    'Suficiente': 'blue',
    'Sin datos': 'gray'
  };
  
  return colorMap[status] || 'gray';
};

// Formatear velocidad de consumo
export const formatConsumptionRate = (consumption, period = 'month') => {
  if (!consumption && consumption !== 0) return 'N/A';
  
  const periodMap = {
    'day': 'día',
    'week': 'semana',
    'month': 'mes',
    'year': 'año'
  };
  
  return `${formatNumber(consumption)} por ${periodMap[period] || period}`;
};