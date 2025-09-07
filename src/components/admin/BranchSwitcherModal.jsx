import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../lib/supabase-admin';
import toast from 'react-hot-toast';
import {
  Building,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowRight,
  Star,
  Activity,
  DollarSign,
  Bed
} from 'lucide-react';

const BranchSwitcherModal = ({ isOpen, onClose }) => {
  const { userInfo, isAdmin, getUserBranches, getPrimaryBranch, refreshUserInfo } = useAuth();
  const [branches, setBranches] = useState([]);
  const [branchStats, setBranchStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(null);

  const userBranches = getUserBranches();
  const currentBranch = getPrimaryBranch();

  useEffect(() => {
    if (isOpen && isAdmin()) {
      loadBranchesData();
    }
  }, [isOpen]);

  const loadBranchesData = async () => {
    setLoading(true);
    try {
      // Cargar todas las sucursales para administradores
      const branchesResult = await adminService.getAllBranches();
      const activeBranches = branchesResult.data?.filter(b => b.is_active) || [];
      setBranches(activeBranches);

      // Cargar estadísticas básicas de cada sucursal
      const statsPromises = activeBranches.map(async (branch) => {
        try {
          // Simulamos estadísticas básicas - en la implementación real usarías el servicio real
          return {
            branchId: branch.id,
            stats: {
              totalRooms: Math.floor(Math.random() * 50) + 10,
              occupiedRooms: Math.floor(Math.random() * 30) + 5,
              todayRevenue: Math.floor(Math.random() * 5000) + 1000,
              todayCheckins: Math.floor(Math.random() * 10) + 1
            }
          };
        } catch (error) {
          console.warn(`Error loading stats for branch ${branch.id}:`, error);
          return { branchId: branch.id, stats: {} };
        }
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap = {};
      statsResults.forEach(({ branchId, stats }) => {
        statsMap[branchId] = stats;
      });
      setBranchStats(statsMap);

    } catch (error) {
      console.error('Error loading branches data:', error);
      toast.error('Error al cargar las sucursales');
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSwitch = async (branchId) => {
    if (!isAdmin()) {
      toast.error('Solo los administradores pueden cambiar de sucursal');
      return;
    }

    if (branchId === currentBranch?.id) {
      toast.info('Ya estás en esa sucursal');
      return;
    }

    setSwitching(true);
    setSelectedBranchId(branchId);

    try {
      // Actualizar la sucursal principal del usuario
      const result = await adminService.updateUser(userInfo.id, {
        branch_ids: [branchId], // Solo asignar la nueva sucursal
        primary_branch_id: branchId
      });

      if (result.error) {
        throw result.error;
      }

      // Refrescar la información del usuario
      await refreshUserInfo();

      const newBranch = branches.find(b => b.id === branchId);
      toast.success(`Cambiado a: ${newBranch?.name}`);
      
      // Cerrar modal después de un breve delay
      setTimeout(() => {
        onClose();
        // Recargar la página para aplicar el cambio completo
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Error switching branch:', error);
      toast.error('Error al cambiar de sucursal');
    } finally {
      setSwitching(false);
      setSelectedBranchId(null);
    }
  };

  if (!isOpen) return null;

  // Solo mostrar para administradores con acceso múltiple
  if (!isAdmin() || userBranches.length <= 1) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <div className="text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Cambio de Sucursal No Disponible
            </h3>
            <p className="text-gray-600 mb-4">
              {!isAdmin() 
                ? 'Solo los administradores pueden cambiar de sucursal.'
                : 'Solo tienes acceso a una sucursal.'
              }
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Cambiar Sucursal</h3>
            <p className="text-gray-600">
              Selecciona la sucursal desde la cual quieres trabajar
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadBranchesData}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actualizar datos"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Sucursal actual */}
        {currentBranch && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Sucursal Actual</p>
                <p className="text-lg font-bold text-blue-600">{currentBranch.name}</p>
              </div>
              <div className="ml-auto">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Star className="h-3 w-3 mr-1" />
                  Activa
                </span>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Cargando sucursales...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map((branch) => {
              const stats = branchStats[branch.id] || {};
              const isCurrentBranch = branch.id === currentBranch?.id;
              const isSwitching = switching && selectedBranchId === branch.id;
              const occupancyRate = stats.totalRooms > 0 
                ? ((stats.occupiedRooms / stats.totalRooms) * 100).toFixed(1)
                : 0;

              return (
                <div
                  key={branch.id}
                  className={`relative border rounded-xl p-4 transition-all duration-200 ${
                    isCurrentBranch 
                      ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md cursor-pointer'
                  }`}
                  onClick={() => !isCurrentBranch && !switching && handleBranchSwitch(branch.id)}
                >
                  {/* Header de la sucursal */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        isCurrentBranch ? 'bg-blue-600' : 'bg-gray-500'
                      }`}>
                        <Building className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <h4 className={`font-semibold ${isCurrentBranch ? 'text-blue-900' : 'text-gray-900'}`}>
                          {branch.name}
                        </h4>
                        {branch.address && (
                          <div className="flex items-center text-xs text-gray-600 mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="truncate">{branch.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {isCurrentBranch ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Actual
                      </span>
                    ) : (
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>

                  {/* Estadísticas rápidas */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600">Habitaciones</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {stats.totalRooms || 0}
                          </p>
                        </div>
                        <Bed className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600">Ocupación</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {occupancyRate}%
                          </p>
                        </div>
                        <Activity className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="h-3 w-3 mr-1" />
                      <span>S/. {(stats.todayRevenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-3 w-3 mr-1" />
                      <span>{stats.todayCheckins || 0} check-ins</span>
                    </div>
                  </div>

                  {/* Gerente */}
                  {branch.manager_name && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600">
                        Gerente: <span className="font-medium">{branch.manager_name}</span>
                      </p>
                    </div>
                  )}

                  {/* Overlay de carga */}
                  {isSwitching && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl">
                      <div className="flex items-center">
                        <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                        <span className="ml-2 text-blue-600 font-medium">Cambiando...</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {branches.length === 0 && !loading && (
          <div className="text-center py-8">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No hay sucursales disponibles</h4>
            <p className="text-gray-600">
              No se encontraron sucursales activas para mostrar.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {branches.length > 0 && (
              <span>{branches.length} sucursal{branches.length !== 1 ? 'es' : ''} disponible{branches.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={switching}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {switching ? 'Procesando...' : 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BranchSwitcherModal;