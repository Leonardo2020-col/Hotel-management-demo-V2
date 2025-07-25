/**
 * src/utils/formatters.js
 * Funciones de formateo para el sistema de gestión hotelera
 * Incluye formateo de monedas, fechas, números y estados
 */

/**
 * Formatea una cantidad como moneda peruana (Soles)
 * @param {number} amount - Cantidad a formatear
 * @returns {string} - Cantidad formateada como S/ X,XXX.XX
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'S/ 0.00';
  
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Formatear números con separadores de miles
 * @param {number} number - Número a formatear
 * @returns {string} - Número formateado
 */
export const formatNumber = (number) => {
  if (!number && number !== 0) return '0';
  return new Intl.NumberFormat('es-PE').format(number);
};

/**
 * Formatear porcentajes
 * @param {number} percentage - Porcentaje a formatear
 * @param {number} decimals - Número de decimales
 * @returns {string} - Porcentaje formateado
 */
export const formatPercentage = (percentage, decimals = 1) => {
  if (!percentage && percentage !== 0) return '0%';
  return `${parseFloat(percentage).toFixed(decimals)}%`;
};

/**
 * Formatear fechas en español
 * @param {Date|string} date - Fecha a formatear
 * @param {object} options - Opciones de formateo
 * @returns {string} - Fecha formateada
 */
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

/**
 * Formatear fecha corta (DD/MM/YYYY)
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha formateada corta
 */
export const formatShortDate = (date) => {
  if (!date) return '';
  
  return new Date(date).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Lima'
  });
};

/**
 * Formatear hora (HH:MM)
 * @param {Date|string} date - Fecha/hora a formatear
 * @returns {string} - Hora formateada
 */
export const formatTime = (date) => {
  if (!date) return '';
  
  return new Date(date).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Lima'
  });
};

/**
 * Formatear fecha y hora completa
 * @param {Date|string} date - Fecha/hora a formatear
 * @returns {string} - Fecha y hora formateada
 */
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

/**
 * Formatear tiempo relativo (hace cuánto)
 * @param {Date|string} date - Fecha a comparar
 * @returns {string} - Tiempo relativo formateado
 */
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

/**
 * Formatear tiempo relativo (alias para compatibilidad)
 * Función que estaba faltando y causaba el error de build
 * @param {Date|string} date - Fecha a comparar
 * @returns {string} - Tiempo relativo formateado
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now - targetDate) / 1000);
  
  // Si es en el futuro
  if (diffInSeconds < 0) {
    const absDiff = Math.abs(diffInSeconds);
    if (absDiff < 60) return 'En unos segundos';
    if (absDiff < 3600) return `En ${Math.floor(absDiff / 60)} minutos`;
    if (absDiff < 86400) return `En ${Math.floor(absDiff / 3600)} horas`;
    return `En ${Math.floor(absDiff / 86400)} días`;
  }
  
  // Si es en el pasado
  if (diffInSeconds < 60) return 'Hace unos segundos';
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} minutos`;
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
  if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
  
  // Para fechas más antiguas, mostrar fecha formateada
  return targetDate.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Formatear duración en días
 * @param {number} days - Número de días
 * @returns {string} - Duración formateada
 */
export const formatDuration = (days) => {
  if (!days && days !== 0) return '0 días';
  if (days === 1) return '1 día';
  return `${days} días`;
};

/**
 * Formatear estado de habitación
 * @param {string} status - Estado de la habitación
 * @returns {string} - Estado formateado en español
 */
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

/**
 * Formatear estado de limpieza
 * @param {string} status - Estado de limpieza
 * @returns {string} - Estado formateado en español
 */
export const formatCleaningStatus = (status) => {
  const statusMap = {
    'clean': 'Limpia',
    'dirty': 'Sucia',
    'in_progress': 'En Progreso',
    'inspected': 'Inspeccionada'
  };
  
  return statusMap[status] || status;
};

/**
 * Formatear estado de reserva
 * @param {string} status - Estado de la reserva
 * @returns {string} - Estado formateado en español
 */
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

/**
 * Formatear método de pago
 * @param {string} method - Método de pago
 * @returns {string} - Método formateado en español
 */
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

/**
 * Formatear estado de pago
 * @param {string} status - Estado del pago
 * @returns {string} - Estado formateado en español
 */
export const formatPaymentStatus = (status) => {
  const statusMap = {
    'pending': 'Pendiente',
    'partial': 'Parcial',
    'paid': 'Pagado',
    'refunded': 'Reembolsado'
  };
  
  return statusMap[status] || status;
};

/**
 * Formatear nivel VIP (si se vuelve a usar)
 * @param {string} level - Nivel VIP
 * @returns {string} - Nivel formateado en español
 */
export const formatVipLevel = (level) => {
  const levelMap = {
    'none': 'Regular',
    'silver': 'Plata',
    'gold': 'Oro',
    'platinum': 'Platino'
  };
  
  return levelMap[level] || level;
};

/**
 * Formatear prioridad
 * @param {string} priority - Nivel de prioridad
 * @returns {string} - Prioridad formateada en español
 */
