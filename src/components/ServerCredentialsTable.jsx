import React, { useState, useEffect } from 'react';
import ServerCredentialsForm from './ServerCredentialsForm';

const ServerCredentialsTable = () => {
  const [credentials, setCredentials] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCredential, setEditingCredential] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState(new Set());
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Cargar credenciales desde localStorage al montar el componente
  useEffect(() => {
    const savedCredentials = localStorage.getItem('nexboard_server_credentials');
    if (savedCredentials) {
      setCredentials(JSON.parse(savedCredentials));
    }
  }, []);

  // Guardar credenciales en localStorage cuando cambie el estado
  useEffect(() => {
    localStorage.setItem('nexboard_server_credentials', JSON.stringify(credentials));
  }, [credentials]);

  const handleAddCredential = () => {
    setEditingCredential(null);
    setShowForm(true);
  };

  const handleEditCredential = (credential) => {
    setEditingCredential(credential);
    setShowForm(true);
  };

  const handleDeleteCredential = (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar estas credenciales?')) {
      setCredentials(credentials.filter(c => c.id !== id));
    }
  };

  const handleFormSubmit = (credentialData) => {
    if (editingCredential) {
      // Actualizar credencial existente
      setCredentials(credentials.map(c => 
        c.id === editingCredential.id ? credentialData : c
      ));
    } else {
      // Agregar nueva credencial
      setCredentials([...credentials, credentialData]);
    }
    setShowForm(false);
    setEditingCredential(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCredential(null);
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

  const toggleRowExpansion = (id) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${type} copiado al portapapeles`);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  // Filtrar credenciales por término de búsqueda
  const filteredCredentials = credentials.filter(credential =>
    credential.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    credential.localServerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    credential.vpnName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    credential.vpnIp.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showForm) {
    return (
      <ServerCredentialsForm
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        editingCredential={editingCredential}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Credenciales de Servidores</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">
            Total: {credentials.length} servidor{credentials.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <button
          onClick={handleAddCredential}
          className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
        >
          + Nuevas Credenciales
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 transition-colors duration-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por cliente, servidor, VPN o IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
            🔍
          </div>
        </div>
      </div>

      {/* Tabla de credenciales */}
      {filteredCredentials.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border dark:border-gray-700 text-center transition-colors duration-200">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🖥️</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-200">
            {credentials.length === 0 ? 'No hay credenciales guardadas' : 'No se encontraron resultados'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-200">
            {credentials.length === 0 
              ? 'Comienza agregando las credenciales de tu primer servidor'
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Cliente / Servidor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    VPN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Usuarios
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
                {filteredCredentials.map((credential) => (
                  <React.Fragment key={credential.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
                            🏢 {credential.client}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">
                            🖥️ {credential.localServerName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
                            {credential.vpnName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center transition-colors duration-200">
                            📍 {credential.vpnIp}
                            <button
                              onClick={() => copyToClipboard(credential.vpnIp, 'IP VPN')}
                              className="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                              title="Copiar IP"
                            >
                              📋
                            </button>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1 transition-colors duration-200">
                            🔒 {visiblePasswords.has(`vpn-${credential.id}`) 
                              ? credential.vpnPassword 
                              : '••••••••'
                            }
                            <button
                              onClick={() => togglePasswordVisibility(`vpn-${credential.id}`)}
                              className="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                              title={visiblePasswords.has(`vpn-${credential.id}`) ? 'Ocultar' : 'Mostrar'}
                            >
                              {visiblePasswords.has(`vpn-${credential.id}`) ? '👁️' : '👁️‍🗨️'}
                            </button>
                            <button
                              onClick={() => copyToClipboard(credential.vpnPassword, 'Contraseña VPN')}
                              className="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                              title="Copiar contraseña VPN"
                            >
                              📋
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900 dark:text-white transition-colors duration-200">
                            👥 {credential.users.length} usuario{credential.users.length !== 1 ? 's' : ''}
                          </span>
                          <button
                            onClick={() => toggleRowExpansion(credential.id)}
                            className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm transition-colors duration-200"
                          >
                            {expandedRows.has(credential.id) ? '▼' : '▶'} Ver
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">
                        {new Date(credential.updatedAt).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditCredential(credential)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3 transition-colors duration-200"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteCredential(credential.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors duration-200"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                    
                    {/* Fila expandida con usuarios */}
                    {expandedRows.has(credential.id) && (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 bg-gray-50 dark:bg-gray-700 transition-colors duration-200">
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-800 dark:text-white mb-3 transition-colors duration-200">👥 Usuarios del Servidor:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {credential.users.map((user, userIndex) => (
                                <div key={userIndex} className="bg-white dark:bg-gray-800 p-3 rounded-md border dark:border-gray-600 transition-colors duration-200">
                                  <div className="space-y-2">
                                    <div className="flex items-center">
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Usuario:</span>
                                      <span className="ml-2 text-sm text-gray-900 dark:text-white transition-colors duration-200">{user.username}</span>
                                      <button
                                        onClick={() => copyToClipboard(user.username, 'Usuario')}
                                        className="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                                        title="Copiar usuario"
                                      >
                                        📋
                                      </button>
                                    </div>
                                    <div className="flex items-center">
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Contraseña:</span>
                                      <span className="ml-2 text-sm text-gray-900 dark:text-white font-mono transition-colors duration-200">
                                        {visiblePasswords.has(`user-${credential.id}-${userIndex}`) 
                                          ? user.password 
                                          : '••••••••'
                                        }
                                      </span>
                                      <button
                                        onClick={() => togglePasswordVisibility(`user-${credential.id}-${userIndex}`)}
                                        className="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                                        title={visiblePasswords.has(`user-${credential.id}-${userIndex}`) ? 'Ocultar' : 'Mostrar'}
                                      >
                                        {visiblePasswords.has(`user-${credential.id}-${userIndex}`) ? '👁️' : '👁️‍🗨️'}
                                      </button>
                                      <button
                                        onClick={() => copyToClipboard(user.password, 'Contraseña')}
                                        className="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                                        title="Copiar contraseña"
                                      >
                                        📋
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerCredentialsTable;