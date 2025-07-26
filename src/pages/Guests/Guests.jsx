import React, { useState } from 'react';
import { Users, Plus, UserX, Search, Filter, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useGuests } from '../../hooks/useGuests';
import Button from '../../components/common/Button';
import GuestsGrid from '../../components/guests/GuestsGrid';
import GuestProfile from '../../components/guests/GuestProfile';
import CreateGuestModal from '../../components/guests/CreateGuestModal';
import EditGuestModal from '../../components/guests/EditGuestModal';
import toast from 'react-hot-toast';

const Guests = () => {
  // Estados principales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  
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

  

// Reemplazar las funciones handleDeleteGuest y handleDeleteSelected en Guests.jsx

const handleDeleteGuest = async (guestId) => {
  try {
    // Encontrar el huésped para mostrar su nombre
    const guest = guests.find(g => g.id === guestId);
    const guestName = guest?.fullName || guest?.full_name || 'este huésped';
    
    // Confirmación más específica
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar a ${guestName}?\n\n` +
      '⚠️ Esta acción verificará:\n' +
      '• Que no tenga reservas activas (confirmadas, check-in, pendientes)\n' +
      '• Si tiene historial de reservas, se desactivará en lugar de eliminarse\n' +
      '• Si no tiene reservas, se eliminará permanentemente\n\n' +
      'Esta acción no se puede deshacer.'
    );
    
    if (!confirmed) return;
    
    await deleteGuest(guestId);
    
    // Limpiar selección si el huésped eliminado estaba seleccionado
    setSelectedGuests(prev => prev.filter(id => id !== guestId));
    
    // El mensaje de éxito se maneja aquí porque deleteGuest no incluye toast
    toast.success(`${guestName} eliminado/desactivado exitosamente`);
    
  } catch (error) {
    console.error('Error deleting guest:', error);
    
    // Manejar diferentes tipos de errores con mensajes específicos
    let errorMessage = 'Error desconocido al eliminar el huésped';
    
    if (error.message) {
      if (error.message.includes('reserva(s) activa(s)')) {
        errorMessage = error.message; // Usar el mensaje completo que incluye detalles
      } else if (error.message.includes('registros relacionados')) {
        errorMessage = 'No se puede eliminar: el huésped tiene registros relacionados en el sistema';
      } else if (error.message.includes('Error al verificar')) {
        errorMessage = 'Error al verificar las reservas del huésped. Intenta nuevamente.';
      } else {
        errorMessage = error.message;
      }
    }
    
    toast.error(errorMessage, {
      duration: 6000, // Mostrar más tiempo para mensajes largos
      style: {
        maxWidth: '500px',
      },
    });
  }
};

const handleDeleteSelected = async () => {
  if (selectedGuests.length === 0) return;
  
  const confirmed = window.confirm(
    `¿Estás seguro de que quieres eliminar ${selectedGuests.length} huésped(es)?\n\n` +
    '⚠️ PROCESO DE ELIMINACIÓN MASIVA:\n' +
    '• Se verificará cada huésped individualmente\n' +
    '• Los que tengan reservas activas NO se eliminarán\n' +
    '• Los que tengan historial se desactivarán\n' +
    '• Los que no tengan reservas se eliminarán permanentemente\n' +
    '• Recibirás un reporte detallado del proceso\n\n' +
    'Esta acción no se puede deshacer.'
  );
  
  if (!confirmed) return;
  
  try {
    setIsDeleting(true);
    
    const results = {
      successful: [],
      failed: [],
      softDeleted: []
    };
    
    const guestsToDelete = [...selectedGuests]; // Copia para evitar modificaciones
    
    // Procesar eliminación uno por uno
    for (const guestId of guestsToDelete) {
      try {
        const guest = guests.find(g => g.id === guestId);
        const guestName = guest?.fullName || guest?.full_name || `ID: ${guestId}`;
        
        console.log(`Processing deletion for guest: ${guestName} (ID: ${guestId})`);
        
        await deleteGuest(guestId);
        
        results.successful.push(guestName);
        
      } catch (error) {
        const guest = guests.find(g => g.id === guestId);
        const guestName = guest?.fullName || guest?.full_name || `ID: ${guestId}`;
        
        console.error(`Failed to delete guest ${guestName}:`, error);
        
        let errorType = 'Error desconocido';
        if (error.message.includes('reserva(s) activa(s)')) {
          errorType = 'Tiene reservas activas';
        } else if (error.message.includes('registros relacionados')) {
          errorType = 'Tiene registros relacionados';
        } else if (error.message.includes('Error al verificar')) {
          errorType = 'Error de verificación';
        }
        
        results.failed.push({
          name: guestName,
          reason: errorType,
          fullError: error.message
        });
      }
    }
    
    // Mostrar resumen detallado
    const totalProcessed = results.successful.length + results.failed.length;
    
    if (results.successful.length > 0) {
      toast.success(
        `✅ ${results.successful.length} de ${totalProcessed} huésped(es) procesado(s) exitosamente:\n` +
        results.successful.slice(0, 3).join(', ') +
        (results.successful.length > 3 ? `\n... y ${results.successful.length - 3} más` : ''),
        { duration: 5000 }
      );
    }
    
    if (results.failed.length > 0) {
      const failureMessage = results.failed.slice(0, 3).map(f => 
        `• ${f.name}: ${f.reason}`
      ).join('\n');
      
      toast.error(
        `❌ ${results.failed.length} huésped(es) no pudieron procesarse:\n` +
        failureMessage +
        (results.failed.length > 3 ? `\n... y ${results.failed.length - 3} más` : '') +
        '\n\nRevisa la consola para más detalles.',
        { 
          duration: 8000,
          style: { maxWidth: '600px' }
        }
      );
      
      // Log detallado en consola
      console.group('🚨 Detalles de errores en eliminación masiva:');
      results.failed.forEach(failure => {
        console.error(`${failure.name}: ${failure.fullError}`);
      });
      console.groupEnd();
    }
    
    // Limpiar selección
    setSelectedGuests([]);
    
  } catch (error) {
    console.error('Error in bulk delete process:', error);
    toast.error('Error crítico durante la eliminación masiva: ' + error.message);
  } finally {
    setIsDeleting(false);
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

  // Seleccionar/deseleccionar todos
  const handleSelectAll = () => {
    if (selectedGuests.length === filteredGuests.length && filteredGuests.length > 0) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(filteredGuests.map(g => g.id));
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-4">
          <UserX className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
          <p className="text-gray-600">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Reintentar
          </Button>
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
              disabled={isDeleting}
              loading={isDeleting}
              icon={selectedGuests.length > 1 ? Users : UserX}
            >
              {isDeleting ? 'Eliminando...' : `Eliminar (${selectedGuests.length})`}
            </Button>
          )}
          
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
            disabled={isDeleting}
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
                <CheckCircle className="w-6 h-6 text-green-600" />
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

      {/* Alert de eliminación masiva */}
      {isDeleting && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400 animate-pulse" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">Procesando eliminación...</span>
                {' '}Por favor espera mientras se procesan las eliminaciones. No cierres esta ventana.
              </p>
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
              icon={X}
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

        {/* Filtros rápidos */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={filters.status === 'active' ? 'primary' : 'outline'}
            onClick={() => handleFilterChange('status', filters.status === 'active' ? 'all' : 'active')}
            icon={CheckCircle}
          >
            Solo Activos
          </Button>
          
          <Button
            size="sm"
            variant={filters.documentType === 'DNI' ? 'primary' : 'outline'}
            onClick={() => handleFilterChange('documentType', filters.documentType === 'DNI' ? 'all' : 'DNI')}
          >
            Solo DNI
          </Button>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {filteredGuests.length} huésped{filteredGuests.length !== 1 ? 'es' : ''} 
            {hasActiveFilters ? ' encontrado' : ' registrado'}{filteredGuests.length !== 1 ? 's' : ''}
          </span>
          
          {filteredGuests.length > 0 && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedGuests.length === filteredGuests.length && filteredGuests.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isDeleting}
              />
              <span className="text-sm text-gray-500">
                Seleccionar todos
              </span>
            </div>
          )}
        </div>
        
        {selectedGuests.length > 0 && (
          <div className="text-sm text-gray-500 flex items-center space-x-4">
            <span>{selectedGuests.length} seleccionado{selectedGuests.length !== 1 ? 's' : ''}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedGuests([])}
              disabled={isDeleting}
            >
              Limpiar selección
            </Button>
          </div>
        )}
      </div>

      {/* Información adicional */}
      {filteredGuests.length > 0 && guestsStats && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Users className="h-5 w-5 text-blue-600 mt-0.5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Información del sistema
              </h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Los huéspedes con reservas activas no pueden eliminarse</p>
                <p>• Se recomienda verificar el historial antes de eliminar</p>
                <p>• Total de huéspedes registrados: {guestsStats.total}</p>
                {guestsStats.documentTypes && (
                  <p>• Tipos de documento más comunes: {Object.keys(guestsStats.documentTypes).slice(0, 2).join(', ')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Empty State - Sin huéspedes registrados */}
      {!loading && filteredGuests.length === 0 && !hasActiveFilters && guests.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="max-w-md mx-auto">
            <Users className="mx-auto h-16 w-16 text-gray-400 mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Bienvenido al sistema de huéspedes!
            </h3>
            <p className="text-gray-600 mb-8">
              Aún no tienes huéspedes registrados. Comienza agregando tu primer huésped para gestionar las reservas del hotel.
            </p>
            <div className="space-y-4">
              <Button
                variant="primary"
                size="lg"
                icon={Plus}
                onClick={() => setShowCreateModal(true)}
                className="px-8"
              >
                Registrar Primer Huésped
              </Button>
              <div className="text-sm text-gray-500">
                El registro es rápido y solo requiere información básica
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State - Con filtros aplicados */}
      {!loading && filteredGuests.length === 0 && hasActiveFilters && guests.length > 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron huéspedes
          </h3>
          <p className="text-gray-600 mb-6">
            No hay huéspedes que coincidan con los filtros aplicados.
            <br />
            Intenta con diferentes criterios de búsqueda.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={clearFilters}
              icon={X}
            >
              Limpiar Todos los Filtros
            </Button>
            <span className="text-sm text-gray-500">o</span>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowCreateModal(true)}
            >
              Registrar Nuevo Huésped
            </Button>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Total de huéspedes en el sistema: {guests.length}
          </div>
        </div>
      )}

      {/* Loading State específico para guests grid */}
      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Cargando huéspedes...</span>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateGuestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateGuest}
      />

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

      {/* Floating Action Button para móviles (opcional) */}
      <div className="fixed bottom-6 right-6 sm:hidden">
        <Button
          variant="primary"
          size="lg"
          icon={Plus}
          onClick={() => setShowCreateModal(true)}
          className="rounded-full w-14 h-14 shadow-lg"
          disabled={isDeleting}
        >
          <span className="sr-only">Agregar huésped</span>
        </Button>
      </div>
    </div>
  );
};

export default Guests;