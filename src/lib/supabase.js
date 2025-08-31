import { createClient } from '@supabase/supabase-js'

// Estas variables se configurarán más adelante con las credenciales reales
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your-supabase-url'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Funciones helper para manejo de datos
export const supabaseHelpers = {
  // Órdenes de servicio
  async getServiceOrders(userId) {
    const { data, error } = await supabase
      .from('service_orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return data || []
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
    return data[0]
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
    return data[0]
  },

  async deleteServiceOrder(id, userId) {
    const { error } = await supabase
      .from('service_orders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  // Gastos casuales
  async getCasualExpenses(userId) {
    const { data, error } = await supabase
      .from('casual_expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async createCasualExpense(expense, userId) {
    const { data, error } = await supabase
      .from('casual_expenses')
      .insert([{ ...expense, user_id: userId }])
      .select()
    
    if (error) throw error
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
    return data[0]
  },

  async deleteCasualExpense(id, userId) {
    const { error } = await supabase
      .from('casual_expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  // Gastos presupuestarios
  async getBudgetExpenses(userId) {
    const { data, error } = await supabase
      .from('budget_expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async createBudgetExpense(expense, userId) {
    const { data, error } = await supabase
      .from('budget_expenses')
      .insert([{ ...expense, user_id: userId }])
      .select()
    
    if (error) throw error
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
    return data[0]
  },

  async deleteBudgetExpense(id, userId) {
    const { error } = await supabase
      .from('budget_expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  // Licencias
  async getLicenses(userId) {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async createLicense(license, userId) {
    const { data, error } = await supabase
      .from('licenses')
      .insert([{ ...license, user_id: userId }])
      .select()
    
    if (error) throw error
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
    return data[0]
  },

  async deleteLicense(id, userId) {
    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  // Contraseñas
  async getPasswords(userId) {
    const { data, error } = await supabase
      .from('passwords')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async createPassword(password, userId) {
    const { data, error } = await supabase
      .from('passwords')
      .insert([{ ...password, user_id: userId }])
      .select()
    
    if (error) throw error
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
    return data[0]
  },

  async deletePassword(id, userId) {
    const { error } = await supabase
      .from('passwords')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  // Credenciales de servidor
  async getServerCredentials(userId) {
    const { data, error } = await supabase
      .from('server_credentials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async createServerCredential(credential, userId) {
    const { data, error } = await supabase
      .from('server_credentials')
      .insert([{ ...credential, user_id: userId }])
      .select()
    
    if (error) throw error
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
    return data[0]
  },

  async deleteServerCredential(id, userId) {
    const { error } = await supabase
      .from('server_credentials')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  }
}

// Exportar también como supabaseService para compatibilidad
export const supabaseService = supabaseHelpers