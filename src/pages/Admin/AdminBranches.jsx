import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../lib/supabase-admin';
import toast from 'react-hot-toast';
import {
  Building,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  User,
  RefreshCw,
  BarChart3,
  Settings,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

import BranchFormModal from '../../components/admin/branch/BranchFormModal';
import BranchStatsModal from '../../components/admin/branch/BranchStatsModal';

const AdminBranches = () => {
  const { userInfo, isAdmin } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [viewingStats, setViewingStats] = useState(null);
  const [branchStats, setBranchStats] = useState({});

  useEffect(() => {
    if (isAdmin()) {
      loadBranches();
    }
  }, []);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const result = await adminService.getAllBranches();
      if (result.error) {
        toast.error('Error al cargar sucursales');
        return;
      }
      
      setBranches(result.data || []);
      
      // Cargar estadísticas para cada sucursal
      const statsPromises = (result.data || []).map(async (branch) => {
        try {
          const statsResult = await adminService.getBranchStats(branch.id);
          return { branchId: branch.id, stats: statsResult.data };
        } catch (error) {
          return { branchId: branch.id, stats: null };
        }
      });
      
      const statsResults = await Promise.all(statsPromises);
      const statsMap = {};
      statsResults.forEach(({ branchId, stats }) => {
        statsMap[branchId] = stats;
      });
      setBranchStats(statsMap);
      
    } catch (error) {
      console.error('Error loading branches:', error);
      toast.error('Error al cargar sucursales');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (branchData) => {
    try {
      const result = await adminService.createBranch(branchData);
      if (result.error) {
        toast.error(result.error.message || 'Error al crear sucursal');
        return;
      }
      
      toast.success('Sucursal creada exitosamente');
      setShowCreateModal(false);
      loadBranches();
    } catch (error) {
      console.error('Error creating branch:', error);
      toast.error('Error al crear sucursal');
    }
  };

  const handleUpdateBranch = async (branchId, updateData) => {
    try {
      const result = await adminService.updateBranch(branchId, updateData);
      if (result.error) {
        toast.error(result.error.message || 'Error al actualizar sucursal');
        return;
      }
      
      toast.success('Sucursal actualizada exitosamente');
      setEditingBranch(null);
      loadBranches();
    } catch (error) {
      console.error('Error updating branch:', error);
      toast.error('Error al actualizar sucursal');
    }
  };

  const handleViewStats = async (branch) => {
    setViewingStats(branch);
  };

  const filteredBranches = branches.filter(branch =>
    !searchTerm || 
    branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.manager_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin()) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Building className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">
            No tienes permisos de administrador para gestionar sucursales.
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
          <span className="ml-2 text-gray-600">Cargando sucursales...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Sucursales</h1>
          <p className="text-gray-600">
            Administra las sucursales del hotel y sus configuraciones
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Sucursal
          </button>
          <button
            onClick={loadBranches}
            disabled={loading}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Sucursales</p>
              <p className="text-2xl font-bold text-gray-900">{branches.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Activas</p>
              <p className="text-2xl font-bold text-gray-900">
                {branches.filter(b => b.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Habitaciones</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(branchStats).reduce((sum, stats) => sum + (stats?.totalRooms || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-emerald-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Ocupación Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(branchStats).length > 0 
                  ? Math.round(Object.values(branchStats).reduce((sum, stats) => sum + (stats?.occupancyRate || 0), 0) / Object.values(branchStats).length)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar sucursales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Lista de sucursales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBranches.map((branch) => {
          const stats = branchStats[branch.id];
          return (
            <div key={branch.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{branch.name}</h3>
                      <div className="flex items-center mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          branch.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {branch.is_active ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Activa
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactiva
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewStats(branch)}
                      className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver estadísticas"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingBranch(branch)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Editar sucursal"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Información de contacto */}
                <div className="space-y-2 mb-4">
                  {branch.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {branch.address}
                    </div>
                  )}
                  {branch.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {branch.phone}
                    </div>
                  )}
                  {branch.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {branch.email}
                    </div>
                  )}
                  {branch.manager_name && (
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      Gerente: {branch.manager_name}
                    </div>
                  )}
                </div>

                {/* Estadísticas rápidas */}
                {stats && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-blue-600">{stats.totalRooms || 0}</p>
                        <p className="text-xs text-gray-600">Habitaciones</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-600">{stats.occupancyRate || 0}%</p>
                        <p className="text-xs text-gray-600">Ocupación</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-purple-600">
                          S/. {(stats.todayRevenue || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">Ingresos Hoy</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredBranches.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron sucursales</h3>
          <p className="text-gray-500">
            {searchTerm 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza creando tu primera sucursal'
            }
          </p>
        </div>
      )}

      {/* Modales */}
      {showCreateModal && (
        <BranchFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateBranch}
          title="Crear Nueva Sucursal"
        />
      )}

      {editingBranch && (
        <BranchFormModal
          isOpen={!!editingBranch}
          onClose={() => setEditingBranch(null)}
          onSubmit={(data) => handleUpdateBranch(editingBranch.id, data)}
          branch={editingBranch}
          title="Editar Sucursal"
        />
      )}

      {viewingStats && (
        <BranchStatsModal
          isOpen={!!viewingStats}
          onClose={() => setViewingStats(null)}
          branch={viewingStats}
          stats={branchStats[viewingStats.id] || {}}
        />
      )}
    </div>
  );
};

export default AdminBranches;