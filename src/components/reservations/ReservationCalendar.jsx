import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { RESERVATION_STATUS } from '../../hooks/useReservations';
import classNames from 'classnames';

const ReservationCalendar = ({ 
  reservations = [], 
  loading, 
  onSelectReservation,
  readOnly = false
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Agrupar reservas por fecha
  const reservationsByDate = useMemo(() => {
    const grouped = {};
    
    if (!reservations || !Array.isArray(reservations)) {
      console.warn('Invalid reservations data for calendar:', reservations);
      return grouped;
    }
    
    reservations.forEach(reservation => {
      try {
        const checkInDate = new Date(reservation.checkIn);
        const checkOutDate = new Date(reservation.checkOut);
        
        // Validar fechas
        if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
          console.warn('Invalid dates in reservation:', reservation.id);
          return;
        }
        
        // Crear rango de fechas para la reserva
        const dateRange = eachDayOfInterval({ start: checkInDate, end: checkOutDate });
        
        dateRange.forEach((date, index) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          
          grouped[dateKey].push({
            ...reservation,
            isCheckIn: index === 0,
            isCheckOut: index === dateRange.length - 1,
            isStay: index > 0 && index < dateRange.length - 1
          });
        });
      } catch (error) {
        console.warn('Error processing reservation dates:', reservation.id, error);
      }
    });
    
    return grouped;
  }, [reservations]);

  const getReservationsForDate = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return reservationsByDate[dateKey] || [];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case RESERVATION_STATUS.CONFIRMED:
        return 'bg-green-500';
      case RESERVATION_STATUS.PENDING:
        return 'bg-yellow-500';
      case RESERVATION_STATUS.CHECKED_IN:
        return 'bg-blue-500';
      case RESERVATION_STATUS.CHECKED_OUT:
        return 'bg-gray-500';
      case RESERVATION_STATUS.CANCELLED:
        return 'bg-red-500';
      case RESERVATION_STATUS.NO_SHOW:
        return 'bg-orange-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case RESERVATION_STATUS.PENDING:
        return 'Pendiente';
      case RESERVATION_STATUS.CONFIRMED:
        return 'Confirmada';
      case RESERVATION_STATUS.CHECKED_IN:
        return 'Check-in';
      case RESERVATION_STATUS.CHECKED_OUT:
        return 'Check-out';
      case RESERVATION_STATUS.CANCELLED:
        return 'Cancelada';
      case RESERVATION_STATUS.NO_SHOW:
        return 'No Show';
      default:
        return status;
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const DayCell = ({ date }) => {
    const dayReservations = getReservationsForDate(date);
    const isCurrentMonth = isSameMonth(date, currentDate);
    const isSelected = isSameDay(date, selectedDate);
    const isCurrentDay = isToday(date);

    // Contar reservas por estado
    const statusCounts = dayReservations.reduce((acc, res) => {
      acc[res.status] = (acc[res.status] || 0) + 1;
      return acc;
    }, {});

    const hasImportantEvents = dayReservations.some(res => 
      res.isCheckIn || res.isCheckOut || res.status === RESERVATION_STATUS.PENDING
    );

    return (
      <div
        className={classNames(
          'min-h-[120px] border border-gray-200 p-2 cursor-pointer transition-all duration-200',
          !isCurrentMonth && 'bg-gray-50 text-gray-400',
          isSelected && 'bg-blue-50 border-blue-300 ring-1 ring-blue-300',
          isCurrentDay && !isSelected && 'bg-yellow-50 border-yellow-300',
          hasImportantEvents && 'shadow-sm',
          'hover:bg-gray-50 hover:shadow-md'
        )}
        onClick={() => setSelectedDate(date)}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={classNames(
            'text-sm font-medium',
            isCurrentDay && 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'
          )}>
            {format(date, 'd')}
          </span>
          {dayReservations.length > 0 && (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {dayReservations.length}
              </span>
              {hasImportantEvents && (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1">
          {dayReservations.slice(0, 3).map((reservationData, index) => {
            const { reservation, isCheckIn, isCheckOut, isStay } = reservationData;
            
            return (
              <div
                key={`${reservation.id}-${index}`}
                className={classNames(
                  'text-xs p-1 rounded cursor-pointer transition-all duration-150',
                  getStatusColor(reservation.status).replace('bg-', 'bg-opacity-20 bg-'),
                  'text-gray-800 border-l-2 hover:shadow-sm',
                  getStatusColor(reservation.status).replace('bg-', 'border-'),
                  'hover:bg-opacity-30'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectReservation && !readOnly) {
                    onSelectReservation(reservation);
                  }
                }}
                title={`${reservation.guest?.name || 'Sin nombre'} - Hab. ${reservation.room?.number || 'N/A'} - ${getStatusLabel(reservation.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 flex-1 min-w-0">
                    {isCheckIn && <span className="text-green-600 font-bold text-xs">→</span>}
                    {isCheckOut && <span className="text-red-600 font-bold text-xs">←</span>}
                    <span className="truncate text-xs">
                      {reservation.guest?.name || 'Sin nombre'} - {reservation.room?.number || 'N/A'}
                    </span>
                  </div>
                  {reservation.status === RESERVATION_STATUS.PENDING && (
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full flex-shrink-0 animate-pulse"></span>
                  )}
                </div>
              </div>
            );
          })}
          
          {dayReservations.length > 3 && (
            <div className="text-xs text-gray-500 text-center bg-gray-100 rounded px-1 py-0.5 cursor-pointer hover:bg-gray-200"
                 onClick={(e) => {
                   e.stopPropagation();
                   setSelectedDate(date);
                 }}>
              +{dayReservations.length - 3} más
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      {/* Calendar Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h2>
            {readOnly && (
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Solo lectura
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
            >
              Hoy
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Confirmada</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Pendiente</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Check-in</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span>Check-out</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Cancelada</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm mt-2">
            <div className="flex items-center space-x-1">
              <span className="text-green-600 font-bold">→</span>
              <span>Llegada</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-red-600 font-bold">←</span>
              <span>Salida</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Eventos importantes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before month start */}
          {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, index) => (
            <div key={`empty-${index}`} className="min-h-[120px]"></div>
          ))}
          
          {/* Days of the month */}
          {daysInMonth.map(date => (
            <DayCell key={format(date, 'yyyy-MM-dd')} date={date} />
          ))}
        </div>
      </div>

      {/* Selected Date Info */}
      {selectedDate && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 capitalize">
              {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: es })}
            </h3>
            {getReservationsForDate(selectedDate).length > 0 && (
              <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                {getReservationsForDate(selectedDate).length} reserva{getReservationsForDate(selectedDate).length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {getReservationsForDate(selectedDate).length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {getReservationsForDate(selectedDate).map((reservationData, index) => {
                const { reservation, isCheckIn, isCheckOut } = reservationData;
                
                return (
                  <div 
                    key={`${reservation.id}-${index}`}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onSelectReservation && !readOnly && onSelectReservation(reservation)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={classNames(
                        'w-3 h-3 rounded-full',
                        getStatusColor(reservation.status)
                      )}></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {reservation.guest?.name || 'Huésped sin nombre'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Habitación {reservation.room?.number || 'N/A'} 
                          {reservation.room?.type && ` - ${reservation.room.type}`}
                        </p>
                        {reservation.confirmationCode && (
                          <p className="text-xs text-gray-400">
                            #{reservation.confirmationCode}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        {isCheckIn && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                            Llegada
                          </span>
                        )}
                        {isCheckOut && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-medium">
                            Salida
                          </span>
                        )}
                        <span className={classNames(
                          'text-xs px-2 py-1 rounded font-medium',
                          getStatusColor(reservation.status).replace('bg-', 'bg-opacity-20 bg-'),
                          'border',
                          getStatusColor(reservation.status).replace('bg-', 'border-')
                        )}>
                          {getStatusLabel(reservation.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {reservation.adults || 1} huésped{(reservation.adults || 1) > 1 ? 'es' : ''}
                        {reservation.children > 0 && `, ${reservation.children} niño${reservation.children > 1 ? 's' : ''}`}
                      </p>
                      {reservation.specialRequests && (
                        <p className="text-xs text-blue-600 mt-1" title={reservation.specialRequests}>
                          📝 Solicitudes especiales
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay reservas para esta fecha</p>
              {!readOnly && (
                <p className="text-sm text-gray-400 mt-1">
                  Haz clic en "Nueva Reserva" para agregar una
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            <span className="font-medium">
              {reservations.filter(r => {
                const checkIn = new Date(r.checkIn);
                return checkIn.getMonth() === currentDate.getMonth() && 
                       checkIn.getFullYear() === currentDate.getFullYear();
              }).length}
            </span>
            <span className="ml-1">
              reserva{reservations.filter(r => {
                const checkIn = new Date(r.checkIn);
                return checkIn.getMonth() === currentDate.getMonth() && 
                       checkIn.getFullYear() === currentDate.getFullYear();
              }).length !== 1 ? 's' : ''} este mes
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            {reservations.filter(r => r.status === RESERVATION_STATUS.PENDING).length > 0 && (
              <div className="flex items-center space-x-1">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-600 font-medium">
                  {reservations.filter(r => r.status === RESERVATION_STATUS.PENDING).length} pendientes
                </span>
              </div>
            )}
            {readOnly && (
              <span className="text-yellow-600">• Modo solo lectura</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationCalendar;