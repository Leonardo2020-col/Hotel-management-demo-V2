import React, { useState } from 'react';
import { XCircle, Shield, Key, CheckCircle, AlertCircle, User } from 'lucide-react';

const UserPermissionsModal = ({ 
  isOpen, 
  onClose, 
  user, 
  roles = [], 
  onUpdatePermissions 
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState(user?.role_id || '');
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !user) return null;

  const currentRole = roles.find(role => role.id === user.role_id);
  const selectedRole = roles.find(role => role.id === selectedRoleId);

  const handleUpdateRole = async () => {
    if (selectedRoleId === user.role_id) {
      onClose();
      return;
    }

    setUpdating(true);
    try {
      await onUpdatePermissions(selectedRoleId);
      onClose();
    } catch (error) {
      console.error('Error updating permissions:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Definir permisos por rol
  const permissionsByRole = {
    administrador: [
      { key: 'all', label: 'Acceso completo al sistema', description: 'Control total sobre todas las funcionalidades' },
      { key: 'admin', label: 'Panel de administración', description: 'Gestión de usuarios, sucursales y configuraciones' },
      { key: 'checkin', label: 'Check-in de huéspedes', description: 'Registrar llegada de huéspedes' },
      { key: 'checkout', label: 'Check-out de huéspedes', description: 'Procesar salida de huéspedes' },
      { key: 'reservations', label: 'Gestión de reservaciones', description: 'Crear, modificar y cancelar reservaciones' },
      { key: 'guests', label: 'Gestión de huéspedes', description: 'Administrar información de huéspedes' },
      { key: 'reports', label: 'Reportes completos', description: 'Generar y visualizar todos los reportes' },
      { key: 'supplies', label: 'Gestión de inventario', description: 'Control de suministros y stock' },
      { key: 'settings', label: 'Configuraciones', description: 'Ajustes del sistema y sucursales' }
    ],
    recepcion: [
      { key: 'checkin', label: 'Check-in de huéspedes', description: 'Registrar llegada de huéspedes' },
      { key: 'checkout', label: 'Check-out de huéspedes', description: 'Procesar salida de huéspedes' },
      { key: 'reservations', label: 'Gestión de reservaciones', description: 'Crear, modificar y cancelar reservaciones' },
      { key: 'guests', label: 'Gestión de huéspedes', description: 'Administrar información de huéspedes' },
      { key: 'reports_view', label: 'Ver reportes básicos', description: 'Consultar reportes de ocupación e ingresos' },
      { key: 'supplies_view', label: 'Ver inventario', description: 'Consultar estado del inventario' }
    ]
  };

  const getRolePermissions = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return [];
    
    return permissionsByRole[role.name] || [];
  };

  const getRoleColor = (roleName) => {
    return roleName === 'administrador' ? 'purple' : 'blue';
  };

  const getRoleIcon = (roleName) => {
    return roleName === 'administrador' ? Shield : User;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Gestionar Permisos - {user.first_name} {user.last_name}
            </h3>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Rol actual */}
          {currentRole && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">Rol Actual</h4>
              <div className="flex items-center">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center bg-${getRoleColor(currentRole.name)}-100`}>
                  {React.createElement(getRoleIcon(currentRole.name), {
                    className: `h-5 w-5 text-${getRoleColor(currentRole.name)}-600`
                  })}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {currentRole.name === 'administrador' ? 'Administrador' : 'Recepción'}
                  </p>
                  <p className="text-xs text-gray-600">{currentRole.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Selector de nuevo rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Key className="h-4 w-4 inline mr-1" />
              Cambiar Rol
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name === 'administrador' ? 'Administrador' : 'Recepción'}
                  {role.id === user.role_id && ' (Actual)'}
                </option>
              ))}
            </select>
          </div>

          {/* Vista previa de permisos */}
          {selectedRole && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-4">
                Permisos del Rol: {selectedRole.name === 'administrador' ? 'Administrador' : 'Recepción'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getRolePermissions(selectedRoleId).map((permission, index) => (
                  <div key={index} className="flex items-start p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        {permission.label}
                      </p>
                      <p className="text-xs text-green-700">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedRole.name === 'administrador' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                    <p className="text-sm text-yellow-800">
                      <strong>Advertencia:</strong> Los administradores tienen acceso completo al sistema, 
                      incluyendo la gestión de otros usuarios y configuraciones críticas.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="text-sm font-medium text-blue-900 mb-2">Información sobre Roles</h5>
            <div className="space-y-2 text-sm text-blue-800">
              <div>
                <strong>Administrador:</strong> Acceso completo al sistema, puede gestionar usuarios, 
                sucursales, configuraciones y generar reportes avanzados.
              </div>
              <div>
                <strong>Recepción:</strong> Acceso limitado a operaciones diarias como check-in, 
                check-out, reservaciones y consulta de reportes básicos.
              </div>
            </div>
          </div>

          {/* Sucursales asignadas */}
          {user.user_branches && user.user_branches.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">Sucursales Asignadas</h4>
              <div className="space-y-1">
                {user.user_branches.map((ub, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <div className="h-2 w-2 bg-blue-600 rounded-full mr-2"></div>
                    <span>{ub.branch?.name}</span>
                    {ub.is_primary && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={updating}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpdateRole}
            disabled={updating || selectedRoleId === user.role_id}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {updating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Actualizando...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                {selectedRoleId === user.role_id ? 'Sin Cambios' : 'Actualizar Permisos'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPermissionsModal;