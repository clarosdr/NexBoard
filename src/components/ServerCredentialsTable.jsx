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
          <h1 className="text-3xl font-bold text-gray-900">Credenciales de Servidores</h1>
          <p className="text-gray-600 mt-1">
            Total: {credentials.length} servidor{credentials.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <button
          onClick={handleAddCredential}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + Nuevas Credenciales
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por cliente, servidor, VPN o IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
        </div>
      </div>

      {/* Tabla de credenciales */}
      {filteredCredentials.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <div className="text-gray-400 text-6xl mb-4">🖥️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {credentials.length === 0 ? 'No hay credenciales guardadas' : 'No se encontraron resultados'}
          </h3>
          <p className="text-gray-600">
            {credentials.length === 0 
              ? 'Comienza agregando las credenciales de tu primer servidor'
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
                    Cliente / Servidor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    VPN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuarios
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
                {filteredCredentials.map((credential) => (
                  <React.Fragment key={credential.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            🏢 {credential.client}
                          </div>
                          <div className="text-sm text-gray-500">
                            🖥️ {credential.localServerName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {credential.vpnName}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            📍 {credential.vpnIp}
                            <button
                              onClick={() => copyToClipboard(credential.vpnIp, 'IP VPN')}
                              className="ml-2 text-gray-400 hover:text-gray-600"
                              title="Copiar IP"
                            >
                              📋
                            </button>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            🔒 {visiblePasswords.has(`vpn-${credential.id}`) 
                              ? credential.vpnPassword 
                              : '••••••••'
                            }
                            <button
                              onClick={() => togglePasswordVisibility(`vpn-${credential.id}`)}
                              className="ml-2 text-gray-400 hover:text-gray-600"
                              title={visiblePasswords.has(`vpn-${credential.id}`) ? 'Ocultar' : 'Mostrar'}
                            >
                              {visiblePasswords.has(`vpn-${credential.id}`) ? '👁️' : '👁️‍🗨️'}
                            </button>
                            <button
                              onClick={() => copyToClipboard(credential.vpnPassword, 'Contraseña VPN')}
                              className="ml-2 text-gray-400 hover:text-gray-600"
                              title="Copiar contraseña VPN"
                            >
                              📋
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900">
                            👥 {credential.users.length} usuario{credential.users.length !== 1 ? 's' : ''}
                          </span>
                          <button
                            onClick={() => toggleRowExpansion(credential.id)}
                            className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            {expandedRows.has(credential.id) ? '▼' : '▶'} Ver
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(credential.updatedAt).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditCredential(credential)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteCredential(credential.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                    
                    {/* Fila expandida con usuarios */}
                    {expandedRows.has(credential.id) && (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 bg-gray-50">
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-800 mb-3">👥 Usuarios del Servidor:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {credential.users.map((user, userIndex) => (
                                <div key={userIndex} className="bg-white p-3 rounded-md border">
                                  <div className="space-y-2">
                                    <div className="flex items-center">
                                      <span className="text-sm font-medium text-gray-700">Usuario:</span>
                                      <span className="ml-2 text-sm text-gray-900">{user.username}</span>
                                      <button
                                        onClick={() => copyToClipboard(user.username, 'Usuario')}
                                        className="ml-2 text-gray-400 hover:text-gray-600"
                                        title="Copiar usuario"
                                      >
                                        📋
                                      </button>
                                    </div>
                                    <div className="flex items-center">
                                      <span className="text-sm font-medium text-gray-700">Contraseña:</span>
                                      <span className="ml-2 text-sm text-gray-900 font-mono">
                                        {visiblePasswords.has(`user-${credential.id}-${userIndex}`) 
                                          ? user.password 
                                          : '••••••••'
                                        }
                                      </span>
                                      <button
                                        onClick={() => togglePasswordVisibility(`user-${credential.id}-${userIndex}`)}
                                        className="ml-2 text-gray-400 hover:text-gray-600"
                                        title={visiblePasswords.has(`user-${credential.id}-${userIndex}`) ? 'Ocultar' : 'Mostrar'}
                                      >
                                        {visiblePasswords.has(`user-${credential.id}-${userIndex}`) ? '👁️' : '👁️‍🗨️'}
                                      </button>
                                      <button
                                        onClick={() => copyToClipboard(user.password, 'Contraseña')}
                                        className="ml-2 text-gray-400 hover:text-gray-600"
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