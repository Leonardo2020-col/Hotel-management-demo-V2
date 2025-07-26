// src/utils/pdfGenerator.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

class PDFGenerator {
  constructor() {
    this.doc = null;
  }

  createDocument() {
    this.doc = new jsPDF();
    return this.doc;
  }

  addHeader(title, subtitle = '') {
    if (!this.doc) this.createDocument();
    
    // Logo y título
    this.doc.setFontSize(24);
    this.doc.setTextColor(74, 144, 226); // Color azul
    this.doc.text('Hotel Paraíso', 20, 30);
    
    this.doc.setFontSize(18);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(title, 20, 45);
    
    if (subtitle) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(subtitle, 20, 55);
    }
    
    // Línea separadora
    this.doc.setLineWidth(0.5);
    this.doc.setDrawColor(74, 144, 226);
    this.doc.line(20, 65, 190, 65);
    
    return 75; // Retorna la posición Y donde continuar
  }

  addSection(title, yPosition) {
    if (!this.doc) return yPosition;
    
    this.doc.setFontSize(14);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(title, 20, yPosition);
    
    return yPosition + 10;
  }

  addTable(headers, data, startY) {
    if (!this.doc || !this.doc.autoTable) {
      console.error('autoTable not available');
      return startY + 50;
    }

    try {
      this.doc.autoTable({
        head: [headers],
        body: data,
        startY: startY,
        theme: 'grid',
        headStyles: {
          fillColor: [74, 144, 226],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 20, right: 20 }
      });
      
      return this.doc.lastAutoTable.finalY + 10;
    } catch (error) {
      console.error('Error creating table:', error);
      return startY + 50;
    }
  }

  addText(text, yPosition, fontSize = 10) {
    if (!this.doc) return yPosition;
    
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(text, 20, yPosition);
    
    return yPosition + (fontSize / 2) + 5;
  }

  addKeyValuePair(key, value, yPosition) {
    if (!this.doc) return yPosition;
    
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`${key}:`, 20, yPosition);
    this.doc.text(String(value), 80, yPosition);
    
    return yPosition + 8;
  }

  save(filename) {
    if (!this.doc) return;
    
    try {
      this.doc.save(filename);
      console.log(`PDF saved: ${filename}`);
    } catch (error) {
      console.error('Error saving PDF:', error);
    }
  }
}

// Función principal para generar reportes
export const generateReportPDF = async (reportType, data) => {
  try {
    console.log(`🔄 Generating ${reportType} PDF report...`);
    
    const generator = new PDFGenerator();
    let yPosition = generator.addHeader(data.title || 'Reporte del Hotel', data.period);
    
    // Información del período
    yPosition = generator.addText(`Período: ${data.period}`, yPosition, 10);
    yPosition = generator.addText(`Generado el: ${data.generatedAt}`, yPosition, 10);
    yPosition += 10;

    switch (reportType) {
      case 'overview':
      case 'summary':
        yPosition = await generateOverviewPDF(generator, data, yPosition);
        break;
      case 'occupancy':
        yPosition = await generateOccupancyPDF(generator, data, yPosition);
        break;
      case 'revenue':
        yPosition = await generateRevenuePDF(generator, data, yPosition);
        break;
      case 'guests':
        yPosition = await generateGuestsPDF(generator, data, yPosition);
        break;
      case 'rooms':
        yPosition = await generateRoomsPDF(generator, data, yPosition);
        break;
      case 'supplies':
        yPosition = await generateSuppliesPDF(generator, data, yPosition);
        break;
      default:
        yPosition = generator.addText('Tipo de reporte no reconocido', yPosition);
    }

    // Pie de página
    const pageCount = generator.doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      generator.doc.setPage(i);
      generator.doc.setFontSize(8);
      generator.doc.setTextColor(150, 150, 150);
      generator.doc.text(
        `Página ${i} de ${pageCount} - Hotel Paraíso - ${new Date().toLocaleDateString()}`,
        20,
        290
      );
    }

    // Generar nombre de archivo
    const date = new Date().toISOString().split('T')[0];
    const filename = `reporte_${reportType}_${date}.pdf`;
    
    generator.save(filename);
    console.log(`✅ PDF generated successfully: ${filename}`);
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw error;
  }
};

// Funciones específicas para cada tipo de reporte
async function generateOverviewPDF(generator, data, yPosition) {
  yPosition = generator.addSection('Resumen Ejecutivo', yPosition);
  
  if (data.summaryData || data.overviewStats) {
    const stats = data.summaryData || data.overviewStats;
    
    yPosition = generator.addKeyValuePair('Ocupación Promedio', 
      `${stats.avgOccupancy || stats.occupancy?.rate || 0}%`, yPosition);
    yPosition = generator.addKeyValuePair('Ingresos Totales', 
      formatCurrency(stats.totalRevenue || stats.revenue?.total || 0), yPosition);
    yPosition = generator.addKeyValuePair('Total Huéspedes', 
      stats.totalGuests || stats.guests?.total || 0, yPosition);
    yPosition = generator.addKeyValuePair('Tarifa Promedio', 
      formatCurrency(stats.avgRate || stats.financialMetrics?.adr || 0), yPosition);
  }
  
  return yPosition + 10;
}

async function generateOccupancyPDF(generator, data, yPosition) {
  yPosition = generator.addSection('Análisis de Ocupación', yPosition);
  
  if (data.roomStats) {
    yPosition = generator.addKeyValuePair('Total Habitaciones', data.roomStats.totalRooms, yPosition);
    yPosition = generator.addKeyValuePair('Habitaciones Ocupadas', data.roomStats.occupiedRooms, yPosition);
    yPosition = generator.addKeyValuePair('Ocupación Promedio', `${data.roomStats.avgOccupancy}%`, yPosition);
    yPosition = generator.addKeyValuePair('Ocupación Máxima', `${data.roomStats.maxOccupancy}%`, yPosition);
  }
  
  if (data.occupancyData && data.occupancyData.length > 0) {
    yPosition += 10;
    yPosition = generator.addSection('Ocupación Diaria', yPosition);
    
    const headers = ['Fecha', 'Ocupación %', 'Habitaciones Ocupadas', 'Habitaciones Disponibles'];
    const tableData = data.occupancyData.map(day => [
      new Date(day.date).toLocaleDateString('es-PE'),
      `${day.occupancy}%`,
      day.occupiedRooms?.toString() || '0',
      day.availableRooms?.toString() || '0'
    ]);
    
    yPosition = generator.addTable(headers, tableData, yPosition);
  }
  
  return yPosition;
}

async function generateRevenuePDF(generator, data, yPosition) {
  yPosition = generator.addSection('Análisis de Ingresos', yPosition);
  
  if (data.revenueData) {
    yPosition = generator.addKeyValuePair('Ingresos Totales', 
      formatCurrency(data.revenueData.totalRevenue), yPosition);
    yPosition = generator.addKeyValuePair('Principal Fuente', 
      data.revenueData.mainSource, yPosition);
    yPosition = generator.addKeyValuePair('Crecimiento', 
      `${data.revenueData.growth}%`, yPosition);
  }
  
  if (data.categories && data.categories.length > 0) {
    yPosition += 10;
    yPosition = generator.addSection('Distribución por Categoría', yPosition);
    
    const headers = ['Categoría', 'Monto', 'Porcentaje'];
    const tableData = data.categories.map(cat => [
      cat.name,
      formatCurrency(cat.amount),
      `${cat.percentage}%`
    ]);
    
    yPosition = generator.addTable(headers, tableData, yPosition);
  }
  
  return yPosition;
}

async function generateGuestsPDF(generator, data, yPosition) {
  yPosition = generator.addSection('Análisis de Huéspedes', yPosition);
  
  if (data.guestsData) {
    yPosition = generator.addKeyValuePair('Total Huéspedes', data.guestsData.totalGuests, yPosition);
    yPosition = generator.addKeyValuePair('Huéspedes Nuevos', data.guestsData.newGuests, yPosition);
    yPosition = generator.addKeyValuePair('Huéspedes Recurrentes', data.guestsData.returningGuests, yPosition);
    yPosition = generator.addKeyValuePair('Estadía Promedio', `${data.guestsData.averageStay} días`, yPosition);
  }
  
  return yPosition;
}

async function generateRoomsPDF(generator, data, yPosition) {
  yPosition = generator.addSection('Análisis de Habitaciones', yPosition);
  
  if (data.roomsData) {
    yPosition = generator.addKeyValuePair('Total Habitaciones', data.roomsData.totalRooms, yPosition);
    yPosition = generator.addKeyValuePair('Habitaciones Ocupadas', data.roomsData.occupiedRooms, yPosition);
    yPosition = generator.addKeyValuePair('Tasa de Ocupación', `${data.roomsData.occupancyRate}%`, yPosition);
    yPosition = generator.addKeyValuePair('Tarifa Promedio', formatCurrency(data.roomsData.averageRate), yPosition);
  }
  
  return yPosition;
}

async function generateSuppliesPDF(generator, data, yPosition) {
  yPosition = generator.addSection('Análisis de Suministros', yPosition);
  
  if (data.suppliesData) {
    yPosition = generator.addKeyValuePair('Total Items', data.suppliesData.totalItems, yPosition);
    yPosition = generator.addKeyValuePair('Items con Stock Bajo', data.suppliesData.lowStockItems, yPosition);
    yPosition = generator.addKeyValuePair('Valor Total', formatCurrency(data.suppliesData.totalValue), yPosition);
  }
  
  if (data.lowStockAlerts && data.lowStockAlerts.length > 0) {
    yPosition += 10;
    yPosition = generator.addSection('Alertas de Stock Bajo', yPosition);
    
    const headers = ['Item', 'Categoría', 'Stock Actual', 'Mínimo', 'Estado'];
    const tableData = data.lowStockAlerts.slice(0, 10).map(alert => [
      alert.item,
      alert.category,
      alert.current?.toString() || '0',
      alert.minimum?.toString() || '0',
      alert.status
    ]);
    
    yPosition = generator.addTable(headers, tableData, yPosition);
  }
  
  return yPosition;
}

// Función para reportes personalizados
export const generateCustomReportPDF = async (reportConfig, dateRange) => {
  try {
    console.log('🔄 Generating custom PDF report...');
    
    const generator = new PDFGenerator();
    let yPosition = generator.addHeader(
      reportConfig.title || 'Reporte Personalizado',
      `${formatPeriod(dateRange)} - ${reportConfig.description || ''}`
    );
    
    // Información del reporte
    yPosition = generator.addText(`Generado el: ${new Date().toLocaleString('es-PE')}`, yPosition, 10);
    yPosition += 10;
    
    // Métricas incluidas
    if (reportConfig.metrics && reportConfig.metrics.length > 0) {
      yPosition = generator.addSection('Métricas Incluidas', yPosition);
      
      const metricsText = reportConfig.metrics.join(', ');
      yPosition = generator.addText(`Métricas: ${metricsText}`, yPosition);
      yPosition += 10;
    }
    
    // Gráficos configurados
    if (reportConfig.charts && reportConfig.charts.length > 0) {
      yPosition = generator.addSection('Gráficos Configurados', yPosition);
      
      reportConfig.charts.forEach(chart => {
        yPosition = generator.addText(`• ${chart.title}`, yPosition);
      });
      yPosition += 10;
    }
    
    // Nota
    yPosition = generator.addText(
      'Nota: Este es un reporte personalizado. Los datos específicos se generarán según las métricas seleccionadas.',
      yPosition,
      9
    );
    
    const filename = `reporte_personalizado_${new Date().toISOString().split('T')[0]}.pdf`;
    generator.save(filename);
    
    console.log('✅ Custom PDF generated successfully');
    
  } catch (error) {
    console.error('❌ Error generating custom PDF:', error);
    throw error;
  }
};

// Funciones auxiliares
function formatCurrency(amount) {
  if (typeof amount !== 'number') return 'S/ 0.00';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(amount);
}

function formatPeriod(dateRange) {
  if (!dateRange?.startDate || !dateRange?.endDate) {
    return 'Período no definido';
  }
  
  const start = new Date(dateRange.startDate).toLocaleDateString('es-PE');
  const end = new Date(dateRange.endDate).toLocaleDateString('es-PE');
  
  return `${start} - ${end}`;
}

export default PDFGenerator;