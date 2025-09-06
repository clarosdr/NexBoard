import React from 'react';
import { useExpenses } from '../hooks/useExpenses';

const formatCurrency = (value) => {
  const parsed = typeof value === 'number' ? value : parseInt(value) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parsed);
};

const BudgetExpensesTable = () => {
  const { budgetExpenses, loading, refetch } = useExpenses();

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">📊 Gastos Presupuestados</h2>
        <button
          onClick={refetch}
          className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          🔄 Recargar
        </button>
      </div>

      {loading ? (
        <p>Cargando gastos...</p>
      ) : budgetExpenses.length === 0 ? (
        <p>No hay gastos presupuestados registrados.</p>
      ) : (
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left">Fecha</th>
              <th className="px-4 py-2 text-left">Categoría</th>
              <th className="px-4 py-2 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {budgetExpenses.map(exp => (
              <tr key={exp.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="px-4 py-2">{exp.fecha}</td>
                <td className="px-4 py-2">{exp.categoria}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(exp.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BudgetExpensesTable;
