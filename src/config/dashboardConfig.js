// src/config/dashboardConfig.js - CONFIGURACIÓN CENTRALIZADA DEL DASHBOARD
export const DASHBOARD_CONFIG = {
  // ✅ Configuración de actualización automática
  autoRefresh: {
    interval: 5 * 60 * 1000, // 5 minutos
    enabled: true,
    onlyWhenVisible: true,
    maxRetries: 3,
    retryDelay: 30000
  },

  // ✅ Configuración de gráficos
  charts: {
    colors: {
      primary: '#3b82f6',
      secondary: '#ef4444',
      success: '#22c55e', 
      warning: '#f59e0b',
      info: '#8b5cf6',
      occupied: '#ef4444',
      available: '#22c55e',
      maintenance: '#8b5cf6',
      cleaning: '#f59e0b'
    },
    animation: {
      duration: 750,
      easing: 'ease-in-out'
    },
    responsive: {
      breakpoints: {
        mobile: 480,
        tablet: 768,
        desktop: 1024
      }
    }
  },

  // ✅ Configuración de alertas
  alerts: {
    maxVisible: 3,
    autoGenerate: true,
    priorities: ['high', 'medium', 'low'],
    types: ['error', 'warning', 'info', 'success'],
    thresholds: {
      lowStock: 5,
      highOccupancy: 90,
      criticalOccupancy: 95,
      pendingReservations: 5,
      maintenanceRooms: 1
    }
  },

  // ✅ Configuración de métricas
  metrics: {
    currency: 'PEN',
    locale: 'es-PE',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    thresholds: {
      occupancy: {
        excellent: 90,
        good: 75,
        warning: 50,
        critical: 25
      },
      revenue: {
        excellent: 3000,
        good: 2000,
        warning: 1000,
        critical: 500
      },
      adr: {
        excellent: 200,
        good: 150,
        warning: 100,
        critical: 75
      }
    }
  },

  // ✅ Configuración de actividad reciente
  activity: {
    maxItems: 10,
    autoRefresh: true,
    groupByType: false,
    showTimestamp: true,
    types: {
      checkin: {
        icon: 'ClipboardCheck',
        color: 'text-green-600',
        label: 'Check-in'
      },
      checkout: {
        icon: 'CheckCircle', 
        color: 'text-blue-600',
        label: 'Check-out'
      },
      reservation: {
        icon: 'Calendar',
        color: 'text-purple-600',
        label: 'Reserva'
      },
      payment: {
        icon: 'DollarSign',
        color: 'text-green-600', 
        label: 'Pago'
      },
      maintenance: {
        icon: 'AlertTriangle',
        color: 'text-orange-600',
        label: 'Mantenimiento'
      }
    }
  },

  // ✅ Configuración de estadísticas principales
  stats: {
    cards: [
      {
        key: 'occupancy',
        title: 'Ocupación',
        icon: 'Bed',
        iconColor: 'text-blue-600',
        path: '/rooms',
        format: 'ratio', // occupied/total
        showTrend: true
      },
      {
        key: 'movement',
        title: 'Movimiento Hoy',
        icon: 'ClipboardCheck',
        iconColor: 'text-green-600',
        path: '/checkin',
        format: 'number',
        showTrend: false
      },
      {
        key: 'revenue',
        title: 'Ingresos Hoy',
        icon: 'SolSign',
        iconColor: 'text-green-600',
        path: '/reports',
        format: 'currency',
        showTrend: true
      },
      {
        key: 'reservations',
        title: 'Reservas Pendientes',
        icon: 'Calendar',
        iconColor: 'text-orange-600',
        path: '/reservations',
        format: 'number',
        showAlert: true
      }
    ]
  },

  // ✅ Configuración de acciones rápidas
  quickActions: {
    showForRoles: ['administrador', 'recepcion'],
    maxActions: 5,
    actions: [
      {
        key: 'checkin',
        title: 'Nuevo Check-in',
        description: 'Registrar huésped',
        icon: 'ClipboardCheck',
        iconColor: 'text-green-600',
        path: '/checkin',
        roles: ['administrador', 'recepcion']
      },
      {
        key: 'reservations',
        title: 'Gestionar Reservas',
        description: 'Ver pendientes',
        icon: 'Calendar',
        iconColor: 'text-blue-600',
        path: '/reservations',
        roles: ['administrador', 'recepcion']
      },
      {
        key: 'rooms',
        title: 'Estado Habitaciones',
        description: 'Ver disponibilidad',
        icon: 'Bed',
        iconColor: 'text-orange-600',
        path: '/rooms',
        roles: ['administrador', 'recepcion']
      },
      {
        key: 'guests',
        title: 'Huéspedes',
        description: 'Base de datos',
        icon: 'Users',
        iconColor: 'text-purple-600',
        path: '/guests',
        roles: ['administrador', 'recepcion']
      },
      {
        key: 'admin',
        title: 'Panel Admin',
        description: 'Configuración',
        icon: 'BarChart3',
        iconColor: 'text-indigo-600',
        path: '/admin',
        roles: ['administrador']
      }
    ]
  },

  // ✅ Configuración de notificaciones
  notifications: {
    enabled: true,
    sound: false,
    desktop: true,
    email: false,
    types: {
      alert: true,
      achievement: true,
      reminder: true,
      system: false
    }
  },

  // ✅ Configuración de exportación
  export: {
    formats: ['json', 'csv', 'pdf'],
    defaultFormat: 'json',
    includeCharts: true,
    includeAlerts: false,
    filename: (date) => `dashboard-${date.toISOString().split('T')[0]}`
  },

  // ✅ Configuración de filtros de tiempo
  timeFilters: {
    default: 'today',
    options: [
      { key: 'today', label: 'Hoy', days: 1 },
      { key: 'week', label: 'Esta semana', days: 7 },
      { key: 'month', label: 'Este mes', days: 30 },
      { key: 'quarter', label: 'Trimestre', days: 90 }
    ]
  },

  // ✅ Configuración de performance
  performance: {
    lazyLoad: true,
    debounceTime: 300,
    throttleTime: 1000,
    maxCacheAge: 5 * 60 * 1000, // 5 minutos
    enableVirtualization: false
  },

  // ✅ Configuración de accesibilidad
  accessibility: {
    highContrast: false,
    reduceMotion: false,
    screenReader: true,
    keyboardNavigation: true,
    focusVisible: true
  },

  // ✅ Configuración de layout
  layout: {
    sidebar: {
      width: 256,
      collapsible: true,
      defaultCollapsed: false
    },
    header: {
      height: 64,
      sticky: true,
      showBreadcrumbs: true
    },
    grid: {
      gap: 24,
      columns: {
        mobile: 1,
        tablet: 2,
        desktop: 4
      }
    }
  },

  // ✅ Configuración de temas
  themes: {
    default: 'light',
    available: ['light', 'dark', 'auto'],
    colors: {
      light: {
        background: '#ffffff',
        surface: '#f9fafb',
        primary: '#3b82f6',
        text: '#111827'
      },
      dark: {
        background: '#111827',
        surface: '#1f2937',
        primary: '#60a5fa',
        text: '#f9fafb'
      }
    }
  }
}

