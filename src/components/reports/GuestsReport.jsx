import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar, MapPin, Download, Globe, IdCard, Phone } from 'lucide-react';
import Button from '../common/Button';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import { db } from '../../lib/supabase';

const GuestsReport = ({ dateRange = {}, selectedPeriod = 'thisMonth' }) => {
  const [loading, setLoading] = useState(true);
  const [guestsData, setGuestsData] = useState({
    totalGuests: 0,
    newGuests: 0,
    returningGuests: 0,
    averageStay: 0,
    topNationalities: [],
    guestsByMonth: [],
    documentTypes: [],
    guestTrend: []
  });

  useEffect(() => {
    fetchGuestsData();
  }, [dateRange?.startDate, dateRange?.endDate, selectedPeriod]);

  const fetchGuestsData = async () => {
    setLoading(true);
    try {
      console.log('📊 Loading guests data from Supabase...');
      
      // 1. Obtener todas las reservas del período
      const { data: reservations, error: reservationsError } = await db.getReservations({ limit: 1000 });
      if (reservationsError) throw reservationsError;

      // 2. Obtener todos los huéspedes
      const { data: guests, error: guestsError } = await db.getGuests({ limit: 1000 });
      if (guestsError) throw guestsError;

      // 3. Filtrar reservas por período
      const filteredReservations = filterReservationsByPeriod(reservations, dateRange);
      const completedReservations = filteredReservations.filter(r => r.status === 'checked_out');

      // 4. Calcular huéspedes únicos del período
      const uniqueGuestIds = new Set(filteredReservations.map(r => r.guest_id));
      const totalGuests = uniqueGuestIds.size;

      // 5. Calcular huéspedes nuevos vs recurrentes
      const guestStats = Array.from(uniqueGuestIds).map(guestId => {
        const guest = guests.find(g => g.id === guestId);
        const allGuestReservations = reservations.filter(r => 
          r.guest_id === guestId && r.status === 'checked_out'
        );
        
        // Determinar si es nuevo basado en si tiene solo 1 reserva completada
        const isNew = allGuestReservations.length <= 1;
        
        return {
          guest,
          totalVisits: allGuestReservations.length,
          isNew
        };
      });

      const newGuests = guestStats.filter(g => g.isNew).length;
      const returningGuests = guestStats.filter(g => !g.isNew).length;

      // 6. Estadía promedio
      const avgStay = completedReservations.length > 0 
        ? completedReservations.reduce((sum, r) => sum + (r.nights || calculateNights(r.check_in, r.check_out)), 0) / completedReservations.length
        : 0;

      // 7. Análisis por tipo de documento (simula nacionalidades)
      const documentAnalysis = analyzeDocumentTypes(
        guestStats.map(g => g.guest).filter(Boolean)
      );

      // 8. Tendencia mensual (últimos 6 meses)
      const monthlyTrend = generateMonthlyTrend(reservations);

      // 9. Distribución por tipo de documento
      const documentTypes = generateDocumentTypeStats(
        guestStats.map(g => g.guest).filter(Boolean)
      );

      setGuestsData({
        totalGuests,
        newGuests,
        returningGuests,
        averageStay: Math.round(avgStay * 10) / 10,
        topNationalities: documentAnalysis,
        guestsByMonth: monthlyTrend,
        documentTypes,
        guestTrend: monthlyTrend
      });

      console.log('✅ Guests data loaded successfully');
      
    } catch (error) {
      console.error('❌ Error fetching guests data:', error);
      
      // Fallback con datos mock
      setGuestsData({
        totalGuests: 0,
        newGuests: 0,
        returningGuests: 0,
        averageStay: 0,
        topNationalities: [
          { country: 'Perú', count: 0, percentage: 100 }
        ],
        guestsByMonth: [],
        documentTypes: [],
        guestTrend: []
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      console.log('📄 Exporting guests report...');
      
      const { generateReportPDF } = await import('../../utils/pdfGenerator');
      
      const reportData = {
        title: 'Reporte de Huéspedes',
        period: formatPeriod(dateRange),
        generatedAt: new Date().toLocaleString('es-PE'),
        guestsData,
        summary: {
          totalGuests: guestsData.totalGuests,
          newGuestsPercentage: guestsData.totalGuests > 0 
            ? Math.round((guestsData.newGuests / guestsData.totalGuests) * 100)
            : 0,
          averageStay: guestsData.averageStay,
          returningGuestsPercentage: guestsData.totalGuests > 0
            ? Math.round((guestsData.returningGuests / guestsData.totalGuests) * 100)
            : 0
        }
      };
      
      await generateReportPDF('guests', reportData);
      
    } catch (error) {
      console.error('❌ Error exporting report:', error);
      alert('Error al exportar el reporte: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-lg">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-lg h-64">
                <div className="h-full bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reporte de Huéspedes</h2>
            <p className="text-gray-600">
              Período: {formatPeriod(dateRange)}
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={Download}
          onClick={exportReport}
        >
          Exportar
        </Button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Huéspedes</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(guestsData.totalGuests)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">Período actual</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Huéspedes Nuevos</p>
              <p className="text-3xl font-bold text-green-600">{formatNumber(guestsData.newGuests)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">
              {guestsData.totalGuests > 0 
                ? formatPercentage((guestsData.newGuests / guestsData.totalGuests) * 100)
                : '0%'} del total
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Huéspedes Recurrentes</p>
              <p className="text-3xl font-bold text-purple-600">{formatNumber(guestsData.returningGuests)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">
              {guestsData.totalGuests > 0 
                ? formatPercentage((guestsData.returningGuests / guestsData.totalGuests) * 100)
                : '0%'} del total
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Estadía Promedio</p>
              <p className="text-3xl font-bold text-orange-600">{guestsData.averageStay}</p>
              <p className="text-sm text-gray-500">días</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos y análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Análisis por origen (basado en tipo de documento) */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <Globe className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Análisis por Origen</h3>
          </div>
          <div className="space-y-3">
            {guestsData.topNationalities.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <span className="font-medium text-gray-900">{item.country}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tipos de documento */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <IdCard className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Tipos de Documento</h3>
          </div>
          <div className="space-y-3">
            {guestsData.documentTypes.map((type, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <IdCard className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium text-gray-900">{type.type}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${type.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {type.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tendencia mensual */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Tendencia de Huéspedes por Mes</h3>
        </div>
        <div className="space-y-3">
          {guestsData.guestsByMonth.map((month, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="font-medium text-gray-700 w-16">{month.month}</span>
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-full bg-gray-200 rounded-full h-3 mx-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${Math.max(5, (month.guests / Math.max(...guestsData.guestsByMonth.map(m => m.guests))) * 100)}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-12 text-right">
                  {month.guests}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estadísticas adicionales */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas Adicionales</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {guestsData.totalGuests > 0 
                ? formatPercentage((guestsData.newGuests / guestsData.totalGuests) * 100)
                : '0%'}
            </p>
            <p className="text-sm text-gray-600">Tasa de huéspedes nuevos</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{guestsData.averageStay}</p>
            <p className="text-sm text-gray-600">Días promedio de estadía</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {guestsData.totalGuests > 0 
                ? formatPercentage((guestsData.returningGuests / guestsData.totalGuests) * 100)
                : '0%'}
            </p>
            <p className="text-sm text-gray-600">Tasa de fidelización</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================
// FUNCIONES AUXILIARES
// =============================================

function filterReservationsByPeriod(reservations, dateRange) {
  if (!dateRange?.startDate || !dateRange?.endDate) {
    // Si no hay rango, usar último mes
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    
    return reservations.filter(reservation => {
      const checkOut = new Date(reservation.checked_out_at || reservation.check_out);
      return checkOut >= start && checkOut <= end;
    });
  }
  
  const start = new Date(dateRange.startDate);
  const end = new Date(dateRange.endDate);
  
  return reservations.filter(reservation => {
    const checkIn = new Date(reservation.check_in);
    const checkOut = new Date(reservation.check_out);
    
    // Incluir si la reserva se solapa con el período
    return checkIn <= end && checkOut >= start;
  });
}

function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1;
  
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(1, diffDays);
}

function analyzeDocumentTypes(guests) {
  if (!guests || guests.length === 0) {
    return [{ country: 'Sin datos', count: 0, percentage: 100 }];
  }

  // Analizar por tipo de documento para simular nacionalidades
  const analysis = [];
  
  const dniGuests = guests.filter(g => 
    g.document_type === 'DNI' || 
    (g.document_number && g.document_number.length === 8 && /^\d+$/.test(g.document_number))
  ).length;
  
  const passportGuests = guests.filter(g => 
    g.document_type === 'Pasaporte' ||
    (g.document_number && g.document_number.length > 8)
  ).length;
  
  const otherGuests = guests.length - dniGuests - passportGuests;
  
  if (dniGuests > 0) {
    analysis.push({
      country: 'Perú (DNI)',
      count: dniGuests,
      percentage: Math.round((dniGuests / guests.length) * 100)
    });
  }
  
  if (passportGuests > 0) {
    analysis.push({
      country: 'Extranjeros (Pasaporte)',
      count: passportGuests,
      percentage: Math.round((passportGuests / guests.length) * 100)
    });
  }
  
  if (otherGuests > 0) {
    analysis.push({
      country: 'Otros documentos',
      count: otherGuests,
      percentage: Math.round((otherGuests / guests.length) * 100)
    });
  }
  
  return analysis.length > 0 ? analysis : [{ country: 'Sin datos', count: 0, percentage: 100 }];
}

function generateMonthlyTrend(reservations) {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const trend = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const monthReservations = reservations.filter(r => {
      const checkIn = new Date(r.check_in);
      return checkIn >= monthStart && checkIn <= monthEnd;
    });
    
    const uniqueGuests = new Set(monthReservations.map(r => r.guest_id)).size;
    
    trend.push({
      month: months[date.getMonth()],
      guests: uniqueGuests
    });
  }
  
  return trend;
}

function generateDocumentTypeStats(guests) {
  if (!guests || guests.length === 0) {
    return [{ type: 'Sin datos', count: 0, percentage: 100 }];
  }

  const stats = {};
  
  guests.forEach(guest => {
    const docType = guest.document_type || 'Sin especificar';
    stats[docType] = (stats[docType] || 0) + 1;
  });
  
  return Object.entries(stats).map(([type, count]) => ({
    type,
    count,
    percentage: Math.round((count / guests.length) * 100)
  }));
}

function formatPeriod(dateRange) {
  if (!dateRange?.startDate || !dateRange?.endDate) {
    return 'Último mes';
  }
  
  const start = new Date(dateRange.startDate).toLocaleDateString('es-PE');
  const end = new Date(dateRange.endDate).toLocaleDateString('es-PE');
  
  return `${start} - ${end}`;
}

export default GuestsReport;