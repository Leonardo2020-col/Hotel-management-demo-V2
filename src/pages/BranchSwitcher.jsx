// src/pages/BranchSwitcher.jsx - PÁGINA PARA CAMBIO DE SUCURSAL
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBranchSwitcher } from '../hooks/useBranchSwitcher'
import { 
  Building, 
  Users, 
  Bed, 
  DollarSign, 
  TrendingUp, 
  MapPin,
  Phone,
  Mail,
  Crown,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const BranchSwitcher = () => {
  const navigate = useNavigate()
  const { userName, isAdmin } = useAuth()
  const {
    loading,
    switching,
    currentBranch,
    processedBranches,
    accessSummary,
    switchToBranch,
    loadBranchStats,
    canSwitchBranches
  } = useBranchSwitcher()

  const [selectedBranchId, setSelectedBranchId] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // ✅ Verificar permisos
  if (!isAdmin()) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Acceso Restringido
          </h2>
          <p className="text-red-700">
            Solo los administradores pueden cambiar de sucursal.
          </p>
        </div>
      </div>
    )
  }

  // ✅ Manejar confirmación de cambio
  const handleBranchSelect = (branchId) => {
    if (branchId === currentBranch?.id) return
    
    setSelectedBranchId(branchId)
    setShowConfirmModal(true)
  }

  const confirmBranchSwitch = async () => {
    if (!selectedBranchId) return

    const result = await switchToBranch(selectedBranchId)
    setShowConfirmModal(false)
    setSelectedBranchId(null)

    if (result.success) {
      // Pequeña pausa para que el usuario vea el cambio
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    }
  }

  // ✅ Obtener color según rendimiento
  const getPerformanceColor = (occupancyRate) => {
    if (occupancyRate >= 80) return 'text-green-600 bg-green-100'
    if (occupancyRate >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getPerformanceIcon = (occupancyRate) => {
    if (occupancyRate >= 80) return <TrendingUp className="h-4 w-4" />
    return <BarChart3 className="h-4 w-4" />
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ✅ Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Cambiar Sucursal
            </h1>
            <p className="text-gray-600">
              Selecciona la sucursal desde la que deseas operar
            </p>
          </div>
        </div>
        
        <button
          onClick={loadBranchStats}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* ✅ Resumen de acceso */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <Crown className="h-5 w-5 text-blue-600 mr-3" />
          <div>
            <h3 className="font-medium text-blue-900">Acceso de Administrador</h3>
            <p className="text-blue-700 text-sm">
              Tienes acceso a {accessSummary.total} sucursal{accessSummary.total !== 1 ? 'es' : ''}.
              Sucursal actual: <strong>{accessSummary.currentBranchName}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ✅ Loading state */}
      {loading && processedBranches.length === 0 && (
        <LoadingSpinner 
          message="Cargando sucursales..." 
          size="lg"
          className="py-12"
        />
      )}

      {/* ✅ Grid de sucursales */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {processedBranches.map((branch) => (
          <div
            key={branch.id}
            className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-200 overflow-hidden ${
              branch.isCurrent 
                ? 'border-green-500 ring-2 ring-green-200' 
                : 'border-gray-200 hover:border-blue-300 hover:shadow-xl cursor-pointer'
            }`}
            onClick={() => !branch.isCurrent && handleBranchSelect(branch.id)}
          >
            {/* Header de la sucursal */}
            <div className={`p-4 ${branch.isCurrent ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Building className={`h-6 w-6 mr-3 ${
                    branch.isCurrent ? 'text-green-600' : 'text-gray-600'
                  }`} />
                  <div>
                    <h3 className="font-bold text-gray-900">{branch.name}</h3>
                    <p className="text-sm text-gray-600">
                      {branch.isCurrent ? 'Sucursal Actual' : 'Disponible'}
                    </p>
                  </div>
                </div>
                
                {branch.isCurrent && (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                )}
              </div>
            </div>

            {/* Información de contacto */}
            <div className="p-4 border-b border-gray-100">
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="truncate">{branch.address}</span>
                </div>
                {branch.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{branch.phone}</span>
                  </div>
                )}
                {branch.email && (
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="truncate">{branch.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Estadísticas */}
            <div className="p-4">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Ocupación */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-600">Ocupación</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-gray-900 mr-2">
                        {branch.stats.occupiedRooms}/{branch.stats.totalRooms}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getPerformanceColor(branch.occupancyPercentage)
                      }`}>
                        {branch.occupancyPercentage}%
                      </span>
                    </div>
                  </div>

                  {/* Ingresos del día */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-600">Ingresos Hoy</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      S/{branch.stats.todayRevenue?.toLocaleString() || '0'}
                    </span>
                  </div>

                  {/* Personal activo */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-600">Check-ins</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {branch.stats.todayCheckins || 0}
                    </span>
                  </div>

                  {/* Indicador de rendimiento */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center">
                      {getPerformanceIcon(branch.occupancyPercentage)}
                      <span className="text-xs text-gray-500 ml-2">Rendimiento</span>
                    </div>
                    <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      getPerformanceColor(branch.occupancyPercentage)
                    }`}>
                      {branch.occupancyPercentage >= 80 ? 'Excelente' : 
                       branch.occupancyPercentage >= 60 ? 'Bueno' : 'Bajo'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer con acción */}
            <div className={`p-4 border-t border-gray-100 ${
              branch.isCurrent ? 'bg-green-50' : 'bg-gray-50'
            }`}>
              {branch.isCurrent ? (
                <div className="flex items-center justify-center text-green-700 font-medium">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Sucursal Actual
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                    Cambiar a esta sucursal
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Modal de confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <Building className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirmar Cambio de Sucursal
              </h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas cambiar a{' '}
                <strong>
                  {processedBranches.find(b => b.id === selectedBranchId)?.name}
                </strong>?
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={switching}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmBranchSwitch}
                  disabled={switching}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {switching ? (
                    <LoadingSpinner size="xs" color="white" showMessage={false} />
                  ) : (
                    'Confirmar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Información adicional */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información de Sucursales
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {accessSummary.total}
            </div>
            <div className="text-sm text-gray-600">
              Sucursales Disponibles
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {processedBranches.reduce((sum, branch) => sum + branch.stats.totalRooms, 0)}
            </div>
            <div className="text-sm text-gray-600">
              Total Habitaciones
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              S/{processedBranches.reduce((sum, branch) => sum + (branch.stats.todayRevenue || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              Ingresos Totales Hoy
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Nota importante */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">
              Nota Importante
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              Al cambiar de sucursal, todos los datos mostrados en el dashboard se actualizarán 
              para reflejar la información de la nueva sucursal seleccionada. 
              Los reportes y estadísticas serán específicos de esa ubicación.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BranchSwitcher