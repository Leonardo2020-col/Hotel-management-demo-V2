// src/hooks/useAdmin.js - Hook personalizado para funciones de administrador
import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService } from '../lib/supabase-admin';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const useAdmin = () => {
  const { userInfo, isAdmin } = useAuth();
  
  // Estados principales
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Estados de carga
  const [loading, setLoading] = useState({
    users: false,
    branches: false,
    roles: false,
    systemStats: false,
    auditLogs: false
  });
  
  // Estados de error
  const [errors, setErrors] = useState({});

  // =====================================================
  // FUNCIONES DE CARGA DE DATOS
  // =====================================================

  const loadUsers = useCallback(async (showToast = false) => {
    if (!isAdmin()) {
      console.warn('⚠️ Access denied: Admin role required');
      return;
    }

    setLoading(prev => ({ ...prev, users: true }));
    setErrors(prev => ({ ...prev, users: null }));
    
    try {
      const result = await adminService.getAllUsers();
      
      if (result.error) {
        throw result.error;
      }
      
      setUsers(result.data || []);
      
      if (showToast) {
        toast.success(`${result.data?.length || 0} usuarios cargados`);
      }
      
      console.log('✅ Users loaded successfully:', result.data?.length || 0);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      setErrors(prev => ({ ...prev, users: error }));
      
      if (showToast) {
        toast.error('Error al cargar usuarios');
      }
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  }, [isAdmin]);

  const loadBranches = useCallback(async (showToast = false) => {
    if (!isAdmin()) {
      console.warn('⚠️ Access denied: Admin role required');
      return;
    }

    setLoading(prev => ({ ...prev, branches: true }));
    setErrors(prev => ({ ...prev, branches: null }));
    
    try {
      const result = await adminService.getAllBranches();
      
      if (result.error) {
        throw result.error;
      }
      
      setBranches(result.data || []);
      
      if (showToast) {
        toast.success(`${result.data?.length || 0} sucursales cargadas`);
      }
      
      console.log('✅ Branches loaded successfully:', result.data?.length || 0);
    } catch (error) {
      console.error('❌ Error loading branches:', error);
      setErrors(prev => ({ ...prev, branches: error }));
      
      if (showToast) {
        toast.error('Error al cargar sucursales');
      }
    } finally {
      setLoading(prev => ({ ...prev, branches: false }));
    }
  }, [isAdmin]);

  const loadRoles = useCallback(async (showToast = false) => {
    if (!isAdmin()) {
      console.warn('⚠️ Access denied: Admin role required');
      return;
    }

    setLoading(prev => ({ ...prev, roles: true }));
    setErrors(prev => ({ ...prev, roles: null }));
    
    try {
      const result = await adminService.getAllRoles();
      
      if (result.error) {
        throw result.error;
      }
      
      setRoles(result.data || []);
      
      if (showToast) {
        toast.success(`${result.data?.length || 0} roles cargados`);
      }
      
      console.log('✅ Roles loaded successfully:', result.data?.length || 0);
    } catch (error) {
      console.error('❌ Error loading roles:', error);
      setErrors(prev => ({ ...prev, roles: error }));
      
      if (showToast) {
        toast.error('Error al cargar roles');
      }
    } finally {
      setLoading(prev => ({ ...prev, roles: false }));
    }
  }, [isAdmin]);

  const loadSystemStats = useCallback(async (showToast = false) => {
    if (!isAdmin()) {
      console.warn('⚠️ Access denied: Admin role required');
      return;
    }

    setLoading(prev => ({ ...prev, systemStats: true }));
    setErrors(prev => ({ ...prev, systemStats: null }));
    
    try {
      const result = await adminService.getSystemStats();
      
      if (result.error) {
        throw result.error;
      }
      
      setSystemStats(result.data);
      
      console.log('✅ System stats loaded successfully');
    } catch (error) {
      console.error('❌ Error loading system stats:', error);
      setErrors(prev => ({ ...prev, systemStats: error }));
      
      if (showToast) {
        toast.error('Error al cargar estadísticas del sistema');
      }
    } finally {
      setLoading(prev => ({ ...prev, systemStats: false }));
    }
  }, [isAdmin]);

  const loadAuditLogs = useCallback(async (filters = {}, showToast = false) => {
    if (!isAdmin()) {
      console.warn('⚠️ Access denied: Admin role required');
      return;
    }

    setLoading(prev => ({ ...prev, auditLogs: true }));
    setErrors(prev => ({ ...prev, auditLogs: null }));
    
    try {
      const result = await adminService.getAuditLogs(filters);
      
      if (result.error) {
        throw result.error;
      }
      
      setAuditLogs(result.data || []);
      
      if (showToast) {
        toast.success(`${result.data?.length || 0} logs de auditoría cargados`);
      }
      
      console.log('✅ Audit logs loaded successfully:', result.data?.length || 0);
    } catch (error) {
      console.error('❌ Error loading audit logs:', error);
      setErrors(prev => ({ ...prev, auditLogs: error }));
      
      if (showToast) {
        toast.error('Error al cargar logs de auditoría');
      }
    } finally {
      setLoading(prev => ({ ...prev, auditLogs: false }));
    }
  }, [isAdmin]);

  // =====================================================
  // FUNCIONES DE GESTIÓN DE USUARIOS
  // =====================================================

  const createUser = useCallback(async (userData) => {
    if (!isAdmin()) {
      toast.error('Acceso denegado: Se requieren permisos de administrador');
      return { success: false, error: 'Access denied' };
    }

    try {
      const result = await adminService.createUser(userData);
      
      if (result.error) {
        throw result.error;
      }
      
      toast.success('Usuario creado exitosamente');
      
      // Recargar lista de usuarios
      await loadUsers();
      
      return { success: true, data: result.data };
    } catch (error) {
      console.error('❌ Error creating user:', error);
      toast.error(error.message || 'Error al crear usuario');
      return { success: false, error };
    }
  }, [isAdmin, loadUsers]);

  const updateUser = useCallback(async (userId, updateData) => {
    if (!isAdmin()) {
      toast.error('Acceso denegado: Se requieren permisos de administrador');
      return { success: false, error: 'Access denied' };
    }

    try {
      const result = await adminService.updateUser(userId, updateData);
      
      if (result.error) {
        throw result.error;
      }
      
      toast.success('Usuario actualizado exitosamente');
      
      // Recargar lista de usuarios
      await loadUsers();
      
      return { success: true, data: result.data };
    } catch (error) {
      console.error('❌ Error updating user:', error);
      toast.error(error.message || 'Error al actualizar usuario');
      return { success: false, error };
    }
  }, [isAdmin, loadUsers]);

  const deleteUser = useCallback(async (userId) => {
    if (!isAdmin()) {
      toast.error('Acceso denegado: Se requieren permisos de administrador');
      return { success: false, error: 'Access denied' };
    }

    try {
      const result = await adminService.deleteUser(userId);
      
      if (result.error) {
        throw result.error;
      }
      
      toast.success('Usuario eliminado exitosamente');
      
      // Recargar lista de usuarios
      await loadUsers();
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      toast.error(error.message || 'Error al eliminar usuario');
      return { success: false, error };
    }
  }, [isAdmin, loadUsers]);

  // =====================================================
  // FUNCIONES DE GESTIÓN DE SUCURSALES
  // =====================================================

  const createBranch = useCallback(async (branchData) => {
    if (!isAdmin()) {
      toast.error('Acceso denegado: Se requieren permisos de administrador');
      return { success: false, error: 'Access denied' };
    }

    try {
      const result = await adminService.createBranch(branchData);
      
      if (result.error) {
        throw result.error;
      }
      
      toast.success('Sucursal creada exitosamente');
      
      // Recargar lista de sucursales
      await loadBranches();
      
      return { success: true, data: result.data };
    } catch (error) {
      console.error('❌ Error creating branch:', error);
      toast.error(error.message || 'Error al crear sucursal');
      return { success: false, error };
    }
  }, [isAdmin, loadBranches]);

  const updateBranch = useCallback(async (branchId, updateData) => {
    if (!isAdmin()) {
      toast.error('Acceso denegado: Se requieren permisos de administrador');
      return { success: false, error: 'Access denied' };
    }

    try {
      const result = await adminService.updateBranch(branchId, updateData);
      
      if (result.error) {
        throw result.error;
      }
      
      toast.success('Sucursal actualizada exitosamente');
      
      // Recargar lista de sucursales
      await loadBranches();
      
      return { success: true, data: result.data };
    } catch (error) {
      console.error('❌ Error updating branch:', error);
      toast.error(error.message || 'Error al actualizar sucursal');
      return { success: false, error };
    }
  }, [isAdmin, loadBranches]);

  // =====================================================
  // FUNCIONES DE GESTIÓN DE PERMISOS
  // =====================================================

  const updateRolePermissions = useCallback(async (roleId, permissions) => {
    if (!isAdmin()) {
      toast.error('Acceso denegado: Se requieren permisos de administrador');
      return { success: false, error: 'Access denied' };
    }

    try {
      const result = await adminService.updateRolePermissions(roleId, permissions);
      
      if (result.error) {
        throw result.error;
      }
      
      toast.success('Permisos actualizados exitosamente');
      
      // Recargar lista de roles
      await loadRoles();
      
      return { success: true, data: result.data };
    } catch (error) {
      console.error('❌ Error updating role permissions:', error);
      toast.error(error.message || 'Error al actualizar permisos');
      return { success: false, error };
    }
  }, [isAdmin, loadRoles]);

  // =====================================================
  // FUNCIONES DE UTILIDAD
  // =====================================================

  const refreshAllData = useCallback(async () => {
    if (!isAdmin()) {
      console.warn('⚠️ Access denied: Admin role required');
      return;
    }

    try {
      await Promise.all([
        loadUsers(),
        loadBranches(),
        loadRoles(),
        loadSystemStats()
      ]);
      
      toast.success('Datos actualizados exitosamente');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      toast.error('Error al actualizar los datos');
    }
  }, [isAdmin, loadUsers, loadBranches, loadRoles, loadSystemStats]);

  const searchUsers = useCallback((searchTerm, filters = {}) => {
    if (!searchTerm && !Object.keys(filters).length) {
      return users;
    }

    return users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm);

      const matchesRole = !filters.role || user.role?.name === filters.role;
      const matchesBranch = !filters.branch || 
        user.user_branches?.some(ub => ub.branch?.id === filters.branch);
      const matchesStatus = filters.status === undefined || 
        user.is_active === filters.status;

      return matchesSearch && matchesRole && matchesBranch && matchesStatus;
    });
  }, [users]);

  const searchBranches = useCallback((searchTerm) => {
    if (!searchTerm) {
      return branches;
    }

    return branches.filter(branch =>
      branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.manager_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [branches]);

  // =====================================================
  // DATOS COMPUTADOS
  // =====================================================

  const userStats = useMemo(() => {
    const activeUsers = users.filter(u => u.is_active);
    const adminUsers = users.filter(u => u.role?.name === 'administrador');
    const receptionUsers = users.filter(u => u.role?.name === 'recepcion');

    return {
      total: users.length,
      active: activeUsers.length,
      inactive: users.length - activeUsers.length,
      admins: adminUsers.length,
      reception: receptionUsers.length,
      lastCreated: users.length > 0 ? users[0]?.created_at : null
    };
  }, [users]);

  const branchStats = useMemo(() => {
    const activeBranches = branches.filter(b => b.is_active);

    return {
      total: branches.length,
      active: activeBranches.length,
      inactive: branches.length - activeBranches.length,
      lastCreated: branches.length > 0 ? branches[0]?.created_at : null
    };
  }, [branches]);

  const isLoading = useMemo(() => {
    return Object.values(loading).some(Boolean);
  }, [loading]);

  const hasErrors = useMemo(() => {
    return Object.values(errors).some(Boolean);
  }, [errors]);

  // =====================================================
  // EFECTOS
  // =====================================================

  // Cargar datos iniciales cuando el usuario sea admin
  useEffect(() => {
    if (isAdmin() && userInfo) {
      console.log('🔄 Loading initial admin data...');
      refreshAllData();
    }
  }, [isAdmin, userInfo, refreshAllData]);

  // =====================================================
  // RETURN DEL HOOK
  // =====================================================

  return {
    // Datos
    users,
    branches,
    roles,
    systemStats,
    auditLogs,
    
    // Estados de carga
    loading,
    isLoading,
    errors,
    hasErrors,
    
    // Estadísticas computadas
    userStats,
    branchStats,
    
    // Funciones de carga
    loadUsers,
    loadBranches,
    loadRoles,
    loadSystemStats,
    loadAuditLogs,
    refreshAllData,
    
    // Funciones de gestión de usuarios
    createUser,
    updateUser,
    deleteUser,
    
    // Funciones de gestión de sucursales
    createBranch,
    updateBranch,
    
    // Funciones de gestión de permisos
    updateRolePermissions,
    
    // Funciones de búsqueda
    searchUsers,
    searchBranches,
    
    // Utilidades
    isAdmin: isAdmin(),
    currentUser: userInfo,
    
    // Funciones de validación
    canEditUser: (userId) => {
      if (!isAdmin()) return false;
      // Un admin no puede editarse a sí mismo en ciertos casos
      return userId !== userInfo?.id;
    },
    
    canDeleteUser: (userId) => {
      if (!isAdmin()) return false;
      // Un admin no puede eliminarse a sí mismo
      if (userId === userInfo?.id) return false;
      
      // No se puede eliminar el último administrador
      const adminCount = users.filter(u => u.role?.name === 'administrador' && u.is_active).length;
      const userToDelete = users.find(u => u.id === userId);
      
      if (userToDelete?.role?.name === 'administrador' && adminCount <= 1) {
        return false;
      }
      
      return true;
    }
  };
};

export default useAdmin;