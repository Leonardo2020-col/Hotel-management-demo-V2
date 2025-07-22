// src/pages/Supplies/Supplies.jsx - Complete Enhanced Version
import React, { useState, useMemo } from 'react';
import { Package, Plus, Search, Filter, TrendingDown, AlertTriangle, FileText, Cookie, Wrench, BarChart3 } from 'lucide-react';
import { useSupplies } from '../../hooks/useSupplies';
import Button from '../../components/common/Button';
import SuppliesStats from '../../components/supplies/SuppliesStats';
import SuppliesFilters from '../../components/supplies/SuppliesFilters';
import SuppliesGrid from '../../components/supplies/SuppliesGrid';
import SuppliesList from '../../components/supplies/SuppliesList';
import ConsumptionHistory from '../../components/supplies/ConsumptionHistory';
import CreateSupplyModal from '../../components/supplies/CreateSupplyModal';
import EditSupplyModal from '../../components/supplies/EditSupplyModal';
import ConsumptionModal from '../../components/supplies/ConsumptionModal';

const Supplies = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState('inventory');
  const [viewMode, setViewMode] = useState('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState(null);
  const [selectedSupplies, setSelectedSupplies] = useState([]);
  
  // Filtros mejorados con soporte para tipos de items
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    supplier: 'all',
    search: '',
    lowStock: false,
    itemType: 'all' // New filter for item type
  });

  // Hook personalizado para datos de inventario unificado
  const {
    supplies,
    categories,
    suppliers,
    suppliesStats,
    consumptionHistory,
    loading,
    error,
    createSupply,
    updateSupply,
    deleteSupply,
    recordConsumption,
    adjustStock,
    getSnackItems,
    getSupplyItems,
    hasUnifiedInventory,
    itemTypeCounts,
    refreshData
  } = useSupplies();

  // Configuración de tabs mejorada
  const tabs = [
    { 
      id: 'inventory', 
      label: 'Inventario Unificado', 
      shortLabel: 'Inventario',
      icon: Package,
      description: 'Gestión completa de insumos y snacks'
    },
    { 
      id: 'consumption', 
      label: 'Historial de Consumo', 
      shortLabel: 'Consumo',
      icon: TrendingDown,
      description: 'Registro de movimientos de inventario'
    },
    {
      id: 'analytics',
      label: 'Análisis y Reportes',
      shortLabel: 'Análisis', 
      icon: BarChart3,
      description: 'Estadísticas y tendencias'
    }
  ];

  // Handlers
  const handleCreateSupply = async (supplyData) => {
    try {
      await createSupply(supplyData);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const handleEditSupply = async (supplyData) => {
    try {
      await updateSupply(selectedSupply.id, supplyData);
      setShowEditModal(false);
      setSelectedSupply(null);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteSupply = async (supplyId) => {
    const item = supplies.find(s => s.id === supplyId);
    const itemType = item?.item_type === 'snack' ? 'snack' : 'insumo';
    
    if (window.confirm(`¿Estás seguro de que quieres eliminar este ${itemType}?`)) {
      try {
        await deleteSupply(supplyId);
        // Remover de selección si estaba seleccionado
        setSelectedSupplies(prev => prev.filter(id => id !== supplyId));
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const handleRecordConsumption = async (consumptionData) => {
    try {
      await recordConsumption(consumptionData);
      setShowConsumptionModal(false);
      setSelectedSupply(null);
      setSelectedSupplies([]); // Limpiar selección después del consumo
    } catch (error) {
      console.error('Error recording consumption:', error);
    }
  };

  const handleAdjustStock = async (supplyId, adjustment) => {
    try {
      await adjustStock(supplyId, adjustment);
    } catch (error) {
      console.error('Error adjusting stock:', error);
    }
  };

  const openEditModal = (supply) => {
    setSelectedSupply(supply);
    setShowEditModal(true);
  };

  const openConsumptionModal = (supply) => {
    // Only allow consumption for supplies, not snacks
    if (supply.item_type === 'snack') {
      return;
    }
    setSelectedSupply(supply);
    setShowConsumptionModal(true);
  };

  // Función de filtrado mejorada con soporte para tipos de items
  const filteredSupplies = useMemo(() => {
    if (!supplies) return [];

    return supplies.filter(supply => {
      // Filtro por tipo de item
      if (filters.itemType !== 'all') {
        if (filters.itemType === 'snack' && supply.item_type !== 'snack') return false;
        if (filters.itemType === 'supply' && supply.item_type !== 'supply') return false;
      }

      // Filtro por búsqueda
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          supply.name.toLowerCase().includes(searchTerm) ||
          supply.description.toLowerCase().includes(searchTerm) ||
          supply.sku.toLowerCase().includes(searchTerm) ||
          supply.category.toLowerCase().includes(searchTerm) ||
          supply.supplier.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      // Filtro por categoría
      if (filters.category !== 'all' && supply.category !== filters.category) return false;
      
      // Filtro por proveedor
      if (filters.supplier !== 'all' && supply.supplier !== filters.supplier) return false;
      
      // Filtro por estado de stock (solo para supplies)
      if (filters.status !== 'all' && supply.item_type === 'supply') {
        if (filters.status === 'ok' && (supply.currentStock === 0 || supply.currentStock <= supply.minStock)) return false;
        if (filters.status === 'low' && (supply.currentStock === 0 || supply.currentStock > supply.minStock)) return false;
        if (filters.status === 'out' && supply.currentStock !== 0) return false;
      }
      
      // Filtro solo stock bajo (solo para supplies)
      if (filters.lowStock && supply.item_type === 'supply' && supply.currentStock > supply.minStock) return false;
      
      return true;
    });
  }, [supplies, filters]);

  // Función para determinar si el consumo está disponible
  const isConsumptionAvailable = () => {
    const selectedSupplyItems = selectedSupplies
      .map(id => supplies.find(s => s.id === id))
      .filter(item => item && item.item_type === 'supply');
    
    return selectedSupplyItems.length > 0;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-4">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-2">
            <Button 
              variant="primary" 
              onClick={refreshData}
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Reintentar'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Recargar Página
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Gestión de Inventario
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Administra insumos de hotel y snacks para huéspedes
          </p>
          {hasUnifiedInventory && (
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center">
                <Wrench className="w-4 h-4 mr-1" />
                {itemTypeCounts?.supplies || 0} Insumos
              </span>
              <span className="flex items-center">
                <Cookie className="w-4 h-4 mr-1" />
                {itemTypeCounts?.snacks || 0} Snacks
              </span>
              <span>Total: {itemTypeCounts?.total || 0} items</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {selectedSupplies.length > 0 && activeTab === 'inventory' && (
            <div className="flex items-center justify-between sm:justify-start sm:space-x-2 p-3 bg-blue-50 rounded-lg sm:bg-transparent sm:p-0">
              <span className="text-xs sm:text-sm text-gray-600">
                {selectedSupplies.length} seleccionado{selectedSupplies.length > 1 ? 's' : ''}
              </span>
              {isConsumptionAvailable() && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={TrendingDown}
                  onClick={() => setShowConsumptionModal(true)}
                  className="ml-2 sm:ml-0"
                >
                  <span className="hidden sm:inline">Registrar Consumo</span>
                  <span className="sm:hidden">Consumir</span>
                </Button>
              )}
            </div>
          )}
          
          {activeTab === 'inventory' && (
            <>
              <Button
                variant="outline"
                icon={Package}
                onClick={refreshData}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                <span className="hidden sm:inline">
                  {loading ? 'Actualizando...' : 'Actualizar'}
                </span>
                <span className="sm:hidden">
                  {loading ? 'Cargando...' : 'Sync'}
                </span>
              </Button>
              
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto"
              >
                <span className="hidden sm:inline">Nuevo Item</span>
                <span className="sm:hidden">Agregar</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors min-w-max`}
              >
                <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'inventory' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Statistics */}
          <SuppliesStats 
            stats={suppliesStats} 
            loading={loading} 
          />

          {/* Filters */}
          <div className="space-y-4">
            <SuppliesFilters
              filters={filters}
              onFiltersChange={setFilters}
              categories={categories || []}
              suppliers={suppliers || []}
              loading={loading}
            />

            {/* Item Type Filter */}
            {hasUnifiedInventory && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Tipo de Item:</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, itemType: 'all' }))}
                      className={`px-3 py-1 rounded text-xs transition-colors ${
                        filters.itemType === 'all' 
                          ? 'bg-white text-blue-600 shadow-sm font-medium' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Todos ({itemTypeCounts?.total || 0})
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, itemType: 'supply' }))}
                      className={`px-3 py-1 rounded text-xs transition-colors flex items-center space-x-1 ${
                        filters.itemType === 'supply' 
                          ? 'bg-white text-blue-600 shadow-sm font-medium' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Wrench size={12} />
                      <span>Insumos ({itemTypeCounts?.supplies || 0})</span>
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, itemType: 'snack' }))}
                      className={`px-3 py-1 rounded text-xs transition-colors flex items-center space-x-1 ${
                        filters.itemType === 'snack' 
                          ? 'bg-white text-orange-600 shadow-sm font-medium' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Cookie size={12} />
                      <span>Snacks ({itemTypeCounts?.snacks || 0})</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {filteredSupplies.length} item{filteredSupplies.length !== 1 ? 's' : ''} encontrado{filteredSupplies.length !== 1 ? 's' : ''}
              </span>
              {filters.lowStock && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <AlertTriangle size={12} className="mr-1" />
                  Stock bajo
                </span>
              )}
              {filters.itemType !== 'all' && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  filters.itemType === 'snack' 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {filters.itemType === 'snack' ? (
                    <>
                      <Cookie size={12} className="mr-1" />
                      Solo snacks
                    </>
                  ) : (
                    <>
                      <Wrench size={12} className="mr-1" />
                      Solo insumos
                    </>
                  )}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Vista:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Package size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <FileText size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Supplies Display */}
          {viewMode === 'grid' ? (
            <SuppliesGrid
              supplies={filteredSupplies}
              loading={loading}
              selectedSupplies={selectedSupplies}
              onSelectSupply={setSelectedSupplies}
              onEdit={openEditModal}
              onDelete={handleDeleteSupply}
              onRecordConsumption={openConsumptionModal}
              onAdjustStock={handleAdjustStock}
            />
          ) : (
            <SuppliesList
              supplies={filteredSupplies}
              loading={loading}
              selectedSupplies={selectedSupplies}
              onSelectSupply={setSelectedSupplies}
              onEdit={openEditModal}
              onDelete={handleDeleteSupply}
              onRecordConsumption={openConsumptionModal}
              onAdjustStock={handleAdjustStock}
            />
          )}

          {/* Empty State para items filtrados */}
          {!loading && filteredSupplies.length === 0 && supplies && supplies.length > 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron items
              </h3>
              <p className="text-gray-600 mb-4">
                Intenta ajustar los filtros de búsqueda
              </p>
              <Button
                variant="outline"
                onClick={() => setFilters({
                  category: 'all',
                  status: 'all',
                  supplier: 'all',
                  search: '',
                  lowStock: false,
                  itemType: 'all'
                })}
              >
                Limpiar Filtros
              </Button>
            </div>
          )}

          {/* Initial Empty State */}
          {!loading && supplies && supplies.length === 0 && (
            <div className="text-center py-12">
              <div className="flex justify-center space-x-4 mb-4">
                <Wrench className="h-8 w-8 text-gray-400" />
                <Cookie className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aún no tienes inventario
              </h3>
              <p className="text-gray-600 mb-4">
                Comienza agregando tus primeros insumos y snacks
              </p>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setShowCreateModal(true)}
              >
                Agregar Primer Item
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'consumption' && (
        <ConsumptionHistory
          history={consumptionHistory}
          supplies={supplies}
          loading={loading}
        />
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Analytics Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Distribución por Categoría
              </h3>
              <div className="space-y-3">
                {categories?.slice(0, 8).map(category => {
                  const categoryItems = supplies.filter(s => s.category === category);
                  const percentage = supplies.length > 0 ? (categoryItems.length / supplies.length * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{category}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{categoryItems.length}</span>
                        <span className="text-xs text-gray-500">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Item Type Distribution */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-green-600" />
                Distribución por Tipo
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Wrench className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Insumos de Hotel</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">
                    {itemTypeCounts?.supplies || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Cookie className="w-5 h-5 text-orange-600" />
                    <span className="font-medium text-orange-800">Snacks para Huéspedes</span>
                  </div>
                  <span className="text-xl font-bold text-orange-600">
                    {itemTypeCounts?.snacks || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Stock Status (Supplies Only) */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                Estado de Stock (Solo Insumos)
              </h3>
              <div className="space-y-3">
                {[
                  { 
                    label: 'Stock Normal', 
                    count: supplies.filter(s => s.item_type === 'supply' && s.currentStock > s.minStock).length,
                    color: 'bg-green-500'
                  },
                  { 
                    label: 'Stock Bajo', 
                    count: supplies.filter(s => s.item_type === 'supply' && s.currentStock <= s.minStock && s.currentStock > 0).length,
                    color: 'bg-yellow-500'
                  },
                  { 
                    label: 'Sin Stock', 
                    count: supplies.filter(s => s.item_type === 'supply' && s.currentStock === 0).length,
                    color: 'bg-red-500'
                  }
                ].map(status => (
                  <div key={status.label} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 ${status.color} rounded-full`}></div>
                      <span className="text-sm text-gray-700">{status.label}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{status.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Value Distribution */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                Valor del Inventario
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="font-medium text-purple-800">Valor Total</span>
                  <span className="text-xl font-bold text-purple-600">
                    S/ {(suppliesStats.totalValue || 0).toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="text-sm text-blue-700">Insumos</div>
                    <div className="font-bold text-blue-600">
                      S/ {(suppliesStats.suppliesValue || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <div className="text-sm text-orange-700">Snacks</div>
                    <div className="font-bold text-orange-600">
                      S/ {(suppliesStats.snacksValue || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, itemType: 'supply', lowStock: true }))}
                className="justify-start"
              >
                <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
                Ver Stock Bajo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, itemType: 'snack' }))}
                className="justify-start"
              >
                <Cookie className="w-4 h-4 mr-2 text-orange-600" />
                Ver Solo Snacks
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, itemType: 'supply' }))}
                className="justify-start"
              >
                <Wrench className="w-4 h-4 mr-2 text-blue-600" />
                Ver Solo Insumos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('consumption')}
                className="justify-start"
              >
                <TrendingDown className="w-4 h-4 mr-2 text-purple-600" />
                Ver Consumos
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateSupplyModal
          isOpen={showCreateModal}
          onClose={() => setShowCreate