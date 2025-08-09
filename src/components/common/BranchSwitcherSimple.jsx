// src/components/common/BranchSwitcherSimple.jsx - COMPONENTE SIMPLE PARA HEADER
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ChevronDown, 
  Check, 
  MapPin, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../hooks/useBranch';

const BranchSwitcherSimple = () => {
  const { selectedBranch, user } = useAuth();
  const { 
    availableBranches, 
    branchesLoading, 
    switchToBranch,
    refreshAvailableBranches 
  } = useBranch();
  
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState(null);

  // Solo mostrar para administradores
  if (user?.role !== 'admin') {
    return null;
  }

  const handleBranchChange = async (branch) => {
    if (switching || branch.id === selectedBranch?.id) {
      setIsOpen(false);
      return;
    }

    try {
      setSwitching(true);
      setError(null);
      
      console.log('🔄 Switching to branch:', branch.name);
      
      const result = await switchToBranch(branch);
      
      if (result.success) {
        console.log('✅ Branch switched successfully');
        setIsOpen(false);
      } else {
        throw new Error(result.error || 'Error al cambiar de sucursal');
      }
      
    } catch (error) {
      console.error('Error switching branch:', error);
      setError(error.message);
    } finally {
      setSwitching(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshAvailableBranches();
      setError(null);
    } catch (error) {
      setError('Error al actualizar sucursales');
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching || branchesLoading}
        className={`
          flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200 min-w-48
          ${switching ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <Building2 className="w-4 h-4 text-gray-600" />
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-gray-900 truncate">
            {selectedBranch?.name || 'Seleccionar Sucursal'}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {selectedBranch?.location || 'No seleccionada'}
          </div>
        </div>
        
        {switching ? (
          <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
        ) : (
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          {/* Header */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Cambiar Sucursal</h3>
              <button
                onClick={handleRefresh}
                disabled={branchesLoading}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Actualizar"
              >
                <RefreshCw className={`w-4 h-4 ${branchesLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border-b border-red-100">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {branchesLoading && (
            <div className="p-4 text-center">
              <RefreshCw className="w-5 h-5 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Cargando sucursales...</p>
            </div>
          )}

          {/* Branch List */}
          {!branchesLoading && availableBranches.length > 0 && (
            <div className="py-1">
              {availableBranches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => handleBranchChange(branch)}
                  disabled={switching}
                  className={`
                    w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 
                    focus:outline-none transition-colors flex items-center justify-between
                    ${selectedBranch?.id === branch.id ? 'bg-blue-50' : ''}
                    ${switching ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex-1 min-w-0">
                    {/* Branch Name */}
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 truncate">{branch.name}</span>
                      {selectedBranch?.id === branch.id && (
                        <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{branch.location}</span>
                    </div>

                    {/* Code */}
                    {branch.code && (
                      <div className="text-xs text-gray-500 mt-1">
                        Código: {branch.code}
                      </div>
                    )}
                  </div>

                  {switching && selectedBranch?.id === branch.id && (
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin ml-2 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!branchesLoading && availableBranches.length === 0 && (
            <div className="p-4 text-center">
              <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No hay sucursales disponibles</p>
            </div>
          )}

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              {availableBranches.length} sucursal{availableBranches.length !== 1 ? 'es' : ''} disponible{availableBranches.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Click Outside Handler */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default BranchSwitcherSimple;