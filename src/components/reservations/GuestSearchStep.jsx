import React, { useState, useEffect } from 'react';
import { Search, User, CheckCircle, Loader2 } from 'lucide-react';

const GuestSearchStep = ({ 
  formData, 
  setFormData, 
  errors, 
  register, 
  setValue, 
  clearErrors,
  searchGuests 
}) => {
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const handleSearch = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const guests = await searchGuests(searchTerm);
        setSearchResults(guests || []);
      } catch (error) {
        console.error('Error searching guests:', error);
      } finally {
        setSearching(false);
      }
    }, 300);

    setSearchTimeout(timeoutId);
  };

  const selectGuest = (guest) => {
    setSelectedGuest(guest);
    setValue('guestName', guest.full_name);
    setValue('guestEmail', guest.email || '');
    setValue('guestPhone', guest.phone || '');
    setValue('guestDocument', guest.document_number || '');
    setSearchResults([]);
    clearErrors(['guestName', 'guestDocument']);
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <User className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Información del Huésped</h3>
      </div>

      {/* Guest Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Buscar Huésped Existente (opcional)
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o documento..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => handleSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          {searching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="animate-spin h-4 w-4 text-blue-600" />
            </div>
          )}
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
            {searchResults.map(guest => (
              <button
                key={guest.id}
                type="button"
                onClick={() => selectGuest(guest)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="font-medium">{guest.full_name}</div>
                <div className="text-sm text-gray-500">
                  {guest.email && `${guest.email} • `}
                  {guest.document_number}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedGuest && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800">
              <strong>Huésped seleccionado:</strong> {selectedGuest.full_name}
            </p>
          </div>
        </div>
      )}

      {/* Guest Form Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Completo *
          </label>
          <input
            type="text"
            {...register('guestName')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.guestName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Ej: Juan Pérez García"
          />
          {errors.guestName && (
            <p className="text-red-600 text-sm mt-1">{errors.guestName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-gray-500">(opcional)</span>
          </label>
          <input
            type="email"
            {...register('guestEmail')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.guestEmail ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="ejemplo@email.com"
          />
          {errors.guestEmail && (
            <p className="text-red-600 text-sm mt-1">{errors.guestEmail.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono <span className="text-gray-500">(opcional)</span>
          </label>
          <input
            type="tel"
            {...register('guestPhone')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+51 987 654 321"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Documento de Identidad *
          </label>
          <input
            type="text"
            {...register('guestDocument')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.guestDocument ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="DNI, Pasaporte, etc."
          />
          {errors.guestDocument && (
            <p className="text-red-600 text-sm mt-1">{errors.guestDocument.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestSearchStep;