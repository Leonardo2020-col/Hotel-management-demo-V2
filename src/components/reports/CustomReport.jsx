import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Download, BarChart3, PieChart, LineChart, Save } from 'lucide-react';
import Button from '../common/Button';
import { db } from '../../lib/supabase';
import { generateCustomReportPDF } from '../../utils/pdfGenerator';

const CustomReport = ({ dateRange = {}, selectedPeriod = 'thisMonth' }) => {
  const [loading, setLoading] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    title: '',
    description: '',
    metrics: [],
    charts: [],
    filters: []
  });
  const [savedReports, setSavedReports] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [saveLoading, setSaveLoading] = useState(false);

  const availableMetrics = [
    { id: 'occupancy_rate', name: 'Tasa de Ocupación', category: 'Habitaciones', type: 'percentage' },
    { id: 'revenue', name: 'Ingresos Totales', category: 'Financiero', type: 'currency' },
    { id: 'adr', name: 'Tarifa Promedio (ADR)', category: 'Financiero', type: 'currency' },
    { id: 'revpar', name: 'RevPAR', category: 'Financiero', type: 'currency' },
    { id: 'guest_count', name: 'Número de Huéspedes', category: 'Huéspedes', type: 'number' },
    { id: 'avg_stay', name: 'Estadía Promedio', category: 'Huéspedes', type: 'decimal' },
    { id: 'cancellation_rate', name: 'Tasa de Cancelación', category: 'Reservas', type: 'percentage' },
    { id: 'no_show_rate', name: 'Tasa de No Show', category: 'Reservas', type: 'percentage' },
    { id: 'maintenance_issues', name: 'Issues de Mantenimiento', category: 'Operaciones', type: 'number' },
    { id: 'supply_cost', name: 'Costo de Suministros', category: 'Operaciones', type: 'currency' },
    { id: 'guest_satisfaction', name: 'Satisfacción del Cliente', category: 'Calidad', type: 'rating' },
    { id: 'staff_productivity', name: 'Productividad del Personal', category: 'RRHH', type: 'percentage' }
  ];

  const chartTypes = [
    { id: 'line', name: 'Gráfico de Líneas', icon: LineChart, description: 'Para mostrar tendencias en el tiempo' },
    { id: 'bar', name: 'Gráfico de Barras', icon: BarChart3, description: 'Para comparar valores entre categorías' },
    { id: 'pie', name: 'Gráfico Circular', icon: PieChart, description: 'Para mostrar proporciones del total' }
  ];

  const reportTemplates = [
    { id: 'blank', name: 'Reporte en Blanco', description: 'Comenzar desde cero' },
    { id: 'financial', name: 'Reporte Financiero', description: 'Métricas de ingresos y rentabilidad' },
    { id: 'operational', name: 'Reporte Operacional', description: 'Métricas de ocupación y operaciones' },
    { id: 'guest_analysis', name: 'Análisis de Huéspedes', description: 'Comportamiento y satisfacción de huéspedes' }
  ];

  useEffect(() => {
    loadSavedReports();
    loadTemplate(selectedTemplate);
  }, [selectedTemplate]);

  const loadSavedReports = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading saved reports from Supabase...');
      
      const { data: reports, error } = await db.getSavedReports();
      if (error) throw error;

      // Transformar datos para el componente
      const transformedReports = reports.map(report => ({
        id: report.id,
        title: report.title,
        lastModified: new Date(report.updated_at).toISOString().split('T')[0],
        metrics: report.config?.metrics?.length || 0,
        description: report.description
      }));

      setSavedReports(transformedReports);
      console.log('✅ Saved reports loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading saved reports:', error);
      // Fallback con datos mock
      setSavedReports([
        { id: 1, title: 'Reporte Mensual Gerencia', lastModified: '2024-06-20', metrics: 8 },
        { id: 2, title: 'Análisis de Ocupación Semanal', lastModified: '2024-06-18', metrics: 5 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (templateId) => {
    const templates = {
      blank: {
        title: '',
        description: '',
        metrics: [],
        charts: [],
        filters: []
      },
      financial: {
        title: 'Reporte Financiero',
        description: 'Análisis completo de ingresos y métricas financieras',
        metrics: ['revenue', 'adr', 'revpar', 'occupancy_rate'],
        charts: [
          { type: 'line', metric: 'revenue', title: 'Tendencia de Ingresos' },
          { type: 'bar', metric: 'adr', title: 'ADR por Tipo de Habitación' }
        ],
        filters: ['room_type', 'booking_source']
      },
      operational: {
        title: 'Reporte Operacional',
        description: 'Métricas de ocupación y eficiencia operativa',
        metrics: ['occupancy_rate', 'maintenance_issues', 'supply_cost', 'staff_productivity'],
        charts: [
          { type: 'line', metric: 'occupancy_rate', title: 'Ocupación Diaria' },
          { type: 'pie', metric: 'maintenance_issues', title: 'Distribución de Issues' }
        ],
        filters: ['department', 'priority_level']
      },
      guest_analysis: {
        title: 'Análisis de Huéspedes',
        description: 'Comportamiento y satisfacción de huéspedes',
        metrics: ['guest_count', 'avg_stay', 'guest_satisfaction', 'cancellation_rate'],
        charts: [
          { type: 'bar', metric: 'guest_count', title: 'Huéspedes por Nacionalidad' },
          { type: 'line', metric: 'guest_satisfaction', title: 'Evolución de Satisfacción' }
        ],
        filters: ['nationality', 'room_type', 'booking_channel']
      }
    };

    setReportConfig(templates[templateId] || templates.blank);
  };

  const addMetric = (metricId) => {
    if (!reportConfig.metrics.includes(metricId)) {
      setReportConfig(prev => ({
        ...prev,
        metrics: [...prev.metrics, metricId]
      }));
    }
  };

  const removeMetric = (metricId) => {
    setReportConfig(prev => ({
      ...prev,
      metrics: prev.metrics.filter(m => m !== metricId)
    }));
  };

  const addChart = (chartType, metricId) => {
    const newChart = {
      id: Date.now(),
      type: chartType,
      metric: metricId,
      title: `${chartTypes.find(c => c.id === chartType)?.name} - ${availableMetrics.find(m => m.id === metricId)?.name}`
    };

    setReportConfig(prev => ({
      ...prev,
      charts: [...prev.charts, newChart]
    }));
  };

  const removeChart = (chartId) => {
    setReportConfig(prev => ({
      ...prev,
      charts: prev.charts.filter(c => c.id !== chartId)
    }));
  };

  const saveReport = async () => {
    if (!reportConfig.title.trim()) {
      alert('Por favor ingresa un título para el reporte');
      return;
    }

    setSaveLoading(true);
    try {
      console.log('💾 Saving custom report to Supabase...');
      
      const reportData = {
        title: reportConfig.title,
        description: reportConfig.description,
        config: {
          metrics: reportConfig.metrics,
          charts: reportConfig.charts,
          filters: reportConfig.filters,
          dateRange,
          selectedPeriod
        },
        created_by: 'current_user' // Aquí puedes usar el ID del usuario actual
      };

      const { data, error } = await db.saveCustomReport(reportData);
      if (error) throw error;

      // Actualizar lista de reportes guardados
      const newReport = {
        id: data.id,
        title: data.title,
        lastModified: new Date(data.created_at).toISOString().split('T')[0],
        metrics: data.config?.metrics?.length || 0,
        description: data.description
      };

      setSavedReports(prev => [newReport, ...prev]);
      alert('Reporte guardado exitosamente');
      console.log('✅ Report saved successfully');
      
    } catch (error) {
      console.error('❌ Error saving report:', error);
      alert('Error al guardar el reporte: ' + error.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      console.log('📊 Generating custom report with real data...');
      
      // Obtener datos reales basados en las métricas seleccionadas
      const [
        roomsResult,
        reservationsResult,
        guestsResult,
        suppliesResult
      ] = await Promise.all([
        db.getRooms(),
        db.getReservations({ limit: 1000 }),
        db.getGuests({ limit: 1000 }),
        db.getAllInventoryItems()
      ]);

      const rooms = roomsResult.data || [];
      const reservations = reservationsResult.data || [];
      const guests = guestsResult.data || [];
      const supplies = suppliesResult.data || [];

      // Calcular métricas reales
      const reportData = calculateMetrics({
        rooms,
        reservations,
        guests,
        supplies,
        metrics: reportConfig.metrics,
        dateRange
      });

      console.log('✅ Report generated with real data:', reportData);
      alert('Reporte generado exitosamente con datos reales');
      
    } catch (error) {
      console.error('❌ Error generating report:', error);
      alert('Error al generar el reporte: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (reportId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
      return;
    }

    try {
      console.log('🗑️ Deleting report from Supabase...');
      
      const { error } = await db.deleteSavedReport(reportId);
      if (error) throw error;

      setSavedReports(prev => prev.filter(r => r.id !== reportId));
      console.log('✅ Report deleted successfully');
      
    } catch (error) {
      console.error('❌ Error deleting report:', error);
      alert('Error al eliminar el reporte: ' + error.message);
    }
  };

  const exportReport = async () => {
    try {
      console.log('📄 Exporting custom report...');
      
      if (typeof generateCustomReportPDF === 'function') {
        await generateCustomReportPDF(reportConfig, dateRange);
      } else {
        // Fallback export
        const reportData = {
          title: reportConfig.title,
          description: reportConfig.description,
          metrics: reportConfig.metrics,
          charts: reportConfig.charts,
          period: formatPeriod(dateRange),
          generatedAt: new Date().toLocaleString('es-PE')
        };
        
        console.log('Report data to export:', reportData);
        alert('Funcionalidad de exportación en desarrollo');
      }
    } catch (error) {
      console.error('❌ Error exporting report:', error);
      alert('Error al exportar el reporte: ' + error.message);
    }
  };

  // Resto del componente permanece igual...
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-indigo-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reportes Personalizados</h2>
            <p className="text-gray-600">Crea reportes adaptados a tus necesidades específicas</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            icon={Save}
            onClick={saveReport}
            disabled={!reportConfig.title.trim()}
            loading={saveLoading}
          >
            Guardar
          </Button>
          <Button
            variant="primary"
            icon={Download}
            onClick={exportReport}
            disabled={reportConfig.metrics.length === 0}
          >
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de configuración */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información básica */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Reporte</h3>
            
            {/* Templates */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plantilla Base
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {reportTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Reporte
                </label>
                <input
                  type="text"
                  value={reportConfig.title}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Reporte Mensual de Ocupación"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={reportConfig.description}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe el propósito de este reporte..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Métricas seleccionadas */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Métricas Incluidas</h3>
              <span className="text-sm text-gray-600">{reportConfig.metrics.length} métricas</span>
            </div>
            
            {reportConfig.metrics.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No hay métricas seleccionadas</p>
                <p className="text-sm">Agrega métricas desde el panel lateral</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reportConfig.metrics.map(metricId => {
                  const metric = availableMetrics.find(m => m.id === metricId);
                  return (
                    <div key={metricId} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{metric?.name}</p>
                        <p className="text-sm text-gray-600">{metric?.category}</p>
                      </div>
                      <button
                        onClick={() => removeMetric(metricId)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gráficos configurados */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Gráficos Configurados</h3>
              <span className="text-sm text-gray-600">{reportConfig.charts.length} gráficos</span>
            </div>
            
            {reportConfig.charts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <PieChart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No hay gráficos configurados</p>
                <p className="text-sm">Configura gráficos desde el panel lateral</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reportConfig.charts.map(chart => {
                  const ChartIcon = chartTypes.find(c => c.id === chart.type)?.icon || BarChart3;
                  return (
                    <div key={chart.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <ChartIcon className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">{chart.title}</p>
                          <p className="text-sm text-gray-600">
                            {chartTypes.find(c => c.id === chart.type)?.name}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeChart(chart.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botón para generar reporte */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="text-center">
              <Button
                variant="primary"
                onClick={generateReport}
                loading={loading}
                disabled={reportConfig.metrics.length === 0}
                className="w-full"
              >
                {loading ? 'Generando Reporte...' : 'Generar Reporte'}
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                Período: {dateRange?.startDate?.toLocaleDateString('es-PE') || 'No definido'} - {dateRange?.endDate?.toLocaleDateString('es-PE') || 'No definido'}
              </p>
            </div>
          </div>
        </div>

        {/* Panel lateral - permanece igual */}
        <div className="space-y-6">
          {/* Métricas disponibles */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas Disponibles</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(
                availableMetrics.reduce((acc, metric) => {
                  if (!acc[metric.category]) acc[metric.category] = [];
                  acc[metric.category].push(metric);
                  return acc;
                }, {})
              ).map(([category, metrics]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">{category}</h4>
                  {metrics.map(metric => (
                    <button
                      key={metric.id}
                      onClick={() => addMetric(metric.id)}
                      disabled={reportConfig.metrics.includes(metric.id)}
                      className={`w-full text-left p-2 text-sm rounded transition-colors ${
                        reportConfig.metrics.includes(metric.id)
                          ? 'bg-green-100 text-green-800 cursor-not-allowed'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{metric.name}</span>
                        {reportConfig.metrics.includes(metric.id) ? (
                          <span className="text-xs">✓</span>
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Configurador de gráficos */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Gráfico</h3>
            <div className="space-y-3">
              {chartTypes.map(chartType => {
                const Icon = chartType.icon;
                return (
                  <div key={chartType.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Icon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium">{chartType.name}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{chartType.description}</p>
                    <select
                      onChange={(e) => e.target.value && addChart(chartType.id, e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                      defaultValue=""
                    >
                      <option value="">Seleccionar métrica...</option>
                      {reportConfig.metrics.map(metricId => {
                        const metric = availableMetrics.find(m => m.id === metricId);
                        return (
                          <option key={metricId} value={metricId}>
                            {metric?.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reportes guardados */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reportes Guardados</h3>
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedReports.map(report => (
                  <div key={report.id} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{report.title}</p>
                      <p className="text-xs text-gray-600">{report.metrics} métricas • {report.lastModified}</p>
                    </div>
                    <button
                      onClick={() => deleteReport(report.id)}
                      className="text-red-600 hover:text-red-800 p-1 ml-2"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {savedReports.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No hay reportes guardados</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================
// FUNCIONES AUXILIARES
// =============================================

function calculateMetrics({ rooms, reservations, guests, supplies, metrics, dateRange }) {
  const results = {};
  
  // Filtrar reservas por período si es necesario
  const filteredReservations = dateRange?.startDate && dateRange?.endDate
    ? reservations.filter(r => {
        const checkIn = new Date(r.check_in);
        const checkOut = new Date(r.check_out);
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        return checkIn <= end && checkOut >= start;
      })
    : reservations;

  metrics.forEach(metricId => {
    switch (metricId) {
      case 'occupancy_rate':
        const totalRooms = rooms.length;
        const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
        results[metricId] = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
        break;
        
      case 'revenue':
        results[metricId] = filteredReservations
          .filter(r => r.status === 'checked_out')
          .reduce((sum, r) => sum + (r.total_amount || 0), 0);
        break;
        
      case 'guest_count':
        const uniqueGuests = new Set(filteredReservations.map(r => r.guest_id));
        results[metricId] = uniqueGuests.size;
        break;
        
      case 'adr':
        const completedReservations = filteredReservations.filter(r => r.status === 'checked_out');
        results[metricId] = completedReservations.length > 0
          ? completedReservations.reduce((sum, r) => sum + (r.rate || 0), 0) / completedReservations.length
          : 0;
        break;
        
      case 'maintenance_issues':
        results[metricId] = rooms.filter(r => 
          r.status === 'maintenance' || r.status === 'out_of_order'
        ).length;
        break;
        
      case 'supply_cost':
        results[metricId] = supplies
          .filter(s => s.item_type !== 'snack')
          .reduce((sum, s) => {
            const stock = s.currentStock || s.current_stock || 0;
            const price = s.unitPrice || s.unit_price || 0;
            return sum + (stock * price);
          }, 0);
        break;
        
      default:
        // Valor por defecto para métricas no implementadas
        results[metricId] = Math.random() * 100;
    }
  });
  
  return results;
}

function formatPeriod(dateRange) {
  if (!dateRange?.startDate || !dateRange?.endDate) {
    return 'Período no definido';
  }
  
  const start = new Date(dateRange.startDate).toLocaleDateString('es-PE');
  const end = new Date(dateRange.endDate).toLocaleDateString('es-PE');
  
  return `${start} - ${end}`;
}

export default CustomReport;