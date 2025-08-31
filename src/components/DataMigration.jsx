import React from 'react';
import { useDataMigration } from '../hooks/useDataMigration';

const DataMigration = ({ onClose }) => {
  const { migrationStatus, migrateAllData, resetMigrationStatus } = useDataMigration();

  const handleStartMigration = () => {
    if (window.confirm(
      '¿Estás seguro de que deseas migrar tus datos locales a Supabase? '
      + 'Este proceso transferirá todas tus órdenes, gastos, licencias, contraseñas y credenciales '
      + 'a la base de datos en la nube.'
    )) {
      migrateAllData();
    }
  };

  const handleClose = () => {
    if (!migrationStatus.isLoading) {
      resetMigrationStatus();
      onClose();
    }
  };

  // Verificar si hay datos locales para migrar
  const hasLocalData = () => {
    const localData = {
      orders: JSON.parse(localStorage.getItem('orders') || '[]'),
      casualExpenses: JSON.parse(localStorage.getItem('casualExpenses') || '[]'),
      budgetExpenses: JSON.parse(localStorage.getItem('budgetExpenses') || '[]'),
      licenses: JSON.parse(localStorage.getItem('licenses') || '[]'),
      passwords: JSON.parse(localStorage.getItem('passwords') || '[]'),
      serverCredentials: JSON.parse(localStorage.getItem('serverCredentials') || '[]')
    };
    
    return Object.values(localData).some(arr => arr.length > 0);
  };

  const getDataSummary = () => {
    const localData = {
      orders: JSON.parse(localStorage.getItem('orders') || '[]'),
      casualExpenses: JSON.parse(localStorage.getItem('casualExpenses') || '[]'),
      budgetExpenses: JSON.parse(localStorage.getItem('budgetExpenses') || '[]'),
      licenses: JSON.parse(localStorage.getItem('licenses') || '[]'),
      passwords: JSON.parse(localStorage.getItem('passwords') || '[]'),
      serverCredentials: JSON.parse(localStorage.getItem('serverCredentials') || '[]')
    };

    return [
      { name: 'Órdenes de Servicio', count: localData.orders.length },
      { name: 'Gastos Casuales', count: localData.casualExpenses.length },
      { name: 'Gastos Presupuestarios', count: localData.budgetExpenses.length },
      { name: 'Licencias', count: localData.licenses.length },
      { name: 'Contraseñas', count: localData.passwords.length },
      { name: 'Credenciales de Servidor', count: localData.serverCredentials.length }
    ].filter(item => item.count > 0);
  };

  if (!hasLocalData()) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 transition-colors duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Migración de Datos</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
            >
              ✕
            </button>
          </div>
          
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No hay datos para migrar
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No se encontraron datos locales en tu navegador. 
              Puedes comenzar a usar la aplicación directamente.
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-200"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Migración de Datos</h2>
          {!migrationStatus.isLoading && (
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
            >
              ✕
            </button>
          )}
        </div>

        {!migrationStatus.isLoading && !migrationStatus.completed && (
          <>
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Se encontraron datos locales en tu navegador. ¿Deseas migrarlos a la nube?
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4 transition-colors duration-200">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Datos encontrados:</h3>
                <ul className="space-y-1">
                  {getDataSummary().map((item, index) => (
                    <li key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{item.name}:</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{item.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4 transition-colors duration-200">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>💡 Recomendación:</strong> Migra tus datos para acceder a ellos desde cualquier dispositivo y mantenerlos seguros en la nube.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Más tarde
              </button>
              <button
                onClick={handleStartMigration}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-200"
              >
                Migrar Datos
              </button>
            </div>
          </>
        )}

        {migrationStatus.isLoading && (
          <div className="text-center py-6">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Migrando datos...
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{migrationStatus.currentStep}</p>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4 transition-colors duration-200">
              <div 
                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${migrationStatus.progress}%` }}
              ></div>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {migrationStatus.progress}% completado
            </p>
          </div>
        )}

        {migrationStatus.completed && (
          <div className="text-center py-6">
            {migrationStatus.errors.length === 0 ? (
              <>
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
                  ¡Migración Completada!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Todos tus datos han sido transferidos exitosamente a la nube.
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
                  Migración Completada con Errores
                </h3>
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4 transition-colors duration-200">
                  <ul className="text-sm text-red-800 dark:text-red-300 text-left">
                    {migrationStatus.errors.map((error, index) => (
                      <li key={index} className="mb-1">• {error}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-200"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataMigration;