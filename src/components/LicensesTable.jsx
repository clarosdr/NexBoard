import React, { useState, useEffect } from 'react';
import LicenseForm from './LicenseForm';

const LicensesTable = () => {
  const [licenses, setLicenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, expiring, expired
  const [sortBy, setSortBy] = useState('expirationDate'); // expirationDate, client, licenseName, profit
  const [sortOrder, setSortOrder] = useState('asc');

  // Cargar licencias desde localStorage al montar el componente
  useEffect(() => {
    const savedLicenses = localStorage.getItem('nexboard_licenses');
    if (savedLicenses) {
      setLicenses(JSON.parse(savedLicenses));
    }
  }, []);

  // Guardar licencias en localStorage cuando cambie el estado
  useEffect(() => {
    localStorage.setItem('nexboard_licenses', JSON.stringify(licenses));
  }, [licenses]);

  const handleAddLicense = () => {
    setEditingLicense(null);
    setShowForm(true);
  };

  const handleEditLicense = (license) => {
    setEditingLicense(license);
    setShowForm(true);
  };

  const handleDeleteLicense = (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta licencia?')) {
      setLicenses(licenses.filter(l => l.id !== id));
    }
  };

  const handleFormSubmit = (licenseData) => {
    if (editingLicense) {
      // Actualizar licencia existente
      setLicenses(licenses.map(l => 
        l.id === editingLicense.id ? licenseData : l
      ));
    } else {
      // Agregar nueva licencia
      setLicenses([...licenses, licenseData]);
    }
    setShowForm(false);
    setEditingLicense(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingLicense(null);
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${type} copiado al portapapeles`);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const getDaysUntilExpiration = (expirationDate) => {
    if (!expirationDate) return null;
    
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getLicenseStatus = (license) => {
    const daysUntilExpiration = getDaysUntilExpiration(license.expirationDate);
    
    if (daysUntilExpiration === null) return 'unknown';
    if (daysUntilExpiration < 0) return 'expired';
    if (daysUntilExpiration <= 30) return 'expiring';
    return 'active';
  };

  const getStatusBadge = (license) => {
    const status = getLicenseStatus(license);
    const daysUntilExpiration = getDaysUntilExpiration(license.expirationDate);
    
    switch (status) {
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            ❌ Vencida
          </span>
        );
      case 'expiring':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            ⚠️ Vence en {daysUntilExpiration} días
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✅ Activa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            ❓ Sin fecha
          </span>
        );
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  // Filtrar y ordenar licencias
  const filteredAndSortedLicenses = licenses
    .filter(license => {
      // Filtro por término de búsqueda
      const matchesSearch = 
        license.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.licenseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.provider.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      // Filtro por estado
      if (filterStatus === 'all') return true;
      
      const status = getLicenseStatus(license);
      return status === filterStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'expirationDate':
          aValue = new Date(a.expirationDate || '9999-12-31');
          bValue = new Date(b.expirationDate || '9999-12-31');
          break;
        case 'client':
          aValue = a.client.toLowerCase();
          bValue = b.client.toLowerCase();
          break;
        case 'licenseName':
          aValue = a.licenseName.toLowerCase();
          bValue = b.licenseName.toLowerCase();
          break;
        case 'profit':
          aValue = a.profit || 0;
          bValue = b.profit || 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Estadísticas
  const stats = {
    total: licenses.length,
    active: licenses.filter(l => getLicenseStatus(l) === 'active').length,
    expiring: licenses.filter(l => getLicenseStatus(l) === 'expiring').length,
    expired: licenses.filter(l => getLicenseStatus(l) === 'expired').length,
    totalProfit: licenses.reduce((sum, l) => sum + (l.profit || 0), 0),
    totalSales: licenses.reduce((sum, l) => sum + (l.saleValue || 0), 0)
  };

  if (showForm) {
    return (
      <LicenseForm
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        editingLicense={editingLicense}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Licencias</h1>
          <p className="text-gray-600 mt-1">
            Total: {stats.total} licencia{stats.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleAddLicense}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + Nueva Licencia
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold">✅</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Activas</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-semibold">⚠️</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Por Vencer</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.expiring}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-semibold">❌</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Vencidas</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.expired}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">💰</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Ganancia Total</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(stats.totalProfit)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por cliente, licencia, código o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>
          
          {/* Filtro por estado */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">📋 Todas las licencias</option>
              <option value="active">✅ Solo activas</option>
              <option value="expiring">⚠️ Por vencer (30 días)</option>
              <option value="expired">❌ Vencidas</option>
            </select>
          </div>
          
          {/* Ordenar por */}
          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="expirationDate">📅 Fecha vencimiento</option>
              <option value="client">🏢 Cliente</option>
              <option value="licenseName">📋 Licencia</option>
              <option value="profit">💰 Ganancia</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={`Ordenar ${sortOrder === 'asc' ? 'descendente' : 'ascendente'}`}
            >
              {sortOrder === 'asc' ? '⬆️' : '⬇️'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de licencias */}
      {filteredAndSortedLicenses.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {licenses.length === 0 ? 'No hay licencias registradas' : 'No se encontraron resultados'}
          </h3>
          <p className="text-gray-600">
            {licenses.length === 0 
              ? 'Comienza registrando tu primera licencia de software'
              : 'Intenta con otros términos de búsqueda o filtros'
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
                    Cliente / Licencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código / Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado / Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instalaciones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Financiero
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedLicenses.map((license) => {
                  const daysUntilExpiration = getDaysUntilExpiration(license.expirationDate);
                  
                  return (
                    <tr key={license.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            🏢 {license.client}
                          </div>
                          <div className="text-sm text-gray-500">
                            📋 {license.licenseName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 font-mono flex items-center">
                            🔑 {license.code}
                            <button
                              onClick={() => copyToClipboard(license.code, 'Código')}
                              className="ml-2 text-gray-400 hover:text-gray-600"
                              title="Copiar código"
                            >
                              📋
                            </button>
                          </div>
                          <div className="text-sm text-gray-500">
                            🏭 {license.provider}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {getStatusBadge(license)}
                          <div className="text-sm text-gray-500">
                            📅 {new Date(license.expirationDate).toLocaleDateString('es-CO')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        💻 {license.numberOfInstallations}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-gray-900">
                            💰 {formatCurrency(license.saleValue)}
                          </div>
                          <div className="text-gray-500">
                            💸 {formatCurrency(license.costValue)}
                          </div>
                          <div className={`font-medium ${
                            license.profit > 0 ? 'text-green-600' : 
                            license.profit < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            📈 {formatCurrency(license.profit)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditLicense(license)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteLicense(license.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicensesTable;