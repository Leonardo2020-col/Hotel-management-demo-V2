import React, { useState, useEffect } from 'react';
import { adminService } from '../../lib/supabase-admin';
import { branchService } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Building,
  Plus,
  Edit3,
  Trash2,
  MapPin,
  Phone,
  Mail,
  User,
  Eye,
  Settings,
  BarChart3,
  RefreshCw,
  Search,
  XCircle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Bed,
  Users
} from 'lucide-react';

// Importar componentes separados
import BranchFormModal from '../../components/admin/branch/BranchFormModal';
import BranchStatsModal from '../../components/admin/branch/BranchStatsModal';

const AdminBranches = () => {
  const { isAdmin } = useAuth();
  const [branches, setBranches] = useState([]);
  const [branchStats, setBranchStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  useEffect(() => {
    if (isAdmin()) {
      loadData();
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const branchesResult = await adminService.getAllBranches();
      const activeBranches = branchesResult.data?.filter(b => b.is_active) || [];
      setBranches(activeBranches);

      // Cargar estadísticas para cada sucursal
      const statsPromises = activeBranches.map(async (branch) => {
        try {
          const stats = await branchService.getBranchStats(branch.id);
          return { branchId: branch.id, stats: stats.data };
        } catch (error) {
          console.warn(`Error loading stats for branch ${branch.id}:`, error);
          return { branchId: branch.id, stats: {} };
        }
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap = {};
      statsResults.forEach(({ branchId, stats }) => {
        statsMap[branchId] = stats || {};
      });
      setBranchStats(statsMap);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar las sucursales');
    } finally {
      setLoading(false);
    }
  };

  const filteredBranches = branches.filter(branch =>
    !searchTerm || 
    branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.manager_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateBranch = async (branchData) => {
    try {
      const result = await adminService.createBranch(branchData);
      if (result.error) {
        toast.error(result.error.message || 'Error al crear sucursal');
        return;
      }
      
      toast.success('Sucursal creada exitosamente');
      setShowCreateModal(false);
      loadData();
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
      loadData();
    } catch (error) {
      console.error('Error updating branch:', error);
      toast.error('Error al actualizar sucursal');
    }
  };

  const handleToggleBranchStatus = async (branchId, currentStatus) => {
    if (!window.confirm(`¿Estás seguro de que deseas ${currentStatus ? 'desactivar' : 'activar'} esta sucursal?`)) {
      return;
    }

    try {
      const result = await adminService.updateBranch(branchId, { 
        is_active: !currentStatus 
      });
      
      if (result.error) {
        toast.error(result.error.message || 'Error al cambiar estado');
        return;
      }
      
      toast.success(
        `Sucursal ${!currentStatus ? 'activada' : 'desactivada'} exitosamente`
      );
      loadData();
    } catch (error) {
      console.error('Error toggling branch status:', error);
      toast.error('Error al cambiar estado de la sucursal');
    }
  };

  const totalStats = Object.values(branchStats).reduce((acc, stats) => ({
    totalRooms: acc.totalRooms + (stats?.totalRooms || 0),
    occupiedRooms: acc.occupiedRooms + (stats?.occupiedRooms || 0),
    todayRevenue: acc.todayRevenue + (stats?.todayRevenue || 0),
    todayCheckins: acc.todayCheckins + (stats?.todayCheckins || 0)
  }), { totalRooms: 0, occupiedRooms: 0, todayRevenue: 0, todayCheckins: 0 });

  const averageOccupancy = totalStats.totalRooms > 0 
    ? ((totalStats.occupiedRooms / totalStats.totalRooms) * 100).toFixed(1)
    : 0;

  // Verificar permisos de administrador
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
            Administra las sucursales del hotel y su rendimiento
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
            onClick={loadData}
            disabled={loading}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Sucursales</p>
              <p className="text-2xl font-bold text-gray-900">{branches.length}</p>
              <p className="text-xs text-gray-500">Activas</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Bed className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Habitaciones</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.totalRooms}</p>
              <p className="text-xs text-gray-500">{averageOccupancy}% ocupación</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-emerald-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Ingresos Hoy</p>
              <p className="text-2xl font-bold text-gray-900">
                S/. {totalStats.todayRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Todas las sucursales</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Check-ins Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.todayCheckins}</p>
              <p className="text-xs text-gray-500">Total del día</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros de búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar sucursales por nombre, dirección o gerente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setSearchTerm('')}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Limpiar
          </button>
        </div>
      </div>

      {/* Grid de sucursales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBranches.map((branch) => {
          const stats = branchStats[branch.id] || {};
          const occupancyRate = stats.totalRooms > 0 
            ? ((stats.occupiedRooms / stats.totalRooms) * 100).toFixed(1)
            : 0;

          return (
            <div key={branch.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header de la sucursal */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Building className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                        Activa
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {
                        setSelectedBranch(branch);
                        setShowStatsModal(true);
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Ver estadísticas"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingBranch(branch)}
                      className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                      title="Editar sucursal"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleBranchStatus(branch.id, branch.is_active)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Desactivar sucursal"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Información de contacto */}
                <div className="space-y-2 mb-4">
                  {branch.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{branch.address}</span>
                    </div>
                  )}
                  
                  {branch.manager_name && (
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{branch.manager_name}</span>
                    </div>
                  )}
                  
                  {branch.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{branch.phone}</span>
                    </div>
                  )}
                  
                  {branch.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate">{branch.email}</span>
                    </div>
                  )}
                </div>

                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600">Habitaciones</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {stats.totalRooms || 0}
                        </p>
                      </div>
                      <Bed className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600">Ocupación</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {occupancyRate}%
                        </p>
                      </div>
                      <TrendingUp className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Ingresos y check-ins del día */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Ingresos Hoy</p>
                    <p className="text-sm font-semibold text-green-600">
                      S/. {(stats.todayRevenue || 0).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Check-ins</p>
                    <p className="text-sm font-semibold text-blue-600">
                      {stats.todayCheckins || 0}
                    </p>
                  </div>
                </div>

                {/* Indicador de rendimiento */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Rendimiento</span>
                    <span>{occupancyRate}%</span>
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

                {/* Acciones */}
                <div className="flex space-x-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedBranch(branch);
                      setShowStatsModal(true);
                    }}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Detalles
                  </button>
                  
                  <button
                    onClick={() => setEditingBranch(branch)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Configurar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBranches.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron sucursales</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza creando tu primera sucursal'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Sucursal
            </button>
          )}
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

      {showStatsModal && selectedBranch && (
        <BranchStatsModal
          isOpen={showStatsModal}
          onClose={() => {
            setShowStatsModal(false);
            setSelectedBranch(null);
          }}
          branch={selectedBranch}
          stats={branchStats[selectedBranch.id] || {}}
        />
      )}
    </div>
  );
};

export default AdminBranches;