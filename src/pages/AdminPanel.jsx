import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
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
  TrendingUp
} from 'lucide-react'

const AdminPanel = () => {
  const { userName, getPrimaryBranch, isAdmin } = useAuth()
  const navigate = useNavigate()

  const primaryBranch = getPrimaryBranch()

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
      stats: '6 usuarios activos'
    },
    {
      title: 'Configuración del Hotel',
      description: 'Configurar parámetros generales del sistema',
      icon: Settings,
      color: 'bg-gray-500',
      action: () => navigate('/settings'),
      stats: 'Configuración global'
    },
    {
      title: 'Gestión de Sucursales',
      description: 'Administrar sucursales del hotel',
      icon: Building,
      color: 'bg-green-500',
      action: () => navigate('/admin/branches'),
      stats: '4 sucursales activas'
    },
    {
      title: 'Reportes Avanzados',
      description: 'Acceso a todos los reportes del sistema',
      icon: BarChart3,
      color: 'bg-indigo-500',
      action: () => navigate('/admin/reports'),
      stats: 'Análisis completo'
    },
    {
      title: 'Auditoría del Sistema',
      description: 'Logs de sistema y cambios importantes',
      icon: Shield,
      color: 'bg-red-500',
      action: () => navigate('/admin/audit'),
      stats: 'Seguimiento de actividad'
    },
    {
      title: 'Base de Datos',
      description: 'Respaldos y mantenimiento',
      icon: Database,
      color: 'bg-purple-500',
      action: () => navigate('/admin/database'),
      stats: 'Último respaldo: Hoy'
    }
  ]

  const quickActions = [
    {
      title: 'Crear Usuario',
      description: 'Agregar nuevo usuario al sistema',
      icon: UserPlus,
      action: () => navigate('/admin/users?action=create'),
      color: 'text-blue-600 bg-blue-50 hover:bg-blue-100'
    },
    {
      title: 'Ver Reportes',
      description: 'Acceder a reportes del día',
      icon: FileText,
      action: () => navigate('/admin/reports'),
      color: 'text-green-600 bg-green-50 hover:bg-green-100'
    },
    {
      title: 'Cambiar Sucursal',
      description: 'Cambiar entre sucursales',
      icon: Building,
      action: () => navigate('/admin/branch-switcher'),
      color: 'text-purple-600 bg-purple-50 hover:bg-purple-100'
    }
  ]

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={index}
                onClick={action.action}
                className={`p-4 rounded-lg border border-gray-200 text-left hover:shadow-md transition-all duration-200 ${action.color}`}
              >
                <div className="flex items-center">
                  <Icon className="h-6 w-6 mr-3" />
                  <div>
                    <h3 className="font-medium">{action.title}</h3>
                    <p className="text-sm opacity-75">{action.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid de secciones administrativas */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Administración del Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section, index) => {
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
                    <div className="text-xs text-gray-500">
                      {section.stats}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
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

      {/* Estadísticas rápidas del sistema */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Estado del Sistema</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">6</p>
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
              <p className="text-2xl font-bold text-green-600">4</p>
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
              <p className="text-2xl font-bold text-indigo-600">98.5%</p>
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
            <h3 className="text-lg font-medium text-gray-900">Alertas del Sistema</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700">
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
                className="text-yellow-700 hover:text-yellow-800 text-sm font-medium"
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
                className="text-blue-700 hover:text-blue-800 text-sm font-medium"
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
              <span className="text-green-700 text-sm font-medium">OK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer del panel */}
      <div className="text-center text-sm text-gray-500">
        <p>Panel de Administrador - Sistema de Hotel v1.0.0</p>
        <p>Última actualización: {new Date().toLocaleDateString('es-PE')}</p>
      </div>
    </div>
  )
}

export default AdminPanel