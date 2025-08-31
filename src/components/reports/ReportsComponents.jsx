import React from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, Home, 
  Users, Calendar, AlertCircle, Download,
  PieChart, Activity, FileText, CheckCircle,
  XCircle, Clock, Wrench
} from 'lucide-react';

// ===================================================
// COMPONENTE: Stats Card para métricas rápidas
// ===================================================
export const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'blue',
  trend = null,
  onClick = null 
}) => {
  const colorClasses = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      accent: 'bg-blue-100',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: {
      bg: 'from-green-500 to-green-600',
      accent: 'bg-green-100',
      text: 'text-green-600',
      border: 'border-green-200'
    },
    red: {
      bg: 'from-red-500 to-red-600',
      accent: 'bg-red-100',
      text: 'text-red-600',
      border: 'border-red-200'
    },
    orange: {
      bg: 'from-orange-500 to-orange-600',
      accent: 'bg-orange-100',
      text: 'text-orange-600',
      border: 'border-orange-200'
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      accent: 'bg-purple-100',
      text: 'text-purple-600',
      border: 'border-purple-200'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div 
      className={`group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-slate-500 font-medium text-sm mb-2">{title}</p>
          <p className={`text-3xl font-bold ${colors.text} mb-1`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-slate-600">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2 gap-1">
              <div className={`flex items-center text-xs px-2 py-1 rounded-full ${
                trend.direction === 'up' 
                  ? 'bg-green-100 text-green-700' 
                  : trend.direction === 'down' 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-slate-100 text-slate-700'
              }`}>
                <TrendingUp className={`w-3 h-3 mr-1 ${
                  trend.direction === 'down' ? 'rotate-180' : ''
                }`} />
                {trend.value}
              </div>
              <span className="text-xs text-slate-500">{trend.period}</span>
            </div>
          )}
        </div>
        
        <div className={`p-4 ${colors.accent} rounded-2xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
          <Icon className={`w-8 h-8 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
};

// ===================================================
// COMPONENTE: Gráfico de barras simple (sin dependencias externas)
// ===================================================
export const SimpleBarChart = ({ data, title, valueKey = 'value', labelKey = 'label', color = 'blue' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500">No hay datos disponibles</p>
          </div>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item[valueKey]));
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">{title}</h3>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="w-24 text-sm text-slate-600 text-right">
              {item[labelKey]}
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ease-out ${colorClasses[color]}`}
                  style={{ 
                    width: `${(item[valueKey] / maxValue) * 100}%`,
                    minWidth: item[valueKey] > 0 ? '2px' : '0'
                  }}
                />
              </div>
              <div className="w-16 text-sm font-medium text-slate-700 text-right">
                {typeof item[valueKey] === 'number' && item[valueKey] % 1 !== 0 
                  ? item[valueKey].toFixed(1) 
                  : item[valueKey]
                }
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===================================================
// COMPONENTE: Tabla de datos responsiva
// ===================================================
export const DataTable = ({ 
  data, 
  columns, 
  title,
  loading = false,
  onExport = null,
  emptyMessage = "No hay datos disponibles",
  emptyIcon: EmptyIcon = FileText
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-slate-600">Cargando datos...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          )}
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <EmptyIcon className="w-12 h-12 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500">{emptyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">
            {data.length} registro{data.length !== 1 ? 's' : ''}
          </span>
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors ml-4"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column, index) => (
                <th key={index} className="text-left py-4 px-6 font-semibold text-slate-700">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="py-3 px-6">
                    {column.render ? column.render(row[column.key], row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ===================================================
// COMPONENTE: Estado de habitación visual
// ===================================================
export const RoomStatusIndicator = ({ status, count, onClick }) => {
  const statusConfig = {
    disponible: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100',
      border: 'border-green-200',
      label: 'Disponibles'
    },
    ocupada: {
      icon: Users,
      color: 'text-red-600',
      bg: 'bg-red-100',
      border: 'border-red-200',
      label: 'Ocupadas'
    },
    limpieza: {
      icon: Activity,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      border: 'border-orange-200',
      label: 'En Limpieza'
    },
    mantenimiento: {
      icon: Wrench,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      border: 'border-purple-200',
      label: 'Mantenimiento'
    },
    fuera_servicio: {
      icon: XCircle,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
      border: 'border-slate-200',
      label: 'Fuera de Servicio'
    }
  };

  const config = statusConfig[status] || statusConfig.disponible;
  const Icon = config.icon;

  return (
    <div 
      className={`${config.bg} ${config.border} border rounded-xl p-4 ${
        onClick ? 'cursor-pointer hover:shadow-md transition-all duration-200' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">{config.label}</p>
          <p className={`text-2xl font-bold ${config.color} mt-1`}>{count}</p>
        </div>
        <Icon className={`w-6 h-6 ${config.color}`} />
      </div>
    </div>
  );
};

// ===================================================
// COMPONENTE: Resumen financiero
// ===================================================
export const FinancialSummary = ({ 
  totalRevenue, 
  totalExpenses, 
  netProfit, 
  currency = 'PEN',
  period = 'período seleccionado' 
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  };

  const profitColor = (netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600';
  const profitBg = (netProfit || 0) >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Ingresos Totales */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-800 mb-2">Ingresos Totales</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-xs text-blue-700 mt-1">{period}</p>
          </div>
          <div className="p-3 bg-blue-200 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Gastos Totales */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-800 mb-2">Gastos Totales</p>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalExpenses)}
            </p>
            <p className="text-xs text-orange-700 mt-1">{period}</p>
          </div>
          <div className="p-3 bg-orange-200 rounded-lg">
            <DollarSign className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Ganancia Neta */}
      <div className={`${profitBg} border rounded-xl p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Ganancia Neta</p>
            <p className={`text-2xl font-bold ${profitColor}`}>
              {formatCurrency(netProfit)}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {((netProfit || 0) / (totalRevenue || 1) * 100).toFixed(1)}% margen
            </p>
          </div>
          <div className={`p-3 rounded-lg ${
            (netProfit || 0) >= 0 ? 'bg-green-200' : 'bg-red-200'
          }`}>
            <TrendingUp className={`w-6 h-6 ${profitColor} ${
              (netProfit || 0) < 0 ? 'rotate-180' : ''
            }`} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ===================================================
// COMPONENTE: Filtros de fechas
// ===================================================
export const DateRangeFilter = ({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange,
  onQuickRange,
  loading = false 
}) => {
  const quickRanges = [
    { label: 'Hoy', days: 0 },
    { label: 'Ayer', days: 1 },
    { label: '7 días', days: 7 },
    { label: '30 días', days: 30 },
    { label: '90 días', days: 90 }
  ];

  const handleQuickRange = (days) => {
    const today = new Date();
    let start, end;

    if (days === 0) {
      // Hoy
      start = end = today.toISOString().split('T')[0];
    } else if (days === 1) {
      // Ayer
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      start = end = yesterday.toISOString().split('T')[0];
    } else {
      // Últimos X días
      end = today.toISOString().split('T')[0];
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - days);
      start = startDate.toISOString().split('T')[0];
    }

    onStartDateChange(start);
    onEndDateChange(end);
    
    if (onQuickRange) {
      onQuickRange(start, end);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-500" />
          <span className="text-slate-700 font-medium">Período:</span>
        </div>

        {/* Rangos rápidos */}
        <div className="flex flex-wrap gap-2">
          {quickRanges.map((range) => (
            <button
              key={range.label}
              onClick={() => handleQuickRange(range.days)}
              disabled={loading}
              className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Selector de fechas personalizado */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Desde:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              disabled={loading}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Hasta:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              disabled={loading}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ===================================================
// COMPONENTE: Loading skeleton
// ===================================================
export const ReportSkeleton = ({ type = 'table' }) => {
  if (type === 'stats') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-24 mb-3"></div>
                <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-20"></div>
              </div>
              <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="bg-white rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-32 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-20 h-4 bg-slate-200 rounded"></div>
              <div className="flex-1 h-3 bg-slate-200 rounded"></div>
              <div className="w-12 h-4 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: table skeleton
  return (
    <div className="bg-white rounded-xl animate-pulse">
      <div className="p-6 border-b border-slate-200">
        <div className="h-6 bg-slate-200 rounded w-48"></div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-6 gap-4">
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default {
  StatsCard,
  SimpleBarChart,
  DataTable,
  RoomStatusIndicator,
  FinancialSummary,
  DateRangeFilter,
  ReportSkeleton
};