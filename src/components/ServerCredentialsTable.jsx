import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const ServerCredentialsTable = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchServers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('servers')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('❌ Error al cargar servidores:', error);
      setServers([]);
    } else {
      setServers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServers();
  }, []);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">🖥️ Servidores Registrados</h2>
        <button
          onClick={fetchServers}
          className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          🔄 Recargar
        </button>
      </div>

      {loading ? (
        <p>Cargando servidores...</p>
      ) : servers.length === 0 ? (
        <p>No hay servidores registrados.</p>
      ) : (
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">IP</th>
              <th className="px-4 py-2 text-left">Usuario</th>
              <th className="px-4 py-2 text-left">Clave</th>
            </tr>
          </thead>
          <tbody>
            {servers.map(server => (
              <tr key={server.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="px-4 py-2">{server.nombre}</td>
                <td className="px-4 py-2">{server.ip}</td>
                <td className="px-4 py-2">{server.usuario}</td>
                <td className="px-4 py-2">{server.clave}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ServerCredentialsTable;
