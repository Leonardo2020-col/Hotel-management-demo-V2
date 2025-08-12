// src/pages/Guests/Guests.jsx - INTEGRADO CON SUPABASE Y HOOKS
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Star,
  CreditCard,
  FileText,
  Download,
  Upload,
  Users,
  AlertCircle,
  Check,
  X,
  Clock,
  Bed,
  History,
  Package
} from 'lucide-react';
import { useGuests } from '../../hooks/useGuests';
import toast from 'react-hot-toast';

// Componente de tarjeta de huésped integrado con hooks
const GuestCard = ({ guest, onEdit, onDelete, onViewDetails, onToggleStatus }) => {
  const getStatusConfig = (status) => {
    const configs = {
      active: {
        color: 'green',
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        icon: UserCheck,
        label: 'Activo'
      },
      inactive: {
        color: 'gray',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-700',
        icon: UserX,
        label: 'Inactivo'
      }
    };
    return configs[status] || configs.active;
  };

  const statusConfig = getStatusConfig(guest.status);
  const StatusIcon = statusConfig.icon;

  // Calcular valor del cliente
  const getCustomerValue = () => {
    const totalSpent = guest.totalSpent || guest.total_spent || 0;
    if (totalSpent >= 1000) return { level: 'VIP', color: 'text-purple-600', bg: 'bg-purple-100' };
    if (totalSpent >= 500) return { level: 'Premium', color: 'text-gold-600', bg: 'bg-yellow-100' };
    return { level: 'Regular', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const customerValue = getCustomerValue();

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 ${statusConfig.border} hover:shadow-md transition-all duration-200`}>
      {/* Header de la tarjeta */}
      <div className={`${statusConfig.bg} p-4 rounded-t-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {guest.fullName || guest.full_name}
              </h3>
              <div className={`flex items-center space-x-1 ${statusConfig.text}`}>
                <StatusIcon size={14} />
                <span className="text-sm font-medium">{statusConfig.label}</span>
              </div>
            </div>
          </div>
          
          {/* Customer Value Badge */}
          <div className={`${customerValue.bg} ${customerValue.color} px-3 py-1 rounded-full flex items-center space-x-1`}>
            <Star size={14} />
            <span className="text-xs font-semibold">{customerValue.level}</span>
          </div>

          {/* Menú de acciones */}
          <div className="relative group">
            <button className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors">
              <MoreVertical size={16} className="text-gray-600" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button 
                onClick={() => onViewDetails(guest)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Eye size={14} />
                <span>Ver detalles</span>
              </button>
              <button 
                onClick={() => onEdit(guest)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Edit size={14} />
                <span>Editar</span>
              </button>
              <button 
                onClick={() => onToggleStatus(guest)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                {guest.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                <span>{guest.status === 'active' ? 'Desactivar' : 'Activar'}</span>
              </button>
              <button 
                onClick={() => onDelete(guest)}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <Trash2 size={14} />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido de la tarjeta */}
      <div className="p-4 space-y-4">
        {/* Información de contacto */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail size={14} />
            <span>{guest.email || 'Sin email'}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone size={14} />
            <span>{guest.phone || 'Sin teléfono'}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FileText size={14} />
            <span>
              {guest.documentType || guest.document_type || 'DNI'}: {guest.documentNumber || guest.document_number || 'Sin documento'}
            </span>
          </div>
        </div>

        {/* Estadísticas del huésped */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {guest.totalVisits || guest.total_visits || 0}
            </div>
            <div className="text-xs text-gray-600">Visitas</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              S/ {(guest.totalSpent || guest.total_spent || 0).toFixed(0)}
            </div>
            <div className="text-xs text-gray-600">Gastado</div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="text-xs text-gray-500 border-t pt-2">
          <div className="flex justify-between">
            <span>
              Registrado: {new Date(guest.createdAt || guest.created_at).toLocaleDateString('es-ES')}
            </span>
            {guest.lastVisit || guest.last_visit ? (
              <span>
                Última visita: {new Date(guest.lastVisit || guest.last_visit).toLocaleDateString('es-ES')}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal de detalles del huésped
const GuestDetailsModal = ({ guest, isOpen, onClose }) => {
  if (!isOpen || !guest) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {guest.fullName || guest.full_name}
              </h2>
              <p className="text-gray-600">Información detallada del huésped</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información personal */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Información Personal</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{guest.email || 'No registrado'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Teléfono</label>
                  <p className="text-gray-900">{guest.phone || 'No registrado'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Documento</label>
                  <p className="text-gray-900">
                    {guest.documentType || guest.document_type || 'DNI'}: {guest.documentNumber || guest.document_number || 'No registrado'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Estado</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    guest.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {guest.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Estadísticas</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {guest.totalVisits || guest.total_visits || 0}
                  </div>
                  <div className="text-sm text-blue-700">Total Visitas</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    S/ {(guest.totalSpent || guest.total_spent || 0).toFixed(0)}
                  </div>
                  <div className="text-sm text-green-700">Total Gastado</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Registrado</label>
                  <p className="text-gray-900">
                    {new Date(guest.createdAt || guest.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                {guest.lastVisit || guest.last_visit ? (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Última Visita</label>
                    <p className="text-gray-900">
                      {new Date(guest.lastVisit || guest.last_visit).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
            <button 
              onClick={() => {/* Implementar edición */}}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Editar Huésped
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal de agregar/editar huésped
const GuestFormModal = ({ guest, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    documentType: 'DNI',
    documentNumber: '',
    status: 'active'
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (guest && isOpen) {
      setFormData({
        fullName: guest.fullName || guest.full_name || '',
        email: guest.email || '',
        phone: guest.phone || '',
        documentType: guest.documentType || guest.document_type || 'DNI',
        documentNumber: guest.documentNumber || guest.document_number || '',
        status: guest.status || 'active'
      });
    } else if (isOpen && !guest) {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        documentType: 'DNI',
        documentNumber: '',
        status: 'active'
      });
    }
  }, [guest, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName.trim()) {
      toast.error('El nombre completo es obligatorio');
      return;
    }

    if (!formData.documentNumber.trim()) {
      toast.error('El número de documento es obligatorio');
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving guest:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {guest ? 'Editar Huésped' : 'Agregar Huésped'}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingrese el nombre completo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+51 987 654 321"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Documento
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="DNI">DNI</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="CE">Carné de Extranjería</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número *
                </label>
                <input
                  type="text"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="12345678"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Guardando...' : (guest ? 'Actualizar' : 'Crear')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Componente principal de Huéspedes integrado con hooks
const Guests = () => {
  // Usar el hook personalizado integrado con Supabase
  const { 
    guests, 
    guestsStats, 
    loading, 
    error, 
    createGuest, 
    updateGuest, 
    deleteGuest,
    checkGuestReservations
  } = useGuests();

  // Estados locales para UI
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');

  // Filtrar huéspedes
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = !searchTerm || 
      (guest.fullName || guest.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guest.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guest.phone || '').includes(searchTerm) ||
      (guest.documentNumber || guest.document_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || guest.status === statusFilter;
    
    const matchesDocumentType = documentTypeFilter === 'all' || 
      (guest.documentType || guest.document_type) === documentTypeFilter;
    
    return matchesSearch && matchesStatus && matchesDocumentType;
  });

  // Handlers
  const handleAddGuest = () => {
    setSelectedGuest(null);
    setShowFormModal(true);
  };

  const handleEditGuest = (guest) => {
    setSelectedGuest(guest);
    setShowFormModal(true);
  };

  const handleViewDetails = (guest) => {
    setSelectedGuest(guest);
    setShowDetailsModal(true);
  };

  const handleDeleteGuest = async (guest) => {
    try {
      // Verificar reservas activas primero
      const reservationCheck = await checkGuestReservations(guest.id);
      
      if (reservationCheck.hasActiveReservations) {
        const reservationList = reservationCheck.reservations
          .map(r => `${r.confirmation_code} (${r.status})`)
          .join(', ');
        
        toast.error(
          `No se puede eliminar el huésped. Tiene ${reservationCheck.reservations.length} reserva(s) activa(s): ${reservationList}`
        );
        return;
      }

      const confirmMessage = `¿Estás seguro de eliminar a ${guest.fullName || guest.full_name}?`;
      
      if (window.confirm(confirmMessage)) {
        await deleteGuest(guest.id);
        toast.success('Huésped eliminado exitosamente');
      }
    } catch (error) {
      console.error('Error deleting guest:', error);
      
      if (error.message.includes('reserva')) {
        toast.error(error.message);
      } else {
        toast.error('Error al eliminar el huésped');
      }
    }
  };

  const handleToggleStatus = async (guest) => {
    const newStatus = guest.status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? 'activar' : 'desactivar';
    
    if (window.confirm(`¿Estás seguro de ${actionText} a ${guest.fullName || guest.full_name}?`)) {
      try {
        await updateGuest(guest.id, { status: newStatus });
        toast.success(`Huésped ${actionText === 'activar' ? 'activado' : 'desactivado'} exitosamente`);
      } catch (error) {
        toast.error(`Error al ${actionText} el huésped`);
      }
    }
  };

  const handleSaveGuest = async (formData) => {
    try {
      const guestData = {
        full_name: formData.fullName,
        email: formData.email || null,
        phone: formData.phone || null,
        document_type: formData.documentType,
        document_number: formData.documentNumber,
        status: formData.status
      };

      if (selectedGuest) {
        await updateGuest(selectedGuest.id, guestData);
        toast.success('Huésped actualizado exitosamente');
      } else {
        await createGuest(guestData);
        toast.success('Huésped creado exitosamente');
      }
    } catch (error) {
      throw error; // El error se maneja en el modal
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="text-red-600 mr-2" size={20} />
          <p className="text-red-700">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Huéspedes</h1>
          <p className="text-gray-600 mt-1">
            Gestiona la información de tus huéspedes
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
            <Download size={20} />
            <span>Exportar</span>
          </button>
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
            <Upload size={20} />
            <span>Importar</span>
          </button>
          <button 
            onClick={handleAddGuest}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Agregar huésped</span>
          </button>
        </div>
      </div>

      {/* Métricas rápidas */}
      {guestsStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total huéspedes</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{guestsStats.total}</p>
              </div>
              <Users className="text-gray-400" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{guestsStats.active}</p>
              </div>
              <UserCheck className="text-green-400" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nuevos este mes</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{guestsStats.newThisMonth}</p>
              </div>
              <Calendar className="text-blue-400" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos totales</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  S/ {guestsStats.totalRevenue?.toFixed(0) || '0'}
                </p>
              </div>
              <CreditCard className="text-purple-400" size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar huésped..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          {/* Filtro por tipo de documento */}
          <select
            value={documentTypeFilter}
            onChange={(e) => setDocumentTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los documentos</option>
            <option value="DNI">DNI</option>
            <option value="Pasaporte">Pasaporte</option>
            <option value="CE">Carné de Extranjería</option>
          </select>

          {/* Limpiar filtros */}
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setDocumentTypeFilter('all');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <X size={16} />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Grid de huéspedes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredGuests.map((guest) => (
          <GuestCard
            key={guest.id}
            guest={guest}
            onEdit={handleEditGuest}
            onDelete={handleDeleteGuest}
            onViewDetails={handleViewDetails}
            onToggleStatus={handleToggleStatus}
          />
        ))}
      </div>

      {/* Estado vacío */}
      {filteredGuests.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron huéspedes
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all' || documentTypeFilter !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza agregando el primer huésped'
            }
          </p>
          {searchTerm || statusFilter !== 'all' || documentTypeFilter !== 'all' ? (
            <button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDocumentTypeFilter('all');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Limpiar filtros
            </button>
          ) : (
            <button 
              onClick={handleAddGuest}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Agregar primer huésped
            </button>
          )}
        </div>
      )}

      {/* Modales */}
      <GuestDetailsModal
        guest={selectedGuest}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedGuest(null);
        }}
      />

      <GuestFormModal
        guest={selectedGuest}
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedGuest(null);
        }}
        onSave={handleSaveGuest}
      />
    </div>
  );
};

export default Guests;