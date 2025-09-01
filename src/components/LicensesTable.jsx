import React, { useState, useEffect } from 'react';
import LicenseForm from './LicenseForm';
import { useAuth } from '../hooks/useAuth';
import { supabaseService } from '../lib/supabase';

const LicensesTable = () => {
  const [licenses, setLicenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, expiring, expired
  const [sortBy, setSortBy] = useState('expiry_date'); // expiry_date, client, licenseName, profit
  const [sortOrder, setSortOrder] = useState('asc');
  const { user } = useAuth();

  // Cargar licencias desde Supabase al montar el componente
  useEffect(() => {
    const loadLicenses = async () => {
      if (user) {
        try {
          const licensesData = await supabaseService.getLicenses(user.id);
          setLicenses(licensesData);
        } catch (error) {
          console.error('Error loading licenses from Supabase:', error);
        }
      }
    };
    loadLicenses();
  }, [user]);

  const handleAddLicense = () => {
    setEditingLicense(null);
    setShowForm(true);
  };

  const handleEditLicense = (license) => {
    setEditingLicense(license);
    setShowForm(true);
  };

  const handleDeleteLicense = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta licencia?')) {
      try {
        await supabaseService.deleteLicense(id, user.id);
        setLicenses(licenses.filter(l => l.id !== id));
      } catch (error) {
        console.error('Error deleting license:', error);
        alert('Error al eliminar la licencia');
      }
    }
  };

  const handleFormSubmit = async (licenseData) => {
    try {
      if (editingLicense) {
        // Actualizar licencia existente
        const updatedLicense = await supabaseService.updateLicense(editingLicense.id, licenseData, user.id);
        setLicenses(licenses.map(l => 
          l.id === editingLicense.id ? updatedLicense : l
        ));
      } else {
        // Agregar nueva licencia
        const newLicense = await supabaseService.createLicense(licenseData, user.id);
        setLicenses([...licenses, newLicense]);
      }
      setShowForm(false);
      setEditingLicense(null);
    } catch (error) {
      console.error('Error saving license:', error);
      alert('Error al guardar la licencia');
    }
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

  const getDaysUntilExpiration = (expiry_date) => {
    if (!expiry_date) return null;

    const today = new Date();
    const expDate = new Date(expiry_date);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getLicenseStatus = (license) => {
    const daysUntilExpiration = getDaysUntilExpiration(license.expiry_date);
    
    if (daysUntilExpiration === null) return 'unknown';
    if (daysUntilExpiration < 0) return 'expired';
    if (daysUntilExpiration <= 30) return 'expiring';
    return 'active';
  };

  const getStatusBadge = (license) => {
    const status = getLicenseStatus(license);
    const daysUntilExpiration = getDaysUntilExpiration(license.expiry_date);
    
    switch (status) {
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 transition-colors duration-200">
            ❌ Vencida
          </span>
        );
      case 'expiring':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 transition-colors duration-200">
            ⚠️ Vence en {daysUntilExpiration} días
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 transition-colors duration-200">
            ✅ Activa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 transition-colors duration-200">
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
        case 'expiry_date':
          aValue = new Date(a.expiry_date || '9999-12-31');
          bValue = new Date(b.expiry_date || '9999-12-31');
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Gestión de Licencias</h1>
          <p className="text-gray-700 dark:text-gray-300 mt-1 transition-colors duration-200">
            Total: {stats.total} licencia{stats.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleAddLicense}
          className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
        >
          + Nueva Licencia
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center transition-colors duration-200">
                <span className="text-green-600 dark:text-green-400 font-semibold transition-colors duration-200">✅</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-200">Activas</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white transition-colors duration-200">{stats.active}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center transition-colors duration-200">
                <span className="text-yellow-600 dark:text-yellow-400 font-semibold transition-colors duration-200">⚠️</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-200">Por Vencer</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white transition-colors duration-200">{stats.expiring}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center transition-colors duration-200">
                <span className="text-red-600 dark:text-red-400 font-semibold transition-colors duration-200">❌</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-200">Vencidas</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white transition-colors duration-200">{stats.expired}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center transition-colors duration-200">
                <span className="text-blue-600 dark:text-blue-400 font-semibold transition-colors duration-200">💰</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-200">Ganancia Total</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200">{formatCurrency(stats.totalProfit)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por cliente, licencia, código o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 transition-colors duration-200">
              🔍
            </div>
          </div>
          
          {/* Filtro por estado */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
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
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            >
              <option value="expiry_date">📅 Fecha vencimiento</option>
              <option value="client">🏢 Cliente</option>
              <option value="licenseName">📋 Licencia</option>
              <option value="profit">💰 Ganancia</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-200"
              title={`Ordenar ${sortOrder === 'asc' ? 'descendente' : 'ascendente'}`}
            >
              {sortOrder === 'asc' ? '⬆️' : '⬇️'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de licencias */}
      {filteredAndSortedLicenses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center transition-colors duration-200">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4 transition-colors duration-200">📄</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-200">
            {licenses.length === 0 ? 'No hay licencias registradas' : 'No se encontraron resultados'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-200">
            {licenses.length === 0 
              ? 'Comienza registrando tu primera licencia de software'
              : 'Intenta con otros términos de búsqueda o filtros'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Cliente / Licencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Código / Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Estado / Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Instalaciones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Financiero
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">
                {filteredAndSortedLicenses.map((license) => {
                  const daysUntilExpiration = getDaysUntilExpiration(license.expiry_date);
                  
                  return (
                    <tr key={license.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
                            🏢 {license.client}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">
                            📋 {license.licenseName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white font-mono flex items-center transition-colors duration-200">
                            🔑 {license.code}
                            <button
                              onClick={() => copyToClipboard(license.code, 'Código')}
                              className="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                              title="Copiar código"
                            >
                              📋
                            </button>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">
                            🏭 {license.provider}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {getStatusBadge(license)}
                          <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">
                            📅 {new Date(license.expiry_date).toLocaleDateString('es-CO')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white transition-colors duration-200">
                        💻 {license.numberOfInstallations}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-gray-900 dark:text-white transition-colors duration-200">
                            💰 {formatCurrency(license.saleValue)}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 transition-colors duration-200">
                            💸 {formatCurrency(license.costValue)}
                          </div>
                          <div className={`font-medium transition-colors duration-200 ${
                            license.profit > 0 ? 'text-green-600 dark:text-green-400' : 
                            license.profit < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            📈 {formatCurrency(license.profit)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditLicense(license)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3 transition-colors duration-200"
                          title="Editar"
                          aria-label="Editar licencia"
                        >
                          <span aria-hidden="true">✏️</span>
                        </button>
                        <button
                          onClick={() => handleDeleteLicense(license.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors duration-200"
                          title="Eliminar"
                          aria-label="Eliminar licencia"
                        >
                          <span aria-hidden="true">🗑️</span>
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