// src/components/common/DataExporter.jsx - Componente para exportar datos
import React, { useState } from 'react';
import { Download, FileText, Table, Calendar, Users, Bed, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const DataExporter = ({ data, type, title, isOpen, onClose }) => {
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportFields, setExportFields] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [exporting, setExporting] = useState(false);

  // Configuración de campos por tipo de datos
  const getFieldsConfig = () => {
    switch (type) {
      case 'guests':
        return [
          { key: 'fullName', label: 'Nombre Completo', default: true },
          { key: 'email', label: 'Email', default: true },
          { key: 'phone', label: 'Teléfono', default: true },
          { key: 'documentType', label: 'Tipo Documento', default: true },
          { key: 'documentNumber', label: 'Número Documento', default: true },
          { key: 'status', label: 'Estado', default: true },
          { key: 'totalVisits', label: 'Total Visitas', default: false },
          { key: 'totalSpent', label: 'Total Gastado', default: false },
          { key: 'lastVisit', label: 'Última Visita', default: false },
          { key: 'createdAt', label: 'Fecha Registro', default: false }
        ];
      
      case 'rooms':
        return [
          { key: 'number', label: 'Número', default: true },
          { key: 'floor', label: 'Piso', default: true },
          { key: 'capacity', label: 'Capacidad', default: true },
          { key: 'base_rate', label: 'Tarifa Base', default: true },
          { key: 'status', label: 'Estado', default: true },
          { key: 'cleaning_status', label: 'Estado Limpieza', default: false },
          { key: 'size', label: 'Tamaño (m²)', default: false },
          { key: 'features', label: 'Amenidades', default: false },
          { key: 'last_cleaned', label: 'Última Limpieza', default: false },
          { key: 'currentGuest', label: 'Huésped Actual', default: false }
        ];
      
      case 'reservations':
        return [
          { key: 'confirmationCode', label: 'Código Confirmación', default: true },
          { key: 'guestName', label: 'Nombre Huésped', default: true },
          { key: 'roomNumber', label: 'Habitación', default: true },
          { key: 'checkIn', label: 'Check-in', default: true },
          { key: 'checkOut', label: 'Check-out', default: true },
          { key: 'nights', label: 'Noches', default: true },
          { key: 'adults', label: 'Adultos', default: true },
          { key: 'children', label: 'Niños', default: false },
          { key: 'totalAmount', label: 'Monto Total', default: true },
          { key: 'paidAmount', label: 'Monto Pagado', default: false },
          { key: 'paymentStatus', label: 'Estado Pago', default: true },
          { key: 'status', label: 'Estado Reserva', default: true },
          { key: 'source', label: 'Fuente', default: false },
          { key: 'createdAt', label: 'Fecha Creación', default: false }
        ];
      
      default:
        return [];
    }
  };

  const fieldsConfig = getFieldsConfig();

  // Inicializar campos seleccionados con los por defecto
  React.useEffect(() => {
    if (isOpen && exportFields.length === 0) {
      const defaultFields = fieldsConfig.filter(field => field.default).map(field => field.key);
      setExportFields(defaultFields);
    }
  }, [isOpen, fieldsConfig]);

  const formatDataForExport = () => {
    if (!data || !Array.isArray(data)) return [];

    return data.map(item => {
      const exportItem = {};
      
      exportFields.forEach(fieldKey => {
        const fieldConfig = fieldsConfig.find(f => f.key === fieldKey);
        if (!fieldConfig) return;

        let value = item[fieldKey];

        // Formatear valores específicos
        switch (fieldKey) {
          case 'features':
            value = Array.isArray(value) ? value.join(', ') : '';
            break;
          case 'totalSpent':
            value = `S/ ${(value || 0).toFixed(2)}`;
            break;
          case 'base_rate':
          case 'totalAmount':
          case 'paidAmount':
            value = `S/ ${(value || 0).toFixed(2)}`;
            break;
          case 'lastVisit':
          case 'createdAt':
          case 'checkIn':
          case 'checkOut':
          case 'last_cleaned':
            value = value ? new Date(value).toLocaleDateString('es-ES') : '';
            break;
          case 'currentGuest':
            value = value ? (value.name || value) : '';
            break;
          case 'guestName':
            value = item.guest?.name || item.guestName || '';
            break;
          case 'roomNumber':
            value = item.room?.number || item.roomNumber || '';
            break;
          case 'status':
            // Traducir estados al español
            const statusTranslations = {
              active: 'Activo',
              inactive: 'Inactivo',
              available: 'Disponible',
              occupied: 'Ocupada',
              cleaning: 'Limpieza',
              maintenance: 'Mantenimiento',
              confirmed: 'Confirmada',
              checked_in: 'Check-in',
              checked_out: 'Check-out',
              cancelled: 'Cancelada',
              pending: 'Pendiente',
              paid: 'Pagado',
              partial: 'Parcial',
              unpaid: 'No pagado'
            };
            value = statusTranslations[value] || value;
            break;
          default:
            value = value || '';
        }

        exportItem[fieldConfig.label] = value;
      });

      return exportItem;
    });
  };

  const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]?.toString() || '';
          // Escapar comillas y envolver en comillas si contiene comas
          return value.includes(',') || value.includes('"') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    if (exportFields.length === 0) {
      toast.error('Selecciona al menos un campo para exportar');
      return;
    }

    setExporting(true);
    try {
      const formattedData = formatDataForExport();
      
      if (formattedData.length === 0) {
        toast.error('No hay datos que coincidan con los filtros seleccionados');
        return;
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${type}_${timestamp}.${exportFormat}`;

      if (exportFormat === 'csv') {
        downloadCSV(formattedData, filename);
      } else if (exportFormat === 'json') {
        downloadJSON(formattedData, filename);
      }

      toast.success(`Datos exportados exitosamente (${formattedData.length} registros)`);
      onClose();
      
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Error al exportar los datos');
    } finally {
      setExporting(false);
    }
  };

  const toggleField = (fieldKey) => {
    setExportFields(prev => 
      prev.includes(fieldKey)
        ? prev.filter(f => f !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const selectAllFields = () => {
    setExportFields(fieldsConfig.map(f => f.key));
  };

  const selectDefaultFields = () => {
    setExportFields(fieldsConfig.filter(f => f.default).map(f => f.key));
  };

  const clearAllFields = () => {
    setExportFields([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Download className="text-blue-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Exportar {title}</h2>
                <p className="text-gray-600">
                  {data?.length || 0} registros disponibles para exportar
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={exporting}
            >
              <X size={24} />
            </button>
          </div>

          {/* Formato de exportación */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Formato de Exportación
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat('csv')}
                className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center space-x-3 ${
                  exportFormat === 'csv'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
                disabled={exporting}
              >
                <Table size={20} />
                <div className="text-left">
                  <div className="font-medium">CSV</div>
                  <div className="text-xs">Para Excel y hojas de cálculo</div>
                </div>
              </button>

              <button
                onClick={() => setExportFormat('json')}
                className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center space-x-3 ${
                  exportFormat === 'json'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
                disabled={exporting}
              >
                <FileText size={20} />
                <div className="text-left">
                  <div className="font-medium">JSON</div>
                  <div className="text-xs">Para desarrolladores</div>
                </div>
              </button>
            </div>
          </div>

          {/* Selección de campos */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Campos a Exportar ({exportFields.length} seleccionados)
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={selectAllFields}
                  className="text-xs text-blue-600 hover:text-blue-700"
                  disabled={exporting}
                >
                  Todos
                </button>
                <button
                  onClick={selectDefaultFields}
                  className="text-xs text-blue-600 hover:text-blue-700"
                  disabled={exporting}
                >
                  Por defecto
                </button>
                <button
                  onClick={clearAllFields}
                  className="text-xs text-red-600 hover:text-red-700"
                  disabled={exporting}
                >
                  Ninguno
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {fieldsConfig.map((field) => (
                <label
                  key={field.key}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={exportFields.includes(field.key)}
                    onChange={() => toggleField(field.key)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={exporting}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{field.label}</div>
                    {field.default && (
                      <div className="text-xs text-blue-600">Recomendado</div>
                    )}
                  </div>
                  {exportFields.includes(field.key) && (
                    <Check className="text-green-600" size={16} />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Filtro de fechas (opcional) */}
          {type === 'reservations' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Filtro por Fechas (Opcional)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Desde</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={exporting}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={exporting}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button 
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={exporting}
            >
              Cancelar
            </button>
            <button 
              onClick={handleExport}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={exporting || exportFields.length === 0}
            >
              <Download size={16} />
              <span>
                {exporting ? 'Exportando...' : `Exportar ${exportFormat.toUpperCase()}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExporter;