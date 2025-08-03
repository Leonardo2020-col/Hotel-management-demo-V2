// src/components/dashboard/BranchInfoWidget.jsx
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Users, 
  Bed,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw
} from 'lucide-react';
import { useBranch } from '../../hooks/useBranch';

const BranchInfoWidget = ({ className = '' }) => {
  const {
    selectedBranch,
    getCurrentBranchInfo,
    getCurrentBranchStats
  } = useBranch();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const branchInfo = getCurrentBranchInfo();

  const loadBranchStats = async () => {
    if (!selectedBranch) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const branchStats = await getCurrentBranchStats();
      setStats(branchStats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading branch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranchStats();
  }, [selectedBranch?.id]);

  // Auto-refresh cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      loadBranchStats();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [selectedBranch?.id]);

  if (!selectedBranch || !branchInfo) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No hay sucursal seleccionada</p>
        </div>
      </div>
    );
  }

  const getOccupancyTrend = () => {
    if (!stats?.occupancyRate) return { icon: Minus, color: 'text-gray-500' };
    
    if (stats.occupancyRate >= 80) return { icon: TrendingUp, color: 'text-green-600' };
    if (stats.occupancyRate <= 50) return { icon: TrendingDown, color: 'text-red-600' };
    return { icon: Minus, color: 'text-yellow-600' };
  };

  const occupancyTrend = getOccupancyTrend();

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {branchInfo.name}
              </h3>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                {branchInfo.location}
              </div>
            </div>
          </div>
          
          <button
            onClick={loadBranchStats}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Ocupación */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Ocupación</span>
                <occupancyTrend.icon className={`w-4 h-4 ${occupancyTrend.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.occupancyRate || 0}%
              </div>
              <div className="text-xs text-gray-500">
                {stats?.currentGuests || 0} de {branchInfo.rooms} habitaciones
              </div>
            </div>

            {/* Huéspedes Actuales */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Huéspedes</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.currentGuests || 0}
              </div>
              <div className="text-xs text-gray-500">
                huéspedes activos
              </div>
            </div>

            {/* Habitaciones Disponibles */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Disponibles</span>
                <Bed className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.availableRooms || 0}
              </div>
              <div className="text-xs text-gray-500">
                habitaciones libres
              </div>
            </div>

            {/* Ingresos del Día */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Ingresos Hoy</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                S/ {(stats?.revenue || 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                ingresos del día
              </div>
            </div>
          </div>

          {/* Actividad del Día */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Actividad de Hoy
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Check-ins</span>
                <span className="text-sm font-medium text-green-600">
                  +{stats?.checkInsToday || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Check-outs</span>
                <span className="text-sm font-medium text-blue-600">
                  -{stats?.checkOutsToday || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Branch Info */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Información de la Sucursal
            </h4>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                {branchInfo.phone}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                Gerente: {branchInfo.manager}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {branchInfo.features?.slice(0, 3).map((feature, index) => (
                  <span
                    key={index}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                  >
                    {feature}
                  </span>
                ))}
                {branchInfo.features?.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{branchInfo.features.length - 3} más
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Last Updated */}
          {lastUpdated && (
            <div className="border-t border-gray-100 pt-3 mt-4">
              <p className="text-xs text-gray-500 text-center">
                Última actualización: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BranchInfoWidget;