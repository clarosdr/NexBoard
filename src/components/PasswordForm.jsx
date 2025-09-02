import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import { generateSecurePassword, evaluatePasswordStrength } from '../utils/security';

const PasswordForm = ({ onSubmit, onCancel, editingPassword = null }) => {
  const [formData, setFormData] = useState({
    websiteApp: '',
    userOrEmail: '',
    password: '',
    category: '',
    notes: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);

  useEffect(() => {
    if (editingPassword) {
      setFormData({
        websiteApp: editingPassword.service_name || editingPassword.websiteApp || '',
        userOrEmail: editingPassword.username || editingPassword.email || editingPassword.userOrEmail || '',
        password: editingPassword.password || '',
        category: editingPassword.category || '',
        notes: editingPassword.notes || ''
      });
    } else {
      setFormData({
        websiteApp: '',
        userOrEmail: '',
        password: '',
        category: '',
        notes: ''
      });
    }
  }, [editingPassword]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Evaluar fortaleza de contraseña en tiempo real
    if (name === 'password') {
      const strength = evaluatePasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.websiteApp.trim() || !formData.userOrEmail.trim() || !formData.password.trim()) {
      alert('Por favor, completa los campos obligatorios: Sitio Web/Aplicación, Usuario o Email y Contraseña');
      return;
    }

    const passwordData = {
      service_name: formData.websiteApp.trim(),
      username: formData.userOrEmail.trim(),
      email: formData.userOrEmail.includes('@') ? formData.userOrEmail.trim() : '',
      password: formData.password.trim(),
      category: formData.category.trim(),
      notes: formData.notes.trim(),
      url: '' // Campo mantenido para compatibilidad
    };

    onSubmit(passwordData);
  };

  const generatePassword = async () => {
    try {
      const securePassword = await generateSecurePassword(16);
      setFormData(prev => ({ ...prev, password: securePassword }));
      
      // Evaluar fortaleza de la nueva contraseña
      const strength = evaluatePasswordStrength(securePassword);
      setPasswordStrength(strength);
    } catch (error) {
      console.error('Error generating secure password:', error);
      // Fallback a generación básica si falla la segura
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setFormData(prev => ({ ...prev, password }));
      const strength = evaluatePasswordStrength(password);
      setPasswordStrength(strength);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border dark:border-gray-700 transition-colors duration-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white transition-colors duration-200">
        {editingPassword ? 'Editar Contraseña' : 'Nueva Contraseña'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Sitio Web */}
          <div>
            <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
              Sitio Web *
            </label>
            <input
              type="text"
              id="serviceName"
              name="serviceName"
              value={formData.serviceName}
              onChange={handleInputChange}
              placeholder="Ej: Gmail, Facebook, GitHub"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
              required
            />
          </div>

          {/* Usuario y Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                Usuario
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Ej: mi_usuario"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="usuario@ejemplo.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
              />
            </div>
          </div>

          {/* Contraseña y URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Ingrese la contraseña"
                  className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <span aria-hidden="true">{showPassword ? 'Hide' : 'Show'}</span>
                </button>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm transition-colors duration-200"
                  title="Generar contraseña"
                  aria-label="Generar contraseña aleatoria"
                >
                  <span aria-hidden="true">Gen</span>
                </button>
              </div>
              
              {/* Indicador de fortaleza de contraseña */}
              {formData.password && passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Fortaleza:</span>
                    <span className={`font-medium ${
                      passwordStrength.score >= 4 ? 'text-green-600 dark:text-green-400' :
                      passwordStrength.score >= 3 ? 'text-yellow-600 dark:text-yellow-400' :
                      passwordStrength.score >= 2 ? 'text-orange-600 dark:text-orange-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {passwordStrength.score >= 4 ? 'Muy Fuerte' :
                       passwordStrength.score >= 3 ? 'Fuerte' :
                       passwordStrength.score >= 2 ? 'Media' :
                       'Débil'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 4 ? 'bg-green-500' :
                        passwordStrength.score >= 3 ? 'bg-yellow-500' :
                        passwordStrength.score >= 2 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    ></div>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="mt-2">
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {passwordStrength.feedback.map((tip, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-1">*</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                URL
              </label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="https://ejemplo.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
              />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
              Categoría
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            >
              <option value="">Seleccionar categoría</option>
              <option value="social">Redes Sociales</option>
              <option value="email">Email</option>
              <option value="trabajo">Trabajo</option>
              <option value="bancario">Bancario</option>
              <option value="entretenimiento">Entretenimiento</option>
              <option value="compras">Compras</option>
              <option value="otros">Otros</option>
            </select>
          </div>

          {/* Notas */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
              Notas
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Notas adicionales..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200 resize-vertical"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            size="lg"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
          >
            {editingPassword ? 'Actualizar Contraseña' : 'Guardar Contraseña'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PasswordForm;