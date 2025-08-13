// src/pages/Reservations/Reservations.jsx - VERSIÓN COMPLETAMENTE INTEGRADA
import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Filter, Download, Upload, Lock, AlertCircle, RefreshCw, Eye, FileText, X, User, Edit, Clock, DollarSign } from 'lucide-react';
import { useReservations } from '../../hooks/useReservations';
// import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import ReservationFilters from '../../components/reservations/ReservationFilters';
import ReservationList from '../../components/reservations/ReservationList';
import ReservationStats from '../../components/reservations/ReservationStats';
import CreateReservationModal from '../../components/reservations/CreateReservationModal';
import ReservationCalendar from '../../components/reservations/ReservationCalendar';
import toast from 'react-hot-toast';

const Reservations = () => {
  // Temporalmente comentamos useAuth para debuggear
  // const { hasPermission, hasRole, user } = useAuth();
  // const canWrite = hasPermission('reservations', 'write');
  // const isAdmin = hasRole('admin');
  // const isReception = hasRole('reception');

  // Valores temporales para debug
  const canWrite = true;
  const isAdmin = false;
  const isReception = true;
  const user = { email: 'test@example.com' };

  // Hook principal de reservas
  const {
    reservations,
    allReservations,
    loading,
    error,
    operationLoading,
    filters,
    setFilters,
    pagination,
    setPagination,
    createReservation,
    updateReservation,
    deleteReservation,
    changeReservationStatus,
    getReservationStats,
    refresh,
    RESERVATION_STATUS
  } = useReservations();

  // Estados locales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Debug: Verificar que el hook se está ejecutando
  useEffect(() => {
    console.log('🔍 Reservations component mounted');
    console.log('📊 Current state:', {
      loading,
      error,
      operationLoading,
      reservationsCount: reservations?.length || 0,
      filters
    });
  }, [loading, error, operationLoading, reservations, filters]);

  // Verificar si hay errores en el hook
  useEffect(() => {
    if (error) {
      console.error('❌ Error in reservations hook:', error);
      toast.error('Error al cargar reservas: ' + error);
    }
  }, [error]);

  const stats = getReservationStats();

  // Filtrar reservas según el rol
  const getFilteredReservations = () => {
    if (!reservations || !Array.isArray(reservations)) {
      console.warn('⚠️ Reservations is not an array:', reservations);
      return [];
    }

    let filteredReservations = reservations;

    // Si es administrador sin permisos de recepción, mostrar solo reservas limitadas
    if (isAdmin && !isReception) {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      filteredReservations = reservations.filter(reservation => {
        try {
          const checkInDate = new Date(reservation.checkIn);
          return checkInDate >= today && checkInDate <= nextWeek;
        } catch (error) {
          console.warn('Invalid date in reservation:', reservation);
          return false;
        }
      });
    }

    return filteredReservations;
  };

  const filteredReservations = getFilteredReservations();

  // =============================================
  // HANDLERS DE OPERACIONES
  // =============================================

  const handleCreateReservation = async (reservationData) => {
    if (!canWrite) {
      toast.error('No tienes permisos para crear reservas');
      return;
    }

    try {
      console.log('🏨 Creating reservation from page component:', reservationData);
      await createReservation(reservationData);
      setShowCreateModal(false);
      toast.success('Reserva creada exitosamente');
    } catch (error) {
      console.error('Error creating reservation:', error);
      // El error ya se maneja en el hook, no necesitamos duplicar el toast
    }
  };

  const handleStatusChange = async (reservationId, newStatus) => {
    if (!canWrite) {
      toast.error('No tienes permisos para cambiar estados de reservas');
      return;
    }

    try {
      console.log(`🔄 Changing status of reservation ${reservationId} to ${newStatus}`);
      await changeReservationStatus(reservationId, newStatus);
    } catch (error) {
      console.error('Error changing reservation status:', error);
      // El error ya se maneja en el hook
    }
  };

  const handleEditReservation = (reservation) => {
    if (!canWrite) {
      toast.error('No tienes permisos para editar reservas');
      return;
    }
    setSelectedReservation(reservation);
    // TODO: Implementar modal de edición
    console.log('Edit reservation:', reservation);
    toast.info('Función de edición en desarrollo');
  };

  const handleViewReservation = (reservation) => {
    setSelectedReservation(reservation);
    setShowViewModal(true);
  };

  const handleDeleteReservation = async (reservationId) => {
    if (!canWrite) {
      toast.error('No tienes permisos para cancelar reservas');
      return;
    }

    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) {
      toast.error('Reserva no encontrada');
      return;
    }

    const confirmMessage = `¿Estás seguro de que quieres cancelar la reserva de ${reservation.guest?.name}?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        console.log(`🗑️ Deleting reservation ${reservationId}`);
        await deleteReservation(reservationId);
      } catch (error) {
        console.error('Error deleting reservation:', error);
        // El error ya se maneja en el hook
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Refreshing reservation data...');
      await refresh();
      toast.success('Datos actualizados correctamente');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Error al actualizar los datos');
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportReservations = () => {
    try {
      console.log('📥 Exporting reservations...', filteredReservations.length);
      
      // Crear CSV básico
      const headers = [
        'ID',
        'Código',
        'Huésped',
        'Email',
        'Teléfono',
        'Habitación',
        'Check-in',
        'Check-out',
        'Noches',
        'Adultos',
        'Niños',
        'Estado',
        'Total',
        'Pagado',
        'Fuente'
      ];

      const csvData = filteredReservations.map(reservation => [
        reservation.id,
        reservation.confirmationCode || '',
        reservation.guest?.name || '',
        reservation.guest?.email || '',
        reservation.guest?.phone || '',
        reservation.room?.number || '',
        reservation.checkIn,
        reservation.checkOut,
        reservation.nights,
        reservation.adults,
        reservation.children,
        reservation.status,
        reservation.totalAmount,
        reservation.paidAmount,
        reservation.source
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `reservas_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`${filteredReservations.length} reservas exportadas correctamente`);
      }
    } catch (error) {
      console.error('Error exporting reservations:', error);
      toast.error('Error al exportar las reservas');
    }
  };

  const handleImportReservations = () => {
    // TODO: Implementar importación desde CSV/Excel
    toast.info('Función de importación en desarrollo');
    console.log('📤 Importing reservations...');
  };

  const getViewModeReservations = () => {
    return viewMode === 'calendar' && !isAdmin ? allReservations : filteredReservations;
  };

  // =============================================
  // COMPONENTES DE MODAL
  // =============================================

  const ViewReservationModal = ({ reservation, isOpen, onClose }) => {
    if (!isOpen || !reservation) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Detalles de la Reserva</h2>
              <p className="text-gray-600 mt-1">#{reservation.confirmationCode || reservation.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
            {/* Guest Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Información del Huésped
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Nombre:</span>
                  <span className="font-medium ml-2">{reservation.guest?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Documento:</span>
                  <span className="font-medium ml-2">{reservation.guest?.document || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium ml-2">{reservation.guest?.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Teléfono:</span>
                  <span className="font-medium ml-2">{reservation.guest?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Reservation Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Detalles de la Reserva
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Habitación:</span>
                  <span className="font-medium ml-2">{reservation.room?.number} - {reservation.room?.type}</span>
                </div>
                <div>
                  <span className="text-gray-600">Estado:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                    {getStatusLabel(reservation.status)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Check-in:</span>
                  <span className="font-medium ml-2">{formatDate(reservation.checkIn)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Check-out:</span>
                  <span className="font-medium ml-2">{formatDate(reservation.checkOut)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Noches:</span>
                  <span className="font-medium ml-2">{reservation.nights}</span>
                </div>
                <div>
                  <span className="text-gray-600">Huéspedes:</span>
                  <span className="font-medium ml-2">
                    {reservation.adults} adulto{reservation.adults > 1 ? 's' : ''}
                    {reservation.children > 0 && `, ${reservation.children} niño${reservation.children > 1 ? 's' : ''}`}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Fuente:</span>
                  <span className="font-medium ml-2 capitalize">{reservation.source}</span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                Información de Pago
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Tarifa por noche:</span>
                  <span className="font-medium ml-2">{formatCurrency(reservation.rate)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium ml-2">{formatCurrency(reservation.totalAmount)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Pagado:</span>
                  <span className="font-medium ml-2">{formatCurrency(reservation.paidAmount)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Pendiente:</span>
                  <span className="font-medium ml-2 text-red-600">
                    {formatCurrency(reservation.totalAmount - reservation.paidAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Estado de pago:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    reservation.paidAmount >= reservation.totalAmount 
                      ? 'bg-green-100 text-green-800'
                      : reservation.paidAmount > 0 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {reservation.paidAmount >= reservation.totalAmount ? 'Pagado' : 
                     reservation.paidAmount > 0 ? 'Parcial' : 'Pendiente'}
                  </span>
                </div>
                {reservation.paymentMethod && (
                  <div>
                    <span className="text-gray-600">Método de pago:</span>
                    <span className="font-medium ml-2 capitalize">{reservation.paymentMethod}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Special Requests */}
            {reservation.specialRequests && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Solicitudes Especiales</h3>
                <p className="text-blue-800">{reservation.specialRequests}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Historial
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Creada:</span>
                  <span className="font-medium ml-2">{formatDate(reservation.createdAt)}</span>
                </div>
                {reservation.checkedInAt && (
                  <div>
                    <span className="text-gray-600">Check-in realizado:</span>
                    <span className="font-medium ml-2">{formatDate(reservation.checkedInAt)}</span>
                  </div>
                )}
                {reservation.checkedOutAt && (
                  <div>
                    <span className="text-gray-600">Check-out realizado:</span>
                    <span className="font-medium ml-2">{formatDate(reservation.checkedOutAt)}</span>
                  </div>
                )}
                {reservation.updatedAt && (
                  <div>
                    <span className="text-gray-600">Última actualización:</span>
                    <span className="font-medium ml-2">{formatDate(reservation.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cerrar
            </Button>
            
            <div className="flex space-x-3">
              {canWrite && onEdit && (
                <Button
                  variant="outline"
                  icon={Edit}
                  onClick={() => {
                    onClose();
                    handleEditReservation(reservation);
                  }}
                >
                  Editar
                </Button>
              )}
              <Button
                variant="primary"
                icon={FileText}
                onClick={() => {
                  // TODO: Generar PDF o imprimir
                  toast.info('Función de imprimir en desarrollo');
                }}
              >
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =============================================
  // RENDER PRINCIPAL
  // =============================================

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar las reservas</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button variant="primary" onClick={handleRefresh} icon={RefreshCw}>
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
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Reservas</h1>
            {isAdmin && !isReception && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 rounded-lg">
                <Lock size={16} className="text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Vista Limitada</span>
              </div>
            )}
            {!canWrite && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-lg">
                <AlertCircle size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Solo lectura</span>
              </div>
            )}
            {operationLoading && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-lg">
                <RefreshCw size={16} className="text-blue-600 animate-spin" />
                <span className="text-sm font-medium text-blue-800">Procesando...</span>
              </div>
            )}
          </div>
          <p className="text-gray-600 mt-1">
            {isAdmin && !isReception
              ? 'Vista limitada: Reservas de los próximos 7 días'
              : canWrite 
              ? 'Administra todas las reservas del hotel'
              : 'Visualiza las reservas del hotel'
            }
          </p>
          {user && (
            <p className="text-sm text-gray-500 mt-1">
              Conectado como: {user.email} ({isAdmin ? 'Administrador' : isReception ? 'Recepción' : 'Usuario'})
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={handleRefresh}
            loading={refreshing}
            disabled={operationLoading}
            size="sm"
          >
            Actualizar
          </Button>
          
          {canWrite && (
            <>
              <Button
                variant="outline"
                icon={Upload}
                onClick={handleImportReservations}
                size="sm"
                disabled={operationLoading}
              >
                Importar
              </Button>
              <Button
                variant="outline"
                icon={Download}
                onClick={handleExportReservations}
                size="sm"
                disabled={operationLoading}
              >
                Exportar
              </Button>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setShowCreateModal(true)}
                disabled={operationLoading}
              >
                Nueva Reserva
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Admin Restriction Notice */}
      {isAdmin && !isReception && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800">Acceso Limitado</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Como administrador, solo puedes ver las reservas de los próximos 7 días. 
                Para acceso completo a reservas, necesitas permisos de recepción.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <ReservationStats 
        stats={isAdmin && !isReception ? {
          ...stats,
          total: filteredReservations.length,
          pending: filteredReservations.filter(r => r.status === RESERVATION_STATUS.PENDING).length,
          confirmed: filteredReservations.filter(r => r.status === RESERVATION_STATUS.CONFIRMED).length,
          checkedIn: filteredReservations.filter(r => r.status === RESERVATION_STATUS.CHECKED_IN).length,
          checkedOut: filteredReservations.filter(r => r.status === RESERVATION_STATUS.CHECKED_OUT).length,
          cancelled: filteredReservations.filter(r => r.status === RESERVATION_STATUS.CANCELLED).length,
          totalRevenue: filteredReservations
            .filter(r => [RESERVATION_STATUS.CHECKED_IN, RESERVATION_STATUS.CHECKED_OUT].includes(r.status))
            .reduce((sum, r) => sum + (r.totalAmount || 0), 0)
        } : stats} 
        loading={loading} 
      />

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            onClick={() => setViewMode('list')}
            size="sm"
            disabled={operationLoading}
          >
            Lista
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'primary' : 'outline'}
            onClick={() => setViewMode('calendar')}
            size="sm"
            icon={Calendar}
            disabled={operationLoading}
          >
            Calendario
          </Button>
        </div>

        <div className="text-sm text-gray-500">
          {filteredReservations.length} reserva{filteredReservations.length !== 1 ? 's' : ''} 
          {isAdmin && !isReception && (
            <span className="text-yellow-600 font-medium"> (vista limitada)</span>
          )}
          {filters.search || filters.status || filters.dateRange || filters.source ? ' (filtradas)' : ''}
        </div>
      </div>

      {/* Filters */}
      <ReservationFilters 
        filters={filters}
        onFiltersChange={setFilters}
        loading={loading}
      />

      {/* Content */}
      {viewMode === 'list' ? (
        <ReservationList
          reservations={filteredReservations}
          loading={loading}
          operationLoading={operationLoading}
          pagination={pagination}
          onPaginationChange={setPagination}
          onStatusChange={canWrite ? handleStatusChange : null}
          onEdit={canWrite ? handleEditReservation : null}
          onDelete={canWrite ? handleDeleteReservation : null}
          onView={handleViewReservation}
          readOnly={!canWrite}
        />
      ) : (
        <ReservationCalendar
          reservations={getViewModeReservations()}
          loading={loading}
          onSelectReservation={handleViewReservation}
          readOnly={!canWrite}
        />
      )}

      {/* Modals */}
      
      {/* Create Reservation Modal */}
      {showCreateModal && canWrite && (
        <CreateReservationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateReservation}
        />
      )}

      {/* View Reservation Modal */}
      <ViewReservationModal
        reservation={selectedReservation}
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedReservation(null);
        }}
      />

      {/* No Permission Modal */}
      {showCreateModal && !canWrite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Lock className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Sin Permisos</h3>
            </div>
            <p className="text-gray-600 mb-6">
              No tienes permisos para crear nuevas reservas. Esta función está disponible solo para usuarios con permisos de escritura.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Funciones auxiliares para el modal
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'S/ 0.00';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(amount);
};

const getStatusColor = (status) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'checked_in':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'checked_out':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'no_show':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'confirmed':
      return 'Confirmada';
    case 'checked_in':
      return 'Check-in';
    case 'checked_out':
      return 'Check-out';
    case 'cancelled':
      return 'Cancelada';
    case 'no_show':
      return 'No Show';
    default:
      return status;
  }
};

export default Reservations;