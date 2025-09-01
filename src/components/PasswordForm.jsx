import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import { generateSecurePassword, evaluatePasswordStrength } from '../utils/security';

const PasswordForm = ({ onSubmit, onCancel, editingPassword = null }) => {
  const [formData, setFormData] = useState({
    service_name: '',
    username: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);

  useEffect(() => {
    if (editingPassword) {
      setFormData({
        service_name: editingPassword.service_name || '',
        username: editingPassword.username || '',
        password: editingPassword.password || ''
      });
    } else {
      setFormData({
        service_name: '',
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
    
    // Evaluar fortaleza de contraseña en tiempo real
    if (name === 'password') {
      const strength = evaluatePasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.service_name.trim() || !formData.username.trim() || !formData.password.trim()) {
      alert('Por favor, completa todos los campos');
      return;
    }

    const passwordData = {
      id: editingPassword ? editingPassword.id : Date.now().toString(),
      service_name: formData.service_name.trim(),
      username: formData.username.trim(),
      password: formData.password.trim()
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
            <label htmlFor="service_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
              Sitio Web *
            </label>
            <input
              type="text"
              id="service_name"
              name="service_name"
              value={formData.service_name}
              onChange={handleInputChange}
              placeholder="Ej: Gmail, Facebook, GitHub"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
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
              placeholder="Nombre de usuario o email"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
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
                <span aria-hidden="true">{showPassword ? '👁️' : '👁️‍🗨️'}</span>
              </button>
              <button
                type="button"
                onClick={generatePassword}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm transition-colors duration-200"
                title="Generar contraseña"
                aria-label="Generar contraseña aleatoria"
              >
                <span aria-hidden="true">🎲</span>
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
                          <span className="text-blue-500 mr-1">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
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