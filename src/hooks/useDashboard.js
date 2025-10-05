// src/hooks/useDashboard.js - VERSIÓN CORREGIDA
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { reportService, realtimeService } from '../lib/supabase'
import { useErrorHandler } from './useErrorHandler'

export const useDashboard = () => {
  const { userInfo, getPrimaryBranch } = useAuth()
  const { handleError } = useErrorHandler()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)

  // Estados principales del dashboard
  const [dashboardStats, setDashboardStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    maintenanceRooms: 0,
    occupancyRate: 0,
    todayCheckins: 0,
    todayCheckouts: 0,
    todayRevenue: 0,
    pendingReservations: 0,
    lowStockItems: 0
  })

  const [alerts, setAlerts] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [chartData, setChartData] = useState({
    occupancyTrend: [],
    revenueTrend: [],
    roomStatus: [],
    monthlyComparison: []
  })

  // Obtener sucursal principal
  const primaryBranch = useMemo(() => getPrimaryBranch(), [userInfo])

  // ✅ FUNCIÓN CORREGIDA - Cargar estadísticas principales
  const loadDashboardStats = useCallback(async () => {
    if (!primaryBranch?.id) {
      console.warn('⚠️ No primary branch found')
      return
    }

    try {
      console.log('📊 Loading dashboard stats for branch:', primaryBranch.id)
      
      const { data, error } = await reportService.getDashboardStats(primaryBranch.id)
      
      if (error) {
        console.error('❌ Error from getDashboardStats:', error)
        throw error
      }

      console.log('📦 Raw data from getDashboardStats:', data)

      // ✅ CORRECCIÓN: Manejar tanto formato JSON como objeto plano
      let statsData = data

      // Si data es un string JSON, parsearlo
      if (typeof data === 'string') {
        try {
          statsData = JSON.parse(data)
        } catch (parseError) {
          console.error('❌ Error parsing JSON:', parseError)
          statsData = {}
        }
      }

      // Si data es un array, tomar el primer elemento
      if (Array.isArray(statsData)) {
        statsData = statsData[0] || {}
      }

      console.log('✅ Processed stats data:', statsData)

      // ✅ Mapear correctamente los campos
      setDashboardStats({
        totalRooms: Number(statsData.total_rooms || 0),
        occupiedRooms: Number(statsData.occupied_rooms || 0),
        availableRooms: Number(statsData.available_rooms || 0),
        maintenanceRooms: Number(statsData.maintenance_rooms || 0),
        occupancyRate: Number(statsData.occupancy_rate || 0),
        todayCheckins: Number(statsData.today_checkins || 0),
        todayCheckouts: Number(statsData.today_checkouts || 0),
        todayRevenue: Number(statsData.today_revenue || 0),
        pendingReservations: Number(statsData.pending_reservations || 0),
        lowStockItems: Number(statsData.low_stock_items || 0)
      })

      console.log('✅ Dashboard stats loaded successfully')

    } catch (error) {
      console.error('❌ Error in loadDashboardStats:', error)
      handleError(error, 'stats', { 
        context: 'Cargando estadísticas del dashboard',
        showToast: true 
      })
      
      // Establecer valores por defecto en caso de error
      setDashboardStats({
        totalRooms: 0,
        occupiedRooms: 0,
        availableRooms: 0,
        maintenanceRooms: 0,
        occupancyRate: 0,
        todayCheckins: 0,
        todayCheckouts: 0,
        todayRevenue: 0,
        pendingReservations: 0,
        lowStockItems: 0
      })
    }
  }, [primaryBranch?.id, handleError])

  // ✅ Función para cargar actividad reciente
  const loadRecentActivity = useCallback(async () => {
    if (!primaryBranch?.id) return

    try {
      // Simulamos datos de actividad reciente
      const mockActivity = [
        {
          id: `activity_${Date.now()}_1`,
          type: 'checkin',
          title: 'Check-in completado',
          description: 'Juan Pérez - Habitación 301',
          timestamp: new Date().toISOString(),
          status: 'completed',
          metadata: { room: '301', amount: 180, guest: 'Juan Pérez' }
        },
        {
          id: `activity_${Date.now()}_2`,
          type: 'payment',
          title: 'Pago recibido',
          description: 'María García - $350 (Tarjeta)',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: 'completed',
          metadata: { amount: 350, method: 'Tarjeta', guest: 'María García' }
        },
        {
          id: `activity_${Date.now()}_3`,
          type: 'reservation',
          title: 'Nueva reserva',
          description: 'Carlos López - 3 noches',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          status: 'confirmed',
          metadata: { nights: 3, guest: 'Carlos López', room: '202' }
        }
      ]

      setRecentActivity(mockActivity)

    } catch (error) {
      console.error('❌ Error loading activity:', error)
      handleError(error, 'activity', { 
        context: 'Cargando actividad reciente',
        showToast: false 
      })
    }
  }, [primaryBranch?.id, handleError])

  // ✅ Función para cargar alertas del sistema
  const loadAlerts = useCallback(async () => {
    if (!primaryBranch?.id) return

    try {
      const alertsData = []

      // Alertas de stock bajo
      if (dashboardStats.lowStockItems > 0) {
        alertsData.push({
          id: 'low_stock',
          type: 'warning',
          title: 'Stock bajo',
          message: `${dashboardStats.lowStockItems} productos requieren reposición`,
          priority: 'medium',
          timestamp: new Date().toISOString(),
          action: { type: 'navigate', path: '/supplies' }
        })
      }

      // Alertas de reservas pendientes
      if (dashboardStats.pendingReservations > 0) {
        alertsData.push({
          id: 'pending_reservations',
          type: 'info',
          title: 'Reservas pendientes',
          message: `${dashboardStats.pendingReservations} reservas requieren confirmación`,
          priority: 'low',
          timestamp: new Date().toISOString(),
          action: { type: 'navigate', path: '/reservations' }
        })
      }

      // Alerta de ocupación alta
      if (dashboardStats.occupancyRate > 90) {
        alertsData.push({
          id: 'high_occupancy',
          type: 'success',
          title: 'Alta ocupación',
          message: `Excelente ocupación del ${dashboardStats.occupancyRate}%`,
          priority: 'low',
          timestamp: new Date().toISOString()
        })
      }

      setAlerts(alertsData)

    } catch (error) {
      console.error('❌ Error loading alerts:', error)
      handleError(error, 'alerts', { 
        context: 'Cargando alertas',
        showToast: false 
      })
    }
  }, [primaryBranch?.id, dashboardStats, handleError])

  // ✅ Función para cargar datos de gráficos
  const loadChartData = useCallback(async () => {
    if (!primaryBranch?.id || !dashboardStats.totalRooms) return

    try {
      // Datos de ocupación semanal
      const weeklyOccupancy = [
        { day: 'Lun', ocupadas: Math.floor(dashboardStats.totalRooms * 0.8), disponibles: Math.floor(dashboardStats.totalRooms * 0.2) },
        { day: 'Mar', ocupadas: Math.floor(dashboardStats.totalRooms * 0.72), disponibles: Math.floor(dashboardStats.totalRooms * 0.28) },
        { day: 'Mié', ocupadas: Math.floor(dashboardStats.totalRooms * 0.88), disponibles: Math.floor(dashboardStats.totalRooms * 0.12) },
        { day: 'Jue', ocupadas: Math.floor(dashboardStats.totalRooms * 0.76), disponibles: Math.floor(dashboardStats.totalRooms * 0.24) },
        { day: 'Vie', ocupadas: Math.floor(dashboardStats.totalRooms * 0.96), disponibles: Math.floor(dashboardStats.totalRooms * 0.04) },
        { day: 'Sáb', ocupadas: dashboardStats.totalRooms, disponibles: 0 },
        { day: 'Dom', ocupadas: dashboardStats.occupiedRooms, disponibles: dashboardStats.availableRooms }
      ]

      // Datos de ingresos últimos 7 días
      const revenueData = Array.from({ length: 7 }, (_, i) => ({
        fecha: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).getDate().toString(),
        ingresos: Math.floor(Math.random() * 1000) + 2000,
        gastos: Math.floor(Math.random() * 500) + 600
      }))

      // Estado actual de habitaciones
      const roomStatusData = [
        { name: 'Ocupadas', value: dashboardStats.occupiedRooms, color: '#ef4444' },
        { name: 'Disponibles', value: dashboardStats.availableRooms, color: '#22c55e' },
        { name: 'Mantenimiento', value: dashboardStats.maintenanceRooms, color: '#8b5cf6' }
      ].filter(item => item.value > 0)

      setChartData({
        occupancyTrend: weeklyOccupancy,
        revenueTrend: revenueData,
        roomStatus: roomStatusData,
        monthlyComparison: []
      })

    } catch (error) {
      console.error('❌ Error loading charts:', error)
      handleError(error, 'charts', { 
        context: 'Cargando datos de gráficos',
        showToast: false 
      })
    }
  }, [primaryBranch?.id, dashboardStats, handleError])

  // ✅ Función principal para cargar todos los datos
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (!primaryBranch?.id) {
      console.warn('⚠️ No primary branch, skipping dashboard load')
      setLoading(false)
      return
    }

    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      console.log('🔄 Loading dashboard data...', { 
        isRefresh, 
        branchId: primaryBranch.id 
      })

      // Cargar datos en paralelo
      await Promise.all([
        loadDashboardStats(),
        loadRecentActivity()
      ])

      setLastUpdate(new Date())

    } catch (error) {
      console.error('❌ Error in loadDashboardData:', error)
      handleError(error, 'general', { 
        context: 'Cargando dashboard',
        showToast: true 
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [primaryBranch?.id, loadDashboardStats, loadRecentActivity, handleError])

  // ✅ Función para refrescar datos
  const refreshDashboard = useCallback(() => {
    console.log('🔄 Manual refresh triggered')
    loadDashboardData(true)
  }, [loadDashboardData])

  // ✅ Efecto para cargar datos iniciales
  useEffect(() => {
    if (primaryBranch?.id) {
      console.log('🚀 Initial dashboard load for branch:', primaryBranch.id)
      loadDashboardData()
    }
  }, [primaryBranch?.id, loadDashboardData])

  // ✅ Efecto para cargar alertas y gráficos cuando cambien las estadísticas
  useEffect(() => {
    if (dashboardStats.totalRooms > 0) {
      loadAlerts()
      loadChartData()
    }
  }, [dashboardStats, loadAlerts, loadChartData])

  // ✅ Configurar actualizaciones en tiempo real
  useEffect(() => {
    if (!primaryBranch?.id) return

    let subscription = null

    const setupRealtimeUpdates = () => {
      subscription = realtimeService.subscribeToRoomChanges(
        primaryBranch.id,
        (payload) => {
          console.log('🔄 Cambio en tiempo real detectado:', payload)
          setTimeout(() => {
            loadDashboardStats()
          }, 1000)
        }
      )
    }

    setupRealtimeUpdates()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [primaryBranch?.id, loadDashboardStats])

  // ✅ Auto-refresh cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        console.log('⏰ Auto-refresh triggered')
        refreshDashboard()
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [loading, refreshing, refreshDashboard])

  // ✅ Datos computados
  const computedData = useMemo(() => ({
    occupancyPercentage: dashboardStats.totalRooms > 0 
      ? Math.round((dashboardStats.occupiedRooms / dashboardStats.totalRooms) * 100)
      : 0,
    
    availabilityPercentage: dashboardStats.totalRooms > 0
      ? Math.round((dashboardStats.availableRooms / dashboardStats.totalRooms) * 100) 
      : 0,
    
    revenueFormatted: new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(dashboardStats.todayRevenue),
    
    hasAlerts: alerts.length > 0,
    hasHighPriorityAlerts: alerts.some(alert => alert.priority === 'high'),
    
    totalMovement: dashboardStats.todayCheckins + dashboardStats.todayCheckouts,
    
    netOccupancyChange: dashboardStats.todayCheckins - dashboardStats.todayCheckouts
  }), [dashboardStats, alerts])

  return {
    // Estados
    loading,
    refreshing,
    lastUpdate,
    
    // Datos principales
    stats: dashboardStats,
    alerts,
    recentActivity,
    chartData,
    
    // Datos computados
    ...computedData,
    
    // Acciones
    refreshDashboard,
    loadDashboardData,
    
    // Información del usuario
    primaryBranch
  }
}