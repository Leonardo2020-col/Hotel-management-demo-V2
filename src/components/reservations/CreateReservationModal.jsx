import React, { useState, useEffect } from 'react';
import { X, User, Calendar, FileText, Search, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../common/Button';
import { useReservations } from '../../hooks/useReservations';
import toast from 'react-hot-toast';

const schema = yup.object().shape({
  // Guest Information
  guestName: yup.string().required('El nombre es obligatorio'),
  guestEmail: yup.string().email('Email inválido').nullable(),
  guestPhone: yup.string().nullable(),
  guestDocument: yup.string().required('El documento es obligatorio'),
  
  // Reservation Details
  roomId: yup.number().required('Selecciona una habitación'),
  checkIn: yup.date().required('La fecha de entrada es obligatoria'),
  checkOut: yup.date().required('La fecha de salida es obligatoria')
    .min(yup.ref('checkIn'), 'La fecha de salida debe ser posterior a la entrada'),
  
  adults: yup.number().min(1, 'Debe haber al menos 1 adulto').required(),
  children: yup.number().min(0, 'Número de niños inválido').nullable()
});

const CreateReservationModal = ({ isOpen, onClose, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [searchingGuest, setSearchingGuest] = useState(false);
  const [existingGuests, setExistingGuests] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Usar el hook para funciones auxiliares
  const { 
    searchGuests, 
    getAvailableRoomsForDates,
    checkRoomAvailability,
    operationLoading 
  } = useReservations();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
    clearErrors
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      adults: 1,
      children: 0
    }
  });

  const watchedValues = watch();

  // Buscar huéspedes existentes con debounce
  const handleSearchGuests = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setExistingGuests([]);
      return;
    }

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout
    const timeoutId = setTimeout(async () => {
      setSearchingGuest(true);
      try {
        const guests = await searchGuests(searchTerm);
        setExistingGuests(guests);
      } catch (error) {
        console.error('Error searching guests:', error);
        toast.error('Error al buscar huéspedes');
      } finally {
        setSearchingGuest(false);
      }
    }, 300);

    setSearchTimeout(timeoutId);
  };

  // Seleccionar huésped existente
  const selectExistingGuest = (guest) => {
    setSelectedGuest(guest);
    setValue('guestName', guest.full_name || guest.name);
    setValue('guestEmail', guest.email || '');
    setValue('guestPhone', guest.phone || '');
    setValue('guestDocument', guest.document_number || guest.document || '');
    setExistingGuests([]);
    clearErrors(['guestName', 'guestDocument']);
    toast.success('Huésped seleccionado');
  };

  // Buscar habitaciones disponibles
  const searchAvailableRooms = async () => {
    if (!watchedValues.checkIn || !watchedValues.checkOut) {
      console.log('❌ Missing check-in or check-out dates');
      setAvailableRooms([]);
      return;
    }

    const checkInDate = new Date(watchedValues.checkIn);
    const checkOutDate = new Date(watchedValues.checkOut);
    
    if (checkOutDate <= checkInDate) {
      console.log('❌ Invalid date range');
      setAvailableRooms([]);
      return;
    }

    console.log('🔍 Searching available rooms for:', {
      checkIn: watchedValues.checkIn,
      checkOut: watchedValues.checkOut
    });

    setLoadingRooms(true);
    try {
      const rooms = await getAvailableRoomsForDates(
        watchedValues.checkIn,
        watchedValues.checkOut
      );

      console.log(`✅ Found ${rooms?.length || 0} available rooms`);
      setAvailableRooms(rooms || []);

      if (!rooms || rooms.length === 0) {
        toast.info('No hay habitaciones disponibles para las fechas seleccionadas');
      } else {
        toast.success(`${rooms.length} habitación${rooms.length > 1 ? 'es' : ''} disponible${rooms.length > 1 ? 's' : ''}`);
      }

    } catch (error) {
      console.error('Error loading available rooms:', error);
      toast.error('Error al buscar habitaciones: ' + (error.message || 'Error desconocido'));
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Actualizar habitación seleccionada
  useEffect(() => {
    if (watchedValues.roomId && availableRooms && availableRooms.length > 0) {
      const room = availableRooms.find(r => r.id === parseInt(watchedValues.roomId));
      if (room) {
        setSelectedRoom(room);
        console.log('🏠 Room selected:', room);
      }
    } else {
      setSelectedRoom(null);
    }
  }, [watchedValues.roomId, availableRooms]);

  // Buscar habitaciones cuando cambien las fechas (con debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (watchedValues.checkIn && watchedValues.checkOut) {
        const checkIn = new Date(watchedValues.checkIn);
        const checkOut = new Date(watchedValues.checkOut);
        
        if (checkOut > checkIn) {
          searchAvailableRooms();
        } else {
          setAvailableRooms([]);
        }
      } else {
        setAvailableRooms([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchedValues.checkIn, watchedValues.checkOut]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const onFormSubmit = async (data) => {
    try {
      console.log('📝 Submitting reservation with data:', data);
      
      if (!selectedRoom) {
        toast.error('Por favor selecciona una habitación');
        return;
      }

      const checkIn = new Date(data.checkIn);
      const checkOut = new Date(data.checkOut);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

      // Preparar datos del huésped
      const guestData = selectedGuest ? {
        id: selectedGuest.id,
        name: selectedGuest.full_name || selectedGuest.name,
        email: selectedGuest.email || '',
        phone: selectedGuest.phone || '',
        document: selectedGuest.document_number || selectedGuest.document || ''
      } : {
        name: data.guestName.trim(),
        email: data.guestEmail?.trim() || null,
        phone: data.guestPhone?.trim() || null,
        document: data.guestDocument.trim()
      };

      // Preparar datos de la reserva
      const reservationData = {
        guest: guestData,
        room: selectedRoom,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        adults: data.adults,
        children: data.children || 0,
        specialRequests: data.specialRequests || '',
        source: 'direct',
        status: 'pending',
        nights: nights
      };

      console.log('📋 Final reservation data:', reservationData);

      // Llamar callback del padre
      await onSubmit(reservationData);
      
      handleClose();
      
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error('Error al crear la reserva: ' + (error.message || 'Error desconocido'));
    }
  };

  const nextStep = () => {
    const newStep = Math.min(currentStep + 1, 3);
    setCurrentStep(newStep);
  };

  const prevStep = () => {
    const newStep = Math.max(currentStep - 1, 1);
    setCurrentStep(newStep);
  };

  const canProceedToStep2 = () => {
    return watchedValues.guestName && watchedValues.guestDocument;
  };

  const canProceedToStep3 = () => {
    return watchedValues.checkIn && 
           watchedValues.checkOut && 
           watchedValues.roomId && 
           selectedRoom &&
           !loadingRooms;
  };

  const handleClose = () => {
    reset();
    setCurrentStep(1);
    setSelectedRoom(null);
    setSelectedGuest(null);
    setAvailableRooms([]);
    setExistingGuests([]);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    onClose();
  };

  if (!isOpen) return null;

  const steps = [
    { number: 1, title: 'Información del Huésped', icon: User },
    { number: 2, title: 'Detalles de la Reserva', icon: Calendar },
    { number: 3, title: 'Confirmación', icon: FileText }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nueva Reserva</h2>
            <p className="text-gray-600 mt-1">Crear una nueva reserva para el hotel</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    isActive 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : isCompleted
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? <CheckCircle size={20} /> : <Icon size={20} />}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      Paso {step.number}
                    </p>
                    <p className={`text-xs ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 sm:w-16 h-1 mx-2 sm:mx-6 rounded-full ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Step 1: Guest Information */}
            {currentStep === 1 && (
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
                      placeholder="Buscar por nombre, email o documento..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={(e) => handleSearchGuests(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    {searchingGuest && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="animate-spin h-4 w-4 text-blue-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* Search Results */}
                  {existingGuests.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                      {existingGuests.map(guest => (
                        <button
                          key={guest.id}
                          type="button"
                          onClick={() => selectExistingGuest(guest)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="font-medium">{guest.full_name || guest.name}</div>
                          <div className="text-sm text-gray-500">
                            {guest.email && `${guest.email} • `}
                            {guest.document_number || guest.document}
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
                        <strong>Huésped seleccionado:</strong> {selectedGuest.full_name || selectedGuest.name}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      <div className="flex items-center space-x-1 mt-1">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <p className="text-red-600 text-sm">{errors.guestName.message}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      <div className="flex items-center space-x-1 mt-1">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <p className="text-red-600 text-sm">{errors.guestEmail.message}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      <div className="flex items-center space-x-1 mt-1">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <p className="text-red-600 text-sm">{errors.guestDocument.message}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Reservation Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Detalles de la Reserva</h3>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Entrada *
                      </label>
                      <input
                        type="date"
                        {...register('checkIn')}
                        min={new Date().toISOString().split('T')[0]}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.checkIn ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.checkIn && (
                        <div className="flex items-center space-x-1 mt-1">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <p className="text-red-600 text-sm">{errors.checkIn.message}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Salida *
                      </label>
                      <input
                        type="date"
                        {...register('checkOut')}
                        min={watchedValues.checkIn || new Date().toISOString().split('T')[0]}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.checkOut ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.checkOut && (
                        <div className="flex items-center space-x-1 mt-1">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <p className="text-red-600 text-sm">{errors.checkOut.message}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adultos *
                      </label>
                      <input
                        type="number"
                        min="1"
                        {...register('adults')}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.adults ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.adults && (
                        <div className="flex items-center space-x-1 mt-1">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <p className="text-red-600 text-sm">{errors.adults.message}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Niños
                      </label>
                      <input
                        type="number"
                        min="0"
                        {...register('children')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Habitación * 
                      {loadingRooms && (
                        <span className="text-blue-500 ml-2 flex items-center">
                          <Loader2 className="animate-spin w-4 h-4 mr-1" />
                          Buscando...
                        </span>
                      )}
                    </label>
                    <select
                      {...register('roomId')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.roomId ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={loadingRooms}
                    >
                      <option value="">
                        {loadingRooms 
                          ? 'Buscando habitaciones...' 
                          : availableRooms.length === 0
                          ? (watchedValues.checkIn && watchedValues.checkOut ? 'No hay habitaciones disponibles' : 'Selecciona las fechas primero')
                          : 'Seleccionar habitación'
                        }
                      </option>
                      {availableRooms.map(room => (
                        <option key={room.id} value={room.id}>
                          Habitación {room.number} - {room.room_type || 'Estándar'} - S/ {(room.base_rate || room.rate || 0).toFixed(2)}/noche
                          {room.capacity && ` (${room.capacity} personas)`}
                        </option>
                      ))}
                    </select>
                    {errors.roomId && (
                      <div className="flex items-center space-x-1 mt-1">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <p className="text-red-600 text-sm">{errors.roomId.message}</p>
                      </div>
                    )}
                    {watchedValues.checkIn && watchedValues.checkOut && availableRooms.length === 0 && !loadingRooms && (
                      <div className="flex items-center space-x-1 mt-1">
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        <p className="text-yellow-600 text-sm">
                          No hay habitaciones disponibles para las fechas seleccionadas
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Solicitudes Especiales
                    </label>
                    <textarea
                      {...register('specialRequests')}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Camas adicionales, dieta especial, etc."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-6">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Confirmación de Reserva</h3>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Información del Huésped</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-600">Nombre:</span> <span className="font-medium">{watchedValues.guestName}</span></p>
                      {watchedValues.guestEmail && (
                        <p><span className="text-gray-600">Email:</span> <span className="font-medium">{watchedValues.guestEmail}</span></p>
                      )}
                      {watchedValues.guestPhone && (
                        <p><span className="text-gray-600">Teléfono:</span> <span className="font-medium">{watchedValues.guestPhone}</span></p>
                      )}
                      <p><span className="text-gray-600">Documento:</span> <span className="font-medium">{watchedValues.guestDocument}</span></p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Detalles de la Reserva</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-600">Habitación:</span> <span className="font-medium">{selectedRoom?.number} - {selectedRoom?.room_type || 'Estándar'}</span></p>
                      <p><span className="text-gray-600">Check-in:</span> <span className="font-medium">{watchedValues.checkIn && new Date(watchedValues.checkIn).toLocaleDateString('es-ES')}</span></p>
                      <p><span className="text-gray-600">Check-out:</span> <span className="font-medium">{watchedValues.checkOut && new Date(watchedValues.checkOut).toLocaleDateString('es-ES')}</span></p>
                      <p><span className="text-gray-600">Huéspedes:</span> <span className="font-medium">{watchedValues.adults} adulto(s) {watchedValues.children > 0 && `, ${watchedValues.children} niño(s)`}</span></p>
                      {watchedValues.checkIn && watchedValues.checkOut && selectedRoom && (
                        <>
                          <p><span className="text-gray-600">Noches:</span> <span className="font-medium">{Math.ceil((new Date(watchedValues.checkOut) - new Date(watchedValues.checkIn)) / (1000 * 60 * 60 * 24))}</span></p>
                          <p><span className="text-gray-600">Tarifa por noche:</span> <span className="font-medium">S/ {(selectedRoom.base_rate || selectedRoom.rate || 0).toFixed(2)}</span></p>
                          <p><span className="text-gray-600">Total:</span> <span className="font-medium text-lg text-green-600">S/ {(Math.ceil((new Date(watchedValues.checkOut) - new Date(watchedValues.checkIn)) / (1000 * 60 * 60 * 24)) * (selectedRoom.base_rate || selectedRoom.rate || 0)).toFixed(2)}</span></p>
                        </>
                      )}
                      {watchedValues.specialRequests && (
                        <p><span className="text-gray-600">Solicitudes especiales:</span> <span className="font-medium">{watchedValues.specialRequests}</span></p>
                      )}
                    </div>
                  </div>

                  {selectedRoom && (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Información de la Habitación</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-600">Capacidad:</span> <span className="font-medium">{selectedRoom.capacity || 2} personas</span></p>
                        {selectedRoom.features && selectedRoom.features.length > 0 && (
                          <p><span className="text-gray-600">Características:</span> <span className="font-medium">{selectedRoom.features.join(', ')}</span></p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-800">Información importante</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        La reserva se creará en estado "Pendiente" y deberá ser confirmada posteriormente. 
                        Se enviará un código de confirmación una vez completado el proceso.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={isSubmitting || operationLoading}
                >
                  Anterior
                </Button>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting || operationLoading}
              >
                Cancelar
              </Button>
              
              {currentStep < 3 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && !canProceedToStep2()) ||
                    (currentStep === 2 && !canProceedToStep3()) ||
                    isSubmitting || operationLoading
                  }
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting || operationLoading}
                  disabled={!selectedRoom || isSubmitting || operationLoading}
                  icon={isSubmitting || operationLoading ? Loader2 : null}
                >
                  {isSubmitting || operationLoading ? 'Creando...' : 'Crear Reserva'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReservationModal;