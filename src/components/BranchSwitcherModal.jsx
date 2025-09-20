// src/components/BranchSwitcherModal.jsx - MODAL RÁPIDO PARA CAMBIO DE SUCURSAL
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
  Settings
} from 'lucide-react'
import LoadingSpinner from './common/LoadingSpinner'

const BranchSwitcherModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const {
    switching,
    currentBranch,
    processedBranches,
    switchToBranch,
    canSwitchBranches
  } = useBranchSwitcher()

  const [selectedBranchId, setSelectedBranchId] = useState(null)

  // ✅ No mostrar modal si no puede cambiar sucursales
  if (!canSwitchBranches || !isOpen) return null

  // ✅ Manejar cambio de sucursal
  const handleBranchSwitch = async (branchId) => {
    if (branchId === currentBranch?.id) {
      onClose()
      return
    }

    setSelectedBranchId(branchId)
    const result = await switchToBranch(branchId)
    
    if (result.success) {
      onClose()
      // Opcional: navegar al dashboard para ver los cambios
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    }
    
    setSelectedBranchId(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        {/* ✅ Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Building className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Cambiar Sucursal
              </h3>
              <p className="text-sm text-gray-600">
                Selecciona una sucursal para operar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ✅ Lista de sucursales */}
        <div className="max-h-96 overflow-y-auto">
          {processedBranches.map((branch) => (
            <div
              key={branch.id}
              onClick={() => handleBranchSwitch(branch.id)}
              className={`p-4 border-b border-gray-100 transition-all cursor-pointer ${
                branch.isCurrent 
                  ? 'bg-green-50 border-green-200' 
                  : 'hover:bg-gray-50'
              } ${selectedBranchId === branch.id ? 'opacity-75' : ''}`}
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
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate">
                        {branch.address?.split(',')[0] || 'Sin dirección'}
                      </span>
                    </div>
                    
                    {/* Estadísticas en línea */}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Bed className="h-3 w-3 mr-1" />
                        <span>{branch.stats.occupiedRooms}/{branch.stats.totalRooms}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{branch.stats.todayCheckins || 0} check-ins</span>
                      </div>
                      <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        branch.occupancyPercentage >= 80 
                          ? 'bg-green-100 text-green-800'
                          : branch.occupancyPercentage >= 60 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {branch.occupancyPercentage}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ml-4">
                  {switching && selectedBranchId === branch.id ? (
                    <LoadingSpinner size="xs" showMessage={false} />
                  ) : branch.isCurrent ? (
                    <div className="text-green-600 text-sm font-medium">
                      Actual
                    </div>
                  ) : (
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ✅ Footer con acción adicional */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => {
              onClose()
              navigate('/admin/branch-switcher')
            }}
            className="w-full flex items-center justify-center px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4 mr-2" />
            Ver todas las sucursales
          </button>
        </div>
      </div>
    </div>
  )
}

export default BranchSwitcherModal