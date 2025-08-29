import React, { useState } from 'react';
import { 
  Pencil, 
  Trash2, 
  Phone, 
  FileText,
  Calendar,
  User,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

const GuestList = ({ guests, loading, onEdit, onDelete }) => {
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Función para ordenar huéspedes
  const sortedGuests = [...guests].sort((a, b) => {
    let aValue = a[sortBy] || '';
    let bValue = b[sortBy] || '';

    // Convertir a string en minúsculas para comparación
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Manejar ordenamiento
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Formatear teléfono
  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Obtener iniciales del nombre
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Componente de encabezado sorteable mejorado
  const SortableHeader = ({ field, children, className = '' }) => (
    <th 
      className={`px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-50 transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2 group">
        {children}
        <div className="flex flex-col opacity-60 group-hover:opacity-100 transition-opacity">
          <ChevronUp className={`w-3 h-3 ${sortBy === field && sortOrder === 'asc' ? 'text-blue-600' : 'text-slate-300'}`} />
          <ChevronDown className={`w-3 h-3 -mt-1 ${sortBy === field && sortOrder === 'desc' ? 'text-blue-600' : 'text-slate-300'}`} />
        </div>
      </div>
    </th>
  );

  // Estado de carga mejorado
  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
            <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded-lg w-3/4"></div>
              <div className="h-3 bg-slate-200 rounded-lg w-1/2"></div>
            </div>
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded-lg w-2/3"></div>
                <div className="h-3 bg-slate-200 rounded-lg w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Lista vacía mejorada
  if (!guests || guests.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 p-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl">
          <User className="w-12 h-12 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-700 mb-2">No hay huéspedes</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Comienza registrando tu primer huésped para ver la lista aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      
      {/* Vista de tabla para pantallas grandes */}
      <div className="hidden md:block">
        <table className="min-w-full">
          <thead className="bg-slate-50/50">
            <tr className="border-b border-slate-200">
              <SortableHeader field="full_name">Huésped</SortableHeader>
              <SortableHeader field="document_type">Documento</SortableHeader>
              <SortableHeader field="phone">Contacto</SortableHeader>
              <SortableHeader field="created_at">Registro</SortableHeader>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white/50 backdrop-blur-sm">
            {sortedGuests.map((guest, index) => (
              <tr 
                key={guest.id} 
                className={`border-b border-slate-100 hover:bg-white/80 transition-colors ${
                  index % 2 === 0 ? 'bg-white/30' : 'bg-slate-50/30'
                }`}
              >
                
                {/* Información del huésped */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <span className="text-sm font-bold text-white">
                          {getInitials(guest.full_name)}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">
                        {guest.full_name}
                      </div>
                      <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full inline-block mt-1">
                        ID: {guest.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </td>

                {/* Documento */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {guest.document_type && guest.document_number ? (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <FileText className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {guest.document_type}
                        </div>
                        <div className="text-sm text-slate-600">
                          {guest.document_number}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">Sin documento</span>
                    </div>
                  )}
                </td>

                {/* Contacto */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {guest.phone ? (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Phone className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-medium text-slate-900">
                        {formatPhone(guest.phone)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">Sin teléfono</span>
                    </div>
                  )}
                </td>

                {/* Fecha de registro */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Calendar className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="font-medium text-slate-900">
                      {formatDate(guest.created_at)}
                    </span>
                  </div>
                </td>

                {/* Acciones */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(guest)}
                      className="group p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200"
                      title="Editar huésped"
                    >
                      <Pencil className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={() => onDelete(guest.id)}
                      className="group p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
                      title="Eliminar huésped"
                    >
                      <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista de tarjetas para móvil mejorada */}
      <div className="md:hidden p-4">
        <div className="space-y-4">
          {sortedGuests.map((guest) => (
            <div 
              key={guest.id} 
              className="group bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              
              {/* Header de la tarjeta */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <span className="text-sm font-bold text-white">
                        {getInitials(guest.full_name)}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {guest.full_name}
                    </h3>
                    <p className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full inline-block">
                      {formatDate(guest.created_at)}
                    </p>
                  </div>
                </div>
                
                {/* Acciones móvil */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(guest)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(guest.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Información de la tarjeta */}
              <div className="space-y-3">
                
                {/* Documento */}
                {guest.document_type && guest.document_number && (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <FileText className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {guest.document_type}
                      </div>
                      <div className="text-sm text-slate-600">
                        {guest.document_number}
                      </div>
                    </div>
                  </div>
                )}

                {/* Teléfono */}
                {guest.phone && (
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Phone className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {formatPhone(guest.phone)}
                    </span>
                  </div>
                )}

                {/* Si no tiene documento ni teléfono */}
                {!guest.document_number && !guest.phone && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-sm text-slate-500 italic text-center">
                      Sin información de contacto adicional
                    </div>
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer con información mejorada */}
      <div className="bg-slate-50/50 backdrop-blur-sm px-6 py-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-sm text-slate-600">
            Mostrando <span className="font-semibold text-slate-900">{guests.length}</span> huésped{guests.length !== 1 ? 'es' : ''}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Activo</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Registrado</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default GuestList;