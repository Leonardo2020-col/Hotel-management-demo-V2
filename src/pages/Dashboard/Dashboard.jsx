// src/pages/Dashboard/Dashboard.jsx - FASE 3: Dashboard con datos reales
import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  Users, 
  Bed, 
  CreditCard, 
  TrendingUp,
  Calendar,
  MapPin,
  LogIn,
  LogOut,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

// Hook para datos del dashboard
const useDashboardData = () => {
  const [data, setData] = useState({
    metrics: {
      totalRooms: 0,
      occupiedRooms: 0,
      availableRooms: 0,
      todayCheckIns: 0,
      todayCheckOuts: 0,
      totalRevenue: 0,
      averageRate: 0,
      occupancyRate: 0
    },
    recentReservations: [],
    revenueChart: [],
    occupancyChart: [],
    roomStatus: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true }));

        // Simular llamadas a Supabase - Reemplazar con calls reales
        // const { data: rooms } = await supabase.from('rooms').select('*');
        // const { data: reservations } = await supabase.from('reservations').select('*');
        
        // Datos de ejemplo (reemplazar con datos reales de Supabase)
        const mockData = {
          metrics: {
            totalRooms: 48,
            occupiedRooms: 32,
            availableRooms: 16,
            todayCheckIns: 8,
            todayCheckOuts: 5,
            totalRevenue: 15420.00,
            averageRate: 125.50,
            occupancyRate: 66.7
          },
          recentReservations: [
            { id: 1, guest: "María García", room: "101", checkIn: "2025-08-11", status: "confirmed" },
            { id: 2, guest: "Juan Pérez", room: "205", checkIn: "2025-08-12", status: "pending" },
            { id: 3, guest: "Ana López", room: "304", checkIn: "2025-08-11", status: "checked-in" },
            { id: 4, guest: "Carlos Ruiz", room: "102", checkIn: "2025-08-13", status: "confirmed" },
            { id: 5, guest: "Sofia Morales", room: "208", checkIn: "2025-08-11", status: "checked-in" }
          ],
          revenueChart: [
            { month: 'Ene', revenue: 12000, bookings: 45 },
            { month: 'Feb', revenue: 14500, bookings: 52 },
            { month: 'Mar', revenue: 13200, bookings: 48 },
            { month: 'Apr', revenue: 16800, bookings: 61 },
            { month: 'May', revenue: 15200, bookings: 55 },
            { month: 'Jun', revenue: 18500, bookings: 68 },
            { month: 'Jul', revenue: 21300, bookings: 78 },
            { month: 'Ago', revenue: 15420, bookings: 58 }
          ],
          occupancyChart: [
            { day: 'Lun', occupancy: 75 },
            { day: 'Mar', occupancy: 82 },
            { day: 'Mié', occupancy: 68 },
            { day: 'Jue', occupancy: 91 },
            { day: 'Vie', occupancy: 95 },
            { day: 'Sáb', occupancy: 88 },
            { day: 'Dom', occupancy: 72 }
          ],
          roomStatus: [
            { name: 'Ocupadas', value: 32, color: '#ef4444' },
            { name: 'Disponibles', value: 16, color: '#10b981' },
            { name: 'Mantenimiento', value: 2, color: '#f59e0b' },
            { name: 'Limpieza', value: 3, color: '#3b82f6' }
          ]
        };

        setData(prev => ({
          ...prev,
          ...mockData,
          loading: false,
          error: null
        }));

      } catch (error) {
        setData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    fetchDashboardData();

    // Actualizar datos cada 30 segundos
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  return data;
};

// Componente de tarjeta de métrica
const MetricCard = ({ title, value, icon: Icon, trend, color = "blue", format = "number" }) => {
  const formatValue = (val) => {
    if (format === "currency") return `$${val.toLocaleString()}`;
    if (format === "percentage") return `${val}%`;
    return val.toLocaleString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600 mt-2`}>
            {formatValue(value)}
          </p>
          {trend && (
            <div className={`flex items-center mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp size={16} />
              <span className="text-sm ml-1">{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`text-${color}-600`} size={24} />
        </div>
      </div>
    </div>
  );
};

// Componente principal del Dashboard
const Dashboard = () => {
  const { metrics, recentReservations, revenueChart, occupancyChart, roomStatus, loading, error } = useDashboardData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="text-red-600 mr-2" size={20} />
          <p className="text-red-700">Error al cargar los datos: {error}</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#ef4444', '#10b981', '#f59e0b', '#3b82f6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Resumen general del hotel - {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Actualizar datos
        </button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Tasa de ocupación"
          value={metrics.occupancyRate}
          icon={Bed}
          color="blue"
          format="percentage"
          trend={5.2}
        />
        <MetricCard
          title="Check-ins hoy"
          value={metrics.todayCheckIns}
          icon={LogIn}
          color="green"
        />
        <MetricCard
          title="Check-outs hoy"
          value={metrics.todayCheckOuts}
          icon={LogOut}
          color="orange"
        />
        <MetricCard
          title="Ingresos del mes"
          value={metrics.totalRevenue}
          icon={DollarSign}
          color="purple"
          format="currency"
          trend={8.1}
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de ingresos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingresos Mensuales</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`$${value.toLocaleString()}`, 'Ingresos']}
                labelFormatter={(label) => `Mes: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                fill="#3b82f6"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de ocupación semanal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ocupación Semanal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={occupancyChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Ocupación']}
              />
              <Bar dataKey="occupancy" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Estado de habitaciones y reservaciones recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estado de habitaciones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Habitaciones</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={roomStatus}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {roomStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Reservaciones recientes */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Reservaciones Recientes</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Ver todas
            </button>
          </div>
          <div className="space-y-3">
            {recentReservations.map((reservation) => (
              <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{reservation.guest}</p>
                    <p className="text-sm text-gray-600">Habitación {reservation.room}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">{reservation.checkIn}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {reservation.status === 'confirmed' ? 'Confirmada' :
                     reservation.status === 'pending' ? 'Pendiente' : 'Check-in'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Habitaciones totales</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{metrics.totalRooms}</p>
            </div>
            <MapPin className="text-gray-400" size={24} />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Ocupadas: {metrics.occupiedRooms}</span>
              <span className="text-gray-600">Disponibles: {metrics.availableRooms}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tarifa promedio</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">${metrics.averageRate}</p>
            </div>
            <CreditCard className="text-gray-400" size={24} />
          </div>
          <p className="text-sm text-gray-600 mt-4">Por noche</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Próximos eventos</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">3</p>
            </div>
            <Calendar className="text-gray-400" size={24} />
          </div>
          <p className="text-sm text-gray-600 mt-4">Esta semana</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;