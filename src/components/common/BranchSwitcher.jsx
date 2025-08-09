// src/components/common/BranchSwitcher.jsx - NUEVO MÉTODO PARA CAMBIO DE SUCURSAL
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ChevronDown, 
  Check, 
  MapPin, 
  Users, 
  Bed,
  RefreshCw,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/supabase';

const BranchSwitcher = ({ 
  className = "",
  showInHeader = true,
  variant = "dropdown" // "dropdown" | "modal" | "sidebar"
}) => {
  const { user, selectedBranch, selectBranch, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState(null);

  // Solo mostrar para administradores
  if (user?.role !== 'admin') {
    return null;
  }

  // Cargar sucursales disponibles
  useEffect(() => {
    loadAvailableBranches();
  }, []);

  const loadAvailableBranches = async () => {
    try {
      setBranchesLoading(true);
      setError(null);
      
      console.log('🏢 Loading branches for switcher...');
      
      const { data: branches, error } = await db.getBranches();
      
      if (error) {
        throw error;
      }
      
      // Obtener estadísticas para cada sucursal
      const branchesWithStats = await Promise.all(
        (branches || []).map(async (branch) => {
          try {
            const { data: stats } = await db.getBranchStats(branch.id);
            return {
              ...branch,
              stats: stats || {
                occupancyRate: 0,
                currentGuests: 0,
                totalRooms: branch.rooms_count || 0
              }
            };
          } catch (error) {
            console.warn(`Error loading stats for branch ${branch.id}:`, error);
            return {
              ...branch,
              stats: {
                occupancyRate: 0,
                currentGuests: 0,
                totalRooms: branch.rooms_count || 0
              }
            };
          }
        })
      );
      
      setAvailableBranches(branchesWithStats);
      console.log(`✅ Loaded ${branchesWithStats.length} branches for switcher`);
      
    } catch (error) {
      console.error('Error loading branches:', error);
      setError('Error al cargar sucursales');
      setAvailableBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  };

  const handleBranchChange = async (branch) => {
    if (switching || branch.id === selectedBranch?.id) {
      return;
    }

    try {
      setSwitching(true);
      setError(null);
      
      console.log('🔄 Switching to branch:', branch.name);
      
      // MÉTODO SIMPLIFICADO - Solo actualizar estado
      const result = await selectBranch(branch);
      
      if (result.success) {
        console.log('✅ Branch switched successfully');
        setIsOpen(false);
        
        // Mostrar notificación de éxito (opcional)
        if (window.showNotification) {
          window.showNotification('success', `Cambiado a ${branch.name}`);
        }
        
        // Recargar datos de la página actual (opcional)
        window.dispatchEvent(new CustomEvent('branchChanged', { 
          detail: { branch } 
        }));
        
      } else {
        throw new Error(result.error || 'Error al cambiar de sucursal');
      }
      
    } catch (error) {
      console.error('Error switching branch:', error);
      setError(error.message);
      
      // Mostrar notificación de error (opcional)
      if (window.showNotification) {
        window.showNotification('error', error.message);
      }
    } finally {
      setSwitching(false);
    }
  };

  const handleRefresh = () => {
    loadAvailableBranches();
  };

  // Renderizar según el variant
  if (variant === "modal") {
    return (
      <BranchSwitcherModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        branches={availableBranches}
        selectedBranch={selectedBranch}
        onBranchChange={handleBranchChange}
        switching={switching}
        loading={branchesLoading}
        error={error}
        onRefresh={handleRefresh}
      />
    );
  }

  // Dropdown por defecto
  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching || branchesLoading}
        className={`
          flex items-center space-x-3 px-4 py-2 bg-white border border-gray-300 rounded-lg
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200 min-w-64
          ${switching ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center space-x-2 flex-1">
          <Building2 className="w-5 h-5 text-gray-600" />
          <div className="text-left">
            <div className="font-medium text-gray-900">
              {selectedBranch?.name || 'Seleccionar Sucursal'}
            </div>
            <div className="text-xs text-gray-500">
              {selectedBranch?.location || 'No seleccionada'}
            </div>
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
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Cambiar Sucursal</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={branchesLoading}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Actualizar"
                >
                  <RefreshCw className={`w-4 h-4 ${branchesLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-100">
              <p className="text-sm text-red-600">{error}</p>
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
            <div className="py-2">
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
                  <div className="flex-1">
                    {/* Branch Name */}
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">{branch.name}</span>
                      {selectedBranch?.id === branch.id && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>{branch.location}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Bed className="w-3 h-3 mr-1" />
                        <span>{branch.stats?.totalRooms || 0} hab.</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        <span>{branch.stats?.currentGuests || 0} huésp.</span>
                      </div>
                      <div className={`px-2 py-1 rounded-full ${getOccupancyColor(branch.stats?.occupancyRate || 0)}`}>
                        {branch.stats?.occupancyRate || 0}% ocup.
                      </div>
                    </div>
                  </div>

                  {switching && selectedBranch?.id === branch.id && (
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin ml-2" />
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
        </div>
      )}
    </div>
  );
};

// Component para Modal variant
const BranchSwitcherModal = ({ 
  isOpen, 
  onClose, 
  branches, 
  selectedBranch, 
  onBranchChange, 
  switching, 
  loading, 
  error,
  onRefresh 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Cambiar Sucursal</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Actualizar"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Cargando sucursales...</p>
            </div>
          )}

          {/* Branch Grid */}
          {!loading && branches.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className={`
                    p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                    ${selectedBranch?.id === branch.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }
                    ${switching ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onClick={() => !switching && onBranchChange(branch)}
                >
                  {/* Branch Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">{branch.name}</span>
                    </div>
                    {selectedBranch?.id === branch.id && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>

                  {/* Location */}
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{branch.location}</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center">
                      <Bed className="w-4 h-4 mr-1 text-gray-500" />
                      <span>{branch.stats?.totalRooms || 0} hab.</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1 text-gray-500" />
                      <span>{branch.stats?.currentGuests || 0} huésp.</span>
                    </div>
                  </div>

                  {/* Occupancy */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Ocupación</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getOccupancyColor(branch.stats?.occupancyRate || 0)}`}>
                        {branch.stats?.occupancyRate || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${branch.stats?.occupancyRate || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Switching Indicator */}
                  {switching && selectedBranch?.id === branch.id && (
                    <div className="mt-3 flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-blue-600 animate-spin mr-2" />
                      <span className="text-sm text-blue-600">Cambiando...</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && branches.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay sucursales disponibles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function
const getOccupancyColor = (rate) => {
  if (rate >= 80) return 'text-green-600 bg-green-100';
  if (rate >= 60) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};

export default BranchSwitcher;