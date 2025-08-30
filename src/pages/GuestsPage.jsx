import React, { useState, useMemo } from 'react';
import { useGuests } from '../hooks/useGuests';
import GuestForm from '../components/GuestForm';
import GuestList from '../components/GuestList';
import { Plus, Search, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const GuestsPage = () => {
  const { 
    guests, 
    loading, 
    error, 
    fetchGuests, 
    createGuest, 
    updateGuest, 
    deleteGuest,
    getGuestsStats
  } = useGuests();

  const [showForm, setShowForm] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({ total: 0, withDocument: 0, withPhone: 0 });

  // Filtrar huéspedes por término de búsqueda (si no se usa la API)
  const filteredGuests = useMemo(() => {
    if (!searchTerm.trim()) return guests;
    
    const term = searchTerm.toLowerCase();
    return guests.filter(guest => 
      guest.full_name.toLowerCase().includes(term) ||
      guest.document_number?.toLowerCase().includes(term) ||
      guest.phone?.toLowerCase().includes(term)
    );
  }, [guests, searchTerm]);

  // Cargar estadísticas al montar
  React.useEffect(() => {
    const loadStats = async () => {
      try {
        const guestStats = await getGuestsStats();
        setStats(guestStats);
      } catch (err) {
        console.error('Error loading stats:', err);
      }
    };
    
    if (guests.length > 0) {
      loadStats();
    }
  }, [guests.length, getGuestsStats]);

  // Manejar creación de huésped
  const handleCreateGuest = async (guestData) => {
    try {
      setIsSubmitting(true);
      await createGuest(guestData);
      setShowForm(false);
      setSelectedGuest(null);
      toast.success('Huésped creado exitosamente');
    } catch (err) {
      toast.error(err.message || 'Error al crear huésped');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar actualización de huésped
  const handleUpdateGuest = async (guestData) => {
    if (!selectedGuest) return;
    
    try {
      setIsSubmitting(true);
      await updateGuest(selectedGuest.id, guestData);
      setShowForm(false);
      setSelectedGuest(null);
      toast.success('Huésped actualizado exitosamente');
    } catch (err) {
      toast.error(err.message || 'Error al actualizar huésped');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar eliminación de huésped
  const handleDeleteGuest = async (guestId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este huésped?')) {
      return;
    }

    try {
      await deleteGuest(guestId);
      toast.success('Huésped eliminado exitosamente');
    } catch (err) {
      toast.error(err.message || 'Error al eliminar huésped');
    }
  };

  // Manejar edición de huésped
  const handleEditGuest = (guest) => {
    setSelectedGuest(guest);
    setShowForm(true);
  };

  // Manejar búsqueda
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Si es una búsqueda avanzada (más de 2 caracteres), buscar en la base de datos
    if (value.length > 2 || value.length === 0) {
      fetchGuests(value);
    }
  };

  // Cerrar formulario
  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedGuest(null);
  };

  // Nuevo huésped
  const handleNewGuest = () => {
    setSelectedGuest(null);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Header con diseño moderno */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Huéspedes
                </h1>
                <p className="text-slate-600 mt-1">
                  Gestiona la información de los huéspedes registrados
                </p>
              </div>
            </div>
            
            <button
              onClick={handleNewGuest}
              className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
              Nuevo Huésped
            </button>
          </div>
        </div>

        {/* Stats Cards con diseño glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-6 hover:bg-white/80 transition-all duration-300 shadow-lg hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 font-medium">Total Huéspedes</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{stats.total || guests.length}</p>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm text-slate-600">Registrados</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          
          <div className="group bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-6 hover:bg-white/80 transition-all duration-300 shadow-lg hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 font-medium">Con Documento</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">
                  {stats.withDocument || guests.filter(g => g.document_number).length}
                </p>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-slate-600">Verificados</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="group bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-6 hover:bg-white/80 transition-all duration-300 shadow-lg hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 font-medium">Con Teléfono</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">
                  {stats.withPhone || guests.filter(g => g.phone).length}
                </p>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  <span className="text-sm text-slate-600">Contactables</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar moderno */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nombre, documento o teléfono..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
          
          {searchTerm && (
            <div className="mt-4 flex items-center gap-2">
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {filteredGuests.length} de {guests.length} huéspedes
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-sm transition-colors"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          )}
        </div>

        {/* Error Message mejorado */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Guest List con diseño moderno */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <GuestList
            guests={filteredGuests}
            loading={loading}
            onEdit={handleEditGuest}
            onDelete={handleDeleteGuest}
          />
        </div>

        {/* Guest Form Modal mejorado */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-8 border-b border-slate-200">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedGuest ? 'Editar Huésped' : 'Nuevo Huésped'}
                  </h2>
                  <p className="text-slate-500 mt-1">
                    {selectedGuest ? 'Modifica la información del huésped' : 'Registra un nuevo huésped'}
                  </p>
                </div>
                <button
                  onClick={handleCloseForm}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <GuestForm
                guest={selectedGuest}
                onSubmit={selectedGuest ? handleUpdateGuest : handleCreateGuest}
                onCancel={handleCloseForm}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default GuestsPage;