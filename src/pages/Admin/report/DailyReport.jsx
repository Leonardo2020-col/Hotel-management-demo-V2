// src/components/admin/report/DailyReport.jsx
import React from 'react';
import { Calendar } from 'lucide-react';

export default function DailyReport({ data }) {
  // Validación defensiva total
  if (!data) {
    return <EmptyState message="No se proporcionaron datos" />;
  }

  // Normalizar a array
  let reportsList = [];
  if (Array.isArray(data)) {
    reportsList = data;
  } else if (data.data && Array.isArray(data.data)) {
    reportsList = data.data;
  }

  if (reportsList.length === 0) {
    return <EmptyState message="No hay reportes para el período seleccionado" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Check-ins
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Check-outs
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ingresos
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Gastos
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ocupación
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reportsList.map((report, index) => (
            <ReportRow key={report.id || index} report={report} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportRow({ report }) {
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDate(report.report_date)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {report.total_checkins || 0}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {report.total_checkouts || 0}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
        S/. {Number(report.total_revenue || 0).toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
        S/. {Number(report.total_expenses || 0).toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {Number(report.occupancy_rate || 0).toFixed(1)}%
      </td>
    </tr>
  );
}

function EmptyState({ message }) {
  return (
    <div className="text-center py-12">
      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('es-PE');
  } catch {
    return dateString;
  }
}