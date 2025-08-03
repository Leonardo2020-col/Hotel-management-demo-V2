// src/components/auth/BranchSelector.jsx - COMPLETAMENTE CONECTADO A SUPABASE
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Users, 
  Bed,
  ArrowRight,
  CheckCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import Button from '../common/Button';
import { db } from '../../lib/supabase';

const BranchSelector = ({ onBranchSelect, loading = false }) => {
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchStats, setBranchStats] = useState({});
  const [error, setError] = useState(null);

  // Cargar sucursales y estadísticas al montar el componente
  useEffect(() => {
    loadBranchesWithStats();
  }, []);

  const loadBranchesWithStats = async () => {
    try {
      setBranchesLoading(true);
      setError(null);
      
      console.log('🏢 Loading branches with stats from Supabase...');
      
      // Obtener todas las sucursales con estadísticas
      const { data: branchesWithStats, error: branchesError } = await db.getAllBranchesWithStats();
      
      if (branchesError) {
        throw branchesError;
      }
      
      if (!branchesWithStats || branchesWithStats.length === 0) {
        setError('No se encontraron sucursales disponibles');
        setBranches([]);
        return;
      }
      
      setBranches(branchesWithStats);
      
      // Cargar estadísticas individuales para cada sucursal
      const statsPromises = branchesWithStats.map(async (branch) => {
        try {
          const { data: stats } = await db.getBranchStats(branch.id);
          return { branchId: branch.id, stats };
        } catch (error) {
          console.warn(`Error loading stats for branch ${branch.id}:`, error);
          return { branchId: branch.id, stats: null };
        }
      });
      
      const statsResults = await Promise.all(statsPromises);
      
      // Crear mapa de estadísticas
      const statsMap = {};
      statsResults.forEach(({ branchId, stats }) => {
        statsMap[branchId] = stats;
      });
      
      setBranchStats(statsMap);
      
      console.log(`✅ Loaded ${branchesWithStats.length} branches with stats`);
      
    } catch (error) {
      console.error('Error loading branches:', error);
      setError(error.message || 'Error al cargar las sucursales');
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  };

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
  };

  const handleContinue = async () => {
    if (selectedBranch && onBranchSelect) {
      try {
        await onBranchSelect(selectedBranch);
      } catch (error) {
        console.error('Error selecting branch:', error);
        setError('Error al seleccionar la sucursal');
      }
    }
  };

  const handleRefresh = () => {
    loadBranchesWithStats();
  };

  const getOccupancyColor = (rate) => {
    if (rate >= 80) return 'text-green-600 bg-green-100';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getBranchStats = (branchId) => {
    return branchStats[branchId] || {
      occupancyRate: 0,
      currentGuests: 0,
      totalRooms: 0,
      todayRevenue: 0
    };
  };

  if (branchesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <RefreshCw className="w-8 h-8 text-white animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cargando Sucursales</h1>
          <p className="text-gray-600">Obteniendo información desde la base de datos...</p>
        </div>
      </div>
    );
  }

  if (error || branches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error al Cargar Sucursales</h1>
          <p className="text-gray-600 mb-6">
            {error || 'No se encontraron sucursales disponibles'}
          </p>
          <Button
            variant="primary"
            onClick={handleRefresh}
            icon={RefreshCw}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Seleccionar Sucursal</h1>
          <p className="text-gray-600 mb-4">
            Elige la sucursal que deseas administrar
          </p>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm text-gray-500">
              {branches.length} sucursal{branches.length !== 1 ? 'es' : ''} disponible{branches.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleRefresh}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Actualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Branch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {branches.map((branch) => {
            const stats = getBranchStats(branch.id);
            
            return (
              <div
                key={branch.id}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-xl ${
                  selectedBranch?.id === branch.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleBranchSelect(branch)}
              >
                {/* Selection Indicator */}
                {selectedBranch?.id === branch.id && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center z-10">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className="p-6">
                  {/* Branch Image Placeholder */}
                  <div className="w-full h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg mb-4 flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-white" />
                  </div>

                  {/* Branch Info */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {branch.name}
                  </h3>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">{branch.location}</span>
                  </div>

                  {/* Branch Code */}
                  <div className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700 mb-3">
                    {branch.code}
                  </div>

                  {/* Address */}
                  {branch.address && (
                    <p className="text-gray-600 text-sm mb-4">
                      {branch.address}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Bed className="w-4 h-4 text-gray-500 mr-1" />
                        <span className="text-lg font-semibold text-gray-900">
                          {stats.totalRooms || branch.rooms_count || 0}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">Habitaciones</span>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Users className="w-4 h-4 text-gray-500 mr-1" />
                        <span className="text-lg font-semibold text-gray-900">
                          {stats.currentGuests || 0}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">Huéspedes</span>
                    </div>
                  </div>

                  {/* Occupancy Rate */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Ocupación</span>
                      <span className={`text-sm px-2 py-1 rounded-full ${getOccupancyColor(stats.occupancyRate || 0)}`}>
                        {stats.occupancyRate || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${stats.occupancyRate || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Revenue Today */}
                  {stats.todayRevenue > 0 && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-700 font-medium">Ingresos Hoy</div>
                      <div className="text-lg font-bold text-green-800">
                        S/ {stats.todayRevenue.toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-700">Servicios:</span>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(branch.features) && branch.features.slice(0, 3).map((feature, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                      {Array.isArray(branch.features) && branch.features.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{branch.features.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Manager Info */}
                  {branch.manager && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500">Gerente</div>
                      <div className="text-sm font-medium text-gray-700">{branch.manager}</div>
                    </div>
                  )}

                  {/* Last Updated */}
                  {stats.lastUpdated && (
                    <div className="mt-4 pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-400">
                        Actualizado: {new Date(stats.lastUpdated).toLocaleTimeString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
          
          <Button
            variant="primary"
            onClick={handleContinue}
            disabled={!selectedBranch || loading}
            loading={loading}
            icon={ArrowRight}
            className="px-8"
          >
            {loading ? 'Configurando...' : 'Continuar'}
          </Button>
        </div>

        {/* Selected Branch Summary */}
        {selectedBranch && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              Sucursal Seleccionada:
            </h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-800 font-medium">{selectedBranch.name}</p>
                <p className="text-blue-600 text-sm">{selectedBranch.location}</p>
                <p className="text-blue-600 text-xs">Código: {selectedBranch.code}</p>
              </div>
              <div className="text-right">
                {(() => {
                  const stats = getBranchStats(selectedBranch.id);
                  return (
                    <>
                      <p className="text-blue-800 text-sm">
                        {stats.currentGuests}/{stats.totalRooms || selectedBranch.rooms_count || 0} ocupadas
                      </p>
                      <p className="text-blue-600 text-sm">
                        {stats.occupancyRate || 0}% ocupación
                      </p>
                      {stats.todayRevenue > 0 && (
                        <p className="text-blue-600 text-xs">
                          S/ {stats.todayRevenue.toLocaleString()} hoy
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Datos actualizados en tiempo real desde la base de datos
          </p>
        </div>
      </div>
    </div>
  );
};

export default BranchSelector;