import React from 'react';

const RevenueReport = ({ revenue, formatCurrency }) => {
  if (!revenue) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay datos de ingresos disponibles
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        Reporte de Ingresos
      </h3>

      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
          <span className="font-medium text-gray-700">Ingresos por Habitaciones</span>
          <span className="text-lg font-bold text-blue-600">
            {formatCurrency(revenue.room_revenue)}
          </span>
        </div>

        <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
          <span className="font-medium text-gray-700">Ingresos por Servicios</span>
          <span className="text-lg font-bold text-green-600">
            {formatCurrency(revenue.service_revenue)}
          </span>
        </div>

        <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
          <span className="font-medium text-gray-700">Total Ingresos</span>
          <span className="text-xl font-bold text-purple-600">
            {formatCurrency(revenue.total_revenue)}
          </span>
        </div>

        <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
          <span className="font-medium text-gray-700">Total Gastos</span>
          <span className="text-lg font-bold text-red-600">
            {formatCurrency(revenue.total_expenses)}
          </span>
        </div>

        <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg border-2 border-yellow-400">
          <span className="font-bold text-gray-900">Ganancia Neta</span>
          <span className="text-2xl font-bold text-yellow-600">
            {formatCurrency(revenue.net_profit)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RevenueReport;
