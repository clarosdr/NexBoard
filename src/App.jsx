import React, { useState } from 'react';
import MonthlyReportForm from './components/MonthlyReportForm';
import MonthlyReportsTable from './components/MonthlyReportsTable';
import MonthlyReportsChart from './components/MonthlyReportsChart';
import { useMonthlyReports } from './hooks/useMonthlyReports';
import { exportToExcel } from './utils/exportToExcel';

const App = () => {
  const [activeTab, setActiveTab] = useState('tabla');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { reports, loading, refetch } = useMonthlyReports({ year: selectedYear });

  const handleExport = () => {
    exportToExcel(reports, `Reportes_${selectedYear}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">📊 Panel de Reportes Mensuales</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Gestión financiera por año</p>
      </header>

      {/* Filtros */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <label htmlFor="year" className="font-medium">Año:</label>
          <select
            id="year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-2 py-1 rounded border dark:bg-gray-800"
          >
            {[2023, 2024, 2025].map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          📥 Exportar a Excel
        </button>
      </div>

      {/* Navegación por pestañas */}
      <nav className="flex space-x-4 mb-4">
        <button
          onClick={() => setActiveTab('tabla')}
          className={`px-4 py-2 rounded ${activeTab === 'tabla' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          📋 Tabla
        </button>
        <button
          onClick={() => setActiveTab('formulario')}
          className={`px-4 py-2 rounded ${activeTab === 'formulario' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          📝 Formulario
        </button>
        <button
          onClick={() => setActiveTab('graficos')}
          className={`px-4 py-2 rounded ${activeTab === 'graficos' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          📈 Gráficos
        </button>
      </nav>

      {/* Contenido dinámico */}
      <section className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        {loading ? (
          <p className="text-center text-gray-500">⏳ Cargando reportes...</p>
        ) : activeTab === 'tabla' ? (
          <MonthlyReportsTable reports={reports} />
        ) : activeTab === 'formulario' ? (
          <MonthlyReportForm onSaved={refetch} />
        ) : (
          <MonthlyReportsChart data={reports} />
        )}
      </section>
    </div>
  );
};

export default App;
