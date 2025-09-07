import React from 'react';
import {
  Edit3,
  Trash2,
  Shield,
  Mail,
  Phone,
  Building,
  Key,
  CheckCircle,
  XCircle,
  User
} from 'lucide-react';

const UsersTable = ({ 
  users, 
  currentUserId, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onManagePermissions 
}) => {
  
  const canDelete = (userId) => {
    return userId !== currentUserId;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sucursales
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Último Acceso
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role?.name === 'administrador' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    <Shield className="h-3 w-3 mr-1" />
                    {user.role?.name === 'administrador' ? 'Administrador' : 'Recepción'}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {user.user_branches?.map((ub, index) => (
                      <div key={ub.branch?.id} className="flex items-center mb-1">
                        <Building className="h-3 w-3 mr-1 text-gray-400" />
                        <span className={ub.is_primary ? 'font-medium' : ''}>
                          {ub.branch?.name}
                        </span>
                        {ub.is_primary && (
                          <span className="ml-1 text-xs text-blue-600">(Principal)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Activo
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactivo
                      </>
                    )}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.last_login ? (
                    new Date(user.last_login).toLocaleDateString('es-PE')
                  ) : (
                    'Nunca'
                  )}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onEdit(user)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      title="Editar usuario"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => onManagePermissions(user)}
                      className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                      title="Gestionar permisos"
                    >
                      <Key className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => onToggleStatus(user.id, user.is_active)}
                      className={`p-1 rounded ${
                        user.is_active 
                          ? 'text-red-600 hover:text-red-900 hover:bg-red-50' 
                          : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                      }`}
                      title={user.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                    >
                      {user.is_active ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </button>

                    {canDelete(user.id) && (
                      <button
                        onClick={() => onDelete(user.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTable;