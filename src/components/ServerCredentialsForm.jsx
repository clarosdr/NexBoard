import React, { useState, useEffect } from 'react';

const ServerCredentialsForm = ({ onSubmit, onCancel, editingCredential = null }) => {
  const [formData, setFormData] = useState({
    client: '',
    vpnName: '',
    vpnPassword: '',
    vpnIp: '',
    localServerName: '',
    users: [{ username: '', password: '' }]
  });

  const [showPasswords, setShowPasswords] = useState({
    vpn: false,
    users: {}
  });

  useEffect(() => {
    if (editingCredential) {
      setFormData({
        client: editingCredential.client || '',
        vpnName: editingCredential.vpnName || '',
        vpnPassword: editingCredential.vpnPassword || '',
        vpnIp: editingCredential.vpnIp || '',
        localServerName: editingCredential.localServerName || '',
        users: editingCredential.users || [{ username: '', password: '' }]
      });
    } else {
      setFormData({
        client: '',
        vpnName: '',
        vpnPassword: '',
        vpnIp: '',
        localServerName: '',
        users: [{ username: '', password: '' }]
      });
    }
    setShowPasswords({ vpn: false, users: {} });
  }, [editingCredential]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserChange = (index, field, value) => {
    const updatedUsers = [...formData.users];
    updatedUsers[index] = {
      ...updatedUsers[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      users: updatedUsers
    }));
  };

  const addUser = () => {
    setFormData(prev => ({
      ...prev,
      users: [...prev.users, { username: '', password: '' }]
    }));
  };

  const removeUser = (index) => {
    if (formData.users.length > 1) {
      const updatedUsers = formData.users.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        users: updatedUsers
      }));
    }
  };

  const togglePasswordVisibility = (type, index = null) => {
    if (type === 'vpn') {
      setShowPasswords(prev => ({
        ...prev,
        vpn: !prev.vpn
      }));
    } else if (type === 'user') {
      setShowPasswords(prev => ({
        ...prev,
        users: {
          ...prev.users,
          [index]: !prev.users[index]
        }
      }));
    }
  };

  const generatePassword = (type, index = null) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    if (type === 'vpn') {
      setFormData(prev => ({ ...prev, vpnPassword: password }));
    } else if (type === 'user') {
      handleUserChange(index, 'password', password);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.client.trim() || !formData.vpnName.trim() || !formData.vpnPassword.trim() || 
        !formData.vpnIp.trim() || !formData.localServerName.trim()) {
      alert('Por favor, completa todos los campos obligatorios');
      return;
    }

    // Validar que al menos un usuario tenga datos completos
    const validUsers = formData.users.filter(user => user.username.trim() && user.password.trim());
    if (validUsers.length === 0) {
      alert('Debe agregar al menos un usuario con nombre y contraseña');
      return;
    }

    const credentialData = {
      id: editingCredential ? editingCredential.id : Date.now().toString(),
      client: formData.client.trim(),
      vpnName: formData.vpnName.trim(),
      vpnPassword: formData.vpnPassword.trim(),
      vpnIp: formData.vpnIp.trim(),
      localServerName: formData.localServerName.trim(),
      users: validUsers.map(user => ({
        username: user.username.trim(),
        password: user.password.trim()
      })),
      createdAt: editingCredential ? editingCredential.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSubmit(credentialData);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 max-w-4xl mx-auto transition-colors duration-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white transition-colors duration-200">
        {editingCredential ? 'Editar Credenciales de Servidor' : 'Nuevas Credenciales de Servidor'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="client" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
              Cliente *
            </label>
            <input
              type="text"
              id="client"
              name="client"
              value={formData.client}
              onChange={handleInputChange}
              placeholder="Nombre del cliente"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
              required
            />
          </div>

          <div>
            <label htmlFor="localServerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
              Nombre de Servidor Local *
            </label>
            <input
              type="text"
              id="localServerName"
              name="localServerName"
              value={formData.localServerName}
              onChange={handleInputChange}
              placeholder="ej. SERVER-PROD-01"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
              required
            />
          </div>
        </div>

        {/* Información de VPN */}
        <div className="border-t dark:border-gray-600 pt-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 transition-colors duration-200">🔒 Información de VPN</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="vpnName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                Nombre de VPN *
              </label>
              <input
                type="text"
                id="vpnName"
                name="vpnName"
                value={formData.vpnName}
                onChange={handleInputChange}
                placeholder="ej. VPN-Cliente-01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                required
              />
            </div>

            <div>
              <label htmlFor="vpnIp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                IP VPN *
              </label>
              <input
                type="text"
                id="vpnIp"
                name="vpnIp"
                value={formData.vpnIp}
                onChange={handleInputChange}
                placeholder="ej. 192.168.1.100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                required
              />
            </div>

            <div>
              <label htmlFor="vpnPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                Contraseña VPN *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.vpn ? 'text' : 'password'}
                  id="vpnPassword"
                  name="vpnPassword"
                  value={formData.vpnPassword}
                  onChange={handleInputChange}
                  placeholder="Contraseña de VPN"
                  className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('vpn')}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  {showPasswords.vpn ? '👁️' : '👁️‍🗨️'}
                </button>
                <button
                  type="button"
                  onClick={() => generatePassword('vpn')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm transition-colors duration-200"
                  title="Generar contraseña"
                >
                  🎲
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Usuarios del Servidor */}
        <div className="border-t dark:border-gray-600 pt-6 transition-colors duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white transition-colors duration-200">👥 Usuarios del Servidor</h3>
            <button
              type="button"
              onClick={addUser}
              className="bg-green-600 dark:bg-green-700 text-white px-3 py-1 rounded-md hover:bg-green-700 dark:hover:bg-green-600 text-sm transition-colors duration-200"
            >
              + Agregar Usuario
            </button>
          </div>
          
          <div className="space-y-4">
            {formData.users.map((user, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md border dark:border-gray-600 transition-colors duration-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Usuario {index + 1}</h4>
                  {formData.users.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeUser(index)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm transition-colors duration-200"
                    >
                      🗑️ Eliminar
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Nombre de Usuario
                    </label>
                    <input
                      type="text"
                      value={user.username}
                      onChange={(e) => handleUserChange(index, 'username', e.target.value)}
                      placeholder="ej. administrator"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.users[index] ? 'text' : 'password'}
                        value={user.password}
                        onChange={(e) => handleUserChange(index, 'password', e.target.value)}
                        placeholder="Contraseña del usuario"
                        className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('user', index)}
                        className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                      >
                        {showPasswords.users[index] ? '👁️' : '👁️‍🗨️'}
                      </button>
                      <button
                        type="button"
                        onClick={() => generatePassword('user', index)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm transition-colors duration-200"
                        title="Generar contraseña"
                      >
                        🎲
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4 pt-6 border-t dark:border-gray-600 transition-colors duration-200">
          <button
            type="submit"
            className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-3 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 font-medium transition-colors duration-200"
          >
            {editingCredential ? 'Actualizar Credenciales' : 'Guardar Credenciales'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-500 dark:bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-600 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 font-medium transition-colors duration-200"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServerCredentialsForm;