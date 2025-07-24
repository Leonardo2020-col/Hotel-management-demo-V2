// utils/pdfGenerator.js - GENERADOR DE PDFs PARA REPORTES
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDate, formatPercentage } from './formatters';

// Configuración base del PDF
const PDF_CONFIG = {
  unit: 'mm',
  format: 'a4',
  orientation: 'portrait',
  compress: true
};

// Colores del tema
const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981', 
  accent: '#F59E0B',
  danger: '#EF4444',
  dark: '#1F2937',
  gray: '#6B7280',
  light: '#F9FAFB'
};

export class HotelReportPDF {
  constructor() {
    this.doc = new jsPDF(PDF_CONFIG);
    this.currentY = 20;
    this.pageHeight = this.doc.internal.pageSize.height;
    this.margin = 20;
  }

  // =============================================
  // MÉTODOS PRINCIPALES
  // =============================================

  generateOverviewReport(data) {
    console.log('📄 Generating Overview PDF Report...');
    
    this.addHeader('Reporte General del Hotel', data.period);
    this.addOverviewStats(data.overviewStats);
    
    if (data.occupancyData?.length > 0) {
      this.checkPageBreak(60);
      this.addOccupancySection(data.occupancyData);
    }
    
    if (data.revenueData?.length > 0) {
      this.checkPageBreak(80);
      this.addRevenueSection(data.revenueData);
    }

    if (data.guestsData) {
      this.checkPageBreak(60);
      this.addGuestsSection(data.guestsData);
    }

    this.addFooter();
    return this.save(`reporte_general_${this.getDateString()}.pdf`);
  }

  generateOccupancyReport(data) {
    console.log('📄 Generating Occupancy PDF Report...');
    
    this.addHeader('Reporte de Ocupación', data.period);
    
    if (data.occupancyData?.length > 0) {
      this.addOccupancySection(data.occupancyData);
      this.addOccupancyTable(data.occupancyData);
    }

    if (data.roomsData) {
      this.checkPageBreak(80);
      this.addRoomsAnalysis(data.roomsData);
    }

    this.addFooter();
    return this.save(`reporte_ocupacion_${this.getDateString()}.pdf`);
  }

  generateRevenueReport(data) {
    console.log('📄 Generating Revenue PDF Report...');
    
    this.addHeader('Reporte de Ingresos', data.period);
    
    if (data.revenueData?.length > 0) {
      this.addRevenueSection(data.revenueData);
      this.addRevenueTable(data.revenueData);
    }

    this.addRevenueAnalysis(data.overviewStats);
    this.addFooter();
    
    return this.save(`reporte_ingresos_${this.getDateString()}.pdf`);
  }

  generateGuestsReport(data) {
    console.log('📄 Generating Guests PDF Report...');
    
    this.addHeader('Reporte de Huéspedes', data.period);
    
    if (data.guestsData) {
      this.addGuestsSection(data.guestsData);
      this.addGuestsDemographics(data.guestsData);
    }

    this.addFooter();
    return this.save(`reporte_huespedes_${this.getDateString()}.pdf`);
  }

  generateSuppliesReport(data) {
    console.log('📄 Generating Supplies PDF Report...');
    
    this.addHeader('Reporte de Suministros', data.period);
    
    if (data.suppliesData) {
      this.addSuppliesSection(data.suppliesData);
    }

    this.addFooter();
    return this.save(`reporte_suministros_${this.getDateString()}.pdf`);
  }

  // =============================================
  // SECCIONES DEL REPORTE
  // =============================================

  addHeader(title, period) {
    // Logo/Título del hotel
    this.doc.setFontSize(24);
    this.doc.setTextColor(COLORS.primary);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Hotel Paraíso', this.margin, this.currentY);
    
    // Título del reporte
    this.currentY += 10;
    this.doc.setFontSize(18);
    this.doc.setTextColor(COLORS.dark);
    this.doc.text(title, this.margin, this.currentY);
    
    // Período y fecha de generación
    this.currentY += 8;
    this.doc.setFontSize(10);
    this.doc.setTextColor(COLORS.gray);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Período: ${period}`, this.margin, this.currentY);
    
    this.currentY += 4;
    this.doc.text(`Generado el: ${new Date().toLocaleString('es-PE')}`, this.margin, this.currentY);
    
    // Línea separadora
    this.currentY += 8;
    this.doc.setDrawColor(COLORS.primary);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, 190, this.currentY);
    this.currentY += 10;
  }

  addOverviewStats(stats) {
    if (!stats) return;

    this.doc.setFontSize(14);
    this.doc.setTextColor(COLORS.dark);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Resumen Ejecutivo', this.margin, this.currentY);
    this.currentY += 8;

    // Crear tabla con las estadísticas principales
    const tableData = [
      ['Ocupación Promedio', formatPercentage(stats.avgOccupancy)],
      ['Ingresos Totales', formatCurrency(stats.totalRevenue)],
      ['Total de Huéspedes', stats.totalGuests.toString()],
      ['Tarifa Promedio Diaria', formatCurrency(stats.avgRate)]
    ];

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Métrica', 'Valor']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10,
        textColor: COLORS.dark
      },
      alternateRowStyles: {
        fillColor: COLORS.light
      },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { cellWidth: 60, halign: 'right' }
      }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  addOccupancySection(occupancyData) {
    this.doc.setFontSize(14);
    this.doc.setTextColor(COLORS.dark);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Análisis de Ocupación', this.margin, this.currentY);
    this.currentY += 8;

    // Calcular estadísticas
    const avgOccupancy = occupancyData.reduce((sum, day) => sum + day.occupancy, 0) / occupancyData.length;
    const maxOccupancy = Math.max(...occupancyData.map(day => day.occupancy));
    const minOccupancy = Math.min(...occupancyData.map(day => day.occupancy));

    // Estadísticas de ocupación
    const occupancyStats = [
      ['Ocupación Promedio', `${avgOccupancy.toFixed(1)}%`],
      ['Ocupación Máxima', `${maxOccupancy}%`],
      ['Ocupación Mínima', `${minOccupancy}%`],
      ['Variabilidad', `${(maxOccupancy - minOccupancy)}%`]
    ];

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Métrica de Ocupación', 'Valor']],
      body: occupancyStats,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 10 },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 50, halign: 'right' }
      }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  addOccupancyTable(occupancyData) {
    this.doc.setFontSize(12);
    this.doc.setTextColor(COLORS.dark);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Detalle Diario de Ocupación', this.margin, this.currentY);
    this.currentY += 8;

    const tableData = occupancyData.map(day => [
      formatDate(day.date),
      day.occupiedRooms.toString(),
      day.availableRooms.toString(),
      `${day.occupancy}%`
    ]);

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Fecha', 'Ocupadas', 'Disponibles', 'Tasa %']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' }
      }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  addRevenueSection(revenueData) {
    this.doc.setFontSize(14);
    this.doc.setTextColor(COLORS.dark);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Análisis de Ingresos', this.margin, this.currentY);
    this.currentY += 8;

    const totalRevenue = revenueData.reduce((sum, item) => sum + item.amount, 0);

    // Texto explicativo
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Ingresos totales del período: ${formatCurrency(totalRevenue)}`, this.margin, this.currentY);
    this.currentY += 8;

    const tableData = revenueData.map(item => [
      item.category,
      formatCurrency(item.amount),
      `${item.percentage}%`
    ]);

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Categoría', 'Monto', '% del Total']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.accent,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 10 },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 50, halign: 'right' },
        2: { cellWidth: 30, halign: 'center' }
      }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  addRevenueTable(revenueData) {
    // Análisis adicional de ingresos
    this.doc.setFontSize(12);
    this.doc.setTextColor(COLORS.dark);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Desglose Detallado', this.margin, this.currentY);
    this.currentY += 8;

    const totalRevenue = revenueData.reduce((sum, item) => sum + item.amount, 0);
    const roomRevenue = revenueData.find(item => item.category === 'Habitaciones')?.amount || 0;
    const snackRevenue = revenueData.find(item => item.category === 'Snacks y Tienda')?.amount || 0;

    const analysisData = [
      ['Ingresos por Habitaciones', formatCurrency(roomRevenue)],
      ['Ingresos por Snacks/Tienda', formatCurrency(snackRevenue)],
      ['Total de Ingresos', formatCurrency(totalRevenue)],
      ['Margen Habitaciones vs Total', `${roomRevenue > 0 ? ((roomRevenue / totalRevenue) * 100).toFixed(1) : 0}%`]
    ];

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Concepto', 'Valor']],
      body: analysisData,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 10 },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: 'bold' },
        1: { cellWidth: 50, halign: 'right' }
      }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  addRevenueAnalysis(stats) {
    if (!stats) return;

    this.doc.setFontSize(12);
    this.doc.setTextColor(COLORS.dark);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Métricas Financieras Clave', this.margin, this.currentY);
    this.currentY += 8;

    const metricsData = [
      ['ADR (Tarifa Promedio Diaria)', formatCurrency(stats.avgRate)],
      ['RevPAR (Ingresos por Habitación)', formatCurrency(stats.avgRate * (stats.avgOccupancy / 100))],
      ['Tasa de Ocupación', formatPercentage(stats.avgOccupancy)],
      ['Total Huéspedes Atendidos', stats.totalGuests.toString()]
    ];

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Métrica', 'Valor']],
      body: metricsData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 10 },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  addGuestsSection(guestsData) {
    this.doc.setFontSize(14);
    this.doc.setTextColor(COLORS.dark);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Análisis de Huéspedes', this.margin, this.currentY);
    this.currentY += 8;

    const guestStats = [
      ['Total de Huéspedes', guestsData.totalGuests.toString()],
      ['Huéspedes Nuevos', guestsData.newGuests.toString()],
      ['Huéspedes Recurrentes', guestsData.returningGuests.toString()],
      ['Estadía Promedio', `${guestsData.averageStay} días`],
      ['Puntuación de Satisfacción', `${guestsData.satisfactionScore}/5.0`]
    ];

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Métrica', 'Valor']],
      body: guestStats,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 10 },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 50, halign: 'right' }
      }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  addGuestsDemographics(guestsData) {
    if (!guestsData.demographics?.length) return;

    this.doc.setFontSize(12);
    this.doc.setTextColor(COLORS.dark);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Distribución por Nacionalidad', this.margin, this.currentY);
    this.currentY += 8;

    const demographicsData = guestsData.demographics.map(demo => [
      demo.country,
      demo.guests.toString(),
      `${demo.percentage}%`
    ]);

    this.doc.autoTable({
      startY: this.currentY,
      head: [['País', 'Huéspedes', '% del Total']],
      body: demographicsData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.accent,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 10 },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' }
      }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  addRoomsAnalysis(roomsData) {
    this.doc.setFontSize(14);
    this.doc.setTextColor(COLORS.dark);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Análisis de Habitaciones', this.margin, this.currentY);
    this.currentY += 8;

    // Estadísticas generales
    const roomStats = [
      ['Total de Habitaciones', roomsData.totalRooms.toString()],
      ['Habitaciones Operativas', roomsData.maintenanceStatus.operational.toString()],
      ['En Mantenimiento', roomsData.maintenanceStatus.maintenance.toString()],
      ['Fuera de Servicio', roomsData.maintenanceStatus.outOfOrder.toString()]
    ];

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Estado', 'Cantidad']],
      body: roomStats,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 10 },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 50, halign: 'center' }
      }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;

    // Análisis por tipo de habitación
    if (roomsData.roomTypes?.length > 0) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Rendimiento por Tipo de Habitación', this.margin, this.currentY);
      this.currentY += 8;

      const roomTypeData = roomsData.roomTypes.map(type => [
        type.type,
        type.total.toString(),
        type.occupied.toString(),
        `${type.total > 0 ? Math.round((type.occupied / type.total) * 100) : 0}%`,
        formatCurrency(type.revenue)
      ]);

      this.doc.autoTable({
        startY: this.currentY,
        head: [['Tipo', 'Total', 'Ocupadas', 'Tasa %', 'Ingresos']],
        body: roomTypeData,
        theme: 'striped',
        headStyles: {
          fillColor: COLORS.secondary,
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 9 },
        margin: { left: this.margin, right: this.margin },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 40, halign: 'right' }
        }
      });

      this.currentY = this.doc.lastAutoTable.finalY + 10;
    }
  }

  addSuppliesSection(suppliesData) {
    this.doc.setFontSize(14);
    this.doc.setTextColor(COLORS.dark);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Análisis de Suministros', this.margin, this.currentY);
    this.currentY += 8;

    const suppliesStats = [
      ['Valor Total del Inventario', formatCurrency(suppliesData.totalValue)],
      ['Consumo Mensual Estimado', formatCurrency(suppliesData.monthlyConsumption)],
      ['Items con Stock Bajo', suppliesData.stockAlerts.toString()],
      ['Rotación de Inventario', `${((suppliesData.monthlyConsumption / suppliesData.totalValue) * 100).toFixed(1)}%`]
    ];

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Métrica', 'Valor']],
      body: suppliesStats,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.danger,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 10 },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 50, halign: 'right' }
      }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;

    // Consumo por categorías
    if (suppliesData.categoriesConsumption?.length > 0) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Consumo por Categoría', this.margin, this.currentY);
      this.currentY += 8;

      const categoryData = suppliesData.categoriesConsumption.map(cat => [
        cat.category,
        formatCurrency(cat.consumed),
        `${cat.percentage}%`
      ]);

      this.doc.autoTable({
        startY: this.currentY,
        head: [['Categoría', 'Valor Consumido', '% del Total']],
        body: categoryData,
        theme: 'striped',
        headStyles: {
          fillColor: COLORS.accent,
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 10 },
        margin: { left: this.margin, right: this.margin },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 50, halign: 'right' },
          2: { cellWidth: 30, halign: 'center' }
        }
      });

      this.currentY = this.doc.lastAutoTable.finalY + 10;
    }
  }

  // =============================================
  // MÉTODOS AUXILIARES
  // =============================================

  addFooter() {
    const pageCount = this.doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Línea superior del footer
      this.doc.setDrawColor(COLORS.gray);
      this.doc.setLineWidth(0.3);
      this.doc.line(this.margin, this.pageHeight - 20, 190, this.pageHeight - 20);
      
      // Texto del footer
      this.doc.setFontSize(8);
      this.doc.setTextColor(COLORS.gray);
      this.doc.setFont('helvetica', 'normal');
      
      // Información del hotel (izquierda)
      this.doc.text('Hotel Paraíso - Sistema de Gestión', this.margin, this.pageHeight - 15);
      this.doc.text('Generado automáticamente', this.margin, this.pageHeight - 10);
      
      // Número de página (derecha)
      this.doc.text(`Página ${i} de ${pageCount}`, 190, this.pageHeight - 15, { align: 'right' });
      this.doc.text(new Date().toLocaleDateString('es-PE'), 190, this.pageHeight - 10, { align: 'right' });
    }
  }

  checkPageBreak(requiredSpace) {
    if (this.currentY + requiredSpace > this.pageHeight - 30) {
      this.doc.addPage();
      this.currentY = 20;
    }
  }

  getDateString() {
    return new Date().toISOString().split('T')[0];
  }

  save(filename) {
    try {
      this.doc.save(filename);
      console.log(`✅ PDF saved: ${filename}`);
      return { success: true, filename };
    } catch (error) {
      console.error('❌ Error saving PDF:', error);
      throw error;
    }
  }
}

// =============================================
// FUNCIÓN PRINCIPAL PARA GENERAR PDFs
// =============================================

export const generateReportPDF = async (reportType, reportData) => {
  try {
    console.log(`📄 Generating ${reportType} PDF report...`);
    
    const pdfGenerator = new HotelReportPDF();
    
    switch (reportType) {
      case 'overview':
      case 'general':
        return pdfGenerator.generateOverviewReport(reportData);
        
      case 'occupancy':
        return pdfGenerator.generateOccupancyReport(reportData);
        
      case 'revenue':
        return pdfGenerator.generateRevenueReport(reportData);
        
      case 'guests':
        return pdfGenerator.generateGuestsReport(reportData);
        
      case 'supplies':
        return pdfGenerator.generateSuppliesReport(reportData);
        
      default:
        // Para reportes personalizados o no reconocidos
        return pdfGenerator.generateOverviewReport(reportData);
    }
    
  } catch (error) {
    console.error(`❌ Error generating ${reportType} PDF:`, error);
    throw error;
  }
};

// =============================================
// FUNCIÓN PARA GENERAR EXCEL/CSV
// =============================================

export const generateReportExcel = async (reportType, reportData) => {
  try {
    console.log(`📊 Generating ${reportType} Excel report...`);
    
    let csvContent = '';
    
    // Header
    csvContent += `Reporte: ${getReportTitle(reportType)}\n`;
    csvContent += `Período: ${reportData.period}\n`;
    csvContent += `Generado: ${new Date().toLocaleString('es-PE')}\n\n`;
    
    // Data based on report type
    switch (reportType) {
      case 'overview':
        csvContent += generateOverviewCSV(reportData);
        break;
      case 'occupancy':
        csvContent += generateOccupancyCSV(reportData);
        break;
      case 'revenue':
        csvContent += generateRevenueCSV(reportData);
        break;
      default:
        csvContent += generateOverviewCSV(reportData);
    }
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return { success: true };
    
  } catch (error) {
    console.error(`❌ Error generating ${reportType} Excel:`, error);
    throw error;
  }
};

