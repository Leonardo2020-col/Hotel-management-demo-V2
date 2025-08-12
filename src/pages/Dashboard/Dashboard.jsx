// src/pages/Dashboard/Dashboard.jsx - CREAR ESTE ARCHIVO
import React from 'react';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200'
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, hasPermission } = useAuth();

  // Iconos SVG
  const UsersIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  );

  const BedIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2m0 0h4" />
    </svg>
  );

  const DollarIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  );

  const ChartIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const CalendarIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const CheckIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  // Datos mock del dashboard
  const stats = [
    {
      title: 'Huéspedes Activos',
      value: '24',
      subtitle: 'En el hotel actualmente',
      icon: UsersIcon,
      color: 'blue'
    },
    {
      title: 'Habitaciones Ocupadas',
      value: '18/24',
      subtitle: '75% de ocupación',
      icon: BedIcon,
      color: 'green'
    },
    {
      title: 'Ingresos Hoy',
      value: 'S/ 3,450',
      subtitle: '+12% vs ayer',
      icon: DollarIcon,
      color: 'purple'
    },
    {
      title: 'Check-ins Hoy',
      value: '8',
      subtitle: '3 pendientes',
      icon: CheckIcon,
      color: 'orange'
    }
  ];

  // Actividades recientes
  const recentActivities = [
    {
      id: 1,
      type: 'checkin',
      message: 'Check-in completado: Juan Pérez - Hab. 201',
      time: '10:30 AM',
      icon: CheckIcon,
      color: 'green'
    },
    {
      id: 2,
      type: 'reservation',
      message: 'Nueva reserva: María García - 3 noches',
      time: '09:45 AM',
      icon: CalendarIcon,
      color: 'blue'
    },
    {
      id: 3,
      type: 'payment',
      message: 'Pago recibido: S/ 450 - Hab. 105',
      time: '09:15 AM',
      icon: DollarIcon,
      color: 'purple'
    }
  ];

  // Próximos check-ins
  const upcomingCheckins = [
    {
      id: 1,
      guest: 'Carlos López',
      room: '305',
      time: '14:00',
      status: 'confirmado'
    },
    {
      id: 2,
      guest: 'Ana Silva',
      room: '108',
      time: '15:30',
      status: 'pendiente'
    },
    {
      id: 3,
      guest: 'Roberto Torres',
      room: '203',
      time: '16:00',
      status: 'confirmado'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ¡Bienvenido, {user?.name}! 👋
        </h1>
        <p className="text-gray-600">
          Aquí tienes un resumen de la actividad del hotel para hoy, {new Date().toLocaleDateString('es-PE')}.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
              <span className="text-sm text-gray-500">Últimas 3 horas</span>
            </div>
            
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`p-2 rounded-lg ${
                      activity.color === 'green' ? 'bg-green-100 text-green-600' :
                      activity.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Check-ins */}
        <div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Próximos Check-ins</h3>
              <span className="text-sm text-gray-500">Hoy</span>
            </div>
            
            <div className="space-y-4">
              {upcomingCheckins.map((checkin) => (
                <div key={checkin.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{checkin.guest}</p>
                    <p className="text-sm text-gray-600">Hab. {checkin.room}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{checkin.time}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      checkin.status === 'confirmado' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {checkin.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {hasPermission('checkin') && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Acciones Rápidas</h3>
              <p className="text-blue-100">Operaciones frecuentes para el personal de recepción</p>
            </div>
            <div className="flex space-x-3">
              <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors">
                Nuevo Check-in
              </button>
              <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors">
                Ver Reservas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Todas las funciones operativas</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Base de datos sincronizada</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Modo demo activo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;