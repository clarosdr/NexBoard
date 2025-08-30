import React, { useState, useEffect } from 'react';
import PasswordForm from './PasswordForm';

const PasswordsTable = () => {
  const [passwords, setPasswords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPassword, setEditingPassword] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState(new Set());

  // Cargar contraseñas desde localStorage al montar el componente
  useEffect(() => {
    const savedPasswords = localStorage.getItem('nexboard_passwords');
    if (savedPasswords) {
      setPasswords(JSON.parse(savedPasswords));
    }
  }, []);

  // Guardar contraseñas en localStorage cuando cambie el estado
  useEffect(() => {
    localStorage.setItem('nexboard_passwords', JSON.stringify(passwords));
  }, [passwords]);

  const handleAddPassword = () => {
    setEditingPassword(null);
    setShowForm(true);
  };

  const handleEditPassword = (password) => {
    setEditingPassword(password);
    setShowForm(true);
  };

  const handleDeletePassword = (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta contraseña?')) {
      setPasswords(passwords.filter(p => p.id !== id));
    }
  };

  const handleFormSubmit = (passwordData) => {
    if (editingPassword) {
      // Actualizar contraseña existente
      setPasswords(passwords.map(p => 
        p.id === editingPassword.id ? passwordData : p
      ));
    } else {
      // Agregar nueva contraseña
      setPasswords([...passwords, passwordData]);
    }
    setShowForm(false);
    setEditingPassword(null);
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
          <h1 className="text-3xl font-bold text-gray-900">Gestor de Contraseñas</h1>
          <p className="text-gray-600 mt-1">
            Total: {passwords.length} contraseña{passwords.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleAddPassword}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + Nueva Contraseña
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por sitio web o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
        </div>
      </div>

      {/* Tabla de contraseñas */}
      {filteredPasswords.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <div className="text-gray-400 text-6xl mb-4">🔐</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {passwords.length === 0 ? 'No hay contraseñas guardadas' : 'No se encontraron resultados'}
          </h3>
          <p className="text-gray-600">
            {passwords.length === 0 
              ? 'Comienza agregando tu primera contraseña'
              : 'Intenta con otros términos de búsqueda'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sitio Web
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contraseña
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Actualización
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPasswords.map((password) => (
                  <tr key={password.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {password.website}
                        </div>
                        <button
                          onClick={() => copyToClipboard(password.website, 'Sitio web')}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                          title="Copiar sitio web"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900">
                          {password.username}
                        </div>
                        <button
                          onClick={() => copyToClipboard(password.username, 'Usuario')}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                          title="Copiar usuario"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900 font-mono">
                          {visiblePasswords.has(password.id) 
                            ? password.password 
                            : '••••••••'
                          }
                        </div>
                        <button
                          onClick={() => togglePasswordVisibility(password.id)}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                          title={visiblePasswords.has(password.id) ? 'Ocultar' : 'Mostrar'}
                        >
                          {visiblePasswords.has(password.id) ? '👁️' : '👁️‍🗨️'}
                        </button>
                        <button
                          onClick={() => copyToClipboard(password.password, 'Contraseña')}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                          title="Copiar contraseña"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(password.updatedAt).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditPassword(password)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeletePassword(password.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        🗑️
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