// =============================================
// FUNCIONES AUXILIARES PARA CSV
// =============================================

function generateOverviewCSV(data) {
  let csv = 'RESUMEN EJECUTIVO\n';
  csv += 'Métrica,Valor\n';
  
  if (data.overviewStats) {
    csv += `Ocupación Promedio,${data.overviewStats.avgOccupancy}%\n`;
    csv += `Ingresos Totales,"${formatCurrency(data.overviewStats.totalRevenue)}"\n`;
    csv += `Total Huéspedes,${data.overviewStats.totalGuests}\n`;
    csv += `Tarifa Promedio,"${formatCurrency(data.overviewStats.avgRate)}"\n`;
  }
  
  return csv;
}

function generateOccupancyCSV(data) {
  let csv = 'OCUPACIÓN DIARIA\n';
  csv += 'Fecha,Habitaciones Ocupadas,Habitaciones Disponibles,Tasa de Ocupación\n';
  
  if (data.occupancyData) {
    data.occupancyData.forEach(day => {
      csv += `${formatDate(day.date)},${day.occupiedRooms},${day.availableRooms},${day.occupancy}%\n`;
    });
  }
  
  return csv;
}

function generateRevenueCSV(data) {
  let csv = 'INGRESOS POR CATEGORÍA\n';
  csv += 'Categoría,Monto,Porcentaje\n';
  
  if (data.revenueData) {
    data.revenueData.forEach(item => {
      csv += `${item.category},"${formatCurrency(item.amount)}",${item.percentage}%\n`;
    });
  }
  
  return csv;
}

function getReportTitle(reportType) {
  const titles = {
    overview: 'Resumen General',
    occupancy: 'Reporte de Ocupación',
    revenue: 'Reporte de Ingresos',
    guests: 'Reporte de Huéspedes',
    supplies: 'Reporte de Suministros'
  };
  
  return titles[reportType] || 'Reporte Personalizado';
}