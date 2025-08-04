// src/components/common/BranchSwitcherFailSafe.jsx - VERSIÓN FAIL-SAFE
import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const BranchSwitcherFailSafe = ({ className = '' }) => {
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
  const [error, setError] = useState(null);
  
  // Referencias para máxima protección anti-refresh
  const dropdownRef = useRef(null);
  const switchingRef = useRef(false);
  const timeoutRef = useRef(null);

  // 🛡️ FUNCIÓN ULTRA-SEGURA PARA PREVENIR REFRESHES
  const preventAllDefaults = useCallback((e) => {
    if (e) {
      // Prevenir TODO tipo de comportamiento por defecto
      e.preventDefault?.();
      e.stopPropagation?.();
      e.stopImmediatePropagation?.();
      
      // Si es un form submit, forzar prevención
      if (e.type === 'submit') {
        return false;
      }
    }
    return false;
  }, []);

  // 🛡️ WRAPPER ULTRA-SEGURO PARA TODOS LOS CLICKS
  const safeClickHandler = useCallback((callback) => {
    return (e) => {
      console.log('🛡️ Safe click handler triggered:', e.target.tagName, e.type);
      
      // Prevenir absolutamente TODO
      preventAllDefaults(e);
      
      // Verificar que no estamos en un form
      const form = e.target.closest('form');
      if (form) {
        console.error('⚠️ Click inside form detected! This could cause refresh!');
        return false;
      }
      
      // Verificar que no es un link
      if (e.target.tagName === 'A' || e.target.closest('a')) {
        console.error('⚠️ Link click detected! This could cause refresh!');
        return false;
      }
      
      // Ejecutar callback solo si es seguro
      try {
        callback(e);
      } catch (error) {
        console.error('🚨 Error in click handler:', error);
      }
      
      return false;
    };
  }, [preventAllDefaults]);

  // 🔧 TOGGLE DROPDOWN ULTRA-SEGURO
  const handleDropdownToggle = useCallback(safeClickHandler((e) => {
    console.log('🔄 Dropdown toggle - current state:', isOpen);
    
    if (switching || loading || switchingRef.current) {
      console.log('🚫 Dropdown toggle blocked - operation in progress');
      return;
    }
    
    setIsOpen(!isOpen);
  }), [isOpen, switching, loading, safeClickHandler]);

  // 🔧 CAMBIO DE SUCURSAL ULTRA-SEGURO
  const handleBranchChange = useCallback(safeClickHandler(async (e) => {
    const branchId = e.currentTarget.dataset.branchId;
    const branchName = e.currentTarget.dataset.branchName;
    
    console.log('🏢 ULTRA-SAFE branch change initiated:', branchName);
    
    // Verificaciones múltiples
    if (!branchId || switching || switchingRef.current || !canChangeBranch() || loading) {
      console.log('❌ Branch change blocked:', { 
        branchId: !!branchId,
        switching, 
        switchingRef: switchingRef.current,
        canChangeBranch: canChangeBranch(), 
        loading 
      });
      return;
    }

    // Buscar branch data
    const branch = availableBranches.find(b => b.id.toString() === branchId);
    if (!branch) {
      console.error('❌ Branch not found:', branchId);
      return;
    }

    // Locks múltiples para prevenir ejecuciones duplicadas
    setSwitching(true);
    switchingRef.current = true;
    setError(null);
    
    // Timeout de seguridad
    timeoutRef.current = setTimeout(() => {
      console.error('⏰ Branch change timeout - resetting states');
      setSwitching(false);
      switchingRef.current = false;
      setError('Timeout: La operación demoró demasiado');
    }, 15000);
    
    try {
      console.log('📞 Calling changeBranch function...');
      
      const result = await changeBranch(branch.id);
      
      console.log('✅ Branch change result:', result);
      
      if (result.success) {
        setIsOpen(false);
        console.log('🎉 Branch successfully changed to:', branch.name);
      } else {
        throw new Error(result.error || 'Error al cambiar de sucursal');
      }
      
    } catch (error) {
      console.error('❌ Error changing branch:', error);
      setError(error.message);
    } finally {
      // Limpiar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Liberar locks con delay
      setTimeout(() => {
        setSwitching(false);
        switchingRef.current = false;
      }, 1000);
    }
  }), [availableBranches, changeBranch, canChangeBranch, switching, loading, safeClickHandler]);

  // 🔧 REFRESH ULTRA-SEGURO
  const handleRefresh = useCallback(safeClickHandler(async () => {
    try {
      await refreshAvailableBranches();
    } catch (error) {
      console.error('Error refreshing branches:', error);
      setError('Error al actualizar sucursales');
    }
  }), [refreshAvailableBranches, safeClickHandler]);

  // 🔧 CLOSE ULTRA-SEGURO
  const handleClose = useCallback(safeClickHandler(() => {
    setIsOpen(false);
  }), [safeClickHandler]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      switchingRef.current = false;
    };
  }, []);

  const getBranchStats = (branchId) => {
    return branchStats[branchId] || {
      occupancyRate: 0,
      currentGuests: 0,
      totalRooms: 0
    };
  };

  // Componente para usuarios sin permisos
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

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 🛡️ BOTÓN ULTRA-SEGURO */}
      <div
        onClick={handleDropdownToggle}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer min-w-[200px]"
        style={{ 
          outline: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
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
        {(switching || switchingRef.current) ? (
          <RefreshCw className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
        ) : (
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 z-50">
          {error}
          <div 
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700 inline cursor-pointer"
          >
            <X className="w-3 h-3 inline" />
          </div>
        </div>
      )}

      {/* 🛡️ DROPDOWN ULTRA-SEGURO */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-hidden"
          style={{ 
            WebkitUserSelect: 'none',
            userSelect: 'none'
          }}
        >
          {/* Header */}
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
                <div
                  onClick={handleRefresh}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title="Actualizar"
                >
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div
                  onClick={handleClose}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Branch List */}
          <div className="max-h-80 overflow-y-auto">
            {availableBranches.map((branch) => {
              const stats = getBranchStats(branch.id);
              const isSelected = isBranchSelected(branch.id);
              
              return (
                <div
                  key={branch.id}
                  data-branch-id={branch.id}
                  data-branch-name={branch.name}
                  onClick={handleBranchChange}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                      : ''
                  } ${(switching || switchingRef.current) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ 
                    outline: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none'
                  }}
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
                        {(switching || switchingRef.current) && !isSelected && (
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
                </div>
              );
            })}
          </div>
          
          {/* Footer */}
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              🛡️ Versión Anti-Refresh - Los datos se actualizarán sin recargar la página
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchSwitcherFailSafe;