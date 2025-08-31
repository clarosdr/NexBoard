import React, { useState, useEffect } from 'react';

const PasswordForm = ({ onSubmit, onCancel, editingPassword = null }) => {
  const [formData, setFormData] = useState({
    website: '',
    username: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (editingPassword) {
      setFormData({
        website: editingPassword.website || '',
        username: editingPassword.username || '',
        password: editingPassword.password || ''
      });
    } else {
      setFormData({
        website: '',
        username: '',
        password: ''
      });
    }
  }, [editingPassword]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.website.trim() || !formData.username.trim() || !formData.password.trim()) {
      alert('Por favor, completa todos los campos');
      return;
    }

    const passwordData = {
      id: editingPassword ? editingPassword.id : Date.now().toString(),
      website: formData.website.trim(),
      username: formData.username.trim(),
      password: formData.password.trim(),
      created_at: editingPassword ? editingPassword.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    onSubmit(passwordData);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 transition-colors duration-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white transition-colors duration-200">
        {editingPassword ? 'Editar Contraseña' : 'Nueva Contraseña'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sitio Web */}
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
            Sitio Web *
          </label>
          <input
            type="text"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            placeholder="ej. gmail.com, facebook.com"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
            required
          />
        </div>

        {/* Nombre de Usuario */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
            Nombre de Usuario *
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="ej. usuario@email.com"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
            required
          />
        </div>

        {/* Contraseña */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
            Contraseña *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Ingresa tu contraseña"
              className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
            <button
              type="button"
              onClick={generatePassword}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm transition-colors duration-200"
              title="Generar contraseña"
            >
              🎲
            </button>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
          >
            {editingPassword ? 'Actualizar' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-500 dark:bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-colors duration-200"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasswordForm;