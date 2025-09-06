import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const LicensesTable = () => {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLicenses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('❌ Error al cargar licencias:', error);
      setLicenses([]);
    } else {
      setLicenses(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">🔑 Licencias Registradas</h2>
        <button
          onClick={fetchLicenses}
          className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          🔄 Recargar
        </button>
      </div>

      {loading ? (
        <p>Cargando licencias...</p>
      ) : licenses.length === 0 ? (
        <p>No hay licencias registradas.</p>
      ) : (
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Clave</th>
            </tr>
          </thead>
          <tbody>
            {licenses.map(lic => (
              <tr key={lic.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="px-4 py-2">{lic.nombre}</td>
                <td className="px-4 py-2">{lic.clave}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LicensesTable;
