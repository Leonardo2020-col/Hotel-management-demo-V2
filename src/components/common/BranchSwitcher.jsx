// src/components/common/BranchSwitcher.jsx - VERSIÓN CORREGIDA SIN REFRESH
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  ChevronDown, 
  MapPin, 
  Users, 
  Check,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';
import { useBranch } from '../../hooks/useBranch';

const BranchSwitcher = ({ className = '' }) => {
  const {
    selectedBranch,
    availableBranches,
    canChangeBranch,
    changeBranch,
    isBranchSelected,
    loading,
    branchesLoading,
    refreshAvailableBranches
  } = useBranch();

  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [branchStats, setBranchStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState(null);

  // 🔧 PREVENIR COMPORTAMIENTO POR DEFECTO DE FORMULARIOS
  const handleDropdownClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (switching || loading) return;
    setIsOpen(!isOpen);
  }, [isOpen, switching, loading]);

  // Cargar estadísticas cuando se abra el dropdown
  useEffect(() => {
    if (isOpen && availableBranches.length > 0) {
      loadBranchStats();
    }
  }, [isOpen, availableBranches]);

  // Cerrar dropdown cuando se haga clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  const loadBranchStats = async () => {
    if (loadingStats) return;

    try {
      setLoadingStats(true);
      const { db } = await import('../../lib/supabase');
      
      const statsPromises = availableBranches.map(async (branch) => {
        try {
          const { data: stats } = await db.getBranchStats(branch.id);
          return { branchId: branch.id, stats };
        } catch (error) {
          console.warn(`Error loading stats for branch ${branch.id}:`, error);
          return { branchId: branch.id, stats: null };
        }
      });

      const statsResults = await Promise.all(statsPromises);
      
      const statsMap = {};
      statsResults.forEach(({ branchId, stats }) => {
        statsMap[branchId] = stats || {
          occupancyRate: 0,
          currentGuests: 0,
          totalRooms: 0
        };
      });

      setBranchStats(statsMap);
    } catch (error) {
      console.error('Error loading branch stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // 🔧 FUNCIÓN CORREGIDA PARA CAMBIO DE SUCURSAL
  const handleBranchChange = async (e, branch) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔄 Branch change initiated for:', branch.name);
    
    if (switching || !canChangeBranch()) {
      console.log('❌ Branch change blocked:', { switching, canChangeBranch: canChangeBranch() });
      return;
    }

    setSwitching(true);
    setError(null);
    
    try {
      console.log('📞 Calling changeBranch function...');
      const result = await changeBranch(branch.id);
      
      console.log('✅ Branch change result:', result);
      
      if (result.success) {
        setIsOpen(false);
        console.log('🎉 Branch successfully changed to:', branch.name);
        
        // Opcional: Mostrar notificación de éxito
        // showSuccessToast(`Cambiado a ${branch.name}`);
      } else {
        throw new Error(result.error || 'Error al cambiar de sucursal');
      }
      
    } catch (error) {
      console.error('❌ Error changing branch:', error);
      setError(error.message);
      
      // Opcional: Mostrar notificación de error
      // showErrorToast(error.message);
    } finally {
      setSwitching(false);
    }
  };

  const handleRefresh = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await refreshAvailableBranches();
      if (isOpen) {
        await loadBranchStats();
      }
    } catch (error) {
      console.error('Error refreshing branches:', error);
      setError('Error al actualizar sucursales');
    }
  };

  const getBranchStats = (branchId) => {
    return branchStats[branchId] || {
      occupancyRate: 0,
      currentGuests: 0,
      totalRooms: 0
    };
  };

  const closeDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
  };

  // Componente para usuarios sin permisos de cambio
  if (!canChangeBranch() || !selectedBranch) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg ${className}`}>
        <Building2 className="w-4 h-4 text-gray-600" />
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {selectedBranch?.name || 'Sin sucursal'}
          </div>
          <div className="text-gray-500 text-xs">
            {selectedBranch?.location || ''}
          </div>
        </div>
      </div>
    );
  }

  // Estado de carga
  if (branchesLoading) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg ${className}`}>
        <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
        <div className="text-sm">
          <div className="font-medium text-gray-900">Cargando...</div>
          <div className="text-gray-500 text-xs">Obteniendo sucursales</div>
        </div>
      </div>
    );
  }

  // Sin sucursales disponibles
  if (availableBranches.length === 0) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <AlertCircle className="w-4 h-4 text-red-600" />
        <div className="text-sm">
          <div className="font-medium text-red-900">Sin sucursales</div>
          <div className="text-red-600 text-xs">No hay sucursales disponibles</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Branch Selector Button */}
      <button
        type="button"
        onClick={handleDropdownClick}
        disabled={switching || loading}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
      >
        <Building2 className="w-4 h-4 text-gray-600 flex-shrink-0" />
        <div className="text-left flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {selectedBranch?.name || 'Seleccionar sucursal'}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {selectedBranch?.location || ''}
          </div>
        </div>
        {switching ? (
          <RefreshCw className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
        ) : (
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            <X className="w-3 h-3 inline" />
          </button>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Cambiar Sucursal
                </h3>
                <p className="text-xs text-gray-500">
                  {availableBranches.length} sucursal{availableBranches.length !== 1 ? 'es' : ''} disponible{availableBranches.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Actualizar"
                  disabled={branchesLoading || loadingStats}
                >
                  <RefreshCw className={`w-4 h-4 ${(branchesLoading || loadingStats) ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={closeDropdown}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {loadingStats && (
              <div className="p-4 text-center">
                <RefreshCw className="w-5 h-5 text-gray-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500">Cargando estadísticas...</p>
              </div>
            )}
            
            {availableBranches.map((branch) => {
              const stats = getBranchStats(branch.id);
              const isSelected = isBranchSelected(branch.id);
              
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={(e) => handleBranchChange(e, branch)}
                  disabled={switching}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors disabled:opacity-50 border-b border-gray-50 last:border-b-0 ${
                    isSelected 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                      : ''
                  } ${switching ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {branch.name}
                        </h4>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        )}
                        {switching && !isSelected && (
                          <RefreshCw className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{branch.location}</span>
                      </div>

                      <div className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700 mb-2">
                        {branch.code}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center text-gray-600">
                          <Users className="w-3 h-3 mr-1" />
                          {stats.currentGuests}/{stats.totalRooms || branch.rooms_count || 0} ocupadas
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            stats.occupancyRate >= 80 
                              ? 'bg-green-100 text-green-700' 
                              : stats.occupancyRate >= 60 
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {stats.occupancyRate}% ocupación
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              Los datos se actualizarán automáticamente al cambiar de sucursal
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchSwitcher;