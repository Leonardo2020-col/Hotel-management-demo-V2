// utils/pdfGenerator.js - GENERADOR DE PDFs CORREGIDO
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDate, formatPercentage, formatNumber } from './formatters';

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
  // MÉTODOS PRINCIPALES CORREGIDOS
  // =============================================

  generateOverviewReport(data) {
    console.log('📄 Generating Overview PDF Report...');
    
    try {
      this.addHeader('Reporte General del Hotel', data.period);
      
      if (data.overviewStats) {
        this.addOverviewStats(data.overviewStats);
      }
      
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
      
      const filename = `reporte_general_${this.getDateString()}.pdf`;
      return this.save(filename);
    } catch (error) {
      console.error('Error generating overview report:', error);
      throw new Error(`Error al generar reporte general: ${error.message}`);
    }
  }

  generateOccupancyReport(data) {
    console.log('📄 Generating Occupancy PDF Report...');
    
    try {
      this.addHeader('Reporte de Ocupación', data.period);
      
      if (data.occupancyData?.length > 0) {
        this.addOccupancySection(data.occupancyData);
        this.addOccupancyTable(data.occupancyData);
      } else {
        this.addNoDataMessage('No hay datos de ocupación disponibles para el período seleccionado');
      }

      if (data.roomsData) {
        this.checkPageBreak(80);
        this.addRoomsAnalysis(data.roomsData);
      }

      this.addFooter();
      
      const filename = `reporte_ocupacion_${this.getDateString()}.pdf`;
      return this.save(filename);
    } catch (error) {
      console.error('Error generating occupancy report:', error);
      throw new Error(`Error al generar reporte de ocupación: ${error.message}`);
    }
  }

  generateRevenueReport(data) {
    console.log('📄 Generating Revenue PDF Report...');
    
    try {
      this.addHeader('Reporte de Ingresos', data.period);
      
      if (data.revenueData?.length > 0) {
        this.addRevenueSection(data.revenueData);
        this.addRevenueTable(data.revenueData);
      } else {
        this.addNoDataMessage('No hay datos de ingresos disponibles para el período seleccionado');
      }

      if (data.overviewStats) {
        this.checkPageBreak(60);
        this.addRevenueAnalysis(data.overviewStats);
      }
      
      this.addFooter();
      
      const filename = `reporte_ingresos_${this.getDateString()}.pdf`;
      return this.save(filename);
    } catch (error) {
      console.error('Error generating revenue report:', error);
      throw new Error(`Error al generar reporte de ingresos: ${error.message}`);
    }
  }

  generateGuestsReport(data) {
    console.log('📄 Generating Guests PDF Report...');
    
    try {
      this.addHeader('Reporte de Huéspedes', data.period);
      
      if (data.guestsData) {
        this.addGuestsSection(data.guestsData);
        
        if (data.guestsData.demographics?.length > 0) {
          this.checkPageBreak(60);
          this.addGuestsDemographics(data.guestsData);
        }
      } else {
        this.addNoDataMessage('No hay datos de huéspedes disponibles para el período seleccionado');
      }

      this.addFooter();
      
      const filename = `reporte_huespedes_${this.getDateString()}.pdf`;
      return this.save(filename);
    } catch (error) {
      console.error('Error generating guests report:', error);
      throw new Error(`Error al generar reporte de huéspedes: ${error.message}`);
    }
  }

  generateCustomReport(data, config) {
    console.log('📄 Generating Custom PDF Report...');
    
    try {
      this.addHeader(data.title || 'Reporte Personalizado', data.period);
      
      // Agregar métricas seleccionadas
      if (config.metrics && config.metrics.length > 0) {
        this.addCustomMetrics(data, config.metrics);
      }
      
      // Agregar gráficos configurados  
      if (config.charts && config.charts.length > 0) {
        this.checkPageBreak(60);
        this.addCustomCharts(data, config.charts);
      }
      
      this.addFooter();
      
      const filename = `reporte_personalizado_${this.getDateString()}.pdf`;
      return this.save(filename);
    } catch (error) {
      console.error('Error generating custom report:', error);
      throw new Error(`Error al generar reporte personalizado: ${error.message}`);
    }
  }

  // =============================================
  // SECCIONES DEL REPORTE CORREGIDAS
  // =============================================

  addHeader(title, period) {
    try {
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
      this.doc.text(`Período: ${period || 'No especificado'}`, this.margin, this.currentY);
      
      this.currentY += 4;
      this.doc.text(`Generado el: ${new Date().toLocaleString('es-PE')}`, this.margin, this.currentY);
      
      // Línea separadora
      this.currentY += 8;
      this.doc.setDrawColor(COLORS.primary);
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin, this.currentY, 190, this.currentY);
      this.currentY += 10;
    } catch (error) {
      console.error('Error adding header:', error);
      this.currentY += 30; // Saltar espacio para continuar
    }
  }

  addOverviewStats(stats) {
    if (!stats) {
      this.addNoDataMessage('No hay estadísticas disponibles');
      return;
    }

    try {
      this.doc.setFontSize(14);
      this.doc.setTextColor(COLORS.dark);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Resumen Ejecutivo', this.margin, this.currentY);
      this.currentY += 8;

      // Crear tabla con las estadísticas principales
      const tableData = [
        ['Ocupación Promedio', this.safeFormatPercentage(stats.avgOccupancy)],
        ['Ingresos Totales', this.safeFormatCurrency(stats.totalRevenue)],
        ['Total de Huéspedes', this.safeFormatNumber(stats.totalGuests)],
        ['Tarifa Promedio Diaria', this.safeFormatCurrency(stats.avgRate)]
      ];

      this.doc.autoTable({
        startY: this.currentY,
        head: [['Métrica', 'Valor']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: this.hexToRgb(COLORS.primary),
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 10,
          textColor: this.hexToRgb(COLORS.dark)
        },
        alternateRowStyles: {
          fillColor: this.hexToRgb(COLORS.light)
        },
        margin: { left: this.margin, right: this.margin },
        columnStyles: {
          0: { cellWidth: 80, fontStyle: 'bold' },
          1: { cellWidth: 60, halign: 'right' }
        }
      });

      this.currentY = this.doc.lastAutoTable.finalY + 10;
    } catch (error) {
      console.error('Error adding overview stats:', error);
      this.addErrorMessage('Error al procesar estadísticas generales');
    }
  }

  addOccupancySection(occupancyData) {
    if (!occupancyData || !Array.isArray(occupancyData) || occupancyData.length === 0) {
      this.addNoDataMessage('No hay datos de ocupación disponibles');
      return;
    }

    try {
      this.doc.setFontSize(14);
      this.doc.setTextColor(COLORS.dark);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Análisis de Ocupación', this.margin, this.currentY);
      this.currentY += 8;

      // Calcular estadísticas
      const validOccupancy = occupancyData.filter(day => day.occupancy != null);
      if (validOccupancy.length === 0) {
        this.addNoDataMessage('No hay datos válidos de ocupación');
        return;
      }

      const avgOccupancy = validOccupancy.reduce((sum, day) => sum + (day.occupancy || 0), 0) / validOccupancy.length;
      const maxOccupancy = Math.max(...validOccupancy.map(day => day.occupancy || 0));
      const minOccupancy = Math.min(...validOccupancy.map(day => day.occupancy || 0));

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
          fillColor: this.hexToRgb(COLORS.secondary),
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
    } catch (error) {
      console.error('Error adding occupancy section:', error);
      this.addErrorMessage('Error al procesar datos de ocupación');
    }
  }

  addRevenueSection(revenueData) {
    if (!revenueData || !Array.isArray(revenueData) || revenueData.length === 0) {
      this.addNoDataMessage('No hay datos de ingresos disponibles');
      return;
    }

    try {
      this.doc.setFontSize(14);
      this.doc.setTextColor(COLORS.dark);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Análisis de Ingresos', this.margin, this.currentY);
      this.currentY += 8;

      const totalRevenue = revenueData.reduce((sum, item) => sum + (item.amount || 0), 0);

      // Texto explicativo
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Ingresos totales del período: ${this.safeFormatCurrency(totalRevenue)}`, this.margin, this.currentY);
      this.currentY += 8;

      const tableData = revenueData.map(item => [
        item.category || 'No especificado',
        this.safeFormatCurrency(item.amount),
        `${item.percentage || 0}%`
      ]);

      this.doc.autoTable({
        startY: this.currentY,
        head: [['Categoría', 'Monto', '% del Total']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: this.hexToRgb(COLORS.accent),
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
    } catch (error) {
      console.error('Error adding revenue section:', error);
      this.addErrorMessage('Error al procesar datos de ingresos');
    }
  }

  addGuestsSection(guestsData) {
    if (!guestsData) {
      this.addNoDataMessage('No hay datos de huéspedes disponibles');
      return;
    }

    try {
      this.doc.setFontSize(14);
      this.doc.setTextColor(COLORS.dark);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Análisis de Huéspedes', this.margin, this.currentY);
      this.currentY += 8;

      const guestStats = [
        ['Total de Huéspedes', this.safeFormatNumber(guestsData.totalGuests)],
        ['Huéspedes Nuevos', this.safeFormatNumber(guestsData.newGuests)],
        ['Huéspedes Recurrentes', this.safeFormatNumber(guestsData.returningGuests)],
        ['Estadía Promedio', `${guestsData.averageStay || 0} días`],
        ['Puntuación de Satisfacción', `${guestsData.satisfactionScore || 'N/A'}/5.0`]
      ];

      this.doc.autoTable({
        startY: this.currentY,
        head: [['Métrica', 'Valor']],
        body: guestStats,
        theme: 'grid',
        headStyles: {
          fillColor: this.hexToRgb(COLORS.primary),
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
    } catch (error) {
      console.error('Error adding guests section:', error);
      this.addErrorMessage('Error al procesar datos de huéspedes');
    }
  }

  addCustomMetrics(data, selectedMetrics) {
    try {
      this.doc.setFontSize(14);
      this.doc.setTextColor(COLORS.dark);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Métricas Seleccionadas', this.margin, this.currentY);
      this.currentY += 8;

      const metricsData = selectedMetrics.map(metricId => {
        return this.getMetricValue(data, metricId);
      }).filter(Boolean);

      if (metricsData.length > 0) {
        this.doc.autoTable({
          startY: this.currentY,
          head: [['Métrica', 'Valor']],
          body: metricsData,
          theme: 'grid',
          headStyles: {
            fillColor: this.hexToRgb(COLORS.primary),
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold'
          },
          bodyStyles: { fontSize: 10 },
          margin: { left: this.margin, right: this.margin }
        });

        this.currentY = this.doc.lastAutoTable.finalY + 10;
      } else {
        this.addNoDataMessage('No se pudieron obtener las métricas seleccionadas');
      }
    } catch (error) {
      console.error('Error adding custom metrics:', error);
      this.addErrorMessage('Error al procesar métricas personalizadas');
    }
  }

  getMetricValue(data, metricId) {
    try {
      // Mapear IDs de métricas a valores reales con validación segura
      const metricMap = {
        'occupancy_rate': ['Tasa de Ocupación', `${data.overviewStats?.avgOccupancy || 0}%`],
        'revenue': ['Ingresos Totales', this.safeFormatCurrency(data.overviewStats?.totalRevenue)],
        'guest_count': ['Número de Huéspedes', this.safeFormatNumber(data.overviewStats?.totalGuests)],
        'adr': ['Tarifa Promedio (ADR)', this.safeFormatCurrency(data.overviewStats?.avgRate)],
        'maintenance_issues': ['Issues de Mantenimiento', '0'],
        'supply_cost': ['Costo de Suministros', this.safeFormatCurrency(data.suppliesData?.totalValue)]
      };
      
      return metricMap[metricId] || null;
    } catch (error) {
      console.error(`Error getting metric value for ${metricId}:`, error);
      return null;
    }
  }

  addCustomCharts(data, charts) {
    try {
      this.doc.setFontSize(14);
      this.doc.setTextColor(COLORS.dark);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Gráficos Configurados', this.margin, this.currentY);
      this.currentY += 8;

      charts.forEach(chart => {
        this.checkPageBreak(40);
        
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(chart.title || 'Gráfico sin título', this.margin, this.currentY);
        this.currentY += 8;
        
        // Descripción del gráfico
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(`Tipo: ${this.getChartTypeName(chart.type)}`, this.margin, this.currentY);
        this.currentY += 5;
        this.doc.text(`Métrica: ${this.getMetricName(chart.metric)}`, this.margin, this.currentY);
        this.currentY += 15;
      });
    } catch (error) {
      console.error('Error adding custom charts:', error);
      this.addErrorMessage('Error al procesar gráficos personalizados');
    }
  }

  // =============================================
  // MÉTODOS AUXILIARES CORREGIDOS
  // =============================================

  addNoDataMessage(message) {
    try {
      this.doc.setFontSize(12);
      this.doc.setTextColor(COLORS.gray);
      this.doc.setFont('helvetica', 'italic');
      this.doc.text(message, this.margin, this.currentY);
      this.currentY += 20;
    } catch (error) {
      console.error('Error adding no data message:', error);
    }
  }

  addErrorMessage(message) {
    try {
      this.doc.setFontSize(10);
      this.doc.setTextColor(COLORS.danger);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`⚠️ ${message}`, this.margin, this.currentY);
      this.currentY += 15;
    } catch (error) {
      console.error('Error adding error message:', error);
    }
  }

  safeFormatCurrency(value) {
    try {
      if (value == null || isNaN(value)) return 'S/ 0.00';
      return formatCurrency(Number(value));
    } catch {
      return 'S/ 0.00';
    }
  }

  safeFormatNumber(value) {
    try {
      if (value == null || isNaN(value)) return '0';
      return formatNumber(Number(value));
    } catch {
      return '0';
    }
  }

  safeFormatPercentage(value) {
    try {
      if (value == null || isNaN(value)) return '0%';
      return formatPercentage(Number(value));
    } catch {
      return '0%';
    }
  }

  hexToRgb(hex) {
    try {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ] : [0, 0, 0];
    } catch {
      return [0, 0, 0];
    }
  }

  getChartTypeName(type) {
    const types = {
      'line': 'Gráfico de Líneas',
      'bar': 'Gráfico de Barras', 
      'pie': 'Gráfico Circular'
    };
    return types[type] || type;
  }

  getMetricName(metricId) {
    const metrics = {
      'occupancy_rate': 'Tasa de Ocupación',
      'revenue': 'Ingresos Totales',
      'guest_count': 'Número de Huéspedes',
      'adr': 'Tarifa Promedio'
    };
    return metrics[metricId] || metricId;
  }

  addFooter() {
    try {
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
    } catch (error) {
      console.error('Error adding footer:', error);
    }
  }

  checkPageBreak(requiredSpace) {
    try {
      if (this.currentY + requiredSpace > this.pageHeight - 30) {
        this.doc.addPage();
        this.currentY = 20;
      }
    } catch (error) {
      console.error('Error checking page break:', error);
    }
  }

  getDateString() {
    try {
      return new Date().toISOString().split('T')[0];
    } catch {
      return 'unknown-date';
    }
  }

  save(filename) {
    try {
      this.doc.save(filename);
      console.log(`✅ PDF saved: ${filename}`);
      return { success: true, filename };
    } catch (error) {
      console.error('❌ Error saving PDF:', error);
      throw new Error(`Error al guardar PDF: ${error.message}`);
    }
  }

  // Método para limpiar memoria
  destroy() {
    try {
      if (this.doc) {
        this.doc = null;
      }
    } catch (error) {
      console.error('Error destroying PDF generator:', error);
    }
  }
}

// =============================================
// FUNCIÓN PRINCIPAL CORREGIDA
// =============================================

export const generateReportPDF = async (reportType, reportData) => {
  let pdfGenerator = null;
  
  try {
    console.log(`📄 Generating ${reportType} PDF report...`);
    
    // Validar datos de entrada
    if (!reportData) {
      throw new Error('Los datos del reporte son requeridos');
    }

    // Asegurar que el período esté definido
    if (!reportData.period) {
      reportData.period = 'Período no especificado';
    }

    pdfGenerator = new HotelReportPDF();
    
    switch (reportType) {
      case 'overview':
      case 'general':
        return pdfGenerator.generateOverviewReport({
          ...reportData,
          overviewStats: reportData.overviewStats || extractOverviewStats(reportData)
        });
        
      case 'occupancy':
        return pdfGenerator.generateOccupancyReport({
          ...reportData,
          occupancyData: reportData.occupancyData || reportData.data || []
        });
        
      case 'revenue':
        return pdfGenerator.generateRevenueReport({
          ...reportData,
          revenueData: reportData.categories || reportData.revenueData || []
        });
        
      case 'guests':
        return pdfGenerator.generateGuestsReport({
          ...reportData,
          guestsData: reportData.guestsData || reportData
        });
        
      case 'custom':
        return pdfGenerator.generateCustomReport(reportData, reportData.config || {});
        
      default:
        console.warn(`Unknown report type: ${reportType}, generating overview instead`);
        return pdfGenerator.generateOverviewReport(reportData);
    }
    
  } catch (error) {
    console.error(`❌ Error generating ${reportType} PDF:`, error);
    
    // Limpiar memoria en caso de error
    if (pdfGenerator) {
      pdfGenerator.destroy();
    }
    
    throw new Error(`Error al generar PDF: ${error.message}`);
  }
};

// =============================================
// FUNCIÓN AUXILIAR PARA EXTRAER STATS
// =============================================

function extractOverviewStats(data) {
  try {
    return {
      avgOccupancy: data.avgOccupancy || data.occupancy || 0,
      totalRevenue: data.totalRevenue || data.revenue || 0,
      totalGuests: data.totalGuests || data.guests || 0,
      avgRate: data.avgRate || data.adr || 0
    };
  } catch (error) {
    console.error('Error extracting overview stats:', error);
    return {
      avgOccupancy: 0,
      totalRevenue: 0,
      totalGuests: 0,
      avgRate: 0
    };
  }
}

// =============================================
// FUNCIÓN PARA GENERAR REPORTES PERSONALIZADOS
// =============================================

export const generateCustomReportPDF = async (reportConfig, reportData) => {
  try {
    console.log('📄 Generating custom report PDF...');
    
    // Validar configuración
    if (!reportConfig) {
      throw new Error('La configuración del reporte es requerida');
    }

    if (!reportData) {
      throw new Error('Los datos del reporte son requeridos');
    }
    
    const customData = {
      title: reportConfig.title || 'Reporte Personalizado',
      period: reportData.period || 'Período no especificado',
      generatedAt: new Date().toLocaleString('es-PE'),
      overviewStats: reportData.overviewStats || extractOverviewStats(reportData),
      config: {
        metrics: reportConfig.metrics || [],
        charts: reportConfig.charts || [],
        filters: reportConfig.filters || []
      }
    };
    
    return await generateReportPDF('custom', customData);
    
  } catch (error) {
    console.error('❌ Error generating custom PDF:', error);
    throw new Error(`Error al generar reporte personalizado: ${error.message}`);
  }
};

// =============================================
// FUNCIÓN PARA GENERAR EXCEL/CSV
// =============================================

export const generateReportExcel = async (reportType, reportData) => {
  try {
    console.log(`📊 Generating ${reportType} Excel report...`);
    
    // Validar datos
    if (!reportData) {
      throw new Error('Los datos del reporte son requeridos');
    }
    
    let csvContent = '';
    
    // Header
    csvContent += `Reporte: ${getReportTitle(reportType)}\n`;
    csvContent += `Período: ${reportData.period || 'No especificado'}\n`;
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
    URL.revokeObjectURL(url);
    
    return { success: true };
    
  } catch (error) {
    console.error(`❌ Error generating ${reportType} Excel:`, error);
    throw new Error(`Error al generar Excel: ${error.message}`);
  }
};

// =============================================
// FUNCIONES AUXILIARES PARA CSV
// =============================================

function generateOverviewCSV(data) {
  try {
    let csv = 'RESUMEN EJECUTIVO\n';
    csv += 'Métrica,Valor\n';
    
    if (data.overviewStats) {
      csv += `Ocupación Promedio,"${data.overviewStats.avgOccupancy || 0}%"\n`;
      csv += `Ingresos Totales,"${formatCurrency(data.overviewStats.totalRevenue || 0)}"\n`;
      csv += `Total Huéspedes,"${data.overviewStats.totalGuests || 0}"\n`;
      csv += `Tarifa Promedio,"${formatCurrency(data.overviewStats.avgRate || 0)}"\n`;
    }
    
    return csv;
  } catch (error) {
    console.error('Error generating overview CSV:', error);
    return 'Error,No se pudieron procesar los datos\n';
  }
}

function generateOccupancyCSV(data) {
  try {
    let csv = 'OCUPACIÓN DIARIA\n';
    csv += 'Fecha,Habitaciones Ocupadas,Habitaciones Disponibles,Tasa de Ocupación\n';
    
    if (data.occupancyData && Array.isArray(data.occupancyData)) {
      data.occupancyData.forEach(day => {
        csv += `"${formatDate(day.date)}","${day.occupiedRooms || 0}","${day.availableRooms || 0}","${day.occupancy || 0}%"\n`;
      });
    }
    
    return csv;
  } catch (error) {
    console.error('Error generating occupancy CSV:', error);
    return 'Error,No se pudieron procesar los datos de ocupación\n';
  }
}

function generateRevenueCSV(data) {
  try {
    let csv = 'INGRESOS POR CATEGORÍA\n';
    csv += 'Categoría,Monto,Porcentaje\n';
    
    if (data.revenueData && Array.isArray(data.revenueData)) {
      data.revenueData.forEach(item => {
        csv += `"${item.category || 'No especificado'}","${formatCurrency(item.amount || 0)}","${item.percentage || 0}%"\n`;
      });
    }
    
    return csv;
  } catch (error) {
    console.error('Error generating revenue CSV:', error);
    return 'Error,No se pudieron procesar los datos de ingresos\n';
  }
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

// =============================================
// VALIDACIÓN DE DATOS
// =============================================

export const validateReportData = (reportData, reportType) => {
  try {
    if (!reportData) {
      throw new Error('Los datos del reporte son requeridos');
    }
    
    // Asegurar campos mínimos
    if (!reportData.period) {
      reportData.period = 'Período no especificado';
    }
    
    if (!reportData.generatedAt) {
      reportData.generatedAt = new Date().toLocaleString('es-PE');
    }
    
    return reportData;
  } catch (error) {
    console.error('Error validating report data:', error);
    throw new Error(`Error de validación: ${error.message}`);
  }
};

export default { 
  generateReportPDF, 
  generateCustomReportPDF, 
  generateReportExcel, 
  validateReportData 
};