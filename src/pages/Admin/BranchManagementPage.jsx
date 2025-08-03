// src/pages/Admin/BranchManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  MapPin, 
  Phone, 
  Users, 
  Bed,
  Settings,
  TrendingUp,
  Eye,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../hooks/useBranch';
import Button from '../../components/common/Button';

const BranchManagementPage = () => {
  const { user, getAvailableBranches } = useAuth();
  const { selectedBranch, changeBranch } = useBranch();
  const [branches, setBranches] = useState([]);
  const [selectedBranchForAction, setSelectedBranchForAction] = useState(null);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'

  useEffect(() => {
    const availableBranches = getAvailableBranches();
    setBranches(availableBranches);
  }, []);

  const handleCreateBranch = () => {
    setSelectedBranchForAction(null);
    setModalMode('create');
    setShowBranchModal(true);
  };

  const handleEditBranch = (branch) => {
    setSelectedBranchForAction(branch);
    setModalMode('edit');
    setShowBranchModal(true);
  };

  const handleViewBranch = (branch) => {
    setSelectedBranchForAction(branch);
    setModalMode('view');
    setShowBranchModal(true);
  };

  const handleSwitchToBranch = async (branchId) => {
    try {
      await changeBranch(branchId);
      // Mostrar notificación de éxito
    } catch (error) {
      console.error('Error switching branch:', error);
      // Mostrar notificación de error
    }
  };

  const getOccupancyColor = (rate) => {
    if (rate >= 80) return 'text-green-600 bg-green-100';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Gestión de Sucursales
              </h1>
              <p className="text-gray-600">
                Administra las sucursales del Hotel Paraíso
              </p>
            </div>
            
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleCreateBranch}
            >
              Nueva Sucursal
            </Button>
          </div>
        </div>

        {/* Current Branch Alert */}
        {selectedBranch && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">
                  Sucursal Activa
                </h3>
                <p className="text-sm text-blue-700">
                  Actualmente administrando: <strong>{selectedBranch.name}</strong> - {selectedBranch.location}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Branch Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Total Sucursales</h3>
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{branches.length}</div>
            <p className="text-xs text-gray-500">sucursales activas</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Total Habitaciones</h3>
              <Bed className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {branches.reduce((sum, branch) => sum + branch.rooms, 0)}
            </div>
            <p className="text-xs text-gray-500">habitaciones en total</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Huéspedes Actuales</h3>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {branches.reduce((sum, branch) => sum + branch.currentGuests, 0)}
            </div>
            <p className="text-xs text-gray-500">huéspedes activos</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Ocupación Promedio</h3>
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(branches.reduce((sum, branch) => sum + branch.occupancyRate, 0) / branches.length || 0)}%
            </div>
            <p className="text-xs text-gray-500">ocupación general</p>
          </div>
        </div>

        {/* Branches Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
                selectedBranch?.id === branch.id
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Branch Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {branch.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        {branch.location}
                      </div>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={MoreVertical}
                      onClick={() => {/* Toggle menu */}}
                    />
                  </div>
                </div>

                {/* Current Branch Badge */}
                {selectedBranch?.id === branch.id && (
                  <div className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    Sucursal Activa
                  </div>
                )}
              </div>

              {/* Branch Stats */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Bed className="w-4 h-4 text-gray-500 mr-1" />
                      <span className="text-lg font-semibold text-gray-900">
                        {branch.rooms}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">Habitaciones</span>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="w-4 h-4 text-gray-500 mr-1" />
                      <span className="text-lg font-semibold text-gray-900">
                        {branch.currentGuests}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">Huéspedes</span>
                  </div>
                </div>

                {/* Occupancy Rate */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Ocupación</span>
                    <span className={`text-sm px-2 py-1 rounded-full ${getOccupancyColor(branch.occupancyRate)}`}>
                      {branch.occupancyRate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${branch.occupancyRate}%` }}
                    />
                  </div>
                </div>

                {/* Branch Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {branch.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    Gerente: {branch.manager}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <span className="text-sm font-medium text-gray-700">Servicios:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {branch.features.slice(0, 2).map((feature, index) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                    {branch.features.length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{branch.features.length - 2} más
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {selectedBranch?.id !== branch.id && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => handleSwitchToBranch(branch.id)}
                    >
                      Cambiar a esta Sucursal
                    </Button>
                  )}
                  
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Eye}
                      onClick={() => handleViewBranch(branch)}
                    >
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Edit3}
                      onClick={() => handleEditBranch(branch)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Settings}
                      onClick={() => {/* Handle settings */}}
                    >
                      Config
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Branch Modal */}
        {showBranchModal && (
          <BranchModal
            branch={selectedBranchForAction}
            mode={modalMode}
            onClose={() => setShowBranchModal(false)}
            onSave={(branchData) => {
              // Handle save
              setShowBranchModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

// Modal Component for Branch Details
const BranchModal = ({ branch, mode, onClose, onSave }) => {
  const [formData, setFormData] = useState(
    branch || {
      name: '',
      location: '',
      address: '',
      phone: '',
      manager: '',
      rooms: 0,
      features: []
    }
  );

  const isReadOnly = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isCreate && 'Nueva Sucursal'}
            {isEdit && 'Editar Sucursal'}
            {isReadOnly && 'Detalles de Sucursal'}
          </h2>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Sucursal
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Hotel Paraíso - Ubicación"
                disabled={isReadOnly}
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Distrito, Ciudad"
                disabled={isReadOnly}
                required
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección Completa
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Av. Principal 123, Distrito"
                disabled={isReadOnly}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+51 1 234-5678"
                disabled={isReadOnly}
              />
            </div>

            {/* Manager */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gerente
              </label>
              <input
                type="text"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nombre del gerente"
                disabled={isReadOnly}
              />
            </div>

            {/* Rooms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Habitaciones
              </label>
              <input
                type="number"
                value={formData.rooms}
                onChange={(e) => setFormData({ ...formData, rooms: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
                disabled={isReadOnly}
              />
            </div>

            {/* Features */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Servicios y Amenidades
              </label>
              <div className="space-y-2">
                {['WiFi Gratuito', 'Restaurante', 'Spa', 'Piscina', 'Gimnasio', 'Bar', 'Centro de Negocios', 'Shuttle Gratuito', 'Check-in 24h'].map((feature) => (
                  <label key={feature} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.features?.includes(feature) || false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            features: [...(formData.features || []), feature]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            features: (formData.features || []).filter(f => f !== feature)
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isReadOnly}
                    />
                    <span className="ml-2 text-sm text-gray-700">{feature}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              {isReadOnly ? 'Cerrar' : 'Cancelar'}
            </Button>
            
            {!isReadOnly && (
              <Button
                type="submit"
                variant="primary"
              >
                {isCreate ? 'Crear Sucursal' : 'Guardar Cambios'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default BranchManagementPage;