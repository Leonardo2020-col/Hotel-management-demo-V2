import React from 'react';
import {
  XCircle,
  Bed,
  CheckCircle,
  Users,
  TrendingUp,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  User,
  BarChart3
} from 'lucide-react';

const BranchStatsModal = ({ isOpen, onClose, branch, stats }) => {
  if (!isOpen) return null;

  const occupancyRate = stats.totalRooms > 0 
    ? ((stats.occupiedRooms / stats.totalRooms) * 100).toFixed(1)
    : 0;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{branch.name}</h3>
            <p className="text-sm text-gray-600">Estadísticas detalladas</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Bed className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Habitaciones</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalRooms || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Disponibles</p>
                <p className="text-2xl font-bold text-green-900">{stats.availableRooms || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Ocupadas</p>
                <p className="text-2xl font-bold text-red-900">{stats.occupiedRooms || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Tasa Ocupación</p>
                <p className="text-2xl font-bold text-yellow-900">{occupancyRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-emerald-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-emerald-600">Ingresos Hoy</p>
                <p className="text-lg font-bold text-emerald-900">
                  S/. {(stats.todayRevenue || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Check-ins Hoy</p>
                <p className="text-2xl font-bold text-purple-900">{stats.todayCheckins || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional de la sucursal */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Información de Contacto</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {branch.address && (
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-700">Dirección</p>
                  <p className="text-gray-600">{branch.address}</p>
                </div>
              </div>
            )}
            
            {branch.phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-500 mr-2" />
                <div>
                  <p className="font-medium text-gray-700">Teléfono</p>
                  <p className="text-gray-600">{branch.phone}</p>
                </div>
              </div>
            )}
            
            {branch.email && (
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-500 mr-2" />
                <div>
                  <p className="font-medium text-gray-700">Email</p>
                  <p className="text-gray-600">{branch.email}</p>
                </div>
              </div>
            )}
            
            {branch.manager_name && (
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-500 mr-2" />
                <div>
                  <p className="font-medium text-gray-700">Gerente</p>
                  <p className="text-gray-600">{branch.manager_name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Indicadores de rendimiento */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Indicadores de Rendimiento</h4>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Tasa de Ocupación</span>
                <span className="text-sm text-gray-600">{occupancyRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    occupancyRate >= 80 ? 'bg-green-500' :
                    occupancyRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-green-600">{stats.availableRooms || 0}</p>
                <p className="text-xs text-gray-600">Disponibles</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-600">{stats.occupiedRooms || 0}</p>
                <p className="text-xs text-gray-600">Ocupadas</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-600">{stats.maintenanceRooms || 0}</p>
                <p className="text-xs text-gray-600">Mantenimiento</p>
              </div>
            </div>
          </div>
        </div>

        {/* Información de fechas */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h4 className="text-md font-medium text-blue-900 mb-2">Información General</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-blue-700">Sucursal creada</p>
              <p className="text-blue-600">
                {branch.created_at ? new Date(branch.created_at).toLocaleDateString('es-PE') : 'N/A'}
              </p>
            </div>
            <div>
              <p className="font-medium text-blue-700">Estado</p>
              <p className="text-blue-600">
                {branch.is_active ? 'Activa' : 'Inactiva'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => {
              // TODO: Implementar navegación a reportes detallados
              onClose();
            }}
          >
            <BarChart3 className="h-4 w-4 mr-2 inline" />
            Ver Reportes Detallados
          </button>
        </div>
      </div>
    </div>
  );
};

export default BranchStatsModal;