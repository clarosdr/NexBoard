import React, { useState } from 'react';
import { supabaseService } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import Button from './ui/Button';

const ServerCredentialsForm = ({ onSaved, onCancel }) => {
  const [company_name, setCompanyName] = useState('');
  const [server_name, setServerName] = useState('');
  const [vpn_ip, setVpnIp] = useState('');
  const [vpn_password, setVpnPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setIsLoading(true);

    if (!company_name || !server_name || !vpn_ip || !vpn_password) {
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
        await supabaseService.createServerCredential({ company_name, server_name, vpn_ip, vpn_password }, user.id);
        setMensaje('✅ Servidor guardado correctamente.');
        setCompanyName('');
        setServerName('');
        setVpnIp('');
        setVpnPassword('');
        if (onSaved) onSaved();
    } catch (error) {
        console.error('❌ Error al guardar servidor:', error);
        setMensaje(`❌ Error al guardar: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-white dark:bg-gray-800 rounded shadow">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre de la Empresa</label>
          <input
            type="text"
            value={company_name}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nombre del Servidor</label>
          <input
            type="text"
            value={server_name}
            onChange={(e) => setServerName(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">IP de la VPN</label>
          <input
            type="text"
            value={vpn_ip}
            onChange={(e) => setVpnIp(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Clave de la VPN</label>
          <input
            type="text"
            value={vpn_password}
            onChange={(e) => setVpnPassword(e.target.value)}
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
          Guardar Servidor
        </Button>
      </div>
    </form>
  );
};

export default ServerCredentialsForm;