// src/config/dashboard.js - CONFIGURACIÓN DEL DASHBOARD
export const DASHBOARD_CONFIG = {
  // =============================================
  // CONFIGURACIÓN DE ACTUALIZACIÓN
  // =============================================
  refreshIntervals: {
    dashboard: 5 * 60 * 1000,    // 5 minutos
    roomStatus: 2 * 60 * 1000,   // 2 minutos
    reservations: 3 * 60 * 1000, // 3 minutos
    realTime: 30 * 1000          // 30 segundos para datos críticos
  },

  // =============================================
  // CONFIGURACIÓN DE CACHE
  // =============================================
  cache: {
    dashboard: 5,      // 5 minutos
    rooms: 2,          // 2 minutos
    guests: 10,        // 10 minutos
    reports: 15,       // 15 minutos
    snacks: 30         // 30 minutos
  },

  // =============================================
  // CONFIGURACIÓN DE PAGINACIÓN
  // =============================================
  pagination: {
    defaultLimit: 50,
    maxLimit: 1000,
    reservationsPerPage: 25,
    guestsPerPage: 20,
    activitiesPerPage: 10
  },

  // =============================================
  // CONFIGURACIÓN DE ALERTAS
  // =============================================
  alerts: {
    maxCheckoutsBeforeAlert: 5,
    maxRoomsNeedingCleaningBeforeAlert: 3,
    maxPendingCheckinBeforeAlert: 8,
    lowOccupancyThreshold: 30,
    highOccupancyThreshold: 95
  },

  // =============================================
  // CONFIGURACIÓN DE COLORES
  // =============================================
  colors: {
    roomStatus: {
      available: '#10B981',    // green
      occupied: '#EF4444',     // red
      cleaning: '#F59E0B',     // amber
      maintenance: '#8B5CF6',  // purple
      out_of_order: '#6B7280'  // gray
    },
    
    charts: {
      primary: '#3B82F6',      // blue
      secondary: '#10B981',    // green
      tertiary: '#F59E0B',     // amber
      quaternary: '#8B5CF6',   // purple
      success: '#10B981',      // green
      warning: '#F59E0B',      // amber
      danger: '#EF4444'        // red
    },

    trends: {
      positive: '#10B981',     // green
      negative: '#EF4444',     // red
      neutral: '#6B7280'       // gray
    }
  },

  // =============================================
  // CONFIGURACIÓN DE MÉTRICAS
  // =============================================
  metrics: {
    occupancyTargets: {
      minimum: 60,
      good: 75,
      excellent: 85
    },
    
    revenueTargets: {
      daily: 5000,
      weekly: 30000,
      monthly: 120000
    },
    
    satisfactionTargets: {
      minimum: 4.0,
      good: 4.5,
      excellent: 4.8
    }
  },

  // =============================================
  // CONFIGURACIÓN DE FORMATOS
  // =============================================
  formats: {
    currency: {
      locale: 'es-PE',
      currency: 'PEN',
      minimumFractionDigits: 2
    },
    
    date: {
      locale: 'es-PE',
      timeZone: 'America/Lima',
      dateStyle: 'short',
      timeStyle: 'short'
    },
    
    numbers: {
      locale: 'es-PE',
      maximumFractionDigits: 2
    }
  },

  // =============================================
  // CONFIGURACIÓN DE ACCIONES RÁPIDAS
  // =============================================
  quickActions: {
    enabled: [
      'new_reservation',
      'quick_checkin',
      'manage_rooms',
      'view_reports'
    ],
    
    permissions: {
      new_reservation: ['admin', 'reception'],
      quick_checkin: ['admin', 'reception'],
      manage_rooms: ['admin', 'reception', 'housekeeping'],
      view_reports: ['admin', 'reception']
    }
  },

  // =============================================
  // CONFIGURACIÓN DE NOTIFICACIONES
  // =============================================
  notifications: {
    enabled: true,
    autoHide: 5000,
    position: 'top-right',
    
    types: {
      success: {
        icon: 'CheckCircle',
        duration: 3000,
        color: 'green'
      },
      warning: {
        icon: 'AlertTriangle',
        duration: 5000,
        color: 'yellow'
      },
      error: {
        icon: 'XCircle',
        duration: 7000,
        color: 'red'
      },
      info: {
        icon: 'Info',
        duration: 4000,
        color: 'blue'
      }
    }
  },

  // =============================================
  // CONFIGURACIÓN DE WIDGETS
  // =============================================
  widgets: {
    dashboard: {
      stats: { enabled: true, order: 1 },
      occupancyChart: { enabled: true, order: 2 },
      revenueChart: { enabled: true, order: 3 },
      recentActivity: { enabled: true, order: 4 },
      upcomingCheckIns: { enabled: true, order: 5 },
      roomsToClean: { enabled: true, order: 6 }
    },
    
    responsive: {
      mobile: ['stats', 'recentActivity'],
      tablet: ['stats', 'occupancyChart', 'recentActivity', 'upcomingCheckIns'],
      desktop: 'all'
    }
  },

  // =============================================
  // CONFIGURACIÓN DE DATOS MOCK
  // =============================================
  mockData: {
    enabled: process.env.NODE_ENV === 'development',
    fallbackToMock: true, // Si falla la conexión a Supabase
    
    scenarios: {
      high_occupancy: {
        occupancy: 92,
        availableRooms: 3,
        checkIns: 8,
        roomsToClean: 6
      },
      
      low_occupancy: {
        occupancy: 45,
        availableRooms: 22,
        checkIns: 2,
        roomsToClean: 1
      },
      
      normal: {
        occupancy: 75,
        availableRooms: 10,
        checkIns: 4,
        roomsToClean: 3
      }
    }
  },

  // =============================================
  // CONFIGURACIÓN DE FEATURES FLAGS
  // =============================================
  features: {
    realTimeUpdates: process.env.REACT_APP_ENABLE_REALTIME !== 'false',
    advancedAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    bulkOperations: process.env.REACT_APP_ENABLE_BULK_OPS === 'true',
    exportData: process.env.REACT_APP_ENABLE_EXPORT === 'true',
    maintenanceMode: process.env.REACT_APP_MAINTENANCE_MODE === 'true'
  },

  // =============================================
  // CONFIGURACIÓN DE PERFORMANCE
  // =============================================
  performance: {
    enableVirtualization: true,
    lazyLoadImages: true,
    debounceSearch: 300,
    throttleScroll: 100,
    
    limits: {
      maxRoomsToRender: 100,
      maxReservationsToCache: 500,
      maxActivitiesToShow: 50
    }
  }
}