export const formatPriority = (priority) => {
  const priorityMap = {
    'low': 'Baja',
    'medium': 'Media',
    'high': 'Alta',
    'urgent': 'Urgente'
  };
  
  return priorityMap[priority] || priority;
};

/**
 * Calcular y formatear diferencia de fechas
 * @param {Date|string} date1 - Primera fecha
 * @param {Date|string} date2 - Segunda fecha
 * @returns {string} - Diferencia formateada
 */
export const formatDateDifference = (date1, date2) => {
  if (!date1 || !date2) return '';
  
  const diffTime = Math.abs(new Date(date2) - new Date(date1));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return formatDuration(diffDays);
};

/**
 * Formatear capacidad de habitación
 * @param {number} capacity - Capacidad de la habitación
 * @returns {string} - Capacidad formateada
 */
export const formatRoomCapacity = (capacity) => {
  if (!capacity) return '';
  if (capacity === 1) return '1 persona';
  return `${capacity} personas`;
};

/**
 * Formatear área de habitación
 * @param {number} size - Tamaño en metros cuadrados
 * @returns {string} - Tamaño formateado
 */
export const formatRoomSize = (size) => {
  if (!size) return '';
  return `${size} m²`;
};

/**
 * Formatear texto para URL amigable
 * @param {string} text - Texto a convertir
 * @returns {string} - Slug formateado
 */
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

/**
 * Formatear iniciales de nombre
 * @param {string} name - Nombre completo
 * @returns {string} - Iniciales (máximo 2)
 */
export const formatInitials = (name) => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

/**
 * Truncar texto con elipsis
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} - Texto truncado
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Formatear número de teléfono peruano
 * @param {string} phone - Número de teléfono
 * @returns {string} - Teléfono formateado
 */
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

/**
 * Formatear calificación en estrellas
 * @param {number} rating - Calificación numérica
 * @param {number} maxStars - Número máximo de estrellas
 * @returns {string} - Estrellas formateadas
 */
export const formatStars = (rating, maxStars = 5) => {
  if (!rating && rating !== 0) return '';
  
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) + 
         (hasHalfStar ? '☆' : '') + 
         '☆'.repeat(emptyStars);
};

/**
 * Validar email
 * @param {string} email - Email a validar
 * @returns {boolean} - True si es válido
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validar teléfono peruano
 * @param {string} phone - Teléfono a validar
 * @returns {boolean} - True si es válido
 */
export const isValidPeruvianPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 9 && cleaned.startsWith('9');
};

/**
 * Validar DNI peruano
 * @param {string} dni - DNI a validar
 * @returns {boolean} - True si es válido
 */
export const isValidDNI = (dni) => {
  const cleaned = dni.replace(/\D/g, '');
  return cleaned.length === 8;
};

/**
 * Formatear DNI peruano
 * @param {string} dni - DNI a formatear
 * @returns {string} - DNI formateado
 */
export const formatDNI = (dni) => {
  if (!dni) return '';
  
  const cleaned = dni.replace(/\D/g, '');
  if (cleaned.length === 8) {
    return `${cleaned.substring(0, 2)}.${cleaned.substring(2, 5)}.${cleaned.substring(5)}`;
  }
  
  return dni;
};

/**
 * Formatear rango de fechas
 * @param {Date|string} startDate - Fecha de inicio
 * @param {Date|string} endDate - Fecha de fin
 * @returns {string} - Rango formateado
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  
  const start = formatShortDate(startDate);
  const end = formatShortDate(endDate);
  
  if (start === end) {
    return start;
  }
  
  return `${start} - ${end}`;
};

/**
 * Calcular días entre fechas
 * @param {Date|string} startDate - Fecha de inicio
 * @param {Date|string} endDate - Fecha de fin
 * @returns {number} - Número de días
 */
export const calculateDaysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Formatear estado de stock
 * @param {number} currentStock - Stock actual
 * @param {number} minStock - Stock mínimo
 * @returns {string} - Estado formateado
 */
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

/**
 * Obtener color para estado de stock
 * @param {number} currentStock - Stock actual
 * @param {number} minStock - Stock mínimo
 * @returns {string} - Color del estado
 */
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

/**
 * Formatear velocidad de consumo
 * @param {number} consumption - Cantidad consumida
 * @param {string} period - Período de tiempo
 * @returns {string} - Consumo formateado
 */
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

/**
 * Export default para compatibilidad
 * Incluye todas las funciones disponibles
 */
export default {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
  formatShortDate,
  formatTime,
  formatDateTime,
  formatTimeAgo,
  getRelativeTime, // ← FUNCIÓN CLAVE QUE SOLUCIONA EL ERROR DE BUILD
  formatDuration,
  formatRoomStatus,
  formatCleaningStatus,
  formatReservationStatus,
  formatPaymentMethod,
  formatPaymentStatus,
  formatVipLevel,
  formatPriority,
  formatDateDifference,
  formatRoomCapacity,
  formatRoomSize,
  formatSlug,
  formatInitials,
  truncateText,
  formatPhoneNumber,
  formatStars,
  isValidEmail,
  isValidPeruvianPhone,
  isValidDNI,
  formatDNI,
  formatDateRange,
  calculateDaysBetween,
  formatStockStatus,
  getStockStatusColor,
  formatConsumptionRate
};