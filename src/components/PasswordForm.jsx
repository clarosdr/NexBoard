import React, { useState } from 'react';
import { supabaseService } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import Button from './ui/Button';

const PasswordForm = ({ onSaved, onCancel }) => {
  const [site_app, setSiteApp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('otros');
  const [mensaje, setMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setIsLoading(true);

    if (!site_app || !username || !password) {
      setMensaje('⚠️ Servicio, Usuario y Clave son obligatorios.');
      setIsLoading(false);
      return;
    }
    
    if (!user) {
        setMensaje('❌ Error: Usuario no autenticado.');
        setIsLoading(false);
        return;
    }

    try {
        await supabaseService.createPassword({ site_app, username, password, category }, user.id);
        setMensaje('✅ Contraseña guardada correctamente.');
        setSiteApp('');
        setUsername('');
        setPassword('');
        setCategory('otros');
        if (onSaved) onSaved();
    } catch(error) {
        console.error('❌ Error al guardar contraseña:', error);
        setMensaje(`❌ Error al guardar: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-white dark:bg-gray-800 rounded shadow">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Servicio / App</label>
          <input
            type="text"
            value={site_app}
            onChange={(e) => setSiteApp(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Usuario</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Clave</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Categoría</label>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900"
          >
            <option value="personal">Personal</option>
            <option value="bancos">Bancos</option>
            <option value="principal">Principal</option>
            <option value="entretenimiento">Entretenimiento</option>
            <option value="otros">Otros</option>
          </select>
        </div>
      </div>
      
      {mensaje && <p className="mt-3 text-sm">{mensaje}</p>}

      <div className="flex justify-end space-x-3 pt-3 border-t dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" loading={isLoading} disabled={isLoading}>
          Guardar Contraseña
        </Button>
      </div>
    </form>
  );
};

export default PasswordForm;