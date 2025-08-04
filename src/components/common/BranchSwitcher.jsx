// src/components/common/BranchSwitcher.jsx - VERSIÓN ANTI-REFRESH DEFINITIVA
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
  const [error, setError] = useState(null);
  
  // 🔧 REFERENCIAS CRÍTICAS PARA PREVENIR REFRESH
  const dropdownRef = useRef(null);
  const operationInProgress = useRef(false);
  const timeoutRef = useRef(null);

  // 🛡️ FUNCIÓN ULTRA-SEGURA PARA PREVENIR TODOS LOS REFRESHES
  const preventAllEvents = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      // Prevenir submit de formularios
      if (e.type === 'submit') {
        return false;
      }
      
      // Prevenir navegación de enlaces
      if (e.target?.tagName === 'A' || e.target?.closest('a')) {
        return false;
      }
    }
    return false;
  }, []);

  // 🔧 TOGGLE DROPDOWN ULTRA-SEGURO
  const handleDropdownToggle = useCallback((e) => {
    preventAllEvents(e);
    
    if (switching || loading || operationInProgress.current) {
      console.log('🚫 Dropdown toggle blocked - operation in progress');
      return false;
    }
    
    setIsOpen(prev => !prev);
    return false;
  }, [switching, loading, preventAllEvents]);

  // 🔧 CAMBIO DE SUCURSAL ULTRA-SEGURO
  const handleBranchChange = useCallback(async (e, branchId) => {
    preventAllEvents(e);
    
    console.log('🏢 ANTI-REFRESH branch change initiated for ID:', branchId);
    
    // VERIFICACIONES MÚLTIPLES
    if (
      switching || 
      operationInProgress.current || 
      !canChangeBranch() || 
      loading ||
      !branchId
    ) {
      console.log('❌ Branch change blocked:', { 
        switching, 
        operationInProgress: operationInProgress.current,
        canChangeBranch: canChangeBranch(), 
        loading,
        branchId
      });
      return false;
    }

    // LOCKS MÚLTIPLES
    setSwitching(true);
    operationInProgress.current = true;
    setError(null);
    
    // TIMEOUT DE SEGURIDAD
    timeoutRef.current = setTimeout(() => {
      console.error('⏰ Branch change timeout - resetting locks');
      setSwitching(false);
      operationInProgress.current = false;
      setError('Timeout: La operación demoró demasiado');
    }, 10000);
    
    try {
      console.log('📞 Calling changeBranch with ANTI-REFRESH protection...');
      
      const result = await changeBranch(branchId);
      
      console.log('✅ Branch change result:', result);
      
      if (result.success) {
        setIsOpen(false);
        console.log('🎉 Branch successfully changed - NO REFRESH');
        
        // Limpiar locks después de éxito
        setTimeout(() => {
          setSwitching(false);
          operationInProgress.current = false;
        }, 1000);
      } else {
        throw new Error(result.error || 'Error al cambiar de sucursal');
      }
      
    } catch (error) {
      console.error('❌ Error in ANTI-REFRESH branch change:', error);
      setError(error.message);
      setSwitching(false);
      operationInProgress.current = false;
    } finally {
      // Limpiar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
    
    return false;
  }, [changeBranch, canChangeBranch, switching, loading, preventAllEvents]);

  // 🔧 REFRESH ULTRA-SEGURO
  const handleRefresh = useCallback(async (e) => {
    preventAllEvents(e);
    
    try {
      await refreshAvailableBranches();
    } catch (error) {
      console.error('Error refreshing branches:', error);
      setError('Error al actualizar sucursales');
    }
    
    return false;
  }, [refreshAvailableBranches, preventAllEvents]);

  // 🔧 CLOSE ULTRA-SEGURO
  const handleClose = useCallback((e) => {
    preventAllEvents(e);
    setIsOpen(false);
    return false;
  }, [preventAllEvents]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      operationInProgress.current = false;
    };
  }, []);

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
      {/* 🛡️ BOTÓN PRINCIPAL ULTRA-SEGURO */}
      <div
        onMouseDown={handleDropdownToggle}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer min-w-[200px] select-none"
        style={{ 
          outline: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent'
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
        {(switching || operationInProgress.current) ? (
          <RefreshCw className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
        ) : (
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 z-50">
          {error}
          <span 
            onMouseDown={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700 cursor-pointer"
          >
            <X className="w-3 h-3 inline" />
          </span>
        </div>
      )}

      {/* 🛡️ DROPDOWN ULTRA-SEGURO */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-hidden select-none"
          style={{ 
            WebkitUserSelect: 'none',
            userSelect: 'none',
            WebkitTouchCallout: 'none'
          }}
        >
          {/* Header */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  🛡️ Anti-Refresh Branch Switcher
                </h3>
                <p className="text-xs text-gray-500">
                  {availableBranches.length} sucursal{availableBranches.length !== 1 ? 'es' : ''} disponible{availableBranches.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex space-x-1">
                <div
                  onMouseDown={handleRefresh}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title="Actualizar"
                >
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div
                  onMouseDown={handleClose}
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
              const isSelected = isBranchSelected(branch.id);
              
              return (
                <div
                  key={branch.id}
                  onMouseDown={(e) => handleBranchChange(e, branch.id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 cursor-pointer select-none ${
                    isSelected 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                      : ''
                  } ${(switching || operationInProgress.current) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ 
                    outline: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                    WebkitTouchCallout: 'none'
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
                        {(switching || operationInProgress.current) && !isSelected && (
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
                          Habitaciones disponibles
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                            Activa
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
              🛡️ Sin refresh - Los datos se actualizarán sin recargar la página
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchSwitcher;