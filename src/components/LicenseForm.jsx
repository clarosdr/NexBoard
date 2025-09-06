import React, { useState } from 'react';
import { supabaseService } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const LicenseForm = ({ onSaved }) => {
  const [nombre, setNombre] = useState('');
  const [clave, setClave] = useState('');
  const [mensaje, setMensaje] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');

    if (!nombre || !clave) {
      setMensaje('⚠️ Todos los campos son obligatorios.');
      return;
    }

    if (!user) {
        setMensaje('❌ Error: Usuario no autenticado.');
        return;
    }

    try {
      await supabaseService.createLicense({ nombre, clave }, user.id);
      setMensaje('✅ Licencia guardada correctamente.');
      setNombre('');
      setClave('');
      if (onSaved) onSaved();
    } catch (error) {
      console.error('❌ Error al guardar licencia:', error);
      setMensaje('❌ Error al guardar. Revisa la consola.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-gray-800 rounded shadow">
      <h2 className="text-lg font-bold mb-2">🔐 Registrar Licencia</h2>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
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

export default LicenseForm;