// ✅ Funciones de utilidad para la configuración
export const getDashboardConfig = (section) => {
  return section ? DASHBOARD_CONFIG[section] : DASHBOARD_CONFIG
}

export const getMetricThreshold = (metric, level) => {
  const thresholds = DASHBOARD_CONFIG.metrics.thresholds[metric]
  return thresholds ? thresholds[level] : null
}

export const getAlertThreshold = (type) => {
  return DASHBOARD_CONFIG.alerts.thresholds[type]
}

export const getQuickActionsForRole = (userRole) => {
  return DASHBOARD_CONFIG.quickActions.actions.filter(action => 
    action.roles.includes(userRole)
  )
}

export const getChartColor = (type) => {
  return DASHBOARD_CONFIG.charts.colors[type] || DASHBOARD_CONFIG.charts.colors.primary
}

export const shouldShowAlert = (type, value) => {
  const threshold = getAlertThreshold(type)
  if (!threshold) return false
  
  switch (type) {
    case 'lowStock':
      return value >= threshold
    case 'highOccupancy':
      return value >= threshold
    case 'pendingReservations':
      return value >= threshold
    case 'maintenanceRooms':
      return value >= threshold
    default:
      return false
  }
}

// ✅ Configuración predeterminada del usuario
export const DEFAULT_USER_PREFERENCES = {
  autoRefresh: true,
  refreshInterval: 5 * 60 * 1000,
  notifications: true,
  theme: 'light',
  language: 'es',
  currency: 'PEN',
  dateFormat: 'dd/MM/yyyy',
  timeFormat: '24h',
  showWelcomeMessage: true,
  dashboardLayout: 'default',
  chartAnimations: true,
  soundAlerts: false
}

// ✅ Validación de configuración
export const validateDashboardConfig = (config) => {
  const errors = []
  
  if (!config.autoRefresh?.interval || config.autoRefresh.interval < 30000) {
    errors.push('Intervalo de actualización debe ser al menos 30 segundos')
  }
  
  if (!config.charts?.colors?.primary) {
    errors.push('Color primario de gráficos es requerido')
  }
  
  if (!config.metrics?.currency) {
    errors.push('Moneda es requerida')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// ✅ Configuración por defecto si falla la carga
export const FALLBACK_CONFIG = {
  autoRefresh: { interval: 300000, enabled: true },
  charts: { colors: { primary: '#3b82f6', secondary: '#ef4444' } },
  metrics: { currency: 'PEN', locale: 'es-PE' },
  alerts: { maxVisible: 3, autoGenerate: true }
}