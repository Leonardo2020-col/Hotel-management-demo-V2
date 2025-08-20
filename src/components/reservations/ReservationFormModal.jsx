// src/components/reservations/ReservationFormModal.jsx
import React, { useState, useEffect } from 'react'
import { X, Calendar, User, Phone, CreditCard, MapPin, Clock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

const ReservationFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  paymentMethods,
  availableRooms,
  onLoadAvailableRooms,
  searchGuests,
  searchResults,
  loading = false
}) => {
  const [step, setStep] = useState(1) // 1: Fechas, 2: Huésped, 3: Habitación, 4: Confirmación
  const [selectedGuest, setSelectedGuest] = useState(null)
  const [guestSearchTerm, setGuestSearchTerm] = useState('')
  const [isNewGuest, setIsNewGuest] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      checkInDate: '',
      checkOutDate: '',
      roomId: '',
      guestName: '',
      guestPhone: '',
      guestDocument: '',
      guestDocumentType: 'dni',
      notes: ''
    }
  })

  const watchedValues = watch()

  // Limpiar formulario al cerrar
  useEffect(() => {
    if (!isOpen) {
      reset()
      setStep(1)
      setSelectedGuest(null)
      setGuestSearchTerm('')
      setIsNewGuest(true)
    }
  }, [isOpen, reset])

  // Cargar habitaciones disponibles cuando cambien las fechas
  useEffect(() => {
    const { checkInDate, checkOutDate } = watchedValues
    if (checkInDate && checkOutDate && checkInDate < checkOutDate) {
      onLoadAvailableRooms(checkInDate, checkOutDate)
    }
  }, [watchedValues.checkInDate, watchedValues.checkOutDate, onLoadAvailableRooms])

  // Buscar huéspedes cuando cambie el término de búsqueda
  useEffect(() => {
    if (guestSearchTerm.length >= 3) {
      const debounceTimer = setTimeout(() => {
        searchGuests(guestSearchTerm)
      }, 300)
      return () => clearTimeout(debounceTimer)
    }
  }, [guestSearchTerm, searchGuests])

  // Calcular noches y total
  const calculateDetails = () => {
    const { checkInDate, checkOutDate, roomId } = watchedValues
    
    if (!checkInDate || !checkOutDate || !roomId) {
      return { nights: 0, total: 0, pricePerNight: 0 }
    }

    const checkIn = new Date(checkInDate)
    const checkOut = new Date(checkOutDate)
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
    
    const selectedRoom = availableRooms.find(room => room.room_id === roomId)
    const pricePerNight = selectedRoom?.base_price || 0
    const total = nights * pricePerNight

    return { nights, total, pricePerNight }
  }

  const { nights, total, pricePerNight } = calculateDetails()

  const handleNextStep = () => {
    if (step === 1) {
      // Validar fechas
      if (!watchedValues.checkInDate || !watchedValues.checkOutDate) {
        toast.error('Por favor selecciona las fechas de check-in y check-out')
        return
      }
      
      const checkIn = new Date(watchedValues.checkInDate)
      const checkOut = new Date(watchedValues.checkOutDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (checkIn < today) {
        toast.error('La fecha de check-in no puede ser anterior a hoy')
        return
      }
      
      if (checkOut <= checkIn) {
        toast.error('La fecha de check-out debe ser posterior al check-in')
        return
      }
    }
    
    if (step === 2) {
      // Validar datos de huésped
      if (isNewGuest) {
        if (!watchedValues.guestName.trim()) {
          toast.error('El nombre del huésped es obligatorio')
          return
        }
        if (!watchedValues.guestDocument.trim()) {
          toast.error('El documento del huésped es obligatorio')
          return
        }
      } else if (!selectedGuest) {
        toast.error('Por favor selecciona un huésped')
        return
      }
    }
    
    if (step === 3) {
      // Validar habitación
      if (!watchedValues.roomId) {
        toast.error('Por favor selecciona una habitación')
        return
      }
    }

    setStep(step + 1)
  }

  const handlePrevStep = () => {
    setStep(step - 1)
  }

  const handleGuestSelect = (guest) => {
    setSelectedGuest(guest)
    setIsNewGuest(false)
    setValue('guestName', guest.full_name)
    setValue('guestPhone', guest.phone || '')
    setValue('guestDocument', guest.document_number || '')
    setValue('guestDocumentType', guest.document_type || 'dni')
    setGuestSearchTerm('')
  }

  const handleFormSubmit = (data) => {
    const reservationData = {
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      roomId: data.roomId,
      totalAmount: total,
      notes: data.notes
    }

    const guestData = selectedGuest || {
      fullName: data.guestName,
      phone: data.guestPhone,
      documentType: data.guestDocumentType,
      documentNumber: data.guestDocument
    }

    onSubmit(reservationData, guestData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Nueva Reservación - Paso {step} de 4
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center">
            {[1, 2, 3, 4].map((stepNumber) => (
              <React.Fragment key={stepNumber}>
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold
                  ${stepNumber <= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`
                    flex-1 h-1 mx-2
                    ${stepNumber < step ? 'bg-blue-600' : 'bg-gray-200'}
                  `} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Fechas</span>
            <span>Huésped</span>
            <span>Habitación</span>
            <span>Confirmar</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          {/* Paso 1: Fechas */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                <Calendar className="inline w-5 h-5 mr-2" />
                Selecciona las fechas
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Check-in
                  </label>
                  <input
                    type="date"
                    {...register('checkInDate', { required: 'La fecha de check-in es obligatoria' })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.checkInDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.checkInDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Check-out
                  </label>
                  <input
                    type="date"
                    {...register('checkOutDate', { required: 'La fecha de check-out es obligatoria' })}
                    min={watchedValues.checkInDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.checkOutDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.checkOutDate.message}</p>
                  )}
                </div>
              </div>

              {watchedValues.checkInDate && watchedValues.checkOutDate && nights > 0 && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm text-blue-800">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Duración: {nights} noche{nights !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Paso 2: Huésped */}
          {step === 2 && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                <User className="inline w-5 h-5 mr-2" />
                Información del huésped
              </h4>

              <div className="flex space-x-4 mb-4">
                <button
                  type="button"
                  onClick={() => setIsNewGuest(true)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    isNewGuest
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Nuevo huésped
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewGuest(false)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    !isNewGuest
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Huésped existente
                </button>
              </div>

              {!isNewGuest ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar huésped
                  </label>
                  <input
                    type="text"
                    value={guestSearchTerm}
                    onChange={(e) => setGuestSearchTerm(e.target.value)}
                    placeholder="Buscar por nombre, teléfono o documento..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  
                  {searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-md max-h-40 overflow-y-auto">
                      {searchResults.map((guest) => (
                        <button
                          key={guest.id}
                          type="button"
                          onClick={() => handleGuestSelect(guest)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium">{guest.full_name}</div>
                          <div className="text-sm text-gray-500">
                            {guest.document_type?.toUpperCase()}: {guest.document_number} | {guest.phone}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedGuest && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center text-green-800">
                        <User className="w-4 h-4 mr-2" />
                        Huésped seleccionado: {selectedGuest.full_name}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      {...register('guestName', { required: 'El nombre es obligatorio' })}
                      placeholder="Ej: Juan Carlos Pérez García"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.guestName && (
                      <p className="text-red-500 text-sm mt-1">{errors.guestName.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de documento
                      </label>
                      <select
                        {...register('guestDocumentType')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="dni">DNI</option>
                        <option value="pasaporte">Pasaporte</option>
                        <option value="carnet_extranjeria">Carnet de Extranjería</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de documento
                      </label>
                      <input
                        type="text"
                        {...register('guestDocument', { 
                          required: 'El documento es obligatorio',
                          minLength: { value: 6, message: 'Mínimo 6 caracteres' }
                        })}
                        placeholder="Ej: 12345678"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.guestDocument && (
                        <p className="text-red-500 text-sm mt-1">{errors.guestDocument.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono (opcional)
                    </label>
                    <input
                      type="tel"
                      {...register('guestPhone')}
                      placeholder="Ej: +51 987 654 321"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paso 3: Habitación */}
          {step === 3 && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                <MapPin className="inline w-5 h-5 mr-2" />
                Selecciona una habitación
              </h4>

              {availableRooms.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-2">
                    No hay habitaciones disponibles para las fechas seleccionadas
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Cambiar fechas
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableRooms.map((room) => (
                    <div
                      key={room.room_id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        watchedValues.roomId === room.room_id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setValue('roomId', room.room_id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-lg">Habitación {room.room_number}</h5>
                        <input
                          type="radio"
                          {...register('roomId', { required: 'Selecciona una habitación' })}
                          value={room.room_id}
                          className="text-blue-600"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{room.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-blue-600">
                          S/ {room.base_price}/noche
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {errors.roomId && (
                <p className="text-red-500 text-sm mt-1">{errors.roomId.message}</p>
              )}

              {watchedValues.roomId && (
                <div className="bg-green-50 p-4 rounded-md">
                  <h5 className="font-medium text-green-800 mb-2">Resumen de la reservación</h5>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>Habitación: {availableRooms.find(r => r.room_id === watchedValues.roomId)?.room_number}</p>
                    <p>Check-in: {new Date(watchedValues.checkInDate).toLocaleDateString('es-PE')}</p>
                    <p>Check-out: {new Date(watchedValues.checkOutDate).toLocaleDateString('es-PE')}</p>
                    <p>Noches: {nights}</p>
                    <p>Precio por noche: S/ {pricePerNight.toFixed(2)}</p>
                    <p className="font-semibold">Total: S/ {total.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paso 4: Confirmación */}
          {step === 4 && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                <CreditCard className="inline w-5 h-5 mr-2" />
                Confirmar reservación
              </h4>

              {/* Resumen completo */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h5 className="font-semibold text-gray-900 mb-4">Resumen de la reservación</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h6 className="font-medium text-gray-700 mb-2">Fechas</h6>
                    <p className="text-sm text-gray-600">
                      Check-in: {new Date(watchedValues.checkInDate).toLocaleDateString('es-PE')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Check-out: {new Date(watchedValues.checkOutDate).toLocaleDateString('es-PE')}
                    </p>
                    <p className="text-sm text-gray-600">Duración: {nights} noche{nights !== 1 ? 's' : ''}</p>
                  </div>

                  <div>
                    <h6 className="font-medium text-gray-700 mb-2">Habitación</h6>
                    <p className="text-sm text-gray-600">
                      Habitación {availableRooms.find(r => r.room_id === watchedValues.roomId)?.room_number}
                    </p>
                    <p className="text-sm text-gray-600">S/ {pricePerNight.toFixed(2)} por noche</p>
                  </div>

                  <div>
                    <h6 className="font-medium text-gray-700 mb-2">Huésped</h6>
                    <p className="text-sm text-gray-600">
                      {selectedGuest?.full_name || watchedValues.guestName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(selectedGuest?.document_type || watchedValues.guestDocumentType)?.toUpperCase()}: {selectedGuest?.document_number || watchedValues.guestDocument}
                    </p>
                    {(selectedGuest?.phone || watchedValues.guestPhone) && (
                      <p className="text-sm text-gray-600">
                        Tel: {selectedGuest?.phone || watchedValues.guestPhone}
                      </p>
                    )}
                  </div>

                  <div>
                    <h6 className="font-medium text-gray-700 mb-2">Total</h6>
                    <p className="text-lg font-bold text-blue-600">S/ {total.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      ({nights} noche{nights !== 1 ? 's' : ''} × S/ {pricePerNight.toFixed(2)})
                    </p>
                  </div>
                </div>
              </div>

              {/* Notas adicionales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  placeholder="Comentarios especiales, requerimientos del huésped..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Advertencia */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h6 className="text-sm font-medium text-yellow-800">
                      Información importante
                    </h6>
                    <p className="text-sm text-yellow-700 mt-1">
                      La reservación se creará en estado "Pendiente". Deberás confirmarla posteriormente para proceder con el check-in.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones de navegación */}
          <div className="flex justify-between pt-6 mt-6 border-t border-gray-200">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Anterior
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              
              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !watchedValues.roomId}
                  className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creando...' : 'Crear Reservación'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReservationFormModal