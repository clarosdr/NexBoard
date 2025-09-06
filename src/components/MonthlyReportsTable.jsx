import { exportToExcel } from '../utils/exportToExcel';

...

<div className="flex justify-between items-center mb-4">
  <h2 className="text-xl font-bold">📅 Reportes Mensuales</h2>
  <div className="flex gap-2">
    <button
      onClick={fetchReports}
      className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
    >
      🔄 Recargar
    </button>
    <button
      onClick={() => exportToExcel(reports)}
      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
    >
      📤 Exportar
    </button>
  </div>
</div>
