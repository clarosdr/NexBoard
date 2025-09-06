import React, { useEffect, useState } from 'react';
import { supabaseService } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const PasswordsTable = () => {
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPasswords = async () => {
    if (!user) return;
    setLoading(true);
    try {
        const data = await supabaseService.getPasswords(user.id);
        setPasswords(data || []);
    } catch(error) {
        console.error('❌ Error al cargar contraseñas:', error);
        setPasswords([]);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasswords();
  }, [user]);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">🔐 Contraseñas Guardadas</h2>
        <button
          onClick={fetchPasswords}
          className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          disabled={loading}
        >
          {loading ? 'Cargando...' : '🔄 Recargar'}
        </button>
      </div>

      {loading ? (
        <p>Cargando contraseñas...</p>
      ) : passwords.length === 0 ? (
        <p>No hay contraseñas registradas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left">Servicio/App</th>
                <th className="px-4 py-2 text-left">Usuario</th>
                <th className="px-4 py-2 text-left">Clave</th>
                <th className="px-4 py-2 text-left">Categoría</th>
              </tr>
            </thead>
            <tbody>
              {passwords.map(pass => (
                <tr key={pass.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-4 py-2">{pass.site_app}</td>
                  <td className="px-4 py-2">{pass.username}</td>
                  <td className="px-4 py-2">{pass.password}</td>
                  <td className="px-4 py-2 capitalize">{pass.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PasswordsTable;