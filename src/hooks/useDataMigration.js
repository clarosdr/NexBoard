import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useDataMigration = () => {
  const [migrationStatus, setMigrationStatus] = useState({
    isLoading: false,
    progress: 0,
    currentStep: '',
    errors: [],
    completed: false
  });
  
  const { user } = useAuth();

  const updateStatus = useCallback((updates) => {
    setMigrationStatus(prev => ({ ...prev, ...updates }));
  }, []);

  const migrateServiceOrders = async (orders) => {
    if (!orders || orders.length === 0) return { success: true, count: 0 };
    
    try {
      const ordersToMigrate = orders.map(order => ({
        user_id: user.id,
        order_number: order.orderNumber || `ORD-${Date.now()}`,
        client_name: order.clientName || '',
        client_phone: order.clientPhone || '',
        client_email: order.clientEmail || '',
        device_type: order.deviceType || '',
        device_brand: order.deviceBrand || '',
        device_model: order.deviceModel || '',
        device_serial: order.deviceSerial || '',
        problem_description: order.problemDescription || '',
        diagnosis: order.diagnosis || '',
        solution: order.solution || '',
        items: order.items || [],
        payments: order.payments || [],
        total_cost: parseFloat(order.totalCost) || 0,
        total_paid: parseFloat(order.totalPaid) || 0,
        pending_balance: parseFloat(order.pendingBalance) || 0,
        profit: parseFloat(order.profit) || 0,
        status: order.status || 'pendiente',
        priority: order.priority || 'media',
        estimated_delivery: order.estimatedDelivery || null,
        actual_delivery: order.actualDelivery || null,
        notes: order.notes || '',
        created_at: order.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('service_orders')
        .insert(ordersToMigrate);

      if (error) throw error;
      return { success: true, count: ordersToMigrate.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const migrateCasualExpenses = async (expenses) => {
    if (!expenses || expenses.length === 0) return { success: true, count: 0 };
    
    try {
      const expensesToMigrate = expenses.map(expense => ({
        user_id: user.id,
        description: expense.description || '',
        amount: parseFloat(expense.amount) || 0,
        category: expense.category || '',
        date: expense.date || new Date().toISOString().split('T')[0],
        notes: expense.notes || '',
        created_at: expense.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('casual_expenses')
        .insert(expensesToMigrate);

      if (error) throw error;
      return { success: true, count: expensesToMigrate.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const migrateBudgetExpenses = async (expenses) => {
    if (!expenses || expenses.length === 0) return { success: true, count: 0 };
    
    try {
      const expensesToMigrate = expenses.map(expense => ({
        user_id: user.id,
        description: expense.description || '',
        amount: parseFloat(expense.amount) || 0,
        category: expense.category || '',
        date: expense.date || new Date().toISOString().split('T')[0],
        notes: expense.notes || '',
        created_at: expense.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('budget_expenses')
        .insert(expensesToMigrate);

      if (error) throw error;
      return { success: true, count: expensesToMigrate.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const migrateLicenses = async (licenses) => {
    if (!licenses || licenses.length === 0) return { success: true, count: 0 };
    
    try {
      const licensesToMigrate = licenses.map(license => ({
        user_id: user.id,
        software_name: license.softwareName || '',
        license_key: license.licenseKey || '',
        purchase_date: license.purchaseDate || null,
        expiry_date: license.expiryDate || null,
        vendor: license.vendor || '',
        cost: parseFloat(license.cost) || 0,
        max_installations: parseInt(license.maxInstallations) || 1,
        current_installations: parseInt(license.currentInstallations) || 0,
        notes: license.notes || '',
        created_at: license.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('licenses')
        .insert(licensesToMigrate);

      if (error) throw error;
      return { success: true, count: licensesToMigrate.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const migratePasswords = async (passwords) => {
    if (!passwords || passwords.length === 0) return { success: true, count: 0 };
    
    try {
      const passwordsToMigrate = passwords.map(password => ({
        user_id: user.id,
        service_name: password.serviceName || '',
        username: password.username || '',
        email: password.email || '',
        password_encrypted: password.password || '', // TODO: Implementar encriptación
        url: password.url || '',
        notes: password.notes || '',
        category: password.category || '',
        created_at: password.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('passwords')
        .insert(passwordsToMigrate);

      if (error) throw error;
      return { success: true, count: passwordsToMigrate.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const migrateServerCredentials = async (credentials) => {
    if (!credentials || credentials.length === 0) return { success: true, count: 0 };
    
    try {
      const credentialsToMigrate = credentials.map(credential => ({
        user_id: user.id,
        server_name: credential.serverName || '',
        ip_address: credential.ipAddress || '',
        hostname: credential.hostname || '',
        username: credential.username || '',
        password_encrypted: credential.password || '', // TODO: Implementar encriptación
        ssh_key: credential.sshKey || '',
        port: parseInt(credential.port) || 22,
        protocol: credential.protocol || 'SSH',
        description: credential.description || '',
        notes: credential.notes || '',
        created_at: credential.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('server_credentials')
        .insert(credentialsToMigrate);

      if (error) throw error;
      return { success: true, count: credentialsToMigrate.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const migrateAllData = async () => {
    if (!user) {
      updateStatus({ errors: ['Usuario no autenticado'] });
      return;
    }

    updateStatus({ 
      isLoading: true, 
      progress: 0, 
      currentStep: 'Iniciando migración...', 
      errors: [],
      completed: false 
    });

    try {
      // Obtener datos de localStorage
      const localData = {
        orders: JSON.parse(localStorage.getItem('orders') || '[]'),
        casualExpenses: JSON.parse(localStorage.getItem('casualExpenses') || '[]'),
        budgetExpenses: JSON.parse(localStorage.getItem('budgetExpenses') || '[]'),
        licenses: JSON.parse(localStorage.getItem('licenses') || '[]'),
        passwords: JSON.parse(localStorage.getItem('passwords') || '[]'),
        serverCredentials: JSON.parse(localStorage.getItem('serverCredentials') || '[]')
      };

      const totalItems = Object.values(localData).reduce((sum, arr) => sum + arr.length, 0);
      
      if (totalItems === 0) {
        updateStatus({ 
          isLoading: false, 
          progress: 100, 
          currentStep: 'No hay datos para migrar', 
          completed: true 
        });
        return;
      }

      let completedItems = 0;
      const results = {};

      // Migrar órdenes de servicio
      updateStatus({ currentStep: 'Migrando órdenes de servicio...', progress: 10 });
      results.orders = await migrateServiceOrders(localData.orders);
      completedItems += localData.orders.length;
      updateStatus({ progress: Math.round((completedItems / totalItems) * 80) + 10 });

      // Migrar gastos casuales
      updateStatus({ currentStep: 'Migrando gastos casuales...', progress: 25 });
      results.casualExpenses = await migrateCasualExpenses(localData.casualExpenses);
      completedItems += localData.casualExpenses.length;
      updateStatus({ progress: Math.round((completedItems / totalItems) * 80) + 10 });

      // Migrar gastos presupuestarios
      updateStatus({ currentStep: 'Migrando gastos presupuestarios...', progress: 40 });
      results.budgetExpenses = await migrateBudgetExpenses(localData.budgetExpenses);
      completedItems += localData.budgetExpenses.length;
      updateStatus({ progress: Math.round((completedItems / totalItems) * 80) + 10 });

      // Migrar licencias
      updateStatus({ currentStep: 'Migrando licencias...', progress: 55 });
      results.licenses = await migrateLicenses(localData.licenses);
      completedItems += localData.licenses.length;
      updateStatus({ progress: Math.round((completedItems / totalItems) * 80) + 10 });

      // Migrar contraseñas
      updateStatus({ currentStep: 'Migrando contraseñas...', progress: 70 });
      results.passwords = await migratePasswords(localData.passwords);
      completedItems += localData.passwords.length;
      updateStatus({ progress: Math.round((completedItems / totalItems) * 80) + 10 });

      // Migrar credenciales de servidor
      updateStatus({ currentStep: 'Migrando credenciales de servidor...', progress: 85 });
      results.serverCredentials = await migrateServerCredentials(localData.serverCredentials);
      completedItems += localData.serverCredentials.length;
      updateStatus({ progress: 95 });

      // Verificar errores
      const errors = [];
      Object.entries(results).forEach(([key, result]) => {
        if (!result.success) {
          errors.push(`Error en ${key}: ${result.error}`);
        }
      });

      updateStatus({ 
        isLoading: false,
        progress: 100,
        currentStep: errors.length > 0 ? 'Migración completada con errores' : 'Migración completada exitosamente',
        errors,
        completed: true
      });

      // Si la migración fue exitosa, ofrecer limpiar localStorage
      if (errors.length === 0) {
        const shouldClear = window.confirm(
          '¡Migración completada exitosamente! ¿Deseas limpiar los datos locales? (Recomendado)'
        );
        if (shouldClear) {
          localStorage.removeItem('orders');
          localStorage.removeItem('casualExpenses');
          localStorage.removeItem('budgetExpenses');
          localStorage.removeItem('licenses');
          localStorage.removeItem('passwords');
          localStorage.removeItem('serverCredentials');
        }
      }

    } catch (error) {
      updateStatus({ 
        isLoading: false,
        progress: 0,
        currentStep: 'Error en la migración',
        errors: [error.message],
        completed: false
      });
    }
  };

  const resetMigrationStatus = useCallback(() => {
    setMigrationStatus({
      isLoading: false,
      progress: 0,
      currentStep: '',
      errors: [],
      completed: false
    });
  }, []);

  return {
    migrationStatus,
    migrateAllData,
    resetMigrationStatus
  };
};