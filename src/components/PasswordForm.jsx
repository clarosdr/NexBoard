import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const PasswordForm = ({ onSaved }) => {
  const [servicio, setServicio] = useState('');
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');

    if (!servicio || !usuario || !clave) {
      setMensaje('⚠️ Todos los campos son obligatorios.');
      return;
    }

    const { error } = await supabase
      .from('passwords')
      .insert([{ servicio, usuario, clave }]);

    if (error) {
      console.error('❌ Error al guardar contraseña:', error);
      setMensaje('❌ Error al guardar. Revisa la consola.');
    } else {
      setMensaje('✅ Contraseña guardada correctamente.');
      setServicio('');
      setUsuario('');
      setClave('');
      if (onSaved) onSaved();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-gray-800 rounded shadow">
      <h2 className="text-lg font-bold mb-2">🔒 Registrar Contraseña</h2>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Servicio</label>
        <input
          type="text"
          value={servicio}
          onChange={(e) => setServicio(e.target.value)}
          className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900"
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Usuario</label>
        <input
          type="text"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900"
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Clave</label>
        <input
          type="text"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900"
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Guardar
      </button>

      {mensaje && <p className="mt-3 text-sm">{mensaje}</p>}
    </form>
  );
};

export default PasswordForm;
