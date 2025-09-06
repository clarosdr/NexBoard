import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const PasswordsTable = () => {
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPasswords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('passwords')
      .select('*')
      .order('servicio', { ascending: true });

    if (error) {
      console.error('❌ Error al cargar contraseñas:', error);
      setPasswords([]);
    } else {
      setPasswords(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPasswords();
  }, []);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">🔐 Contraseñas Guardadas</h2>
        <button
          onClick={fetchPasswords}
          className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          🔄 Recargar
        </button>
      </div>

      {loading ? (
        <p>Cargando contraseñas...</p>
      ) : passwords.length === 0 ? (
        <p>No hay contraseñas registradas.</p>
      ) : (
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left">Servicio</th>
              <th className="px-4 py-2 text-left">Usuario</th>
              <th className="px-4 py-2 text-left">Clave</th>
            </tr>
          </thead>
          <tbody>
            {passwords.map(pass => (
              <tr key={pass.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="px-4 py-2">{pass.servicio}</td>
                <td className="px-4 py-2">{pass.usuario}</td>
                <td className="px-4 py-2">{pass.clave}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PasswordsTable;
