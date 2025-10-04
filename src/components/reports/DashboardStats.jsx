import React from 'react';

const StatCard = ({ title, value, subtitle, icon }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      {icon && (
        <div className="text-blue-600 text-3xl">{icon}</div>
      )}
    </div>
  </div>
);

const DashboardStats = ({ stats, formatPercentage }) => {
  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay estadísticas disponibles
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total de Habitaciones"
        value={stats.total_rooms || 0}
        icon="🏨"
      />
      <StatCard
        title="Habitaciones Ocupadas"
        value={stats.occupied_rooms || 0}
        subtitle={`Disponibles: ${stats.available_rooms || 0}`}
        icon="🛏️"
      />
      <StatCard
        title="Tasa de Ocupación"
        value={formatPercentage(stats.occupancy_rate)}
        icon="📊"
      />
      <StatCard
        title="En Mantenimiento"
        value={stats.maintenance_rooms || 0}
        icon="🔧"
      />
      <StatCard
        title="Check-ins Hoy"
        value={stats.today_checkins || 0}
        icon="✅"
      />
      <StatCard
        title="Check-outs Hoy"
        value={stats.today_checkouts || 0}
        icon="🚪"
      />
      <StatCard
        title="Reservas Pendientes"
        value={stats.pending_reservations || 0}
        icon="📅"
      />
    </div>
  );
};

export default DashboardStats;
