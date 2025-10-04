import React from 'react';

const DailyReportsTable = ({ reports, formatCurrency, formatPercentage }) => {
  if (!reports || reports.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay reportes diarios disponibles para este período
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">Reportes Diarios</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check-ins
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check-outs
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ocupación
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ingresos
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gastos
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {new Date(report.report_date).toLocaleDateString('es-MX')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                  {report.total_checkins || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                  {report.total_checkouts || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                  {formatPercentage(report.occupancy_rate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                  {formatCurrency(report.total_revenue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                  {formatCurrency(report.total_expenses)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DailyReportsTable;
