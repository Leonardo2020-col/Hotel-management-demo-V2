import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../lib/supabase-admin';
import toast from 'react-hot-toast';
import {
  Shield,
  Eye,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Clock,
  Database,
  Edit3,
  Trash2,
  Plus,
  Settings
} from 'lucide-react';

const AdminAudit = () => {
  const { userInfo, isAdmin } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    user: '',
    table: '',
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    search: ''
  });
  const [stats, setStats] = useState({
    totalActions: 0,
    todayActions: 0,
    criticalActions: 0,
    activeUsers: 0
  });

  useEffect(() => {
    if (isAdmin()) {
      loadInitialData();
    }
  }, []);

  useEffect(() => {
    if (isAdmin()) {
      loadAuditLogs();
    }
  }, [filters]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [usersResult] = await Promise.all([
        adminService.getAllUsers()
      ]);

      setUsers(usersResult.data || []);
      await loadAuditLogs();
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const result = await adminService.getAuditLogs(filters);
      if (result.error) {
        toast.error('Error al cargar logs de auditoría');
        return;
      }

      setAuditLogs(result.data || []);
      
      // Calcular estadísticas
      const logs = result.data || [];
      const today = new Date().toDateString();
      
      setStats({
        totalActions: logs.length,
        todayActions: logs.filter(log => new Date(log.created_at).toDateString() === today).length,
        criticalActions: logs.filter(log => log.action === 'DELETE' || log.table_name === 'users').length,
        activeUsers: new Set(logs.map(log => log.user_id).filter(Boolean)).size
      });
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Error al cargar logs de auditoría');
    }
  };

  const handleExportLogs = async () => {
    try {
      // Generar CSV con los logs
      const headers = ['Fecha', 'Usuario', 'Acción', 'Tabla', 'IP', 'Detalles'];
      const rows = auditLogs.map(log => [
        new Date(log.created_at).toLocaleString('es-PE'),
        log.users ? `${log.users.first_name} ${log.users.last_name}` : 'Sistema',
        log.action,
        log.table_name,
        log.ip_address || 'N/A',
        log.record_id
      ]);

      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      toast.success('Logs exportados exitosamente');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Error al exportar logs');
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'UPDATE':
        return <Edit3 className="h-4 w-4 text-blue-600" />;
      case 'DELETE':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'text-green-800 bg-green-100';
      case 'UPDATE':
        return 'text-blue-800 bg-blue-100';
      case 'DELETE':
        return 'text-red-800 bg-red-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  const getCriticalityLevel = (log) => {
    if (log.action === 'DELETE' || log.table_name === 'users') return 'high';
    if (log.table_name === 'reservations' || log.table_name === 'rooms') return 'medium';
    return 'low';
  };

  const getCriticalityColor = (level) => {
    switch (level) {
      case 'high':
        return 'text-red-700 bg-red-100';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      user: '',
      table: '',
      dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      search: ''
    });
  };

  if (!isAdmin()) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600">
            No tienes permisos para acceder al sistema de auditoría.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sistema de Auditoría</h1>
          <p className="text-gray-600">
            Monitoreo de actividades y cambios en el sistema
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExportLogs}
            disabled={auditLogs.length === 0}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Logs
          </button>
          <button
            onClick={loadAuditLogs}
            disabled={loading}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Acciones</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalActions}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Acciones Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayActions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Acciones Críticas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.criticalActions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <User className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filters.action}
            onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las acciones</option>
            <option value="CREATE">Crear</option>
            <option value="UPDATE">Actualizar</option>
            <option value="DELETE">Eliminar</option>
          </select>

          <select
            value={filters.user}
            onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los usuarios</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.first_name} {user.last_name}
              </option>
            ))}
          </select>

          <select
            value={filters.table}
            onChange={(e) => setFilters(prev => ({ ...prev, table: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las tablas</option>
            <option value="users">Usuarios</option>
            <option value="reservations">Reservaciones</option>
            <option value="guests">Huéspedes</option>
            <option value="rooms">Habitaciones</option>
            <option value="supplies">Suministros</option>
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <button
            onClick={clearFilters}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla de logs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tabla
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criticidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log, index) => {
                const criticality = getCriticalityLevel(log);
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        {new Date(log.created_at).toLocaleString('es-PE')}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.users ? (
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                            <span className="text-xs font-medium text-blue-600">
                              {log.users.first_name?.charAt(0)}
                            </span>
                          </div>
                          {log.users.first_name} {log.users.last_name}
                        </div>
                      ) : (
                        <span className="text-gray-500">Sistema</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                        <span className="ml-1">{log.action}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Database className="h-4 w-4 text-gray-400 mr-2" />
                        {log.table_name}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCriticalityColor(criticality)}`}>
                        {criticality === 'high' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {criticality === 'medium' && <Shield className="h-3 w-3 mr-1" />}
                        {criticality === 'low' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {criticality === 'high' ? 'Alta' : criticality === 'medium' ? 'Media' : 'Baja'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ip_address || 'N/A'}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Ver detalles"
                        onClick={() => {
                          // Modal de detalles implementar si necesario
                          toast.info(`ID del registro: ${log.record_id}`);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {auditLogs.length === 0 && !loading && (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron logs</h3>
            <p className="text-gray-500">
              No hay registros de auditoría que coincidan con los filtros seleccionados
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Cargando logs de auditoría...</span>
          </div>
        )}
      </div>

      {/* Alertas de seguridad */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Alertas de Seguridad Recientes</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {auditLogs
              .filter(log => getCriticalityLevel(log) === 'high')
              .slice(0, 5)
              .map((log, index) => (
                <div key={index} className="flex items-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                  <div className="flex-1">
                    <p className="font-medium text-red-800">
                      {log.action} en {log.table_name}
                    </p>
                    <p className="text-sm text-red-600">
                      {log.users ? `${log.users.first_name} ${log.users.last_name}` : 'Sistema'} - {' '}
                      {new Date(log.created_at).toLocaleString('es-PE')}
                    </p>
                  </div>
                </div>
              ))}
            
            {auditLogs.filter(log => getCriticalityLevel(log) === 'high').length === 0 && (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No hay alertas de seguridad críticas recientes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAudit;