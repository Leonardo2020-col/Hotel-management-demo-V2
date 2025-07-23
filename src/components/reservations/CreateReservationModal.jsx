import React, { useState } from 'react';
import { X, User, Calendar, FileText, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../common/Button';
import { db } from '../../lib/supabase';
import toast from 'react-hot-toast';

const schema = yup.object().shape({
  // Guest Information - Simplificado
  guestName: yup.string().required('El nombre es obligatorio'),
  guestEmail: yup.string().email('Email inválido'),
  guestPhone: yup.string(),
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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      adults: 1,
      children: 0
    }
  });

  const watchedValues = watch();

  // Buscar huéspedes existentes
  const searchGuests = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setExistingGuests([]);
      return;
    }

    setSearchingGuest(true);
    try {
      const { data, error } = await db.searchGuests(searchTerm);
      if (error) {
        console.error('Error searching guests:', error);
        return;
      }
      setExistingGuests(data || []);
    } catch (error) {
      console.error('Error searching guests:', error);
    } finally {
      setSearchingGuest(false);
    }
  };

  // Seleccionar huésped existente
  const selectExistingGuest = (guest) => {
    setSelectedGuest(guest);
    setValue('guestName', guest.full_name);
    setValue('guestEmail', guest.email || '');
    setValue('guestPhone', guest.phone || '');
    setValue('guestDocument', guest.document_number || '');
    setExistingGuests([]);
  };

  // Buscar habitaciones disponibles
  const searchAvailableRooms = async () => {
    if (!watchedValues.checkIn || !watchedValues.checkOut) {
      return;
    }

    setLoadingRooms(true);
    try {
      const { data, error } = await db.getAvailableRooms(
        watchedValues.checkIn,
        watchedValues.checkOut
      );

      if (error) {
        console.error('Error loading available rooms:', error);
        toast.error('Error al buscar habitaciones disponibles');
        return;
      }

      setAvailableRooms(data || []);
    } catch (error) {
      console.error('Error loading available rooms:', error);
      toast.error('Error al buscar habitaciones disponibles');
    } finally {
      setLoadingRooms(false);
    }
  };

  // Actualizar habitación seleccionada
  React.useEffect(() => {
    if (watchedValues.roomId && availableRooms) {
      const room = availableRooms.find(r => r.id === parseInt(watchedValues.roomId));
      if (room) {
        setSelectedRoom(room);
      }
    }
  }, [watchedValues.roomId, availableRooms]);

  // Buscar habitaciones cuando cambien las fechas
  React.useEffect(() => {
    if (watchedValues.checkIn && watchedValues.checkOut) {
      searchAvailableRooms();
    }
  }, [watchedValues.checkIn, watchedValues.checkOut]);

  const onFormSubmit = async (data) => {
    try {
      const checkIn = new Date(data.checkIn);
      const checkOut = new Date(data.checkOut);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

      let guestData;
      
      // Si hay un huésped seleccionado, usar ese
      if (selectedGuest) {
        guestData = selectedGuest;
      } else {
        // Crear nuevo huésped con estructura simplificada
        const newGuestData = {
          full_name: data.guestName.trim(),
          email: data.guestEmail?.trim() || null,
          phone: data.guestPhone?.trim() || null,
          document_type: 'DNI',
          document_number: data.guestDocument.trim(),
          status: 'active'
        };

        const { data: createdGuest, error: guestError } = await db.createGuest(newGuestData);
        
        if (guestError) {
          toast.error('Error al crear el huésped: ' + guestError.message);
          return;
        }
        
        guestData = createdGuest;
      }

      // Crear reserva
      const reservationData = {
        guest_id: guestData.id,
        room_id: selectedRoom.id,
        branch_id: 1,
        check_in: data.checkIn,
        check_out: data.checkOut,
        adults: data.adults,
        children: data.children || 0,
        rate: selectedRoom.base_rate,
        total_amount: nights * selectedRoom.base_rate,
        source: 'direct',
        special_requests: data.specialRequests || '',
        status: 'pending'
      };

      const { data: reservation, error: reservationError } = await db.createReservation(reservationData);

      if (reservationError) {
        toast.error('Error al crear la reserva: ' + reservationError.message);
        return;
      }

      toast.success('Reserva creada exitosamente');
      
      // Llamar callback del padre
      if (onSubmit) {
        onSubmit(reservation);
      }

      handleClose();
      
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error('Error al crear la reserva');
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleClose = () => {
    reset();
    setCurrentStep(1);
    setSelectedRoom(null);
    setSelectedGuest(null);
    setAvailableRooms([]);
    setExistingGuests([]);
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
                    <Icon size={20} />
                  </div>
                  <div className="ml-3">
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
                    <div className={`w-16 h-1 mx-6 rounded-full ${
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
                      onChange={(e) => searchGuests(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  </div>
                  
                  {/* Search Results */}
                  {existingGuests.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                      {existingGuests.map(guest => (
                        <button
                          key={guest.id}
                          type="button"
                          onClick={() => selectExistingGuest(guest)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium">{guest.full_name}</div>
                          <div className="text-sm text-gray-500">
                            {guest.email} • {guest.document_number}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedGuest && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Huésped seleccionado:</strong> {selectedGuest.full_name}
                    </p>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Juan Pérez García"
                    />
                    {errors.guestName && (
                      <p className="text-red-600 text-sm mt-1">{errors.guestName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-gray-500">(opcional)</span>
                    </label>
                    <input
                      type="email"
                      {...register('guestEmail')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ejemplo@email.com"
                    />
                    {errors.guestEmail && (
                      <p className="text-red-600 text-sm mt-1">{errors.guestEmail.message}</p>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="DNI, Pasaporte, etc."
                    />
                    {errors.guestDocument && (
                      <p className="text-red-600 text-sm mt-1">{errors.guestDocument.message}</p>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.checkIn && (
                        <p className="text-red-600 text-sm mt-1">{errors.checkIn.message}</p>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.checkOut && (
                        <p className="text-red-600 text-sm mt-1">{errors.checkOut.message}</p>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.adults && (
                        <p className="text-red-600 text-sm mt-1">{errors.adults.message}</p>
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
                      {loadingRooms && <span className="text-blue-500 ml-2">Buscando...</span>}
                    </label>
                    <select
                      {...register('roomId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loadingRooms || availableRooms.length === 0}
                    >
                      <option value="">
                        {loadingRooms 
                          ? 'Buscando habitaciones...' 
                          : availableRooms.length === 0
                          ? 'No hay habitaciones disponibles'
                          : 'Seleccionar habitación'
                        }
                      </option>
                      {availableRooms.map(room => (
                        <option key={room.id} value={room.id}>
                          Habitación {room.number} - {room.room_type || 'Estándar'} - S/ {room.base_rate}/noche
                        </option>
                      ))}
                    </select>
                    {errors.roomId && (
                      <p className="text-red-600 text-sm mt-1">{errors.roomId.message}</p>
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
                          <p><span className="text-gray-600">Total:</span> <span className="font-medium text-lg text-green-600">S/ {(Math.ceil((new Date(watchedValues.checkOut) - new Date(watchedValues.checkIn)) / (1000 * 60 * 60 * 24)) * selectedRoom.base_rate).toFixed(2)}</span></p>
                        </>
                      )}
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
              >
                Cancelar
              </Button>
              
              {currentStep < 3 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={nextStep}
                  disabled={currentStep === 2 && !selectedRoom}
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                >
                  Crear Reserva
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