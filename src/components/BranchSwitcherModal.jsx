// src/components/BranchSwitcherModal.jsx - MODAL CORREGIDO PARA CAMBIO DE SUCURSAL
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBranchSwitcher } from '../hooks/useBranchSwitcher'
import { 
  Building, 
  X, 
  CheckCircle, 
  ArrowRight,
  MapPin,
  Users,
  Bed,
  Settings,
  AlertCircle
} from 'lucide-react'
import LoadingSpinner from './common/LoadingSpinner'

const BranchSwitcherModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const {
    switching,
    currentBranch,
    processedBranches,
    switchToBranch,
    canSwitchBranches,
    error
  } = useBranchSwitcher()

  const [selectedBranchId, setSelectedBranchId] = useState(null)
  const [switchError, setSwitchError] = useState(null)

  // ✅ Verificaciones de seguridad
  if (!canSwitchBranches || !isOpen) return null
  
  if (!processedBranches || processedBranches.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sin sucursales disponibles
          </h3>
          <p className="text-gray-600 mb-4">
            No se encontraron sucursales para cambiar.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    )
  }

  // ✅ Manejar cambio de sucursal con mejor manejo de errores
  const handleBranchSwitch = async (branchId) => {
    if (branchId === currentBranch?.id) {
      onClose()
      return
    }

    if (switching) return // Prevenir múltiples clicks

    setSelectedBranchId(branchId)
    setSwitchError(null)
    
    try {
      const result = await switchToBranch(branchId)
      
      if (result.success) {
        // Cerrar modal después de un breve delay para mostrar feedback
        setTimeout(() => {
          onClose()
          // Solo navegar si no estamos ya en dashboard
          if (window.location.pathname !== '/dashboard') {
            navigate('/dashboard')
          } else {
            // Refrescar la página para mostrar cambios
            window.location.reload()
          }
        }, 500)
      } else {
        setSwitchError(result.error?.message || 'Error al cambiar de sucursal')
      }
    } catch (error) {
      console.error('Error switching branch:', error)
      setSwitchError('Error inesperado al cambiar de sucursal')
    } finally {
      setSelectedBranchId(null)
    }
  }

  const formatAddress = (address) => {
    if (!address) return 'Sin dirección'
    const parts = address.split(',')
    return parts[0]?.trim() || 'Sin dirección'
  }

  const getOccupancyColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800'
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        {/* ✅ Header mejorado */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Building className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Cambiar Sucursal
              </h3>
              <p className="text-sm text-gray-600">
                {currentBranch ? `Actual: ${currentBranch.name}` : 'Selecciona una sucursal'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={switching}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ✅ Error de cambio de sucursal */}
        {(switchError || error) && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-sm text-red-700">
                {switchError || error}
              </span>
            </div>
          </div>
        )}

        {/* ✅ Lista de sucursales con mejor UX */}
        <div className="max-h-96 overflow-y-auto">
          {processedBranches.map((branch) => {
            const isProcessing = switching && selectedBranchId === branch.id
            const isDisabled = switching || isProcessing
            
            return (
              <div
                key={branch.id}
                onClick={() => !isDisabled && handleBranchSwitch(branch.id)}
                className={`p-4 border-b border-gray-100 transition-all ${
                  isDisabled 
                    ? 'cursor-not-allowed opacity-75' 
                    : 'cursor-pointer hover:bg-gray-50'
                } ${
                  branch.isCurrent 
                    ? 'bg-green-50 border-green-200' 
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className={`p-2 rounded-lg mr-3 ${
                      branch.isCurrent ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Building className={`h-5 w-5 ${
                        branch.isCurrent ? 'text-green-600' : 'text-gray-600'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="font-medium text-gray-900">
                          {branch.name}
                        </h4>
                        {branch.isCurrent && (
                          <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {formatAddress(branch.address)}
                        </span>
                      </div>
                      
                      {/* ✅ Estadísticas mejoradas con fallbacks */}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Bed className="h-3 w-3 mr-1" />
                          <span>
                            {branch.stats?.occupiedRooms || 0}/{branch.stats?.totalRooms || 0}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          <span>{branch.stats?.todayCheckins || 0} check-ins</span>
                        </div>
                        <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          getOccupancyColor(branch.occupancyPercentage || 0)
                        }`}>
                          {Math.round(branch.occupancyPercentage || 0)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex-shrink-0">
                    {isProcessing ? (
                      <LoadingSpinner size="xs" showMessage={false} />
                    ) : branch.isCurrent ? (
                      <div className="text-green-600 text-sm font-medium">
                        Actual
                      </div>
                    ) : (
                      <ArrowRight className={`h-5 w-5 ${
                        isDisabled ? 'text-gray-300' : 'text-gray-400'
                      }`} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ✅ Footer mejorado */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="space-y-2">
            {switching && (
              <div className="text-center text-sm text-blue-600 mb-2">
                Cambiando sucursal...
              </div>
            )}
            <button
              onClick={() => {
                onClose()
                navigate('/admin/branches')
              }}
              disabled={switching}
              className="w-full flex items-center justify-center px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Settings className="h-4 w-4 mr-2" />
              Gestionar sucursales
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BranchSwitcherModal