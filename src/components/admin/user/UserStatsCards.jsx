import React from 'react';
import { Users, CheckCircle, Shield, Building } from 'lucide-react';

const UserStatsCards = ({ users }) => {
  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    admins: users.filter(u => u.role?.name === 'administrador').length,
    reception: users.filter(u => u.role?.name === 'recepcion').length
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center">
          <Users className="h-8 w-8 text-blue-600" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Activos</p>
            <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center">
          <Shield className="h-8 w-8 text-purple-600" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Administradores</p>
            <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center">
          <Building className="h-8 w-8 text-indigo-600" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Recepcionistas</p>
            <p className="text-2xl font-bold text-gray-900">{stats.reception}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStatsCards;