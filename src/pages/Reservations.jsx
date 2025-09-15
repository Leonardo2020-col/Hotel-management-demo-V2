// src/pages/Reservations.jsx
import React, { useState } from 'react'
import { 
  Plus, 
  Download, 
  RefreshCw, 
  BarChart3, 
  Calendar,
  Users,
  DollarSign,
  AlertCircle,
  Clock,
  LogIn,    // ✅ NUEVO: Icono para check-in
  LogOut    // ✅ NUEVO: Icono para check-out
} from 'lucide-react'
import toast from 'react-hot-toast'

// Hooks
import { useReservations } from '../hooks/useReservations'
import { useAuth } from '../context/AuthContext'

// Components
import ReservationFormModal from '../components/reservations/ReservationFormModal'
import ReservationFilters from '../components/reservations/ReservationFilters'
import ReservationTable from '../components/reservations/ReservationTable'
import ReservationDetailsModal from '../components/reservations/ReservationDetailsModal'

const Reservations = () => {
  const { userInfo, hasPermission } = useAuth()
  
  // Hook principal de reservaciones
  const {
    reservations,
    loading,
    creating,
    updating,
    paymentMethods,
    availableRooms,
    searchResults,
    filters,
    pagination,
    createReservation,
    confirmReservation,
    cancelReservation,
    addPayment,
    getReservationPayments,
    searchGuests,
    loadAvailableRooms,
    updateFilters,
    clearFilters,
    refreshReservations,
    getReservationStats,
    getTodayReservations,
    currentBranch
  } = useReservations()

  // Estados locales para modales
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [showCheckOutModal, setShowCheckOutModal] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState(null)

  // Estadísticas calculadas
  const stats = getReservationStats()
  const todayReservations = getTodayReservations()

  // =====================================================
  // HANDLERS DE ACCIONES EXISTENTES
  // =====================================================

  const handleCreateReservation = async (reservationData, guestData) => {
    try {
      const result = await createReservation(reservationData, guestData)
      if (result.success) {
        setShowCreateModal(false)
        toast.success(`Reservación ${result.reservationCode} creada exitosamente`)
      }
      return result
    } catch (error) {
      console.error('Error creando reservación:', error)
      toast.error('Error al crear la reservación')
    }
  }

  const handleConfirmReservation = async (reservationId) => {
    const result = await confirmReservation(reservationId)
    if (result.success) {
      toast.success('Reservación confirmada exitosamente')
    }
  }

  const handleCancelReservation = async (reservationId) => {
    const confirmed = window.confirm(
      '¿Estás seguro de que deseas cancelar esta reservación?'
    )
    
    if (confirmed) {
      const result = await cancelReservation(reservationId)
      if (result.success) {
        toast.success('Reservación cancelada')
      }
    }
  }

  const handleViewDetails = (reservation) => {
    setSelectedReservation(reservation)
    setShowDetailsModal(true)
  }

  const handleEditReservation = (reservation) => {
    // TODO: Implementar edición de reservaciones
    toast.info('Funcionalidad de edición próximamente')
  }

  const handleAddPayment = async (reservationId, paymentData) => {
    const result = await addPayment(reservationId, paymentData)
    return result
  }

  const handleRefresh = async () => {
    await refreshReservations()
    toast.success('Datos actualizados')
  }

  // =====================================================
  // ✅ NUEVOS HANDLERS PARA CHECK-IN Y CHECK-OUT
  // =====================================================

  const handleCheckIn = async (reservation) => {
    try {
      console.log('🎯 Iniciando check-in para reservación:', reservation.reservation_code)
      
      // Verificar que se puede hacer check-in
      const status = reservation.status?.status
      const checkInDate = new Date(reservation.check_in_date)
      const today = new Date()
      
      if (status !== 'confirmada') {
        toast.error('La reservación debe estar confirmada para hacer check-in')
        return
      }
      
      if (checkInDate > today) {
        toast.error('No se puede hacer check-in antes de la fecha programada')
        return
      }

      // Confirmar con el usuario
      const confirmed = window.confirm(
        `¿Confirmar check-in para ${reservation.guestName} en habitación ${reservation.roomNumber}?`
      )
      
      if (!confirmed) return

      // Simular llamada a API para hacer check-in
      // En tu implementación real, necesitarás crear esta función en useReservations
      const checkInData = {
        reservationId: reservation.id,
        checkInTime: new Date().toISOString(),
        processedBy: userInfo.id
      }

      // Aquí llamarías a tu función de check-in
      // const result = await processCheckIn(checkInData)
      
      // Por ahora, simulamos la actualización del estado
      const result = await updateReservationStatus(reservation.id, 'en_uso')
      
      if (result.success) {
        toast.success(`Check-in realizado exitosamente para ${reservation.guestName}`)
        await refreshReservations() // Actualizar la lista
      } else {
        toast.error('Error al realizar check-in')
      }
      
    } catch (error) {
      console.error('❌ Error en check-in:', error)
      toast.error('Error al procesar check-in')
    }
  }

  const handleCheckOut = async (reservation) => {
    try {
      console.log('🚪 Iniciando check-out para reservación:', reservation.reservation_code)
      
      // Verificar que se puede hacer check-out
      const status = reservation.status?.status
      
      if (status !== 'en_uso') {
        toast.error('La reservación debe estar en uso para hacer check-out')
        return
      }

      // Verificar si hay saldo pendiente
      const balance = reservation.balance || 0
      if (balance > 0) {
        const confirmed = window.confirm(
          `Hay un saldo pendiente de ${reservation.formattedBalance}. ¿Continuar con el check-out?`
        )
        if (!confirmed) return
      }

      // Confirmar con el usuario
      const confirmed = window.confirm(
        `¿Confirmar check-out para ${reservation.guestName} de habitación ${reservation.roomNumber}?`
      )
      
      if (!confirmed) return

      // Simular llamada a API para hacer check-out
      const checkOutData = {
        reservationId: reservation.id,
        checkOutTime: new Date().toISOString(),
        processedBy: userInfo.id,
        additionalCharges: [], // Aquí podrías agregar cargos adicionales
        depositReturned: 0
      }

      // Aquí llamarías a tu función de check-out
      // const result = await processCheckOut(checkOutData)
      
      // Por ahora, simulamos la actualización del estado
      const result = await updateReservationStatus(reservation.id, 'completada')
      
      if (result.success) {
        toast.success(`Check-out realizado exitosamente para ${reservation.guestName}`)
        await refreshReservations() // Actualizar la lista
      } else {
        toast.error('Error al realizar check-out')
      }
      
    } catch (error) {
      console.error('❌ Error en check-out:', error)
      toast.error('Error al procesar check-out')
    }
  }

  // =====================================================
  // FUNCIÓN AUXILIAR PARA ACTUALIZAR ESTADO
  // =====================================================

  const updateReservationStatus = async (reservationId, newStatus) => {
    try {
      // Aquí usarías tu hook o servicio real
      // Por ahora simulo la respuesta
      console.log(`🔄 Actualizando reservación ${reservationId} a estado: ${newStatus}`)
      
      // Simulación de delay de API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return { success: true }
    } catch (error) {
      console.error('Error actualizando estado:', error)
      return { success: false, error: error.message }
    }
  }

  // =====================================================
  // HANDLER PARA EXPORTACIÓN CSV
  // =====================================================

  const handleExportCSV = () => {
    try {
      // Preparar datos para CSV
      const csvData = reservations.map(reservation => ({
        'Código': reservation.reservation_code,
        'Huésped': reservation.guestName,
        'Habitación': reservation.roomNumber,
        'Check-in': reservation.checkInFormatted,
        'Check-out': reservation.checkOutFormatted,
        'Noches': reservation.nights,
        'Estado': reservation.statusText,
        'Total': reservation.total_amount,
        'Pagado': reservation.paid_amount,
        'Saldo': reservation.balance,
        'Creada': new Date(reservation.created_at).toLocaleDateString('es-PE')
      }))

      // Convertir a CSV
      if (csvData.length === 0) {
        toast.error('No hay datos para exportar')
        return
      }

      const headers = Object.keys(csvData[0])
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => `"${row[header] || ''}"`).join(',')
        )
      ].join('\n')

      // Descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `reservaciones_${currentBranch?.name || 'hotel'}_${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      toast.success('Archivo CSV descargado')
    } catch (error) {
      console.error('Error exportando CSV:', error)
      toast.error('Error al exportar datos')
    }
  }

  // =====================================================
  // VERIFICACIÓN DE PERMISOS
  // =====================================================

  const canCreateReservations = hasPermission('reservations')
  const canManageReservations = hasPermission('reservations') || hasPermission('all')

  if (!currentBranch) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Sin acceso a sucursal</h2>
          <p className="text-sm text-gray-600">
            No tienes acceso a ninguna sucursal. Contacta al administrador.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservaciones</h1>
          <p className="text-sm text-gray-600">
            {currentBranch.name} • {userInfo?.first_name} {userInfo?.last_name}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>

          <button
            onClick={handleExportCSV}
            disabled={reservations.length === 0}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </button>

          {canCreateReservations && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              Nueva Reservación
            </button>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Reservaciones
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats.total}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-600">Pendientes: </span>
              <span className="font-medium text-yellow-600">{stats.pendientes}</span>
              <span className="text-gray-600 ml-2">• Confirmadas: </span>
              <span className="font-medium text-green-600">{stats.confirmadas}</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Hoy
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {todayReservations.length}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-600">Check-ins y check-outs programados</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Ingresos Totales
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      S/ {stats.totalRevenue.toFixed(2)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-600">Pagado: </span>
              <span className="font-medium text-green-600">S/ {stats.totalPaid.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pagos Pendientes
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      S/ {stats.pendingPayments.toFixed(2)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-600">
                {reservations.filter(r => r.balance > 0).length} reservaciones con saldo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <ReservationFilters
        filters={filters}
        onFiltersChange={updateFilters}
        onClearFilters={clearFilters}
        loading={loading}
      />

      {/* Tabla de reservaciones */}
      <ReservationTable
        reservations={reservations}
        loading={loading}
        onViewDetails={handleViewDetails}
        onEditReservation={handleEditReservation}
        onConfirmReservation={handleConfirmReservation}
        onCancelReservation={handleCancelReservation}
        onCheckIn={handleCheckIn}           // ✅ NUEVO: Handler de check-in
        onCheckOut={handleCheckOut}         // ✅ NUEVO: Handler de check-out
        currentUser={userInfo}
      />

      {/* Modal de nueva reservación */}
      <ReservationFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateReservation}
        paymentMethods={paymentMethods}
        availableRooms={availableRooms}
        onLoadAvailableRooms={loadAvailableRooms}
        searchGuests={searchGuests}
        searchResults={searchResults}
        loading={creating}
      />

      {/* Modal de detalles de reservación */}
      <ReservationDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedReservation(null)
        }}
        reservation={selectedReservation}
        onAddPayment={handleAddPayment}
        onConfirmReservation={handleConfirmReservation}
        onCancelReservation={handleCancelReservation}
        onEditReservation={handleEditReservation}
        getReservationPayments={getReservationPayments}
        paymentMethods={paymentMethods}
        loading={updating}
      />
    </div>
  )
}

export default Reservations