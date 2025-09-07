import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../lib/supabase-admin';
import toast from 'react-hot-toast';
import {
  Users,
  UserPlus,
  Edit3,
  Trash2,
  Shield,
  Eye,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  Building,
  Key,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

// Importar componentes separados
import UserFormModal from '../../components/admin/user/UserFormModal';
import UserPermissionsModal from '../../components/admin/user/UserPermissionsModal';
import UserStatsCards from '../../components/admin/user/UserStatsCards';
import UsersTable from '../../components/admin/user/UsersTable';

const AdminUsers = () => {
  const { userInfo, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    if (isAdmin()) {
      loadInitialData();
    }
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [usersResult, branchesResult, rolesResult] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getAllBranches(),
        adminService.getAllRoles()
      ]);

      setUsers(usersResult.data || []);
      setBranches(branchesResult.data || []);
      setRoles(rolesResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !filterRole || user.role?.name === filterRole;
    const matchesBranch = !filterBranch || 
      user.user_branches?.some(ub => ub.branch?.id === filterBranch);

    return matchesSearch && matchesRole && matchesBranch;
  });

  // Crear usuario
  const handleCreateUser = async (userData) => {
    try {
      const result = await adminService.createUser(userData);
      if (result.error) {
        toast.error(result.error.message || 'Error al crear usuario');
        return;
      }
      
      toast.success('Usuario creado exitosamente');
      setShowCreateModal(false);
      loadInitialData();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Error al crear usuario');
    }
  };

  // Actualizar usuario
  const handleUpdateUser = async (userId, updateData) => {
    try {
      const result = await adminService.updateUser(userId, updateData);
      if (result.error) {
        toast.error(result.error.message || 'Error al actualizar usuario');
        return;
      }
      
      toast.success('Usuario actualizado exitosamente');
      setEditingUser(null);
      loadInitialData();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Error al actualizar usuario');
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }

    try {
      const result = await adminService.deleteUser(userId);
      if (result.error) {
        toast.error(result.error.message || 'Error al eliminar usuario');
        return;
      }
      
      toast.success('Usuario eliminado exitosamente');
      loadInitialData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error al eliminar usuario');
    }
  };

  // Activar/Desactivar usuario
  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const result = await adminService.updateUser(userId, { 
        is_active: !currentStatus 
      });
      
      if (result.error) {
        toast.error(result.error.message || 'Error al cambiar estado');
        return;
      }
      
      toast.success(
        `Usuario ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`
      );
      loadInitialData();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Error al cambiar estado del usuario');
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setFilterRole('');
    setFilterBranch('');
  };

  // Verificar permisos de administrador
  if (!isAdmin()) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">
            No tienes permisos de administrador para gestionar usuarios.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Cargando usuarios...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">
            Administra los usuarios del sistema y sus permisos
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </button>
          <button
            onClick={loadInitialData}
            disabled={loading}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los roles</option>
            {roles.map(role => (
              <option key={role.id} value={role.name}>
                {role.name === 'administrador' ? 'Administrador' : 'Recepción'}
              </option>
            ))}
          </select>

          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las sucursales</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>

          <button
            onClick={clearFilters}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Limpiar
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <UserStatsCards users={users} />

      {/* Tabla de usuarios */}
      <UsersTable 
        users={filteredUsers}
        currentUserId={userInfo?.id}
        onEdit={setEditingUser}
        onDelete={handleDeleteUser}
        onToggleStatus={handleToggleUserStatus}
        onManagePermissions={(user) => {
          setEditingUser(user);
          setShowPermissionsModal(true);
        }}
      />

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
          <p className="text-gray-500">
            {searchTerm || filterRole || filterBranch 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza creando tu primer usuario'
            }
          </p>
        </div>
      )}

      {/* Modales */}
      {showCreateModal && (
        <UserFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
          branches={branches}
          roles={roles}
          title="Crear Nuevo Usuario"
        />
      )}

      {editingUser && !showPermissionsModal && (
        <UserFormModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={(data) => handleUpdateUser(editingUser.id, data)}
          user={editingUser}
          branches={branches}
          roles={roles}
          title="Editar Usuario"
        />
      )}

      {showPermissionsModal && editingUser && (
        <UserPermissionsModal
          isOpen={showPermissionsModal}
          onClose={() => {
            setShowPermissionsModal(false);
            setEditingUser(null);
          }}
          user={editingUser}
          roles={roles}
          onUpdatePermissions={(roleId) => handleUpdateUser(editingUser.id, { role_id: roleId })}
        />
      )}
    </div>
  );
};

export default AdminUsers;