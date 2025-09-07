import React from 'react';
import { BarChart3, DollarSign, FileText, TrendingUp, Building } from 'lucide-react';

const OverviewReport = ({ data }) => {
  if (!data) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No hay datos disponibles para el resumen</p>
      </div>
    );
  }

  const profitMargin = data.totalRevenue > 0 
    ? ((data.netProfit / data.totalRevenue) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-900">
                S/. {data.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Gastos Totales</p>
              <p className="text-2xl font-bold text-gray-900">
                S/. {data.totalExpenses.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Ganancia Neta</p>
              <p className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                S/. {data.netProfit.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Ocupación Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.averageOccupancy}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas adicionales */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Análisis Financiero</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{profitMargin}%</p>
            <p className="text-sm text-gray-600">Margen de Ganancia</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {data.totalRevenue > 0 ? ((data.totalExpenses / data.totalRevenue) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-gray-600">Ratio de Gastos</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              S/. {data.totalRevenue > 0 ? (data.totalRevenue / 30).toFixed(0) : 0}
            </p>
            <p className="text-sm text-gray-600">Ingreso Promedio Diario</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewReport;