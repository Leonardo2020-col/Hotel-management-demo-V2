// hooks/useReports.js - CONECTADO A SUPABASE ACTUALIZADO
import { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/supabase';

export const useReports = (dateRange, selectedPeriod) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawData, setRawData] = useState({
    rooms: [],
    reservations: [],
    guests: [],
    supplies: [],
    dailyReports: []
  });

  // Cargar datos de la base de datos
  useEffect(() => {
    const loadReportsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('📊 Loading reports data from Supabase...');
        
        // Cargar datos en paralelo
        const [
          roomsResult,  
          reservationsResult,
          guestsResult,
          suppliesResult,
          dashboardResult,
          snacksResult
        ] = await Promise.all([
          db.getRooms(),
          db.getReservations({ limit: 1000 }),
          db.getGuests({ limit: 1000 }),
          db.getAllInventoryItems(),
          db.getDashboardStats(),
          db.getSnackItems()
        ]);

        setRawData({
          rooms: roomsResult.data || [],
          reservations: reservationsResult.data || [],
          guests: guestsResult.data || [],
          supplies: suppliesResult.data || [],
          dashboardStats: dashboardResult.data || {},
          snacks: snacksResult.data || {}
        });

        console.log('✅ Reports data loaded:', {
          rooms: roomsResult.data?.length || 0,
          reservations: reservationsResult.data?.length || 0,
          guests: guestsResult.data?.length || 0,
          supplies: suppliesResult.data?.length || 0
        });
        
      } catch (err) {
        console.error('❌ Error loading reports data:', err);
        setError('Error al cargar los datos de reportes: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadReportsData();
  }, [dateRange?.startDate, dateRange?.endDate, selectedPeriod]);

  // Calcular estadísticas del overview
  const overviewStats = useMemo(() => {
    if (loading || !rawData.rooms.length) return null;
    
    try {
      const { rooms, reservations } = rawData;
      
      // Filtrar reservas por período
      const filteredReservations = filterReservationsByPeriod(reservations, dateRange);
      
      // Estadísticas de habitaciones
      const totalRooms = rooms.length;
      const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
      const avgOccupancy = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
      
      // Ingresos del período
      const completedReservations = filteredReservations.filter(r => r.status === 'checked_out');
      const totalRevenue = completedReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
      
      // Huéspedes únicos
      const uniqueGuests = new Set(filteredReservations.map(r => r.guest_id)).size;
      
      // Tarifa promedio
      const avgRate = completedReservations.length > 0 
        ? completedReservations.reduce((sum, r) => sum + (r.rate || 0), 0) / completedReservations.length
        : 0;

      return {
        avgOccupancy,
        totalRevenue,
        totalGuests: uniqueGuests,
        avgRate: Math.round(avgRate * 100) / 100
      };
      
    } catch (err) {
      console.error('Error calculating overview stats:', err);
      return null;
    }
  }, [loading, rawData, dateRange]);

  // Datos de ocupación
  const occupancyData = useMemo(() => {
    if (loading || !rawData.rooms.length) return null;
    
    try {
      const { rooms, reservations } = rawData;
      const occupancyTrend = [];
      
      // Generar datos para los últimos 7 días
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Contar habitaciones ocupadas en esa fecha
        const occupiedOnDate = reservations.filter(r => 
          r.status === 'checked_in' &&
          r.check_in <= dateStr &&
          r.check_out > dateStr
        ).length;
        
        const occupancyRate = rooms.length > 0 ? Math.round((occupiedOnDate / rooms.length) * 100) : 0;
        
        occupancyTrend.push({
          date: dateStr,
          occupancy: occupancyRate,
          availableRooms: rooms.length - occupiedOnDate,
          occupiedRooms: occupiedOnDate
        });
      }
      
      return occupancyTrend;
      
    } catch (err) {
      console.error('Error calculating occupancy data:', err);
      return [];
    }
  }, [loading, rawData]);

  // Datos de ingresos
  const revenueData = useMemo(() => {
    if (loading || !rawData.reservations.length) return null;
    
    try {
      const filteredReservations = filterReservationsByPeriod(rawData.reservations, dateRange);
      const completedReservations = filteredReservations.filter(r => r.status === 'checked_out');
      
      // Ingresos por habitaciones
      const roomRevenue = completedReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
      
      // Ingresos por snacks (simulado - puedes conectar a checkin_orders si existe)
      const snackRevenue = roomRevenue * 0.15; // Estimación del 15%
      
      const totalRevenue = roomRevenue + snackRevenue;
      
      return [
        { 
          category: 'Habitaciones', 
          amount: roomRevenue, 
          percentage: totalRevenue > 0 ? Math.round((roomRevenue / totalRevenue) * 100) : 85,
          color: '#3B82F6'
        },
        { 
          category: 'Snacks y Tienda', 
          amount: snackRevenue, 
          percentage: totalRevenue > 0 ? Math.round((snackRevenue / totalRevenue) * 100) : 15,
          color: '#10B981'
        }
      ];
      
    } catch (err) {
      console.error('Error calculating revenue data:', err);
      return [];
    }
  }, [loading, rawData, dateRange]);

  // Datos de huéspedes
  const guestsData = useMemo(() => {
    if (loading || !rawData.guests.length) return null;
    
    try {
      const { guests, reservations } = rawData;
      const filteredReservations = filterReservationsByPeriod(reservations, dateRange);
      
      // Huéspedes únicos en el período
      const uniqueGuestIds = new Set(filteredReservations.map(r => r.guest_id));
      const uniqueGuests = uniqueGuestIds.size;
      
      // Calcular huéspedes nuevos vs recurrentes
      const guestStats = Array.from(uniqueGuestIds).map(guestId => {
        const guest = guests.find(g => g.id === guestId);
        const guestReservations = reservations.filter(r => r.guest_id === guestId && r.status === 'checked_out');
        return {
          ...guest,
          totalVisits: guestReservations.length,
          isNew: guestReservations.length <= 1
        };
      });
      
      const newGuests = guestStats.filter(g => g.isNew).length;
      const returningGuests = guestStats.filter(g => !g.isNew).length;
      
      // Estadía promedio
      const completedReservations = filteredReservations.filter(r => r.status === 'checked_out');
      const avgStay = completedReservations.length > 0 
        ? completedReservations.reduce((sum, r) => sum + (r.nights || calculateNights(r.check_in, r.check_out)), 0) / completedReservations.length
        : 0;

      return {
        totalGuests: uniqueGuests,
        newGuests,
        returningGuests,
        averageStay: Math.round(avgStay * 10) / 10,
        satisfactionScore: 4.6, // Simulado - puedes agregar sistema de ratings
        demographics: calculateDemographics(guestStats)
      };
      
    } catch (err) {
      console.error('Error calculating guests data:', err);
      return null;
    }
  }, [loading, rawData, dateRange]);

  // Datos de habitaciones
  const roomsData = useMemo(() => {
    if (loading || !rawData.rooms.length) return null;
    
    try {
      const { rooms, reservations } = rawData;
      const filteredReservations = filterReservationsByPeriod(reservations, dateRange);
      
      // Agrupar por tipo de habitación (usando campo directo)
      const roomsByType = rooms.reduce((acc, room) => {
        const type = room.room_type || 'Estándar';
        if (!acc[type]) {
          acc[type] = {
            type,
            total: 0,
            occupied: 0,
            revenue: 0
          };
        }
        acc[type].total++;
        if (room.status === 'occupied') {
          acc[type].occupied++;
        }
        return acc;
      }, {});
      
      // Calcular ingresos por tipo
      filteredReservations
        .filter(r => r.status === 'checked_out')
        .forEach(reservation => {
          const room = rooms.find(r => r.id === reservation.room_id);
          if (room) {
            const type = room.room_type || 'Estándar';
            if (roomsByType[type]) {
              roomsByType[type].revenue += reservation.total_amount || 0;
            }
          }
        });

      return {
        totalRooms: rooms.length,
        roomTypes: Object.values(roomsByType),
        maintenanceStatus: {
          operational: rooms.filter(r => ['available', 'occupied'].includes(r.status)).length,
          maintenance: rooms.filter(r => r.status === 'maintenance').length,
          outOfOrder: rooms.filter(r => r.status === 'out_of_order').length
        }
      };
      
    } catch (err) {
      console.error('Error calculating rooms data:', err);
      return null;
    }
  }, [loading, rawData, dateRange]);

  // Datos de suministros
  const suppliesData = useMemo(() => {
    if (loading || !rawData.supplies.length) return null;
    
    try {
      const { supplies } = rawData;
      
      // Separar supplies y snacks
      const actualSupplies = supplies.filter(s => s.item_type === 'supply' || !s.item_type);
      const snacks = supplies.filter(s => s.item_type === 'snack');
      
      // Calcular valor total del inventario
      const totalValue = actualSupplies.reduce((sum, supply) => {
        const stock = supply.currentStock || supply.current_stock || 0;
        const price = supply.unitPrice || supply.unit_price || 0;
        return sum + (stock * price);
      }, 0);
      
      // Categorías de consumo
      const categoryConsumption = actualSupplies.reduce((acc, supply) => {
        const category = supply.category || 'Sin categoría';
        const stock = supply.currentStock || supply.current_stock || 0;
        const price = supply.unitPrice || supply.unit_price || 0;
        const value = stock * price;
        
        if (!acc[category]) {
          acc[category] = { category, consumed: 0, percentage: 0 };
        }
        acc[category].consumed += value;
        return acc;
      }, {});
      
      // Calcular porcentajes
      const categoriesArray = Object.values(categoryConsumption);
      const totalConsumed = categoriesArray.reduce((sum, cat) => sum + cat.consumed, 0);
      categoriesArray.forEach(cat => {
        cat.percentage = totalConsumed > 0 ? Math.round((cat.consumed / totalConsumed) * 100) : 0;
      });
      
      // Items con stock bajo
      const stockAlerts = actualSupplies.filter(supply => {
        const current = supply.currentStock || supply.current_stock || 0;
        const min = supply.minStock || supply.min_stock || 0;
        return current <= min;
      }).length;

      return {
        totalValue,
        categoriesConsumption: categoriesArray,
        stockAlerts,
        monthlyConsumption: totalValue * 0.15, // Estimación del 15% mensual
        totalItems: actualSupplies.length,
        snackItems: snacks.length
      };
      
    } catch (err) {
      console.error('Error calculating supplies data:', err);
      return null;
    }
  }, [loading, rawData]);

  // Generar reporte personalizado
  const generateReport = async (reportConfig) => {
    try {
      setLoading(true);
      
      console.log('📊 Generating custom report:', reportConfig);
      
      // Simular generación (aquí puedes implementar lógica más compleja)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        reportId: Date.now().toString(),
        downloadUrl: '#'
      };
    } catch (error) {
      setError('Error al generar el reporte personalizado');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Exportar reporte a PDF
  const exportReport = async (reportType, format = 'pdf') => {
    try {
      console.log(`📄 Exporting ${reportType} report as ${format}...`);
      
      // Importar generadores dinámicamente
      const { generateReportPDF, generateReportExcel } = await import('../utils/pdfGenerator');
      
      // Generar contenido del reporte basado en datos reales
      const reportData = generateReportContent(reportType, {
        overviewStats,
        occupancyData,
        revenueData,
        guestsData,
        roomsData,
        suppliesData,
        dateRange
      });
      
      // Crear PDF o Excel según el formato
      if (format === 'pdf') {
        await generateReportPDF(reportType, reportData);
      } else if (format === 'excel' || format === 'csv') {
        await generateReportExcel(reportType, reportData);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error exporting report:', error);
      throw new Error('Error al exportar el reporte: ' + error.message);
    }
  };

  return {
    // Datos calculados
    overviewStats,
    occupancyData,
    revenueData,
    guestsData,
    roomsData,
    suppliesData,
    loading,
    error,
    
    // Métodos
    generateReport,
    exportReport,
    
    // Datos crudos para reportes personalizados
    rawData
  };
};

// =============================================
// FUNCIONES AUXILIARES
// =============================================

// Filtrar reservas por período
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

// Calcular noches entre fechas
function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1;
  
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(1, diffDays);
}

