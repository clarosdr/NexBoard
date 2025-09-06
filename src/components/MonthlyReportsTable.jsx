import React from 'react';

const formatCurrency = (value) => {
  const parsed = typeof value === 'number' ? value : parseInt(value) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parsed);
};

const MonthlyReportsTable = ({ reports, loading, onRefresh }) => {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">📅 Reportes Mensuales</h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            🔄 Recargar
          </button>
        )}
      </div>

      {loading ? (
        <p>Cargando reportes...</p>
      ) : !reports || reports.length === 0 ? (
        <p>No hay reportes mensuales registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left">Mes</th>
                <th className="px-4 py-2 text-right">Ventas</th>
                <th className="px-4 py-2 text-right">Costos</th>
                <th className="px-4 py-2 text-right">Ganancia</th>
                <th className="px-4 py-2 text-right">Gastos</th>
                <th className="px-4 py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((rep) => (
                <tr key={rep.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-4 py-2">{rep.mes}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(rep.ventas)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(rep.costos)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(rep.ganancia)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(rep.gastos)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(rep.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MonthlyReportsTable;
