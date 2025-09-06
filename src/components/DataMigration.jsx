import React, { useState } from 'react';
import { supabaseService } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import Button from './ui/Button';

const DataMigration = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  const migrateData = async () => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setIsLoading(true);
    setError('');
    setMigrationStatus('Iniciando migración...');

    try {
      // Obtener datos locales
      const localData = {
        orders: JSON.parse(localStorage.getItem('orders') || '[]'),
        casualExpenses: JSON.parse(localStorage.getItem('casualExpenses') || '[]'),
        budgetExpenses: JSON.parse(localStorage.getItem('budgetExpenses') || '[]'),
        licenses: JSON.parse(localStorage.getItem('licenses') || '[]'),
        passwords: JSON.parse(localStorage.getItem('passwords') || '[]'),
        serverCredentials: JSON.parse(localStorage.getItem('serverCredentials') || '[]')
      };

      let migratedCount = 0;
      let totalItems = Object.values(localData).reduce((sum, arr) => sum + arr.length, 0);

      if (totalItems === 0) {
        setMigrationStatus('No hay datos locales para migrar.');
        setTimeout(() => onClose(), 2000);
        return;
      }

      // Migrar órdenes de servicio
      if (localData.orders.length > 0) {
        setMigrationStatus(`Migrando ${localData.orders.length} órdenes de servicio...`);
        for (const order of localData.orders) {
          try {
            // Normalizar datos: manejar el campo 'cliente' heredado
            const orderToMigrate = {
              ...order,
              customer_name: order.customer_name || order.cliente || 'Cliente no especificado',
            };
            await supabaseService.createServiceOrder(orderToMigrate, user.id);
            migratedCount++;
          } catch (err) {
            console.error('Error migrando orden:', order, err);
          }
        }
      }

      // Migrar gastos casuales
      if (localData.casualExpenses.length > 0) {
        setMigrationStatus(`Migrando ${localData.casualExpenses.length} gastos casuales...`);
        for (const expense of localData.casualExpenses) {
          try {
            // Normalizar datos: mapear 'notes' a 'detail' y seleccionar campos válidos
            const expenseToMigrate = {
              description: expense.description,
              amount: expense.amount,
              date: expense.date,
              category: expense.category,
              detail: expense.detail || expense.notes || ''
            };
            await supabaseService.createCasualExpense(expenseToMigrate, user.id);
            migratedCount++;
          } catch (err) {
            console.error('Error migrando gasto casual:', expense, err);
          }
        }
      }

      // Migrar gastos de presupuesto
      if (localData.budgetExpenses.length > 0) {
        setMigrationStatus(`Migrando ${localData.budgetExpenses.length} gastos de presupuesto...`);
        for (const expense of localData.budgetExpenses) {
          try {
            // Normalizar datos: mapear 'notes' a 'detail' y seleccionar campos válidos
            const expenseToMigrate = {
              description: expense.description,
              amount: expense.amount,
              date: expense.date,
              category: expense.category,
              detail: expense.detail || expense.notes || ''
            };
            await supabaseService.createBudgetExpense(expenseToMigrate, user.id);
            migratedCount++;
          } catch (err) {
            console.error('Error migrando gasto de presupuesto:', expense, err);
          }
        }
      }

      // Migrar licencias
      if (localData.licenses.length > 0) {
        setMigrationStatus(`Migrando ${localData.licenses.length} licencias...`);
        for (const license of localData.licenses) {
          try {
            // Normalizar datos: seleccionar solo los campos que existen en la tabla
            const licenseToMigrate = {
              nombre: license.nombre,
              clave: license.clave
            };
            await supabaseService.createLicense(licenseToMigrate, user.id);
            migratedCount++;
          } catch (err) {
            console.error('Error migrando licencia:', license, err);
          }
        }
      }

      // Migrar contraseñas
      if (localData.passwords.length > 0) {
        setMigrationStatus(`Migrando ${localData.passwords.length} contraseñas...`);
        for (const password of localData.passwords) {
          try {
            // Normalizar datos: seleccionar solo los campos válidos
            const passwordToMigrate = {
              servicio: password.servicio,
              usuario: password.usuario,
              clave: password.clave
            };
            await supabaseService.createPassword(passwordToMigrate, user.id);
            migratedCount++;
          } catch (err) {
            console.error('Error migrando contraseña:', password, err);
          }
        }
      }

      // Migrar credenciales de servidor
      if (localData.serverCredentials.length > 0) {
        setMigrationStatus(`Migrando ${localData.serverCredentials.length} credenciales de servidor...`);
        for (const credential of localData.serverCredentials) {
          try {
            // Normalizar datos: seleccionar solo los campos válidos
            const credentialToMigrate = {
              nombre: credential.nombre,
              ip: credential.ip,
              usuario: credential.usuario,
              clave: credential.clave
            };
            await supabaseService.createServerCredential(credentialToMigrate, user.id);
            migratedCount++;
          } catch (err)
 {
            console.error('Error migrando credencial de servidor:', credential, err);
          }
        }
      }

      setMigrationStatus(`Migración completada: ${migratedCount}/${totalItems} elementos migrados exitosamente.`);
      
      // Limpiar datos locales después de la migración exitosa
      if (migratedCount > 0) {
        localStorage.removeItem('orders');
        localStorage.removeItem('casualExpenses');
        localStorage.removeItem('budgetExpenses');
        localStorage.removeItem('licenses');
        localStorage.removeItem('passwords');
        localStorage.removeItem('serverCredentials');
      }

      setTimeout(() => {
        onClose();
        window.location.reload(); // Recargar para mostrar los datos migrados
      }, 3000);

    } catch (err) {
      setError(`Error durante la migración: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const skipMigration = () => {
    // Marcar que se saltó la migración para este usuario
    if (user) {
      localStorage.setItem(`migration_shown_${user.id}`, 'true');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Migración de Datos
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Se han detectado datos locales en tu navegador. ¿Deseas migrarlos a tu cuenta en la nube?
          </p>
        </div>

        {migrationStatus && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200">{migrationStatus}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            onClick={skipMigration}
            variant="ghost"
            size="md"
            disabled={isLoading}
          >
            Saltar
          </Button>
          <Button
            onClick={migrateData}
            variant="primary"
            size="md"
            disabled={isLoading}
          >
            {isLoading ? 'Migrando...' : 'Migrar Datos'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataMigration;