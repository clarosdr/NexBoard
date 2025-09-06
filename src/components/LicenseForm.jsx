import React, { useState } from 'react';
import { supabaseService } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import Button from './ui/Button';

const LicenseForm = ({ onSaved, onCancel }) => {
  const [client_name, setClientName] = useState('');
  const [license_name, setLicenseName] = useState('');
  const [serial, setSerial] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setIsLoading(true);

    if (!client_name || !license_name || !serial) {
      setMensaje('⚠️ Todos los campos son obligatorios.');
      setIsLoading(false);
      return;
    }

    if (!user) {
      setMensaje('❌ Error: Usuario no autenticado.');
      setIsLoading(false);
      return;
    }

    try {
      await supabaseService.createLicense({ client_name, license_name, serial }, user.id);
      setMensaje('✅ Licencia guardada correctamente.');
      setClientName('');
      setLicenseName('');
      setSerial('');
      if (onSaved) onSaved();
    } catch (error) {
      console.error('❌ Error al guardar licencia:', error);
      setMensaje(`❌ Error al guardar: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-white dark:bg-gray-800 rounded shadow">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre del Cliente</label>
          <input
            type="text"
            value={client_name}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nombre de la Licencia</label>
          <input
            type="text"
            value={license_name}
            onChange={(e) => setLicenseName(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Serial / Clave</label>
          <input
            type="text"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900"
            required
          />
        </div>
      </div>

      {mensaje && <p className="mt-3 text-sm">{mensaje}</p>}
      
      <div className="flex justify-end space-x-3 pt-3 border-t dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" loading={isLoading} disabled={isLoading}>
          Guardar Licencia
        </Button>
      </div>
    </form>
  );
};

export default LicenseForm;