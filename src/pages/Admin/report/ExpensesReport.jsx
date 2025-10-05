// src/components/admin/report/ExpensesReport.jsx - CORREGIDO
import React from 'react';
import { FileText } from 'lucide-react';

const ExpensesReport = ({ data }) => {
  // ✅ VALIDACIÓN Y CONVERSIÓN A ARRAY
  const expenses = Array.isArray(data) ? data : [];

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No hay datos de gastos disponibles</p>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Gastos Detallados</h3>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total de Gastos</p>
            <p className="text-2xl font-bold text-red-600">
              S/. {totalExpenses.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Monto
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.slice(0, 20).map((expense, index) => (
                <tr key={expense.id || index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(expense.expense_date).toLocaleDateString('es-PE')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {expense.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.expense_categories?.name || 'Sin categoría'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    S/. {(expense.amount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {expenses.length > 20 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Mostrando 20 de {expenses.length} gastos. Exporta el reporte para ver todos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpensesReport;