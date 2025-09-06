import { useReports } from '../hooks/useReports';

const MonthlyReportsTable = () => {
  const { reports, loading, fetchReports } = useReports();

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">📅 Reportes Mensuales</h2>
        <button
          onClick={fetchReports}
          className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          🔄 Recargar
        </button>
      </div>

      {loading ? (
        <p>Cargando reportes...</p>
      ) : reports.length === 0 ? (
        <p>No hay reportes mensuales registrados.</p>
      ) : (
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
      )}
    </div>
  );
};

export default MonthlyReportsTable;
