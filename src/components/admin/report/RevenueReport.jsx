import React from 'react';
import { DollarSign } from 'lucide-react';

const RevenueReport = ({ data }) => {
  if (!data) {
    return (
      <div className="text-center py-8">
        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No hay datos de ingresos disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Desglose de Ingresos</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Ingresos por Habitaciones:</span>
              <span className="font-medium">S/. {(data.room_revenue || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ingresos por Servicios:</span>
              <span className="font-medium">S/. {(data.service_revenue || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-gray-900 font-medium">Total Ingresos:</span>
              <span className="font-bold text-green-600">S/. {(data.total_revenue || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Análisis de Rentabilidad</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Gastos:</span>
              <span className="font-medium">S/. {(data.total_expenses || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ganancia Bruta:</span>
              <span className="font-medium">S/. {(data.net_profit || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-gray-900 font-medium">Margen de Ganancia:</span>
              <span className={`font-bold ${(data.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.total_revenue > 0 ? (((data.net_profit || 0) / data.total_revenue) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueReport;