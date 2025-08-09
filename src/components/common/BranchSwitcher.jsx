// src/components/common/BranchSwitcher.jsx - VERSIÓN DEFINITIVA SIN REFRESH
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
  
  // 🔧 REFERENCIAS CRÍTICAS ANTI-REFRESH
  const dropdownRef = useRef(null);
  const operationLock = useRef(false);
  const timeoutRef = useRef(null);
  const mountedRef = useRef(true);

  // 🛡️ PREVENIR ABSOLUTAMENTE TODOS LOS REFRESHES
  const preventAllRefresh = useCallback((e) => {
    if (!e) return false;
    
    try {
      // Prevenir comportamientos por defecto
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      
      // Prevenir submit de forms
      if (e.type === 'submit' || e.target?.tagName === 'FORM') {
        console.warn('🚫 Form submit prevented');
        return false;
      }
      
      // Prevenir navegación de links
      if (e.target?.tagName === 'A' || e.target?.closest('a')) {
        console.warn('🚫 Link navigation prevented');
        return false;
      }
      
      // Prevenir teclas que pueden causar navegación
      if (e.key === 'Enter' || e.key === ' ') {
        return false;
      }
      
    } catch (error) {
      console.warn('Error in preventAllRefresh:', error);
    }
    
    return false;
  }, []);

  // 🔧 SAFE WRAPPER PARA TODOS LOS HANDLERS
  const createSafeHandler = useCallback((handler) => {
    return (e) => {
      preventAllRefresh(e);
      
      if (!mountedRef.current) {
        console.warn('🚫 Component unmounted, ignoring event');
        return false;
      }
      
      try {
        handler(e);
      } catch (error) {
        console.error('Error in safe handler:', error);
        setError('Error en la operación');
      }
      
      return false;
    };
  }, [preventAllRefresh]);

  // 🔧 TOGGLE DROPDOWN ULTRA-SEGURO
  const handleDropdownToggle = createSafeHandler(() => {
    if (switching || loading || operationLock.current) {
      console.log('🚫 Toggle blocked - operation in progress');
      return;
    }
    
    console.log('🔄 Toggling dropdown from', isOpen, 'to', !isOpen);
    setIsOpen(prev => !prev);
  });

  // 🔧 CAMBIO DE SUCURSAL ULTRA-SEGURO
  const handleBranchChange = createSafeHandler(async (e) => {
    const branchId = e.currentTarget?.dataset?.branchId;
    const branchName = e.currentTarget?.dataset?.branchName;
    
    console.log('🏢 Branch change initiated:', { branchId, branchName });
    
    // VERIFICACIONES MÚLTIPLES
    if (!branchId || 
        switching || 
        operationLock.current || 
        !canChangeBranch() || 
        loading) {
      console.log('❌ Branch change blocked:', { 
        branchId: !!branchId,
        switching, 
        operationLock: operationLock.current,
        canChangeBranch: canChangeBranch(), 
        loading 
      });
      return;
    }

    // TRIPLE LOCK SYSTEM
    setSwitching(true);
    operationLock.current = true;
    setError(null);
    
    // TIMEOUT DE SEGURIDAD
    timeoutRef.current = setTimeout(() => {
      console.error('⏰ TIMEOUT: Branch change taking too long');
      if (mountedRef.current) {
        setError('Timeout: Operación demoró demasiado');
        setSwitching(false);
        operationLock.current = false;
      }
    }, 8000);
    
    try {
      console.log('📞 Calling changeBranch with MAXIMUM protection...');
      
      const result = await changeBranch(parseInt(branchId));
      
      console.log('✅ Branch change result:', result);
      
      if (!mountedRef.current) {
        console.warn('Component unmounted during operation');
        return;
      }
      
      if (result?.success) {
        setIsOpen(false);
        console.log('🎉 SUCCESS: Branch changed without refresh!');
        
        // Pequeña pausa para asegurar estado actualizado
        setTimeout(() => {
          if (mountedRef.current) {
            setSwitching(false);
            operationLock.current = false;
          }
        }, 500);
      } else {
        throw new Error(result?.error || 'Error desconocido al cambiar sucursal');
      }
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR in branch change:', error);
      if (mountedRef.current) {
        setError(error.message || 'Error al cambiar sucursal');
        setSwitching(false);
        operationLock.current = false;
      }
    } finally {
      // Limpiar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  });

  // 🔧 REFRESH SEGURO
  const handleRefresh = createSafeHandler(async () => {
    try {
      await refreshAvailableBranches();
    } catch (error) {
      console.error('Error refreshing branches:', error);
      setError('Error al actualizar sucursales');
    }
  });

  // 🔧 CLOSE SEGURO
  const handleClose = createSafeHandler(() => {
    setIsOpen(false);
  });

  // 🔧 CLEAR ERROR SEGURO
  const handleClearError = createSafeHandler(() => {
    setError(null);
  });

  // Cerrar dropdown al hacer clic fuera
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

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      operationLock.current = false;
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
      {/* 🛡️ BOTÓN PRINCIPAL ULTRA-PROTEGIDO */}
      <div
        onMouseDown={handleDropdownToggle}
        onTouchStart={handleDropdownToggle}
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
        {(switching || operationLock.current) ? (
          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
        ) : (
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 z-50">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <X 
              className="w-3 h-3 cursor-pointer hover:text-red-900" 
              onMouseDown={handleClearError}
            />
          </div>
        </div>
      )}

      {/* 🛡️ DROPDOWN ULTRA-PROTEGIDO */}
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
                  🛡️ Cambiar Sucursal (Anti-Refresh)
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
                  data-branch-id={branch.id}
                  data-branch-name={branch.name}
                  onMouseDown={handleBranchChange}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 cursor-pointer select-none ${
                    isSelected 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                      : ''
                  } ${(switching || operationLock.current) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        {(switching || operationLock.current) && !isSelected && (
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
                          {branch.rooms_count || 0} habitaciones
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
              🛡️ Protección Anti-Refresh Activa - Sin recargas de página
            </p>
            {(switching || operationLock.current) && (
              <p className="text-xs text-blue-600 text-center mt-1">
                🔄 Cambiando sucursal...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchSwitcher;