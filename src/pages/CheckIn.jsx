// src/pages/CheckIn.jsx - Sistema de Check-in Completo
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  Search,
  User,
  Phone,
  CreditCard,
  Calendar,
  Bed,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Plus,
  Calculator,
  Receipt,
  Clock
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import toast from 'react-hot-toast'
import classNames from 'classnames'

// Schema de validación
const checkinSchema = yup.object().shape({
  // Datos del huésped
  guest_first_name: yup.string().required('Nombre es requerido'),
  guest_last_name: yup.string().required('Apellido es requerido'),
  guest_phone: yup.string().required('Teléfono es requerido'),
  guest_document_type: yup.string().required('Tipo de documento requerido'),
  guest_document_number: yup.string().required('Número de documento requerido'),
  
  // Datos de la reserva
  room_id: yup.string().required('Debe seleccionar una habitación'),
  check_in_date: yup.date().required('Fecha de entrada requerida'),
  check_out_date: yup.date()
    .required('Fecha de salida requerida')
    .min(yup.ref('check_in_date'), 'La fecha de salida debe ser posterior a la entrada'),
  
  // Datos de pago
  payment_method: yup.string().required('Método de pago requerido'),
  payment_amount: yup.number().min(0, 'El monto debe ser mayor a 0')
})

const CheckIn = () => {
  const { userInfo, getPrimaryBranch } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Buscar/Nuevo Huésped, 2: Habitaciones, 3: Detalles, 4: Pago
  const [selectedGuest, setSelectedGuest] = useState(null)
  const [isNewGuest, setIsNewGuest] = useState(true)
  const [availableRooms, setAvailableRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Datos simulados
  const [mockGuests] = useState([
    { id: 1, first_name: 'Juan', last_name: 'Pérez', phone: '555-0001', document_number: '12345678' },
    { id: 2, first_name: 'María', last_name: 'García', phone: '555-0002', document_number: '87654321' },
    { id: 3, first_name: 'Carlos', last_name: 'López', phone: '555-0003', document_number: '11223344' }
  ])

  const [mockRooms] = useState([
    { id: 1, room_number: '101', floor: 1, base_price: 150.00, status: 'disponible', description: 'Habitación estándar' },
    { id: 2, room_number: '102', floor: 1, base_price: 150.00, status: 'disponible', description: 'Habitación estándar' },
    { id: 3, room_number: '201', floor: 2, base_price: 180.00, status: 'disponible', description: 'Habitación superior' },
    { id: 4, room_number: '202', floor: 2, base_price: 180.00, status: 'disponible', description: 'Habitación superior' },
    { id: 5, room_number: '301', floor: 3, base_price: 250.00, status: 'disponible', description: 'Suite' }
  ])

  const paymentMethods = [
    { id: 'efectivo', name: 'Efectivo', icon: DollarSign },
    { id: 'tarjeta_debito', name: 'Tarjeta de Débito', icon: CreditCard },
    { id: 'tarjeta_credito', name: 'Tarjeta de Crédito', icon: CreditCard },
    { id: 'transferencia', name: 'Transferencia', icon: CreditCard }
  ]

  const documentTypes = [
    { value: 'cedula', label: 'Cédula de Ciudadanía' },
    { value: 'pasaporte', label: 'Pasaporte' },
    { value: 'tarjeta_identidad', label: 'Tarjeta de Identidad' }
  ]

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(checkinSchema),
    defaultValues: {
      check_in_date: format(new Date(), 'yyyy-MM-dd'),
      check_out_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      guest_document_type: 'cedula'
    }
  })

  const watchCheckInDate = watch('check_in_date')
  const watchCheckOutDate = watch('check_out_date')
  const watchRoomId = watch('room_id')

  // Calcular noches y total
  const calculateStay = () => {
    if (!watchCheckInDate || !watchCheckOutDate || !selectedRoom) return { nights: 0, total: 0 }
    
    const checkIn = new Date(watchCheckInDate)
    const checkOut = new Date(watchCheckOutDate)
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
    const total = nights * selectedRoom.base_price
    
    return { nights: Math.max(0, nights), total: Math.max(0, total) }
  }

  const { nights, total } = calculateStay()

  // Buscar huéspedes
  const filteredGuests = mockGuests.filter(guest => 
    guest.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.phone.includes(searchTerm) ||
    guest.document_number.includes(searchTerm)
  )

  // Filtrar habitaciones disponibles
  useEffect(() => {
    setAvailableRooms(mockRooms.filter(room => room.status === 'disponible'))
  }, [mockRooms])

  // Actualizar habitación seleccionada cuando cambia en el form
  useEffect(() => {
    if (watchRoomId) {
      const room = availableRooms.find(r => r.id.toString() === watchRoomId)
      setSelectedRoom(room)
    }
  }, [watchRoomId, availableRooms])

  const handleGuestSelect = (guest) => {
    setSelectedGuest(guest)
    setIsNewGuest(false)
    setValue('guest_first_name', guest.first_name)
    setValue('guest_last_name', guest.last_name)
    setValue('guest_phone', guest.phone)
    setValue('guest_document_number', guest.document_number)
    setStep(2)
  }

  const handleNewGuest = () => {
    setSelectedGuest(null)
    setIsNewGuest(true)
    reset({
      check_in_date: format(new Date(), 'yyyy-MM-dd'),
      check_out_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      guest_document_type: 'cedula'
    })
    setStep(2)
  }

  const handleRoomSelect = (room) => {
    setSelectedRoom(room)
    setValue('room_id', room.id.toString())
    setStep(3)
  }

  const onSubmit = async (data) => {
    try {
      setIsProcessing(true)
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Datos del check-in:', {
        ...data,
        room: selectedRoom,
        nights,
        total,
        created_by: userInfo.id,
        branch: getPrimaryBranch()
      })

      toast.success('Check-in procesado exitosamente')
      setStep(4) // Ir a confirmación
      
    } catch (error) {
      console.error('Error en check-in:', error)
      toast.error('Error al procesar el check-in')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNewCheckIn = () => {
    setStep(1)
    setSelectedGuest(null)
    setSelectedRoom(null)
    setSearchTerm('')
    reset({
      check_in_date: format(new Date(), 'yyyy-MM-dd'),
      check_out_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      guest_document_type: 'cedula'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Check-in Rápido</h1>
                <p className="text-sm text-gray-600">
                  Registro de huéspedes - Paso {step} de 4
                </p>
              </div>
            </div>
            
            {/* Indicador de progreso */}
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div
                  key={stepNumber}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNumber <= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {stepNumber}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Paso 1: Buscar o crear huésped */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Buscar Huésped Existente</h2>
            
            {/* Búsqueda */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, teléfono o documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Resultados de búsqueda */}
            {searchTerm && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Resultados encontrados:</h3>
                <div className="space-y-2">
                  {filteredGuests.map((guest) => (
                    <div
                      key={guest.id}
                      onClick={() => handleGuestSelect(guest)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {guest.first_name} {guest.last_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Tel: {guest.phone} | Doc: {guest.document_number}
                          </p>
                        </div>
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                  {filteredGuests.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No se encontraron huéspedes con ese criterio
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Botón para nuevo huésped */}
            <div className="text-center">
              <button
                onClick={handleNewGuest}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Registrar Nuevo Huésped
              </button>
            </div>
          </div>
        )}

        {/* Paso 2: Seleccionar habitación */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Seleccionar Habitación</h2>
            
            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Entrada
                </label>
                <input
                  {...register('check_in_date')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.check_in_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.check_in_date.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Salida
                </label>
                <input
                  {...register('check_out_date')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.check_out_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.check_out_date.message}</p>
                )}
              </div>
            </div>

            {/* Habitaciones disponibles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => handleRoomSelect(room)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Habitación {room.room_number}</h3>
                    <Bed className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{room.description}</p>
                  <p className="text-sm text-gray-500">Piso {room.floor}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600">
                      ${room.base_price}/noche
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Disponible
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paso 3: Detalles del huésped y reserva */}
        {step === 3 && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              {/* Información del huésped */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Información del Huésped</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      {...register('guest_first_name')}
                      type="text"
                      className={classNames(
                        "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        errors.guest_first_name ? "border-red-300" : "border-gray-300"
                      )}
                    />
                    {errors.guest_first_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.guest_first_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido *
                    </label>
                    <input
                      {...register('guest_last_name')}
                      type="text"
                      className={classNames(
                        "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        errors.guest_last_name ? "border-red-300" : "border-gray-300"
                      )}
                    />
                    {errors.guest_last_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.guest_last_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      {...register('guest_phone')}
                      type="tel"
                      className={classNames(
                        "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        errors.guest_phone ? "border-red-300" : "border-gray-300"
                      )}
                    />
                    {errors.guest_phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.guest_phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Documento *
                    </label>
                    <select
                      {...register('guest_document_type')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {documentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Documento *
                    </label>
                    <input
                      {...register('guest_document_number')}
                      type="text"
                      className={classNames(
                        "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        errors.guest_document_number ? "border-red-300" : "border-gray-300"
                      )}
                    />
                    {errors.guest_document_number && (
                      <p className="mt-1 text-sm text-red-600">{errors.guest_document_number.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Resumen de la reserva */}
              {selectedRoom && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Resumen de la Reserva</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Detalles de la Habitación</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Habitación:</span> {selectedRoom.room_number}</p>
                        <p><span className="font-medium">Tipo:</span> {selectedRoom.description}</p>
                        <p><span className="font-medium">Piso:</span> {selectedRoom.floor}</p>
                        <p><span className="font-medium">Precio por noche:</span> ${selectedRoom.base_price}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Cálculo de Costos</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Entrada:</span>
                          <span>{format(new Date(watchCheckInDate), 'dd/MM/yyyy')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Salida:</span>
                          <span>{format(new Date(watchCheckOutDate), 'dd/MM/yyyy')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Noches:</span>
                          <span>{nights}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Método de pago */}
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 mb-3">Método de Pago</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon
                        return (
                          <label
                            key={method.id}
                            className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50"
                          >
                            <input
                              {...register('payment_method')}
                              type="radio"
                              value={method.id}
                              className="sr-only"
                            />
                            <Icon className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">{method.name}</span>
                          </label>
                        )
                      })}
                    </div>
                    {errors.payment_method && (
                      <p className="mt-1 text-sm text-red-600">{errors.payment_method.message}</p>
                    )}
                  </div>

                  {/* Monto del pago */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto a Pagar
                    </label>
                    <input
                      {...register('payment_amount')}
                      type="number"
                      step="0.01"
                      defaultValue={total}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.payment_amount && (
                      <p className="mt-1 text-sm text-red-600">{errors.payment_amount.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <span className="flex items-center">
                      <Clock className="animate-spin h-4 w-4 mr-2" />
                      Procesando...
                    </span>
                  ) : (
                    'Procesar Check-in'
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Paso 4: Confirmación */}
        {step === 4 && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">¡Check-in Completado!</h2>
            <p className="text-gray-600 mb-6">
              El huésped ha sido registrado exitosamente
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
              <h3 className="font-medium text-gray-900 mb-2">Detalles del Check-in:</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Huésped:</span> {watch('guest_first_name')} {watch('guest_last_name')}</p>
                <p><span className="font-medium">Habitación:</span> {selectedRoom?.room_number}</p>
                <p><span className="font-medium">Entrada:</span> {format(new Date(watchCheckInDate), 'dd/MM/yyyy')}</p>
                <p><span className="font-medium">Salida:</span> {format(new Date(watchCheckOutDate), 'dd/MM/yyyy')}</p>
                <p><span className="font-medium">Total:</span> ${total.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-x-4">
              <button
                onClick={() => window.print()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Receipt className="h-4 w-4 mr-2 inline" />
                Imprimir Comprobante
              </button>
              <button
                onClick={handleNewCheckIn}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Nuevo Check-in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckIn