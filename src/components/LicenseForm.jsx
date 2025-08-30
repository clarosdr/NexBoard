import React, { useState, useEffect } from 'react';

const LicenseForm = ({ onSubmit, onCancel, editingLicense }) => {
  const [formData, setFormData] = useState({
    client: '',
    licenseName: '',
    code: '',
    installationDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    numberOfInstallations: 1,
    saleValue: '',
    costValue: '',
    profit: 0,
    provider: ''
  });

  const [errors, setErrors] = useState({});

  // Calcular fecha de vencimiento automáticamente (1 año después de instalación)
  useEffect(() => {
    if (formData.installationDate) {
      const installDate = new Date(formData.installationDate);
      const expDate = new Date(installDate);
      expDate.setFullYear(expDate.getFullYear() + 1);
      
      setFormData(prev => ({
        ...prev,
        expirationDate: expDate.toISOString().split('T')[0]
      }));
    }
  }, [formData.installationDate]);

  // Calcular ganancia automáticamente
  useEffect(() => {
    const saleValue = parseFloat(formData.saleValue) || 0;
    const costValue = parseFloat(formData.costValue) || 0;
    const profit = saleValue - costValue;
    
    setFormData(prev => ({
      ...prev,
      profit: profit
    }));
  }, [formData.saleValue, formData.costValue]);

  // Cargar datos si estamos editando
  useEffect(() => {
    if (editingLicense) {
      setFormData({
        client: editingLicense.client || '',
        licenseName: editingLicense.licenseName || '',
        code: editingLicense.code || '',
        installationDate: editingLicense.installationDate || new Date().toISOString().split('T')[0],
        expirationDate: editingLicense.expirationDate || '',
        numberOfInstallations: editingLicense.numberOfInstallations || 1,
        saleValue: editingLicense.saleValue || '',
        costValue: editingLicense.costValue || '',
        profit: editingLicense.profit || 0,
        provider: editingLicense.provider || ''
      });
    }
  }, [editingLicense]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.client.trim()) {
      newErrors.client = 'El cliente es requerido';
    }
    
    if (!formData.licenseName.trim()) {
      newErrors.licenseName = 'El nombre de la licencia es requerido';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'El código de licencia es requerido';
    }
    
    if (!formData.installationDate) {
      newErrors.installationDate = 'La fecha de instalación es requerida';
    }
    
    if (!formData.numberOfInstallations || formData.numberOfInstallations < 1) {
      newErrors.numberOfInstallations = 'El número de instalaciones debe ser mayor a 0';
    }
    
    if (!formData.saleValue || formData.saleValue <= 0) {
      newErrors.saleValue = 'El valor de venta debe ser mayor a 0';
    }
    
    if (!formData.costValue || formData.costValue < 0) {
      newErrors.costValue = 'El valor de costo no puede ser negativo';
    }
    
    if (!formData.provider.trim()) {
      newErrors.provider = 'El proveedor es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const licenseData = {
        ...formData,
        id: editingLicense?.id || Date.now().toString(),
        createdAt: editingLicense?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      onSubmit(licenseData);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const getDaysUntilExpiration = () => {
    if (!formData.expirationDate) return null;
    
    const today = new Date();
    const expDate = new Date(formData.expirationDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const daysUntilExpiration = getDaysUntilExpiration();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingLicense ? '✏️ Editar Licencia' : '📄 Nueva Licencia'}
          </h2>
          <p className="text-gray-600 mt-1">
            {editingLicense ? 'Modifica los datos de la licencia' : 'Registra una nueva licencia de software'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏢 Cliente *
              </label>
              <input
                type="text"
                name="client"
                value={formData.client}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.client ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nombre del cliente"
              />
              {errors.client && (
                <p className="text-red-500 text-sm mt-1">{errors.client}</p>
              )}
            </div>

            {/* Nombre de Licencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📋 Nombre de Licencia *
              </label>
              <input
                type="text"
                name="licenseName"
                value={formData.licenseName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.licenseName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Antivirus Kaspersky, Office 365, etc."
              />
              {errors.licenseName && (
                <p className="text-red-500 text-sm mt-1">{errors.licenseName}</p>
              )}
            </div>

            {/* Código */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔑 Código de Licencia *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
                  errors.code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Código o clave de activación"
              />
              {errors.code && (
                <p className="text-red-500 text-sm mt-1">{errors.code}</p>
              )}
            </div>

            {/* Proveedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏭 Proveedor *
              </label>
              <input
                type="text"
                name="provider"
                value={formData.provider}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.provider ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nombre del proveedor"
              />
              {errors.provider && (
                <p className="text-red-500 text-sm mt-1">{errors.provider}</p>
              )}
            </div>

            {/* Fecha de Instalación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Fecha de Instalación *
              </label>
              <input
                type="date"
                name="installationDate"
                value={formData.installationDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.installationDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.installationDate && (
                <p className="text-red-500 text-sm mt-1">{errors.installationDate}</p>
              )}
            </div>

            {/* Fecha de Vencimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⏰ Fecha de Vencimiento
              </label>
              <input
                type="date"
                name="expirationDate"
                value={formData.expirationDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {daysUntilExpiration !== null && (
                <p className={`text-sm mt-1 ${
                  daysUntilExpiration < 30 ? 'text-red-600' : 
                  daysUntilExpiration < 90 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {daysUntilExpiration > 0 
                    ? `⏳ Vence en ${daysUntilExpiration} días`
                    : daysUntilExpiration === 0
                    ? '⚠️ Vence hoy'
                    : `❌ Vencida hace ${Math.abs(daysUntilExpiration)} días`
                  }
                </p>
              )}
            </div>

            {/* Número de Instalaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💻 Número de Instalaciones *
              </label>
              <input
                type="number"
                name="numberOfInstallations"
                value={formData.numberOfInstallations}
                onChange={handleInputChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.numberOfInstallations ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="1"
              />
              {errors.numberOfInstallations && (
                <p className="text-red-500 text-sm mt-1">{errors.numberOfInstallations}</p>
              )}
            </div>

            {/* Valor de Venta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💰 Valor de Venta *
              </label>
              <input
                type="number"
                name="saleValue"
                value={formData.saleValue}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.saleValue ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.saleValue && (
                <p className="text-red-500 text-sm mt-1">{errors.saleValue}</p>
              )}
            </div>

            {/* Valor de Costo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💸 Valor de Costo *
              </label>
              <input
                type="number"
                name="costValue"
                value={formData.costValue}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.costValue ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.costValue && (
                <p className="text-red-500 text-sm mt-1">{errors.costValue}</p>
              )}
            </div>

            {/* Ganancia (calculada automáticamente) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📈 Ganancia (Calculada Automáticamente)
              </label>
              <div className={`w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-lg font-semibold ${
                formData.profit > 0 ? 'text-green-600' : 
                formData.profit < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {formatCurrency(formData.profit)}
                {formData.profit > 0 && ' 📈'}
                {formData.profit < 0 && ' 📉'}
              </div>
              {formData.saleValue && formData.costValue && (
                <p className="text-sm text-gray-600 mt-1">
                  Margen: {((formData.profit / formData.saleValue) * 100).toFixed(1)}%
                </p>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {editingLicense ? 'Actualizar Licencia' : 'Guardar Licencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LicenseForm;