// Calcular demografía de huéspedes (simplificado)
function calculateDemographics(guests) {
  // Ya que eliminaste las columnas de nacionalidad, usar datos basados en documento
  const demographics = [];
  
  const peruvianGuests = guests.filter(g => 
    g.document_type === 'DNI' || 
    (g.document_number && g.document_number.length === 8)
  ).length;
  
  const foreignGuests = guests.length - peruvianGuests;
  
  if (guests.length > 0) {
    demographics.push({
      country: 'Perú',
      guests: peruvianGuests,
      percentage: Math.round((peruvianGuests / guests.length) * 100)
    });
    
    if (foreignGuests > 0) {
      demographics.push({
        country: 'Extranjeros',
        guests: foreignGuests,
        percentage: Math.round((foreignGuests / guests.length) * 100)
      });
    }
  }
  
  return demographics;
}

// Generar contenido del reporte
function generateReportContent(reportType, data) {
  const { dateRange } = data;
  
  const baseContent = {
    title: getReportTitle(reportType),
    period: formatPeriod(dateRange),
    generatedAt: new Date().toLocaleString('es-PE'),
    ...data
  };
  
  switch (reportType) {
    case 'overview':
      return {
        ...baseContent,
        sections: ['stats', 'occupancy', 'revenue', 'guests']
      };
    case 'occupancy':
      return {
        ...baseContent,
        sections: ['occupancy', 'rooms']
      };
    case 'revenue':
      return {
        ...baseContent,
        sections: ['revenue', 'financial_metrics']
      };
    default:
      return baseContent;
  }
}

// Títulos de reportes
function getReportTitle(reportType) {
  const titles = {
    overview: 'Resumen General',
    occupancy: 'Reporte de Ocupación',
    revenue: 'Reporte de Ingresos',
    guests: 'Reporte de Huéspedes',
    rooms: 'Reporte de Habitaciones',
    supplies: 'Reporte de Suministros'
  };
  
  return titles[reportType] || 'Reporte Personalizado';
}

// Formatear período
function formatPeriod(dateRange) {
  if (!dateRange?.startDate || !dateRange?.endDate) {
    return 'Último mes';
  }
  
  const start = new Date(dateRange.startDate).toLocaleDateString('es-PE');
  const end = new Date(dateRange.endDate).toLocaleDateString('es-PE');
  
  return `${start} - ${end}`;
}