// src/components/reservations/ReservationDetailsModal.jsx - VERSIÓN COMPLETA ACTUALIZADA
import React, { useState, useEffect } from 'react'
import { 
  X, 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  CreditCard, 
  FileText, 
  Clock,
  DollarSign,
  Edit3,
  CheckCircle,
  XCircle,
  Plus,
  Receipt
} from 'lucide-react'

const ReservationDetailsModal = ({
  isOpen,
  onClose,
  reservation,
  onAddPayment,
  onConfirmReservation,
  onCancelReservation,
  onEditReservation,
  getReservationPayments,
  paymentMethods,
  loading = false
}) => {
  const [activeTab, setActiveTab] = useState('details')
  const [payments, setPayments] = useState([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethodId: '',
    reference: '',
    paymentDate: new Date().toISOString().split('T')[0]
  })

  // Cargar pagos cuando se abre el modal
  useEffect(() => {
    if (isOpen && reservation?.id) {
      loadPayments()
    }
  }, [isOpen, reservation?.id])

  // Resetear cuando se cierre
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('details')
      setShowAddPayment(false)
      setPayments([])
      setPaymentForm({
        amount: '',
        paymentMethodId: '',
        reference: '',
        paymentDate: new Date().toISOString().split('T')[0]
      })
    }
  }, [isOpen])

  const loadPayments = async () => {
    if (!reservation?.id || !getReservationPayments) return

    try {
      setLoadingPayments(true)
      const result = await getReservationPayments(reservation.id)
      if (result.success) {
        setPayments(result.data || [])
      }
    } catch (error) {
      console.error('Error cargando pagos:', error)
    } finally {
      setLoadingPayments(false)
    }
  }

  const handleAddPayment = async (e) => {
    e.preventDefault()
    
    if (!paymentForm.amount || !paymentForm.paymentMethodId) {
      return
    }

    // Validaciones
    const amount = parseFloat(paymentForm.amount)
    if (amount <= 0) {
      alert('El monto debe ser mayor a 0')
      return
    }

    if (amount > (reservation.balance || 0)) {
      alert('El monto no puede ser mayor al saldo pendiente')
      return
    }

    // Validar referencia para métodos que la requieren
    const selectedMethod = paymentMethods.find(m => m.id === paymentForm.paymentMethodId)
    if (selectedMethod?.requires_reference && !paymentForm.reference?.trim()) {
      alert('La referencia es obligatoria para este método de pago')
      return
    }

    const result = await onAddPayment(reservation.id, {
      amount: amount,
      paymentMethodId: paymentForm.paymentMethodId,
      reference: paymentForm.reference,
      paymentDate: paymentForm.paymentDate
    })

    if (result.success) {
      setShowAddPayment(false)
      setPaymentForm({
        amount: '',
        paymentMethodId: '',
        reference: '',
        paymentDate: new Date().toISOString().split('T')[0]
      })
      await loadPayments()
    }
  }

  const canPerformAction = (action) => {
    const status = reservation?.status?.status
    switch (action) {
      case 'confirm':
        return status === 'pendiente'
      case 'cancel':
        return ['pendiente', 'confirmada'].includes(status)
      case 'edit':
        return ['pendiente', 'confirmada'].includes(status)
      case 'addPayment':
        return ['pendiente', 'confirmada', 'en_uso'].includes(status) && 
               (reservation?.balance || 0) > 0
      default:
        return false
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'pendiente': 'text-yellow-800 bg-yellow-100 border-yellow-200',
      'confirmada': 'text-green-800 bg-green-100 border-green-200',
      'en_uso': 'text-blue-800 bg-blue-100 border-blue-200',
      'completada': 'text-gray-800 bg-gray-100 border-gray-200',
      'cancelada': 'text-red-800 bg-red-100 border-red-200',
      'no_show': 'text-red-900 bg-red-100 border-red-300'
    }
    return colors[status] || 'text-gray-800 bg-gray-100 border-gray-200'
  }

  // Función para obtener el nombre del método de pago con emoji
  const getPaymentMethodName = (methodId) => {
    switch (methodId) {
      case 'efectivo':
        return '💵 Efectivo'
      case 'transferencia':
        return '🏦 Transferencia Bancaria'
      case 'billetera_digital':
        return '📱 Billetera Digital'
      default:
        return methodId
    }
  }

  // Función para obtener el placeholder de referencia
  const getReferenceePlaceholder = (methodId) => {
    switch (methodId) {
      case 'transferencia':
        return 'Ej: OP-123456789'
      case 'billetera_digital':
        return 'Ej: YAPE-987654321'
      default:
        return 'Referencia'
    }
  }

  // Función para obtener el label de referencia
  const getReferenceLabel = (methodId) => {
    switch (methodId) {
      case 'transferencia':
        return 'Número de operación'
      case 'billetera_digital':
        return 'Código de transacción'
      default:
        return 'Referencia'
    }
  }

  if (!isOpen || !reservation) return null

  const tabs = [
    { id: 'details', label: 'Detalles', icon: FileText },
    { id: 'payments', label: 'Pagos', icon: CreditCard, count: payments.length }
  ]

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Reservación {reservation.reservation_code}
            </h2>
            <div className="flex items-center mt-1 space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(reservation.status?.status)}`}>
                {reservation.status?.status || 'Sin estado'}
              </span>
              <span className="text-sm text-gray-500">
                Creada: {new Date(reservation.created_at).toLocaleDateString('es-PE')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {/* Tab: Detalles */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Información del huésped */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Información del huésped
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nombre completo</label>
                    <p className="mt-1 text-sm text-gray-900">{reservation.guest?.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Documento</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {reservation.guest?.document_type?.toUpperCase()}: {reservation.guest?.document_number}
                    </p>
                  </div>
                  {reservation.guest?.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Teléfono</label>
                      <p className="mt-1 text-sm text-gray-900 flex items-center">
                        <Phone className="h-4 w-4 mr-1 text-gray-400" />
                        {reservation.guest.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalles de la reservación */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Detalles de la estadía
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Check-in</label>
                    <p className="mt-1 text-sm text-gray-900">{reservation.checkInFormatted}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Check-out</label>
                    <p className="mt-1 text-sm text-gray-900">{reservation.checkOutFormatted}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Habitación</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      Habitación {reservation.room?.room_number}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Duración</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      {reservation.nights} noche{reservation.nights !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Resumen financiero */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Resumen financiero
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Total de la reservación</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{reservation.formattedTotal}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Total pagado</label>
                    <p className="mt-1 text-lg font-semibold text-green-600">
                      S/ {(reservation.paid_amount || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Saldo pendiente</label>
                    <p className={`mt-1 text-lg font-semibold ${
                      (reservation.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {reservation.formattedBalance}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-green-200">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Precio por noche:</span>
                    <span>S/ {(reservation.room?.base_price || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>Número de noches:</span>
                    <span>{reservation.nights}</span>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              {reservation.created_by_user && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Información adicional</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      Creada por: {reservation.created_by_user.first_name} {reservation.created_by_user.last_name}
                    </p>
                    <p>
                      Fecha de creación: {new Date(reservation.created_at).toLocaleString('es-PE')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Pagos */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {/* Header de pagos con botón agregar */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Historial de pagos ({payments.length})
                </h3>
                {canPerformAction('addPayment') && (
                  <button
                    onClick={() => setShowAddPayment(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar pago
                  </button>
                )}
              </div>

              {/* Formulario para agregar pago - NUEVO DISEÑO */}
              {showAddPayment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Registrar nuevo pago</h4>
                  <form onSubmit={handleAddPayment} className="space-y-6">
                    
                    {/* Total a Cobrar - Estilo Verde */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-green-700 font-medium mb-1">Total a Cobrar</p>
                      <p className="text-2xl font-bold text-green-800">
                        {paymentForm.amount ? `S/ ${parseFloat(paymentForm.amount).toFixed(2)}` : reservation.formattedBalance}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Saldo pendiente: {reservation.formattedBalance}
                      </p>
                    </div>

                    {/* Monto a pagar */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Monto a pagar</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={reservation.balance}
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    {/* Método de Pago - Estilo con iconos y radio buttons */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Método de Pago</h3>
                      <div className="space-y-2">
                        {paymentMethods.map((method) => {
                          // Configuración de iconos y colores para cada método
                          const methodConfig = {
                            'efectivo': {
                              icon: '💵',
                              name: 'Efectivo',
                              description: 'Pago en efectivo',
                              bgColor: 'bg-green-50',
                              iconBg: 'bg-green-500',
                              borderColor: 'border-green-200'
                            },
                            'transferencia': {
                              icon: '🏦',
                              name: 'Transferencia',
                              description: 'Transferencia bancaria',
                              bgColor: 'bg-gray-50',
                              iconBg: 'bg-gray-500',
                              borderColor: 'border-gray-200'
                            },
                            'billetera_digital': {
                              icon: '📱',
                              name: 'Digital',
                              description: 'Yape/Plin',
                              bgColor: 'bg-gray-50',
                              iconBg: 'bg-gray-500',
                              borderColor: 'border-gray-200'
                            }
                          }

                          const config = methodConfig[method.id] || {
                            icon: '💳',
                            name: method.name,
                            description: method.name,
                            bgColor: 'bg-gray-50',
                            iconBg: 'bg-gray-500',
                            borderColor: 'border-gray-200'
                          }

                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setPaymentForm(prev => ({ 
                                ...prev, 
                                paymentMethodId: method.id,
                                reference: method.id === 'efectivo' ? '' : prev.reference
                              }))}
                              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                                paymentForm.paymentMethodId === method.id
                                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                  : `${config.borderColor} ${config.bgColor} hover:border-blue-300`
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {/* Icono */}
                                  <div className={`w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center text-white text-lg`}>
                                    {config.icon}
                                  </div>
                                  
                                  {/* Información */}
                                  <div className="text-left">
                                    <p className="font-semibold text-gray-800">{config.name}</p>
                                    <p className="text-sm text-gray-600">{config.description}</p>
                                  </div>
                                </div>
                                
                                {/* Radio Button */}
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  paymentForm.paymentMethodId === method.id
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-gray-300 bg-white'
                                }`}>
                                  {paymentForm.paymentMethodId === method.id && (
                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                  )}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Fecha de pago */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de pago</label>
                      <input
                        type="date"
                        value={paymentForm.paymentDate}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>

                    {/* Referencia - Solo si no es efectivo */}
                    {paymentForm.paymentMethodId && paymentForm.paymentMethodId !== 'efectivo' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {getReferenceLabel(paymentForm.paymentMethodId)}
                        </label>
                        <input
                          type="text"
                          value={paymentForm.reference}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder={getReferenceePlaceholder(paymentForm.paymentMethodId)}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {paymentForm.paymentMethodId === 'transferencia' 
                            ? 'Número de operación del banco'
                            : 'Código de la transacción digital'
                          }
                        </p>
                      </div>
                    )}

                    {/* Resumen del pago - Mejorado */}
                    {paymentForm.amount && paymentForm.paymentMethodId && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Resumen del pago</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Monto:</span>
                            <span className="font-semibold text-lg">S/ {parseFloat(paymentForm.amount || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Método:</span>
                            <span className="font-medium">
                              {getPaymentMethodName(paymentForm.paymentMethodId)}
                            </span>
                          </div>
                          {paymentForm.reference && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Referencia:</span>
                              <span className="font-medium text-xs bg-gray-100 px-2 py-1 rounded">
                                {paymentForm.reference}
                              </span>
                            </div>
                          )}
                          <div className="border-t border-gray-200 pt-2 mt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Saldo restante:</span>
                              <span className={`font-bold text-lg ${
                                ((reservation.balance || 0) - parseFloat(paymentForm.amount || 0)) <= 0 
                                  ? 'text-green-600' 
                                  : 'text-orange-600'
                              }`}>
                                S/ {((reservation.balance || 0) - parseFloat(paymentForm.amount || 0)).toFixed(2)}
                              </span>
                            </div>
                            {((reservation.balance || 0) - parseFloat(paymentForm.amount || 0)) <= 0 && (
                              <p className="text-xs text-green-600 mt-1 flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Reservación completamente pagada
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowAddPayment(false)}
                        className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!paymentForm.amount || !paymentForm.paymentMethodId}
                        className="px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Registrar pago
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Lista de pagos con iconos mejorados */}
              {loadingPayments ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Cargando pagos...</p>
                </div>
              ) : payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.map((payment, index) => (
                    <div key={payment.id || index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-gray-900">
                              S/ {(payment.amount || 0).toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(payment.payment_date).toLocaleDateString('es-PE')}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-600">
                            <CreditCard className="h-4 w-4 mr-1" />
                            {payment.payment_method?.name || 'Método no especificado'}
                            {payment.payment_reference && (
                              <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                                Ref: {payment.payment_reference}
                              </span>
                            )}
                          </div>
                          {payment.processed_by_user && (
                            <div className="mt-1 text-xs text-gray-500">
                              Procesado por: {payment.processed_by_user.first_name} {payment.processed_by_user.last_name}
                            </div>
                          )}
                        </div>
                        <Receipt className="h-5 w-5 text-gray-400 ml-4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pagos registrados</h3>
                  <p className="text-sm text-gray-600">
                    {canPerformAction('addPayment') 
                      ? 'Agrega el primer pago para esta reservación.'
                      : 'No se han registrado pagos para esta reservación.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
          <div className="flex space-x-2">
            {canPerformAction('confirm') && (
              <button
                onClick={() => {
                  onConfirmReservation(reservation.id)
                  onClose()
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Confirmar
              </button>
            )}

            {canPerformAction('edit') && (
              <button
                onClick={() => {
                  onEditReservation(reservation)
                  onClose()
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Editar
              </button>
            )}

            {canPerformAction('cancel') && (
              <button
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que deseas cancelar esta reservación?')) {
                    onCancelReservation(reservation.id)
                    onClose()
                  }
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cancelar
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReservationDetailsModal