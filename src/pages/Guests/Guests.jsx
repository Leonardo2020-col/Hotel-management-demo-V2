import React, { useState } from 'react';
import { Users, Plus, UserX, Search, Filter } from 'lucide-react';
import { useGuests } from '../../hooks/useGuests';
import Button from '../../components/common/Button';
import GuestsGrid from '../../components/guests/GuestsGrid';
import GuestProfile from '../../components/guests/GuestProfile';
import CreateGuestModal from '../../components/guests/CreateGuestModal';
import EditGuestModal from '../../components/guests/EditGuestModal';

const Guests = () => {
  // Estados principales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [selectedGuests, setSelectedGuests] = useState([]);
  
  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    documentType: 'all'
  });

  // Hook personalizado para datos de huéspedes
  const {
    guests,
    guestsStats,
    loading,
    error,
    createGuest,
    updateGuest,
    deleteGuest,
    filterGuests
  } = useGuests();

  // Obtener huéspedes filtrados
  const filteredGuests = filterGuests(filters);

  // Handlers
  const handleCreateGuest = async (guestData) => {
    try {
      await createGuest(guestData);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating guest:', error);
    }
  };

  const handleUpdateGuest = async (guestData) => {
    try {
      if (selectedGuest) {
        await updateGuest(selectedGuest.id, guestData);
        setShowEditModal(false);
        setSelectedGuest(null);
      }
    } catch (error) {
      console.error('Error updating guest:', error);
    }
  };

  const handleDeleteGuest = async (guestId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este huésped?')) {
      try {
        await deleteGuest(guestId);
      } catch (error) {
        console.error('Error deleting guest:', error);
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedGuests.length === 0) return;
    
    if (window.confirm(`¿Estás seguro de que quieres eliminar ${selectedGuests.length} huésped(es)?`)) {
      try {
        for (const guestId of selectedGuests) {
          await deleteGuest(guestId);
        }
        setSelectedGuests([]);
      } catch (error) {
        console.error('Error deleting guests:', error);
      }
    }
  };

  const openProfile = (guest) => {
    setSelectedGuest(guest);
    setShowProfile(true);
  };

  const openEditModal = (guest) => {
    setSelectedGuest(guest);
    setShowEditModal(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      documentType: 'all'
    });
  };

  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.documentType !== 'all';

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-4">
          <UserX className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Huéspedes
          </h1>
          <p className="text-gray-600 mt-1">
            Registro y gestión de huéspedes del hotel
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          {selectedGuests.length > 0 && (
            <Button
              variant="danger"
              onClick={handleDeleteSelected}
              className="mr-2"
            >
              Eliminar ({selectedGuests.length})
            </Button>
          )}
          
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            Nuevo Huésped
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      {guestsStats && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{guestsStats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-gray-900">{guestsStats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Frecuentes</p>
                <p className="text-2xl font-bold text-gray-900">{guestsStats.frequent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Este Mes</p>
                <p className="text-2xl font-bold text-gray-900">{guestsStats.newThisMonth}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
            {hasActiveFilters && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                Activos
              </span>
            )}
          </div>
          
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
            >
              Limpiar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar huéspedes..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          {/* Document Type Filter */}
          <select
            value={filters.documentType}
            onChange={(e) => handleFilterChange('documentType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los documentos</option>
            <option value="DNI">DNI</option>
            <option value="Pasaporte">Pasaporte</option>
            <option value="Carnet">Carné de Extranjería</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">
          {filteredGuests.length} huésped{filteredGuests.length !== 1 ? 'es' : ''} 
          {hasActiveFilters ? ' encontrado' : ' registrado'}{filteredGuests.length !== 1 ? 's' : ''}
        </span>
        
        {filteredGuests.length > 0 && (
          <div className="text-sm text-gray-500">
            {selectedGuests.length > 0 && (
              <span>{selectedGuests.length} seleccionado{selectedGuests.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        )}
      </div>

      {/* Guests Grid */}
      <GuestsGrid
        guests={filteredGuests}
        loading={loading}
        selectedGuests={selectedGuests}
        onSelectGuest={setSelectedGuests}
        onEdit={openEditModal}
        onDelete={handleDeleteGuest}
        onViewProfile={openProfile}
      />

      {/* Modals */}
      {showCreateModal && (
        <CreateGuestModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateGuest}
        />
      )}

      {showEditModal && selectedGuest && (
        <EditGuestModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedGuest(null);
          }}
          onSubmit={handleUpdateGuest}
          guest={selectedGuest}
        />
      )}

      {showProfile && selectedGuest && (
        <GuestProfile
          isOpen={showProfile}
          onClose={() => {
            setShowProfile(false);
            setSelectedGuest(null);
          }}
          guest={selectedGuest}
        />
      )}
    </div>
  );
};

export default Guests;