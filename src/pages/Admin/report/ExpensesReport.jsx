// src/components/admin/report/ExpensesReport.jsx
import React from 'react';
import { FileText } from 'lucide-react';

const ExpensesReport = ({ data }) => {
  console.log('ExpensesReport received data:', data);
  
  // Convertir a array de forma segura
  let expenses = [];
  
  if (data) {
    if (Array.isArray(data)) {
      expenses = data;
    } else if (typeof data === 'object') {
      expenses = data.data || [];
    }
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No hay gastos registrados</p>
        <p className="text-sm text-gray-500 mt-2">
          Ejecuta el script SQL para generar datos de prueba
        </p>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Gastos Detallados</h3>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-red-600">
            S/. {totalExpenses.toFixed(2)}
          </p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {expenses.slice(0, 20).map((expense, index) => (
              <tr key={expense.id || index}>
                <td className="px-6 py-4 text-sm">{new Date(expense.expense_date).toLocaleDateString('es-PE')}</td>
                <td className="px-6 py-4 text-sm">{expense.description}</td>
                <td className="px-6 py-4 text-sm">{expense.expense_categories?.name || 'Sin categoría'}</td>
                <td className="px-6 py-4 text-sm text-right text-red-600">S/. {(expense.amount || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpensesReport;