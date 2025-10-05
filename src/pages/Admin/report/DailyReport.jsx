import React from 'react';
import { Calendar } from 'lucide-react';

const DailyReport = ({ data }) => {
  // Forzar conversión a array
  const reports = data && Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p>No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th className="px-4 py-2">Fecha</th>
          <th className="px-4 py-2">Check-ins</th>
          <th className="px-4 py-2">Check-outs</th>
        </tr>
      </thead>
      <tbody>
        {reports.map((r, i) => (
          <tr key={i}>
            <td className="px-4 py-2">{r.report_date}</td>
            <td className="px-4 py-2">{r.total_checkins}</td>
            <td className="px-4 py-2">{r.total_checkouts}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DailyReport;