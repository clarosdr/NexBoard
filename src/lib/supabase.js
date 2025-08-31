import { createClient } from '@supabase/supabase-js'

// Estas variables se configurarán más adelante con las credenciales reales
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your-supabase-url'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cache simple para optimizar consultas
class SimpleCache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutos por defecto
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }
}

const cache = new SimpleCache();

// Funciones helper para manejo de datos
export const supabaseHelpers = {
  // Órdenes de servicio
  async getServiceOrders(userId) {
    const cacheKey = `service_orders_${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('service_orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Map database fields back to application fields
    const orders = (data || []).map(order => ({
      id: order.id,
      customerName: order.customer_name,
      description: order.description,
      date: order.date,
      status: order.status,
      items: order.items,
      payments: order.payments,
      totalPaid: order.total_paid,
      total: order.total,
      totalPartCost: order.total_part_cost,
      profit: order.profit,
      pendingBalance: order.pending_balance,
      createdAt: order.created_at,
      updatedAt: order.updated_at
    }));

    cache.set(cacheKey, orders);
    return orders;
  },

  async createServiceOrder(order, userId) {
    // Map form fields to database fields
    const dbOrder = {
      id: order.id,
      user_id: userId,
      customer_name: order.customerName,
      description: order.description,
      date: order.date,
      status: order.status,
      items: order.items,
      payments: order.payments,
      total_paid: order.totalPaid,
      total: order.total,
      total_part_cost: order.totalPartCost,
      profit: order.profit,
      pending_balance: order.pendingBalance,
      created_at: order.createdAt
    };
    
    const { data, error } = await supabase
      .from('service_orders')
      .insert([dbOrder])
      .select()
    
    if (error) throw error
    
    // Invalidar cache
    cache.delete(`service_orders_${userId}`);
    
    // Map database fields back to application fields
    const createdOrder = data[0]
    return {
      id: createdOrder.id,
      customerName: createdOrder.customer_name,
      description: createdOrder.description,
      date: createdOrder.date,
      status: createdOrder.status,
      items: createdOrder.items,
      payments: createdOrder.payments,
      totalPaid: createdOrder.total_paid,
      total: createdOrder.total,
      totalPartCost: createdOrder.total_part_cost,
      profit: createdOrder.profit,
      pendingBalance: createdOrder.pending_balance,
      createdAt: createdOrder.created_at,
      updatedAt: createdOrder.updated_at
    }
  },

  async updateServiceOrder(id, order, userId) {
    // Map form fields to database fields
    const dbOrder = {
      customer_name: order.customerName,
      description: order.description,
      date: order.date,
      status: order.status,
      items: order.items,
      payments: order.payments,
      total_paid: order.totalPaid,
      total: order.total,
      total_part_cost: order.totalPartCost,
      profit: order.profit,
      pending_balance: order.pendingBalance
    };
    
    const { data, error } = await supabase
      .from('service_orders')
      .update(dbOrder)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
    
    if (error) throw error
    
    // Invalidar cache
    cache.delete(`service_orders_${userId}`);
    
    // Map database fields back to application fields
    const updatedOrder = data[0]
    return {
      id: updatedOrder.id,
      customerName: updatedOrder.customer_name,
      description: updatedOrder.description,
      date: updatedOrder.date,
      status: updatedOrder.status,
      items: updatedOrder.items,
      payments: updatedOrder.payments,
      totalPaid: updatedOrder.total_paid,
      total: updatedOrder.total,
      totalPartCost: updatedOrder.total_part_cost,
      profit: updatedOrder.profit,
      pendingBalance: updatedOrder.pending_balance,
      createdAt: updatedOrder.created_at,
      updatedAt: updatedOrder.updated_at
    }
  },

  async deleteServiceOrder(id, userId) {
    const { error } = await supabase
      .from('service_orders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
    
    // Invalidar cache
    cache.delete(`service_orders_${userId}`);
  },

  // Gastos casuales
  async getCasualExpenses(userId) {
    const cacheKey = `casual_expenses_${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('casual_expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    
    if (error) throw error
    
    const expenses = data || [];
    cache.set(cacheKey, expenses);
    return expenses;
  },

  async createCasualExpense(expense, userId) {
    const { data, error } = await supabase
      .from('casual_expenses')
      .insert([{ ...expense, user_id: userId }])
      .select()
    
    if (error) throw error
    
    // Invalidar cache
    cache.delete(`casual_expenses_${userId}`);
    
    return data[0]
  },

  async updateCasualExpense(id, expense, userId) {
    const { data, error } = await supabase
      .from('casual_expenses')
      .update(expense)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
    
    if (error) throw error
    
    // Invalidar cache
    cache.delete(`casual_expenses_${userId}`);
    
    return data[0]
  },

  async deleteCasualExpense(id, userId) {
    const { error } = await supabase
      .from('casual_expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
    
    // Invalidar cache
    cache.delete(`casual_expenses_${userId}`);
  },

  // Gastos presupuestarios
  async getBudgetExpenses(userId) {
    const cacheKey = `budget_expenses_${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('budget_expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    
    if (error) throw error
    
    const expenses = data || [];
    cache.set(cacheKey, expenses);
    return expenses;
  },

  async createBudgetExpense(expense, userId) {
    const { data, error } = await supabase
      .from('budget_expenses')
      .insert([{ ...expense, user_id: userId }])
      .select()
    
    if (error) throw error
    
    // Invalidar cache
    cache.delete(`budget_expenses_${userId}`);
    
    return data[0]
  },

  async updateBudgetExpense(id, expense, userId) {
    const { data, error } = await supabase
      .from('budget_expenses')
      .update(expense)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
    
    if (error) throw error
    
    // Invalidar cache
    cache.delete(`budget_expenses_${userId}`);
    
    return data[0]
  },

  async deleteBudgetExpense(id, userId) {
    const { error } = await supabase
      .from('budget_expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
    
    // Invalidar cache
    cache.delete(`budget_expenses_${userId}`);
  },

  // Licencias
  async getLicenses(userId) {
    const cacheKey = `licenses_${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    const licenses = data || [];
    cache.set(cacheKey, licenses);
    return licenses;
  },

  async createLicense(license, userId) {
    const { data, error } = await supabase
      .from('licenses')
      .insert([{ ...license, user_id: userId }])
      .select()
    
    if (error) throw error
    
    // Invalidar cache
    cache.delete(`licenses_${userId}`);
    
    return data[0]
  },

  async updateLicense(id, license, userId) {
    const { data, error } = await supabase
      .from('licenses')
      .update(license)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
    
    if (error) throw error
    
    // Invalidar cache
    cache.delete(`licenses_${userId}`);
    
    return data[0]
  },

  async deleteLicense(id, userId) {
    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
    
    // Invalidar cache
    cache.delete(`licenses_${userId}`);
  },

  // Contraseñas
  async getPasswords(userId) {
    const cacheKey = `passwords_${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('passwords')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    const passwords = data || [];
    cache.set(cacheKey, passwords);
    return passwords;
  },

  async createPassword(password, userId) {
    const { data, error } = await supabase
      .from('passwords')
      .insert([{ ...password, user_id: userId }])
      .select()
    
    if (error) throw error
    
    // Invalidar cache
    cache.delete(`passwords_${userId}`);
    
    return data[0]
  },

  async updatePassword(id, password, userId) {
    const { data, error } = await supabase
      .from('passwords')
      .update(password)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
    
    if (error) throw error
    
    // Invalidar cache
    cache.delete(`passwords_${userId}`);
    
    return data[0]
  },

  async deletePassword(id, userId) {
    const { error } = await supabase
      .from('passwords')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
    
    // Invalidar cache
    cache.delete(`passwords_${userId}`);
  },

  // Credenciales de servidor
  async getServerCredentials(userId) {
    const cacheKey = `server_credentials_${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('server_credentials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    const credentials = data || [];
    cache.set(cacheKey, credentials);
    return credentials;
  },

  async createServerCredential(credential, userId) {
    const { data, error } = await supabase
      .from('server_credentials')
      .insert([{ ...credential, user_id: userId }])
      .select()
    
    if (error) throw error
    
    // Invalidar cache
    cache.delete(`server_credentials_${userId}`);
    
    return data[0]
  },

  async updateServerCredential(id, credential, userId) {
    const { data, error } = await supabase
      .from('server_credentials')
      .update(credential)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
    
    if (error) throw error
    
    // Invalidar cache
    cache.delete(`server_credentials_${userId}`);
    
    return data[0]
  },

  async deleteServerCredential(id, userId) {
    const { error } = await supabase
      .from('server_credentials')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
    
    // Invalidar cache
    cache.delete(`server_credentials_${userId}`);
  },

  // Función para limpiar todo el cache
  clearCache() {
    cache.clear();
  },

  // Función para limpiar cache específico de un usuario
  clearUserCache(userId) {
    const keys = [
      `service_orders_${userId}`,
      `casual_expenses_${userId}`,
      `budget_expenses_${userId}`,
      `licenses_${userId}`,
      `passwords_${userId}`,
      `server_credentials_${userId}`
    ];
    
    keys.forEach(key => cache.delete(key));
  }
}

// Exportar el servicio principal
export const supabaseService = supabaseHelpers