// =============================================
// CONFIGURACIÓN ESPECÍFICA POR AMBIENTE
// =============================================
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV
  
  const configs = {
    development: {
      logging: 'debug',
      cacheEnabled: false,
      mockDataEnabled: true,
      refreshIntervals: {
        ...DASHBOARD_CONFIG.refreshIntervals,
        dashboard: 10 * 1000 // 10 segundos en desarrollo
      }
    },
    
    production: {
      logging: 'error',
      cacheEnabled: true,
      mockDataEnabled: false,
      refreshIntervals: DASHBOARD_CONFIG.refreshIntervals
    },
    
    test: {
      logging: 'silent',
      cacheEnabled: false,
      mockDataEnabled: true,
      refreshIntervals: {
        dashboard: 1000,
        roomStatus: 500,
        reservations: 750,
        realTime: 100
      }
    }
  }
  
  return {
    ...DASHBOARD_CONFIG,
    ...configs[env]
  }
}

// =============================================
// HELPERS DE CONFIGURACIÓN
// =============================================
export const isDevelopment = () => process.env.NODE_ENV === 'development'
export const isProduction = () => process.env.NODE_ENV === 'production'
export const isMockEnabled = () => DASHBOARD_CONFIG.mockData.enabled
export const isFeatureEnabled = (feature) => DASHBOARD_CONFIG.features[feature]

// =============================================
// CONFIGURACIÓN DE TEMAS
// =============================================
export const THEMES = {
  light: {
    primary: '#3B82F6',
    secondary: '#64748B',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#1E293B'
  },
  
  dark: {
    primary: '#60A5FA',
    secondary: '#94A3B8',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9'
  }
}

// =============================================
// CONFIGURACIÓN DE ROLES Y PERMISOS
// =============================================
export const PERMISSIONS = {
  admin: {
    dashboard: ['read', 'write'],
    rooms: ['read', 'write', 'delete'],
    reservations: ['read', 'write', 'delete'],
    guests: ['read', 'write', 'delete'],
    supplies: ['read', 'write', 'delete'],
    reports: ['read', 'export'],
    settings: ['read', 'write']
  },
  
  reception: {
    dashboard: ['read'],
    rooms: ['read', 'write'],
    reservations: ['read', 'write'],
    guests: ['read', 'write'],
    supplies: ['read'],
    reports: ['read']
  },
  
  housekeeping: {
    dashboard: ['read'],
    rooms: ['read', 'write'],
    supplies: ['read', 'write']
  }
}

export default DASHBOARD_CONFIG