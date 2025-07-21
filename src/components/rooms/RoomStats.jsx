// src/components/rooms/RoomStats.jsx - ESTADÍSTICAS SIMPLIFICADAS
import React from 'react';
import { Bed, Users, Sparkles, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const RoomStats = ({ stats, roomsByType = [], loading = false }) => {
  // Validación para stats undefined o null
  const safeStats = stats || {
    total: 0,
    available: 0,
    occupied: 0,
    needsCleaning: 0,
    occupancyRate: 0,
    revenue: {
      today: 0,
      thisMonth: 0,
      average: 0
    }
  };

  // ESTADÍSTICAS SIMPLIFICADAS - Solo 3 estados
  const mainStats = [
    {
      title: 'Total Habitaciones',
      value: safeStats.total,
      icon: Bed,
      color: 'blue',
      description: 'Habitaciones totales'
    },
    {
      title: 'Disponibles',
      value: safeStats.available,
      icon: CheckCircle,
      color: 'green',
      description: 'Limpias y listas'
    },
    {
      title: 'Ocupadas',
      value: safeStats.occupied,
      icon: Users,
      color: 'blue',
      description: 'Con huéspedes'
    },
    {
      title: 'Necesitan Limpieza',
      value: safeStats.needsCleaning,
      icon: AlertTriangle,
      color: 'orange',
      description: 'Click para limpiar'
    },
    {
      title: 'Tasa de Ocupación',
      value: `${safeStats.occupancyRate}%`,
      icon: TrendingUp,
      color: 'purple',
      description: 'Porcentaje actual'
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'text-blue-600 bg-blue-50',
      green: 'text-green-600 bg-green-50',
      purple: 'text-purple-600 bg-purple-50',
      orange: 'text-orange-600 bg-orange-50'
    };
    return colorMap[color] || 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="mt-4">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* MENSAJE DE EXPLICACIÓN DEL NUEVO SISTEMA */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-6 h-6 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Sistema de Limpieza Simplificado</h3>
            <p className="text-blue-700 text-sm mt-1">
              Solo 3 estados: <strong>Disponible</strong> (verde), <strong>Ocupada</strong> (azul), 
              <strong>Necesita Limpieza</strong> (naranja). Haz click en las habitaciones naranjas para marcarlas como limpias.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid Simplificado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {mainStats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = getColorClasses(stat.color);
          
          return (
            <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              {/* Indicador especial para habitaciones que necesitan limpieza */}
              {stat.title === 'Necesitan Limpieza' && stat.value > 0 && (
                <div className="mt-3 p-2 bg-orange-100 border border-orange-300 rounded text-center">
                  <p className="text-xs font-medium text-orange-800">
                    🧹 Click en las habitaciones naranjas
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Revenue Summary */}
      {safeStats.revenue && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen de Ingresos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-1">Hoy</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(safeStats.revenue.today)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-1">Este Mes</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(safeStats.revenue.thisMonth)}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-purple-800 mb-1">Promedio Diario</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(safeStats.revenue.average)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions para Limpieza */}
      {safeStats.needsCleaning > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-orange-900 mb-2">
                🧹 Acción Requerida: {safeStats.needsCleaning} habitación{safeStats.needsCleaning > 1 ? 'es' : ''} necesitan limpieza
              </h3>
              <p className="text-orange-700 text-sm">
                Ve al grid de habitaciones y haz click en las habitaciones naranjas para marcarlas como limpias
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {safeStats.needsCleaning}
              </div>
              <div className="text-orange-700 text-sm font-medium">Pendientes</div>
            </div>
          </div>
          
          {/* Barra de progreso */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-orange-700 mb-1">
              <span>Progreso de limpieza</span>
              <span>
                {safeStats.total - safeStats.needsCleaning} de {safeStats.total} limpias
              </span>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${safeStats.total > 0 ? ((safeStats.total - safeStats.needsCleaning) / safeStats.total) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Estado Ideal: Todas las habitaciones limpias */}
      {safeStats.needsCleaning === 0 && safeStats.total > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
          <h3 className="text-lg font-bold text-green-900 mb-2">
            ✨ ¡Excelente! Todas las habitaciones están limpias
          </h3>
          <p className="text-green-700">
            {safeStats.available} habitaciones disponibles y {safeStats.occupied} ocupadas
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && safeStats.total === 0 && (
        <div className="text-center py-12">
          <Bed className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay habitaciones registradas
          </h3>
          <p className="text-gray-600">
            Comienza agregando tu primera habitación al sistema
          </p>
        </div>
      )}
    </div>
  );
};

export default RoomStats;