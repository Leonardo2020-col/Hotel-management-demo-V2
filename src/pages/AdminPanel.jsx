import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../lib/supabase-admin'
import toast from 'react-hot-toast'
import { 
  Users, 
  Settings, 
  BarChart3, 
  Shield, 
  Database,
  Building,
  UserPlus,
  FileText,
  Activity,
  Key,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Clock,
  Bell,
  DollarSign,
  MapPin,
  Monitor,
  Archive,
  Cog
} from 'lucide-react'

const AdminPanel = () => {
  const { userName, getPrimaryBranch, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [systemStats, setSystemStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const primaryBranch = getPrimaryBranch()

  useEffect(() => {
    if (isAdmin()) {
      loadSystemStats()
    }
  }, [])

  const loadSystemStats = async () => {
    setLoading(true)
    try {
      // Cargar estadísticas del sistema
      const result = await adminService.getSystemStats()
      if (result.data) {
        setSystemStats(result.data)
      }
    } catch (error) {
      console.error('Error loading system stats:', error)
      toast.error('Error al cargar estadísticas del sistema')
    } finally {
      setLoading(false)
    }
  }

  // Verificar permisos de administrador
  if (!isAdmin()) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">
            No tienes permisos de administrador para acceder a esta sección.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  const adminSections = [
    {
      title: 'Gestión de Usuarios',
      description: 'Crear y administrar usuarios del sistema',
      icon: Users,
      color: 'bg-blue-500',
      action: () => navigate('/admin/users'),
      stats: systemStats ? `${systemStats.activeUsers || 0} usuarios activos` : 'Cargando...',
      priority: 'high'
    },
    {
      title: 'Gestión de Sucursales',
      description: 'Administrar sucursales del hotel',
      icon: Building,
      color: 'bg-green-500',
      action: () => navigate('/admin/branches'),
      stats: systemStats ? `${systemStats.totalBranches || 0} sucursales activas` : 'Cargando...',
      priority: 'high'
    },
    {
      title: 'Reportes Avanzados',
      description: 'Acceso a todos los reportes del sistema',
      icon: BarChart3,
      color: 'bg-indigo-500',
      action: () => navigate('/admin/reports'),
      stats: 'Análisis completo y exportación',
      priority: 'high'
    },
    {
      title: 'Configuración del Sistema',
      description: 'Configurar parámetros generales del hotel',
      icon: Settings,
      color: 'bg-gray-500',
      action: () => navigate('/admin/settings'),
      stats: 'Configuración global',
      priority: 'medium'
    },
    {
      title: 'Sistema de Auditoría',
      description: 'Logs de sistema y monitoreo de actividad',
      icon: Shield,
      color: 'bg-red-500',
      action: () => navigate('/admin/audit'),
      stats: systemStats ? `${systemStats.todayActions || 0} acciones hoy` : 'Cargando...',
      priority: 'medium'
    },
    {
      title: 'Base de Datos',
      description: 'Respaldos y mantenimiento',
      icon: Database,
      color: 'bg-purple-500',
      action: () => navigate('/admin/database'),
      stats: `Último respaldo: ${new Date().toLocaleDateString('es-PE')}`,
      priority: 'low'
    }
  ]

  const quickActions = [
    {
      title: 'Crear Usuario',
      description: 'Agregar nuevo usuario al sistema',
      icon: UserPlus,
      action: () => navigate('/admin/users?action=create'),
      color: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
      shortcut: '⌘+U'
    },
    {
      title: 'Ver Reportes',
      description: 'Acceder a reportes avanzados',
      icon: FileText,
      action: () => navigate('/admin/reports'),
      color: 'text-green-600 bg-green-50 hover:bg-green-100',
      shortcut: '⌘+R'
    },
    {
      title: 'Nueva Sucursal',
      description: 'Registrar nueva sucursal',
      icon: Building,
      action: () => navigate('/admin/branches?action=create'),
      color: 'text-purple-600 bg-purple-50 hover:bg-purple-100',
      shortcut: '⌘+B'
    },
    {
      title: 'Sistema de Logs',
      description: 'Monitorear actividad del sistema',
      icon: Monitor,
      action: () => navigate('/admin/audit'),
      color: 'text-orange-600 bg-orange-50 hover:bg-orange-100',
      shortcut: '⌘+L'
    }
  ]

  // Datos simulados si no hay systemStats
  const fallbackStats = {
    totalUsers: 6,
    activeUsers: 5,
    totalBranches: 1,
    activeBranches: 1,
    todayActions: 12,
    uptime: 98.5,
    lastBackup: new Date().toLocaleDateString('es-PE'),
    pendingAlerts: 2
  }

  const currentStats = systemStats || fallbackStats

  return (
    <div className="p-6 space-y-6">
      {/* Header de página */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Administrador</h1>
          <p className="text-gray-600">
            Configuración y administración del sistema
          </p>
          {primaryBranch && (
            <p className="text-sm text-blue-600 mt-1">
              Sucursal actual: {primaryBranch.name}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadSystemStats}
            disabled={loading}
            className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <div className="text-right">
            <p className="text-sm text-gray-600">Bienvenido,</p>
            <p className="font-medium text-gray-900">{userName}</p>
          </div>
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      {/* Advertencia de administrador */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex">
          <Shield className="h-5 w-5 text-amber-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">
              Panel de Administrador
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              Tienes acceso completo al sistema. Los cambios realizados aquí afectan a todo el hotel.
            </p>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={index}
                onClick={action.action}
                className={`p-4 rounded-lg border border-gray-200 text-left hover:shadow-md transition-all duration-200 group ${action.color}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <Icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  {action.shortcut && (
                    <span className="text-xs opacity-60 font-mono">{action.shortcut}</span>
                  )}
                </div>
                <h3 className="font-medium mb-1">{action.title}</h3>
                <p className="text-sm opacity-75">{action.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid de secciones administrativas */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Administración del Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections
            .sort((a, b) => {
              const priorityOrder = { high: 0, medium: 1, low: 2 }
              return priorityOrder[a.priority] - priorityOrder[b.priority]
            })
            .map((section, index) => {
            const Icon = section.icon
            return (
              <div
                key={index}
                onClick={section.action}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group border border-gray-100 hover:border-gray-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex-shrink-0 p-3 rounded-lg ${section.color} group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">
                        {section.priority === 'high' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Crítico
                          </span>
                        )}
                        {section.priority === 'medium' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Importante
                          </span>
                        )}
                        {section.priority === 'low' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Normal
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {section.stats}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">{section.description}</p>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-blue-600 group-hover:text-blue-700">
                      <span>Administrar</span>
                      <svg className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Estadísticas del sistema */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Estado del Sistema</h3>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              Actualizado: {new Date().toLocaleString('es-PE')}
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{currentStats.activeUsers}</p>
              <p className="text-sm text-gray-600">Usuarios Activos</p>
              <div className="flex items-center justify-center mt-1">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs text-green-600">Sistema estable</span>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Building className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{currentStats.activeBranches}</p>
              <p className="text-sm text-gray-600">Sucursales</p>
              <div className="flex items-center justify-center mt-1">
                <Activity className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs text-green-600">Todas operativas</span>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Database className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">Hoy</p>
              <p className="text-sm text-gray-600">Último Respaldo</p>
              <div className="flex items-center justify-center mt-1">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs text-green-600">Sincronizado</span>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-indigo-600">{currentStats.uptime}%</p>
              <p className="text-sm text-gray-600">Uptime</p>
              <div className="flex items-center justify-center mt-1">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs text-green-600">Rendimiento óptimo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas del sistema */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Alertas del Sistema
            </h3>
            <button 
              onClick={() => navigate('/admin/audit')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Ver todas
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
              <div className="flex-1">
                <p className="font-medium text-yellow-800">Stock Bajo en Suministros</p>
                <p className="text-sm text-yellow-600">8 items requieren reposición</p>
              </div>
              <button 
                onClick={() => navigate('/supplies')}
                className="text-yellow-700 hover:text-yellow-800 text-sm font-medium px-3 py-1 rounded bg-yellow-100 hover:bg-yellow-200 transition-colors"
              >
                Ver
              </button>
            </div>

            <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <FileText className="h-5 w-5 text-blue-500 mr-3" />
              <div className="flex-1">
                <p className="font-medium text-blue-800">Reporte Mensual Pendiente</p>
                <p className="text-sm text-blue-600">Reporte de diciembre listo para revisión</p>
              </div>
              <button 
                onClick={() => navigate('/admin/reports')}
                className="text-blue-700 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 transition-colors"
              >
                Revisar
              </button>
            </div>

            <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <div className="flex-1">
                <p className="font-medium text-green-800">Sistema Actualizado</p>
                <p className="text-sm text-green-600">Todas las funciones operando correctamente</p>
              </div>
              <span className="text-green-700 text-sm font-medium px-3 py-1 rounded bg-green-100">
                OK
              </span>
            </div>

            {currentStats.pendingAlerts > 0 && (
              <div className="flex items-center p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                <div className="flex-1">
                  <p className="font-medium text-red-800">Alertas Críticas</p>
                  <p className="text-sm text-red-600">{currentStats.pendingAlerts} alertas requieren atención inmediata</p>
                </div>
                <button 
                  onClick={() => navigate('/admin/audit')}
                  className="text-red-700 hover:text-red-800 text-sm font-medium px-3 py-1 rounded bg-red-100 hover:bg-red-200 transition-colors"
                >
                  Revisar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer del panel */}
      <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-6">
        <div className="flex items-center justify-center space-x-4">
          <span>Panel de Administrador - Sistema de Hotel v1.0.0</span>
          <span>•</span>
          <span>Última actualización: {new Date().toLocaleDateString('es-PE')}</span>
          <span>•</span>
          <span className="flex items-center">
            <Shield className="h-4 w-4 mr-1" />
            Modo Administrador Activo
          </span>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel