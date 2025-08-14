import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  Settings, 
  BarChart3, 
  Shield, 
  Database,
  LogOut,
  ArrowLeft,
  Building
} from 'lucide-react'

const AdminPanel = () => {
  const { userName, logout, getPrimaryBranch } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const result = await logout()
    if (result.success) {
      navigate('/login', { replace: true })
    }
  }

  const adminSections = [
    {
      title: 'Gestión de Usuarios',
      description: 'Crear y administrar usuarios del sistema',
      icon: Users,
      color: 'bg-blue-500',
      action: () => navigate('/admin/users')
    },
    {
      title: 'Configuración del Hotel',
      description: 'Configurar parámetros generales',
      icon: Settings,
      color: 'bg-gray-500',
      action: () => navigate('/admin/settings')
    },
    {
      title: 'Gestión de Sucursales',
      description: 'Administrar sucursales del hotel',
      icon: Building,
      color: 'bg-green-500',
      action: () => navigate('/admin/branches')
    },
    {
      title: 'Reportes Avanzados',
      description: 'Acceso a todos los reportes del sistema',
      icon: BarChart3,
      color: 'bg-indigo-500',
      action: () => navigate('/admin/reports')
    },
    {
      title: 'Auditoría del Sistema',
      description: 'Logs de sistema y cambios importantes',
      icon: Shield,
      color: 'bg-red-500',
      action: () => navigate('/admin/audit')
    },
    {
      title: 'Base de Datos',
      description: 'Respaldos y mantenimiento',
      icon: Database,
      color: 'bg-purple-500',
      action: () => navigate('/admin/database')
    }
  ]

  const primaryBranch = getPrimaryBranch()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel de Administrador</h1>
                <p className="text-sm text-gray-600">
                  Configuración y administración del sistema
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">
                  {primaryBranch?.name || 'Admin General'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Advertencia de administrador */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
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

        {/* Grid de secciones administrativas */}
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
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 p-3 rounded-lg ${section.color} group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {section.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Estadísticas rápidas del sistema */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Estado del Sistema</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-700">Usuarios Activos</h4>
                <p className="text-2xl font-bold text-blue-600">--</p>
                <p className="text-sm text-gray-500">En el sistema</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Sucursales</h4>
                <p className="text-2xl font-bold text-green-600">--</p>
                <p className="text-sm text-gray-500">Configuradas</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Último Respaldo</h4>
                <p className="text-2xl font-bold text-purple-600">--</p>
                <p className="text-sm text-gray-500">Base de datos</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminPanel