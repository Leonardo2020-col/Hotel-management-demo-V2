// src/components/admin/report/DailyReport.jsx
import React from 'react';
import { Calendar } from 'lucide-react';

const DailyReport = ({ data }) => {
  console.log('DailyReport received data:', data);
  console.log('Is array?', Array.isArray(data));
  
  // Convertir a array de forma segura
  let reports = [];
  
  if (data) {
    if (Array.isArray(data)) {
      reports = data;
    } else if (typeof data === 'object') {
      // Si es objeto, intentar extraer array
      reports = data.data || [];
    }
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">No hay reportes diarios disponibles</p>
        <p className="text-sm text-gray-500">
          Ejecuta el script SQL para generar datos de prueba
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-ins</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-outs</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingresos</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gastos</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ocupación</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {reports.map((report, index) => (
            <tr key={report.id || index}>
              <td className="px-6 py-4 text-sm">{new Date(report.report_date).toLocaleDateString('es-PE')}</td>
              <td className="px-6 py-4 text-sm">{report.total_checkins || 0}</td>
              <td className="px-6 py-4 text-sm">{report.total_checkouts || 0}</td>
              <td className="px-6 py-4 text-sm text-green-600">S/. {(report.total_revenue || 0).toFixed(2)}</td>
              <td className="px-6 py-4 text-sm text-red-600">S/. {(report.total_expenses || 0).toFixed(2)}</td>
              <td className="px-6 py-4 text-sm">{(report.occupancy_rate || 0).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DailyReport;