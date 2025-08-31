import React, { useState, useEffect } from 'react';
import PasswordForm from './PasswordForm';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../lib/supabase';

const PasswordsTable = () => {
  const [passwords, setPasswords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPassword, setEditingPassword] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState(new Set());
  const { user } = useAuth();

  // Cargar contraseñas desde Supabase al montar el componente
  useEffect(() => {
    const loadPasswords = async () => {
      if (user) {
        try {
          const passwordsData = await supabaseService.getPasswords(user.id);
          setPasswords(passwordsData);
        } catch (error) {
          console.error('Error loading passwords from Supabase:', error);
        }
      }
    };
    loadPasswords();
  }, [user]);

  const handleAddPassword = () => {
    setEditingPassword(null);
    setShowForm(true);
  };

  const handleEditPassword = (password) => {
    setEditingPassword(password);
    setShowForm(true);
  };

  const handleDeletePassword = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta contraseña?')) {
      try {
        await supabaseService.deletePassword(id, user.id);
        setPasswords(passwords.filter(p => p.id !== id));
      } catch (error) {
        console.error('Error deleting password:', error);
        alert('Error al eliminar la contraseña');
      }
    }
  };

  const handleFormSubmit = async (passwordData) => {
    try {
      if (editingPassword) {
        // Actualizar contraseña existente
        const updatedPassword = await supabaseService.updatePassword(editingPassword.id, passwordData, user.id);
        setPasswords(passwords.map(p => 
          p.id === editingPassword.id ? updatedPassword : p
        ));
      } else {
        // Agregar nueva contraseña
        const newPassword = await supabaseService.createPassword(passwordData, user.id);
        setPasswords([...passwords, newPassword]);
      }
      setShowForm(false);
      setEditingPassword(null);
    } catch (error) {
      console.error('Error saving password:', error);
      alert('Error al guardar la contraseña');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingPassword(null);
  };

  const togglePasswordVisibility = (id) => {
    const newVisiblePasswords = new Set(visiblePasswords);
    if (newVisiblePasswords.has(id)) {
      newVisiblePasswords.delete(id);
    } else {
      newVisiblePasswords.add(id);
    }
    setVisiblePasswords(newVisiblePasswords);
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${type} copiado al portapapeles`);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  // Filtrar contraseñas por término de búsqueda
  const filteredPasswords = passwords.filter(password =>
    password.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
    password.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showForm) {
    return (
      <PasswordForm
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        editingPassword={editingPassword}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Gestor de Contraseñas</h1>
          <p className="text-gray-700 dark:text-gray-300 mt-1 transition-colors duration-200">
            Total: {passwords.length} contraseña{passwords.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleAddPassword}
          className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
        >
          + Nueva Contraseña
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 transition-colors duration-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por sitio web o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
            🔍
          </div>
        </div>
      </div>

      {/* Tabla de contraseñas */}
      {filteredPasswords.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border dark:border-gray-700 text-center transition-colors duration-200">
          <div className="text-gray-500 dark:text-gray-400 text-6xl mb-4">🔐</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-200">
            {passwords.length === 0 ? 'No hay contraseñas guardadas' : 'No se encontraron resultados'}
          </h3>
          <p className="text-gray-700 dark:text-gray-300 transition-colors duration-200">
            {passwords.length === 0 
              ? 'Comienza agregando tu primera contraseña'
              : 'Intenta con otros términos de búsqueda'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden transition-colors duration-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 transition-colors duration-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Sitio Web
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Contraseña
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Última Actualización
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">
                {filteredPasswords.map((password) => (
                  <tr key={password.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
                          {password.website}
                        </div>
                        <button
                          onClick={() => copyToClipboard(password.website, 'Sitio web')}
                          className="ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
                          title="Copiar sitio web"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900 dark:text-white transition-colors duration-200">
                          {password.username}
                        </div>
                        <button
                          onClick={() => copyToClipboard(password.username, 'Usuario')}
                          className="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                          title="Copiar usuario"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900 dark:text-white font-mono transition-colors duration-200">
                          {visiblePasswords.has(password.id) 
                            ? password.password 
                            : '••••••••'
                          }
                        </div>
                        <button
                          onClick={() => togglePasswordVisibility(password.id)}
                          className="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                          title={visiblePasswords.has(password.id) ? 'Ocultar' : 'Mostrar'}
                          aria-label={visiblePasswords.has(password.id) ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                          <span aria-hidden="true">{visiblePasswords.has(password.id) ? '👁️' : '👁️‍🗨️'}</span>
                        </button>
                        <button
                          onClick={() => copyToClipboard(password.password, 'Contraseña')}
                          className="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                          title="Copiar contraseña"
                          aria-label="Copiar contraseña al portapapeles"
                        >
                          <span aria-hidden="true">📋</span>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 transition-colors duration-200">
                      {new Date(password.updated_at).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditPassword(password)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3 transition-colors duration-200"
                        title="Editar"
                        aria-label="Editar contraseña"
                      >
                        <span aria-hidden="true">✏️</span>
                      </button>
                      <button
                        onClick={() => handleDeletePassword(password.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors duration-200"
                        title="Eliminar"
                        aria-label="Eliminar contraseña"
                      >
                        <span aria-hidden="true">🗑️</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordsTable;